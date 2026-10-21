import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { rateLimit } from '../lib/rateLimit.js';
import File from '../models/File.js';

const IMG = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic', 'image/heif': '.heif', 'image/avif': '.avif' };
const AUD = { 'audio/webm': '.webm', 'video/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav' };

// Files are kept in memory just long enough to be written to MongoDB (5MB cap).
function uploader(map) {
  return multer({
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    storage: multer.memoryStorage(),
    fileFilter: (_req, file, cb) => {
      const mt = file.mimetype.split(';')[0].toLowerCase();
      file.mimetype = mt;
      if (map[mt]) return cb(null, true);
      cb(Object.assign(new Error('Unsupported file type'), { status: 415 }));
    },
  }).single('file');
}

const router = Router();
const limit = rateLimit({ windowMs: 60_000, max: 40 });

function handle(kind, map) {
  const up = uploader(map);
  return [limit, (req, res, next) => up(req, res, async (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 400;
      return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "file")' });
    try {
      const name = crypto.randomBytes(16).toString('hex') + map[req.file.mimetype];
      await File.create({ _id: name, kind, contentType: req.file.mimetype, size: req.file.size, data: req.file.buffer });
      res.json({ url: `/uploads/${kind}/${name}` });
    } catch (e) { next(e); }
  })];
}

router.post('/photo', ...handle('photos', IMG));
router.post('/voice', ...handle('voice', AUD));
export default router;

// GET /uploads/:kind/:name  → streams the stored file. Supports Range requests, which Safari/iOS need for audio.
export async function serveUpload(req, res, next) {
  try {
    const { kind, name } = req.params;
    if (!['photos', 'voice'].includes(kind) || !/^[\w.-]+$/.test(name) || name.includes('..')) return res.status(404).end();
    const f = await File.findOne({ _id: name, kind }).lean();
    if (!f) return res.status(404).end();
    const buf = f.data.buffer ? Buffer.from(f.data.buffer, f.data.byteOffset, f.data.length) : Buffer.from(f.data);
    const total = buf.length;
    res.set({ 'Content-Type': f.contentType, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', ETag: `"${name}"` });
    if (req.headers['if-none-match'] === `"${name}"`) return res.status(304).end();
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      let start = m[1] ? parseInt(m[1], 10) : Math.max(0, total - parseInt(m[2], 10));
      let end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      if (start > end || start >= total) return res.status(416).set('Content-Range', `bytes */${total}`).end();
      res.status(206).set({ 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': end - start + 1 });
      return res.end(buf.subarray(start, end + 1));
    }
    res.set('Content-Length', total);
    res.end(buf);
  } catch (e) { next(e); }
}
