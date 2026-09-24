import { Listing } from '../models/Listing.js';
import Joi from 'joi';

// Validation schemas for create/update
const allowedCategories = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const allowedConditions = ['new', 'like-new', 'used', 'worn'];
const allowedStatus = ['active', 'sold', 'removed'];

const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...allowedCategories).default('other'),
  condition: Joi.string().valid(...allowedConditions).default('used'),
  status: Joi.string().valid(...allowedStatus).default('active'),
  seller: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
});

// For updates we allow partial objects but enforce price >= 0 when present
const updateListingSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid(...allowedCategories),
  condition: Joi.string().valid(...allowedConditions),
  status: Joi.string().valid(...allowedStatus),
  seller: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
}).min(1);

export function validateCreateListing(data) {
  return createListingSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

export function validateUpdateListing(data) {
  return updateListingSchema.validate(data, { abortEarly: false, stripUnknown: true });
}

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true' || req.query.includeRemoved === '1';
    const filter = {};
    if (!includeRemoved) filter.status = { $ne: 'removed' };

    const listings = await Listing.find(filter).sort({ createdAt: -1 }).populate('seller', 'name email').exec();
    res.json(listings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const includeRemoved = req.query.includeRemoved === 'true' || req.query.includeRemoved === '1';
    const listing = await Listing.findById(id).populate('seller', 'name email').exec();
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status === 'removed' && !includeRemoved) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { error, value } = validateCreateListing(req.body);
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details.map(d => d.message) });

    const listing = new Listing(value);
    await listing.save();
    const populated = await Listing.findById(listing._id).populate('seller', 'name email').exec();
    res.status(201).json(populated);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    const { error, value } = validateUpdateListing(req.body);
    if (error) return res.status(400).json({ message: 'Validation failed', details: error.details.map(d => d.message) });

    // Prevent certain edits once sold
    const existing = await Listing.findById(id).exec();
    if (!existing) return res.status(404).json({ message: 'Listing not found' });
    if (existing.status === 'sold' && (Object.prototype.hasOwnProperty.call(value, 'price') || Object.prototype.hasOwnProperty.call(value, 'category'))) {
      return res.status(400).json({ message: 'Cannot modify price or category once listing is sold' });
    }

    const updated = await Listing.findByIdAndUpdate(id, value, { new: true, runValidators: true }).populate('seller', 'name email').exec();
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    // Soft delete: set status to 'removed'
    const updated = await Listing.findByIdAndUpdate(id, { status: 'removed' }, { new: true }).populate('seller', 'name email').exec();
    if (!updated) return res.status(404).json({ message: 'Listing not found' });
    res.json(updated);
  } catch (err) { next(err); }
}

// POST /api/listings/:id/sold
export async function markSold(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Listing.findById(id).exec();
    if (!existing) return res.status(404).json({ message: 'Listing not found' });
    if (existing.status === 'removed') return res.status(400).json({ message: 'Cannot mark a removed listing as sold' });
    if (existing.status === 'sold') return res.json(existing);

    const updated = await Listing.findByIdAndUpdate(id, { status: 'sold' }, { new: true }).populate('seller', 'name email').exec();
    res.json(updated);
  } catch (err) { next(err); }
}
