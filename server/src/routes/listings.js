import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  markAsSold,
  deleteListing
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getAllListings);
router.get('/:id', getListing);
router.post('/', createListing);
router.patch('/:id', updateListing);
// `:id` only matches a single path segment, so this never collides with the
// PATCH above — it's listed next to it to keep the two edit routes together.
router.patch('/:id/sold', markAsSold);
router.delete('/:id', deleteListing);

export default router;
