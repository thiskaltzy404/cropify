// Klien akun Cropify berbasis Supabase (REST langsung, tanpa paket tambahan).
// Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di Vercel (lihat SUPABASE_SETUP.md).

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const authReady = Boolean(BASE && KEY);

export type Session = { access_token: string; refresh_token: string; expires_at: number; user: any };
export type Prof = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  country?: string | null;
  avatar?: string | null;
  banner?: number | null;
  genres?: string[] | null;
  fav_artist?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Res = { ok: boolean; status: number; j: any };

const SK = 'cropify:auth';
const nowS = () => Math.floor(Date.now() / 1000);

async function call(path: string, init: RequestInit = {}, token?: string): Promise<Res> {
  try {
    const extra = (init.headers as Record<string, string> | undefined) || {};
    const r = await fetch(BASE + path, {
      ...init,
      headers: {
        apikey: KEY,
        'Content-Type': 'application/json',
        // Kunci baru (sb_publishable_...) bukan JWT: jangan dikirim sebagai Bearer
        ...(token || KEY.startsWith('eyJ') ? { Authorization: 'Bearer ' + (token || KEY) } : {}),
        ...extra,
      },
    });
    const txt = await r.text();
    let j: any = null;
    try { j = txt ? JSON.parse(txt) : null; } catch { j = null; }
    return { ok: r.ok, status: r.status, j };
  } catch {
    return { ok: false, status: 0, j: null };
  }
}

const TR: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email atau password salah'],
  [/user already registered|already been registered/i, 'Email sudah terdaftar, silakan masuk'],
  [/email not confirmed/i, 'Email belum dikonfirmasi. Cek kotak masuk emailmu'],
  [/password should be at least|weak password/i, 'Password terlalu lemah, minimal 6 karakter'],
  [/rate limit|too many/i, 'Terlalu banyak percobaan, coba lagi beberapa saat lagi'],
  [/invalid format|unable to validate email/i, 'Format email tidak valid'],
  [/same password|different from the old/i, 'Password baru harus berbeda dari yang lama'],
  [/signups? (are )?disabled|signup is disabled/i, 'Pendaftaran sedang ditutup'],
  [/jwt|token.*expired|not authenticated/i, 'Sesi berakhir, silakan masuk lagi'],
];

function errText(r: Res): string {
  if (r.status === 0) return 'Tidak ada koneksi internet';
  const j = r.j;
  const code = String(j?.code ?? '');
  const raw = String(j?.error_description || j?.msg || j?.message || j?.error || '');
  if (code === '23505' || /duplicate key|unique constraint/i.test(raw)) return 'Username sudah dipakai';
  if (code === 'PGRST205' || code === '42P01' || /schema cache|does not exist/i.test(raw)) {
    return 'Database akun belum disiapkan (jalankan SQL di SUPABASE_SETUP.md)';
  }
  for (const [re, t] of TR) if (re.test(raw)) return t;
  return raw || 'Terjadi kesalahan (kode ' + r.status + ')';
}

// ---------- Sesi ----------
export function getSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SK) || 'null');
    return s && s.access_token ? (s as Session) : null;
  } catch {
    return null;
  }
}

function put(s: Session | null) {
  try {
    if (s) localStorage.setItem(SK, JSON.stringify(s));
    else localStorage.removeItem(SK);
  } catch {}
}

function toSession(j: any): Session | null {
  if (!j || !j.access_token) return null;
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: j.expires_at || nowS() + (j.expires_in || 3600),
    user: j.user,
  };
}

