import { Listing } from '../models/Listing.js';
import Joi from 'joi';
import mongoose from 'mongoose';

// TODO: write a validation schema for create/update per README.md section 2.

const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
});

// For updates: nothing is required, but at least one field must be sent
const updateSchema = createSchema
  .fork(['title', 'price'], (f) => f.optional())
  .min(1);

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    // TODO
    const filter = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    // TODO
     if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    const hidden = listing && listing.status === 'removed' && req.query.includeRemoved !== 'true';
    if (!listing || hidden) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    // TODO
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    // TODO
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ ok: true, listing });
  } catch (err) { next(err); }
}
