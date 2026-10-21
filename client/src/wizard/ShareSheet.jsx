import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { burst, reduced, haptic } from '../lib/motion.js';

/** Success bottom-sheet (phones) / modal (desktop) with the shareable link. */
export default function ShareSheet({ share, herName, yourName, onClose, onRetry, onAnother }) {
  const backRef = useRef(null), cardRef = useRef(null), partyRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const closing = useRef(false);

  useLayoutEffect(() => {
    if (reduced()) return;
    const tl = gsap.timeline();
    tl.fromTo(backRef.current, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power1.out' })
      .fromTo(cardRef.current, { yPercent: 110, opacity: .6 }, { yPercent: 0, opacity: 1, duration: .7, ease: 'expo.out' }, 0);
    return () => tl.kill();
  }, []);

  // Celebrate once the link exists
  useEffect(() => {
    if (share.status !== 'done') return;
    haptic(30);
    const host = backRef.current;
    const opts = { glyphs: ['🎉', '✦', '♥', '🎊', '❀'], count: 26, colors: ['#E23B67', '#F0A93B', '#FF9DBA', '#B23A76', '#7C5CE0'] };
    burst(host, { ...opts, x: '50%', y: '38%' });
    const t = setTimeout(() => { burst(host, { ...opts, x: '22%', y: '48%', count: 14 }); burst(host, { ...opts, x: '78%', y: '48%', count: 14 }); }, 260);
    if (!reduced() && partyRef.current) {
      gsap.fromTo(partyRef.current, { scale: .2, rotate: -40, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: .8, ease: 'back.out(2.4)' });
    }
    const items = cardRef.current?.querySelectorAll('[data-in]');
    if (items && !reduced()) gsap.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .06, ease: 'power3.out', delay: .15 });
    return () => clearTimeout(t);
  }, [share.status]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (closing.current || share.status === 'busy') return;
    closing.current = true;
    if (reduced()) { onClose(); return; }
    gsap.to(cardRef.current, { yPercent: 110, duration: .4, ease: 'power3.in' });
    gsap.to(backRef.current, { opacity: 0, duration: .4, delay: .1, onComplete: onClose });
  }

  async function copy() {
    try { await navigator.clipboard.writeText(share.url); }
    catch {
      const t = document.createElement('textarea'); t.value = share.url; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch { /* */ }
      t.remove();
    }
    haptic(12); setCopied(true); setTimeout(() => setCopied(false), 1800);
  }
  const text = `${yourName || 'Someone'} made something for you 💌 ${share.url}`;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="wz-sheet-back" ref={backRef} onClick={(e) => e.target === backRef.current && close()}>
      <div className="wz-sheet" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="wz-sheet-h">
        <span className="wz-sheet-grip" aria-hidden="true" />
        {share.status !== 'busy' && (
          <button type="button" className="wz-sheet-x" onClick={close} aria-label="Close">×</button>
        )}

        {share.status === 'busy' && (
          <div className="wz-sheet-busy">
            <div className="wz-wreath" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</div>
            <h2 id="wz-sheet-h" className="wz-sheet-h">Wrapping it up…</h2>
            <p className="wz-sheet-s">Uploading your photos{share.voice ? ' and your voice' : ''} and making her link.</p>
          </div>
        )}

        {share.status === 'error' && (
          <>
            <div className="wz-sheet-party" aria-hidden="true">😕</div>
            <h2 id="wz-sheet-h" className="wz-sheet-h">Hmm, that did not work</h2>
            <p className="wz-err" role="alert">{share.error}</p>
            <button type="button" className="wz-btn" onClick={onRetry}>Try again</button>
          </>
        )}

        {share.status === 'done' && (
          <>
            <div className="wz-sheet-party" ref={partyRef} aria-hidden="true">🎉</div>
            <h2 id="wz-sheet-h" className="wz-sheet-h" data-in>Her museum is <span className="om-accent">open</span>!</h2>
            <p className="wz-sheet-s" data-in>Send this to {herName || 'her'}. It is free, forever.</p>
            <div className="wz-share-row" data-in>
              <span className="wz-share-url" title={share.url}>{share.url.replace(/^https?:\/\//, '')}</span>
              <button type="button" className={'wz-share-copy' + (copied ? ' is-copied' : '')} onClick={copy}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div className="wz-share-btns" data-in>
              <a className="wz-btn wz-btn-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
              {canShare ? (
                <button type="button" className="wz-btn wz-btn-plum"
                  onClick={() => navigator.share({ title: 'A gift for you', text, url: share.url }).catch(() => {})}>📤 Share</button>
              ) : (
                <button type="button" className="wz-btn wz-btn-plum" onClick={copy}>{copied ? 'Copied ✓' : '🔗 Copy link'}</button>
              )}
              <a className="wz-btn wz-btn-ghost" href={share.url} target="_blank" rel="noreferrer">👀 Preview</a>
              <button type="button" className="wz-btn wz-btn-ghost" onClick={onAnother}>🎁 Create another gift</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
