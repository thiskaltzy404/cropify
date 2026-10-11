'use client';
import { useState } from 'react';
import { Cfg, ACCENTS, Ix } from './kit';

type Act = {
  clearHist: () => void; clearRecent: () => void; clearLiked: () => void; clearPls: () => void;
  exportData: () => string; importData: (s: string) => boolean; reset: () => void;
};
type Props = {
  open: boolean; cfg: Cfg; set: (p: Partial<Cfg>) => void; onClose: () => void;
  counts: { liked: number; hist: number; recent: number; pls: number };
  sleepLabel: string; setSleep: (m: number) => void; notify: (m: string) => void; act: Act;
};

const Tg = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button className={'tgl ' + (on ? 'on' : '')} onClick={onClick} aria-pressed={on} />
);
const Item = ({ icon, title, sub, right, onClick }: { icon?: string; title: string; sub?: string; right?: any; onClick?: () => void }) => (
  <div className="sr" role={onClick ? 'button' : undefined} onClick={onClick}>
    {icon && <span className="si"><Ix n={icon} /></span>}
    <div className="st"><b>{title}</b>{sub && <span>{sub}</span>}</div>
    {right}
  </div>
);
const Sec = ({ title, children }: { title: string; children?: any }) => (<><div className="sh2">{title}</div><div className="sc">{children}</div></>);
const Opts = ({ v, list, onPick }: { v: any; list: [any, string][]; onPick: (x: any) => void }) => (
  <div className="chips wr" style={{ padding: '0 0 14px' }}>
    {list.map(([val, label]) => (
      <button key={String(val)} className={'chip ' + (v === val ? 'on' : '')} onClick={() => onPick(val)}>{label}</button>
    ))}
  </div>
);

