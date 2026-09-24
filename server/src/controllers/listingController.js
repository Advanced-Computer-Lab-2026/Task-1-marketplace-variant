import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// Validation schema for create
const createSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
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
  seller: Joi.string().hex().length(24)
});

// Validation schema for update
const updateSchema = Joi.object({
  title: Joi.string().min(2).max(100),
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
  seller: Joi.string().hex().length(24)
});

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    let filter;

    if (req.query.includeRemoved === 'true') {
      filter = {};
    } else {
      filter = { status: { $ne: 'removed' } };
    }

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
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.create(value);

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Prevent changing price after the listing is sold
    if (listing.status === 'sold' && value.price !== undefined) {
      return res.status(400).json({
        message: 'Price cannot be changed after listing is sold'
      });
    }

    Object.assign(listing, value);

    await listing.save();

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = 'removed';

    await listing.save();

    res.json({ message: 'Listing removed successfully' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/sold
export async function markListingAsSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = 'sold';

    await listing.save();

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}