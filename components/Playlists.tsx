'use client';
import { useEffect, useState } from 'react';
import { T, Pl, Ix, fileToCover, uid, ytThumb } from './kit';
import { Ic } from '../lib/icons';

const HUES = [265, 330, 15, 45, 150, 190, 215, 300];

export function PlCover({ p }: { p: Pl }) {
  return (
    <div className="pcv" style={{ '--h': p.hue } as any}>
      {p.cover ? <img src={p.cover} alt="" /> : <span>{(p.name.trim()[0] || '♪').toUpperCase()}</span>}
    </div>
  );
}

/* Buat / ubah playlist: nama, deskripsi, sampul (logo), privat atau publik */
export function PlSheet({ open, init, onSave, onDelete, onClose }: {
  open: boolean; init?: Pl; onSave: (p: Pl) => void; onDelete: () => void; onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cover, setCover] = useState('');
  const [pub, setPub] = useState(false);
  const [hue, setHue] = useState(265);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(init?.name ?? ''); setDesc(init?.desc ?? ''); setCover(init?.cover ?? '');
    setPub(init?.pub ?? false); setHue(init?.hue ?? HUES[Math.floor(Math.random() * HUES.length)]); setErr('');
  }, [open, init?.id]);

  const pick = async (f?: File | null) => {
    if (!f) return;
    setBusy(true); setErr('');
    try { setCover(await fileToCover(f)); } catch { setErr('Gambar tidak bisa dibaca'); }
    setBusy(false);
  };
  const save = () => {
    const n = name.trim();
    if (!n) { setErr('Beri nama playlist dulu'); return; }
    onSave({ id: init?.id ?? uid(), name: n.slice(0, 60), desc: desc.trim().slice(0, 300), cover, pub, hue, tracks: init?.tracks ?? [], at: init?.at ?? Date.now() });
  };
  const preview: Pl = { id: 'x', name: name || '♪', desc: '', cover, pub, hue, tracks: [], at: 0 };

  return (
    <div className={'ov ' + (open ? 'o' : '')} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{init ? 'Ubah playlist' : 'Playlist baru'}</h3>
        <div className="cvp">
          <div className="pc2"><PlCover p={preview} /></div>
          <div style={{ flex: 1 }}>
            <label className="btn" style={{ cursor: 'pointer' }}>
              <Ix n="img" /> {busy ? 'Memproses…' : cover ? 'Ganti logo' : 'Unggah logo'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {cover && <button className="btn" style={{ marginTop: 8, width: '100%' }} onClick={() => setCover('')}><Ix n="x" /> Hapus logo</button>}
          </div>
        </div>

        {!cover && (<>
          <label className="fl">Warna sampul</label>
          <div className="hues">
            {HUES.map((h) => (
              <button key={h} className={h === hue ? 'on' : ''} style={{ background: `hsl(${h},70%,52%)` }} onClick={() => setHue(h)} />
            ))}
          </div>
        </>)}

        <label className="fl">Nama playlist</label>
        <input className="fi" placeholder="Misalnya: Teman begadang" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <label className="fl">Deskripsi (opsional)</label>
        <textarea className="fi" rows={3} maxLength={300} placeholder="Ceritakan suasana playlist ini" value={desc} onChange={(e) => setDesc(e.target.value)} />

        <label className="fl">Privasi</label>
        <div className="seg">
          <button className={!pub ? 'on' : ''} onClick={() => setPub(false)}><Ix n="lock" /> Privat</button>
          <button className={pub ? 'on' : ''} onClick={() => setPub(true)}><Ix n="globe" /> Publik</button>
        </div>
        <div className="sub" style={{ margin: '8px 2px 0', fontSize: 12 }}>
          {pub ? 'Publik: bisa dibagikan lewat tautan, dan siapa pun yang punya tautan bisa mendengarkan.' : 'Privat: hanya tersimpan di perangkat ini.'}
        </div>
        {err && <div className="sub" style={{ color: '#ff6b81', margin: '10px 2px 0' }}>{err}</div>}

        <div className="sa">
          {init ? <button className="btn dng" onClick={onDelete}><Ix n="trash" /> Hapus</button> : <button className="btn" onClick={onClose}>Batal</button>}
          <button className="btn pri" onClick={save}><Ix n="check" /> Simpan</button>
        </div>
      </div>
    </div>
  );
}

