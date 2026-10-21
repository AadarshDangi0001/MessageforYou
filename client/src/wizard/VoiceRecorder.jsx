import React, { useEffect, useRef, useState } from 'react';
import { haptic } from '../lib/motion.js';

const BARS = 28;
const supported = () =>
  typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && window.MediaRecorder;
const fmt = (s) => {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/** value: {blob, url, secs} | null */
export default function VoiceRecorder({ value, onChange, maxSeconds = 45 }) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [msg, setMsg] = useState('');
  const [playing, setPlaying] = useState(false);
  const mr = useRef(null), stream = useRef(null), timer = useRef(null), audio = useRef(null);
  const ac = useRef(null), raf = useRef(0), waveRef = useRef(null), levels = useRef(new Array(BARS).fill(0));

  function stopViz() {
    cancelAnimationFrame(raf.current);
    try { ac.current && ac.current.close(); } catch { /* */ }
    ac.current = null;
    levels.current = new Array(BARS).fill(0);
    waveRef.current?.querySelectorAll('i').forEach((b) => { b.style.height = ''; });
  }

  useEffect(() => () => {
    clearInterval(timer.current); stopViz();
    stream.current?.getTracks().forEach((t) => t.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startViz(s) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx(); ac.current = ctx;
      const an = ctx.createAnalyser(); an.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(an);
      const data = new Uint8Array(an.fftSize);
      let last = 0;
      const tick = (t) => {
        raf.current = requestAnimationFrame(tick);
        if (t - last < 70) return;
        last = t;
        an.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const lvl = Math.min(1, Math.sqrt(sum / data.length) * 4.5);
        const L = levels.current; L.shift(); L.push(lvl);
        const bars = waveRef.current?.children;
        if (bars) for (let i = 0; i < bars.length; i++) bars[i].style.height = `${4 + L[i] * 22}px`;
      };
      raf.current = requestAnimationFrame(tick);
    } catch { /* visualiser is optional */ }
  }

  async function start() {
    setMsg(''); haptic(15);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const r = new MediaRecorder(s);
      const chunks = [];
      const t0 = Date.now();
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = () => {
        clearInterval(timer.current); stopViz();
        s.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' });
        if (blob.size > 5 * 1024 * 1024) setMsg('That recording is too large. Try a shorter one.');
        else if (blob.size) onChange({ blob, url: URL.createObjectURL(blob), secs: Math.min(maxSeconds, (Date.now() - t0) / 1000) });
        setRec(false);
      };
      mr.current = r; r.start();
      setSecs(0); setRec(true);
      startViz(s);
      timer.current = setInterval(() => {
        const el = (Date.now() - t0) / 1000;
        setSecs(el);
        if (el >= maxSeconds) stop();
      }, 200);
    } catch {
      setMsg('We could not reach your microphone. Check the browser permission and try again, or skip this step.');
    }
  }
  function stop() { haptic(10); try { if (mr.current && mr.current.state !== 'inactive') mr.current.stop(); } catch { /* */ } }
  function remove() {
    audio.current?.pause();
    if (value) URL.revokeObjectURL(value.url);
    onChange(null); setPlaying(false);
  }
  function toggle() {
    const a = audio.current; if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  }

  if (!supported()) {
    return <p className="wz-hint" data-reveal>Your browser will not let a website record audio. Everything else works exactly the same, so just carry on.</p>;
  }

  const state = rec ? ' is-live' : value ? ' has-take' : '';
  return (
    <div className="wz-field" data-reveal>
      <div className={'wz-voice' + state + (playing ? ' is-playing' : '')}>
        {!value && (
          <button type="button" className={'wz-recbtn' + (rec ? ' is-live' : '')} onClick={rec ? stop : start}
            aria-label={rec ? 'Stop recording' : 'Record a voice note'}>
            <span className="wz-recdot" aria-hidden="true" />
            <span>{rec ? 'Stop' : 'Record'}</span>
          </button>
        )}
        {value && (
          <button type="button" className="wz-voiceplay" onClick={toggle} aria-label={playing ? 'Pause' : 'Play it back'}>
            {playing ? '❚❚' : '▶'}
          </button>
        )}
        <div className="wz-wave" ref={waveRef} aria-hidden="true">
          {Array.from({ length: BARS }, (_, i) => (
            <i key={i} style={{ '--i': i, height: value ? `${5 + ((i * 7 + 3) % 13) * 1.3}px` : undefined }} />
          ))}
        </div>
        <span className="wz-voicetime">
          {rec ? `${fmt(secs)} / ${fmt(maxSeconds)}` : value ? fmt(value.secs) : `up to ${maxSeconds}s`}
        </span>
        {value && (
          <button type="button" className="wz-voicex" onClick={remove} aria-label="Delete the voice note">×</button>
        )}
        {value && (
          <audio ref={audio} src={value.url} preload="metadata"
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
        )}
      </div>
      {msg && <p className="wz-err" role="alert">{msg}</p>}
      <p className="wz-hint">
        {value ? 'Saved. Play it back, or tap × to record again.' : 'Nothing is recorded until you tap Record, and you can delete it any time.'}
      </p>
    </div>
  );
}
