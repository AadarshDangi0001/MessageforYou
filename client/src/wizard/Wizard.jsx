import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import './wizard.css';
import Experience from '../experience/Experience.jsx';
import {
  OCCASIONS, KINDS, VIBES, SEALS, STICKERS, NOTE_SUGGESTIONS, PROMISE_SUGGESTIONS,
  FIRST_LINE_SUGGESTIONS, MONTHS, LIMITS,
} from '../config/options.js';
import { uploadPhoto, uploadVoice, createGift } from '../lib/api.js';
import { revealIn, reduced, haptic } from '../lib/motion.js';
import { compressImage, daysSince, loadDraft, saveDraft, clearDraft } from './helpers.js';
import VoiceRecorder from './VoiceRecorder.jsx';
import Summary from './Summary.jsx';
import ShareSheet from './ShareSheet.jsx';
import { Sugs, Chosen, Tiles, Vibes } from './ui.jsx';

const STEPS = 7;
const initial = {
  herName: '', yourName: '', firstLine: '',
  occasion: 'just', relation: 'gf', vibe: 'soft', sinceM: '', sinceY: '',
  notes: [], letter: '', seal: 'heart', sticker: 'love', promises: [],
};
const IDLE = { status: 'idle', url: '', error: '', for: null };

const A = ({ children }) => <span className="om-accent">{children}</span>;
function Head({ n, eyebrow, children, sub }) {
  return (
    <>
      {n && <p className="wz-eyebrow" data-reveal>Step {n} · {eyebrow}</p>}
      <h1 className="wz-h1" data-reveal>{children}</h1>
      {sub && <p className="wz-sub" data-reveal>{sub}</p>}
    </>
  );
}
function Nav({ label, canNext, onBack, onNext }) {
  return (
    <div className="wz-nav" data-reveal>
      <button type="button" className="wz-btn wz-btn-ghost wz-btn-back" onClick={onBack} aria-label="Back">←</button>
      <button type="button" className={'wz-btn wz-grow' + (canNext ? '' : ' is-off')} aria-disabled={!canNext} onClick={onNext}>{label}</button>
    </div>
  );
}
const focusNext = (id) => (e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById(id)?.focus(); } };

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [d, setD] = useState(() => ({ ...initial, ...loadDraft() }));
  const [photos, setPhotos] = useState([]); // {id,url,blob,caption,puzzle}
  const [voice, setVoice] = useState(null); // {blob,url,secs}
  const [err, setErr] = useState('');
  const [errKey, setErrKey] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [promiseText, setPromiseText] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [watched, setWatched] = useState(false);
  const [share, setShare] = useState(IDLE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const [busyPhotos, setBusyPhotos] = useState(false);
  const fileRef = useRef(null);
  const idRef = useRef(0);
  const bodyRef = useRef(null), stepRef = useRef(null);
  const anim = useRef({ busy: false, fromH: null, dir: 1 });

  const set = (patch) => { setErr(''); setD((p) => ({ ...p, ...patch })); };
  const fail = (m) => { setErr(m); setErrKey((k) => k + 1); haptic(25); };

  useEffect(() => { saveDraft(d); }, [d]);

  // Lock page scroll while the full-screen preview or the sheet is open
  useEffect(() => {
    if (!previewOpen && !sheetOpen) return;
    const b = document.body, h = document.documentElement;
    const prev = [b.style.overflow, h.style.overflow];
    b.style.overflow = 'hidden'; h.style.overflow = 'hidden';
    return () => { b.style.overflow = prev[0]; h.style.overflow = prev[1]; };
  }, [previewOpen, sheetOpen]);

  const since = useMemo(() => {
    const m = Number(d.sinceM), y = Number(d.sinceY);
    return m >= 1 && m <= 12 && y >= 1950 && y <= new Date().getFullYear() ? { month: m, year: y } : null;
  }, [d.sinceM, d.sinceY]);
  const days = since ? daysSince(since) : null;

  /* ---------- photos ---------- */
  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    const room = LIMITS.photos - photos.length;
    if (room <= 0) { fail(`You can add up to ${LIMITS.photos} photos.`); return; }
    setBusyPhotos(true); setErr('');
    const added = [];
    let bad = false;
    for (const f of files.slice(0, room)) {
      try {
        const blob = await compressImage(f);
        added.push({ id: ++idRef.current, blob, url: URL.createObjectURL(blob), caption: '', puzzle: false });
      } catch { bad = true; }
    }
    setBusyPhotos(false);
    setPhotos((p) => {
      const all = [...p, ...added];
      if (!all.some((x) => x.puzzle) && all.length) all[0] = { ...all[0], puzzle: true };
      return all;
    });
    if (bad) fail('One of the photos could not be read or is over 5MB.');
    else if (files.length > room) fail(`Only ${LIMITS.photos} photos fit, so the rest were skipped.`);
  }
  const patchPhoto = (id, patch) => setPhotos((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const setPuzzle = (id) => { haptic(10); setPhotos((p) => p.map((x) => ({ ...x, puzzle: x.id === id ? !x.puzzle : false }))); };
  function removePhoto(id) {
    setPhotos((p) => {
      const gone = p.find((x) => x.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      const rest = p.filter((x) => x.id !== id);
      if (rest.length && !rest.some((x) => x.puzzle)) rest[0] = { ...rest[0], puzzle: true };
      return rest;
    });
  }

  /* ---------- notes / promises ---------- */
  function addTo(key, max, len, t, clear) {
    const v = t.trim().slice(0, len);
    if (!v || d[key].includes(v)) return;
    if (d[key].length >= max) { fail(`Up to ${max} ${key}. Remove one to add another.`); return; }
    set({ [key]: [...d[key], v] }); clear && clear('');
  }
  const addNote = (t) => addTo('notes', LIMITS.notes, LIMITS.noteLen, t, setNoteText);
  const addPromise = (t) => addTo('promises', LIMITS.promises, LIMITS.promiseLen, t, setPromiseText);
  const drop = (key, v) => set({ [key]: d[key].filter((x) => x !== v) });

  /* ---------- validation / nav ---------- */
  function validate(s) {
    if (s === 1) {
      if (!d.herName.trim()) return 'Tell us her name first.';
      if (!d.yourName.trim()) return 'And your name, so she knows who it is from.';
      if (!d.firstLine.trim()) return 'Write the first line she will read, or tap one below.';
    }
    if (s === 3 && photos.length < 1) return busyPhotos ? 'Hang on, still shrinking your photos…' : 'Add at least one photo.';
    if (s === 4) {
      if (!d.notes.length) return 'Add at least one note. Tap a suggestion above.';
      if (!d.letter.trim()) return 'Write her a few words in the letter.';
    }
    if (s === 6 && !d.promises.length) return 'Pick at least one promise. Tap a suggestion above.';
    return '';
  }

  function go(to) {
    const a = anim.current;
    if (a.busy || to === step || to < 1 || to > STEPS) return;
    setErr('');
    a.dir = to > step ? 1 : -1;
    a.fromH = bodyRef.current ? bodyRef.current.offsetHeight : null;
    if (reduced() || !stepRef.current) { setStep(to); return; }
    a.busy = true;
    gsap.to(stepRef.current, {
      x: -42 * a.dir, opacity: 0, duration: .26, ease: 'power2.in',
      onComplete: () => setStep(to),
    });
  }
  function next() {
    const e = validate(step);
    if (e) { fail(e); return; }
    haptic(12);
    go(step + 1);
  }
  const back = () => go(step - 1);

  // Incoming step: slide in from the side, animate the card height, stagger children
  useLayoutEffect(() => {
    const a = anim.current, body = bodyRef.current, el = stepRef.current;
    const fromH = a.fromH; a.fromH = null;
    if (fromH == null) { revealIn(el); return; } // first mount
    const top = body.getBoundingClientRect().top + window.scrollY - 24;
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' });
    if (reduced()) { a.busy = false; return; }
    const toH = body.offsetHeight;
    gsap.fromTo(body, { height: fromH, overflow: 'hidden' },
      { height: toH, duration: .5, ease: 'power3.inOut', clearProps: 'height,overflow' });
    gsap.fromTo(el, { x: 46 * a.dir, opacity: 0 },
      { x: 0, opacity: 1, duration: .5, ease: 'power3.out', clearProps: 'transform,opacity', onComplete: () => { a.busy = false; } });
    revealIn(el, '[data-reveal]', { delay: .08, duration: .6 });
    // safety: never leave the wizard stuck if a tween is killed
    const t = setTimeout(() => { a.busy = false; }, 900);
    return () => clearTimeout(t);
  }, [step]);

  /* ---------- gift ---------- */
  const gift = useMemo(() => ({
    herName: d.herName.trim(), yourName: d.yourName.trim(), firstLine: d.firstLine.trim(),
    occasion: d.occasion, relation: d.relation, vibe: d.vibe, since,
    photos: photos.map((p) => ({ url: p.url, caption: p.caption.trim(), puzzle: p.puzzle })),
    notes: d.notes, letter: d.letter.trim(), seal: d.seal, sticker: d.sticker,
    voiceUrl: voice ? voice.url : null, promises: d.promises,
  }), [d, photos, voice, since]);

  async function makeLink() {
    const forGift = gift;
    setShare({ status: 'busy', url: '', error: '', for: null, voice: !!voice });
    try {
      const ph = [];
      for (const p of photos) ph.push({ url: await uploadPhoto(p.blob), caption: p.caption.trim(), puzzle: p.puzzle });
      const voiceUrl = voice ? await uploadVoice(voice.blob) : null;
      const { slug } = await createGift({ ...forGift, photos: ph, voiceUrl });
      clearDraft();
      setShare({ status: 'done', url: `${location.origin}/g/${slug}`, error: '', for: forGift });
    } catch (e) {
      setShare({ status: 'error', url: '', error: e.message || 'Something went wrong.', for: null });
    }
  }

  function openPreview() { haptic(15); setPreviewKey((k) => k + 1); setPreviewOpen(true); }
  function closePreview() { setPreviewOpen(false); setWatched(true); }
  // Finale's "Create the link for {her} →" calls onDone: create the gift and show the sheet
  function onPreviewDone() {
    setPreviewOpen(false); setWatched(true);
    setSheetOpen(true);
    if (!(share.status === 'done' && share.for === gift)) makeLink();
  }
  function createAnother() {
    clearDraft();
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    if (voice) URL.revokeObjectURL(voice.url);
    setD({ ...initial }); setPhotos([]); setVoice(null); setShare(IDLE); setSheetOpen(false); setWatched(false);
    setNoteText(''); setPromiseText('');
    anim.current.busy = false;
    go(1);
  }

  const years = Array.from({ length: 31 }, (_, i) => new Date().getFullYear() - i);
  const canNext = !validate(step);
  const linkReady = share.status === 'done' && share.for === gift;

  const errEl = err ? <p key={errKey} className="wz-err" role="alert">{err}</p> : null;
  const navEl = (label = 'Next →') => <Nav label={label} canNext={canNext} onBack={back} onNext={next} />;
  const her = d.herName.trim();

  function renderStep() {
    switch (step) {
      case 1: return (
        <>
          <Head><>Make The Best <A>GIFT</A> She Will Remember Forever</></Head>
          <form className="wz-form" onSubmit={(e) => { e.preventDefault(); next(); }}>
            <div className="wz-field" data-reveal>
              <label className="wz-label" htmlFor="wz-her">Her name</label>
              <input id="wz-her" className="wz-input" value={d.herName} maxLength={LIMITS.nameLen} autoComplete="off"
                onChange={(e) => set({ herName: e.target.value })} placeholder="e.g. Ananya" enterKeyHint="next" onKeyDown={focusNext('wz-you')} />
            </div>
            <div className="wz-field" data-reveal>
              <label className="wz-label" htmlFor="wz-you">Your name</label>
              <input id="wz-you" className="wz-input" value={d.yourName} maxLength={LIMITS.nameLen} autoComplete="off"
                onChange={(e) => set({ yourName: e.target.value })} placeholder="e.g. Rohan" enterKeyHint="next" onKeyDown={focusNext('wz-first')} />
            </div>
            <div className="wz-field" data-reveal>
              <label className="wz-label" htmlFor="wz-first">The first thing she reads</label>
              <input id="wz-first" className="wz-input" value={d.firstLine} maxLength={LIMITS.firstLine} autoComplete="off"
                onChange={(e) => set({ firstLine: e.target.value })} placeholder="I was thinking about you." enterKeyHint="go" />
              <Sugs items={FIRST_LINE_SUGGESTIONS} isOn={(s) => d.firstLine === s} onPick={(s) => set({ firstLine: s })} />
            </div>
            {errEl}
            <div data-reveal>
              <button type="submit" className={'wz-btn wz-cta' + (canNext ? '' : ' is-off')} aria-disabled={!canNext}>Start building →</button>
            </div>
          </form>
        </>
      );

      case 2: return (
        <>
          <Head n={2} eyebrow="The two of you" sub="Any day works. This just sets the words she opens it with.">
            <>What is this <A>for</A>?</>
          </Head>
          <div data-reveal><Tiles items={OCCASIONS} value={d.occasion} onPick={(id) => set({ occasion: id })} /></div>
          <div className="wz-field wz-gap" data-reveal>
            <p className="wz-label">And what is <b className="wz-name">{her || 'she'}</b> to you?</p>
            <Tiles items={KINDS} value={d.relation} onPick={(id) => set({ relation: id })} />
          </div>
          <div className="wz-field wz-gap" data-reveal>
            <p className="wz-label">And how are you two together? <small>— this sets the colours.</small></p>
            <Vibes items={VIBES} value={d.vibe} onPick={(id) => set({ vibe: id })} />
          </div>
          <div className="wz-field wz-gap" data-reveal>
            <label className="wz-label" htmlFor="wz-since-m">When did you two get together? <small>— optional. We’ll count every day for her.</small></label>
            <div className="wz-duo">
              <select id="wz-since-m" className="wz-input wz-select" value={d.sinceM} aria-label="Month you got together"
                onChange={(e) => set({ sinceM: e.target.value })}>
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select className="wz-input wz-select" value={d.sinceY} aria-label="Year you got together"
                onChange={(e) => set({ sinceY: e.target.value })}>
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <p className={'wz-hint wz-days' + (days != null ? ' is-on' : '')} key={days ?? 'none'}>
              {days != null ? <>That’s <b>{days.toLocaleString()}</b> days together 💕</> : ' '}
            </p>
          </div>
          {errEl}{navEl()}
        </>
      );

      case 3: return (
        <>
          <Head n={3} eyebrow="Your photos"
            sub={`Up to ${LIMITS.photos} of you two. Each one gets a caption, and one of them turns into a puzzle she has to put back together.`}>
            <>Add your favourite <A>photos</A>.</>
          </Head>
          {photos.length < LIMITS.photos && (
            <div data-reveal>
              <div className={'wz-drop' + (drag ? ' is-over' : '') + (busyPhotos ? ' is-busy' : '')} role="button" tabIndex={0}
                aria-label="Add photos"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fileRef.current?.click())}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}>
                <div className="wz-drop-ic" aria-hidden="true">{busyPhotos ? '⏳' : '📸'}</div>
                <div className="wz-drop-t">{busyPhotos ? 'Shrinking your photos…' : <>Tap to add photos, or <b>drop them here</b></>}</div>
                <div className="wz-drop-s">JPG or PNG · {photos.length}/{LIMITS.photos} added · we shrink them for you</div>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          {photos.length > 0 && (
            <ul className="wz-shots">
              {photos.map((p, i) => (
                <li key={p.id} className={'wz-shot' + (p.puzzle ? ' is-pz' : '')}>
                  <div className="wz-shot-media">
                    <img className="wz-shot-img" src={p.url} alt={p.caption || `Photo ${i + 1}`} />
                    <span className="wz-shot-n">{i + 1}</span>
                    <button type="button" className="wz-shot-x" onClick={() => removePhoto(p.id)} aria-label={`Remove photo ${i + 1}`}>×</button>
                    <button type="button" className="wz-shot-pz" aria-pressed={p.puzzle} onClick={() => setPuzzle(p.id)}>
                      🧩 {p.puzzle ? 'Puzzle ✓' : 'Puzzle'}
                    </button>
                  </div>
                  <input className="wz-shot-cap" value={p.caption} maxLength={60} placeholder="Add a caption…"
                    aria-label={`Caption for photo ${i + 1}`} onChange={(e) => patchPhoto(p.id, { caption: e.target.value })} />
                </li>
              ))}
            </ul>
          )}
          {photos.length > 0 && (
            <p className="wz-hint">Tap <b>🧩 Puzzle</b> on a photo to choose which one she puts back together. It is a gentle 9-piece one, and she can always skip it.</p>
          )}
          {errEl}{navEl()}
        </>
      );

      case 4: return (
        <>
          <Head n={4} eyebrow="Your words" sub="Two things: a few reasons, and the letter.">
            <>Now the part only <A>you</A> can write.</>
          </Head>
          <div className="wz-field" data-reveal>
            <p className="wz-label">1 · What you love about her <small>— tap up to {LIMITS.notes}. She opens each note one by one.</small></p>
            <Chosen items={d.notes} onRemove={(n) => drop('notes', n)} />
            <Sugs items={NOTE_SUGGESTIONS} isUsed={(s) => d.notes.includes(s)} onPick={addNote} />
            <form className="wz-addrow" onSubmit={(e) => { e.preventDefault(); addNote(noteText); }}>
              <input className="wz-input" value={noteText} maxLength={LIMITS.noteLen} placeholder="Write your own…"
                aria-label="Write your own note" onChange={(e) => setNoteText(e.target.value)} />
              <button type="submit" className="wz-btn wz-btn-plum wz-btn-sm">Add</button>
            </form>
          </div>
          <div className="wz-field wz-gap" data-reveal>
            <label className="wz-label" htmlFor="wz-letter">2 · Your love letter <small>— it arrives sealed, so she has to break the wax to read it.</small></label>
            <textarea id="wz-letter" className="wz-input wz-textarea" rows={6} maxLength={LIMITS.letter} value={d.letter}
              placeholder={`Dear ${her || 'you'}, three years in and you still make me nervous in the best way…`}
              onChange={(e) => set({ letter: e.target.value })} />
            <div className={'wz-count' + (d.letter.length >= LIMITS.letter ? ' is-max' : '')}>{d.letter.length} / {LIMITS.letter}</div>
          </div>
          <div className="wz-field" data-reveal>
            <p className="wz-minilabel">The wax seal she breaks</p>
            <Tiles items={SEALS} value={d.seal} onPick={(id) => set({ seal: id })} small labelled={false} />
          </div>
          <div className="wz-field" data-reveal>
            <p className="wz-minilabel">A sticker for the letter</p>
            <Tiles items={STICKERS} value={d.sticker} onPick={(id) => set({ sticker: id })} small labelled={false} />
          </div>
          {errEl}{navEl()}
        </>
      );

      case 5: return (
        <>
          <Head n={5} eyebrow="Your voice"
            sub="Optional — but it is the one thing a typed letter can never do. She hears it inside the envelope, right under your letter.">
            <>Say it <A>out loud</A>.</>
          </Head>
          <VoiceRecorder value={voice} onChange={setVoice} maxSeconds={LIMITS.voiceSeconds} />
          {navEl()}
        </>
      );

      case 6: return (
        <>
          <Head n={6} eyebrow="Her turn" sub="She ticks each one near the end of the walk, then it seals.">
            <>The things you’ll <A>keep doing</A>.</>
          </Head>
          <div className="wz-field" data-reveal>
            <p className="wz-label">Your promises <small>— pick up to {LIMITS.promises}, or write your own.</small></p>
            <Chosen items={d.promises} onRemove={(n) => drop('promises', n)} />
            <Sugs items={PROMISE_SUGGESTIONS} isUsed={(s) => d.promises.includes(s)} onPick={addPromise} />
            <form className="wz-addrow" onSubmit={(e) => { e.preventDefault(); addPromise(promiseText); }}>
              <input className="wz-input" value={promiseText} maxLength={LIMITS.promiseLen} placeholder="Write your own promise…"
                aria-label="Write your own promise" onChange={(e) => setPromiseText(e.target.value)} />
              <button type="submit" className="wz-btn wz-btn-plum wz-btn-sm">Add</button>
            </form>
          </div>
          {errEl}{navEl('See how it looks →')}
        </>
      );

      default: return (
        <>
          <Head n={7} eyebrow="Have a look" sub={`Try it yourself first. This is exactly what ${her || 'she'} will see.`}>
            <>It’s <A>ready</A>.</>
          </Head>
          <Summary gift={gift} hasVoice={!!voice} />
          <div className="wz-final" data-reveal>
            <button type="button" className="wz-btn wz-cta" onClick={openPreview}>
              {watched ? '👀 Walk through it again' : '👀 See What You Made'}
            </button>
            {linkReady && (
              <button type="button" className="wz-btn wz-btn-plum" onClick={() => setSheetOpen(true)}>🔗 Show her link</button>
            )}
            <button type="button" className="wz-btn wz-btn-ghost" onClick={() => go(6)}>← Change something</button>
          </div>
        </>
      );
    }
  }

  return (
    <div className="wz-root" data-vibe={d.vibe}>
      <div className="wz-bg" aria-hidden="true" />
      <main className="wz-shell">
        <p className="wz-brand">message<b>for</b>you</p>
        <div className="wz-card">
          <div className="wz-dots" role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step}>
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={'wz-dot' + (i + 1 < step ? ' is-done' : i + 1 === step ? ' is-on' : '')} />
            ))}
          </div>
          <div className="wz-body" ref={bodyRef}>
            <section className="wz-step" ref={stepRef} key={step} aria-live="polite">
              {renderStep()}
            </section>
          </div>
        </div>
        <p className="wz-foot">messageforyou · free · no sign up · made with ♥</p>
      </main>

      {previewOpen && (
        <Experience key={previewKey} gift={gift} preview onExit={closePreview} onDone={onPreviewDone} />
      )}
      {sheetOpen && share.status !== 'idle' && (
        <ShareSheet share={share} herName={her} yourName={d.yourName.trim()}
          onClose={() => setSheetOpen(false)} onRetry={makeLink} onAnother={createAnother} />
      )}
    </div>
  );
}
