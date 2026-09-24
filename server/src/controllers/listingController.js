import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// ─── Task 2: Validation schemas ────────────────────────────────────────────

const createSchema = Joi.object({
  title:       Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000),
  price:       Joi.number().min(0).required(),
  category:    Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition:   Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller:      Joi.string().hex().length(24)   // optional ObjectId string
});

const updateSchema = Joi.object({
  title:       Joi.string().min(1).max(200),
  description: Joi.string().max(2000),
  price:       Joi.number().min(0),
  category:    Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition:   Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status:      Joi.string().valid('active', 'sold', 'removed')
});

// ─── Task 3: CRUD controllers ──────────────────────────────────────────────

// GET /api/listings
// Task 6: .populate('seller') fetches the referenced User document
// (name + email) in a second query so clients get real data, not just an id.
export async function getAllListings(req, res, next) {
  try {
    // Task 3 & 4: by default only return active/sold listings.
    // If the caller sends ?includeRemoved=true we show everything.
    const filter = req.query.includeRemoved === 'true'
      ? {}
      : { status: { $ne: 'removed' } };

    const listings = await Listing
      .find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// Task 6: same populate as above for a single listing.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing
      .findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // We no longer hide soft-deleted items here. If someone has the exact ID
    // (e.g. from an order history), they should be able to view the item.
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    // Task 2: validate the request body; abortEarly:false collects ALL errors.
    const { value, error } = createSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    res.status(201).json({ listing });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    // Task 2: validate; stripUnknown removes fields not in the schema.
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) return res.status(400).json({ message: error.message });

    // First, find the existing listing to check its status
    const existingListing = await Listing.findById(req.params.id);
    if (!existingListing) return res.status(404).json({ message: 'Listing not found' });

    // Strict Rule: Block the update if the listing is already sold or soft-deleted
    if (existingListing.status === 'sold' || existingListing.status === 'removed') {
      return res.status(403).json({ message: `Cannot edit a listing that is currently ${existingListing.status}` });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }   // new:true → return the updated doc
    );
    
    res.json({ listing });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id  — Task 4: soft delete
// We never remove the document. We just flip status to 'removed'.
// This preserves the audit trail (dispute resolution, sold-item history, etc.)
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ ok: true, status: listing.status });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold  — Task 5: mark as sold
// A dedicated endpoint that ONLY flips status → 'sold'.
// It bypasses the generic updateSchema on purpose so callers can't
// accidentally change price/category/condition at the same time.
export async function markAsSold(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'sold' } },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    res.json({ listing });
  } catch (err) { next(err); }
}

