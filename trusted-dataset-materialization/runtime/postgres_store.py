"""PostgreSQL physical binding using the installed psql protocol client."""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def jsonb(value) -> str:
    return f"convert_from(decode('{canonical(value).hex()}','hex'),'UTF8')::jsonb"


class PostgresClient:
    def __init__(self, dsn: str):
        self.dsn = dsn

    def execute(self, sql: str) -> list[str]:
        result = subprocess.run(
            ["psql", self.dsn, "-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
            input=sql,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )
        if result.returncode:
            raise RuntimeError("POSTGRES_COMMAND_FAILED:" + result.stderr.strip())
        return [line for line in result.stdout.splitlines() if line]

    def apply_schema(self, path: Path) -> None:
        self.execute(path.read_text(encoding="utf-8"))


class PostgresJournal:
    """One PostgreSQL accepted-history authority for one run."""

    def __init__(self, client: PostgresClient, run_id: str):
        self.client, self.run_id = client, run_id
        self.records = self.read_and_verify()

    def read_and_verify(self) -> list[dict]:
        rows = self.client.execute(f"""
SELECT jsonb_build_object(
  'sequence', sequence, 'previous_hash', previous_hash,
  'record_hash', record_hash, 'kind', kind, 'body', body
)::text
FROM cav2_etl.accepted_history
WHERE run_id = {literal(self.run_id)}
ORDER BY sequence;
""")
        records, previous = [], "0" * 64
        for row in rows:
            record = json.loads(row)
            claimed = record.pop("record_hash")
            if record["previous_hash"] != previous or sha(canonical(record)) != claimed:
                raise RuntimeError("JOURNAL_CHAIN_INVALID")
            record["record_hash"] = claimed
            records.append(record)
            previous = claimed
        return records

    def append(self, kind: str, body: dict) -> dict:
        base = {
            "sequence": len(self.records) + 1,
            "previous_hash": self.records[-1]["record_hash"] if self.records else "0" * 64,
            "kind": kind,
            "body": body,
        }
        record = {**base, "record_hash": sha(canonical(base))}
        inserted = self.client.execute(f"""
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended({literal(self.run_id)}, 0));
WITH accepted AS (
  INSERT INTO cav2_etl.accepted_history(run_id, sequence, previous_hash, record_hash, kind, body)
  SELECT {literal(self.run_id)}, {record['sequence']}, {literal(record['previous_hash'])},
         {literal(record['record_hash'])}, {literal(kind)}, {jsonb(body)}
  WHERE COALESCE((SELECT max(sequence) FROM cav2_etl.accepted_history WHERE run_id={literal(self.run_id)}), 0) = {record['sequence'] - 1}
    AND COALESCE((SELECT record_hash FROM cav2_etl.accepted_history WHERE run_id={literal(self.run_id)} ORDER BY sequence DESC LIMIT 1), {'0' * 64!r}) = {literal(record['previous_hash'])}
  RETURNING 1
)
SELECT count(*) FROM accepted;
COMMIT;
""")
        if inserted[-1:] != ["1"]:
            raise RuntimeError("JOURNAL_COMPARE_AND_APPEND_REJECTED")
        self.records.append(record)
        return record


class PostgresStore:
    def __init__(self, dsn: str):
        self.client = PostgresClient(dsn)

    def journal(self, run_id: str) -> PostgresJournal:
        return PostgresJournal(self.client, run_id)

    def publish(self, run_id: str, data: bytes, rows: list[dict]) -> dict:
        version = sha(data)
        inserted = self.client.execute(f"""
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended({literal(version)}, 0));
WITH new_version AS (
  INSERT INTO cav2_etl.dataset_versions(version_id, content_sha256, media_type, byte_count, row_count, created_by_run)
  VALUES ({literal(version)}, {literal(version)}, 'application/x-ndjson', {len(data)}, {len(rows)}, {literal(run_id)})
  ON CONFLICT (version_id) DO NOTHING
  RETURNING version_id
), new_rows AS (
  INSERT INTO cav2_etl.indicator_observations(version_id, countryiso3code, indicator_id, indicator_name, year, value)
  SELECT {literal(version)}, item->>'countryiso3code', item->>'indicator_id', item->>'indicator_name', item->>'year', (item->>'value')::numeric
  FROM jsonb_array_elements({jsonb(rows)}) AS item
  WHERE EXISTS (SELECT 1 FROM new_version)
  RETURNING 1
)
SELECT CASE WHEN EXISTS (SELECT 1 FROM new_version) THEN 'applied' ELSE 'existing' END;
COMMIT;
""")
        effect = inserted[-1:] == ["applied"]
        return {
            "uri": f"postgresql://cav2_etl/dataset_versions/{version}",
            "sha256": version,
            "byte_count": len(data),
            "media_type": "application/x-ndjson",
            "row_count": len(rows),
            "effect_applied": effect,
        }

    def reconcile(self, version: str) -> dict:
        row = self.client.execute(f"""
SELECT jsonb_build_object(
  'uri', 'postgresql://cav2_etl/dataset_versions/' || version_id,
  'sha256', content_sha256, 'byte_count', byte_count,
  'media_type', media_type, 'row_count', row_count
)::text
FROM cav2_etl.dataset_versions WHERE version_id={literal(version)};
""")
        if len(row) != 1:
            raise RuntimeError("RECONCILIATION_OUTPUT_MISSING")
        return json.loads(row[0])

    def accept_checkpoint(self, run_id: str, checkpoint: str, version: str) -> None:
        changed = self.client.execute(f"""
WITH accepted AS (
  INSERT INTO cav2_etl.source_checkpoints(source_id, checkpoint, version_id, accepted_by_run)
  SELECT 'world-bank-indicators', {literal(checkpoint)}, {literal(version)}, {literal(run_id)}
  WHERE EXISTS (
    SELECT 1 FROM cav2_etl.accepted_history
    WHERE run_id={literal(run_id)} AND body->'event'->>'event_type'='DatasetCommitted'
  )
  ON CONFLICT (source_id) DO UPDATE SET
    checkpoint=EXCLUDED.checkpoint, version_id=EXCLUDED.version_id,
    accepted_by_run=EXCLUDED.accepted_by_run, accepted_at=clock_timestamp()
  RETURNING 1
)
SELECT count(*) FROM accepted;
""")
        if changed[-1:] != ["1"]:
            raise RuntimeError("CHECKPOINT_WITHOUT_ACCEPTED_COMMIT")

    def quarantine(self, run_id: str, payload: dict) -> dict:
        self.client.execute(f"""
INSERT INTO cav2_etl.quarantine_residues(run_id, payload)
VALUES ({literal(run_id)}, {jsonb(payload)})
ON CONFLICT (run_id) DO UPDATE SET payload=EXCLUDED.payload;
""")
        data = canonical(payload)
        return {"uri": f"postgresql://cav2_etl/quarantine_residues/{run_id}", "sha256": sha(data), "byte_count": len(data), "media_type": "application/json"}

    def lineage(self, run_id: str, event: dict) -> None:
        self.client.execute(f"INSERT INTO cav2_etl.lineage_events(run_id,event) VALUES ({literal(run_id)}, {jsonb(event)});")

    def counts(self) -> dict:
        row = self.client.execute("""
SELECT jsonb_build_object(
 'dataset_versions',(SELECT count(*) FROM cav2_etl.dataset_versions),
 'indicator_observations',(SELECT count(*) FROM cav2_etl.indicator_observations),
 'source_checkpoints',(SELECT count(*) FROM cav2_etl.source_checkpoints),
 'quarantine_residues',(SELECT count(*) FROM cav2_etl.quarantine_residues),
 'lineage_events',(SELECT count(*) FROM cav2_etl.lineage_events)
)::text;
""")
        return json.loads(row[0])
