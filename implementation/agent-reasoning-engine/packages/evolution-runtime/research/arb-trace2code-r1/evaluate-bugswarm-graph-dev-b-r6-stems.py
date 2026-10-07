#!/usr/bin/env python3
"""Evaluator-only reach screen for sealed cohort-B full-log stem candidates."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
CANDIDATES = BASE / "code-only/full-log-stems-r6/STEM-CANDIDATES-B-R6.jsonl"
SEAL = BASE / "code-only/full-log-stems-r6/STEM-SEAL-B-R6.json"
GOLD = BASE / "evaluator-only/DEV-GOLD-AUDIT-B-R3.json"
OUTPUT = BASE / "evaluator-only/STEM-REACH-B-R6.json"
PINS = {"candidates": "ee28398434ed026aedc8275fe96983d71510a337f42087ce1799b038a9b57bf4",
        "seal": "a45c86edaa249bc98acfde3970a24e8b7c00da61df8a490358c024f811a6aa82",
        "gold": "ac3ef81c36088dc305508c940df9a86d583c8601ba41874c1369197a14ec376e"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    inputs = {"candidates": CANDIDATES, "seal": SEAL, "gold": GOLD}
    if OUTPUT.exists() or any(sha(path.read_bytes()) != PINS[name]
                              for name, path in inputs.items()):
        raise SystemExit("output-exists-or-input-pin-drift")
    candidates = [json.loads(line) for line in CANDIDATES.read_text().splitlines()]
    seal = json.loads(SEAL.read_bytes())
    labels = json.loads(GOLD.read_bytes())["results"]
    if (len(candidates) != len(labels) or len(labels) != seal["cases"] or
            len(labels) != 24 or seal["candidate_sha256"] != PINS["candidates"]):
        raise SystemExit("denominator-or-seal-drift")
    rows = []
    for ordinal, (candidate, label) in enumerate(zip(candidates, labels), 1):
        if (candidate["ordinal"] != ordinal or label["ordinal"] != ordinal or
                candidate["id"] != label["image_tag"] or
                candidate["repo"] != label["repo"] or
                not label["gold_admissible"] or candidate["gold_opened"] is not False):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        gold = {item["path"] for item in label["source_gold_paths"]}
        before = bool(gold.intersection(candidate["union_paths"]))
        after = bool(gold.intersection(candidate["candidate_paths"]))
        if (not gold or not set(candidate["union_paths"]).issubset(candidate["candidate_paths"]) or
                len(candidate["candidate_paths"]) > 80):
            raise SystemExit(f"candidate-coverage-drift:{ordinal}")
        rows.append({"ordinal": ordinal, "repo": candidate["repo"],
                     "prior_reach": before, "new_reach": after,
                     "added_count": len(candidate["added"]),
                     "candidate_count": candidate["candidate_count"]})
    before = sum(row["prior_reach"] for row in rows)
    after = sum(row["new_reach"] for row in rows)
    gained = [row["ordinal"] for row in rows if not row["prior_reach"] and row["new_reach"]]
    lost = [row["ordinal"] for row in rows if row["prior_reach"] and not row["new_reach"]]
    gate = {"reach_at_least_20": after >= 20, "zero_losses": not lost,
            "maximum_candidates_at_most_80": seal["maximum_candidates"] <= 80,
            "complete_24": len(rows) == 24}
    gate["passed"] = all(gate.values())
    result = {"schema_version": "are.g01-bugswarm-graph-dev-b-stem-evaluation-r6/v1",
              "pins": PINS, "script_sha256": sha(Path(__file__).read_bytes()),
              "prior_reach": before, "new_reach": after, "newly_reached": gained,
              "lost": lost, "maximum_candidates": seal["maximum_candidates"],
              "gate": gate, "cases": rows,
              "claim_ceiling": "Private exposed-development reach screen only; no model calls, independent confirmation, ContextBench, live ARE, or superiority."}
    encoded = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"prior_reach": before, "new_reach": after,
                      "newly_reached": gained, "lost": lost, "gate": gate,
                      "evaluation_sha256": sha(encoded)}), flush=True)


if __name__ == "__main__":
    main()