/* Tambahkan satu lagu ke playlist yang dipilih */
export function AddSheet({ open, t, pls, onToggle, onNew, onClose }: {
  open: boolean; t?: T; pls: Pl[]; onToggle: (id: string, t: T) => void; onNew: () => void; onClose: () => void;
}) {
  return (
    <div className={'ov ' + (open ? 'o' : '')} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>Tambahkan ke playlist</h3>
        {t && <div className="sub" style={{ margin: '-6px 0 12px' }}>{t.title} • {t.artist}</div>}
        <button className="btn pri" style={{ width: '100%', marginBottom: 10 }} onClick={onNew}><Ix n="plus" /> Playlist baru</button>
        {pls.length === 0 && <div className="er">Belum ada playlist.</div>}
        {pls.map((p) => {
          const has = !!t && p.tracks.some((x) => x.id === t.id);
          return (
            <div key={p.id} role="button" className="row" onClick={() => t && onToggle(p.id, t)}>
              <div className="th"><PlCover p={p} /></div>
              <div className="m"><b>{p.name}</b><span>{p.tracks.length} lagu • {p.pub ? 'Publik' : 'Privat'}</span></div>
              <span className={'rp ' + (has ? 'on3' : '')}>{has ? <Ix n="check" /> : <Ix n="plus" />}</span>
            </div>
          );
        })}
        <div className="sa" style={{ gridTemplateColumns: '1fr' }}><button className="btn" onClick={onClose}>Selesai</button></div>
      </div>
    </div>
  );
}

