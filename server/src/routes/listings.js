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

router.get('/',       getAllListings);   // GET  /api/listings
router.get('/:id',    getListing);      // GET  /api/listings/:id
router.post('/',      createListing);   // POST /api/listings
router.patch('/:id',  updateListing);   // PATCH /api/listings/:id
router.delete('/:id', deleteListing);   // DELETE /api/listings/:id  (soft)
router.patch('/:id/sold', markAsSold);  // PATCH /api/listings/:id/sold  (Task 5)

export default router;

