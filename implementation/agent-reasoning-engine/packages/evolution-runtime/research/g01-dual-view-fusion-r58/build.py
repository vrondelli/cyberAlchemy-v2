#!/usr/bin/env python3
"""Seal the G01 r58 dual-view source ranking without reading gold labels."""

import argparse
import hashlib
import json
import os
from pathlib import Path

R56_SHA = "679a46dc1485c5d729c15644ceb795210782371e2d969adc786a07d61942eb28"
R57_SHA = "151079b1c62baec6e723d7bb9bbd125651f4bd5f2daa51cca0f6b923a4eeb70c"
ARE_SHA = {"r1": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
           "r2b": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d"}
CHUNK_SHA = {"r1": "1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
             "r2b": "bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def rrf(*rankings):
    scores = {}
    for ranking in rankings:
        for position, path in enumerate(ranking, 1):
            scores[path] = scores.get(path, 0) + 1 / (60 + position)
    return sorted(scores, key=lambda path: (-scores[path], path))


def complete(scores, candidates, base):
    if set(scores) != set(candidates) or len(scores) != len(candidates):
        raise SystemExit("semantic score/candidate mismatch")
    semantic = sorted(candidates, key=lambda path: (-scores[path], path))
    remainder = [path for path in base if path not in scores]
    return semantic + remainder


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    r56 = args.archive / "bounded-swerank-r56/source-run-r2/RANKINGS.jsonl"
    r57 = args.archive / "functionality-query-r57/source-run/RANKINGS.jsonl"
    if sha(r56) != R56_SHA or sha(r57) != R57_SHA:
        raise SystemExit("source ranking drift")
    old = {(row["cohort"], row["id"]): row for row in rows(r56)}
    newer = {(row["cohort"], row["id"]): row for row in rows(r57)}
    if len(old) != 48 or set(old) != set(newer):
        raise SystemExit("source denominator drift")
    originals = {}
    for cohort in ("r1", "r2b"):
        are_file = args.archive / f"are-rankings-{cohort}/ARE-RANKINGS.jsonl"
        chunk_file = args.archive / f"chunk-bm25-rankings-{cohort}/CHUNK-BM25-RANKINGS.jsonl"
        if sha(are_file) != ARE_SHA[cohort] or sha(chunk_file) != CHUNK_SHA[cohort]:
            raise SystemExit("base ranking drift")
        are = {row["id"]: row["ranked_files"] for row in rows(are_file)}
        chunk = {row["id"]: row["ranked_files"] for row in rows(chunk_file)}
        for case_id in are.keys() & chunk.keys():
            originals[(cohort, case_id)] = (are[case_id], chunk[case_id])
    if not set(old).issubset(originals):
        raise SystemExit("missing original ranking")
    if args.output.exists():
        raise SystemExit("output exists")
    args.output.mkdir(parents=True)
    save_exclusive(args.output / "RUN-FREEZE.json", {
        "schema_version": "are.g01-r58-freeze/v1", "cases": 48,
        "r56_rankings_sha256": R56_SHA, "r57_rankings_sha256": R57_SHA,
        "are_sha256": ARE_SHA, "chunk_sha256": CHUNK_SHA,
        "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")),
        "script_sha256": sha(Path(__file__)), "gold_opened": False,
    })
    output = []
    for key in sorted(old):
        prior, current = old[key], newer[key]
        are, chunk = originals[key]
        base = rrf(are, chunk)
        if base != prior["base"] or base != current["base"] or prior["query_sha256"] != current["query_sha256"]:
            raise SystemExit("base/query mismatch")
        candidates = prior["candidates"]
        raw = complete(prior["swerank_scores"], candidates, base)
        functionality = complete(current["semantic_scores"], candidates, base)
        if rrf(are, chunk, raw) != prior["swerank"] or rrf(are, chunk, raw) != current["raw_swerank"]:
            raise SystemExit("raw arm reconstruction mismatch")
        if rrf(are, chunk, functionality) != current["functionality_swerank"]:
            raise SystemExit("functionality arm reconstruction mismatch")
        treatment = rrf(are, chunk, raw, functionality)
        if len(treatment) != len(base) or set(treatment) != set(base):
            raise SystemExit("treatment universe mismatch")
        output.append({"schema_version": "are.g01-r58-ranking/v1", "cohort": key[0], "id": key[1],
                       "repo": current["repo"], "query_sha256": current["query_sha256"],
                       "summary_valid": current["summary_valid"], "base": base,
                       "raw_swerank": current["raw_swerank"],
                       "functionality_swerank": current["functionality_swerank"],
                       "dual_view": treatment})
    out = args.output / "RANKINGS.jsonl"
    out.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    save_exclusive(args.output / "SOURCE-SEAL.json", {
        "schema_version": "are.g01-r58-source-seal/v1", "status": "complete", "cases": len(output),
        "valid_summaries": sum(row["summary_valid"] for row in output),
        "rankings_sha256": sha(out), "run_freeze_sha256": sha(args.output / "RUN-FREEZE.json"),
        "gold_opened": False,
    })
    print((args.output / "SOURCE-SEAL.json").read_text())


if __name__ == "__main__":
    main()
