-- Languages are 2-letter codes (EN, DE, ...) — enforce it at the data layer
-- too, matching the input restriction on the add-book form.
alter table public.languages
  add constraint languages_name_is_two_letter_code check (name ~ '^[A-Z]{2}$');
