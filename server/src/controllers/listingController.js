import Joi from 'joi';
import mongoose from 'mongoose';
import { Listing, CATEGORIES, CONDITIONS, STATUSES } from '../models/Listing.js';

// `status` is deliberately absent from both schemas. A listing is always born
// 'active', and the only two ways it ever changes are DELETE (-> 'removed')
// and PATCH /:id/sold (-> 'sold'). Keeping it out of the generic PATCH means a
// client can't resurrect a removed listing or fake a sale through the edit route.
const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(140).required(),
  description: Joi.string().trim().max(2000).allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.any()
});

// Every field optional, but `.min(1)` rejects an empty body instead of letting
// it through as a no-op update that returns 200 and changes nothing.
const updateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(140),
  description: Joi.string().trim().max(2000).allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.any()
}).min(1);

const listQuerySchema = Joi.object({
  includeRemoved: Joi.boolean().default(false),
  status: Joi.string().valid(...STATUSES),
  category: Joi.string().valid(...CATEGORIES)
});

// Only these two fields are ever exposed for the referenced user — populating
// the whole document would put the bcrypt password hash in the API response.
const SELLER_FIELDS = 'name email';

function publicSeller(seller) {
  if (!seller) return null;
  // Unpopulated the field is a bare ObjectId; populated it's the user object.
  if (seller instanceof mongoose.Types.ObjectId) return seller.toString();
  return { id: seller._id.toString(), name: seller.name, email: seller.email };
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

// Without this, findById('abc') throws a Mongoose CastError that the error
// handler in app.js turns into a 500 — a client mistake reported as a server bug.
function invalidId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const { value: query, error } = listQuerySchema.validate(req.query, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const filter = {};
    if (query.category) filter.category = query.category;
    if (query.status) {
      // An explicit ?status= is an explicit request, so it wins — that's the
      // only way to list *just* the removed ones.
      filter.status = query.status;
    } else if (!query.includeRemoved) {
      // The default: soft-deleted listings stay out of the list.
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter)
      .populate('seller', SELLER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ count: listings.length, listings: listings.map(publicListing) });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const listing = await Listing.findById(req.params.id).populate('seller', SELLER_FIELDS).lean();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Same rule as the list route: a removed listing is invisible unless asked for.
    if (listing.status === 'removed' && req.query.includeRemoved !== 'true') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    // The `status: { $ne: 'removed' }` clause is the guard: a removed listing
    // can't be edited, and it 404s exactly like a missing one, because from the
    // API's point of view that's what it is.
    // `runValidators` matters — Mongoose skips schema validation on updates by
    // default, so without it a negative price would be written straight to the DB.
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'removed' } },
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', SELLER_FIELDS);

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
// Separate from the generic PATCH on purpose: it takes no body, so price,
// category and the rest can't be quietly edited in the same request that
// marks the item sold.
export async function markAsSold(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status === 'removed') {
      return res.status(409).json({ message: 'Cannot sell a removed listing' });
    }

    listing.status = 'sold';
    await listing.save();
    await listing.populate('seller', SELLER_FIELDS);

    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// Soft delete: the document stays in MongoDB, only its status changes. A hard
// delete would break dispute resolution and orphan every buyer's record of what
// they bought — the row still has to exist, it just stops being listed.
export async function deleteListing(req, res, next) {
  try {
    if (invalidId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    // Idempotent: deleting an already-removed listing is a no-op that still succeeds.
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing removed', listing: publicListing(listing) });
  } catch (err) { next(err); }
}
