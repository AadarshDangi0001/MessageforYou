async function json(res) {
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

async function upload(path, blob, name) {
  const fd = new FormData();
  fd.append('file', blob, name);
  const data = await json(await fetch(path, { method: 'POST', body: fd }));
  return data.url;
}

export const uploadPhoto = (blob) => upload('/api/uploads/photo', blob, 'photo.' + (blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'));
export const uploadVoice = (blob) => upload('/api/uploads/voice', blob, 'voice.' + (/mp4|aac/.test(blob.type) ? 'm4a' : /ogg/.test(blob.type) ? 'ogg' : 'webm'));

export async function createGift(gift) {
  return json(await fetch('/api/gifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gift) }));
}
export async function getGift(slug) {
  return json(await fetch('/api/gifts/' + encodeURIComponent(slug)));
}
export async function visit(slug) {
  return json(await fetch(`/api/gifts/${encodeURIComponent(slug)}/visit`, { method: 'POST' }));
}
