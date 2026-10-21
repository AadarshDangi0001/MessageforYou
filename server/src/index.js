import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import giftsRouter from './routes/gifts.js';
import uploadsRouter, { serveUpload } from './routes/uploads.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.get('/uploads/:kind/:name', (req, res, next) => mongoose.connection.readyState === 1 ? serveUpload(req, res, next) : res.status(503).end());

app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));
app.use('/api/uploads', uploadsRouter);
app.use('/api/gifts', (req, res, next) => mongoose.connection.readyState === 1 ? next() : res.status(503).json({ error: 'Database unavailable' }), giftsRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`server on :${port}`));

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ourmoments';
async function connect() {
  try { await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); console.log('mongo connected'); }
  catch (e) { console.error('mongo connect failed, retrying in 5s:', e.message); setTimeout(connect, 5000); }
}
connect();
