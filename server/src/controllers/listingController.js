import Joi from "joi";
import { Listing } from "../models/Listing.js";

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(
    "textbooks",
    "electronics",
    "furniture",
    "clothing",
    "other",
  ),
  condition: Joi.string().valid("new", "like-new", "used", "worn"),
  status: Joi.string().valid("active", "sold", "removed"),
  seller: Joi.string().hex().length(24).allow(null, ""),
});

const updateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0),
  category: Joi.string().valid(
    "textbooks",
    "electronics",
    "furniture",
    "clothing",
    "other",
  ),
  condition: Joi.string().valid("new", "like-new", "used", "worn"),
  status: Joi.string().valid("active", "sold", "removed"),
  seller: Joi.string().hex().length(24).allow(null, ""),
}).min(1);

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === "true";

    const filter = includeRemoved ? {} : { status: { $ne: "removed" } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate("seller", "name email");

    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === "true";

    const filter = includeRemoved
      ? { _id: req.params.id }
      : {
          _id: req.params.id,
          status: { $ne: "removed" },
        };

    const listing = await Listing.findOne(filter).populate(
      "seller",
      "name email",
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const listing = await Listing.create(value);

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "removed" } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}
