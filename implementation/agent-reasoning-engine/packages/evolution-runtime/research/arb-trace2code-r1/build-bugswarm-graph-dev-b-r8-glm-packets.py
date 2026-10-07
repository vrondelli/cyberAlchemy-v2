#!/usr/bin/env python3
"""Seal source-only r7 candidate packets for cohort-B r8 GLM ranking."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
R4 = HERE / "build-bugswarm-graph-dev-r4-union-packets.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2")
INPUTS = {
    "candidates": (BASE / "code-only/stratified-r7/CANDIDATES-B-R7.jsonl", "a9d9d73daa1cd05318583c525cec899edad6c4a84dc48b411b135befe9227ef3"),
    "candidate_seal": (BASE / "code-only/stratified-r7/SEAL-B-R7.json", "21c87da11d3cb31163f0ac87c3109537a41a7852a5e259d6fc4692b42ee5fecb"),
    "r2": (BASE / "code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl", "86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d"),
    "r3": (BASE / "code-only/test-edges-r3/TEST-EDGE-RANKINGS-B-R4.jsonl", "c3f64d5c4c28d9de936ba2a0aa86ecbfbf039e92822aed82f02bc943b7309dcd"),
    "queries": (BASE / "code-only/QUERIES-B-R3.jsonl", "696c742d96c69f7260f94a70d5159620c3bef8bb82e0d34b44beaddc31cdfe8b"),
    "sources": (BASE / "code-only/SOURCE-PROJECTION-RECEIPT.json", "ac0e840cad602ac5b5f80ba7579389ab95cc6efdb4ae682c1744103b29db5d92"),
}
PROTOCOL = HERE.parents[1] / "evidence/G01-BUGSWARM-GRAPH-DEV-B-R8-GLM-PROTOCOL-2026-10-04.md"
PROTOCOL_SHA = "b5c2829077cd98bb4b511b758990ffb8d70652047ef77ed5aa3056fbdb0bc65c"
OUTPUT = BASE / "code-only/glm-packets-r8"
WORDS = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,}")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit("excerpt-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if (OUTPUT.exists() or sha(PROTOCOL.read_bytes()) != PROTOCOL_SHA or
            any(sha(path.read_bytes()) != pin for path, pin in INPUTS.values())):
        raise SystemExit("output-exists-or-input-pin-drift")
    r4 = load(R4, "g01_b_r4_excerpt")
    candidate_seal = json.loads(INPUTS["candidate_seal"][0].read_bytes())
    if candidate_seal["candidate_sha256"] != INPUTS["candidates"][1]:
        raise SystemExit("candidate-seal-drift")
    rows = {name: [json.loads(line) for line in INPUTS[name][0].read_text().splitlines()]
            for name in ("candidates", "r2", "r3", "queries")}
    sources = json.loads(INPUTS["sources"][0].read_bytes())["records"]
    if not all(len(values) == 24 for values in (*rows.values(), sources)):
        raise SystemExit("denominator-drift")
    OUTPUT.mkdir(mode=0o700)
    packets, stats = [], []
    for index in range(24):
        ordinal = index + 1
        selection, a, b, q, source = (rows["candidates"][index], rows["r2"][index],
                                     rows["r3"][index], rows["queries"][index], sources[index])
        if (not (selection["ordinal"] == a["ordinal"] == b["ordinal"] == source["ordinal"] == ordinal)
                or not (selection["id"] == a["id"] == b["id"] == q["id"] == source["image_tag"])
                or not (selection["base_commit"] == a["base_commit"] == b["base_commit"] == q["base_commit"] == source["commit"])
                or selection["gold_opened"] is not False or
                a["source_tree_sha256"] != b["source_tree_sha256"] or
                a["source_tree_sha256"] != source["projected_tree_sha256"]):
            raise SystemExit(f"identity-or-posture-drift:{ordinal}")
        r2, r3 = a["ranked_files"], b["ranked_files"]
        if len(r2) != len(r3) or set(r2) != set(r3):
            raise SystemExit(f"ranking-coverage:{ordinal}")
        selected = selection["candidate_paths"]
        if (len(selected) > 80 or len(selected) != len(set(selected)) or
                not set(selected).issubset(r2) or selection["candidate_count"] != len(selected)):
            raise SystemExit(f"candidate-coverage:{ordinal}")
        origin = {item["path"]: item["source"] for item in selection["added"]}
        root = Path(source["root"]).resolve(strict=True)
        query_words = {word.lower() for word in WORDS.findall(q["query"])}
        candidates, lines = [], []
        for candidate_id, path in enumerate(selected, 1):
            evidence, line = r4.excerpt(root, path, query_words)
            item = {"candidate_id": candidate_id, "path": path,
                    "r2_rank": r2.index(path) + 1, "r3_rank": r3.index(path) + 1,
                    "origin": origin.get(path, "r2-r3-union"),
                    "excerpt": evidence, "excerpt_start_line": line}
            candidates.append(item)
            lines.append(f"[{candidate_id}] {path} | r2={item['r2_rank']} r3={item['r3_rank']} origin={item['origin']} | {evidence}")
        prompt = ("Locate the implementation file responsible for the failure. "
                  "Candidates are source files at the exact failing commit. "
                  "The r2 rank is a prior, not proof; failure-context and test-name additions "
                  "may expose a better cause. Use the failure and code evidence. "
                  "Return only JSON {\"candidate_ids\":[...]} with at most 8 distinct "
                  "candidate IDs, best first. No prose.\nFailure:\n" + q["query"] +
                  "\nCandidates:\n" + "\n".join(lines))
        prompt_bytes = len(prompt.encode())
        if prompt_bytes > 24_000:
            raise SystemExit(f"packet-byte-cap:{ordinal}:{prompt_bytes}")
        packets.append({"schema_version": "are.g01-bugswarm-graph-dev-b-r8-packet/v1",
                        "ordinal": ordinal, "id": a["id"], "repo": a["repo"],
                        "language": a["language"], "base_commit": a["base_commit"],
                        "source_tree_sha256": a["source_tree_sha256"],
                        "r2_ranking_sha256": INPUTS["r2"][1],
                        "r3_ranking_sha256": INPUTS["r3"][1],
                        "r7_candidate_sha256": INPUTS["candidates"][1],
                        "query": q["query"], "candidate_count": len(candidates),
                        "candidates": candidates, "prompt": prompt,
                        "gold_opened": False, "model_calls": 0,
                        "exposed_development": True})
        stats.append({"ordinal": ordinal, "candidate_count": len(candidates),
                      "prompt_bytes": prompt_bytes})
        print(json.dumps(stats[-1]), flush=True)
    data = ("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in packets)).encode()
    write_new(OUTPUT / "PACKETS-B-R8.jsonl", data)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-r8-packet-seal/v1",
            "input_sha256": {name: pin for name, (_, pin) in INPUTS.items()},
            "protocol_sha256": PROTOCOL_SHA, "excerpt_rule_sha256": sha(R4.read_bytes()),
            "builder_sha256": sha(Path(__file__).read_bytes()),
            "cases": len(packets), "maximum_candidates": max(row["candidate_count"] for row in stats),
            "maximum_prompt_bytes": max(row["prompt_bytes"] for row in stats),
            "case_stats": stats, "packets_sha256": sha(data),
            "gold_opened": False, "reserved_confirmation_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(OUTPUT / "PACKET-SEAL-B-R8.json", encoded)
    print(json.dumps({"cases": len(packets), "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"],
                      "packets_sha256": sha(data), "seal_sha256": sha(encoded)}), flush=True)


if __name__ == "__main__":
    main()
