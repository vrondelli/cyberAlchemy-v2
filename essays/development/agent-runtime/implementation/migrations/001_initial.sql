CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  work_owner TEXT NOT NULL,
  accepted_revision INTEGER NOT NULL,
  accepted_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_proposals (
  proposal_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  producer TEXT NOT NULL,
  client_id TEXT NOT NULL,
  source_revision INTEGER NOT NULL,
  context_digest TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  target_artifact TEXT NOT NULL,
  target_region TEXT NOT NULL,
  text TEXT NOT NULL,
  rationale TEXT NOT NULL,
  uncertainty TEXT NOT NULL,
  validation_diagnostics_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','accepted','rejected','superseded','withdrawn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disposition_reason TEXT
);

CREATE TABLE IF NOT EXISTS runtime_requests (
  request_id TEXT PRIMARY KEY,
  command_digest TEXT NOT NULL,
  actor TEXT NOT NULL,
  client_id TEXT NOT NULL,
  receipt_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtime_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS runtime_events_workspace_cursor
ON runtime_events(workspace_id, event_id);

CREATE TABLE IF NOT EXISTS runtime_effects (
  effect_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  owner TEXT NOT NULL,
  actor TEXT NOT NULL,
  target TEXT NOT NULL,
  scope_json TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('planned','certain','failed','cancelled','uncertain')),
  retry_allowed INTEGER NOT NULL DEFAULT 0,
  evidence_expectation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reconciled_at TEXT
);

CREATE TABLE IF NOT EXISTS runtime_browser_evidence (
  evidence_id TEXT PRIMARY KEY,
  effect_id TEXT NOT NULL REFERENCES runtime_effects(effect_id),
  workspace_id TEXT NOT NULL REFERENCES workspaces(workspace_id),
  method TEXT NOT NULL,
  origin TEXT NOT NULL,
  artifact_sha256 TEXT,
  redacted_observation TEXT NOT NULL,
  captured_at_unix_ms INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  residue_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pairing_codes (
  code_digest TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  expires_at_unix_ms INTEGER NOT NULL,
  consumed_at_unix_ms INTEGER
);

CREATE TABLE IF NOT EXISTS capability_leases (
  lease_id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  client_id TEXT NOT NULL,
  jwk_thumbprint TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  expires_at_unix_ms INTEGER NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at_unix_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS capability_leases_thumbprint
ON capability_leases(jwk_thumbprint, client_id);

CREATE TABLE IF NOT EXISTS dpop_replay_guard (
  jwk_thumbprint TEXT NOT NULL,
  jti TEXT NOT NULL,
  observed_at_unix_ms INTEGER NOT NULL,
  PRIMARY KEY(jwk_thumbprint, jti)
);
