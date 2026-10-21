import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { rateLimit } from '../lib/rateLimit.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');
export const UPLOAD_ROOT = root;
for (const d of ['photos', 'voice']) fs.mkdirSync(path.join(root, d), { recursive: true });

const IMG = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/heic': '.heic', 'image/heif': '.heif', 'image/avif': '.avif' };
const AUD = { 'audio/webm': '.webm', 'video/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a', 'audio/x-m4a': '.m4a', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav' };

function uploader(kind, map) {
  return multer({
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    storage: multer.diskStorage({
      destination: (_req, _f, cb) => cb(null, path.join(root, kind)),
      filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + map[file.mimetype.split(';')[0]]),
    }),
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
  const up = uploader(kind, map);
  return [limit, (req, res, next) => up(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 400;
      return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "file")' });
    res.json({ url: `/uploads/${kind}/${req.file.filename}` });
  })];
}

router.post('/photo', ...handle('photos', IMG));
router.post('/voice', ...handle('voice', AUD));
export default router;
