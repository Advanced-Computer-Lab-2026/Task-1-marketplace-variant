import Joi from 'joi';
import { Listing } from '../models/Listing.js';
import { User } from '../models/User.js';

// Allowed values come straight from the model's enum settings,
// so the Joi rules and the Mongoose schema can never disagree.
const enumOf = (field) => Listing.schema.path(field).enumValues;

const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  description: Joi.string().trim().max(2000).allow('').default(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...enumOf('category')).default('other'),
  condition: Joi.string().valid(...enumOf('condition')).default('used'),
  status: Joi.string().valid(...enumOf('status')).default('active'),
  seller: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120),
  description: Joi.string().trim().max(2000).allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid(...enumOf('category')),
  condition: Joi.string().valid(...enumOf('condition')),
  status: Joi.string().valid(...enumOf('status')),
  seller: Joi.string().hex().length(24)
}).min(1);

const SELLER_FIELDS = 'name email';
const VISIBLE = { status: { $ne: 'removed' } };

function publicSeller(s) {
  if (!s) return null;
  if (s.name === undefined) return { id: s.toString() };
  return { id: s._id.toString(), name: s.name, email: s.email };
}
 
function publicListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    condition: l.condition,
    status: l.status,
    seller: publicSeller(l.seller),
    createdAt: l.createdAt,
    updatedAt: l.updatedAt
  };
}
const isValidId = (id) => /^[a-f\d]{24}$/i.test(id);

async function respondNoMatch(id, res) {
  const existing = await Listing.findById(id).select('status');
  if (!existing || existing.status === 'removed') {
    return res.status(404).json({ message: 'Listing not found' });
  }
  return res.status(409).json({ message: `Listing is ${existing.status} and can no longer be changed` });
}

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true' ? {} : VISIBLE;
    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', SELLER_FIELDS)
      .lean();
    res.json({ listings: listings.map(publicListing) });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });
 
    const filter = req.query.includeRemoved === 'true'
      ? { _id: req.params.id }
      : { _id: req.params.id, ...VISIBLE };
 
    const listing = await Listing.findOne(filter).populate('seller', SELLER_FIELDS);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
 
    if (value.seller) {
      const seller = await User.exists({ _id: value.seller });
      if (!seller) return res.status(400).json({ message: 'Seller does not exist' });
    }
 
    const listing = await Listing.create(value);
    await listing.populate('seller', SELLER_FIELDS);
    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
      if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });
 
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
 
    if (value.seller) {
      const seller = await User.exists({ _id: value.seller });
      if (!seller) return res.status(400).json({ message: 'Seller does not exist' });
    }
 
    // status: 'active' in the filter = check and write in one atomic step.
    const doc = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', SELLER_FIELDS);
    if (!doc) return respondNoMatch(req.params.id, res);
    res.json({ listing: publicListing(doc) });

  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });
 
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Listing not found' });
    res.json({ ok: true, listing: publicListing(doc) });
  } catch (err) { next(err); }
}

export async function markListingSold(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });
 
    const doc = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $set: { status: 'sold' } },
      { new: true }
    ).populate('seller', SELLER_FIELDS);
    if (!doc) return respondNoMatch(req.params.id, res);
    res.json({ listing: publicListing(doc) });
  } catch (err) { next(err); }
}