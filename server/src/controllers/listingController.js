import { Listing } from '../models/Listing.js';
import Joi from 'joi';

// Validation schema for creating a listing
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

  status: Joi.string().valid(
    'active',
    'sold',
    'removed'
  ),

  seller: Joi.string()
});

// Validation schema for updating a listing
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

  status: Joi.string().valid(
    'active',
    'sold',
    'removed'
  ),

  seller: Joi.string()
}).min(1);


// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const { includeRemoved } = req.query;

    let listings;

    if (includeRemoved === 'true') {
      // Return all listings, including removed ones
      listings = await Listing.find()
        .populate('seller', 'name email');
    } else {
      // Hide removed listings by default
      listings = await Listing.find({
        status: { $ne: 'removed' }
      }).populate('seller', 'name email');
    }

    res.status(200).json(listings);
  } catch (err) {
    next(err);
  }
}


// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    // Return the listing even if its status is "removed"
    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}


// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const listing = await Listing.create(value);

    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}


// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const existingListing = await Listing.findById(req.params.id);

    if (!existingListing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    const { error, value } = updateListingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    // If listing is sold, ignore changes to price/category/condition
    if (existingListing.status === 'sold') {
      delete value.price;
      delete value.category;
      delete value.condition;
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      value,
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'name email');

    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}


// DELETE /api/listings/:id
// Soft delete: keep the document in MongoDB,
// but change its status to "removed".
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        status: 'removed'
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}


// PATCH /api/listings/:id/sold
export async function markListingAsSold(req, res, next) {
  try {
    const listing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $ne: 'removed' }
      },
      {
        status: 'sold'
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found or has been removed'
      });
    }

    res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}