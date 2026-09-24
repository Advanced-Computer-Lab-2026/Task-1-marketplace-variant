import Joi from 'joi';
import mongoose from 'mongoose';
import { Listing } from '../models/Listing.js';

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];

const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.string().hex().length(24)
});

// status is NOT editable here: use DELETE to remove and PATCH /:id/sold to sell
const updateSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.string().hex().length(24)
}).min(1);

function badId(id) {
  return !mongoose.isValidObjectId(id);
}

// GET /api/listings  (removed hidden unless ?includeRemoved=true)
export async function getAllListings(req, res, next) {
  try {
    const filter = {};
    if (req.query.includeRemoved !== 'true') filter.status = { $ne: 'removed' };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email');
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.status === 'removed' && req.query.includeRemoved !== 'true') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id  (only active listings can be edited)
export async function updateListing(req, res, next) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ message: 'Active listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  -> SOFT delete (sets status to 'removed')
export async function deleteListing(req, res, next) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ ok: true, listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold  (stretch goal)
export async function markAsSold(req, res, next) {
  try {
    if (badId(req.params.id)) return res.status(400).json({ message: 'Invalid listing id' });

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $set: { status: 'sold' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Active listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}