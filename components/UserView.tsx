'use client';
import { useRef, useState } from 'react';
import { Ix } from './kit';
import type { Prof } from './auth';
import { PF_CSS, ProfHeader, ProfInfo, ShareSheet } from './pfkit';

type Props = { prof: Prof | null; onClose: () => void; notify: (m: string) => void };

// Halaman profil publik milik pengguna lain (hasil pencarian atau link)
export default function UserView({ prof, onClose, notify }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [tab, setTab] = useState<'link' | 'qr'>('link');
  const last = useRef<Prof | null>(null);
  if (prof) last.current = prof;
  const p = prof || last.current;
  const name = p ? p.display_name || p.username || 'Pengguna' : '';

  return (
    <>
      <style>{PF_CSS}</style>
      <div className={'pfsheet nopad ' + (prof ? 'o' : '')}>
        {p && (
          <div style={{ margin: '0 -18px' }}>
            <ProfHeader prof={p} name={name} onBack={onClose}>
              <div className="pfact">
                <button className="btn" onClick={() => { setTab('link'); setShareOpen(true); }}><Ix n="share" /> Bagikan</button>
              </div>
            </ProfHeader>
            <div style={{ padding: '0 18px 30px' }}>
              <ProfInfo prof={p} onQr={() => { setTab('qr'); setShareOpen(true); }} />
              {p.genres && p.genres.length > 0 && (
                <>
                  <span className="pfsec">Genre favorit</span>
                  <div className="chips" style={{ flexWrap: 'wrap' }}>{p.genres.map((g) => <span key={g} className="chip on">{g}</span>)}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {p && <ShareSheet open={shareOpen && !!prof} tab={tab} setTab={setTab} onClose={() => setShareOpen(false)} prof={p} name={name} notify={notify} />}
    </>
  );
}
