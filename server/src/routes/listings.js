import express from 'express';
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markAsSold,
} from '../controllers/listingController.js';

const router = express.Router();

router.get('/', getAllListings);
router.get('/:id', getListing);
router.post('/', createListing);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);

// Stretch goal route
router.patch('/:id/sold', markAsSold);

export default router;