-- Vellum Resume Studio — PostgreSQL schema
-- Target: PostgreSQL 14+ (RDS, Aurora, Cloud SQL, Neon, Supabase)
--
-- Apply with:
--   docker compose up -d db                 (auto-applies on first boot)
--   DATABASE_URL=... npm run db:migrate     (managed instances)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL UNIQUE,
  full_name    TEXT NOT NULL DEFAULT '',
  avatar_key   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL DEFAULT 'Untitled resume',
  template       TEXT NOT NULL DEFAULT 'modern'
                   CHECK (template IN ('modern', 'executive')),
  accent_color   TEXT NOT NULL DEFAULT '#1F513E'
                   CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  full_name      TEXT NOT NULL DEFAULT '',
  headline       TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  location       TEXT NOT NULL DEFAULT '',
  website        TEXT NOT NULL DEFAULT '',
  linkedin       TEXT NOT NULL DEFAULT '',
  summary        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resumes_user_id_idx
  ON resumes (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS experience_entries (
  id           UUID PRIMARY KEY,
  resume_id    UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT '',
  company      TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',
  start_date   TEXT CHECK (start_date IS NULL OR start_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  end_date     TEXT CHECK (end_date IS NULL OR end_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  is_current   BOOLEAN NOT NULL DEFAULT false,
  highlights   TEXT[] NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experience_entries_resume_id_idx
  ON experience_entries (resume_id, sort_order);

CREATE TABLE IF NOT EXISTS education_entries (
  id             UUID PRIMARY KEY,
  resume_id      UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  school         TEXT NOT NULL DEFAULT '',
  degree         TEXT NOT NULL DEFAULT '',
  field_of_study TEXT NOT NULL DEFAULT '',
  location       TEXT NOT NULL DEFAULT '',
  start_date     TEXT CHECK (start_date IS NULL OR start_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  end_date       TEXT CHECK (end_date IS NULL OR end_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  is_current     BOOLEAN NOT NULL DEFAULT false,
  details        TEXT NOT NULL DEFAULT '',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS education_entries_resume_id_idx
  ON education_entries (resume_id, sort_order);

CREATE TABLE IF NOT EXISTS resume_skills (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id    UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS resume_skills_resume_id_idx
  ON resume_skills (resume_id, sort_order);

CREATE TABLE IF NOT EXISTS project_entries (
  id           UUID PRIMARY KEY,
  resume_id    UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT '',
  link         TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_entries_resume_id_idx
  ON project_entries (resume_id, sort_order);

-- Anonymous workspace sessions. Only a SHA-256 hash of the browser token is
-- stored, so a database leak cannot be replayed as a valid session.
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- Audit trail of generated PDFs archived to cloud object storage.
CREATE TABLE IF NOT EXISTS exports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id    UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  storage_key  TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL DEFAULT 'application/pdf',
  byte_size    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exports_resume_id_idx
  ON exports (resume_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS resumes_set_updated_at ON resumes;
CREATE TRIGGER resumes_set_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
