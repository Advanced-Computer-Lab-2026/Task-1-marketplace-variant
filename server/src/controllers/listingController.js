import { Listing } from '../models/Listing.js';

import Joi from 'joi';
import '../models/User.js'; // registers the 'User' model so populate('seller') works

const ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SELLER_FIELDS = 'name email'; // never expose the password field

// status is deliberately absent: it only changes via DELETE and PATCH /:id/sold
const createListingSchema = Joi.object({
  title: Joi.string().trim().max(120).required(),
  description: Joi.string().trim().allow('').max(2000),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...Listing.schema.path('category').enumValues),
  condition: Joi.string().valid(...Listing.schema.path('condition').enumValues),
  seller: Joi.string().pattern(ID_REGEX),
});

const updateListingSchema = createListingSchema
  .fork(['title', 'price'], (field) => field.optional())
  .min(1);

const isValidId = (id) => ID_REGEX.test(id);
const validate = (schema, body) => schema.validate(body, { abortEarly: false });

const badRequest = (res, error) =>
  res.status(400).json({
    error: 'Validation failed',
    details: error.details.map((d) => d.message),
  });

const explainMiss = async (res, id, action) => {
  const existing = await Listing.findById(id).select('status');
  if (!existing || existing.status === 'removed') {
    return res.status(404).json({ error: 'Listing not found' });
  }
  return res
    .status(409)
    .json({ error: `Listing is ${existing.status}; only active listings can be ${action}` });
};
// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
        const filter =
      req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', SELLER_FIELDS);

    return res.json(listings);
  } catch (err) { next(err); }
  
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
        const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const filter = { _id: id };
    if (req.query.includeRemoved !== 'true') filter.status = { $ne: 'removed' };

    const listing = await Listing.findOne(filter).populate('seller', SELLER_FIELDS);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    return res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
       const { error, value } = validate(createListingSchema, req.body);
    if (error) return badRequest(res, error);

    const listing = await Listing.create(value);
    return res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
        const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const { error, value } = validate(updateListingSchema, req.body);
    if (error) return badRequest(res, error);

    const listing = await Listing.findOneAndUpdate(
      { _id: id, status: 'active' },
      { $set: value },
      { new: true, runValidators: true }
    );
    if (!listing) return await explainMiss(res, id, 'edited');

    return res.json(listing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
       const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await Listing.findOneAndUpdate(
      { _id: id },
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    return res.json({ message: 'Listing removed', listing });
  } catch (err) { next(err); }
}
// PATCH /api/listings/:id/sold
export async function markSold(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: 'Invalid listing id' });

    const listing = await Listing.findOneAndUpdate(
      { _id: id, status: 'active' },
      { $set: { status: 'sold' } },
      { new: true, runValidators: true }
    );
    if (!listing) return await explainMiss(res, id, 'marked as sold');

    return res.json(listing);
  } catch (err) { next(err); }
}