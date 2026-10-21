import { Router } from 'express';
import { nanoid } from 'nanoid';
import Gift from '../models/Gift.js';
import { rateLimit } from '../lib/rateLimit.js';

const router = Router();
const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');
const isLocal = (u) => typeof u === 'string' && /^\/uploads\/(photos|voice)\/[\w.-]+$/.test(u) && !u.includes('..');

function build(b) {
  const errors = [];
  if (!b || typeof b !== 'object') return { errors: ['body must be a JSON object'] };
  const g = {
    herName: clean(b.herName, 60), yourName: clean(b.yourName, 60), firstLine: clean(b.firstLine, 200),
    occasion: clean(b.occasion, 40), relation: clean(b.relation, 40), vibe: clean(b.vibe, 40),
    seal: clean(b.seal, 40), sticker: clean(b.sticker, 40), letter: clean(b.letter, 600),
  };
  if (!g.herName) errors.push('herName is required');
  if (!g.yourName) errors.push('yourName is required');
  if (typeof b.letter === 'string' && b.letter.trim().length > 500) errors.push('letter must be <= 500 chars');

  g.since = null;
  if (b.since) {
    const m = Number(b.since.month), y = Number(b.since.year);
    if (Number.isInteger(m) && m >= 1 && m <= 12 && Number.isInteger(y) && y >= 1900 && y <= 2100) g.since = { month: m, year: y };
    else errors.push('since must be {month 1-12, year}');
  }

  const photos = Array.isArray(b.photos) ? b.photos : [];
  if (photos.length > 8) errors.push('at most 8 photos');
  g.photos = photos.slice(0, 8).map((p) => ({ url: p?.url, caption: clean(p?.caption, 120), puzzle: !!p?.puzzle }));
  if (g.photos.some((p) => !isLocal(p.url))) errors.push('photo urls must start with /uploads/');
  if (g.photos.filter((p) => p.puzzle).length > 1) errors.push('at most one puzzle photo');

  const notes = Array.isArray(b.notes) ? b.notes : [];
  if (notes.length > 5) errors.push('at most 5 notes');
  if (notes.some((n) => typeof n === 'string' && n.trim().length > 80)) errors.push('each note must be <= 80 chars');
  g.notes = notes.slice(0, 5).map((n) => clean(n, 80)).filter(Boolean);

  const promises = Array.isArray(b.promises) ? b.promises : [];
  if (promises.length > 5) errors.push('at most 5 promises');
  g.promises = promises.slice(0, 5).map((n) => clean(n, 120)).filter(Boolean);

  if (b.voiceUrl) {
    if (isLocal(b.voiceUrl)) g.voiceUrl = b.voiceUrl; else errors.push('voiceUrl must start with /uploads/');
  } else g.voiceUrl = null;
  return { g, errors };
}

router.post('/', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res, next) => {
  try {
    const { g, errors } = build(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join('; '), errors });
    const slug = nanoid(10);
    await Gift.create({ ...g, slug });
    const base = (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
    res.status(201).json({ slug, url: `${base}/g/${slug}` });
  } catch (e) {
    if (e.name === 'ValidationError') return res.status(400).json({ error: e.message });
    next(e);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const gift = await Gift.findOne({ slug: req.params.slug });
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    res.json(gift.toJSON());
  } catch (e) { next(e); }
});

router.post('/:slug/visit', rateLimit({ windowMs: 60_000, max: 60 }), async (req, res, next) => {
  try {
    const gift = await Gift.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true });
    if (!gift) return res.status(404).json({ error: 'Gift not found' });
    res.json({ views: gift.views });
  } catch (e) { next(e); }
});

export default router;
