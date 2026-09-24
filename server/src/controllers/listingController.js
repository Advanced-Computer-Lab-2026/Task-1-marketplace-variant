import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// Full rules — used on create. A listing needs at least title + price to exist.
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24), // Mongo ObjectId as a 24-char hex string
});

// Same fields, nothing required — PATCH is a partial update.
// status is deliberately NOT in here: it only changes via delete/markAsSold below,
// so a normal edit can never accidentally un-remove a listing or fake a sale.
const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24),
});

// GET /api/listings
// Hides removed listings by default; ?includeRemoved=true opts in.
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';
    const filter = includeRemoved ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true } // runValidators: re-check enum/min rules on update too
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
// Soft delete: never removes the document, just flips status to 'removed'
// so it drops out of normal GETs but stays in the DB for audit/dispute purposes.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: 'Listing removed', listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/sold  (stretch goal)
// Its own narrow route/function — bypasses updateSchema entirely so price/category
// can't be changed in the same request that marks something sold.
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'sold' },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}
