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
4. Create the database schema. The schema lives as versioned SQL files in [`supabase/migrations`](supabase/migrations), with shared reference data (default genres/formats/sources) in [`supabase/seed.sql`](supabase/seed.sql). To apply them to your hosted project:

   ```bash
   npx supabase link          # connects this repo to your hosted project (asks for its project ref)
   npx supabase db push       # applies all migrations
   ```

   Then run the contents of `supabase/seed.sql` once in your project's **Database > SQL Editor** (`db push` only applies schema, not seed data).
5. Also enable **anonymous sign-ins**: in your project, go to **Authentication > Sign In / Providers** and turn on "Allow anonymous sign-ins". The app signs users in anonymously on first use since there's no login form yet (see `src/lib/ensureSession.ts`) — every table's Row Level Security keys off that user id.
6. The app talks to Supabase through `src/lib/supabaseClient.ts`, which reads the env vars above. Import `supabase` from there wherever you need to query the database, storage, or handle auth.

### Running Supabase locally (optional)

Instead of pointing at the hosted project, you can run the full Supabase stack locally with Docker via the Supabase CLI (already added as a dev dependency).

```bash
npx supabase start   # first run pulls Docker images, so it takes a few minutes
```

This project's `supabase/config.toml` sets the local **API port to 9999** (instead of the CLI's default 54321), so once it's running, point your `.env.local` at:

```
VITE_SUPABASE_URL=http://127.0.0.1:9999
```

`supabase start` prints the local **anon key** to use for `VITE_SUPABASE_ANON_KEY` — you can also get it anytime with `npx supabase status`. It also prints a Studio URL (a local dashboard, `http://127.0.0.1:55323` for this project) for browsing tables and data. Anonymous sign-ins and all migrations/seed data are already applied automatically for the local stack — no manual setup needed there.

If you add or change a table, put the change in a new file under `supabase/migrations` (name it `<timestamp>_description.sql`) rather than editing an old one, then run:

```bash
npx supabase db reset   # rebuilds the local database from scratch: migrations, then seed.sql
```

Once you're happy with a migration, push it to your hosted project with `npx supabase db push` (see step 4 above).

Stop the local stack when you're done:

```bash
npx supabase stop
```

Note: this requires Docker Desktop (or another Docker-compatible engine) to be running. This project's `supabase/config.toml` already moves every local service (API, database, Studio, Inbucket, analytics) off the CLI's defaults, so it can run alongside another local Supabase project without port clashes.

## Other scripts

```bash
npm run build    # type-check and build for production into dist/
npm run preview  # locally preview the production build
npm run lint     # run the linter
```