// Token yang masih berlaku (otomatis diperbarui bila hampir habis)
export async function validToken(): Promise<string | null> {
  const s = getSession();
  if (!s) return null;
  if (s.expires_at - 60 > nowS()) return s.access_token;
  const r = await call('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  });
  if (r.status === 0) return s.access_token; // offline: coba token lama
  const n = r.ok ? toSession(r.j) : null;
  if (!n) { put(null); return null; }
  put(n);
  return n.access_token;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const r = await call('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(errText(r));
  const s = toSession(r.j);
  if (!s) throw new Error('Gagal masuk, coba lagi');
  put(s);
  return s;
}

export async function signUp(
  email: string,
  password: string,
  meta: Record<string, string>,
): Promise<{ session: Session | null }> {
  const r = await call('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, data: meta }),
  });
  if (!r.ok) throw new Error(errText(r));
  const s = toSession(r.j && r.j.access_token ? r.j : r.j && r.j.session);
  if (s) put(s);
  return { session: s };
}

export async function signOut(everywhere = false): Promise<void> {
  const t = await validToken();
  if (t) await call('/auth/v1/logout' + (everywhere ? '?scope=global' : ''), { method: 'POST' }, t);
  put(null);
}

export async function updateUser(body: Record<string, unknown>): Promise<any> {
  const t = await validToken();
  if (!t) throw new Error('Sesi berakhir, silakan masuk lagi');
  const r = await call('/auth/v1/user', { method: 'PUT', body: JSON.stringify(body) }, t);
  if (!r.ok) throw new Error(errText(r));
  const s = getSession();
  if (s && r.j && r.j.id) put({ ...s, user: r.j });
  return r.j;
}

export async function recover(email: string): Promise<void> {
  const r = await call('/auth/v1/recover', { method: 'POST', body: JSON.stringify({ email }) });
  if (!r.ok) throw new Error(errText(r));
}

// ---------- Profil ----------
export async function fetchProfile(uid: string): Promise<Prof | null> {
  const t = await validToken();
  if (!t) throw new Error('Sesi berakhir, silakan masuk lagi');
  const r = await call('/rest/v1/profiles?id=eq.' + encodeURIComponent(uid) + '&select=*', {}, t);
  if (!r.ok) throw new Error(errText(r));
  return Array.isArray(r.j) && r.j[0] ? (r.j[0] as Prof) : null;
}

export async function saveProfile(uid: string, f: Partial<Prof>): Promise<Prof> {
  const t = await validToken();
  if (!t) throw new Error('Sesi berakhir, silakan masuk lagi');
  const r = await call(
    '/rest/v1/profiles?on_conflict=id',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: uid, ...f, updated_at: new Date().toISOString() }),
    },
    t,
  );
  if (!r.ok) throw new Error(errText(r));
  return (Array.isArray(r.j) ? r.j[0] : r.j) as Prof;
}

export async function usernameTaken(u: string, selfId?: string): Promise<boolean> {
  let q = '/rest/v1/profiles?username=eq.' + encodeURIComponent(u) + '&select=id';
  if (selfId) q += '&id=neq.' + encodeURIComponent(selfId);
  const r = await call(q);
  if (!r.ok) throw new Error(errText(r));
  return Array.isArray(r.j) && r.j.length > 0;
}

// ---------- Cadangan data ----------
export async function saveBackup(uid: string, data: string): Promise<void> {
  const t = await validToken();
  if (!t) throw new Error('Sesi berakhir, silakan masuk lagi');
  const r = await call(
    '/rest/v1/backups?on_conflict=id',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: uid, data, updated_at: new Date().toISOString() }),
    },
    t,
  );
  if (!r.ok) throw new Error(errText(r));
}

export async function loadBackup(uid: string): Promise<{ data: string; updated_at: string } | null> {
  const t = await validToken();
  if (!t) throw new Error('Sesi berakhir, silakan masuk lagi');
  const r = await call('/rest/v1/backups?id=eq.' + encodeURIComponent(uid) + '&select=data,updated_at', {}, t);
  if (!r.ok) throw new Error(errText(r));
  return Array.isArray(r.j) && r.j[0] ? (r.j[0] as { data: string; updated_at: string }) : null;
}

export async function backupInfo(uid: string): Promise<string | null> {
  const t = await validToken();
  if (!t) return null;
  const r = await call('/rest/v1/backups?id=eq.' + encodeURIComponent(uid) + '&select=updated_at', {}, t);
  if (!r.ok) return null;
  return Array.isArray(r.j) && r.j[0] ? String(r.j[0].updated_at) : null;
}

// ---------- Profil publik (cari pengguna lain) ----------
const PUB = 'id,username,display_name,bio,country,avatar,genres,fav_artist,created_at';

export async function searchProfiles(q: string): Promise<Prof[]> {
  const c = q.replace(/[*,()%\\"]/g, ' ').trim();
  if (!authReady || c.length < 2) return [];
  const e = encodeURIComponent(c);
  const r = await call(
    '/rest/v1/profiles?select=' + PUB + '&or=(username.ilike.*' + e + '*,display_name.ilike.*' + e + '*)&limit=6',
  );
  return r.ok && Array.isArray(r.j) ? (r.j as Prof[]) : [];
}

export async function fetchProfileByUsername(u: string): Promise<Prof | null> {
  if (!authReady) return null;
  const r = await call('/rest/v1/profiles?select=' + PUB + '&username=eq.' + encodeURIComponent(u.toLowerCase()) + '&limit=1');
  return r.ok && Array.isArray(r.j) && r.j[0] ? (r.j[0] as Prof) : null;
}
