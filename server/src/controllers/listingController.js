import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.
const createListingSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other')
    .default('other'),
  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn')
    .default('used'),
  seller: Joi.string().hex().length(24).optional(),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24),
}).min(1);

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const { includeRemoved } = req.query;

    // Filter out 'removed' listings by default unless explicitly requested
    const filter = includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter).populate('seller', 'name email');

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate('seller', 'name email');

    // Return 404 if listing doesn't exist OR if it has been soft-deleted ('removed')
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((detail) => detail.message),
      });
    }

    const listing = await Listing.create(value);

    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;

    const { error, value } = updateListingSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((detail) => detail.message),
      });
    }

    const updatedListing = await Listing.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    });

    if (!updatedListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({ success: true, data: updatedListing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;

    const removedListing = await Listing.findByIdAndUpdate(
      id,
      { status: 'removed' },
      { new: true }
    );

    if (!removedListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Listing marked as removed',
      data: removedListing,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/sold
// Stretch Goal (Section 5): Dedicated endpoint to flip status to 'sold' directly
export async function markAsSold(req, res, next) {
  try {
    const { id } = req.params;

    const soldListing = await Listing.findByIdAndUpdate(
      id,
      { status: 'sold' },
      { new: true }
    );

    if (!soldListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Listing marked as sold',
      data: soldListing,
    });
  } catch (err) {
    next(err);
  }
}