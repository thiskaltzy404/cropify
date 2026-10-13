'use client';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Ix } from './kit';
import type { Prof } from './auth';

export const regionName = (c: string): string => {
  try { return new Intl.DisplayNames(['id'], { type: 'region' }).of(c) || c; } catch { return c; }
};
export const flagOf = (c: string): string => c.toUpperCase().replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
export const initials = (n: string): string => {
  const p = (n || '?').trim().split(/\s+/).slice(0, 2);
  return p.map((w) => (w ? w.charAt(0).toUpperCase() : '')).join('') || '?';
};
export const fmtMonth = (iso?: string): string => {
  try { return new Date(iso || '').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }); } catch { return ''; }
};
const hueOf = (s: string): number => [...(s || 'a')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

export const QrIc = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3M21 14v3M14 21h3M21 21h-1" />
  </svg>
);

export const PF_CSS = `
.pfh{position:relative;margin:-18px -18px 0;overflow:hidden;padding:calc(40px + env(safe-area-inset-top,0px)) 18px 22px;text-align:center}
.pfbg{position:absolute;inset:-50px;background-size:cover;background-position:center;filter:blur(32px) saturate(1.3) brightness(.78);transform:scale(1.2)}
.pfsh{position:absolute;inset:0;background:linear-gradient(180deg,#0003 0%,#0002 50%,var(--bg) 100%)}
.pfin{position:relative;z-index:1}
.pfback{position:absolute;z-index:2;left:12px;top:calc(12px + env(safe-area-inset-top,0px));width:42px;height:42px;border-radius:50%;background:#0006;display:grid;place-items:center;color:#fff}
.pfa{width:112px;height:112px;border-radius:50%;margin:0 auto 14px;overflow:hidden;background:#ffffff22;display:grid;place-items:center;font-size:40px;font-weight:800;box-shadow:0 14px 40px #0008;border:3px solid #ffffff30}
.pfa img{width:100%;height:100%;object-fit:cover;display:block}
.pfn{display:block;width:100%;text-align:center;font-size:27px;font-weight:800;margin:0;line-height:1.15;letter-spacing:-.5px}
.pfu{color:#ffffffbb;font-size:14px;margin-top:4px}
.pfact{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}
.pfact .btn{background:#00000055;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.pfinfo{background:var(--card);border-radius:22px;padding:4px 18px;margin-top:14px}
.pfr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid #ffffff12}
.pfr:last-child{border-bottom:none}
.pfr b{display:block;font-size:16px;font-weight:600;word-break:break-word;line-height:1.35}
.pfr span{font-size:13px;color:var(--mut)}
.pfq{color:var(--ac);padding:8px;flex:none}
.pfst{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0 4px}
.pfst div{background:var(--card);border-radius:18px;padding:12px 4px;text-align:center}
.pfst b{display:block;font-size:19px}
.pfst span{font-size:11px;color:var(--mut)}
.pfsec{margin:22px 0 10px;font-size:18px;font-weight:800;display:block}
.pfseg{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--card);padding:5px;border-radius:99px;margin-bottom:14px}
.pfseg button{padding:11px;border-radius:99px;font-size:13px;font-weight:700;color:var(--mut)}
.pfseg button.on{background:var(--ac);color:#111}
.pfl{font-size:12px;color:var(--mut);margin:14px 4px 6px;display:flex;justify-content:space-between}
.pfe{color:#ff7a90;font-size:13px;margin:10px 4px 0;line-height:1.4}
.pfok{color:var(--ac);font-size:13px;margin:10px 4px 0;line-height:1.4}
.pfeye{position:relative}
.pfeye button{position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:8px 10px;font-size:12px;font-weight:700;color:var(--mut)}
.pflink{display:block;margin:14px auto 0;color:var(--ac);font-size:13px;font-weight:700;text-align:center}
.pfsheet{position:absolute;inset:0;z-index:36;background:var(--bg);overflow-y:auto;padding:calc(18px + env(safe-area-inset-top,0px)) 18px 24px;transform:translateY(100%);visibility:hidden;transition:transform .5s cubic-bezier(.65,0,.2,1),visibility 0s .5s}
.pfsheet.o{transform:none;visibility:visible;transition:transform .5s cubic-bezier(.65,0,.2,1),visibility 0s}
.pfsheet.nopad{padding-top:0}
.pfbar{position:sticky;bottom:0;padding:14px 0 6px;background:linear-gradient(transparent,var(--bg) 35%);margin-top:10px}
.pfedav{display:flex;align-items:center;gap:16px;margin:8px 0 4px}
.pfedav .pfa{margin:0;width:88px;height:88px;font-size:32px;flex:none}
.pfsel{appearance:none;-webkit-appearance:none}
.pfcnt{font-size:11px;color:var(--mut)}
.pfrow2{display:flex;gap:10px;margin-top:10px}
.pfrow2 .btn{flex:1}
.pffol{display:flex;gap:8px;flex-wrap:wrap}
.pffol button{display:flex;gap:6px;align-items:center;background:var(--card);border-radius:99px;padding:8px 12px;font-size:13px;font-weight:600}
.pffol svg{width:14px;height:14px;color:var(--mut)}
.shb{position:absolute;inset:0;z-index:40;background:#000a;opacity:0;pointer-events:none;transition:opacity .3s}
.shb.o{opacity:1;pointer-events:auto}
.shp{position:absolute;left:0;right:0;bottom:0;z-index:41;background:#17131f;border-radius:26px 26px 0 0;padding:12px 18px calc(24px + env(safe-area-inset-bottom,0px));transform:translateY(105%);visibility:hidden;transition:transform .45s cubic-bezier(.65,0,.2,1),visibility 0s .45s}
.shp.o{transform:none;visibility:visible;transition:transform .45s cubic-bezier(.65,0,.2,1),visibility 0s}
.shp .hd{width:44px;height:5px;border-radius:9px;background:#ffffff33;margin:0 auto 14px}
.shp h3{font-size:19px;margin:0 0 14px;text-align:center}
.shq{background:#fff;border-radius:22px;padding:14px;width:min(70vw,280px);aspect-ratio:1;margin:6px auto 12px;display:grid;place-items:center}
.shq img{width:100%;display:block}
.shu{background:var(--card);border-radius:16px;padding:14px 16px;font-size:14px;word-break:break-all;color:#ffffffd0;margin-bottom:12px}
.shn{text-align:center;color:var(--mut);font-size:13px;margin:0 0 8px}
`;

