#!/usr/bin/env python3
"""Evaluator-only audit of sealed r6 source-only rankings."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-hybrid-r6"
INPUTS = {
    "evaluation": (ARCHIVE / "evaluator-only-r1/EVALUATION-R1.json",
                   "d38225bb370301787492529745a35dcb38444399bcbf923e5da6bba3c30732b3"),
    "packets": (ARCHIVE / "exposed-cue-packets-r1/PACKETS.jsonl",
                "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"),
    "stems": (ARCHIVE / "exposed-java-class-stems-r3/SOURCE-CUES.jsonl",
              "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"),
    "degree": (ARCHIVE / "exposed-java-import-neighborhood-r4/RANKED-DEGREE.jsonl",
               "112629fa2351330d9a79dc81826c082740e9a2f94f05a12026928d8d789f6c89"),
    "r6": (ROOT / "RANKED.jsonl",
           "a6d456a8d998df85164412a1b344ddf79f0716853cb93d22b46a8f54ee66c764"),
    "seal": (ROOT / "RANK-SEAL.json",
             "a9c1be13e45394b7c77453b56e013bbcfdef820bef4ec040f9539e96502c67a9"),
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    output = ROOT / "EVALUATOR-AUDIT.json"
    if output.exists():
        raise SystemExit("output-exists")
    data = {}
    for name, (path, expected) in INPUTS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        data[name] = json.loads(blob) if name in {"evaluation", "seal"} else [
            json.loads(line) for line in blob.splitlines()]
    if (data["seal"]["gold_opened"] or data["seal"]["model_calls"] != 0
            or data["seal"]["ranked_rows_sha256"] != INPUTS["r6"][1]
            or any(len(data[name]) != 24 for name in ("packets", "stems", "degree", "r6"))
            or len(data["evaluation"]["cases"]) != 24):
        raise SystemExit("seal-or-denominator-drift")
    cases = []
    for index in range(24):
        evaluation = data["evaluation"]["cases"][index]
        packet = data["packets"][index]
        stem = data["stems"][index]
        degree = data["degree"][index]
        ranked = data["r6"][index]
        ordinal = index + 1
        if (not all(row["ordinal"] == ordinal and row["id"] == evaluation["id"]
                    for row in (evaluation, packet, stem, degree, ranked))
                or ranked["gold_opened"] or len(ranked["ordered_paths"]) > 30
                or len(set(ranked["ordered_paths"])) != len(ranked["ordered_paths"])):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        gold = set(evaluation["gold_paths"])
        r2 = {entry["path"] for entry in packet["candidates"]}
        union = r2 | set(stem["cue_paths"]) | set(degree["ordered_paths"][:10])
        r6 = set(ranked["ordered_paths"])
        if not r6.issubset(union) or ranked["universe_count"] != len(union):
            raise SystemExit(f"candidate-universe-drift:{ordinal}")
        cases.append({"ordinal": ordinal, "language": evaluation["language"],
                      "r2_reach": bool(gold & r2), "union_reach": bool(gold & union),
                      "r6_reach": bool(gold & r6),
                      "first_r6_gold_rank": next((n for n, path in enumerate(
                          ranked["ordered_paths"], 1) if path in gold), None),
                      "lost_r2_gold": bool(gold & r2) and not bool(gold & r6),
                      "new_vs_r2": not bool(gold & r2) and bool(gold & r6)})
    result = {"schema_version": "are.g01-bugswarm-hybrid-exposed-audit-r6/v1",
              "posture": "evaluator-only exposed diagnosis; not model score or claim",
              "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
              "cases": cases,
              "r2_reach": sum(case["r2_reach"] for case in cases),
              "union_reach": sum(case["union_reach"] for case in cases),
              "r6_reach": sum(case["r6_reach"] for case in cases),
              "new_vs_r2": sum(case["new_vs_r2"] for case in cases),
              "lost_r2_gold": sum(case["lost_r2_gold"] for case in cases)}
    blob = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(blob)
    print(json.dumps({key: result[key] for key in (
        "r2_reach", "union_reach", "r6_reach", "new_vs_r2", "lost_r2_gold")} |
        {"receipt_sha256": sha(blob)}))


if __name__ == "__main__":
    main()
