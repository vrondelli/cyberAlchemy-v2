CREATE TABLE IF NOT EXISTS kep_hosted.state_documents (
  collection TEXT NOT NULL CHECK (collection IN ('accounts', 'files', 'identities', 'artifacts', 'grants', 'reissues', 'consumed_operations', 'client_errors')),
  record_id TEXT NOT NULL,
  document JSONB NOT NULL,
  PRIMARY KEY (collection, record_id)
);

-- statement
CREATE TABLE IF NOT EXISTS kep_hosted.state_layout (
  singleton SMALLINT PRIMARY KEY CHECK (singleton = 1),
  version SMALLINT NOT NULL CHECK (version = 1),
  legacy_state_sha256 BYTEA CHECK (octet_length(legacy_state_sha256) = 32),
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- statement
DROP TRIGGER IF EXISTS kep_hosted_legacy_state_frozen ON kep_hosted.application_state;

-- statement
CREATE TRIGGER kep_hosted_legacy_state_frozen BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON kep_hosted.application_state FOR EACH STATEMENT EXECUTE FUNCTION kep_hosted.reject_immutable_mutation();

-- statement
DROP TRIGGER IF EXISTS kep_hosted_layout_frozen ON kep_hosted.state_layout;

-- statement
CREATE TRIGGER kep_hosted_layout_frozen BEFORE UPDATE OR DELETE OR TRUNCATE ON kep_hosted.state_layout FOR EACH STATEMENT EXECUTE FUNCTION kep_hosted.reject_immutable_mutation();
