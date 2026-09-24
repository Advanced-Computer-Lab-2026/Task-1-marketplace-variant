import { Router } from "express";
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markAsSold,
} from "../controllers/listingController.js";

const router = Router();

// TODO: wire up the routes described in README.md section 3.
router.get("/", getAllListings);
router.get("/:id", getListing);
router.post("/", createListing);
router.patch("/:id", updateListing); //patch(only changes one attribute) = put(changes the whole query)
router.patch("/:id", markAsSold);
router.delete("/:id", deleteListing);
export default router;
