import { Listing } from '../models/Listing.js';
import Joi from 'joi';

// Step 2: Validation schema
const listingValidation = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).required(), // Enforces non-negative price[cite: 10]
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string()
});

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    // Excludes removed listings by default, but allows opting in via query parameter[cite: 10, 11]
    const query = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    
    // Stretch goal: Populates the seller field with name and email[cite: 11]
    const listings = await Listing.find(query).populate('seller', 'name email');
    res.json(listings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    // Stretch goal: Populates the seller field[cite: 11]
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { error } = listingValidation.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const listing = new Listing(req.body);
    await listing.save();
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    // Stretch goal: Bypass generic validation if the client is ONLY marking the item as sold[cite: 11]
    const isOnlyMarkingSold = req.body.status === 'sold' && Object.keys(req.body).length === 1;
    
    if (!isOnlyMarkingSold) {
      const { error } = listingValidation.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
    }

    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    // Soft delete: updates the status instead of removing the document from the database[cite: 11]
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ message: 'Listing successfully removed', listing });
  } catch (err) { next(err); }
}