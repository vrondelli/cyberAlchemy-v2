PRAGMA foreign_keys=ON;
PRAGMA user_version=1;
CREATE TABLE metadata (singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema_version INTEGER NOT NULL CHECK(schema_version=1), profile_digest TEXT NOT NULL, resource_id TEXT NOT NULL UNIQUE);
CREATE TABLE business_state (subject_id TEXT PRIMARY KEY, value INTEGER NOT NULL);
CREATE TABLE invocation_results (invocation_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL, binding_digest TEXT NOT NULL, payload_digest TEXT NOT NULL, result_json TEXT NOT NULL, result_digest TEXT NOT NULL, committed_at INTEGER NOT NULL);
CREATE TABLE operation_outbox (event_id TEXT PRIMARY KEY, invocation_id TEXT NOT NULL UNIQUE REFERENCES invocation_results(invocation_id), payload_json TEXT NOT NULL);
CREATE TRIGGER immutable_result_update BEFORE UPDATE ON invocation_results BEGIN SELECT RAISE(ABORT,'immutable-result'); END;
CREATE TRIGGER immutable_result_delete BEFORE DELETE ON invocation_results BEGIN SELECT RAISE(ABORT,'immutable-result'); END;
