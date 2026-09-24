import mongoose from 'mongoose';

const { Schema } = mongoose;

const listingSchema = new Schema(
  {
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
    // Plain field, not part of any auth flow in this variant.
    seller: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);