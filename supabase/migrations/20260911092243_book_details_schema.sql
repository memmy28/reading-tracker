-- Adds rich book metadata: cover image, author/series/genre/format/source
-- lookup tables (each supports "pick existing or add new"), fiction flag,
-- publishing year, language, pace, ownership, and the "bookshelf" reading
-- fields (dates + star/tears/heart/chili ratings).

-- ---------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------

-- Authors and series are always created by a user ad hoc (no global seed
-- list makes sense for these), so every row belongs to exactly one user.
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Genres, formats, and sources ship with a shared starter list (see
-- supabase/seed.sql) — those rows have user_id = null and are visible to
-- everyone. Users can also add their own custom entries the same way they
-- add authors/series; those rows are private to them (user_id set).
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.formats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- No two global rows (user_id is null) may share a name, and no user may
-- create two custom rows with the same name.
create unique index if not exists genres_global_name_key on public.genres (name) where user_id is null;
create unique index if not exists genres_user_name_key on public.genres (user_id, name) where user_id is not null;
create unique index if not exists formats_global_name_key on public.formats (name) where user_id is null;
create unique index if not exists formats_user_name_key on public.formats (user_id, name) where user_id is not null;
create unique index if not exists sources_global_name_key on public.sources (name) where user_id is null;
create unique index if not exists sources_user_name_key on public.sources (user_id, name) where user_id is not null;

-- ---------------------------------------------------------------------
-- books: new columns for general info + bookshelf (already-read) fields
-- ---------------------------------------------------------------------

alter table public.books drop column if exists author;

alter table public.books
  add column if not exists cover_url text,
  add column if not exists author_id uuid references public.authors (id) on delete set null,
  add column if not exists series_id uuid references public.series (id) on delete set null,
  add column if not exists series_number numeric,
  add column if not exists is_fiction boolean,
  add column if not exists publishing_year integer,
  add column if not exists format_id uuid references public.formats (id) on delete set null,
  add column if not exists source_id uuid references public.sources (id) on delete set null,
  add column if not exists language text,
  add column if not exists pace text,
  add column if not exists owned boolean not null default false,
  add column if not exists rating_tears smallint,
  add column if not exists rating_heart smallint,
  add column if not exists rating_chili smallint;

alter table public.books
  add constraint books_publishing_year_check check (publishing_year between 0 and 3000),
  add constraint books_pace_check check (pace in ('slow', 'medium', 'fast')),
  add constraint books_rating_tears_check check (rating_tears between 1 and 5),
  add constraint books_rating_heart_check check (rating_heart between 1 and 5),
  add constraint books_rating_chili_check check (rating_chili between 1 and 5);

create index if not exists books_author_id_idx on public.books (author_id);
create index if not exists books_series_id_idx on public.books (series_id);
create index if not exists books_format_id_idx on public.books (format_id);
create index if not exists books_source_id_idx on public.books (source_id);

-- ---------------------------------------------------------------------
-- book_genres: many-to-many between books and genres
-- ---------------------------------------------------------------------

create table if not exists public.book_genres (
  book_id uuid not null references public.books (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (book_id, genre_id)
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.authors enable row level security;
alter table public.series enable row level security;
alter table public.genres enable row level security;
alter table public.formats enable row level security;
alter table public.sources enable row level security;
alter table public.book_genres enable row level security;

-- authors / series: plain per-user ownership, same shape as `books`.
create policy "Users can view their own authors" on public.authors for select using (auth.uid() = user_id);
create policy "Users can insert their own authors" on public.authors for insert with check (auth.uid() = user_id);
create policy "Users can update their own authors" on public.authors for update using (auth.uid() = user_id);
create policy "Users can delete their own authors" on public.authors for delete using (auth.uid() = user_id);

create policy "Users can view their own series" on public.series for select using (auth.uid() = user_id);
create policy "Users can insert their own series" on public.series for insert with check (auth.uid() = user_id);
create policy "Users can update their own series" on public.series for update using (auth.uid() = user_id);
create policy "Users can delete their own series" on public.series for delete using (auth.uid() = user_id);

-- genres / formats / sources: everyone can see the global rows (user_id is
-- null) plus their own custom rows; users can only write/manage their own.
create policy "Users can view global or their own genres" on public.genres for select using (user_id is null or auth.uid() = user_id);
create policy "Users can insert their own genres" on public.genres for insert with check (auth.uid() = user_id);
create policy "Users can update their own genres" on public.genres for update using (auth.uid() = user_id);
create policy "Users can delete their own genres" on public.genres for delete using (auth.uid() = user_id);

create policy "Users can view global or their own formats" on public.formats for select using (user_id is null or auth.uid() = user_id);
create policy "Users can insert their own formats" on public.formats for insert with check (auth.uid() = user_id);
create policy "Users can update their own formats" on public.formats for update using (auth.uid() = user_id);
create policy "Users can delete their own formats" on public.formats for delete using (auth.uid() = user_id);

create policy "Users can view global or their own sources" on public.sources for select using (user_id is null or auth.uid() = user_id);
create policy "Users can insert their own sources" on public.sources for insert with check (auth.uid() = user_id);
create policy "Users can update their own sources" on public.sources for update using (auth.uid() = user_id);
create policy "Users can delete their own sources" on public.sources for delete using (auth.uid() = user_id);

-- book_genres: access follows ownership of the parent book.
create policy "Users can view genres of their own books" on public.book_genres for select
  using (exists (select 1 from public.books where books.id = book_genres.book_id and books.user_id = auth.uid()));
create policy "Users can add genres to their own books" on public.book_genres for insert
  with check (exists (select 1 from public.books where books.id = book_genres.book_id and books.user_id = auth.uid()));
create policy "Users can remove genres from their own books" on public.book_genres for delete
  using (exists (select 1 from public.books where books.id = book_genres.book_id and books.user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- Storage: book cover images (2:3 covers, cropped client-side before upload)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;

-- Objects are stored under "<user_id>/<filename>" so folder-based policies
-- can scope writes to the uploader while keeping reads public (cover art
-- isn't sensitive, and a public URL is simplest to render in the app).
create policy "Public read access for book covers" on storage.objects for select
  using (bucket_id = 'book-covers');
create policy "Users can upload their own book covers" on storage.objects for insert
  with check (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update their own book covers" on storage.objects for update
  using (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own book covers" on storage.objects for delete
  using (bucket_id = 'book-covers' and auth.uid()::text = (storage.foldername(name))[1]);
