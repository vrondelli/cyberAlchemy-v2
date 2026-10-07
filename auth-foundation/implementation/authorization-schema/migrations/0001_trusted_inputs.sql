PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_authentication_evidence (
    evidence_row_id INTEGER PRIMARY KEY,
    evidence_ref TEXT NOT NULL CHECK (length(evidence_ref) > 0),
    session_id TEXT NOT NULL CHECK (length(session_id) > 0),
    trusted INTEGER NOT NULL CHECK (trusted IN (0, 1)),
    revoked INTEGER NOT NULL CHECK (revoked IN (0, 1)),
    expires_at INTEGER NOT NULL CHECK (expires_at >= 0)
);

CREATE INDEX IF NOT EXISTS auth_authentication_evidence_by_ref
    ON auth_authentication_evidence (evidence_ref, evidence_row_id);

CREATE TABLE IF NOT EXISTS auth_route_authorization_bindings (
    binding_row_id INTEGER PRIMARY KEY,
    route_id TEXT NOT NULL CHECK (length(route_id) > 0),
    resource TEXT NOT NULL CHECK (length(resource) > 0),
    action TEXT NOT NULL CHECK (length(action) > 0),
    scope TEXT NOT NULL CHECK (length(scope) > 0),
    scope_evidence_ref TEXT NOT NULL CHECK (length(scope_evidence_ref) > 0),
    complete INTEGER NOT NULL CHECK (complete IN (0, 1)),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS auth_route_bindings_by_route
    ON auth_route_authorization_bindings (route_id, binding_row_id);

PRAGMA user_version = 1;
