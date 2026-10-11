export type T = { id: string; title: string; artist: string; thumb: string; duration: number };
export type Pl = { id: string; name: string; desc: string; cover: string; pub: boolean; hue: number; tracks: T[]; at: number };
export type Cfg = {
  name: string; accent: string;
  blobs: boolean; motion: boolean; spin: boolean; lyrics: boolean;
  autoNext: boolean; defShuffle: boolean; defRepeat: number; resume: boolean; bg: boolean;
  vol: number; rate: number;
  saveHist: boolean; saveSearch: boolean; arts: boolean;
};

export const DEF: Cfg = {
  name: 'KALTZY404', accent: '#c6f432',
  blobs: true, motion: true, spin: true, lyrics: true,
  autoNext: true, defShuffle: false, defRepeat: 0, resume: true, bg: true,
  vol: 100, rate: 1,
  saveHist: true, saveSearch: true, arts: true,
};

export const ACCENTS: [string, string][] = [
  ['Lime', '#c6f432'], ['Cyan', '#5ee7ff'], ['Pink', '#ff7ab8'],
  ['Jingga', '#ffb347'], ['Ungu', '#b69cff'], ['Mint', '#5dffb0'],
];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const fm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

// Tautan berbagi: nama, deskripsi, dan daftar lagu dikemas di dalam URL (tanpa server)
export function encodePl(p: Pl): string {
  return b64(JSON.stringify({ n: p.name, d: p.desc, h: p.hue, t: p.tracks.map((t) => [t.id, t.title, t.artist, t.duration]) }));
}
export function decodePl(s: string): Pl | null {
  try {
    const o = JSON.parse(unb64(s));
    if (!o || !Array.isArray(o.t) || !o.t.length) return null;
    const tracks: T[] = o.t.slice(0, 300).map((x: any[]) => ({ id: String(x[0]), title: String(x[1] || ''), artist: String(x[2] || ''), thumb: ytThumb(String(x[0])), duration: Number(x[3]) || 0 }));
    return { id: uid(), name: String(o.n || 'Playlist').slice(0, 60), desc: String(o.d || '').slice(0, 300), cover: '', pub: false, hue: Number(o.h) || 265, tracks, at: Date.now() };
  } catch {
    return null;
  }
}

// Ubah gambar pilihan pengguna menjadi sampul persegi 400x400 (disimpan sebagai data URL)
export function fileToCover(f: File, size = 400): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('read'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error('img'));
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const x = c.getContext('2d');
        if (!x) { rej(new Error('ctx')); return; }
        const m = Math.min(img.width, img.height);
        x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(f);
  });
}

export const X: Record<string, string> = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  dn: '<path d="M6 9l6 6 6-6"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 1.6-2.1-.4-1 .3-2.1 1.4-2.1H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="11" r="1"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  speed: '<path d="M4 18a9 9 0 1 1 16 0M12 13l4-4"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  dl: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  ul: '<path d="M12 20V9M7 13l5-5 5 5M5 4h14"/>',
  heart: '<path d="M12 20s-8-4.7-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-1 5.3-9 10-9 10z"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3"/>',
};

export function Ix({ n, c = '' }: { n: string; c?: string }) {
  return <svg className={'i ' + c} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: X[n] || '' }} />;
}
