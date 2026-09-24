import Joi from 'joi';
import {
  Listing,
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_STATUSES
} from '../models/Listing.js';

const listingFields = {
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...LISTING_CATEGORIES),
  condition: Joi.string().valid(...LISTING_CONDITIONS),
  status: Joi.string().valid(...LISTING_STATUSES),
  seller: Joi.string().hex().length(24)
};

const createSchema = Joi.object(listingFields);
const updateSchema = Joi.object({
  ...listingFields,
  title: Joi.string(),
  price: Joi.number().min(0)
});

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true' ? {} : { status: { $ne: 'removed' } };
    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (req.query.includeRemoved !== 'true') filter.status = { $ne: 'removed' };

    const listing = await Listing.findOne(filter)
      .populate('seller', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}
