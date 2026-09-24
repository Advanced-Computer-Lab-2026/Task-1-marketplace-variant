import { Router } from "express";
import {
  getAllListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  markListingSold,
} from "../controllers/listingController.js";

const router = Router();

router.get("/", getAllListings);
router.get("/:id", getListing);
router.post("/", createListing);
router.post("/:id/sold", markListingSold);
router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

export default router;