import Joi from 'joi';
import { Listing } from '../models/Listing.js';

const listingFields = {
  title: Joi.string().trim(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
};

const createSchema = Joi.object({
  ...listingFields,
  title: listingFields.title.required(),
  price: listingFields.price.required()
}).required();

const updateSchema = Joi.object(listingFields).min(1).required();

function includeRemoved(req) {
  return req.query.includeRemoved === 'true';
}

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const filter = includeRemoved(req) ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (!includeRemoved(req)) filter.status = { $ne: 'removed' };

    const listing = await Listing.findOne(filter).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
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
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
export async function markListingSold(req, res, next) {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: { $ne: 'removed' } },
      { $set: { status: 'sold' } },
      { new: true, runValidators: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}
