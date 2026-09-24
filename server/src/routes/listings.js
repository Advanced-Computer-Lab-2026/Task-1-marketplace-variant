import { Router } from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markAsSold,
} from '../controllers/listingController.js';

const router = Router();

router.get('/', getAllListings);
router.get('/:id', getListing);
router.post('/', createListing);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);
router.patch('/:id/sold', markAsSold); // stretch goal

export default router;