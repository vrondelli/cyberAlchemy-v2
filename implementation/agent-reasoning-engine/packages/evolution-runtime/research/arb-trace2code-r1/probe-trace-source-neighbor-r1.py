#!/usr/bin/env python3
"""Gold-blind test-to-source neighbor probe on exposed ARB trace2code cases."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re


RANKINGS_SHA256 = "90562963631facf609b1ee1599f190c307e95a8e99f45e7ac2e00581bad95b6a"
GIN_QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"
NONGIN_QUERIES_SHA256 = "fd40d61077846f49374ee61a87e561699d85de9016ac590790be5228fa67b08c"
TEST_NAME = re.compile(r"(?:_test\.go|(?:^|/)test_[^/]+\.py|_test\.py|\.(?:test|spec)\.[jt]sx?)$", re.I)


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def source_name(test_name: str) -> str:
    if test_name.endswith("_test.go"):
        return test_name[:-8] + ".go"
    if test_name.startswith("test_") and test_name.endswith(".py"):
        return test_name[5:]
    if test_name.endswith("_test.py"):
        return test_name[:-8] + ".py"
    return re.sub(r"\.(?:test|spec)\.([jt]sx?)$", r".\1", test_name)


def shared_prefix_parts(left: str, right: str) -> int:
    a, b = left.split("/")[:-1], right.split("/")[:-1]
    return next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))


def promote(ranking: list[str], trace: str) -> tuple[list[str], list[str]]:
    if len(set(ranking)) != len(ranking):
        raise SystemExit("duplicate ranking path")
    trace = trace.lower()
    by_basename: dict[str, list[str]] = {}
    for path in ranking:
        by_basename.setdefault(path.rsplit("/", 1)[-1].lower(), []).append(path)
    promoted = set()
    for test in ranking:
        if not TEST_NAME.search(test):
            continue
        basename = test.rsplit("/", 1)[-1].lower()
        if test.lower() not in trace and not (len(by_basename[basename]) == 1 and basename in trace):
            continue
        candidates = by_basename.get(source_name(basename), [])
        if not candidates:
            continue
        best_prefix = max(shared_prefix_parts(test, source) for source in candidates)
        promoted.update(source for source in candidates if shared_prefix_parts(test, source) == best_prefix)
    selected = [path for path in ranking if path in promoted][:3]
    return selected + [path for path in ranking if path not in selected], selected


def load_jsonl(path: pathlib.Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines()]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("rankings", "gin-queries", "nongin-queries", "output"):
        parser.add_argument(f"--{name}", type=pathlib.Path, required=True)
    args = parser.parse_args()
    paths = (args.rankings.resolve(strict=True), args.gin_queries.resolve(strict=True),
             args.nongin_queries.resolve(strict=True))
    if args.output.exists() or tuple(map(sha256_file, paths)) != (
            RANKINGS_SHA256, GIN_QUERIES_SHA256, NONGIN_QUERIES_SHA256):
        raise SystemExit("output exists or input pin drift")
    rows = load_jsonl(paths[0])
    queries = load_jsonl(paths[1]) + load_jsonl(paths[2])
    query_by_id = {row["id"]: row for row in queries}
    if len(rows) != 101 or len(queries) != 101 or len(query_by_id) != 101 or \
            {row["id"] for row in rows} != set(query_by_id):
        raise SystemExit("exposed cohort drift")
    output = []
    changed = 0
    for row in rows:
        query = query_by_id[row["id"]]
        if row["repo"] != query["repo"] or row["base_commit"] != query["base_commit"] or \
                set(query["query"]) != {"command", "failure_excerpt", "run_strategy", "source_type"}:
            raise SystemExit("query identity/shape drift")
        base = row["are_edge_trace_text"]
        neighbor, selected = promote(base, query["query"]["failure_excerpt"])
        if set(neighbor) != set(base) or len(neighbor) != len(base):
            raise SystemExit("candidate universe drift")
        changed += neighbor != base
        output.append({"id": row["id"], "repo": row["repo"], "base_commit": row["base_commit"],
                       "candidate_count": row["candidate_count"], "arb_edge_bm25": row["arb_edge_bm25"],
                       "are_edge_trace_text": base, "trace_source_neighbor": neighbor,
                       "promoted_sources": selected})
    args.output.mkdir(parents=True, exist_ok=False)
    prediction = args.output / "DEVELOPMENT-RANKINGS.jsonl"
    prediction.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    seal = {"schema": "are.arb-exposed-trace-source-neighbor-source-r1/v1",
            "posture": "post-confirmation exposed development only; no independent claim",
            "mechanism": "promote up to three nearest-name source counterparts of trace-mentioned test files, preserving ARE order",
            "input_sha256": dict(zip(("rankings", "gin_queries", "nongin_queries"), map(sha256_file, paths))),
            "prediction_sha256": sha256_file(prediction), "cases": 101, "changed_rankings": changed,
            "gold_opened": False, "model_calls": 0}
    (args.output / "SOURCE-SEAL.json").write_text(json.dumps(seal, indent=2, sort_keys=True) + "\n")
    print(json.dumps(seal, sort_keys=True))


if __name__ == "__main__":
    main()
