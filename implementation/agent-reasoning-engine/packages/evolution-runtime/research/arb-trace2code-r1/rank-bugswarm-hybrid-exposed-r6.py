#!/usr/bin/env python3
"""Label-blind rank fusion over sealed exposed BugSwarm candidate sources."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-hybrid-r6"
INPUTS = {
    "packets": (ARCHIVE / "exposed-cue-packets-r1/PACKETS.jsonl",
                "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"),
    "log": (ARCHIVE / "exposed-full-log-cues-r1/SOURCE-CUES.jsonl",
            "6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734"),
    "stems": (ARCHIVE / "exposed-java-class-stems-r3/SOURCE-CUES.jsonl",
              "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"),
    "degree": (ARCHIVE / "exposed-java-import-neighborhood-r4/RANKED-DEGREE.jsonl",
               "112629fa2351330d9a79dc81826c082740e9a2f94f05a12026928d8d789f6c89"),
}
K = 60
CAP = 30


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if OUTPUT.exists():
        raise SystemExit("output-exists")
    rows = {}
    for name, (path, expected) in INPUTS.items():
        data = path.read_bytes()
        if sha(data) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        rows[name] = [json.loads(line) for line in data.splitlines()]
        if len(rows[name]) != 24:
            raise SystemExit(f"denominator-drift:{name}")
    ranked = []
    for index in range(24):
        packet, log, stem, degree = (rows[name][index] for name in INPUTS)
        ordinal = index + 1
        if (not all(row["ordinal"] == ordinal and row["id"] == packet["id"]
                    for row in (packet, log, stem, degree))
                or packet["gold_opened"] or log["gold_opened"]
                or stem["gold_opened"] or degree["gold_opened"]):
            raise SystemExit(f"identity-or-gold-drift:{ordinal}")
        existing = [entry["path"] for entry in packet["candidates"]]
        if len(existing) != len(set(existing)):
            raise SystemExit(f"duplicate-existing:{ordinal}")
        if packet["language"] != "Java":
            if stem["cue_paths"] or degree["ordered_paths"]:
                raise SystemExit(f"non-java-neighbors:{ordinal}")
            selected = existing
            universe = set(existing)
        else:
            lists = [existing, log["cue_paths"], stem["cue_paths"],
                     degree["ordered_paths"][:10]]
            universe = set().union(*map(set, lists))
            if not set(log["cue_paths"]).issubset(set(existing)):
                raise SystemExit(f"log-cue-packet-drift:{ordinal}")
            if any(len(items) != len(set(items)) for items in lists):
                raise SystemExit(f"duplicate-ranking:{ordinal}")
            scores = {path: sum(1 / (K + ranking.index(path) + 1)
                                for ranking in lists if path in ranking)
                      for path in universe}
            selected = sorted(universe, key=lambda path: (-scores[path], path))[:CAP]
        ranked.append({"ordinal": ordinal, "id": packet["id"],
                       "language": packet["language"], "ordered_paths": selected,
                       "universe_count": len(universe),
                       "dropped_r2_paths": sorted(set(existing) - set(selected)),
                       "gold_opened": False})
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in ranked)).encode()
    seal = {"schema_version": "are.g01-bugswarm-hybrid-rank-exposed-r6/v1",
            "posture": "source-only exposed development; not a model packet or claim",
            "rule": "Python unchanged; Java equal-weight RRF(k=60) of r2 packet order, full-log cues, class-stem cues, and r5 top-ten import neighbors; cap 30",
            "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
            "cases": 24, "maximum_candidates": CAP,
            "ranked_rows_sha256": sha(data), "gold_opened": False, "model_calls": 0}
    OUTPUT.mkdir(mode=0o700)
    exclusive(OUTPUT / "RANKED.jsonl", data)
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    exclusive(OUTPUT / "RANK-SEAL.json", seal_data)
    print(json.dumps({"cases": 24, "maximum_universe": max(row["universe_count"] for row in ranked),
                      "dropped_r2_cases": sum(bool(row["dropped_r2_paths"]) for row in ranked),
                      "ranked_rows_sha256": sha(data), "rank_seal_sha256": sha(seal_data)}))


if __name__ == "__main__":
    main()
