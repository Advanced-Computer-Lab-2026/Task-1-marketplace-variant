import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// ── Validation schemas ──────────────────────────────────────────────────

const createSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24), // ObjectId as 24-char hex string
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().max(2000).allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
}).min(1); // at least one field must be provided

// ── GET /api/listings ───────────────────────────────────────────────────
// By default, excludes removed listings. Pass ?includeRemoved=true to see them.
export async function getAllListings(req, res, next) {
  try {
    const filter = {};
    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email');

    res.json({ listings });
  } catch (err) { next(err); }
}

// ── GET /api/listings/:id ───────────────────────────────────────────────
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// ── POST /api/listings ──────────────────────────────────────────────────
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// ── PATCH /api/listings/:id ─────────────────────────────────────────────
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Don't allow editing a removed or sold listing through the generic update
    if (listing.status === 'removed') {
      return res.status(400).json({ message: 'Cannot update a removed listing' });
    }
    if (listing.status === 'sold') {
      return res.status(400).json({ message: 'Cannot update a sold listing' });
    }

    const updated = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    res.json({ listing: updated });
  } catch (err) { next(err); }
}

// ── DELETE /api/listings/:id  (soft delete) ─────────────────────────────
// Sets status to 'removed' instead of actually deleting the document.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.status === 'removed') {
      return res.status(400).json({ message: 'Listing is already removed' });
    }

    listing.status = 'removed';
    await listing.save();

    res.json({ message: 'Listing removed (soft delete)', listing });
  } catch (err) { next(err); }
}

// ── PATCH /api/listings/:id/sold  (stretch goal) ────────────────────────
// Dedicated endpoint to mark a listing as sold without going through
// the generic PATCH validation which would allow editing price/category.
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.status === 'removed') {
      return res.status(400).json({ message: 'Cannot sell a removed listing' });
    }
    if (listing.status === 'sold') {
      return res.status(400).json({ message: 'Listing is already sold' });
    }

    listing.status = 'sold';
    await listing.save();

    res.json({ message: 'Listing marked as sold', listing });
  } catch (err) { next(err); }
}
