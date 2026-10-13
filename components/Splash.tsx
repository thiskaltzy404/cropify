'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: '600', display: 'swap' });

const SOUND = true; // ganti ke false kalau mau splash tanpa suara
const BARS: number[][] = [[29.941, 45.818, 5.577, 11.0], [38.943, 40.455, 5.577, 21.273], [48.141, 32.727, 6.751, 35.455], [58.904, 39.364, 6.067, 22.727], [68.787, 45.818, 5.479, 11.0]]; // [left, top, width, height] dalam % dari gambar C
const WORD = ['r', 'o', 'p', 'i', 'f', 'y'];

const CSS = `
.sp-root{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#0d0b12;transition:opacity .5s ease;user-select:none;-webkit-user-select:none}
.sp-fade{opacity:0;pointer-events:none}
.sp-lockup{--H:clamp(60px,min(20vw,16vh),190px);display:flex;align-items:center;gap:calc(var(--H)*.07)}
.sp-logo{position:relative;z-index:2;flex:none;height:var(--H);width:calc(var(--H)*1022/1100)}
.sp-logo img{position:absolute;display:block;opacity:0;pointer-events:none}
.sp-c{left:0;top:0;width:100%;height:100%}
.sp-glow{position:absolute;left:50%;top:50%;width:260%;height:260%;transform:translate(-50%,-50%);z-index:-1;pointer-events:none;opacity:0;
 background:radial-gradient(circle,rgba(148,64,255,.32),rgba(200,255,72,.08) 42%,transparent 68%)}
.sp-word{position:relative;z-index:1;display:flex;font-weight:600;font-size:calc(var(--H)*.95);line-height:1;letter-spacing:.01em;clip-path:inset(-.4em -.6em -.4em 0)}
.sp-word span{display:inline-block;opacity:0;color:transparent;-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text;
 background-image:linear-gradient(90deg,#c8ff48,#b9d97a 25%,#b080ff 55%,#9440ff);background-size:600% 100%;background-position:calc(var(--n)*20%) 0}
`;

function sfx(c: AudioContext) {
  const t = c.currentTime + 0.03;
  const out = c.createGain();
  const comp = c.createDynamicsCompressor();
  out.gain.value = 0.6;
  out.connect(comp);
  comp.connect(c.destination);
  const n = (c.sampleRate * 1.2) | 0;
  const nb = c.createBuffer(1, n, c.sampleRate);
  const d = nb.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const env = (g: GainNode, at: number, dur: number, v: number, a = 0.004) => {
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.linearRampToValueAtTime(v, t + at + a);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
  };
  const osc = (f1: number, f2: number, at: number, dur: number, v: number, a = 0.004, type: OscillatorType = 'sine') => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t + at);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    env(g, at, dur, v, a);
    o.connect(g);
    g.connect(out);
    o.start(t + at);
    o.stop(t + at + dur + 0.05);
  };
  const bell = (f: number, at: number, dur: number, v: number) => {
    osc(f, f, at, dur, v, 0.004);
    osc(f * 2.76, f * 2.76, at, dur * 0.35, v * 0.12, 0.002);
  };
  const whoosh = (at: number, dur: number, f1: number, f2: number, v: number) => {
    const s = c.createBufferSource();
    const fl = c.createBiquadFilter();
    const g = c.createGain();
    s.buffer = nb;
    fl.type = 'bandpass';
    fl.Q.value = 0.9;
    fl.frequency.setValueAtTime(f1, t + at);
    fl.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.linearRampToValueAtTime(v, t + at + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
    s.connect(fl);
    fl.connect(g);
    g.connect(out);
    s.start(t + at);
    s.stop(t + at + dur + 0.05);
  };
  // C muncul: pop bulat + sub halus
  osc(520, 170, 0.1, 0.22, 0.4, 0.006);
  osc(90, 60, 0.1, 0.5, 0.3, 0.02);
  // bar tumbuh dari tengah (A pentatonik)
  bell(659, 0.6, 0.8, 0.2);
  bell(554, 0.72, 0.8, 0.17);
  bell(740, 0.72, 0.8, 0.17);
  bell(440, 0.84, 0.9, 0.17);
  bell(880, 0.84, 0.9, 0.14);
  // C mengecil dan bergeser
  whoosh(1.45, 0.75, 500, 2600, 0.2);
  osc(140, 70, 1.45, 0.6, 0.25, 0.05);
  // huruf r-o-p-i-f-y
  [659, 740, 880, 988, 1109, 1319].forEach((f, i) => bell(f, 1.75 + i * 0.075, 0.45, 0.1));
  // akord penutup
  [220, 330, 440].forEach((f) => osc(f, f, 2.2, 2.2, 0.1, 0.25));
  bell(1760, 2.25, 1.2, 0.05);
}

