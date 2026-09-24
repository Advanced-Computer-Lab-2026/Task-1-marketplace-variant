import Joi from 'joi';

import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.
const listingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),

  category: Joi.string()
    .valid('textbooks', 'electronics', 'furniture', 'clothing', 'other')
    .optional(),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn')
    .optional(),

  status: Joi.string()
    .valid('active', 'sold', 'removed')
    .optional(),

  seller: Joi.string().optional()
});
const updateSchema = listingSchema.fork(
  ['title', 'description', 'price', 'category', 'condition', 'status', 'seller'],
  (schema) => schema.optional()
);





// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    // TODO
   let filter = {};

    if (req.query.includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter);

    res.status(200).json(listings);

  } catch (err) { 
    next(err); 
  } }


// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    if (
      listing.status === 'removed' &&
      req.query.includeRemoved !== 'true'
    ) {
      return res.status(404).json({
        message: 'Listing not found'
      });
    }

    res.status(200).json(listing);

  } catch (err) {
    next(err);
  }
}
// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
      const { error, value } = listingSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const listing = await Listing.create(value);

    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    // TODO
     const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      value,
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
     res.status(200).json(listing);


  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    // TODO
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
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

    res.status(200).json({
      message: 'Listing removed',
      listing
    });
  } catch (err) { next(err); }
}
