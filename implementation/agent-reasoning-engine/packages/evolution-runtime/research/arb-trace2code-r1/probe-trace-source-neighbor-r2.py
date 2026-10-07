#!/usr/bin/env python3
"""Gold-blind test/source promotion using only the matched 1024-byte edge query."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib
import sys


R1_SCRIPT_SHA256 = "dd2fc32df6621afd054d5ede52a9894a08f7bf3b0ecbd09a60d95f27c58a6db5"
RANKINGS_SHA256 = "90562963631facf609b1ee1599f190c307e95a8e99f45e7ac2e00581bad95b6a"
GIN_QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
NONGIN_QUERIES_SHA256 = "fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c"


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def load_jsonl(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def edge_window(value: str) -> str:
    raw = value.encode("utf-8")
    if len(raw) <= 1024:
        return value.strip()
    head = raw[:509].decode("utf-8", errors="replace").replace("\ufffd", "")
    tail = raw[-509:].decode("utf-8", errors="replace").replace("\ufffd", "")
    return f"{head}\n...\n{tail}".strip()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("rankings", "gin-queries", "nongin-queries", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    r1_path = pathlib.Path(__file__).with_name("probe-trace-source-neighbor-r1.py").resolve(strict=True)
    if sha256_file(r1_path) != R1_SCRIPT_SHA256:
        raise SystemExit("r1 mechanism code drift")
    spec = importlib.util.spec_from_file_location("neighbor_r1", r1_path)
    if spec is None or spec.loader is None:
        raise SystemExit("r1 import failure")
    r1 = importlib.util.module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(r1)
    paths = tuple(path.resolve(strict=True) for path in
                  (args.rankings, args.gin_queries, args.nongin_queries))
    if args.output.exists() or tuple(map(sha256_file, paths)) != (
            RANKINGS_SHA256, GIN_QUERIES_SHA256, NONGIN_QUERIES_SHA256):
        raise SystemExit("output exists or input pin drift")
    bases = load_jsonl(paths[0])
    queries = load_jsonl(paths[1]) + load_jsonl(paths[2])
    query_by_id = {row["id"]: row for row in queries}
    if len(bases) != 101 or len(queries) != 101 or len(query_by_id) != 101 or \
            {row["id"] for row in bases} != set(query_by_id):
        raise SystemExit("exposed cohort drift")
    rows = []
    changed = 0
    for base in bases:
        query = query_by_id[base["id"]]
        if (base["repo"], base["base_commit"]) != (query["repo"], query["base_commit"]):
            raise SystemExit("case identity drift")
        wire = edge_window(query["query"]["failure_excerpt"])
        digest = hashlib.sha256(wire.encode()).hexdigest()
        if not wire or len(wire.encode()) > 1024 or digest != base["query_sha256"]:
            raise SystemExit("matched edge-query drift")
        ranking = base["are_edge_trace_text"]
        promoted, selected = r1.promote(ranking, wire)
        if len(promoted) != base["candidate_count"] or set(promoted) != set(ranking):
            raise SystemExit("candidate universe drift")
        changed += promoted != ranking
        rows.append({"id": base["id"], "repo": base["repo"], "base_commit": base["base_commit"],
                     "candidate_count": base["candidate_count"], "query_sha256": digest,
                     "arb_edge_bm25": base["arb_edge_bm25"], "are_edge_trace_text": ranking,
                     "matched_edge_source_neighbor": promoted, "promoted_sources": selected})
    args.output.mkdir(parents=True, exist_ok=False)
    prediction = args.output / "DEVELOPMENT-RANKINGS.jsonl"
    prediction.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))
    seal = {"schema": "are.arb-exposed-matched-edge-source-neighbor-r2/v1",
            "posture": "post-confirmation exposed development; exact 1024-byte edge input; no independent claim",
            "r1_mechanism_script_sha256": R1_SCRIPT_SHA256,
            "input_sha256": dict(zip(("rankings", "gin_queries", "nongin_queries"), map(sha256_file, paths))),
            "prediction_sha256": sha256_file(prediction), "cases": len(rows),
            "changed_rankings": changed, "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
