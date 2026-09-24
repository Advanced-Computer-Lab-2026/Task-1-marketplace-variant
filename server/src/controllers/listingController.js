import {Listing} from '../models/Listing.js';
import Joi from 'joi';

// Validation schema for creating a listing
const createListingSchema = Joi.object({
  title: Joi.string().required(),

  description: Joi.string().optional(),

  price: Joi.number().min(0).required(),

  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other')
    .default('other'),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn')
    .default('used'),

  status: Joi.string()
    .valid('active', 'sold', 'removed')
    .default('active'),

  seller: Joi.string().optional(),
});

// Validation schema for updating a listing
const updateListingSchema = Joi.object({
  title: Joi.string(),

  description: Joi.string(),

  price: Joi.number().min(0),

  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn'),

  status: Joi.string()
    .valid('active', 'sold', 'removed'),

  seller: Joi.string(),
}).min(1);


// GET /api/listings
const getAllListings = async (req, res) => {
  try {
    let filter = {};

    // Hide removed listings by default
    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter)
      .populate('seller', 'name email');

    return res.status(200).json(listings);

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// GET /api/listings/:id
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    // Hide removed listing unless explicitly requested
    if (
      listing.status === 'removed' &&
      req.query.includeRemoved !== 'true'
    ) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    return res.status(200).json(listing);

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// POST /api/listings
const createListing = async (req, res) => {
  try {
    const { error, value } = createListingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const listing = await Listing.create(value);

    return res.status(201).json(listing);

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// PUT /api/listings/:id
const updateListing = async (req, res) => {
  try {
    const { error, value } = updateListingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      value,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    return res.status(200).json(listing);

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE /api/listings/:id
// Soft delete
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    return res.status(200).json({
      message: 'Listing removed successfully',
      listing,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// PATCH /api/listings/:id/sold
const markAsSold = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'sold' },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    return res.status(200).json({
      message: 'Listing marked as sold',
      listing,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


// Export everything using ES modules
export {
  createListing,
  getAllListings,
  getListing,
  updateListing,
  deleteListing,
  markAsSold,
};