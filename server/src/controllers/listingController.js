import Joi from 'joi';
import mongoose from 'mongoose';
import { Listing } from '../models/Listing.js';

// Validation for creating a listing
const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(
    'textbooks',
    'electronics',
    'furniture',
    'clothing',
    'other'
  ),
  condition: Joi.string().valid(
    'new',
    'like-new',
    'used',
    'worn'
  ),
  seller: Joi.string()
});

// Validation for updating a listing
const updateListingSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid(
    'textbooks',
    'electronics',
    'furniture',
    'clothing',
    'other'
  ),
  condition: Joi.string().valid(
    'new',
    'like-new',
    'used',
    'worn'
  ),
  status: Joi.string().valid('sold'),
  
  seller: Joi.string()
}).min(1);


// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';

    const filter = includeRemoved
      ? {}
      : { status: { $ne: 'removed' } };

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
    const { id } = req.params;

    // Check whether the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid listing ID'
      });
    }

    const listing = await Listing.findById(id)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    // Don't show soft-deleted listings by default
    const includeRemoved = req.query.includeRemoved === 'true';

    if (listing.status === 'removed' && !includeRemoved) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}


// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createListingSchema.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        message: error.message
      });
    }

    // If a seller was provided, make sure it is a valid ObjectId
    if (
      value.seller &&
      !mongoose.Types.ObjectId.isValid(value.seller)
    ) {
      return res.status(400).json({
        message: 'Invalid seller ID'
      });
    }

    const listing = await Listing.create(value);

    const populatedListing = await listing.populate(
      'seller',
      'name email'
    );

    res.status(201).json({
      listing: populatedListing
    });
  } catch (err) {
    next(err);
  }
}


// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid listing ID' });
    }

    const { value, error } = updateListingSchema.validate(
      req.body,
      { abortEarly: false, stripUnknown: true }
    );

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (value.seller && !mongoose.Types.ObjectId.isValid(value.seller)) {
      return res.status(400).json({ message: 'Invalid seller ID' });
    }

    // Find the existing listing first
    const existingListing = await Listing.findById(id);

    if (!existingListing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Sold listings cannot be edited
    if (existingListing.status === 'sold') {
      return res.status(400).json({
        message: 'Sold listings cannot be edited'
      });
    }

    // Removed listings cannot be edited
    if (existingListing.status === 'removed') {
      return res.status(400).json({
        message: 'Removed listings cannot be edited'
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}


// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid listing ID'
      });
    }

    // Soft delete:
    // We do NOT delete the MongoDB document.
    // We only change its status to "removed".
    const listing = await Listing.findByIdAndUpdate(
      id,
      { $set: { status: 'removed' } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    res.json({
      message: 'Listing removed',
      listing
    });
  } catch (err) {
    next(err);
  }
}


// PATCH /api/listings/:id/sold
// Stretch goal
export async function markListingSold(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid listing ID'
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      id,
      { $set: { status: 'sold' } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}