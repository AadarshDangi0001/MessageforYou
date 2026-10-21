import mongoose from 'mongoose';

// Uploaded photos and voice notes live in MongoDB so they survive restarts on hosts with temporary disks.
// _id is the public file name (e.g. "9f2c….webp"), so the URL /uploads/<kind>/<_id> stays the same as before.
const fileSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  kind: { type: String, enum: ['photos', 'voice'], required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.models.File || mongoose.model('File', fileSchema);
