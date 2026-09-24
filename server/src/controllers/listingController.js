import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.
const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().optional()
});

export const updateListingSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string()
}).min(1);

function publicListing(listing) {
  const seller = listing.seller;
  const normalizedSeller =
    seller && typeof seller === 'object'
      ? {
          id: seller._id ? seller._id.toString() : undefined,
          name: seller.name,
          email: seller.email
        }
      : seller
        ? { id: seller.toString() }
        : null;

  return {
    id: listing._id.toString(),
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    condition: listing.condition,
    status: listing.status,
    seller: normalizedSeller,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt
  };
}

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true' || req.query.includeRemoved === '1';
    const filter = includeRemoved ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings: listings.map(publicListing) });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email')
      .lean();

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    return res.json({ listing: publicListing(listing) });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.create(value);
    return res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateListingSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const existingListing = await Listing.findById(req.params.id).select('status');

    if (!existingListing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (
      existingListing.status === 'sold' &&
      (Object.prototype.hasOwnProperty.call(value, 'price') ||
        Object.prototype.hasOwnProperty.call(value, 'category'))
    ) {
      return res.status(400).json({
        message: 'Price and category cannot be changed after a listing is sold'
      });
    }

    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    return res.json({ listing: publicListing(doc.toObject ? doc.toObject() : doc) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id/sold
export async function markListingAsSold(req, res, next) {
  try {
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'sold' } },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    return res.json({
      message: 'Listing marked as sold',
      listing: publicListing(doc.toObject ? doc.toObject() : doc)
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true, runValidators: true }
    );

    if (!doc) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    return res.json({
      message: 'Listing removed',
      listing: publicListing(doc.toObject ? doc.toObject() : doc)
    });
  } catch (err) {
    next(err);
  }
}
