import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markListingSold
} from '../controllers/listingController.js';

const router = Router();

// TODO: wire up the routes described in README.md section 3.

router.get('/', getAllListings);
router.post('/', createListing);
router.get('/:id', getListing);
router.patch('/:id', updateListing);
router.patch('/:id/sold', markListingSold);
router.delete('/:id', deleteListing);

export default router;
