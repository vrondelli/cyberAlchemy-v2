PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_sessions (
    session_row_id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL CHECK (length(session_id) > 0),
    user_id TEXT NOT NULL CHECK (length(user_id) > 0),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'revoked')),
    authorization_revision INTEGER NOT NULL CHECK (authorization_revision >= 0),
    expires_at INTEGER NOT NULL CHECK (expires_at >= 0)
);

CREATE INDEX IF NOT EXISTS auth_sessions_by_session_id
    ON auth_sessions (session_id);

CREATE TABLE IF NOT EXISTS auth_roles (
    role_id TEXT PRIMARY KEY CHECK (length(role_id) > 0)
);

CREATE TABLE IF NOT EXISTS auth_session_active_roles (
    session_row_id INTEGER NOT NULL REFERENCES auth_sessions(session_row_id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES auth_roles(role_id),
    PRIMARY KEY (session_row_id, role_id)
);

CREATE TABLE IF NOT EXISTS auth_role_permissions (
    role_id TEXT NOT NULL REFERENCES auth_roles(role_id) ON DELETE CASCADE,
    resource TEXT NOT NULL CHECK (length(resource) > 0),
    action TEXT NOT NULL CHECK (length(action) > 0),
    scope TEXT NOT NULL CHECK (length(scope) > 0),
    PRIMARY KEY (role_id, resource, action, scope)
);

CREATE TABLE IF NOT EXISTS auth_authorization_revisions (
    session_id TEXT PRIMARY KEY CHECK (length(session_id) > 0),
    revision INTEGER NOT NULL CHECK (revision >= 0)
);

CREATE TABLE IF NOT EXISTS auth_scope_evidence (
    evidence_ref TEXT PRIMARY KEY CHECK (length(evidence_ref) > 0),
    resource TEXT NOT NULL CHECK (length(resource) > 0),
    action TEXT NOT NULL CHECK (length(action) > 0),
    scope TEXT NOT NULL CHECK (length(scope) > 0),
    trusted INTEGER NOT NULL CHECK (trusted IN (0, 1))
);

PRAGMA user_version = 1;
