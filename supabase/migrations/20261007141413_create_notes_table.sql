/*
# Create notes table for shared two-person memo app

1. New Tables
- `notes`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `title` (text, not null)
  - `content` (text, default empty string)
  - `updated_at` (timestamptz, default now())
  - `updated_by` (text, default 'unknown')

2. Security
- Enable Row Level Security on `notes`.
- Allow anon + authenticated full CRUD: this is an intentionally shared, no-auth app
  (two people use a shared password verified on the frontend). All data is public to
  anyone with the anon key, which is acceptable for this use case.

3. Realtime
- Add `notes` table to the Supabase Realtime publication so the frontend can
  subscribe to INSERT / UPDATE / DELETE events.

4. Notes
- `updated_at` is NOT auto-updated on UPDATE by default; a trigger keeps it in sync.
- An index on `updated_at DESC` supports the list view's default sort.
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT 'unknown'
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notes" ON notes;
CREATE POLICY "anon_select_notes" ON notes FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON notes;
CREATE POLICY "anon_insert_notes" ON notes FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notes" ON notes;
CREATE POLICY "anon_update_notes" ON notes FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON notes;
CREATE POLICY "anon_delete_notes" ON notes FOR DELETE
TO anon, authenticated USING (true);

-- Keep updated_at in sync on every UPDATE
DROP TRIGGER IF EXISTS notes_set_updated_at ON notes;
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Index for list view sorted by updated_at descending
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
