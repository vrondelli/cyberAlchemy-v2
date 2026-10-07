#!/usr/bin/env python3
"""Seal source-only failure queries for BugSwarm graph development cohort B."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
PINS = {
    "candidate": (BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json", "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"),
    "metadata": (BASE / "source-only-r1/FAILURE-SIDE-METADATA.jsonl", "5ba19618795f031bac0d19e1c20344f98e86c0a6bb6496c15da55c696d703686"),
    "preflight": (BASE / "graph-dev-b-r1/DEV-PREFLIGHT-B-R1.json", "cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd"),
    "projection": (BASE / "graph-dev-b-r2/code-only/SOURCE-PROJECTION-RECEIPT.json", "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"),
}
OUTPUT = BASE / "graph-dev-b-r2/code-only"
ANSI = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
SENSITIVE = re.compile(
    r"(?i)(?:\b(?:api[_-]?key|access[_-]?token|password|secret|authorization)\b\s*[:=]\s*['\"]?\S{8,}|"
    r"gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)"
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def limited(value: str, maximum: int, suffix: bool = False) -> str:
    data = value.encode("utf-8")
    return (data[-maximum:] if suffix else data[:maximum]).decode("utf-8", errors="ignore")


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if any(sha(path.read_bytes()) != pin for path, pin in PINS.values()):
        raise SystemExit("input-pin-drift")
    query_path, seal_path = OUTPUT / "QUERIES-B-R3.jsonl", OUTPUT / "QUERY-SEAL-B-R3.json"
    if query_path.exists() or seal_path.exists():
        raise SystemExit("query-output-exists")
    cases = json.loads(PINS["candidate"][0].read_bytes())["development"]
    preflight = json.loads(PINS["preflight"][0].read_bytes())["results"]
    projection = json.loads(PINS["projection"][0].read_bytes())["records"]
    metadata = {row["image_tag"]: row for row in
                (json.loads(line) for line in PINS["metadata"][0].read_text().splitlines())}
    if len(cases) != len(preflight) or len(cases) != len(projection) or len(cases) != 24:
        raise SystemExit("denominator-drift")
    rows, redactions, missing_tests = [], 0, 0
    for ordinal, (case, pf, root) in enumerate(zip(cases, preflight, projection), 1):
        tag, job = case["image_tag"], case["failure_job_id"]
        source = metadata[tag]
        if (case["ordinal"] != ordinal or root["ordinal"] != ordinal or
                root["image_tag"] != tag or root["commit"] != case["failure_commit"] or
                source["failure"]["job_id"] != job or
                source["failure"]["trigger_sha"] != case["failure_commit"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        if ordinal == 12:
            path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-REPLACEMENT-LOG-12-{job}.txt"
            expected = case["log_sha256"]
        else:
            if (pf["ordinal"] != ordinal or pf["image_tag"] != tag or
                    not pf["log_job_id_matched"]):
                raise SystemExit(f"preflight-drift:{ordinal}")
            path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
            expected = pf["log_sha256"]
        log = path.read_bytes()
        if sha(log) != expected:
            raise SystemExit(f"log-hash-drift:{ordinal}")
        tests = source["failure"]["failed_tests"]
        if not isinstance(tests, str):
            raise SystemExit(f"test-field-drift:{ordinal}")
        test_part = limited(tests.replace("#", "\n"), 256).strip()
        missing_tests += not bool(test_part)
        heading = f"failed tests:\n{test_part}\n" if test_part else ""
        tail = limited(ANSI.sub("", log.decode("utf-8", errors="replace")),
                       1024 - len(heading.encode()) - 16, suffix=True).strip()
        query, count = SENSITIVE.subn("[REDACTED]", f"{heading}log tail:\n{tail}".strip())
        if not query or len(query.encode()) > 1024:
            raise SystemExit(f"query-bound:{ordinal}")
        redactions += count
        rows.append({"id": tag, "repo": case["repo"], "language": case["language"],
                     "base_commit": case["failure_commit"], "query": query,
                     "query_sha256": sha(query.encode()), "query_bytes": len(query.encode()),
                     "redactions": count})
    data = ("".join(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n"
                    for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-query-projection-r3/v1",
            "input_sha256": {name: pin for name, (_, pin) in PINS.items()},
            "script_sha256": sha(Path(__file__).read_bytes()),
            "query_rule": "First 256 UTF-8 bytes of failure-side failed-test names, if present, plus ANSI-stripped original log tail in <=1 KiB; redact sensitive-looking tokens",
            "cases": len(rows), "max_query_bytes": max(row["query_bytes"] for row in rows),
            "missing_test_names": missing_tests, "redactions": redactions,
            "queries_sha256": sha(data), "gold_opened": False,
            "reserved_confirmation_opened": False, "model_calls": 0}
    write_new(query_path, data)
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(seal_path, encoded)
    print(json.dumps({"cases": len(rows), "max_query_bytes": seal["max_query_bytes"],
                      "queries_sha256": sha(data), "seal_sha256": sha(encoded)}))


if __name__ == "__main__":
    main()
