import mongoose from 'mongoose';
import Joi from 'joi';
import { Listing } from '../models/Listing.js';

const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().allow('').max(2000),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24)
});

// status is now allowed through the generic update, per the user's request.
const updateSchema = Joi.object({
  title: Joi.string().min(1).max(120),
  description: Joi.string().allow('').max(2000),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
});

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';
    const filter = includeRemoved ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email');

    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Listing.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });

    // Lock price/category/condition once a listing is sold —
    // unless this same request is the one un-selling it (status moving away from 'sold').
    const staysSold = existing.status === 'sold' && value.status !== 'active';
    if (staysSold) {
      const lockedFieldsTouched = ['price', 'category', 'condition'].filter(
        (field) => field in value
      );
      if (lockedFieldsTouched.length > 0) {
        return res.status(400).json({
          message: `Cannot update ${lockedFieldsTouched.join(', ')} on a listing that is already sold`
        });
      }
    }

    Object.assign(existing, value);
    await existing.save();

    res.json({ listing: existing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  (soft delete)
export async function deleteListing(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold  (stretch goal — dedicated shortcut, still works alongside the generic route)
export async function markListingSold(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $set: { status: 'sold' } },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or not active' });
    }
    res.json({ listing });
  } catch (err) { next(err); }
}