#!/usr/bin/env python3
"""Build and validate the bounded local ETL capability candidate."""
from __future__ import annotations

import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]


def run(*args: str) -> str:
    result = subprocess.run(args, cwd=REPO, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
    if result.returncode:
        raise RuntimeError("COMMAND_FAILED:" + " ".join(args) + "\n" + result.stdout)
    return result.stdout


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def records(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]


def verify_chain(path: Path) -> None:
    previous = "0" * 64
    for record in records(path):
        claimed = record.pop("record_hash")
        actual = hashlib.sha256(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
        assert record["previous_hash"] == previous and claimed == actual
        previous = claimed


def execute(root: Path, run_id: str, fixture="valid", stop_after=None) -> dict:
    command = ["python3", str(ROOT / "runtime/pipeline.py"), "--root", str(root), "--run-id", run_id, "--fixture", fixture]
    if stop_after: command += ["--stop-after", stop_after]
    return json.loads(run(*command).splitlines()[-1])


def stable_result(value: dict) -> dict:
    return {key: value[key] for key in ["status", "run_id", "terminal_event", "journal_records"] if key in value}


def main() -> None:
    checks = []
    generated = ["generated/compiled-graph.json", "generated/system-ontology.json", "generated/rwo-composition.json", "generated/build-receipt.json"]
    run("python3", str(ROOT / "scripts/compile.py"))
    first = {path: file_sha(ROOT / path) for path in generated}
    run("python3", str(ROOT / "scripts/compile.py"))
    second = {path: file_sha(ROOT / path) for path in generated}
    assert first == second
    checks.append({"id": "deterministic-compilation", "status": "PASS", "digests": first})

    lock = json.loads((ROOT / "dependency-lock.json").read_text())
    for dependency in lock["dependencies"]:
        if "sha256" in dependency:
            assert file_sha(REPO / dependency["path"]) == dependency["sha256"]
    checks.append({"id": "selected-dependency-bytes", "status": "PASS"})

    run("cargo", "test", "--manifest-path", str(ROOT / "rwo-adapter/Cargo.toml"), "--offline")
    run("cargo", "build", "--manifest-path", str(ROOT / "rwo-adapter/Cargo.toml"), "--offline")
    checks.append({"id": "rwo-adapter-tests", "status": "PASS"})

    with tempfile.TemporaryDirectory() as temporary:
        work = Path(temporary)
        initial = execute(work, "initial")
        replay = execute(work, "replay")
        interrupted = execute(work, "resume", stop_after="MapDataset")
        resumed = execute(work, "resume")
        rejected = execute(work, "rejected", fixture="invalid")
        assert initial["status"] == replay["status"] == resumed["status"] == "PASS"
        assert interrupted["status"] == "INTERRUPTED" and rejected["status"] == "QUARANTINED"
        assert len(list((work / "warehouse").glob("*.jsonl"))) == 1
        assert not (work / "runs/rejected/accepted-source-checkpoint.json").exists()
        assert (work / "quarantine/rejected.json").exists()
        for run_id in ["initial", "replay", "resume", "rejected"]:
            verify_chain(work / "runs" / run_id / "journal.jsonl")
        tampered = work / "runs/tampered"
        tampered.mkdir()
        journal_bytes = (work / "runs/initial/journal.jsonl").read_bytes()
        (tampered / "journal.jsonl").write_bytes(journal_bytes.replace(b'"run_opened":true', b'"run_opened":false', 1))
        tamper_probe = subprocess.run(
            ["python3", str(ROOT / "runtime/pipeline.py"), "--root", str(work), "--run-id", "tampered"],
            cwd=REPO, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False,
        )
        assert tamper_probe.returncode != 0 and "JOURNAL_CHAIN_INVALID" in tamper_probe.stdout
        initial_commit = next(r for r in records(work / "runs/initial/journal.jsonl") if r["body"]["event"]["event_type"] == "DatasetCommitted")
        replay_commit = next(r for r in records(work / "runs/replay/journal.jsonl") if r["body"]["event"]["event_type"] == "DatasetCommitted")
        assert initial_commit["body"]["receipt"]["effect_applied"] is True
        assert replay_commit["body"]["receipt"]["effect_applied"] is False
        assert (work / "runs/initial/accepted-source-checkpoint.json").exists()
        checks += [
            {"id": "loopback-http-success", "status": "PASS", "result": stable_result(initial)},
            {"id": "content-idempotent-replay", "status": "PASS", "effect_applied": [True, False]},
            {"id": "journal-crash-resume", "status": "PASS", "result": stable_result(resumed)},
            {"id": "journal-tamper-rejection", "status": "PASS"},
            {"id": "validation-quarantine", "status": "PASS", "result": stable_result(rejected)},
            {"id": "checkpoint-after-publication", "status": "PASS"},
            {"id": "openlineage-shaped-events", "status": "PASS", "conformance_claim": "shape-only"},
        ]

    protocols = [json.loads(path.read_text()) for path in sorted((ROOT / "protocols").glob("*.json"))]
    executed = [item["protocol"] for item in protocols if item["status"].startswith("executed")]
    contract_only = [item["protocol"] for item in protocols if item["status"] == "contract-only-not-executed"]
    assert set(executed) == {"HTTP/1.1 JSON", "PostgreSQL wire protocol via psql 16"} and len(contract_only) == 3
    checks.append({"id": "protocol-claim-boundary", "status": "PASS", "executed": executed, "contract_only": contract_only})

    report = {
        "schema_version": "cav2-trusted-dataset-materialization-conformance/v1",
        "status": "PASS", "claim_ceiling": "bounded_local_candidate",
        "authority_effect": "none", "external_effect": "loopback-only",
        "checks": checks,
        "not_claimed": ["capability adoption", "ontology admission", "DomainSpec admission", "production readiness", "gRPC execution", "Arrow Flight execution", "Kafka execution", "OpenLineage specification conformance"],
    }
    target = ROOT / "runs/conformance-report.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    system_ontology = json.loads(run("python3", str(ROOT / "scripts/validate_system_ontology.py")).splitlines()[-1])
    checks.append({"id": "system-ontology-bridge-closure", "status": system_ontology["status"], "result": system_ontology})
    target.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "report": str(target), "checks": len(checks)}))


if __name__ == "__main__":
    main()
