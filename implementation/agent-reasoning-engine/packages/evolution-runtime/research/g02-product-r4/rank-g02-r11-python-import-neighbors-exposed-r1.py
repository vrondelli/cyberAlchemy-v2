#!/usr/bin/env python3
"""Fixed source-only top-three ordering of exposed r11 Python import neighbors."""

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path


GRAPH_SEAL_SHA256 = "777f9d69cc65be69d472ed3a7633f75483e01134c5298527b99fd22f5c490384"
PRIOR_SEAL_SHA256 = "eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901"
RANKER_SHA256 = "58838344fd19274387440748122e7e3086590304eb53dec8ecab3def4bfa8eed"
MAX_READ_BYTES = 262144


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("graph_seal", type=Path)
    parser.add_argument("prior_seal", type=Path)
    parser.add_argument("ranker", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if (sha(args.graph_seal.read_bytes()) != GRAPH_SEAL_SHA256 or
            sha(args.prior_seal.read_bytes()) != PRIOR_SEAL_SHA256 or
            sha(args.ranker.read_bytes()) != RANKER_SHA256):
        raise SystemExit("fixed source input drift")
    graph = json.loads(args.graph_seal.read_text())
    prior = json.loads(args.prior_seal.read_text())
    spec = importlib.util.spec_from_file_location("fixed_file_bm25", args.ranker)
    ranker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranker)
    by_ordinal = {row["ordinal"]: row for row in prior["rows"]}
    rows = []
    for row in graph["rows"]:
        ordinal = row["ordinal"]
        source = by_ordinal[ordinal]
        root = Path(prior["archive"]) / "pairs" / f"{ordinal:02d}-pr11-mixed-{ordinal:02d}" / "raw"
        base = root / "sources/session/base"
        tasks = [path for path in (root / "tasks").glob("*.json") if path.name != "binding.json"]
        if len(tasks) != 1:
            raise SystemExit("task count")
        task = json.loads(tasks[0].read_text())
        issue = task["problem_statement"]
        if (task["instance_id"] != source["instance_id"] or
                sha(issue.encode()) != source["issue_sha256"] or
                row["base_commit"] != source["base_commit"] or
                row["delivered_paths"] != source["delivered_paths"]):
            raise SystemExit("source identity drift")
        issue_terms = set(ranker.terms(issue))
        structured_terms = {token for match in ranker.CODE_RE.finditer(issue)
                            for token in ranker.terms(match.group(0))}
        delivered = [Path(path) for path in row["delivered_paths"]]
        raw_top30 = {item["path"] for item in source["raw_top30"]}
        scored = []
        for candidate in row["candidates"]:
            if candidate["bytes"] > MAX_READ_BYTES:
                continue
            path = candidate["path"]
            file = base / path
            if not file.is_file() or file.is_symlink() or file.stat().st_size != candidate["bytes"]:
                raise SystemExit("candidate file drift")
            candidate_path = Path(path)
            path_terms = set(ranker.terms(path))
            content_terms = set(ranker.terms(file.read_bytes().decode("utf-8", "replace")))
            signals = {
                "structured_path_hits": len(structured_terms & path_terms),
                "raw_path_hits": len(issue_terms & path_terms),
                "structured_content_hits_capped": min(len(structured_terms & content_terms), 8),
                "raw_content_hits_capped": min(len(issue_terms & content_terms), 5),
                "same_parent": int(any(candidate_path.parent == seed.parent for seed in delivered)),
                "same_prefix2": int(any(candidate_path.parts[:2] == seed.parts[:2]
                                        for seed in delivered if len(seed.parts) >= 2)),
                "incoming_edges_capped": min(len(candidate["imports_delivered"]), 3),
                "outgoing_edges_capped": min(len(candidate["imported_by_delivered"]), 3),
                "raw_bm25_top30": int(path in raw_top30),
            }
            units = (10 * signals["structured_path_hits"] + 3 * signals["raw_path_hits"] +
                     2 * signals["structured_content_hits_capped"] + signals["raw_content_hits_capped"] +
                     4 * signals["same_parent"] + 2 * signals["same_prefix2"] +
                     2 * signals["incoming_edges_capped"] + 3 * signals["outgoing_edges_capped"] +
                     3 * signals["raw_bm25_top30"])
            scored.append({"path": path, "score_units": units, "signals": signals})
        scored.sort(key=lambda item: (-item["score_units"], item["path"]))
        rows.append({"ordinal": ordinal, "instance_id": row["instance_id"],
                     "eligible_candidate_count": len(scored), "ranked": scored,
                     "top3": [item["path"] for item in scored[:3]]})
    output = {"schema_version": "g02.r11-python-import-neighbor-ranked-exposed-seal/v1",
              "posture": "source-only-exposed-development-no-gold-dsh-or-score",
              "graph_seal_sha256": GRAPH_SEAL_SHA256,
              "prior_seal_sha256": PRIOR_SEAL_SHA256,
              "ranker_sha256": RANKER_SHA256,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "score_rule": "10*structured_path_hits+3*raw_path_hits+2*min(structured_content_hits,8)+min(raw_content_hits,5)+4*same_parent+2*same_two_path_segments+2*min(incoming_edges,3)+3*min(outgoing_edges,3)+3*raw_BM25_top30; path tie break",
              "fixed_read_budget": 3, "rows": rows,
              "claim_ceiling": "Source-only proposal seal; no actual added read, native score, cost, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"tasks": len(rows), "top3_slots": sum(len(row["top3"]) for row in rows),
                      "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