type HeadProps = { prof: Prof; name: string; onBack?: () => void; children?: ReactNode };

export function ProfHeader({ prof, name, onBack, children }: HeadProps) {
  const h = hueOf(name);
  const bg = prof.avatar
    ? { backgroundImage: `url(${prof.avatar})` }
    : { background: `linear-gradient(160deg, hsl(${h},55%,34%), hsl(${(h + 50) % 360},50%,16%))` };
  return (
    <div className="pfh">
      <div className="pfbg" style={bg} />
      <div className="pfsh" />
      {onBack && <button className="pfback" onClick={onBack} aria-label="Kembali"><Ix n="back" /></button>}
      <div className="pfin">
        <div className="pfa">{prof.avatar ? <img src={prof.avatar} alt="" /> : initials(name)}</div>
        <h1 className="pfn">{name}</h1>
        {prof.username && <div className="pfu">@{prof.username}</div>}
        {children}
      </div>
    </div>
  );
}

export function ProfInfo({ prof, onQr }: { prof: Prof; onQr?: () => void }) {
  const rows: ReactNode[] = [];
  if (prof.bio) rows.push(<div key="bio" className="pfr"><div><b>{prof.bio}</b><span>Bio</span></div></div>);
  if (prof.username) {
    rows.push(
      <div key="un" className="pfr">
        <div><b>@{prof.username}</b><span>Username</span></div>
        {onQr && <button className="pfq" onClick={onQr} aria-label="Tampilkan kode QR"><QrIc /></button>}
      </div>,
    );
  }
  if (prof.country) rows.push(<div key="ct" className="pfr"><div><b>{flagOf(prof.country)} {regionName(prof.country)}</b><span>Negara</span></div></div>);
  if (prof.fav_artist) rows.push(<div key="fa" className="pfr"><div><b>{prof.fav_artist}</b><span>Artis favorit</span></div></div>);
  if (prof.created_at) rows.push(<div key="cr" className="pfr"><div><b>{fmtMonth(prof.created_at)}</b><span>Anggota sejak</span></div></div>);
  if (!rows.length) return null;
  return <div className="pfinfo">{rows}</div>;
}

