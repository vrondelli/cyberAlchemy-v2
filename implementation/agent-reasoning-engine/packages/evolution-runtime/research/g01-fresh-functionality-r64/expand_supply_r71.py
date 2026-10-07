#!/usr/bin/env python3
"""Reopen only score-blind pre-r32 BugSwarm Python source-order supply."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path

PINS = {
    "r28": ("selective-r28/METADATA-CENSUS.json", "f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a"),
    "queue": ("selective-r28/repair-r32/QUEUE.json", "42fa759dc368d5b0c88a3029474ca36ebce75c0e7a57352a7eaa1131485d225e"),
    "r34": ("selective-r28/final-r34/RESULT.json", "fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c"),
    "r64": ("fresh-functionality-r64/source-preflight/SOURCE-RESULT.json", "877b040f027375c61af9e23666d3429a4af810e08fac29b359d63e7cd35be30e"),
}
INPUTS = {
    "raw": "1.3.1-bugswarm.json",
    "order": "source-only-r1/ORDERED-CANDIDATES.json",
    "prior": "METADATA-CANDIDATE-24-R1.json",
    "dev_a_r1": "graph-dev-r1/METADATA-COHORTS-R1.json",
    "dev_a_r2": "graph-dev-r2/DEV-METADATA-R2.json",
    "dev_b_r1": "graph-dev-b-r1/METADATA-COHORT-B-R1.json",
    "dev_b_r2": "graph-dev-b-r1/METADATA-COHORT-B-R2.json",
    "confirm": "graph-confirm-r4/code-only/RESULT.json",
    "fresh_r11": "fresh-r11/METADATA-COHORT.json",
}
OLD_ATTEMPTS = "graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair"
R14_ATTEMPTS = "fresh-r11/repair-r14/run"
RULE = Path(__file__).resolve().parents[1] / "arb-trace2code-r1/select-bugswarm-graph-dev-r1.py"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def save(path: Path, data: object) -> None:
    encoded = (json.dumps(data, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output-exists")
    data = {}
    for name, (relative, expected) in PINS.items():
        body = (args.archive / relative).read_bytes()
        if sha(body) != expected:
            raise SystemExit("pin-drift:" + name)
        data[name] = json.loads(body)
    source_hashes = data["r28"]["input_sha256"]
    for name, relative in INPUTS.items():
        body = (args.archive / relative).read_bytes()
        if sha(body) != source_hashes[name]:
            raise SystemExit("historical-input-drift:" + name)
        data[name] = json.loads(body)
    if sha(RULE.read_bytes()) != source_hashes["eligibility_rule"]:
        raise SystemExit("eligibility-rule-drift")
    spec = importlib.util.spec_from_file_location("r71_eligibility", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("eligibility-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    old = [json.loads(path.read_bytes()) for path in sorted((args.archive / OLD_ATTEMPTS).glob("ATTEMPT-*.json"))]
    r14 = [json.loads(path.read_bytes()) for path in sorted((args.archive / R14_ATTEMPTS).glob("*-ATTEMPT.json"))]
    if len(old) != 35 or len(r14) != 22:
        raise SystemExit("attempt-denominator-drift")
    occupied = set()

    def add(rows: list[dict]) -> None:
        occupied.update(row["repo"].lower() for row in rows)

    add(data["prior"]["selected"])
    for partition in ("development", "reserved_confirmation"):
        for language in ("Python", "Java"):
            add(data["dev_a_r1"]["cohorts"][partition][language])
    add(data["dev_a_r2"]["development"])
    add(data["dev_a_r2"]["attempts"])
    add(data["dev_b_r1"]["selected"])
    add(data["dev_b_r2"]["development"])
    add(data["dev_b_r2"]["attempts"])
    add(data["confirm"]["records"])
    add(old)
    add(data["fresh_r11"]["selected"])
    add(r14)
    if len(occupied) != 180:
        raise SystemExit(f"historical-exclusion-drift:{len(occupied)}")
    add(data["r28"]["selected"])
    if len(occupied) != 204:
        raise SystemExit(f"r28-exclusion-drift:{len(occupied)}")
    add(data["queue"]["queues"]["Python"])
    add(data["queue"]["queues"]["Java"])
    add(data["r34"]["rows"])
    add(data["r64"]["results"])
    raw = {row["image_tag"]: row for row in data["raw"]}
    candidates = []
    seen = set(occupied)
    for position, candidate in enumerate(data["order"]["ordered"]["Python"], 1):
        row = raw[candidate["image_tag"]]
        if (row["repo"] != candidate["repo"] or row["failed_job"]["job_id"] != candidate["failure_job_id"]
                or row["failed_job"]["trigger_sha"] != candidate["failure_commit"]):
            raise SystemExit("source-order-identity-drift")
        repo = row["repo"].lower()
        if repo in seen or not module.eligible(row):
            continue
        seen.add(repo)
        candidates.append({"source_order_position": position, **candidate})
    args.output.mkdir(mode=0o700, parents=True)
    save(args.output / "R71-SUPPLY.json", {
        "schema_version": "are.g01-r71-supply/v1", "status": "source-only-metadata-census",
        "input_sha256": {name: expected for name, (_, expected) in PINS.items()},
        "script_sha256": sha(Path(__file__).read_bytes()),
        "historical_exclusions": 204, "occupied_after_r32_r34_r64": len(occupied),
        "candidate_count": len(candidates), "candidates": candidates,
        "gold_opened": False, "logs_opened": False,
        "network_calls": 0, "model_calls": 0,
        "claim_ceiling": "Metadata supply only; no authenticated source, log, old-side label, score, or superiority",
    })
    print(json.dumps({"candidates": len(candidates),
                      "pre_r32_floor": sum(row["source_order_position"] <= 467 for row in candidates),
                      "first_five": [{"repo": row["repo"], "position": row["source_order_position"]}
                                     for row in candidates[:5]]}))


if __name__ == "__main__":
    main()
