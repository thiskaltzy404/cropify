import { Innertube } from 'youtubei.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

let yt: Promise<Innertube> | null = null;
const client = () => (yt ??= Innertube.create({ generate_session_locally: true }));

const txt = (x: any): string => (!x ? '' : typeof x === 'string' ? x : x.text ?? String(x));
const best = (a: any): string => {
  const arr = Array.isArray(a) ? a : a?.contents;
  return arr?.length ? arr[arr.length - 1]?.url ?? '' : '';
};
const who = (i: any, fb = ''): string =>
  (i.artists ?? []).map((a: any) => a.name).join(', ') || i.author?.name || fb;
const cache = { 'Cache-Control': 's-maxage=1800, stale-while-revalidate' };

const mbCache = new Map<string, string | null>();
// Negara asal artis dari MusicBrainz (kode ISO 2 huruf, mis. "ID"); null jika tidak yakin
async function countryOf(name: string): Promise<string | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (mbCache.has(key)) return mbCache.get(key) ?? null;
  try {
    const url =
      'https://musicbrainz.org/ws/2/artist/?fmt=json&limit=5&query=' +
      encodeURIComponent(`artist:"${name.replace(/"/g, '')}"`);
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Cropify/1.0 ( https://cropifymusic.vercel.app )', Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const exact: any[] = (j.artists ?? []).filter(
      (a: any) =>
        String(a.name).toLowerCase() === key ||
        (a.aliases ?? []).some((x: any) => String(x.name).toLowerCase() === key),
    );
    const pick = exact.find((a) => a.country || a.area?.['iso-3166-1-codes']?.length);
    const c: string | undefined = pick?.country || pick?.area?.['iso-3166-1-codes']?.[0];
    const code = c && /^[A-Z]{2}$/.test(c) && c !== 'XW' && c !== 'XE' ? c : null;
    mbCache.set(key, code);
    return code;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get('kind');
  const id = sp.get('id') ?? '';
  const q = sp.get('q')?.trim() ?? '';
  try {
    const y = await client();

    if (kind === 'artists') {
      if (!q) return Response.json({ artists: [] });
      const r: any = await y.music.search(q, { type: 'artist' });
      const items: any[] = (r.contents ?? []).flatMap((s: any) => s.contents ?? []);
      const artists = items
        .filter((i) => i?.id && (i.item_type === 'artist' || String(i.id).startsWith('UC')))
        .map((i) => ({ id: i.id as string, name: txt(i.name ?? i.title), thumb: best(i.thumbnails) }))
        .slice(0, 10);
      return Response.json({ artists }, { headers: cache });
    }

    if (kind === 'artist') {
      const a: any = await y.music.getArtist(id);
      const h: any = a.header;
      const name = txt(h?.title);
      const songs: any[] = [];
      const sections: any[] = [];
      for (const s of a.sections ?? []) {
        if (s.type === 'MusicShelf') {
          if (!songs.length) {
            for (const i of s.contents ?? []) {
              if (i?.id) songs.push({ id: i.id, title: txt(i.title ?? i.name), artist: who(i, name), thumb: best(i.thumbnails), duration: i.duration?.seconds ?? 0 });
            }
          }
        } else if (s.type === 'MusicCarouselShelf') {
          const items = (s.contents ?? [])
            .map((i: any) => ({
              id: i.id ?? i.endpoint?.payload?.browseId ?? i.endpoint?.payload?.videoId,
              title: txt(i.title ?? i.name),
              sub: txt(i.subtitle) || who(i),
              thumb: best(i.thumbnail) || best(i.thumbnails),
              kind: i.item_type ?? '',
            }))
            .filter((x: any) => x.id && x.title);
          if (items.length) sections.push({ title: txt(s.header?.title), items });
        }
      }
      const dsc: any = h?.description;
      const description = typeof dsc === 'string' ? dsc : dsc?.text || '';
      const country = await countryOf(name);
      return Response.json(
        { name, description, country, thumb: best(h?.thumbnails) || best(h?.foreground_thumbnails) || best(h?.thumbnail), songs, sections },
        { headers: cache },
      );
    }

    if (kind === 'album') {
      const a: any = id.startsWith('MPRE') ? await y.music.getAlbum(id) : await y.music.getPlaylist(id);
      const h: any = a.header;
      const owner = h?.author?.name ?? '';
      const list: any[] = a.contents ?? a.items ?? [];
      const first = best(list.find((i) => i?.thumbnails?.length)?.thumbnails);
      // Sampul playlist/album: coba beberapa bentuk header, lalu pakai sampul lagu pertama
      const thumb = best(h?.thumbnail) || best(h?.thumbnails) || best(h?.header?.thumbnails) || best(h?.header?.thumbnail) || first;
      const tracks = list
        .filter((i) => i?.id)
        .map((i) => ({ id: i.id as string, title: txt(i.title ?? i.name), artist: who(i, owner), thumb: best(i.thumbnails) || thumb, duration: i.duration?.seconds ?? 0 }));
      return Response.json({ title: txt(h?.title), subtitle: txt(h?.subtitle), thumb, tracks }, { headers: cache });
    }

    return Response.json({ error: 'bad_request' }, { status: 400 });
  } catch (e) {
    yt = null;
    return Response.json({ error: 'failed', message: String(e) }, { status: 502 });
  }
}
