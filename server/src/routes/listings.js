import { Router } from 'express';

import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markListingAsSold
} from '../controllers/listingController.js';

const router = Router();

// GET all listings
router.get('/', getAllListings);

// GET one listing by ID
router.get('/:id', getListing);

// CREATE a new listing
router.post('/', createListing);

// UPDATE a listing
router.patch('/:id', updateListing);

// MARK listing as sold
router.patch('/:id/sold', markListingAsSold);

// SOFT DELETE a listing
router.delete('/:id', deleteListing);

export default router;