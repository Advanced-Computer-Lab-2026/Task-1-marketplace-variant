import Joi from 'joi';
import { Listing } from '../models/Listing.js';

const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];


const createSchema = Joi.object({
  title: Joi.string().min(1).max(120).required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.string().hex().length(24) // Mongo ObjectId as a hex string
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(120),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORIES),
  condition: Joi.string().valid(...CONDITIONS),
  seller: Joi.string().hex().length(24)
});

function publicListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    condition: l.condition,
    status: l.status,
    // when populated, l.seller is a User doc; when not, it's an id or undefined
    seller:
      l.seller && l.seller.name
        ? { id: l.seller._id.toString(), name: l.seller.name, email: l.seller.email }
        : l.seller
        ? l.seller.toString()
        : null,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt
  };
}


export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';
    const filter = includeRemoved ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email');

    res.json({ listings: listings.map(publicListing) });
  } catch (err) {
    next(err);
  }
}


export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const includeRemoved = req.query.includeRemoved === 'true';
    if (listing.status === 'removed' && !includeRemoved) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: publicListing(listing) });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) {
    next(err);
  }
}


export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    const existing = await Listing.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Listing not found' });
    if (existing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (existing.status === 'sold') {
      return res.status(409).json({ message: 'Listing is sold and can no longer be edited' });
    }

    Object.assign(existing, value);
    await existing.save();

    res.json({ listing: publicListing(existing) });
  } catch (err) {
    next(err);
  }
}

export async function markListingSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.status === 'sold') {
      return res.status(409).json({ message: 'Listing is already sold' });
    }

    listing.status = 'sold';
    await listing.save();

    res.json({ listing: publicListing(listing) });
  } catch (err) {
    next(err);
  }
}


export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.status = 'removed';
    await listing.save();

    res.json({ listing: publicListing(listing) });
  } catch (err) {
    next(err);
  }
}