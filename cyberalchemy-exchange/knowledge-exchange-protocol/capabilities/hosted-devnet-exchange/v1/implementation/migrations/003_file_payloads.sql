-- New expiring payloads only; existing archive and immutable journal remain unchanged.
CREATE TABLE IF NOT EXISTS kep_hosted.file_payloads (
  artifact_version_id TEXT PRIMARY KEY,
  ciphertext_base64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
