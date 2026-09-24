import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markSold
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getAllListings);
router.post('/', createListing);
router.get('/:id', getListing);
router.patch('/:id', updateListing);
router.patch('/:id/sold', markSold);
router.delete('/:id', deleteListing);

export default router;