export default function Settings({ open, cfg, set, onClose, counts, sleepLabel, setSleep, notify, act }: Props) {
  const [arm, setArm] = useState('');
  const [box, setBox] = useState(false);
  const [txt, setTxt] = useState('');

  // Tindakan berbahaya: ketuk dua kali untuk konfirmasi
  const danger = (key: string, fn: () => void) => () => {
    if (arm === key) { setArm(''); fn(); return; }
    setArm(key); notify('Ketuk sekali lagi untuk konfirmasi');
    setTimeout(() => setArm(''), 3000);
  };
  const doExport = async () => {
    const s = act.exportData();
    try { await navigator.clipboard.writeText(s); notify('Data disalin ke clipboard'); } catch { setTxt(s); setBox(true); notify('Salin manual dari kotak di bawah'); }
  };
  const doImport = () => {
    if (!txt.trim()) { notify('Tempel data cadangan dulu'); return; }
    if (act.importData(txt)) { notify('Data berhasil dipulihkan'); setBox(false); setTxt(''); } else notify('Data tidak valid');
  };
  const shareApp = async () => {
    const url = location.origin;
    try { if (navigator.share) { await navigator.share({ title: 'Cropify', text: 'Dengarkan musik gratis tanpa iklan di Cropify', url }); return; } } catch {}
    try { await navigator.clipboard.writeText(url); notify('Tautan Cropify disalin'); } catch { notify('Gagal menyalin tautan'); }
  };

  return (
    <div className={'set ' + (open ? 'o' : '')}>
      <div className="sh" style={{ marginBottom: 6 }}>
        <button className="ib" onClick={onClose}><Ix n="back" /></button>
        <h2 style={{ fontSize: 24, margin: 0 }}>Pengaturan</h2>
      </div>

      <Sec title="Profil">
        <div style={{ padding: '14px 0' }}>
          <label className="fl" style={{ margin: '0 0 6px' }}>Nama tampilan (muncul di sapaan Beranda)</label>
          <input className="fi" maxLength={24} value={cfg.name} placeholder="Nama kamu" onChange={(e) => set({ name: e.target.value })} />
        </div>
      </Sec>

      <Sec title="Tampilan">
        <div style={{ padding: '14px 0' }}>
          <div className="st"><b>Warna aksen</b><span>Warna tombol, sorotan, dan navigasi</span></div>
          <div className="sw">
            {ACCENTS.map(([n, hex]) => (
              <button key={hex} aria-label={n} className={cfg.accent === hex ? 'on' : ''} style={{ background: hex }} onClick={() => set({ accent: hex })} />
            ))}
          </div>
        </div>
        <Item icon="palette" title="Latar bergerak" sub="Gelembung warna di belakang halaman" right={<Tg on={cfg.blobs} onClick={() => set({ blobs: !cfg.blobs })} />} />
        <Item icon="speed" title="Animasi dan transisi" sub="Matikan untuk tampilan paling hemat baterai" right={<Tg on={cfg.motion} onClick={() => set({ motion: !cfg.motion })} />} />
        <Item icon="music" title="Cover berputar" sub="Cover lagu berputar di layar pemutar" right={<Tg on={cfg.spin} onClick={() => set({ spin: !cfg.spin })} />} />
      </Sec>

      <Sec title="Pemutaran">
        <div style={{ padding: '14px 0 6px' }}>
          <div className="sr" style={{ border: 0, padding: 0 }}>
            <span className="si"><Ix n="vol" /></span>
            <div className="st"><b>Volume</b><span>{cfg.vol}%</span></div>
          </div>
          <input type="range" className="rng" min={0} max={100} value={cfg.vol} onChange={(e) => set({ vol: +e.target.value })} />
        </div>
        <div style={{ padding: '10px 0 0' }}>
          <div className="st" style={{ marginBottom: 10 }}><b>Kecepatan putar</b><span>Berlaku untuk semua lagu</span></div>
          <Opts v={cfg.rate} list={[[0.75, '0.75x'], [1, 'Normal'], [1.25, '1.25x'], [1.5, '1.5x'], [2, '2x']]} onPick={(x) => set({ rate: x })} />
        </div>
        <Item icon="chev" title="Putar lagu berikutnya otomatis" sub="Lanjut ke lagu di antrean saat lagu selesai" right={<Tg on={cfg.autoNext} onClick={() => set({ autoNext: !cfg.autoNext })} />} />
        <Item icon="music" title="Acak sebagai bawaan" sub="Antrean langsung diacak" right={<Tg on={cfg.defShuffle} onClick={() => set({ defShuffle: !cfg.defShuffle })} />} />
        <div style={{ padding: '14px 0 0' }}>
          <div className="st" style={{ marginBottom: 10 }}><b>Mode ulang bawaan</b></div>
          <Opts v={cfg.defRepeat} list={[[0, 'Mati'], [1, 'Semua lagu'], [2, 'Satu lagu']]} onPick={(x) => set({ defRepeat: x })} />
        </div>
        <Item icon="clock" title="Lanjutkan lagu terakhir" sub="Saat dibuka, lagu terakhir siap diputar lagi" right={<Tg on={cfg.resume} onClick={() => set({ resume: !cfg.resume })} />} />
        <Item icon="info" title="Tampilkan lirik" sub="Lirik tersinkron di layar pemutar" right={<Tg on={cfg.lyrics} onClick={() => set({ lyrics: !cfg.lyrics })} />} />
        <Item icon="shield" title="Pemutaran latar belakang" sub="Menjaga lagu tetap jalan saat layar mati. Matikan jika boros baterai" right={<Tg on={cfg.bg} onClick={() => set({ bg: !cfg.bg })} />} />
        <div style={{ padding: '14px 0 0' }}>
          <div className="st" style={{ marginBottom: 10 }}><b>Timer tidur</b><span>Saat ini: {sleepLabel}</span></div>
          <Opts v={sleepLabel === 'Mati' ? 0 : -99} list={[[0, 'Mati'], [15, '15 menit'], [30, '30 menit'], [45, '45 menit'], [60, '1 jam'], [-1, 'Akhir lagu']]} onPick={(x) => setSleep(x)} />
        </div>
      </Sec>

      <Sec title="Pencarian dan riwayat">
        <Item icon="clock" title="Simpan riwayat putar" sub="Dipakai untuk bagian Baru diputar" right={<Tg on={cfg.saveHist} onClick={() => set({ saveHist: !cfg.saveHist })} />} />
        <Item icon="info" title="Simpan riwayat pencarian" right={<Tg on={cfg.saveSearch} onClick={() => set({ saveSearch: !cfg.saveSearch })} />} />
        <Item icon="user" title="Saran artis saat mencari" sub="Tampilkan baris artis di hasil pencarian" right={<Tg on={cfg.arts} onClick={() => set({ arts: !cfg.arts })} />} />
        <Item icon="trash" title="Hapus riwayat pencarian" sub={`${counts.recent} item`} onClick={danger('recent', act.clearRecent)} right={<Ix n="chev" />} />
        <Item icon="trash" title="Hapus riwayat putar" sub={`${counts.hist} lagu`} onClick={danger('hist', act.clearHist)} right={<Ix n="chev" />} />
      </Sec>

      <Sec title="Pustaka dan data">
        <Item icon="heart" title="Lagu disukai" sub={`${counts.liked} lagu`} onClick={danger('liked', act.clearLiked)} right={<span className="lnk">Hapus semua</span>} />
        <Item icon="music" title="Playlist buatanmu" sub={`${counts.pls} playlist`} onClick={danger('pls', act.clearPls)} right={<span className="lnk">Hapus semua</span>} />
        <Item icon="dl" title="Ekspor data" sub="Salin cadangan pengaturan, playlist, dan lagu disukai" onClick={doExport} right={<Ix n="chev" />} />
        <Item icon="ul" title="Impor data" sub="Pulihkan dari cadangan yang tadi disalin" onClick={() => setBox(!box)} right={<Ix n="chev" />} />
        {box && (
          <div style={{ padding: '4px 0 14px' }}>
            <textarea className="fi" rows={4} placeholder="Tempel data cadangan di sini" value={txt} onChange={(e) => setTxt(e.target.value)} />
            <button className="btn pri" style={{ width: '100%', marginTop: 10 }} onClick={doImport}><Ix n="check" /> Pulihkan data</button>
          </div>
        )}
        <Item icon="shield" title="Atur ulang pengaturan" sub="Kembalikan semua pilihan ke bawaan" onClick={danger('reset', act.reset)} right={<Ix n="chev" />} />
      </Sec>

      <Sec title="Tentang dan dukungan">
        <a className="sr" href="https://saweria.co/thiskaltzy404" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="si"><Ix n="coffee" /></span>
          <div className="st"><b>Traktir KALTZY404</b><span>Dukung lewat Saweria</span></div>
          <Ix n="chev" />
        </a>
        <Item icon="share" title="Bagikan Cropify" sub="Kirim tautan aplikasi ke temanmu" onClick={shareApp} right={<Ix n="chev" />} />
        <Item icon="info" title="Versi" sub="Cropify 1.0" />
        <Item icon="db" title="Data tersimpan di perangkat" sub="Pengaturan, playlist, dan riwayat disimpan di perangkat ini, bukan di server" />
        <Item icon="shield" title="Catatan" sub="Cropify adalah proyek belajar non-komersial. Lagu diputar lewat player YouTube." />
      </Sec>
      <div className="sub" style={{ textAlign: 'center', fontSize: 12, margin: '18px 0 0' }}>Dibuat dengan 💜 oleh KALTZY404</div>
    </div>
  );
}
