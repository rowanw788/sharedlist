# Shared Memo

A two-person shared memo app, mobile-first PWA built with React + Vite + Supabase + Tailwind CSS.

## Features

- Shared password gate (no account needed)
- Create, edit, and delete notes
- Realtime sync via Supabase Realtime — updates appear instantly for both users
- Auto-save (1 second after typing stops or on blur)
- Shows last editor and update time
- PWA — add to home screen, works offline
- Apple Notes-style minimal UI

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your values:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
   - `VITE_SHARED_PASSWORD` — the shared password for both users
3. Create the `notes` table in Supabase (see SQL below)
4. `npm install && npm run dev`

## Supabase SQL

```sql
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'unknown'
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_notes" ON notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_set_updated_at BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
```

## Deploy

Build with `npm run build` and deploy the `dist/` folder to Vercel or any static host. Set the same environment variables in your hosting platform.
