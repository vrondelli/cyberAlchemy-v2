#!/usr/bin/env python3
"""Seal fixed three-channel ranking over the selected r60 C candidate pool."""

import argparse
import hashlib
import json
import os
from pathlib import Path

PINS = {
    "r56": "679a46dc1485c5d729c15644ceb795210782371e2d969adc786a07d61942eb28",
    "r60": "f8c0dd8021e4b1d249bc22b5bf088d25ee6206d164e5880437f0e5db94cf9260",
    "r60_seal": "bf6ddd9029c21f29c116bf3475fe9f031ff7183f41cc592d698b86c27ca53c48",
    "are_r1": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
    "are_r2b": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d",
    "chunk_r1": "1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
    "chunk_r2b": "bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f",
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def rrf_scores(*rankings):
    scores = {}
    for ranking in rankings:
        for position, path in enumerate(ranking, 1):
            scores[path] = scores.get(path, 0.0) + 1 / (60 + position)
    return scores


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    if args.output.exists():
        raise SystemExit("output exists")
    files = {"r56": args.archive / "bounded-swerank-r56/source-run-r2/RANKINGS.jsonl",
             "r60": args.archive / "functionality-acquisition-r60/source-run/CANDIDATES.jsonl",
             "r60_seal": args.archive / "functionality-acquisition-r60/source-run/SOURCE-SEAL.json"}
    for cohort in ("r1", "r2b"):
        files[f"are_{cohort}"] = args.archive / f"are-rankings-{cohort}/ARE-RANKINGS.jsonl"
        files[f"chunk_{cohort}"] = args.archive / f"chunk-bm25-rankings-{cohort}/CHUNK-BM25-RANKINGS.jsonl"
    for name, path in files.items():
        if sha(path) != PINS[name]:
            raise SystemExit(f"input drift: {name}")
    prior_seal = json.loads(files["r60_seal"].read_text())
    if prior_seal["status"] != "complete" or prior_seal["candidate_sha256"] != PINS["r60"]:
        raise SystemExit("r60 source not sealed")
    old = {(row["cohort"], row["id"]): row for row in rows(files["r56"])}
    new = {(row["cohort"], row["id"]): row for row in rows(files["r60"])}
    if len(old) != 48 or set(old) != set(new):
        raise SystemExit("case denominator drift")
    lookup = {}
    for cohort in ("r1", "r2b"):
        are = {row["id"]: row["ranked_files"] for row in rows(files[f"are_{cohort}"])}
        chunk = {row["id"]: row["ranked_files"] for row in rows(files[f"chunk_{cohort}"])}
        for case_id in are.keys() & chunk.keys():
            lookup[(cohort, case_id)] = (are[case_id], chunk[case_id])
    if not set(old).issubset(lookup):
        raise SystemExit("missing base ranker")
    output = []
    for key in sorted(old):
        before, acquired = old[key], new[key]
        are, raw = lookup[key]
        base = before["base"]
        base_scores = rrf_scores(are, raw)
        if base != sorted(base_scores, key=lambda path: (-base_scores[path], path)):
            raise SystemExit("r56 baseline reconstruction mismatch")
        if acquired["a"] != before["candidates"] or before["query_sha256"] != acquired["query_sha256"]:
            raise SystemExit("candidate/query drift")
        top = acquired["functionality_top30"]
        if len(top) != len(set(top)) or not set(top).issubset(base):
            raise SystemExit("functionality partial ranking mismatch")
        top_set = set(top)
        completed = top + [path for path in base if path not in top_set]
        if len(completed) != len(base):
            raise SystemExit("ranking completion drift")
        scores = rrf_scores(are, raw, completed)
        candidates = acquired["c"]
        candidate_set = set(candidates)
        if not candidate_set.issubset(base) or len(candidates) != len(candidate_set):
            raise SystemExit("r60 C candidate mismatch")
        treatment = sorted(candidates, key=lambda path: (-scores[path], path)) + [path for path in base if path not in candidate_set]
        if len(treatment) != len(base) or set(treatment) != set(base):
            raise SystemExit("full ranking universe drift")
        output.append({"schema_version": "are.g01-r61-ranking/v1", "cohort": key[0],
                       "id": key[1], "repo": before["repo"], "query_sha256": before["query_sha256"],
                       "candidate_count": len(candidates), "base": base, "treatment": treatment})
    args.output.mkdir(parents=True)
    save_exclusive(args.output / "RUN-FREEZE.json", {"schema_version": "are.g01-r61-freeze/v1",
        "cases": 48, "input_sha256": PINS, "script_sha256": sha(Path(__file__)),
        "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")), "gold_opened": False})
    out = args.output / "RANKINGS.jsonl"
    out.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    save_exclusive(args.output / "SOURCE-SEAL.json", {"schema_version": "are.g01-r61-source-seal/v1",
        "status": "complete", "cases": len(output), "rankings_sha256": sha(out),
        "freeze_sha256": sha(args.output / "RUN-FREEZE.json"), "gold_opened": False})
    print((args.output / "SOURCE-SEAL.json").read_text())


if __name__ == "__main__":
    main()
