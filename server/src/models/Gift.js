import mongoose from 'mongoose';
const { Schema } = mongoose;

const str = (max, extra = {}) => ({ type: String, trim: true, maxlength: max, default: '', ...extra });
const localUrl = (v) => v == null || v === '' || (typeof v === 'string' && v.startsWith('/uploads/') && !v.includes('..'));

const PhotoSchema = new Schema({
  url: { type: String, required: true, validate: { validator: (v) => localUrl(v) && !!v, message: 'photo url must start with /uploads/' } },
  caption: str(120),
  puzzle: { type: Boolean, default: false },
}, { _id: false });

const GiftSchema = new Schema({
  slug: { type: String, required: true, unique: true, index: true },
  herName: str(60, { required: true }),
  yourName: str(60, { required: true }),
  firstLine: str(200),
  occasion: str(40),
  relation: str(40),
  vibe: str(40),
  since: {
    type: new Schema({ month: { type: Number, min: 1, max: 12, required: true }, year: { type: Number, min: 1900, max: 2100, required: true } }, { _id: false }),
    default: null,
  },
  photos: {
    type: [PhotoSchema], default: [],
    validate: [
      { validator: (a) => a.length <= 8, message: 'at most 8 photos' },
      { validator: (a) => a.filter((p) => p.puzzle).length <= 1, message: 'at most one puzzle photo' },
    ],
  },
  notes: {
    type: [{ type: String, trim: true, maxlength: 80 }], default: [],
    validate: { validator: (a) => a.length <= 5, message: 'at most 5 notes' },
  },
  letter: str(500),
  seal: str(40),
  sticker: str(40),
  voiceUrl: { type: String, default: null, validate: { validator: localUrl, message: 'voiceUrl must start with /uploads/' } },
  promises: {
    type: [{ type: String, trim: true, maxlength: 120 }], default: [],
    validate: { validator: (a) => a.length <= 5, message: 'at most 5 promises' },
  },
  views: { type: Number, default: 0, min: 0 },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

GiftSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret._id; if (ret.createdAt) ret.createdAt = new Date(ret.createdAt).toISOString(); return ret; },
});

export default mongoose.model('Gift', GiftSchema);