/* Cari lagu lalu ketuk untuk memasukkannya ke playlist */
export function PickSheet({ open, pl, onAdd, onRemove, onClose }: {
  open: boolean; pl?: Pl; onAdd: (t: T) => void; onRemove: (id: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<T[]>([]);
  const [ld, setLd] = useState(false);
  useEffect(() => { if (!open) { setQ(''); setRes([]); } }, [open]);
  useEffect(() => {
    if (!open || !q.trim()) { setRes([]); return; }
    setLd(true);
    const id = setTimeout(async () => {
      try { const d = await (await fetch('/api/search?q=' + encodeURIComponent(q))).json(); setRes(d.tracks || []); } catch { setRes([]); }
      setLd(false);
    }, 450);
    return () => clearTimeout(id);
  }, [q, open]);
  const has = (id: string) => !!pl?.tracks.some((x) => x.id === id);

  return (
    <div className={'ov ' + (open ? 'o' : '')} onClick={onClose}>
      <div className="sheet" style={{ minHeight: '70%' }} onClick={(e) => e.stopPropagation()}>
        <h3>Tambah lagu{pl ? ` ke "${pl.name}"` : ''}</h3>
        <div className="srch" style={{ margin: '0 0 8px' }}>
          <Ic n="search" />
          <input placeholder="Cari judul lagu atau artis" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {ld ? <div className="er">Mencari…</div> : res.length ? res.map((t) => (
          <div key={t.id} role="button" className="row" onClick={() => (has(t.id) ? onRemove(t.id) : onAdd(t))}>
            <div className="th"><img src={t.thumb || ytThumb(t.id)} alt="" loading="lazy" /></div>
            <div className="m"><b>{t.title}</b><span>{t.artist}</span></div>
            <span className={'rp ' + (has(t.id) ? 'on3' : '')}>{has(t.id) ? <Ix n="check" /> : <Ix n="plus" />}</span>
          </div>
        )) : <div className="er">{q.trim() ? 'Tidak ditemukan' : 'Ketik untuk mencari lagu'}</div>}
        <div className="sa" style={{ gridTemplateColumns: '1fr' }}><button className="btn pri" onClick={onClose}>Selesai ({pl?.tracks.length ?? 0} lagu)</button></div>
      </div>
    </div>
  );
}

/* Playlist yang dibagikan orang lain lewat tautan */
export function ImportSheet({ open, p, onSave, onPlay, onClose }: {
  open: boolean; p?: Pl; onSave: (p: Pl) => void; onPlay: (p: Pl) => void; onClose: () => void;
}) {
  return (
    <div className={'ov ' + (open ? 'o' : '')} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>Playlist dibagikan</h3>
        {p && (<>
          <div className="pdh">
            <div className="pcz"><PlCover p={p} /></div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{p.name}</h2>
              <div className="sub" style={{ margin: 0 }}>{p.tracks.length} lagu</div>
            </div>
          </div>
          {p.desc && <div className="sub">{p.desc}</div>}
          <div className="sa">
            <button className="btn" onClick={() => onSave(p)}><Ix n="plus" /> Simpan</button>
            <button className="btn pri" onClick={() => onPlay(p)}><Ic n="play" /> Putar</button>
          </div>
        </>)}
        <div className="sa" style={{ gridTemplateColumns: '1fr', marginTop: 10 }}><button className="btn" onClick={onClose}>Tutup</button></div>
      </div>
    </div>
  );
}

/* Halaman isi playlist */
export function PlDetail({ p, curId, playing, onBack, onPlay, onAll, onEdit, onAdd, onRemove, onMove, onShare }: {
  p: Pl; curId?: string; playing: boolean; onBack: () => void; onPlay: (i: number) => void; onAll: (shuf: boolean) => void;
  onEdit: () => void; onAdd: () => void; onRemove: (i: number) => void; onMove: (i: number, d: number) => void; onShare: () => void;
}) {
  const [ed, setEd] = useState(false);
  return (
    <div className="view" key={'pd' + p.id}>
      <div className="sh">
        <button className="ib" onClick={onBack}><Ix n="back" /></button>
        <h2 style={{ fontSize: 20, margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h2>
        <button className="ib" onClick={onEdit}><Ix n="edit" /></button>
      </div>
      <div className="pdh rise">
        <div className="pcz"><PlCover p={p} /></div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{p.name}</h2>
          <div className="sub" style={{ margin: '0 0 8px' }}>{p.tracks.length} lagu</div>
          <span className="bdg"><Ix n={p.pub ? 'globe' : 'lock'} /> {p.pub ? 'Publik' : 'Privat'}</span>
        </div>
      </div>
      {p.desc && <div className="sub" style={{ marginBottom: 10 }}>{p.desc}</div>}
      <div className="ab">
        <button className="big" onClick={() => onAll(false)}><Ic n="play" /> Putar</button>
        <button className="big alt" onClick={() => onAll(true)}><Ic n="shuf" /> Acak</button>
      </div>
      <div className="ab" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 4 }}>
        <button className="btn" onClick={onAdd}><Ix n="plus" /> Tambah</button>
        <button className={'btn ' + (ed ? 'pri' : '')} onClick={() => setEd(!ed)}><Ix n="edit" /> Atur</button>
        <button className="btn" onClick={onShare}><Ix n="share" /> Bagikan</button>
      </div>
      {p.tracks.length === 0 && <div className="er">Belum ada lagu. Tekan Tambah untuk mencari dan memilih lagu.</div>}
      {p.tracks.map((t, i) => (
        <div key={t.id + i} role="button" className={'row ' + (curId === t.id && playing ? 'cur' : '')} onClick={() => { if (!ed) onPlay(i); }}>
          <div className="th"><img src={t.thumb || ytThumb(t.id)} alt="" loading="lazy" /></div>
          <div className="m"><b>{t.title}</b><span>{t.artist}</span></div>
          {ed && (<>
            <button className="rp sm" onClick={(e) => { e.stopPropagation(); onMove(i, -1); }}><Ix n="up" /></button>
            <button className="rp sm" onClick={(e) => { e.stopPropagation(); onMove(i, 1); }}><Ix n="dn" /></button>
            <button className="rp sm" onClick={(e) => { e.stopPropagation(); onRemove(i); }}><Ix n="x" /></button>
          </>)}
        </div>
      ))}
    </div>
  );
}
