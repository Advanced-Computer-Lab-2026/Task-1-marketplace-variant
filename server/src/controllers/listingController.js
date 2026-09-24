import { Listing } from '../models/Listing.js';
import Joi from 'joi';


const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('',null).optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24).optional() 
});

const updateListingSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24)
}).min(1);

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const { includeRemoved } = req.query;
    const filter = {};

    if (includeRemoved !== 'true') {
      filter.status = { $ne: 'removed' };
    }
    const listings = await Listing.find(filter).populate('seller', 'name email');
    
    res.status(200).json(listings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    res.status(200).json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { error, value } = createListingSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const listing = new Listing(value);
    await listing.save();
    
    await listing.populate('seller', 'name email');
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { error, value } = updateListingSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id, 
      value, 
      { new: true, runValidators: true } 
    ).populate('seller', 'name email');
    
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    res.status(200).json(listing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      { new: true }
    );
    
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    res.status(200).json({ message: 'Listing successfully removed', listing });
  } catch (err) { next(err); }
} 

// PATCH /api/listings/:id/sold
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'sold' },
      { new: true }
    ).populate('seller', 'name email');

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    
    res.status(200).json({ message: 'Listing marked as sold', listing });
  } catch (err) { next(err); }
}