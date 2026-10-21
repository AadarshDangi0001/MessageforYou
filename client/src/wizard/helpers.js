import { LIMITS } from '../config/options.js';
const KEY = 'om_wizard_draft_v1';

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function saveDraft(d) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* ignore */ }
}
export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function daysSince({ month, year }) {
  const start = new Date(year, month - 1, 1);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
}

function toBlob(canvas, type, q) {
  return new Promise((res) => canvas.toBlob(res, type, q));
}

// shrink to max 800px, WebP (fallback JPEG) q0.8, must end <= 5MB
export async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const scale = Math.min(1, LIMITS.photoMaxDim / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    let blob = await toBlob(c, 'image/webp', 0.8);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(c, 'image/jpeg', 0.8);
    if (!blob || blob.size > LIMITS.photoMaxBytes) throw new Error('too big');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
