# Menyalakan fitur akun Cropify (Supabase)

Fitur login, daftar, profil, dan cadangan memakai Supabase (gratis). Lakukan sekali saja.

## 1. Buat project
1. Buka https://supabase.com, daftar, lalu **New project**.
2. Simpan Project URL dan anon key dari **Project Settings → API**.

## 2. Buat tabel (SQL Editor → New query → Run)

```sql
-- Profil (bisa dibaca semua orang, hanya pemilik yang boleh mengubah)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name text,
  bio text,
  country text,
  avatar text,
  banner int,
  genres text[],
  fav_artist text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "profil dapat dibaca" on public.profiles
  for select using (true);
create policy "tambah profil sendiri" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "ubah profil sendiri" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "hapus profil sendiri" on public.profiles
  for delete to authenticated using (auth.uid() = id);

-- Cadangan data (hanya pemilik yang boleh membaca dan menulis)
create table if not exists public.backups (
  id uuid primary key references auth.users(id) on delete cascade,
  data text not null,
  updated_at timestamptz default now()
);
alter table public.backups enable row level security;

create policy "cadangan milik sendiri" on public.backups
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
```

## 3. Atur login email
- **Authentication → Providers → Email**: pastikan aktif.
- Untuk mencoba cepat, matikan **Confirm email**. Kalau dibiarkan aktif, pengguna baru harus klik tautan di email sebelum bisa masuk.
- **Authentication → URL Configuration → Site URL**: isi `https://cropifymusic.vercel.app`.

## 4. Isi variabel di Vercel
Vercel → project Cropify → **Settings → Environment Variables**:

| Nama | Isi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (contoh `https://abcd.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |

Setelah disimpan, buka **Deployments → Redeploy** supaya variabelnya terbaca.

Catatan: anon key memang boleh terlihat di aplikasi, karena data dilindungi aturan RLS di atas. Jangan pernah memakai `service_role` key di aplikasi.
