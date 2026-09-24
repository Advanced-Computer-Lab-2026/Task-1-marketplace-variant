import Joi from 'joi';
import { Listing } from '../models/Listing.js';



// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(200),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24)
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(200),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other').default('other'),
  condition: Joi.string().valid('new', 'like new', 'used', 'worn').default('used'),
  status: Joi.string().valid('active', 'sold', 'removed').default('active'),
  seller: Joi.string().hex().length(24)
});

function publicListing(l) {
  return { id: l._id.toString(), title: l.title, description: l.description, price: l.price, category: l.category, condition: l.condition, status: l.status, seller: l.seller, createdAt: l.createdAt };
}
// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const listings = await Listing.find().populate('seller', 'name email').sort({ createdAt: -1 }).lean();
    res.json({ listings: listings.map(publicListing) });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
     const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
      if (!listing || listing.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
      res.json({  listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
     const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
 
    
    const duplicateFilter = { title: value.title };
    if (value.seller) duplicateFilter.seller = value.seller;
 
    const existing = await Listing.findOne(duplicateFilter);
    if (existing) return res.status(409).json({ message: 'You already have a listing with this title' });
 
    const listing = await Listing.create({title: value.title, description: value.description, price: value.price, category: value.category, condition: value.condition, seller: value.seller });
    res.status(201).json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
 
    const doc = await Listing.findById(req.params.id);
    if (!doc || doc.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
    if (doc.status === 'sold') return res.status(400).json({ message: 'Cannot edit a listing that has already been sold' });
 
 
    const listing = await Listing.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    res.json({ listing: publicListing(listing) });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
   const listing = await Listing.findById(req.params.id);
    if (!listing || listing.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
 
    listing.status = 'removed';
    await listing.save();
    res.json({ message: 'Listing removed', listing: publicListing(listing) });
  } catch (err) { next(err); }
}
