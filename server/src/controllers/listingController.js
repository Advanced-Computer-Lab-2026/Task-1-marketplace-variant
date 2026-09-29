import { Listing } from '../models/Listing.js';
import Joi from 'joi';
// TODO: write a validation schema for create/update per README.md section 2.
const createUpdateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
});


// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    // TODO
    const listings = await Listing.find().populate('seller', 'name email');
    const activeListings = listings.filter(listing => listing.status !== 'removed');
    res.json(activeListings);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name email');
    if(!listing) return res.status(404).json({ message: 'Listing not found' });
    if(listing.status === 'removed') return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { error, value } = createUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

  
    const listing = await Listing.create({ ...value});
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { error, value } = await createUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id,  value , { new: true, runValidators: true });
    res.json(updatedListing);

  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    await Listing.findByIdAndUpdate(req.params.id, { status: 'removed' });

    res.status(204).end();
  } catch (err) { next(err); }
}


export async function updateStatusListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id,  { status: 'sold' } , { new: true, runValidators: true });
    res.json(updatedListing);
    
  } catch (err) { next(err); }
} 
