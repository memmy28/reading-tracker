-- Global lookup rows (user_id = null), visible to every user. Applied
-- automatically after migrations by `supabase db reset`; run manually
-- against a hosted project if you push migrations there without seeding.

insert into public.genres (name) values
  ('Fantasy'),
  ('Science Fiction'),
  ('Mystery'),
  ('Thriller'),
  ('Romance'),
  ('Horror'),
  ('Historical Fiction'),
  ('Literary Fiction'),
  ('Young Adult'),
  ('Contemporary Fiction'),
  ('Classics'),
  ('Biography'),
  ('Memoir'),
  ('Self-Help'),
  ('Non-Fiction'),
  ('Poetry'),
  ('Graphic Novel'),
  ('Crime'),
  ('Adventure'),
  ('Dystopian')
on conflict do nothing;

insert into public.formats (name) values
  ('Hardcover'),
  ('Paperback'),
  ('Digital'),
  ('Audiobook')
on conflict do nothing;

insert into public.sources (name) values
  ('Owned'),
  ('Borrowed'),
  ('Library'),
  ('Audible'),
  ('StoryTel'),
  ('Kindle')
on conflict do nothing;

insert into public.languages (name) values
  ('EN'),
  ('DE')
on conflict do nothing;

-- Accent color palette, in the order it should be displayed (rows of 4).
-- Note: "Navi" from the original list is seeded as "Navy" (assumed typo).
insert into public.colors (name, hex, text_color, sort_order) values
  ('Black', '#1C1D21', 'white', 1),
  ('Dark gray', '#585859', 'white', 2),
  ('Gray', '#BFBFBF', 'black', 3),
  ('White', '#FFFFFF', 'black', 4),
  ('Dark red', '#8C1C03', 'white', 5),
  ('Red', '#C62828', 'white', 6),
  ('Dark orange', '#FF640A', 'black', 7),
  ('Orange', '#FF822E', 'black', 8),
  ('Yellow', '#F0C755', 'black', 9),
  ('Green', '#91C46C', 'black', 10),
  ('Dark green', '#47A94C', 'black', 11),
  ('Super dark green', '#336133', 'white', 12),
  ('Teal', '#00AD9C', 'black', 13),
  ('Blue', '#4FA2D8', 'black', 14),
  ('Dark blue', '#004B8D', 'white', 15),
  ('Navy', '#002C52', 'white', 16),
  ('Dark purple', '#553285', 'white', 17),
  ('Purple', '#AC87D9', 'black', 18),
  ('Pink', '#D770C7', 'black', 19),
  ('Dark pink', '#A02276', 'white', 20)
on conflict (name) do nothing;
