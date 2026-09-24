import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a non-negative number'],
    },
    category: {
      type: String,
      enum: {
        values: ['textbooks', 'electronics', 'furniture', 'clothing', 'other'],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
    },
    condition: {
      type: String,
      enum: {
        values: ['new', 'like-new', 'used', 'worn'],
        message: '{VALUE} is not a valid condition',
      },
      default: 'used',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'sold', 'removed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Listing = mongoose.model('Listing', listingSchema);