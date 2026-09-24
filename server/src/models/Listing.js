import mongoose from 'mongoose';

// TODO: define the Listing schema per README.md section 1.

const listingSchema = new mongoose.Schema(
  {
    // TODO
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['textbooks', 'electronics', 'furniture', 'clothing', 'other'],
      default: 'other'
    },
    condition: {
      type: String,
      enum: ['new', 'like-new', 'used', 'worn'],
      default: 'used'
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'removed'],
      default: 'active'
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);
