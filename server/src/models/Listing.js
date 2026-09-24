import mongoose from 'mongoose';

// Exported so the controller's Joi schema validates against the same list the
// database enforces. If these ever drift, you get a request that passes
// validation and then fails at save time with a Mongoose ValidationError.
export const CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
export const CONDITIONS = ['new', 'like-new', 'used', 'worn'];
export const STATUSES = ['active', 'sold', 'removed'];

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    condition: { type: String, enum: CONDITIONS, default: 'used' },
    // Soft delete lives here: DELETE flips this to 'removed' instead of
    // dropping the document. Indexed because every list query filters on it.
    status: { type: String, enum: STATUSES, default: 'active', index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
