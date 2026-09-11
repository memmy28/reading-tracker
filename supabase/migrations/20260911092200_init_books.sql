-- Base schema: a single `books` table covering TBR, currently-reading, and
-- finished books, scoped per-user via Row Level Security.

create type book_status as enum ('tbr', 'reading', 'read');

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  author text,
  status book_status not null default 'tbr',
  rating smallint check (rating between 1 and 5),
  total_pages integer,
  current_page integer default 0,
  started_at date,
  finished_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current on every row change.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_set_updated_at
  before update on public.books
  for each row
  execute function public.set_updated_at();

-- Row Level Security: each signed-in user can only see/edit their own books.
alter table public.books enable row level security;

create policy "Users can view their own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.books for delete
  using (auth.uid() = user_id);
