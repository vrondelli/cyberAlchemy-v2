CREATE TABLE IF NOT EXISTS durable_objects (
    domain TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    algorithm_version INTEGER NOT NULL CHECK (algorithm_version > 0),
    digest BYTEA NOT NULL,
    object_bytes BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (domain, algorithm, algorithm_version, digest)
);

CREATE TABLE IF NOT EXISTS recovery_journal (
    journal_sequence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    domain TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    algorithm_version INTEGER NOT NULL CHECK (algorithm_version > 0),
    digest BYTEA NOT NULL,
    object_bytes BYTEA NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (domain, algorithm, algorithm_version, digest)
);

CREATE OR REPLACE FUNCTION reject_recovery_journal_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'recovery_journal is append-only';
END;
$$;

DROP TRIGGER IF EXISTS recovery_journal_no_update ON recovery_journal;
CREATE TRIGGER recovery_journal_no_update
BEFORE UPDATE OR DELETE ON recovery_journal
FOR EACH ROW EXECUTE FUNCTION reject_recovery_journal_mutation();

