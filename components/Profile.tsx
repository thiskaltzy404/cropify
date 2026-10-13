'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Ic } from '../lib/icons';
import { Ix, Cfg, Pl, T } from './kit';
import {
  authReady, Session, Prof, getSession, validToken, signIn, signUp, signOut, updateUser, recover,
  fetchProfile, saveProfile, usernameTaken, saveBackup, loadBackup, backupInfo,
} from './auth';
import { PF_CSS, ProfHeader, ProfInfo, ShareSheet, regionName, flagOf, initials } from './pfkit';

type Props = {
  cfg: Cfg;
  setName: (n: string) => void;
  liked: T[];
  hist: T[];
  pls: Pl[];
  follows: string[];
  unfollow: (n: string) => void;
  act: { exportData: () => string; importData: (s: string) => boolean };
  notify: (m: string) => void;
  play: (t: T) => void;
};

type Form = { dn: string; un: string; bio: string; country: string; avatar: string; genres: string[]; fav: string };

const GENRES = ['Pop', 'Rock', 'Indie', 'Hip Hop', 'R&B', 'Jazz', 'Dangdut', 'Koplo', 'Akustik', 'Lo-fi', 'EDM', 'K-Pop', 'J-Pop', 'Religi', 'Keroncong', 'Metal', 'Reggae', 'Klasik'];
const CODES = 'ID MY SG BN TH VN PH TL KH LA MM JP KR CN TW HK MO IN PK BD LK NP AE SA QA KW BH OM JO LB EG MA DZ TN NG GH KE ET ZA TR IL IR IQ RU UA PL CZ HU RO GR DE FR ES PT IT NL BE CH AT SE NO DK FI IE IS GB US CA MX BR AR CL CO PE VE AU NZ'.split(' ');

const ago = (iso: string): string => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
  return Math.floor(s / 86400) + ' hari lalu';
};

async function toAvatar(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Gambar tidak bisa dibaca'));
      i.src = url;
    });
    const s = Math.min(img.width, img.height);
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    if (!g) throw new Error('Gambar tidak bisa diproses');
    g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}


