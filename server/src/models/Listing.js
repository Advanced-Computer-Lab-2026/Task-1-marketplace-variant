import mongoose from 'mongoose';

export const LISTING_CATEGORIES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
export const LISTING_CONDITIONS = ['new', 'like-new', 'used', 'worn'];
export const LISTING_STATUSES = ['active', 'sold', 'removed'];

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: LISTING_CATEGORIES,
      default: 'other'
    },
    condition: {
      type: String,
      enum: LISTING_CONDITIONS,
      default: 'used'
    },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      default: 'active'
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
