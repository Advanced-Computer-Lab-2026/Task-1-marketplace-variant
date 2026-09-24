import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markAsSold
} from '../controllers/listingController.js';

const router = Router();

// GET /api/listings - Fetch all listings (excludes removed by default)
// POST /api/listings - Create a new listing
router.get('/', getAllListings);
router.post('/', createListing);

// PATCH /api/listings/:id/sold - Stretch Goal: Mark listing as sold
router.patch('/:id/sold', markAsSold);

// GET /api/listings/:id - Fetch single listing
// PATCH /api/listings/:id - Update listing fields
// DELETE /api/listings/:id - Soft-delete listing (sets status to 'removed')
router.get('/:id', getListing);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);

export default router;
