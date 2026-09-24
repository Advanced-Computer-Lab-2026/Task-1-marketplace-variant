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

router.get('/', getAllListings);

router.get('/:id', getListing);

router.post('/', createListing);

router.patch('/:id/sold', markListingAsSold);

router.patch('/:id', updateListing);

router.delete('/:id', deleteListing);

export default router;