export default function Profile({ cfg, setName, liked, hist, pls, follows, unfollow, act, notify, play }: Props) {
  const [state, setState] = useState<'boot' | 'out' | 'load' | 'in' | 'err'>('boot');
  const [sess, setSess] = useState<Session | null>(null);
  const [prof, setProf] = useState<Prof | null>(null);
  const [loadErr, setLoadErr] = useState('');

  // form login/daftar
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [dname, setDname] = useState('');
  const [uname, setUname] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  // edit profil
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<Form>({ dn: '', un: '', bio: '', country: '', avatar: '', genres: [], fav: '' });
  const [formErr, setFormErr] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  // akun
  const [acct, setAcct] = useState<'' | 'email' | 'pass'>('');
  const [aEmail, setAEmail] = useState('');
  const [aPw, setAPw] = useState('');
  const [aPw2, setAPw2] = useState('');
  const [aErr, setAErr] = useState('');

  // bagikan
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState<'link' | 'qr'>('link');

  // cadangan
  const [bkAt, setBkAt] = useState<string | null>(null);
  const [arm, setArm] = useState('');

  const load = async (syncName = false) => {
    if (!authReady || !getSession()) { setState('out'); return; }
    setState('load');
    const t = await validToken();
    const s = getSession();
    if (!t || !s) { setSess(null); setState('out'); return; }
    setSess(s);
    try {
      const uid: string = s.user.id;
      let p = await fetchProfile(uid);
      if (!p) {
        const m = s.user.user_metadata || {};
        p = await saveProfile(uid, { display_name: m.display_name || cfg.name, username: m.username || null });
      }
      setProf(p);
      if (syncName && p.display_name) setName(p.display_name);
      setState('in');
      backupInfo(uid).then(setBkAt).catch(() => {});
    } catch (e: any) {
      setLoadErr(e && e.message ? e.message : 'Gagal memuat profil');
      setState('err');
    }
  };

  useEffect(() => { load(); }, []);

  // ---------- Masuk / daftar ----------
  const submit = async () => {
    setErr('');
    setInfo('');
    const em = email.trim().toLowerCase();
    const un = uname.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) { setErr('Format email tidak valid'); return; }
    if (pw.length < 6) { setErr('Password minimal 6 karakter'); return; }
    if (mode === 'up') {
      if (dname.trim().length < 2) { setErr('Nama tampilan minimal 2 karakter'); return; }
      if (!/^[a-z0-9_.]{3,20}$/.test(un)) { setErr('Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah'); return; }
      if (pw !== pw2) { setErr('Konfirmasi password tidak sama'); return; }
    }
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(em, pw);
        await load(true);
        notify('Berhasil masuk');
      } else {
        if (await usernameTaken(un)) throw new Error('Username sudah dipakai');
        const r = await signUp(em, pw, { display_name: dname.trim(), username: un });
        if (r.session) {
          try { await saveProfile(r.session.user.id, { display_name: dname.trim(), username: un }); } catch {}
          setName(dname.trim());
          await load();
          notify('Akun dibuat, selamat datang!');
        } else {
          setMode('in');
          setPw('');
          setPw2('');
          setInfo('Kami mengirim email konfirmasi ke ' + em + '. Buka emailnya, lalu masuk di sini.');
        }
      }
    } catch (e: any) {
      setErr(e && e.message ? e.message : 'Terjadi kesalahan');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setErr('');
    setInfo('');
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em)) { setErr('Isi email dulu di kolom email'); return; }
    setBusy(true);
    try {
      await recover(em);
      setInfo('Tautan atur ulang password dikirim ke ' + em);
    } catch (e: any) {
      setErr(e && e.message ? e.message : 'Gagal mengirim email');
    } finally {
      setBusy(false);
    }
  };

  const logout = async (everywhere: boolean) => {
    await signOut(everywhere);
    setSess(null);
    setProf(null);
    setPw('');
    setState('out');
    notify(everywhere ? 'Keluar dari semua perangkat' : 'Berhasil keluar');
  };

  // ---------- Edit profil ----------
  const openEdit = () => {
    if (!prof) return;
    setForm({
      dn: prof.display_name || '',
      un: prof.username || '',
      bio: prof.bio || '',
      country: prof.country || '',
      avatar: prof.avatar || '',
      genres: prof.genres || [],
      fav: prof.fav_artist || '',
    });
    setFormErr('');
    setEditOpen(true);
  };

  const pickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const a = await toAvatar(f);
      setForm((x) => ({ ...x, avatar: a }));
    } catch (er: any) {
      setFormErr(er && er.message ? er.message : 'Gagal memuat foto');
    }
  };

  const toggleGenre = (g: string) =>
    setForm((x) => {
      if (x.genres.indexOf(g) >= 0) return { ...x, genres: x.genres.filter((y) => y !== g) };
      if (x.genres.length >= 6) return x;
      return { ...x, genres: [...x.genres, g] };
    });

  const saveEdit = async () => {
    if (!sess) return;
    const dn = form.dn.trim();
    const un = form.un.trim().toLowerCase();
    if (dn.length < 2 || dn.length > 30) { setFormErr('Nama tampilan 2-30 karakter'); return; }
    if (un && !/^[a-z0-9_.]{3,20}$/.test(un)) { setFormErr('Username 3-20 karakter: huruf kecil, angka, titik, atau garis bawah'); return; }
    setBusy(true);
    setFormErr('');
    try {
      const uid: string = sess.user.id;
      if (un && un !== (prof && prof.username) && (await usernameTaken(un, uid))) throw new Error('Username sudah dipakai');
      const p = await saveProfile(uid, {
        display_name: dn,
        username: un || null,
        bio: form.bio.trim() || null,
        country: form.country || null,
        avatar: form.avatar || null,
        genres: form.genres,
        fav_artist: form.fav.trim() || null,
      });
      setProf(p);
      setName(dn);
      setEditOpen(false);
      notify('Profil disimpan');
    } catch (e: any) {
      setFormErr(e && e.message ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Akun ----------
  const saveAcct = async () => {
    setAErr('');
    try {
      if (acct === 'email') {
        const em = aEmail.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(em)) { setAErr('Format email tidak valid'); return; }
        setBusy(true);
        await updateUser({ email: em });
        setAcct('');
        setAEmail('');
        notify('Cek email barumu untuk konfirmasi');
      } else if (acct === 'pass') {
        if (aPw.length < 6) { setAErr('Password minimal 6 karakter'); return; }
        if (aPw !== aPw2) { setAErr('Konfirmasi password tidak sama'); return; }
        setBusy(true);
        await updateUser({ password: aPw });
        setAcct('');
        setAPw('');
        setAPw2('');
        notify('Password diperbarui');
      }
    } catch (e: any) {
      setAErr(e && e.message ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Cadangan ----------
  const confirm = (key: string, fn: () => void) => () => {
    if (arm === key) { setArm(''); fn(); return; }
    setArm(key);
    notify('Ketuk sekali lagi untuk konfirmasi');
    setTimeout(() => setArm(''), 3000);
  };

  const doBackup = async () => {
    if (!sess) return;
    setBusy(true);
    try {
      await saveBackup(sess.user.id, act.exportData());
      setBkAt(new Date().toISOString());
      notify('Data dicadangkan ke akunmu');
    } catch (e: any) {
      notify(e && e.message ? e.message : 'Gagal mencadangkan');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    if (!sess) return;
    setBusy(true);
    try {
      const b = await loadBackup(sess.user.id);
      if (!b) notify('Belum ada cadangan di akunmu');
      else if (act.importData(b.data)) notify('Data berhasil dipulihkan');
      else notify('Cadangan tidak valid');
    } catch (e: any) {
      notify(e && e.message ? e.message : 'Gagal memulihkan');
    } finally {
      setBusy(false);
    }
  };

  // ---------- Statistik dari riwayat ----------
  const tally: Record<string, { n: number; thumb: string }> = {};
  hist.forEach((t) => {
    const a = (t.artist || '').split(',')[0].trim();
    if (!a) return;
    if (!tally[a]) tally[a] = { n: 0, thumb: t.thumb };
    tally[a].n += 1;
  });
  const tops = Object.keys(tally).map((k) => ({ name: k, n: tally[k].n, thumb: tally[k].thumb })).sort((a, b) => b.n - a.n).slice(0, 6);

  const countries = CODES.map((c) => ({ c, n: regionName(c) })).sort((a, b) => a.n.localeCompare(b.n, 'id'));

  // ================= TAMPILAN =================
  if (state === 'boot' || state === 'load') {
    return (
      <>
        <style>{PF_CSS}</style>
        <div className="view" key="pfv">
          <div aria-busy="true" aria-label="Memuat">
            <div className="sk" style={{ height: 250, borderRadius: 26, margin: '0 0 16px' }} />
            <div className="pfst">{[0, 1, 2, 3].map((i) => <div key={i} className="sk" style={{ height: 62, background: 'var(--card)' }} />)}</div>
            <div className="sk skh" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="skr">
                <div className="sk skth" />
                <div className="skm"><div className="sk skl" style={{ width: '70%' }} /><div className="sk skl" style={{ width: '45%' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (state === 'err') {
    return (
      <>
        <style>{PF_CSS}</style>
        <div className="view" key="pfv">
          <div className="er" style={{ paddingTop: 80 }}>{loadErr}</div>
          <div className="pfrow2">
            <button className="btn pri" onClick={() => load()}>Coba lagi</button>
            <button className="btn" onClick={() => logout(false)}>Keluar</button>
          </div>
        </div>
      </>
    );
  }

  if (state === 'out') {
    return (
      <>
        <style>{PF_CSS}</style>
        <div className="view" key="pfv">
          <div className="hero rise">
            <div className="cup"><Ic n="user" /></div>
            <span className="hb h1"><Ic n="heart" /></span><span className="hb h2"><Ic n="heart" /></span><span className="hb h3"><Ic n="heart" /></span>
          </div>
          <h2 className="rise" style={{ justifyContent: 'center', fontSize: 27, margin: '6px 0 4px', animationDelay: '.1s' }}>
            {mode === 'in' ? 'Masuk ke Cropify' : 'Buat akun Cropify'}
          </h2>
          <p className="sub rise" style={{ textAlign: 'center', maxWidth: 310, margin: '0 auto 18px', animationDelay: '.15s' }}>
            Simpan profil, playlist, dan lagu favoritmu di satu akun, lalu pakai di perangkat mana saja.
          </p>

          {!authReady ? (
            <div className="pk rise" style={{ animationDelay: '.2s' }}>
              <div className="pi"><Ic n="block" /></div>
              <div><b>Fitur akun belum diaktifkan</b><span>Pemilik aplikasi perlu menghubungkan Supabase. Langkahnya ada di SUPABASE_SETUP.md.</span></div>
            </div>
          ) : (
            <div className="rise" style={{ animationDelay: '.2s' }}>
              <div className="pfseg">
                <button className={mode === 'in' ? 'on' : ''} onClick={() => { setMode('in'); setErr(''); setInfo(''); }}>Masuk</button>
                <button className={mode === 'up' ? 'on' : ''} onClick={() => { setMode('up'); setErr(''); setInfo(''); }}>Daftar</button>
              </div>

              {mode === 'up' && (
                <>
                  <label className="pfl"><span>Nama tampilan</span></label>
                  <input className="fi" placeholder="Nama kamu" maxLength={30} value={dname} onChange={(e) => setDname(e.target.value)} />
                  <label className="pfl"><span>Username</span></label>
                  <input className="fi" placeholder="huruf kecil, angka, . atau _" maxLength={20} autoCapitalize="none" autoCorrect="off" value={uname} onChange={(e) => setUname(e.target.value.toLowerCase())} />
                </>
              )}

              <label className="pfl"><span>Email</span></label>
              <input className="fi" type="email" inputMode="email" placeholder="nama@email.com" autoCapitalize="none" autoCorrect="off" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label className="pfl"><span>Password</span></label>
              <div className="pfeye">
                <input className="fi" type={showPw ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'in') submit(); }} />
                <button type="button" onClick={() => setShowPw(!showPw)}>{showPw ? 'Sembunyikan' : 'Lihat'}</button>
              </div>

              {mode === 'up' && (
                <>
                  <label className="pfl"><span>Ulangi password</span></label>
                  <input className="fi" type={showPw ? 'text' : 'password'} placeholder="Ketik ulang password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
                </>
              )}

              {err && <div className="pfe">{err}</div>}
              {info && <div className="pfok">{info}</div>}

              <button className="big" disabled={busy} onClick={submit} style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}>
                <Ic n="user" /> {busy ? 'Memproses…' : mode === 'in' ? 'Masuk' : 'Buat akun'}
              </button>
              {mode === 'in' && <button className="pflink" onClick={forgot}>Lupa password?</button>}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <div className="pk"><div className="pi"><Ic n="user" /></div><div><b>Profil milikmu sendiri</b><span>Foto, bio, negara, dan genre favorit</span></div></div>
            <div className="pk"><div className="pi"><Ic n="server" /></div><div><b>Cadangan di cloud</b><span>Playlist dan lagu disukai aman di akunmu</span></div></div>
            <div className="pk"><div className="pi"><Ic n="spark" /></div><div><b>Pindah perangkat dengan mudah</b><span>Masuk, lalu pulihkan semua datamu</span></div></div>
          </div>
        </div>
      </>
    );
  }

  // ----- state === 'in' -----
  const p: Prof = prof || { id: '' };
  const name = p.display_name || cfg.name;
  const recent = hist.slice(0, 5);

  return (
    <>
      <style>{PF_CSS}</style>
      <div className="view" key="pfv">
        <ProfHeader prof={p} name={name}>
          <div className="pfact">
            <button className="btn" onClick={openEdit}><Ix n="user" /> Edit profil</button>
            <button className="btn" onClick={() => { setShareTab('link'); setShareOpen(true); }}><Ix n="share" /> Bagikan</button>
          </div>
        </ProfHeader>

        <ProfInfo prof={p} onQr={() => { setShareTab('qr'); setShareOpen(true); }} />

        <div className="pfst">
          <div><b>{liked.length}</b><span>Disukai</span></div>
          <div><b>{pls.length}</b><span>Playlist</span></div>
          <div><b>{hist.length}</b><span>Riwayat</span></div>
          <div><b>{follows.length}</b><span>Mengikuti</span></div>
        </div>

        {p.genres && p.genres.length > 0 && (
          <>
            <span className="pfsec">Genre favorit</span>
            <div className="chips" style={{ flexWrap: 'wrap' }}>{p.genres.map((g) => <span key={g} className="chip on">{g}</span>)}</div>
          </>
        )}

        {tops.length > 0 && (
          <>
            <span className="pfsec">Artis teratas dari riwayatmu</span>
            <div className="arow">
              {tops.map((a) => (
                <div key={a.name} className="ac">
                  <div className="ai"><img src={a.thumb || '/logo.png'} alt="" /></div>
                  <b>{a.name}</b>
                  <span style={{ fontSize: 11, color: 'var(--mut)' }}>{a.n} lagu</span>
                </div>
              ))}
            </div>
          </>
        )}

        {recent.length > 0 && (
          <>
            <span className="pfsec">Terakhir diputar</span>
            {recent.map((t) => (
              <div key={t.id} className="row" role="button" onClick={() => play(t)}>
                <div className="th"><img src={t.thumb || '/logo.png'} alt="" loading="lazy" /></div>
                <div className="m"><b>{t.title}</b><span>{t.artist}</span></div>
              </div>
            ))}
          </>
        )}

        {pls.length > 0 && (
          <>
            <span className="pfsec">Playlist-mu</span>
            <div className="sc">
              {pls.slice(0, 5).map((x) => (
                <div key={x.id} className="sr">
                  <span className="si"><Ix n="music" /></span>
                  <div className="st"><b>{x.name}</b><span>{x.tracks.length} lagu</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        {follows.length > 0 && (
          <>
            <span className="pfsec">Artis yang kamu ikuti</span>
            <div className="pffol">
              {follows.map((n) => (
                <button key={n} onClick={() => unfollow(n)} title="Berhenti mengikuti">{n}<Ix n="x" /></button>
              ))}
            </div>
          </>
        )}

        <span className="pfsec">Cadangan dan sinkronisasi</span>
        <div className="sc">
          <div className="sr">
            <span className="si"><Ix n="db" /></span>
            <div className="st"><b>Cadangan akun</b><span>{bkAt ? 'Terakhir dicadangkan ' + ago(bkAt) : 'Belum pernah dicadangkan'}</span></div>
          </div>
        </div>
        <div className="pfrow2">
          <button className="btn pri" disabled={busy} onClick={doBackup}><Ix n="ul" /> Cadangkan</button>
          <button className="btn" disabled={busy} onClick={confirm('restore', doRestore)}><Ix n="dl" /> {arm === 'restore' ? 'Yakin?' : 'Pulihkan'}</button>
        </div>
        <div className="sub" style={{ fontSize: 12, margin: '8px 4px 0' }}>Mencadangkan menyimpan pengaturan, playlist, lagu disukai, riwayat, dan artis yang diikuti. Memulihkan akan menimpa data di perangkat ini.</div>

        <span className="pfsec">Akun</span>
        <div className="sc">
          <button className="sr" onClick={() => { setAcct('email'); setAErr(''); }}>
            <span className="si"><Ix n="user" /></span>
            <div className="st"><b>Ubah email</b><span>{sess && sess.user.email}</span></div>
            <Ix n="chev" />
          </button>
          <button className="sr" onClick={() => { setAcct('pass'); setAErr(''); }}>
            <span className="si"><Ix n="shield" /></span>
            <div className="st"><b>Ubah password</b><span>Ganti password akunmu</span></div>
            <Ix n="chev" />
          </button>
          <button className="sr" onClick={confirm('all', () => logout(true))}>
            <span className="si"><Ix n="shield" /></span>
            <div className="st"><b>{arm === 'all' ? 'Ketuk lagi untuk konfirmasi' : 'Keluar dari semua perangkat'}</b><span>Akhiri sesi di semua HP dan browser</span></div>
            <Ix n="chev" />
          </button>
        </div>
        <button className="btn dng" style={{ width: '100%', marginTop: 14 }} onClick={() => logout(false)}>Keluar</button>
      </div>

      <ShareSheet open={shareOpen} tab={shareTab} setTab={setShareTab} onClose={() => setShareOpen(false)} prof={p} name={name} notify={notify} />

      {/* Edit profil */}
      <div className={'pfsheet ' + (editOpen ? 'o' : '')}>
        <div className="sh" style={{ marginBottom: 6 }}>
          <button className="ib" onClick={() => setEditOpen(false)}><Ix n="back" /></button>
          <h2 style={{ fontSize: 24, margin: 0 }}>Edit profil</h2>
        </div>

        <div className="pfedav">
          <div className="pfa">{form.avatar ? <img src={form.avatar} alt="" /> : initials(form.dn || name)}</div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            <button className="btn" onClick={() => fileRef.current && fileRef.current.click()}><Ix n="img" /> Ganti foto</button>
            {form.avatar && <button className="pflink" style={{ margin: '8px 0 0', textAlign: 'left' }} onClick={() => setForm({ ...form, avatar: '' })}>Hapus foto</button>}
          </div>
        </div>

        <label className="pfl"><span>Nama tampilan</span><span className="pfcnt">{form.dn.length}/30</span></label>
        <input className="fi" maxLength={30} value={form.dn} onChange={(e) => setForm({ ...form, dn: e.target.value })} />

        <label className="pfl"><span>Username</span></label>
        <input className="fi" maxLength={20} autoCapitalize="none" autoCorrect="off" placeholder="huruf kecil, angka, . atau _" value={form.un} onChange={(e) => setForm({ ...form, un: e.target.value.toLowerCase() })} />

        <label className="pfl"><span>Bio</span><span className="pfcnt">{form.bio.length}/160</span></label>
        <textarea className="fi" rows={3} maxLength={160} placeholder="Ceritakan selera musikmu" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

        <label className="pfl"><span>Negara</span></label>
        <select className="fi pfsel" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
          <option value="">Tidak ditampilkan</option>
          {countries.map((x) => <option key={x.c} value={x.c}>{flagOf(x.c)} {x.n}</option>)}
        </select>

        <label className="pfl"><span>Genre favorit</span><span className="pfcnt">{form.genres.length}/6</span></label>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {GENRES.map((g) => <button key={g} className={'chip ' + (form.genres.indexOf(g) >= 0 ? 'on' : '')} onClick={() => toggleGenre(g)}>{g}</button>)}
        </div>

        <label className="pfl"><span>Artis favorit</span></label>
        <input className="fi" maxLength={40} placeholder="Nama artis" value={form.fav} onChange={(e) => setForm({ ...form, fav: e.target.value })} />

        {formErr && <div className="pfe">{formErr}</div>}

        <div className="pfbar">
          <button className="big" style={{ marginTop: 0, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={saveEdit}><Ix n="check" /> {busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>
        </div>
      </div>

      {/* Ubah email / password */}
      <div className={'pfsheet ' + (acct ? 'o' : '')}>
        <div className="sh" style={{ marginBottom: 6 }}>
          <button className="ib" onClick={() => setAcct('')}><Ix n="back" /></button>
          <h2 style={{ fontSize: 24, margin: 0 }}>{acct === 'email' ? 'Ubah email' : 'Ubah password'}</h2>
        </div>
        {acct === 'email' ? (
          <>
            <div className="sub" style={{ marginTop: 6 }}>Email sekarang: {sess && sess.user.email}. Kami akan mengirim tautan konfirmasi ke email baru.</div>
            <label className="pfl"><span>Email baru</span></label>
            <input className="fi" type="email" inputMode="email" autoCapitalize="none" value={aEmail} onChange={(e) => setAEmail(e.target.value)} />
          </>
        ) : (
          <>
            <label className="pfl"><span>Password baru</span></label>
            <input className="fi" type="password" placeholder="Minimal 6 karakter" value={aPw} onChange={(e) => setAPw(e.target.value)} />
            <label className="pfl"><span>Ulangi password baru</span></label>
            <input className="fi" type="password" value={aPw2} onChange={(e) => setAPw2(e.target.value)} />
          </>
        )}
        {aErr && <div className="pfe">{aErr}</div>}
        <button className="big" style={{ marginTop: 20, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={saveAcct}><Ix n="check" /> {busy ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </>
  );
}
