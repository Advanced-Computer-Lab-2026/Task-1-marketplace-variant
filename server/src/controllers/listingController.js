import Joi from 'joi';
import bcrypt from 'bcryptjs';

import { Listing, CATEGORY_VALUES, CONDITION_VALUES, STATUS_VALUES } from '../models/Listing.js';
import { User } from '../models/User.js';

const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(1000),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORY_VALUES).required(),
  condition: Joi.string().valid(...CONDITION_VALUES).required(),
  status: Joi.string().valid(...STATUS_VALUES).required(),
  seller: Joi.string().hex().length(24).required()
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(1000),
  price: Joi.number().min(0),
  category: Joi.string().valid(...CATEGORY_VALUES),
  condition: Joi.string().valid(...CONDITION_VALUES),
  status: Joi.string().valid(...STATUS_VALUES)
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
    seller: l.seller?.name ?? null,
    createdAt: l.createdAt,
  };
}


// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter).populate('seller', 'name').sort({ createdAt: -1 }).lean();

    res.json({ listings: listings.map(publicListing) });

  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name');
    if(!listing) return res.status(404).json({message: 'Listing not found'});
    res.json({listing:publicListing(listing)});
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create({ ...value, seller: value.seller });
    await listing.populate('seller', 'name');
    res.status(201).json({ listing:publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(req.params.id, {$set: value}, { new: true, runValidators: true }).populate('seller', 'name');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing:publicListing(listing) });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: { status: 'removed' } }, { new: true });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}
