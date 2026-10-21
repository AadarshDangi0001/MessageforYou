// The free backend sleeps when idle and takes up to a minute to wake. While it wakes, the proxy answers
// 502/503/504 or the request fails outright, so retry those for ~75s before giving up.
const RETRY_STATUS = new Set([502, 503, 504]);
async function request(path, opts) {
  const deadline = Date.now() + 75000;
  for (let wait = 1500; ; wait = Math.min(wait * 1.6, 8000)) {
    try {
      const res = await fetch(path, opts);
      if (!RETRY_STATUS.has(res.status) || Date.now() + wait > deadline) return res;
    } catch (e) {
      if (Date.now() + wait > deadline) throw new Error('Could not reach the server. Check your connection and try again.');
    }
    await new Promise((r) => setTimeout(r, wait));
  }
}

/** Fire-and-forget ping so the sleeping backend starts waking while the visitor is still reading. */
export function warmUp() { fetch('/api/health', { cache: 'no-store' }).catch(() => {}); }

async function json(res) {
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

async function upload(path, blob, name) {
  const fd = new FormData();
  fd.append('file', blob, name);
  const data = await json(await request(path, { method: 'POST', body: fd }));
  return data.url;
}

export const uploadPhoto = (blob) => upload('/api/uploads/photo', blob, 'photo.' + (blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'));
export const uploadVoice = (blob) => upload('/api/uploads/voice', blob, 'voice.' + (/mp4|aac/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm'));

export async function createGift(gift) {
  return json(await request('/api/gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gift) }));
}
export async function getGift(slug) {
  return json(await request('/api/gifts/' + encodeURIComponent(slug)));
}
export async function visit(slug) {
  return json(await fetch(`/api/gifts/${encodeURIComponent(slug)}/visit`, { method: 'POST' }));
}
