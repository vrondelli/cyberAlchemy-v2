#!/usr/bin/env python3
"""Disposable PostgreSQL 16 integration validation for the L1 binding."""
from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "runtime"))

from postgres_store import PostgresClient, PostgresStore  # noqa: E402


def command(args: list[str], *, env=None, check=True) -> subprocess.CompletedProcess:
    result = subprocess.run(args, cwd=REPO, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
    if check and result.returncode:
        raise RuntimeError("COMMAND_FAILED:" + " ".join(args) + "\n" + result.stdout)
    return result


def free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


def execute(root: Path, dsn: str, run_id: str, fixture="valid", stop_after=None) -> dict:
    args = [
        "python3", str(ROOT / "runtime/pipeline.py"), "--root", str(root),
        "--run-id", run_id, "--fixture", fixture, "--backend", "postgres",
        "--postgres-dsn", dsn,
    ]
    if stop_after:
        args += ["--stop-after", stop_after]
    result = command(args)
    return json.loads(result.stdout.splitlines()[-1])


def stable(value: dict) -> dict:
    return {key: value[key] for key in ["status", "run_id", "terminal_event", "journal_records"] if key in value}


def main() -> None:
    port = free_port()
    project = f"cav2-etl-pg-{os.getpid()}"
    compose = str(ROOT / "postgres/docker-compose.yml")
    env = {**os.environ, "CAV2_POSTGRES_PORT": str(port)}
    dsn = f"postgresql://cav2:cav2-local-only@127.0.0.1:{port}/cav2_etl"
    checks = []
    command(["cargo", "build", "--manifest-path", str(ROOT / "rwo-adapter/Cargo.toml"), "--offline"])
    try:
        command(["docker", "compose", "-p", project, "-f", compose, "up", "-d"], env=env)
        client = PostgresClient(dsn)
        deadline = time.monotonic() + 30
        while True:
            try:
                client.execute("SELECT 1;")
                break
            except RuntimeError:
                if time.monotonic() >= deadline:
                    raise RuntimeError("POSTGRES_READINESS_TIMEOUT")
                time.sleep(0.25)
        client.apply_schema(ROOT / "postgres/schema.sql")
        checks.append({"id": "postgres-schema-application", "status": "PASS", "postgres_major": 16})

        with tempfile.TemporaryDirectory() as temporary:
            work = Path(temporary)
            initial = execute(work, dsn, "pg-initial")
            replay = execute(work, dsn, "pg-replay")
            interrupted = execute(work, dsn, "pg-resume", stop_after="MapDataset")
            resumed = execute(work, dsn, "pg-resume")
            rejected = execute(work, dsn, "pg-rejected", fixture="invalid")
            assert initial["status"] == replay["status"] == resumed["status"] == "PASS"
            assert interrupted["status"] == "INTERRUPTED"
            assert rejected["status"] == "QUARANTINED"

        store = PostgresStore(dsn)
        counts = store.counts()
        assert counts == {
            "dataset_versions": 1,
            "indicator_observations": 3,
            "source_checkpoints": 1,
            "quarantine_residues": 1,
            "lineage_events": 8,
        }
        checks += [
            {"id": "postgres-success", "status": "PASS", "result": stable(initial)},
            {"id": "postgres-content-idempotency", "status": "PASS", "dataset_versions": 1},
            {"id": "postgres-crash-resume", "status": "PASS", "result": stable(resumed)},
            {"id": "postgres-validation-quarantine", "status": "PASS", "result": stable(rejected)},
            {"id": "postgres-persistence-counts", "status": "PASS", "counts": counts},
        ]

        effects = client.execute("""
SELECT body->'receipt'->>'effect_applied'
FROM cav2_etl.accepted_history
WHERE body->'event'->>'event_type'='DatasetCommitted'
ORDER BY run_id;
""")
        assert effects.count("true") == 1 and effects.count("false") == 2
        checks.append({"id": "postgres-publication-receipts", "status": "PASS", "effects": {"applied": 1, "no_op": 2}})

        broken = command(
            ["psql", dsn, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c",
             "INSERT INTO cav2_etl.accepted_history(run_id,sequence,previous_hash,record_hash,kind,body) VALUES ('broken',2,repeat('0',64),repeat('1',64),'probe','{}');"],
            check=False,
        )
        assert broken.returncode != 0 and "HISTORY_CHAIN" in broken.stdout
        checks.append({"id": "postgres-history-chain-trigger", "status": "PASS"})

        checkpoint_gate = command(
            ["psql", dsn, "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c",
             "INSERT INTO cav2_etl.source_checkpoints(source_id,checkpoint,version_id,accepted_by_run) SELECT 'forbidden','x',version_id,'no-commit' FROM cav2_etl.dataset_versions LIMIT 1;"],
            check=False,
        )
        assert checkpoint_gate.returncode != 0 and "CHECKPOINT_WITHOUT_ACCEPTED_COMMIT" in checkpoint_gate.stdout
        checks.append({"id": "postgres-checkpoint-trigger", "status": "PASS"})

        report = {
            "schema_version": "cav2-trusted-dataset-postgres-conformance/v1",
            "status": "PASS", "claim_ceiling": "bounded-local-postgresql-candidate",
            "external_effect": "disposable-loopback-postgresql-only", "checks": checks,
            "not_claimed": ["production readiness", "managed PostgreSQL", "high availability", "multi-worker concurrency", "database role hardening", "deployment"],
        }
        target = ROOT / "runs/postgres-conformance-report.json"
        target.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        system_ontology = json.loads(command(["python3", str(ROOT / "scripts/validate_system_ontology.py")]).stdout.splitlines()[-1])
        checks.append({"id": "system-ontology-bridge-closure", "status": system_ontology["status"], "result": system_ontology})
        target.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print(json.dumps({"status": "PASS", "checks": len(checks), "report": str(target)}))
    finally:
        command(["docker", "compose", "-p", project, "-f", compose, "down", "--volumes", "--remove-orphans"], env=env, check=False)


if __name__ == "__main__":
    main()
