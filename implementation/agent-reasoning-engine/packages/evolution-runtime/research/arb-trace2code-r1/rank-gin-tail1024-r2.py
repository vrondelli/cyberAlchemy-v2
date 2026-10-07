#!/usr/bin/env python3
"""Source-only Gin rankings with the exact 1024-byte tail query used by ARE probe."""

from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib


SOURCE_AUDIT_SHA256 = "1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f"
DEV_QUERIES_SHA256 = "19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, required=True)
    parser.add_argument("--queries", type=pathlib.Path, required=True)
    parser.add_argument("--ranker", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    source, queries, ranker = (path.resolve(strict=True) for path in
                               (args.source, args.queries, args.ranker))
    output = args.output.absolute()
    spec = importlib.util.spec_from_file_location("gin_ranker_r1", ranker)
    if spec is None or spec.loader is None:
        raise SystemExit("ranker import unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    if (output.exists() or module.sha256_file(source / "SOURCE-CORPUS-AUDIT.json") != SOURCE_AUDIT_SHA256 or
            module.sha256_file(queries) != DEV_QUERIES_SHA256):
        raise SystemExit("output exists or input pin drift")
    manifest = {(row["repo"], row["base_commit"]): row for row in
                (json.loads(line) for line in (source / "corpus/v2_trace2code/corpus_manifest.jsonl").read_text().splitlines())}
    cache = {}
    rows = []
    for line in queries.read_text().splitlines():
        item = json.loads(line)
        identity = (item["repo"], item["base_commit"])
        if item["repo"] != "gin-gonic/gin" or identity not in manifest:
            raise SystemExit("development query outside declared split")
        if identity not in cache:
            relative = manifest[identity]["chunks_path"].removeprefix("data/")
            cache[identity] = module.load_snapshot(source / relative, *identity)
            if len(cache[identity]) != manifest[identity]["file_count"]:
                raise SystemExit("snapshot file count drift")
        raw = item["query"]["failure_excerpt"].encode("utf-8")
        window = raw[-1024:].decode("utf-8", errors="replace").replace("\ufffd", "").strip()
        if not window or len(window.encode("utf-8")) > 1024:
            raise SystemExit("invalid tail query")
        baseline, trace = module.rankings(cache[identity], {"failure_excerpt": window, "command": ""})
        rows.append({"id": item["id"], "repo": item["repo"], "base_commit": item["base_commit"],
                     "candidate_count": len(baseline), "query_sha256": module.hashlib.sha256(window.encode()).hexdigest(),
                     "baseline_ranked_files": baseline, "trace_aware_ranked_files": trace})
    if len(rows) != 56 or len({row["id"] for row in rows}) != 56:
        raise SystemExit("development denominator drift")
    output.mkdir(parents=True, exist_ok=False)
    path = output / "TAIL1024-RANKINGS.jsonl"
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))
    receipt = {"schema": "are.arb-trace2code-gin-tail1024-r2/v1",
               "posture": "source-only exposed development; same failure-excerpt tail input budget as ARE query",
               "source_audit_sha256": SOURCE_AUDIT_SHA256, "dev_queries_sha256": DEV_QUERIES_SHA256,
               "ranker_sha256": module.sha256_file(ranker), "prediction_sha256": module.sha256_file(path),
               "development_cases": len(rows), "snapshots": len(cache), "gold_opened": False,
               "holdout_queries_opened": False, "model_calls": 0}
    (output / "SOURCE-SEAL.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))


if __name__ == "__main__":
    main()
