-- Adds a `languages` lookup table (same "global default + user custom" shape
-- as genres/formats/sources) and replaces books.language (free text) with
-- books.language_id, backfilling any existing values so no data is lost.

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists languages_global_name_key on public.languages (name) where user_id is null;
create unique index if not exists languages_user_name_key on public.languages (user_id, name) where user_id is not null;

alter table public.books add column if not exists language_id uuid references public.languages (id) on delete set null;
create index if not exists books_language_id_idx on public.books (language_id);

-- Backfill: turn any existing free-text language values into shared/global
-- rows (same status as the seeded defaults) and point existing books at them.
insert into public.languages (name)
select distinct language from public.books where language is not null
on conflict do nothing;

update public.books
set language_id = languages.id
from public.languages
where books.language = languages.name and books.language_id is null;

alter table public.books drop column if exists language;

alter table public.languages enable row level security;

create policy "Users can view global or their own languages" on public.languages for select using (user_id is null or auth.uid() = user_id);
create policy "Users can insert their own languages" on public.languages for insert with check (auth.uid() = user_id);
create policy "Users can update their own languages" on public.languages for update using (auth.uid() = user_id);
create policy "Users can delete their own languages" on public.languages for delete using (auth.uid() = user_id);
