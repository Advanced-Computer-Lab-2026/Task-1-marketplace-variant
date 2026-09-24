import { Listing } from "../models/Listing.js";
import Joi from "joi";
// TODO: write a validation schema for create/update per README.md section 2.

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string(),
  price: Joi.number().min(0).required().positive(),
  category: Joi.string()
    .valid("textbooks", "electronics", "furniture", "clothing", "other")
    .default("other"),
  condition: Joi.string()
    .valid("new", "like-new", "used", "worn")
    .default("used"),
  status: Joi.string().valid("active", "sold", "removed").default("active"),
  seller: Joi.string(),
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string(),
  price: Joi.number().min(0).positive(),
  category: Joi.string()
    .valid("textbooks", "electronics", "furniture", "clothing", "other")
    .default("other"),
  condition: Joi.string()
    .valid("new", "like-new", "used", "worn")
    .default("used"),
  status: Joi.string().valid("active", "sold", "removed").default("active"),
  seller: Joi.string(),
});

// GET /api/listings
// TODO: implement per README.md section 3.
function publicListing(l) {
  return {
    id: l._id.toString(),
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    status: l.status,
    seller: l.seller,
  };
}
export async function getAllListings(req, res, next) {
  try {
    // TODO
    const listings = await Listing.find().populate("seller");
    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    // TODO
    const listing = await Listing.findById(req.params.id).populate("seller");
    if (!listing)
      return res.status(404).json({ message: "Listing not found." });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    // TODO
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const listing = await Listing.create({
      title: value.title,
      description: value.description,
      price: value.price,
      category: value.category,
      condition: value.condition,
      status: value.status,
      seller: value.seller,
    });
    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    // TODO
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const doc = await Listing.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: "Listing not found" });
    res.status(201).json({ doc });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    // TODO

    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "removed" },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!doc) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing Removed" });
  } catch (err) {
    next(err);
  }
}
export async function markAsSold(req, res, next) {
  try {
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "sold" },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!doc) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing Sold" });
  } catch (err) {
    next(err);
  }
}
