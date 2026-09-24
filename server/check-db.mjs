// Proof that soft delete is real: talks straight to MongoDB, bypassing the API.
//
//   node check-db.mjs              -> counts every listing by status
//   node check-db.mjs <listingId>  -> shows that one raw document
//
// The point: a listing the API reports as 404 is still physically here.
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Listing } from './src/models/Listing.js';

await mongoose.connect(process.env.MONGO_URI);

const id = process.argv[2];

if (id) {
  // .findById with no status filter at all — this is the raw document as
  // MongoDB stores it, not what the API chooses to show you.
  const doc = await Listing.findById(id).lean();
  if (!doc) {
    console.log(`No document with _id ${id}. This one really is gone.`);
  } else {
    console.log('Document IS still in the collection:\n');
    console.log(doc);
    console.log(`\nstatus = "${doc.status}"`);
  }
} else {
  const total = await Listing.countDocuments({});
  const byStatus = await Listing.aggregate([
    { $group: { _id: '$status', n: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log(`total listing documents physically in the collection: ${total}`);
  for (const s of byStatus) console.log(`  ${s._id}: ${s.n}`);
}

await mongoose.disconnect();
