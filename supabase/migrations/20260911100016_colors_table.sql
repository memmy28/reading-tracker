-- A fixed palette of accent colors for books. Unlike authors/genres/etc,
-- this isn't user-extensible — it's a shared reference list, readable by
-- everyone, with the color-appropriate text color baked in for contrast.

create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hex text not null,
  text_color text not null check (text_color in ('black', 'white')),
  sort_order integer not null
);

alter table public.books add column if not exists accent_color_id uuid references public.colors (id) on delete set null;
create index if not exists books_accent_color_id_idx on public.books (accent_color_id);

alter table public.colors enable row level security;

create policy "Colors are readable by everyone" on public.colors for select using (true);
