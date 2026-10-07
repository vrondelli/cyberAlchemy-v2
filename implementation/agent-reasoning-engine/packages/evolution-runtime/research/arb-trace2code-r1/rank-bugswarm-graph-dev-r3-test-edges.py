#!/usr/bin/env python3
"""Source-only test-to-code edge augmentation of sealed G01 graph r2 rankings."""

from __future__ import annotations

from collections import Counter, defaultdict
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import time


PINS = {
    "candidate": "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332",
    "projection": "201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51",
    "queries": "9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561",
    "r2_seal": "7b5f5e7e88b04d0244fa9650c1f24e87ac01e1780214343cae002f7e7ade067c",
    "preflight": "03ec15d02446aef5d47d1a190b640a16876732d2498f1ebcb59578ef22aecd34",
}
R2_SCRIPT_SHA = "e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0"
MAX_TEST_SEEDS = 8
MAX_EDGE_TARGETS = 20
MAX_LOG_BYTES = 65536
FILENAME = re.compile(r"(?<![A-Za-z0-9_])[/A-Za-z0-9_$.-]+\.(?:py|java)\b", re.I)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_r2(path: Path):
    if sha(path.read_bytes()) != R2_SCRIPT_SHA:
        raise SystemExit("r2-script-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2", path)
    if spec is None or spec.loader is None:
        raise SystemExit("r2-script-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_seeds(paths: list[str], log: str, query: str, is_test) -> list[str]:
    by_basename: dict[str, list[str]] = defaultdict(list)
    for path in paths:
        if is_test(path):
            by_basename[PurePosixPath(path).name.lower()].append(path)
    counts: Counter[str] = Counter()
    tail = log[-MAX_LOG_BYTES:]
    for match in FILENAME.finditer(tail):
        token = match.group().replace("\\", "/").lower()
        options = by_basename.get(PurePosixPath(token).name, [])
        suffix = [path for path in options if token.endswith(path.lower())
                  or path.lower().endswith(token)]
        resolved = suffix if len(suffix) == 1 else options if len(options) == 1 else []
        counts.update(resolved)
    query_lower = query.lower()
    for path in paths:
        if not is_test(path):
            continue
        stem = PurePosixPath(path).stem.lower()
        if len(stem) >= 6 and stem in query_lower:
            counts[path] += 1
    rank = {path: index for index, path in enumerate(paths)}
    return sorted(counts, key=lambda path: (-counts[path], rank[path], path))[:MAX_TEST_SEEDS]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "r2_script", "r2_rankings", "r1_logs", "r2_logs", "output_dir"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    if (not args.output_dir.is_dir() or any(args.output_dir.iterdir())
            or any(sha(getattr(args, name).read_bytes()) != pin for name, pin in PINS.items())):
        raise SystemExit("input-pin-drift-or-output-not-empty")
    r2 = load_r2(args.r2_script)
    candidates = json.loads(args.candidate.read_bytes())["development"]
    records = json.loads(args.projection.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    prior = json.loads(args.preflight.read_bytes())["results"]
    seal = json.loads(args.r2_seal.read_bytes())
    r2_data = args.r2_rankings.read_bytes()
    if sha(r2_data) != seal["rankings_sha256"]:
        raise SystemExit("r2-ranking-pin-drift")
    r2_rows = [json.loads(line) for line in r2_data.splitlines()]
    if not all(len(items) == 24 for items in (candidates, records, queries,
                                               prior, r2_rows)):
        raise SystemExit("denominator-drift")
    output = []
    for ordinal, (case, record, query, pf, old) in enumerate(zip(
            candidates, records, queries, prior, r2_rows), 1):
        if (record["ordinal"] != ordinal or old["ordinal"] != ordinal
                or old["id"] != case["image_tag"] or query["id"] != case["image_tag"]
                or old["base_commit"] != case["failure_commit"]):
            raise SystemExit("case-identity-drift:" + str(ordinal))
        if ordinal in (11, 21):
            log_path = args.r2_logs / f"HTTP-PROVISIONAL-REPLACEMENT-LOG-{ordinal:02d}-{case['failure_job_id']}.txt"
            log_sha = case["log_sha256"]
        else:
            if pf["position"] != ordinal or pf["image_tag"] != case["image_tag"]:
                raise SystemExit("prior-log-identity-drift")
            log_path = args.r1_logs / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{case['failure_job_id']}.txt"
            log_sha = pf["log_sha256"]
        log_data = log_path.read_bytes()
        if sha(log_data) != log_sha:
            raise SystemExit("log-pin-drift:" + str(ordinal))
        started = time.monotonic()
        root = Path(record["root"]).resolve(strict=True)
        paths = old["ranked_files"]
        direct, reverse, symbols, tree_sha = r2.graph_for_case(root, paths, case["language"])
        if tree_sha != record["projected_tree_sha256"]:
            raise SystemExit("source-tree-drift:" + str(ordinal))
        seeds = test_seeds(paths, log_data.decode("utf-8", errors="replace"),
                           query["query"], r2.is_test)
        score: dict[str, float] = defaultdict(float)
        for seed in seeds:
            for path in direct[seed]:
                if not r2.is_test(path):
                    score[path] += 0.8
                    for next_path in direct[path]:
                        if not r2.is_test(next_path):
                            score[next_path] += 0.2
            stem = PurePosixPath(seed).stem
            names = [stem.removeprefix("Test"), stem.removesuffix("Test"),
                     stem.removesuffix("Tests")]
            for name in names:
                if name != stem and len(name) >= 3:
                    matches = symbols.get(name.lower(), [])
                    if 1 <= len(matches) <= 5:
                        for path in matches:
                            if not r2.is_test(path):
                                score[path] += 0.6 / len(matches)
        rank = {path: index for index, path in enumerate(paths)}
        edge_targets = sorted(score, key=lambda path: (-score[path], rank[path], path))[:MAX_EDGE_TARGETS]
        target_set = set(edge_targets)
        new = sorted(paths, key=lambda path: (
            -(1.0 / (rank[path] + 1) + min(score[path], 1.4)
              if path in target_set else 1.0 / (rank[path] + 1)),
            rank[path], path))
        if len(new) != len(paths) or set(new) != set(paths):
            raise SystemExit("candidate-coverage-drift")
        elapsed = round((time.monotonic() - started) * 1000)
        output.append({"schema_version": "are.g01-bugswarm-graph-dev-test-edges-r3/v1",
                       "ordinal": ordinal, "id": old["id"], "repo": old["repo"],
                       "language": old["language"], "base_commit": old["base_commit"],
                       "r2_ranking_sha256": seal["rankings_sha256"],
                       "source_tree_sha256": tree_sha,
                       "test_seed_count": len(seeds), "edge_target_count": len(edge_targets),
                       "ranker_elapsed_ms": elapsed, "ranked_files": new,
                       "candidate_count": len(new), "gold_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "test_seeds": len(seeds),
                          "edge_targets": len(edge_targets), "ranker_elapsed_ms": elapsed}),
              flush=True)
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in output)).encode()
    target = args.output_dir / "TEST-EDGE-RANKINGS-R3.jsonl"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    result_seal = {"schema_version": "are.g01-bugswarm-graph-dev-test-edges-seal-r3/v1",
                   "input_sha256": PINS, "r2_script_sha256": R2_SCRIPT_SHA,
                   "script_sha256": sha(Path(__file__).read_bytes()),
                   "rule": "Test-file filename/query anchors are navigation seeds only; direct test imports, two-hop imports, and TestFoo/FooTest class-stem edges promote up to 20 non-test targets into the sealed r2 ranking; fixed scores 0.8 direct, 0.2 two-hop, 0.6 class-stem, cap 1.4; complete ranking",
                   "cases": len(output), "rankings_sha256": sha(data),
                   "incremental_elapsed_ms_sum": sum(row["ranker_elapsed_ms"] for row in output),
                   "gold_opened": False, "reserved_confirmation_opened": False,
                   "model_calls": 0}
    seal_data = (json.dumps(result_seal, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "TEST-EDGE-SEAL-R3.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(seal_data)
    print(json.dumps({"cases": len(output), "rankings_sha256": sha(data),
                      "seal_sha256": sha(seal_data),
                      "incremental_elapsed_ms_sum": result_seal["incremental_elapsed_ms_sum"]}),
          flush=True)


if __name__ == "__main__":
    main()