export default function Splash() {
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'on' | 'fade' | 'off'>('on');

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setState('off');
      return;
    }
    const logo = el.querySelector('.sp-logo') as HTMLElement;
    const glow = el.querySelector('.sp-glow') as HTMLElement;
    const cimg = el.querySelector('.sp-c') as HTMLElement;
    const bars = Array.from(el.querySelectorAll('.sp-bar')) as HTMLElement[];
    const letters = Array.from(el.querySelectorAll('.sp-word span')) as HTMLElement[];

    const anims: Animation[] = [];
    const A = (target: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => {
      const a = target.animate(kf, { fill: 'both', ...o });
      anims.push(a);
      return a;
    };

    const vr = el.getBoundingClientRect();
    const r = logo.getBoundingClientRect();
    const dx = vr.left + vr.width / 2 - (r.left + r.width / 2);
    const dy = vr.top + vr.height / 2 - (r.top + r.height / 2);
    const S = Math.min(vr.width * 0.6, vr.height * 0.4) / r.height;

    A(cimg, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 600, delay: 100, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const delays = [840, 720, 600, 720, 840];
    const amp = [0.62, 0.5, 0.4, 0.5, 0.62];
    bars.forEach((b, i) => {
      A(b, [{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 520, delay: delays[i], easing: 'cubic-bezier(.34,1.56,.64,1)' });
      A(b, [{ transform: 'scaleY(1)' }, { transform: `scaleY(${amp[i]})` }, { transform: 'scaleY(1)' }], { duration: 1100, delay: 1300 + i * 90, iterations: Infinity, easing: 'ease-in-out', fill: 'none' });
    });
    A(glow, [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0.45 }], { duration: 2200, delay: 200 });
    A(logo, [{ transform: `translate(${dx}px,${dy}px) scale(${S})` }, { transform: 'translate(0,0) scale(1)' }], { duration: 750, delay: 1450, easing: 'cubic-bezier(.65,0,.25,1)' });
    letters.forEach((l, i) =>
      A(l, [{ opacity: 0, transform: 'translateX(-.7em)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, delay: 1750 + i * 75, easing: 'cubic-bezier(.2,.8,.2,1)' }),
    );

    // suara: hanya diputar kalau browser mengizinkan (di web/PWA butuh interaksi dulu)
    let ctx: AudioContext | null = null;
    if (SOUND) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) {
          ctx = new AC() as AudioContext;
          const c = ctx;
          c.resume().then(() => { if (c.state === 'running') sfx(c); }).catch(() => {});
        }
      } catch {}
    }

    const t1 = setTimeout(() => setState('fade'), 3300);
    const t2 = setTimeout(() => setState('off'), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      anims.forEach((a) => a.cancel());
      ctx?.close().catch(() => {});
    };
  }, []);

  if (state === 'off') return null;
  return (
    <div ref={root} className={`sp-root ${outfit.className}${state === 'fade' ? ' sp-fade' : ''}`} aria-hidden="true">
      <style>{CSS}</style>
      <div className="sp-lockup">
        <div className="sp-logo">
          <div className="sp-glow" />
          <img className="sp-c" src="/splash/c.png" alt="" draggable={false} />
          {BARS.map((b, i) => (
            <img
              key={i}
              className="sp-bar"
              src={`/splash/bar${i + 1}.png`}
              alt=""
              draggable={false}
              style={{ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` }}
            />
          ))}
        </div>
        <div className="sp-word">
          {WORD.map((ch, i) => (
            <span key={i} style={{ '--n': i } as CSSProperties}>{ch}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
