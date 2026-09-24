import mongoose from 'mongoose';

// TODO: define the Listing schema per README.md section 1.

export const CATEGORY_VALUES = ['textbooks', 'electronics', 'furniture', 'clothing', 'other'];
export const CONDITION_VALUES = ['new', 'like-new', 'used', 'worn'];
export const STATUS_VALUES = ['active', 'sold', 'removed'];

const listingSchema = new mongoose.Schema(
  {

    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORY_VALUES, default: 'other', required: true },
    condition: { type: String, enum: CONDITION_VALUES, default: 'used', required: true },
    status: { type: String, enum: STATUS_VALUES, default: 'active', required: true },
    seller:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
