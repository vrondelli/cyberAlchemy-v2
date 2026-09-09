BEGIN;

CREATE SCHEMA IF NOT EXISTS cav2_etl;

CREATE TABLE IF NOT EXISTS cav2_etl.accepted_history (
    run_id text NOT NULL,
    sequence bigint NOT NULL CHECK (sequence > 0),
    previous_hash char(64) NOT NULL,
    record_hash char(64) NOT NULL,
    kind text NOT NULL,
    body jsonb NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (run_id, sequence),
    UNIQUE (run_id, record_hash)
);

CREATE OR REPLACE FUNCTION cav2_etl.enforce_history_chain()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    last_sequence bigint;
    last_hash char(64);
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.run_id, 0));
    SELECT sequence, record_hash INTO last_sequence, last_hash
    FROM cav2_etl.accepted_history
    WHERE run_id = NEW.run_id
    ORDER BY sequence DESC LIMIT 1;
    IF last_sequence IS NULL THEN
        IF NEW.sequence <> 1 OR NEW.previous_hash <> repeat('0', 64) THEN
            RAISE EXCEPTION 'HISTORY_CHAIN_HEAD_INVALID';
        END IF;
    ELSIF NEW.sequence <> last_sequence + 1 OR NEW.previous_hash <> last_hash THEN
        RAISE EXCEPTION 'HISTORY_CHAIN_LINK_INVALID';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS accepted_history_chain_guard ON cav2_etl.accepted_history;
CREATE TRIGGER accepted_history_chain_guard
BEFORE INSERT ON cav2_etl.accepted_history
FOR EACH ROW EXECUTE FUNCTION cav2_etl.enforce_history_chain();

CREATE TABLE IF NOT EXISTS cav2_etl.dataset_versions (
    version_id char(64) PRIMARY KEY,
    content_sha256 char(64) NOT NULL UNIQUE,
    media_type text NOT NULL,
    byte_count bigint NOT NULL CHECK (byte_count >= 0),
    row_count bigint NOT NULL CHECK (row_count >= 0),
    created_by_run text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS cav2_etl.indicator_observations (
    version_id char(64) NOT NULL REFERENCES cav2_etl.dataset_versions(version_id),
    countryiso3code text NOT NULL,
    indicator_id text NOT NULL,
    indicator_name text,
    year char(4) NOT NULL CHECK (year ~ '^[0-9]{4}$'),
    value numeric NOT NULL,
    PRIMARY KEY (version_id, countryiso3code, indicator_id, year)
);

CREATE TABLE IF NOT EXISTS cav2_etl.source_checkpoints (
    source_id text PRIMARY KEY,
    checkpoint text NOT NULL,
    version_id char(64) NOT NULL REFERENCES cav2_etl.dataset_versions(version_id),
    accepted_by_run text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE OR REPLACE FUNCTION cav2_etl.enforce_checkpoint_after_commit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM cav2_etl.accepted_history
        WHERE run_id = NEW.accepted_by_run
          AND body->'event'->>'event_type' = 'DatasetCommitted'
          AND body->'receipt'->>'version_id' = NEW.version_id::text
    ) THEN
        RAISE EXCEPTION 'CHECKPOINT_WITHOUT_ACCEPTED_COMMIT';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS source_checkpoint_commit_guard ON cav2_etl.source_checkpoints;
CREATE TRIGGER source_checkpoint_commit_guard
BEFORE INSERT OR UPDATE ON cav2_etl.source_checkpoints
FOR EACH ROW EXECUTE FUNCTION cav2_etl.enforce_checkpoint_after_commit();

CREATE TABLE IF NOT EXISTS cav2_etl.quarantine_residues (
    run_id text PRIMARY KEY,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS cav2_etl.lineage_events (
    run_id text NOT NULL,
    ordinal bigint GENERATED ALWAYS AS IDENTITY,
    event jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    PRIMARY KEY (run_id, ordinal)
);

COMMIT;