type ShareProps = {
  open: boolean;
  tab: 'link' | 'qr';
  setTab: (t: 'link' | 'qr') => void;
  onClose: () => void;
  prof: Prof;
  name: string;
  notify: (m: string) => void;
};

export function ShareSheet({ open, tab, setTab, onClose, prof, name, notify }: ShareProps) {
  const [qr, setQr] = useState('');
  const url = typeof window !== 'undefined' && prof.username ? window.location.origin + '/?u=' + encodeURIComponent(prof.username) : '';

  useEffect(() => {
    if (!open || tab !== 'qr' || !url) return;
    let ok = true;
    (async () => {
      try {
        // @ts-ignore paket qrcode dimuat saat dibutuhkan
        const m: any = await import('qrcode');
        const f = m.toDataURL || (m.default && m.default.toDataURL);
        const d: string = await f(url, { width: 480, margin: 1, color: { dark: '#111111', light: '#ffffff' } });
        if (ok) setQr(d);
      } catch {
        if (ok) setQr('');
      }
    })();
    return () => { ok = false; };
  }, [open, tab, url]);

  const msg = 'Lihat profil ' + name + ' di Cropify';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify('Link disalin');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); notify('Link disalin'); } catch { notify('Salin manual: ' + url); }
      document.body.removeChild(ta);
    }
  };

  const share = async () => {
    const nav: any = navigator;
    if (nav.share) {
      try { await nav.share({ title: 'Cropify', text: msg, url }); } catch {}
    } else {
      copy();
    }
  };

  const ext = (u: string) => { window.open(u, '_blank'); };

  return (
    <>
      <div className={'shb ' + (open ? 'o' : '')} onClick={onClose} />
      <div className={'shp ' + (open ? 'o' : '')}>
        <div className="hd" />
        <h3>Bagikan profil</h3>
        {!url ? (
          <p className="shn">Atur username di Edit profil dulu supaya profilmu punya link.</p>
        ) : (
          <>
            <div className="pfseg">
              <button className={tab === 'link' ? 'on' : ''} onClick={() => setTab('link')}>Via link</button>
              <button className={tab === 'qr' ? 'on' : ''} onClick={() => setTab('qr')}>Via QR</button>
            </div>
            {tab === 'link' ? (
              <>
                <div className="shu">{url}</div>
                <div className="pfrow2" style={{ marginTop: 0 }}>
                  <button className="btn pri" onClick={copy}>Salin link</button>
                  <button className="btn" onClick={share}><Ix n="share" /> Bagikan</button>
                </div>
                <div className="pfrow2">
                  <button className="btn" onClick={() => ext('https://wa.me/?text=' + encodeURIComponent(msg + ' ' + url))}>WhatsApp</button>
                  <button className="btn" onClick={() => ext('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(msg))}>Telegram</button>
                </div>
              </>
            ) : (
              <>
                <div className="shq">
                  {qr ? <img src={qr} alt={'Kode QR untuk ' + url} /> : <div className="sk" style={{ width: '100%', height: '100%', borderRadius: 12 }} />}
                </div>
                <p className="shn">Pindai untuk membuka profil @{prof.username}</p>
                <button className="btn pri" style={{ width: '100%' }} onClick={copy}>Salin link</button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
