import Joi from "joi";
import mongoose from "mongoose";
import { Listing } from "../models/Listing.js";

const categories = ["textbooks", "electronics", "furniture", "clothing", "other"];
const conditions = ["new", "like-new", "used", "worn"];
const statuses = ["active", "sold", "removed"];

const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().allow(""),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...categories),
  condition: Joi.string().valid(...conditions),
  status: Joi.string().valid(...statuses),
  seller: Joi.string().hex().length(24),
});

const updateSchema = createSchema
  .fork(["title", "price"], (schema) => schema.optional())
  .min(1);

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    // Simply fetch everything where the status is NOT equal ($ne) to "removed"
    const listings = await Listing.find({ status: { $ne: "removed" } })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
      
    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: "Invalid listing id" });

    // Fetch the specific listing by ID, but ONLY if it is not removed
    const listing = await Listing.findOne({ 
      _id: req.params.id, 
      status: { $ne: "removed" } 
    }).populate("seller", "name email");
    
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    
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
    /*
    abortEarly: false: By default, Joi stops validating the exact second it finds the first mistake. Setting this to false forces Joi to check the entire object and return a complete list of every mistake at once. This way, the user gets all their errors back in a single response (e.g., "title is missing AND price must be positive") instead of having to fix them one by one.
     stripUnknown: true: This is a crucial security feature. If a user tries to inject unexpected fields into their request (e.g., {"title": "Book", "price": 10, "isAdmin": true, "overrideStatus": "sold"}), Joi will silently delete the unknown fields. The final value object will only contain the exact fields you explicitly defined in your schema, ensuring bad data never reaches your database.
    */
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.create(value);
    await listing.populate("seller", "name email");
    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: "Invalid listing id" });

    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) return res.status(400).json({ message: error.message });

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true },
    ).populate("seller", "name email");
    
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: "Invalid listing id" });

    // Soft delete: update status instead of deleting the document
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "removed" } },
      { new: true, runValidators: true },
    ).populate("seller", "name email");
    
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings/:id/sold
export async function markListingSold(req, res, next) {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ message: "Invalid listing id" });
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "sold" } },
      { new: true, runValidators: true },
    ).populate("seller", "name email");

    /* 
    new: true
By default, when you use findByIdAndUpdate, Mongoose updates the database but returns the original document (the way it looked before the change). Setting new: true forces Mongoose to return the newly updated version. If you delete this line, the item's status will successfully change to "removed" in your database, but your API will send the old "active" status back to the frontend, making it look like the delete failed.

runValidators: true
By default, Mongoose only checks your schema rules (like your enum: ["active", "sold", "removed"] constraint) when you create a brand-new document. It skips those checks during updates to save processing time. Setting runValidators: true forces Mongoose to verify that the update data strictly matches your schema rules before saving it to the database, ensuring bad data cannot slip through.
    */
    
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}