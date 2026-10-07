#!/usr/bin/env python3
"""Apply the unchanged r2 source-only graph rule to development cohort B."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
RULE = HERE / "rank-bugswarm-graph-dev-r2-graph.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
PINS = {
    "candidate": (BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json", "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"),
    "projection": (BASE / "graph-dev-b-r2/code-only/SOURCE-PROJECTION-RECEIPT.json", "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"),
    "queries": (BASE / "graph-dev-b-r2/code-only/QUERIES-B-R3.jsonl", "696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b"),
    "are_seal": (BASE / "graph-dev-b-r2/code-only/ARE-SEAL-B-R3.json", "d6555bb758b3f974c516ab23ae29cf6e8ddfa493804feb5fb247bc13395fd2ed"),
    "preflight": (BASE / "graph-dev-b-r1/DEV-PREFLIGHT-B-R1.json", "cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd"),
}
RANKINGS = BASE / "graph-dev-b-r2/code-only/are-rankings"
OUTPUT = BASE / "graph-dev-b-r2/code-only/graph-r2"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if (OUTPUT.exists() or any(sha(path.read_bytes()) != pin
            for path, pin in PINS.values())):
        raise SystemExit("output-exists-or-input-pin-drift")
    spec = importlib.util.spec_from_file_location("g01_graph_r2_rule", RULE)
    if spec is None or spec.loader is None:
        raise SystemExit("graph-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    cases = json.loads(PINS["candidate"][0].read_bytes())["development"]
    records = json.loads(PINS["projection"][0].read_bytes())["records"]
    queries = [json.loads(line) for line in PINS["queries"][0].read_text().splitlines()]
    seals = json.loads(PINS["are_seal"][0].read_bytes())["rankings"]
    prior = json.loads(PINS["preflight"][0].read_bytes())["results"]
    if not all(len(items) == 24 for items in (cases, records, queries, seals, prior)):
        raise SystemExit("denominator-drift")
    OUTPUT.mkdir(mode=0o700)
    output = []
    for ordinal, (case, record, query, seal, pf) in enumerate(zip(
            cases, records, queries, seals, prior), 1):
        data = (RANKINGS / f"ARE-RANKING-{ordinal:02d}.json").read_bytes()
        baseline = json.loads(data)
        if (case["ordinal"] != ordinal or record["ordinal"] != ordinal or
                record["image_tag"] != case["image_tag"] or query["id"] != case["image_tag"] or
                baseline["id"] != case["image_tag"] or
                baseline["base_commit"] != case["failure_commit"] or
                seal["ranking_sha256"] != sha(data)):
            raise SystemExit(f"source-identity-drift:{ordinal}")
        root = Path(record["root"]).resolve(strict=True)
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
        ranking, diag = module.rank_case(root, baseline["ranked_files"],
                                         log.decode("utf-8", errors="replace"),
                                         query["query"], case["language"])
        if diag["source_tree_sha256"] != record["projected_tree_sha256"]:
            raise SystemExit(f"source-tree-drift:{ordinal}")
        output.append({"schema_version": "are.g01-bugswarm-graph-dev-b-rank-r3/v1",
                       "ordinal": ordinal, "id": case["image_tag"], "repo": case["repo"],
                       "language": case["language"], "base_commit": case["failure_commit"],
                       "query_sha256": query["query_sha256"], "log_sha256": log_sha,
                       "are_ranking_sha256": seal["ranking_sha256"],
                       "ranked_files": ranking, "candidate_count": len(ranking),
                       **diag, "gold_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "ranker_elapsed_ms": diag["ranker_elapsed_ms"]}),
              flush=True)
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in output)).encode()
    write_new(OUTPUT / "GRAPH-RANKINGS-B-R3.jsonl", data)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-rank-seal-r3/v1",
            "input_sha256": {name: pin for name, (_, pin) in PINS.items()},
            "rule_sha256": sha(RULE.read_bytes()), "script_sha256": sha(Path(__file__).read_bytes()),
            "rule": "Unchanged graph-dev r2 failure-anchored symbol/import graph ranking",
            "cases": len(output), "rankings_sha256": sha(data),
            "total_ranker_elapsed_ms": sum(row["ranker_elapsed_ms"] for row in output),
            "gold_opened": False, "reserved_confirmation_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(OUTPUT / "GRAPH-RANKING-SEAL-B-R3.json", encoded)
    print(json.dumps({"cases": len(output), "rankings_sha256": sha(data),
                      "seal_sha256": sha(encoded)}), flush=True)


if __name__ == "__main__":
    main()
