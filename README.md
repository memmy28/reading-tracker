# reading-tracker
A website to track my read books, my TBR, reading stats, and more.

Built with React, TypeScript, Vite, MUI (Material UI), and Supabase.

## Getting started

Install dependencies (only needed once, or after pulling changes that update `package.json`):

```bash
npm install
```

Set up your environment variables (see [Backend setup (Supabase)](#backend-setup-supabase) below), then start the local dev server:

```bash
npm run dev
```

This prints a local URL (usually `http://localhost:5173`) — open it in your browser. The page hot-reloads as you edit files in `src/`.

## Backend setup (Supabase)

This app uses [Supabase](https://supabase.com) (hosted Postgres + auth) as its backend.

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. In your project, go to **Settings > API** and copy the **Project URL** and the **anon public** key.
3. Copy the env template and fill in those two values:

   ```bash
   cp .env.example .env.local
   ```

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   `.env.local` is gitignored, so your keys stay out of version control.
4. Create the database tables: open **Database > SQL Editor** in your Supabase project, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates a `books` table (covering TBR, currently-reading, and read books) with Row Level Security so each signed-in user only sees their own data.
5. The app talks to Supabase through `src/lib/supabaseClient.ts`, which reads the env vars above. Import `supabase` from there wherever you need to query the database or handle auth.

## Other scripts

```bash
npm run build    # type-check and build for production into dist/
npm run preview  # locally preview the production build
npm run lint     # run the linter
```
