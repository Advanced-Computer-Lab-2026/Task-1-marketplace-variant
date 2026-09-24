import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------
const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow('').optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24).optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24),
});

// Helper to format listing response cleanly
function formatListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    condition: l.condition,
    status: l.status,
    seller: l.seller,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

// -----------------------------------------------------------------------------
// Controller Functions
// -----------------------------------------------------------------------------

// GET /api/listings (Excludes 'removed' by default, opt-in via ?includeRemoved=true)
export async function getAllListings(req, res, next) {
  try {
    const { includeRemoved } = req.query;
    const filter = includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings: listings.map(formatListing) });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: formatListing(listing) });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing: formatListing(listing) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status === 'sold' && Object.hasOwn(value, 'price') && value.price !== listing.price) {
      return res.status(400).json({ message: 'The price of a sold listing cannot be changed' });
    }

    Object.assign(listing, value);
    await listing.save();

    res.json({ listing: formatListing(listing) });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id (Soft delete: status -> 'removed')
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = 'removed';
    await listing.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/sold (Stretch Goal)
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = 'sold';
    await listing.save();

    res.json({ listing: formatListing(listing) });
  } catch (err) {
    next(err);
  }
}