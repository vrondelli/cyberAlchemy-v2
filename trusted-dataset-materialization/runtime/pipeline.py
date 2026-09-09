#!/usr/bin/env python3
"""Contained ETL host: effects and recovery around the pure Rust RWO reducer."""
from __future__ import annotations

import argparse
import contextlib
import hashlib
import http.server
import json
import os
import shutil
import subprocess
import tempfile
import threading
import urllib.parse
import urllib.request
from pathlib import Path

from postgres_store import PostgresStore

PACKAGE = Path(__file__).resolve().parents[1]
ADAPTER = PACKAGE / "rwo-adapter/target/debug/cav2-trusted-dataset-rwo-adapter"
COMPOSITION = PACKAGE / "generated/rwo-composition.json"


def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def data_reference(path: Path) -> dict:
    data = path.read_bytes()
    return {"uri": str(path), "sha256": sha(data), "byte_count": len(data), "media_type": "application/json"}


def invoke_rwo(request: dict) -> dict:
    request = {**request, "composition": json.loads(COMPOSITION.read_text(encoding="utf-8"))}
    result = subprocess.run([str(ADAPTER)], input=canonical(request), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise RuntimeError("RWO_ADAPTER_FAILED:" + result.stderr.decode().strip())
    return json.loads(result.stdout)


class Journal:
    """One append-only, hash-chained accepted-history authority for a run."""

    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.records = self.read_and_verify()

    def read_and_verify(self) -> list[dict]:
        if not self.path.exists():
            return []
        records, previous = [], "0" * 64
        for line in self.path.read_text(encoding="utf-8").splitlines():
            record = json.loads(line)
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
        with self.path.open("ab") as handle:
            handle.write(canonical(record) + b"\n")
            handle.flush()
            os.fsync(handle.fileno())
        self.records.append(record)
        return record


def accepted_event(run_id: str, number: int, event_type: str, source_node: str) -> dict:
    return {
        "contract_id": "RWO-SEMANTIC-CONTRACT", "contract_version": "1.0.0",
        "profile_id": "RWO-JCS-IJSON-SAFEINT", "profile_version": "1.0.0",
        "schema_id": "AcceptedEventView", "schema_version": "1.0.0",
        "stream_id": run_id, "event_id": f"{run_id}-event-{number:03d}",
        "event_type": event_type, "source_node_id": source_node, "payload": {"job_id": run_id},
    }


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
        temporary = Path(handle.name)
    os.replace(temporary, path)
    directory = os.open(path.parent, os.O_DIRECTORY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def latest_state(journal: Journal) -> tuple[dict, dict | None, int]:
    if not journal.records:
        return {}, None, 0
    body = journal.records[-1]["body"]
    return body["cursor"], body.get("next_command"), body["event_number"]


class Pipeline:
    def __init__(self, root: Path, source_url: str, run_id: str, backend: str = "local", postgres_dsn: str | None = None):
        self.root, self.source_url, self.run_id = root, source_url, run_id
        self.backend = backend
        self.run = root / "runs" / run_id
        self.landing, self.working = self.run / "landing", self.run / "working"
        self.warehouse, self.quarantine = root / "warehouse", root / "quarantine"
        self.store = None
        if backend == "postgres":
            if not postgres_dsn:
                raise RuntimeError("POSTGRES_DSN_REQUIRED")
            self.store = PostgresStore(postgres_dsn)
            self.journal = self.store.journal(run_id)
        else:
            self.journal = Journal(self.run / "journal.jsonl")
        for path in [self.landing, self.working, self.warehouse, self.quarantine]:
            path.mkdir(parents=True, exist_ok=True)

    def lineage(self, event_type: str, **facets) -> None:
        event = {"eventType": event_type, "run": {"runId": self.run_id}, "job": {"namespace": "cav2.local", "name": "world-bank-indicators"}, **facets}
        if self.store:
            self.store.lineage(self.run_id, event)
            return
        with (self.run / "openlineage-shaped.jsonl").open("ab") as handle:
            handle.write(canonical(event) + b"\n")

    def execute(self, command: str) -> tuple[str, dict]:
        method = getattr(self, "op_" + command)
        return method()

    def op_DiscoverSource(self):
        return "SourceDiscovered", {"source": self.source_url, "protocol": "HTTP/1.1"}

    def op_PlanExtractWindow(self):
        return "ExtractPlanned", {"window": "fixture-complete", "proposed_checkpoint": "fixture-complete"}

    def op_ExtractWindow(self):
        page, references = 1, []
        while True:
            url = self.source_url + "?" + urllib.parse.urlencode({"page": page, "per_page": 2})
            with urllib.request.urlopen(url, timeout=5) as response:
                data = response.read()
            parsed = json.loads(data)
            target = self.landing / f"page-{page:04d}.json"
            atomic_write(target, canonical(parsed) + b"\n")
            references.append(data_reference(target))
            if page >= int(parsed[0]["pages"]):
                break
            page += 1
        return "WindowExtracted", {"pages": references, "proposed_checkpoint": "fixture-complete"}

    def op_SealRawDataset(self):
        refs = [data_reference(path) for path in sorted(self.landing.glob("page-*.json"))]
        manifest = self.working / "raw-manifest.json"
        atomic_write(manifest, canonical({"pages": refs}) + b"\n")
        return "RawDatasetSealed", {"raw_dataset": data_reference(manifest)}

    def op_MapDataset(self):
        rows = []
        for path in sorted(self.landing.glob("page-*.json")):
            for row in json.loads(path.read_text(encoding="utf-8"))[1]:
                rows.append({
                    "countryiso3code": row.get("countryiso3code"), "indicator_id": row.get("indicator", {}).get("id"),
                    "indicator_name": row.get("indicator", {}).get("value"), "year": row.get("date"), "value": row.get("value"),
                })
        rows.sort(key=lambda item: (str(item["countryiso3code"]), str(item["indicator_id"]), str(item["year"])))
        target = self.working / "mapped.jsonl"
        atomic_write(target, b"".join(canonical(row) + b"\n" for row in rows))
        return "DatasetMapped", {"mapped_dataset": data_reference(target), "row_count": len(rows)}

    def op_ValidateDataset(self):
        rows = [json.loads(line) for line in (self.working / "mapped.jsonl").read_text().splitlines()]
        findings, identities = [], set()
        for index, row in enumerate(rows):
            identity = (row.get("countryiso3code"), row.get("indicator_id"), row.get("year"))
            if any(value in (None, "") for value in (*identity, row.get("value"))):
                findings.append({"code": "REQUIRED_VALUE_MISSING", "row": index})
            if identity in identities:
                findings.append({"code": "IDENTITY_NOT_UNIQUE", "row": index})
            identities.add(identity)
            if not isinstance(row.get("value"), (int, float)) or isinstance(row.get("value"), bool):
                findings.append({"code": "VALUE_NOT_NUMBER", "row": index})
            if not isinstance(row.get("year"), str) or len(row["year"]) != 4 or not row["year"].isdigit():
                findings.append({"code": "YEAR_INVALID", "row": index})
        report = self.working / "validation.json"
        atomic_write(report, canonical({"status": "PASS" if not findings else "REJECT", "findings": findings}) + b"\n")
        event = "DatasetValidated" if not findings else "ValidationRejected"
        return event, {"validation_report": data_reference(report), "finding_count": len(findings)}

    def op_StageLoad(self):
        target = self.working / "staged.jsonl"
        atomic_write(target, (self.working / "mapped.jsonl").read_bytes())
        return "LoadStaged", {"staged_dataset": data_reference(target)}

    def op_CommitDataset(self):
        data = (self.working / "staged.jsonl").read_bytes()
        version = sha(data)
        if self.store:
            rows = [json.loads(line) for line in data.decode().splitlines()]
            published = self.store.publish(self.run_id, data, rows)
            effect = published.pop("effect_applied")
            return "DatasetCommitted", {"published_dataset": published, "version_id": version, "effect_applied": effect, "accepted_checkpoint": "fixture-complete"}
        target = self.warehouse / f"world-bank-indicators-{version}.jsonl"
        effect = True
        if target.exists():
            if target.read_bytes() != data:
                raise RuntimeError("IDEMPOTENCY_CONFLICT")
            effect = False
        else:
            atomic_write(target, data)
        return "DatasetCommitted", {"published_dataset": data_reference(target), "version_id": version, "effect_applied": effect, "accepted_checkpoint": "fixture-complete"}

    def op_ReconcileRun(self):
        if self.store:
            commits = [record for record in self.journal.records if record["body"]["event"]["event_type"] == "DatasetCommitted"]
            if not commits:
                raise RuntimeError("RECONCILIATION_OUTPUT_MISSING")
            version = commits[-1]["body"]["receipt"]["version_id"]
            return "RunReconciled", {"published_dataset": self.store.reconcile(version), "reconciled": True}
        published = sorted(self.warehouse.glob("world-bank-indicators-*.jsonl"))
        if not published:
            raise RuntimeError("RECONCILIATION_OUTPUT_MISSING")
        return "RunReconciled", {"published_dataset": data_reference(published[-1]), "reconciled": True}

    def op_CloseRun(self):
        return "RunClosed", {"terminal": "trusted-dataset"}

    def op_QuarantineDataset(self):
        payload = {"mapped_dataset": data_reference(self.working / "mapped.jsonl"), "validation_report": data_reference(self.working / "validation.json")}
        if self.store:
            return "DatasetQuarantined", {"quarantine_residue": self.store.quarantine(self.run_id, payload)}
        target = self.quarantine / f"{self.run_id}.json"
        atomic_write(target, canonical(payload) + b"\n")
        return "DatasetQuarantined", {"quarantine_residue": data_reference(target)}

    def op_CloseWithResidue(self):
        return "ResidueClosed", {"terminal": "quarantine-residue"}

    def run_to_terminal(self, stop_after: str | None = None) -> dict:
        if not self.journal.records:
            compiled = invoke_rwo({"operation": "compile", "stream_id": self.run_id})
            event_number, cursor = 1, compiled["cursor"]
            event = accepted_event(self.run_id, event_number, "MaterializationRequested", "world-bank-indicators-http-to-local-warehouse")
            reduced = invoke_rwo({"operation": "reduce", "cursor": cursor, "event": event})
            if reduced["kind"] != "Applied": raise RuntimeError("INITIAL_EVENT_REJECTED")
            self.journal.append("accepted-transition", {"event_number": event_number, "event": event, "cursor": reduced["cursor"], "next_command": reduced["command"], "receipt": {"run_opened": True}})
            self.lineage("START", inputs=[{"namespace": "loopback-http", "name": self.source_url}])
        cursor, command_value, event_number = latest_state(self.journal)
        while command_value is not None:
            command = command_value["command_type"]
            event_type, receipt = self.execute(command)
            event_number += 1
            event = accepted_event(self.run_id, event_number, event_type, command)
            reduced = invoke_rwo({"operation": "reduce", "cursor": cursor, "event": event})
            if reduced["kind"] != "Applied" or reduced["defects"]:
                raise RuntimeError("RWO_REDUCE_REJECTED:" + reduced["kind"])
            self.journal.append("accepted-transition", {"event_number": event_number, "event": event, "cursor": reduced["cursor"], "next_command": reduced["command"], "receipt": receipt})
            cursor, command_value = reduced["cursor"], reduced["command"]
            if event_type == "DatasetCommitted":
                if self.store:
                    self.store.accept_checkpoint(self.run_id, receipt["accepted_checkpoint"], receipt["version_id"])
                else:
                    atomic_write(self.run / "accepted-source-checkpoint.json", canonical({"checkpoint": receipt["accepted_checkpoint"], "publication": receipt["published_dataset"]}) + b"\n")
            if stop_after == command:
                return {"status": "INTERRUPTED", "after": command, "run_id": self.run_id}
        terminal = self.journal.records[-1]["body"]["event"]["event_type"]
        status = "PASS" if terminal == "RunClosed" else "QUARANTINED"
        self.lineage("COMPLETE" if status == "PASS" else "FAIL", outputs=[{"namespace": "local", "name": terminal}])
        result = {"status": status, "run_id": self.run_id, "terminal_event": terminal, "journal_records": len(self.journal.records), "journal_head": self.journal.records[-1]["record_hash"]}
        atomic_write(self.run / "result.json", canonical(result) + b"\n")
        return result


@contextlib.contextmanager
def fixture_server(fixture: str):
    fixture_dir = PACKAGE / "fixtures/http"

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            page = int(urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get("page", ["1"])[0])
            name = f"{fixture}-page-{page}.json"
            path = fixture_dir / name
            if not path.exists():
                self.send_error(404); return
            data = path.read_bytes()
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(data))); self.end_headers(); self.wfile.write(data)
        def log_message(self, *_): pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}/indicators"
    finally:
        server.shutdown(); thread.join()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--fixture", choices=["valid", "invalid"], default="valid")
    parser.add_argument("--stop-after")
    parser.add_argument("--backend", choices=["local", "postgres"], default="local")
    parser.add_argument("--postgres-dsn")
    args = parser.parse_args()
    with fixture_server(args.fixture) as url:
        pipeline = Pipeline(args.root, url, args.run_id, backend=args.backend, postgres_dsn=args.postgres_dsn)
        print(json.dumps(pipeline.run_to_terminal(args.stop_after), sort_keys=True))


if __name__ == "__main__":
    main()
