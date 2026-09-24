import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markSold,
} from '../controllers/listingController.js';

const router = Router();
// RESTful routes for listings
router.get('/', getAllListings);
router.post('/', createListing);
router.get('/:id', getListing);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);
router.post('/:id/sold', markSold);

export default router;
