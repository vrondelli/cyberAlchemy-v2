#!/usr/bin/env python3
"""Source-only bounded full-log unique file-stem acquisition for cohort B."""

from __future__ import annotations

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re


HERE = Path(__file__).resolve().parent
GRAPH_RULE = HERE / "rank-bugswarm-graph-dev-r2-graph.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
INPUTS = {
    "candidate": (BASE / "graph-dev-b-r1/METADATA-COHORT-B-R2.json", "53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8"),
    "preflight": (BASE / "graph-dev-b-r1/DEV-PREFLIGHT-B-R1.json", "cc8adb5e427659794cfc6334797b759fd7dc9884346968bb74ac2dfea21f98dd"),
    "r2": (BASE / "graph-dev-b-r2/code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl", "86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d"),
    "packets": (BASE / "graph-dev-b-r2/code-only/union-packets-r5/PACKETS.jsonl", "886ed453cea56d4057733d62f52585f36572504fd2052d6a61808fe1dce14e8f"),
    "packet_seal": (BASE / "graph-dev-b-r2/code-only/union-packets-r5/PACKET-SEAL.json", "13b30ef2e791b4dc43db1988dc3fb68f7b23f9073afa34bc09bfdb19751ed624"),
}
PROTOCOL = HERE.parents[1] / "evidence/G01-BUGSWARM-GRAPH-DEV-B-R6-FULL-LOG-STEM-PROTOCOL-2026-10-04.md"
PROTOCOL_SHA = "7903619245f4ff733ab5ab1944deed821cb8aad6ffce377a9f218642b1c63ebe"
OUTPUT = BASE / "graph-dev-b-r2/code-only/full-log-stems-r6"
TOKEN = re.compile(r"[A-Za-z_][A-Za-z0-9_]{5,}")
STEM = re.compile(r"[A-Za-z_][A-Za-z0-9_]{5,}\Z")


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise SystemExit("graph-rule-unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_new(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if (OUTPUT.exists() or sha(PROTOCOL.read_bytes()) != PROTOCOL_SHA or
            any(sha(path.read_bytes()) != pin for path, pin in INPUTS.values())):
        raise SystemExit("output-exists-or-input-pin-drift")
    graph = load(GRAPH_RULE, "g01_b_graph_rule")
    cases = json.loads(INPUTS["candidate"][0].read_bytes())["development"]
    preflight = json.loads(INPUTS["preflight"][0].read_bytes())["results"]
    r2 = [json.loads(line) for line in INPUTS["r2"][0].read_text().splitlines()]
    packets = [json.loads(line) for line in INPUTS["packets"][0].read_text().splitlines()]
    packet_seal = json.loads(INPUTS["packet_seal"][0].read_bytes())
    if (not all(len(rows) == 24 for rows in (cases, preflight, r2, packets)) or
            packet_seal["packets_sha256"] != INPUTS["packets"][1]):
        raise SystemExit("denominator-or-packet-drift")
    OUTPUT.mkdir(mode=0o700)
    rows = []
    for ordinal, (case, pf, ranking, packet) in enumerate(zip(cases, preflight, r2, packets), 1):
        tag, job = case["image_tag"], case["failure_job_id"]
        if (case["ordinal"] != ordinal or ranking["ordinal"] != ordinal or
                packet["ordinal"] != ordinal or ranking["id"] != tag or
                packet["id"] != tag or ranking["base_commit"] != case["failure_commit"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        if ordinal == 12:
            log_path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-REPLACEMENT-LOG-12-{job}.txt"
            log_sha = case["log_sha256"]
        else:
            if pf["ordinal"] != ordinal or pf["image_tag"] != tag or not pf["log_job_id_matched"]:
                raise SystemExit(f"preflight-drift:{ordinal}")
            log_path = BASE / f"graph-dev-b-r1/HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{job}.txt"
            log_sha = pf["log_sha256"]
        log = log_path.read_bytes()
        if sha(log) != log_sha:
            raise SystemExit(f"log-hash-drift:{ordinal}")
        occurrences = Counter(word.lower() for word in TOKEN.findall(
            log.decode("utf-8", errors="replace")))
        rank = {path: index for index, path in enumerate(ranking["ranked_files"])}
        by_stem: dict[str, list[str]] = defaultdict(list)
        for path in ranking["ranked_files"]:
            if graph.is_test(path):
                continue
            stem = PurePosixPath(path).stem
            if STEM.fullmatch(stem):
                by_stem[stem.lower()].append(path)
        hits = [(paths[0], occurrences[stem]) for stem, paths in by_stem.items()
                if len(paths) == 1 and occurrences[stem] > 0]
        hits.sort(key=lambda item: (-item[1], rank[item[0]], item[0]))
        union = [item["path"] for item in packet["candidates"]]
        if len(union) != len(set(union)) or not set(union).issubset(rank):
            raise SystemExit(f"union-shape-drift:{ordinal}")
        additions = [(path, count) for path, count in hits if path not in union][:20]
        complete = union + [path for path, _ in additions]
        if len(complete) > 80 or len(complete) != len(set(complete)):
            raise SystemExit(f"candidate-cap-drift:{ordinal}")
        rows.append({"ordinal": ordinal, "id": tag, "repo": case["repo"],
                     "language": case["language"], "base_commit": case["failure_commit"],
                     "log_sha256": log_sha, "r2_rankings_sha256": INPUTS["r2"][1],
                     "packet_sha256": INPUTS["packets"][1],
                     "union_paths": union, "added": [{"path": path, "occurrences": count,
                                                       "r2_rank": rank[path] + 1}
                                                      for path, count in additions],
                     "candidate_paths": complete, "candidate_count": len(complete),
                     "gold_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "union": len(union),
                          "added": len(additions), "total": len(complete)}), flush=True)
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    write_new(OUTPUT / "STEM-CANDIDATES-B-R6.jsonl", data)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-stem-seal-r6/v1",
            "input_sha256": {name: pin for name, (_, pin) in INPUTS.items()},
            "protocol_sha256": PROTOCOL_SHA, "graph_rule_sha256": sha(GRAPH_RULE.read_bytes()),
            "script_sha256": sha(Path(__file__).read_bytes()),
            "rule": "Full original log exact ASCII identifier token count; unique non-test source stem length>=6; top 20 nonunion by count then r2 rank/path",
            "cases": len(rows), "maximum_candidates": max(row["candidate_count"] for row in rows),
            "candidate_sha256": sha(data), "gold_opened": False,
            "reserved_confirmation_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(OUTPUT / "STEM-SEAL-B-R6.json", encoded)
    print(json.dumps({"cases": len(rows), "maximum_candidates": seal["maximum_candidates"],
                      "candidate_sha256": sha(data), "seal_sha256": sha(encoded)}),
          flush=True)


if __name__ == "__main__":
    main()
