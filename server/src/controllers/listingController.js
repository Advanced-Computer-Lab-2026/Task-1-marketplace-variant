import Joi from 'joi';
import { Listing } from '../models/Listing.js';

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
});

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter).populate('seller', 'name email').sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
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

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Listing.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });

    const changingToSold = value.status === 'sold';
    const alreadySold = existing.status === 'sold';
    if ((changingToSold || alreadySold) && (value.price !== undefined || value.category !== undefined)) {
      return res.status(400).json({ message: 'Cannot change price or category once a listing is sold' });
    }

    const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  (soft delete)
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold  (stretch goal)
export async function markSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status: 'sold' }, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}