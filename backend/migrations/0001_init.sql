-- Xunji 初始 schema（与 docs/ENGINEERING.md 第 4 节一致）
-- {{EMBEDDING_DIM}} 由 app/db.py::run_migrations() 替换为 settings.embedding_dim

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email ON users (lower(email));

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS ix_auth_tokens_user ON auth_tokens(user_id);

CREATE TABLE IF NOT EXISTS documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url        text NOT NULL,
  canonical_url       text NOT NULL,
  normalized_url_hash text NOT NULL,
  source_type         text NOT NULL DEFAULT 'web',
  site_name           text,
  title               text,
  author              text,
  published_at        timestamptz,
  description         text,
  summary_short       text,
  summary_long        text,
  keywords            text[] NOT NULL DEFAULT '{}',
  topics              text[] NOT NULL DEFAULT '{}',
  plain_text          text,
  content_markdown    text,
  language            text,
  parse_status        text NOT NULL DEFAULT 'pending',
  parse_stage         text,
  parse_error_code    text,
  parse_error_message text,
  content_hash        text,
  metadata_json       jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_at            timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  last_parsed_at      timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_documents_user_urlhash
  ON documents(user_id, normalized_url_hash);
CREATE INDEX IF NOT EXISTS ix_documents_user_saved ON documents(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS ix_documents_user_status ON documents(user_id, parse_status);
CREATE INDEX IF NOT EXISTS ix_documents_user_source ON documents(user_id, source_type);
CREATE INDEX IF NOT EXISTS ix_documents_title_trgm ON documents USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_documents_plain_trgm
  ON documents USING gin (coalesce(plain_text, '') gin_trgm_ops);

CREATE TABLE IF NOT EXISTS document_chunks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id       uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chunk_index       int NOT NULL,
  content           text NOT NULL,
  content_hash      text NOT NULL,
  token_count       int NOT NULL DEFAULT 0,
  embedding         vector({{EMBEDDING_DIM}}),
  embedding_model   text,
  embedding_version int NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_chunks_document ON document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS ix_chunks_user ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE TABLE IF NOT EXISTS processing_jobs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id        uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type           text NOT NULL DEFAULT 'process_document',
  status             text NOT NULL DEFAULT 'queued',
  attempt_count      int NOT NULL DEFAULT 0,
  max_attempts       int NOT NULL DEFAULT 3,
  available_at       timestamptz NOT NULL DEFAULT now(),
  locked_at          timestamptz,
  locked_by          text,
  last_error_code    text,
  last_error_message text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz
);
CREATE INDEX IF NOT EXISTS ix_jobs_claim ON processing_jobs(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS ix_jobs_document ON processing_jobs(document_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_jobs_active_document
  ON processing_jobs(document_id, job_type)
  WHERE status IN ('queued', 'running', 'retrying');

CREATE TABLE IF NOT EXISTS document_relations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relation_type      text NOT NULL,
  score              real NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_document_id, target_document_id, relation_type)
);
CREATE INDEX IF NOT EXISTS ix_relations_source
  ON document_relations(source_document_id, score DESC);
