import { Listing } from '../models/Listing.js';
import Joi from 'joi';
// TODO: write a validation schema for create/update per README.md section 2.

const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().required().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'clothing', 'furniture', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  seller: Joi.string().optional(),
});
const updateListingSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'clothing', 'furniture', 'other').default('other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),

});
// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const { includeRemoved, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else if (!includeRemoved) {
      filter.status = { $ne: 'removed' };
    }

    const listings = await Listing.find(filter).populate('seller', 'name email');
    res.json(listings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    // TODO
    const { error, value } = createListingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }  
    const newListing = new Listing({ ...value, seller: req.user?._id });
    await newListing.save();
    res.status(201).json(newListing);

  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { error, value } = updateListingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, value, { new: true });
    if (!updatedListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(updatedListing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    // TODO
    const deletedListing = await Listing.findByIdAndUpdate(req.params.id, { status: 'removed' }, { new: true });
    if (!deletedListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
export async function markListingAsSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    listing.status = 'sold';
    await listing.save();

    res.json(listing);
  } catch (err) { next(err); }
}