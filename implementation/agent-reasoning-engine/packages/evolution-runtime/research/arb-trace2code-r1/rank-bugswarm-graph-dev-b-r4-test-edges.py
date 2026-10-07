#!/usr/bin/env python3
"""Transfer the unchanged r3 test-to-code acquisition rule to cohort B."""

from __future__ import annotations

from collections import defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import time


HERE = Path(__file__).resolve().parent
R2_RULE = HERE / "rank-bugswarm-graph-dev-r2-graph.py"
R3_RULE = HERE / "rank-bugswarm-graph-dev-r3-test-edges.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
PINS = {
    "candidate": (BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json", "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"),
    "projection": (BASE / "graph-dev-b-r2/code-only/SOURCE-PROJECTION-RECEIPT.json", "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"),
    "queries": (BASE / "graph-dev-b-r2/code-only/QUERIES-B-R3.jsonl", "696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b"),
    "r2_seal": (BASE / "graph-dev-b-r2/code-only/graph-r2/GRAPH-RANKING-SEAL-B-R3.json", "bef3ad37a6c4f87d08e3254df47a7ae1c52e641b58a672859511a47737639813"),
    "preflight": (BASE / "graph-dev-b-r1/DEV-PREFLIGHT-B-R1.json", "cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd"),
}
R2_RANKINGS = BASE / "graph-dev-b-r2/code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl"
OUTPUT = BASE / "graph-dev-b-r2/code-only/test-edges-r3"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit("source-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if OUTPUT.exists() or any(sha(path.read_bytes()) != pin for path, pin in PINS.values()):
        raise SystemExit("output-exists-or-input-pin-drift")
    r2, r3 = load(R2_RULE, "g01_b_graph_r2"), load(R3_RULE, "g01_b_test_edges_r3")
    candidates = json.loads(PINS["candidate"][0].read_bytes())["development"]
    records = json.loads(PINS["projection"][0].read_bytes())["records"]
    queries = [json.loads(line) for line in PINS["queries"][0].read_text().splitlines()]
    prior = json.loads(PINS["preflight"][0].read_bytes())["results"]
    r2_seal = json.loads(PINS["r2_seal"][0].read_bytes())
    data = R2_RANKINGS.read_bytes()
    if sha(data) != r2_seal["rankings_sha256"]:
        raise SystemExit("r2-ranking-drift")
    old_rows = [json.loads(line) for line in data.splitlines()]
    if not all(len(rows) == 24 for rows in (candidates, records, queries, prior, old_rows)):
        raise SystemExit("denominator-drift")
    OUTPUT.mkdir(mode=0o700)
    output = []
    for ordinal, (case, record, query, pf, old) in enumerate(zip(
            candidates, records, queries, prior, old_rows), 1):
        if (case["ordinal"] != ordinal or record["ordinal"] != ordinal or
                old["ordinal"] != ordinal or old["id"] != case["image_tag"] or
                query["id"] != case["image_tag"] or
                old["base_commit"] != case["failure_commit"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        job = case["failure_job_id"]
        if ordinal == 12:
            log_path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-REPLACEMENT-LOG-12-{job}.txt"
            log_sha = case["log_sha256"]
        else:
            if pf["ordinal"] != ordinal or pf["image_tag"] != case["image_tag"]:
                raise SystemExit(f"preflight-identity-drift:{ordinal}")
            log_path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
            log_sha = pf["log_sha256"]
        log = log_path.read_bytes()
        if sha(log) != log_sha:
            raise SystemExit(f"log-hash-drift:{ordinal}")
        started = time.monotonic()
        root = Path(record["root"]).resolve(strict=True)
        paths = old["ranked_files"]
        direct, _, symbols, tree_sha = r2.graph_for_case(root, paths, case["language"])
        if tree_sha != record["projected_tree_sha256"]:
            raise SystemExit(f"source-tree-drift:{ordinal}")
        seeds = r3.test_seeds(paths, log.decode("utf-8", errors="replace"),
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
        targets = sorted(score, key=lambda path: (-score[path], rank[path], path))[:20]
        target_set = set(targets)
        new = sorted(paths, key=lambda path: (
            -(1.0 / (rank[path] + 1) + min(score[path], 1.4)
              if path in target_set else 1.0 / (rank[path] + 1)), rank[path], path))
        if len(new) != len(paths) or set(new) != set(paths):
            raise SystemExit(f"ranking-coverage-drift:{ordinal}")
        output.append({"schema_version": "are.g01-bugswarm-graph-dev-b-test-edges-r4/v1",
                       "ordinal": ordinal, "id": old["id"], "repo": old["repo"],
                       "language": old["language"], "base_commit": old["base_commit"],
                       "r2_ranking_sha256": r2_seal["rankings_sha256"],
                       "source_tree_sha256": tree_sha, "test_seed_count": len(seeds),
                       "edge_target_count": len(targets),
                       "ranker_elapsed_ms": round((time.monotonic() - started) * 1000),
                       "ranked_files": new, "candidate_count": len(new),
                       "gold_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "test_seeds": len(seeds),
                          "edge_targets": len(targets)}), flush=True)
    encoded = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in output)).encode()
    write_new(OUTPUT / "TEST-EDGE-RANKINGS-B-R4.jsonl", encoded)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-test-edges-seal-r4/v1",
            "input_sha256": {name: pin for name, (_, pin) in PINS.items()},
            "r2_rule_sha256": sha(R2_RULE.read_bytes()), "r3_rule_sha256": sha(R3_RULE.read_bytes()),
            "script_sha256": sha(Path(__file__).read_bytes()),
            "rule": "Unchanged graph-dev r3 test-to-code import and class-stem edge augmentation",
            "cases": len(output), "rankings_sha256": sha(encoded),
            "incremental_elapsed_ms_sum": sum(row["ranker_elapsed_ms"] for row in output),
            "gold_opened": False, "reserved_confirmation_opened": False, "model_calls": 0}
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(OUTPUT / "TEST-EDGE-SEAL-B-R4.json", seal_data)
    print(json.dumps({"cases": len(output), "rankings_sha256": sha(encoded),
                      "seal_sha256": sha(seal_data)}), flush=True)


if __name__ == "__main__":
    main()
