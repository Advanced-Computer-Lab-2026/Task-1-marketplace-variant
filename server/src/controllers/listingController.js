import Joi from 'joi';
import { Listing } from '../models/Listing.js';

const createSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  seller: Joi.string().hex().length(24).optional().allow(null)
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24).optional().allow(null)
});

function publicListing(l) {
  const base = {
    id: l._id.toString(),
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    condition: l.condition,
    status: l.status,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt
  };
  if (l.seller && typeof l.seller === 'object') {
    base.seller = { id: l.seller._id?.toString?.() || l.seller._id, name: l.seller.name, email: l.seller.email };
  } else if (l.seller) {
    base.seller = l.seller.toString();
  } else {
    base.seller = null;
  }
  return base;
}

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';
    const filter = includeRemoved ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter).sort({ createdAt: -1 }).populate('seller', 'name email').lean();
    res.json({ listings: listings.map(publicListing) });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status === 'removed' && !includeRemoved) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    await listing.populate('seller', 'name email');
    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await Listing.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true }).populate('seller', 'name email');
    if (!doc) return res.status(404).json({ message: 'Listing not found' });
    if (doc.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: publicListing(doc) });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  (soft delete -> set status: 'removed')
export async function deleteListing(req, res, next) {
  try {
    const doc = await Listing.findByIdAndUpdate(req.params.id, { $set: { status: 'removed' } }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Listing not found' });
    res.json({ ok: true, listing: publicListing(doc) });
  } catch (err) { next(err); }
}

// POST /api/listings/:id/sold  (mark as sold)
export async function markSold(req, res, next) {
  try {
    const doc = await Listing.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Listing not found' });
    if (doc.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
    if (doc.status === 'sold') return res.status(400).json({ message: 'Listing already sold' });

    doc.status = 'sold';
    await doc.save();
    await doc.populate('seller', 'name email');
    res.json({ listing: publicListing(doc) });
  } catch (err) { next(err); }
}
