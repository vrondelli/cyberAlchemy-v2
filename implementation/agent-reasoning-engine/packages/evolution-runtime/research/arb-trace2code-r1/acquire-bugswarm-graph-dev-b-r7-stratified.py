#!/usr/bin/env python3
"""Source-only failure-line, test-alias, and rare-stem acquisition on B."""

from __future__ import annotations

from collections import Counter, defaultdict
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re


HERE = Path(__file__).resolve().parent
R6 = HERE / "acquire-bugswarm-graph-dev-b-r6-stems.py"
GRAPH = HERE / "rank-bugswarm-graph-dev-r2-graph.py"
BASE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
PROTOCOL = HERE.parents[1] / "evidence/G01-BUGSWARM-GRAPH-DEV-B-R7-STRATIFIED-ACQUISITION-PROTOCOL-2026-10-04.md"
PROTOCOL_SHA = "960fe03bea033017fbe0e1afa0d89aac0fc9851afc3c2f58d72c878cc92871b8"
OUTPUT = BASE / "graph-dev-b-r2/code-only/stratified-r7"
TOKEN = re.compile(r"[A-Za-z_][A-Za-z0-9_]{5,}")
STEM = re.compile(r"[A-Za-z_][A-Za-z0-9_]{5,}\Z")
FAILURE_LINE = re.compile(r"error|fail|exception|traceback|assert|caused by|\bat\s", re.I)


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
    parent = load(R6, "g01_b_r6_inputs")
    graph = load(GRAPH, "g01_b_graph_rule_r7")
    inputs = parent.INPUTS
    if (OUTPUT.exists() or sha(PROTOCOL.read_bytes()) != PROTOCOL_SHA or
            any(sha(path.read_bytes()) != pin for path, pin in inputs.values())):
        raise SystemExit("output-exists-or-input-pin-drift")
    cases = json.loads(inputs["candidate"][0].read_bytes())["development"]
    preflight = json.loads(inputs["preflight"][0].read_bytes())["results"]
    r2 = [json.loads(line) for line in inputs["r2"][0].read_text().splitlines()]
    packets = [json.loads(line) for line in inputs["packets"][0].read_text().splitlines()]
    packet_seal = json.loads(inputs["packet_seal"][0].read_bytes())
    if (not all(len(rows) == 24 for rows in (cases, preflight, r2, packets)) or
            packet_seal["packets_sha256"] != inputs["packets"][1]):
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
        all_words: Counter[str] = Counter()
        failure_lines: Counter[str] = Counter()
        for line in log.decode("utf-8", errors="replace").splitlines():
            words = [word.lower() for word in TOKEN.findall(line)]
            all_words.update(words)
            if FAILURE_LINE.search(line):
                failure_lines.update(set(words))
        rank = {path: i for i, path in enumerate(ranking["ranked_files"])}
        by_stem: dict[str, list[str]] = defaultdict(list)
        for path in ranking["ranked_files"]:
            if graph.is_test(path):
                continue
            stem = PurePosixPath(path).stem
            if STEM.fullmatch(stem):
                by_stem[stem.lower()].append(path)
        unique = {stem: paths[0] for stem, paths in by_stem.items() if len(paths) == 1}
        union = [item["path"] for item in packet["candidates"]]
        if len(union) != len(set(union)) or not set(union).issubset(rank):
            raise SystemExit(f"union-shape-drift:{ordinal}")
        selected = list(union)
        seen = set(selected)
        added = []

        def take(entries: list[tuple[str, int]], limit: int, source: str) -> None:
            count = 0
            for path, support in entries:
                if path in seen:
                    continue
                if len(added) >= 31 or count >= limit:
                    break
                seen.add(path)
                selected.append(path)
                added.append({"path": path, "source": source,
                              "support": support, "r2_rank": rank[path] + 1})
                count += 1

        failures = [(path, failure_lines[stem]) for stem, path in unique.items()
                    if failure_lines[stem] > 0]
        failures.sort(key=lambda item: (-item[1], -len(PurePosixPath(item[0]).stem),
                                        rank[item[0]], item[0]))
        take(failures, 12, "failure-line")
        aliases = []
        for stem, path in unique.items():
            count = sum(all_words[alias] for alias in (
                "test" + stem, stem + "test", stem + "tests", stem + "it",
                stem + "integrationtest"))
            if count:
                aliases.append((path, count))
        aliases.sort(key=lambda item: (-item[1], -len(PurePosixPath(item[0]).stem),
                                       rank[item[0]], item[0]))
        take(aliases, 10, "test-alias")
        rare = [(path, all_words[stem]) for stem, path in unique.items()
                if 1 <= all_words[stem] <= 8]
        rare.sort(key=lambda item: (-len(PurePosixPath(item[0]).stem), item[1],
                                    rank[item[0]], item[0]))
        take(rare, 31, "rare-stem")
        if len(selected) > 80 or len(selected) != len(set(selected)):
            raise SystemExit(f"candidate-cap-drift:{ordinal}")
        rows.append({"ordinal": ordinal, "id": tag, "repo": case["repo"],
                     "language": case["language"], "base_commit": case["failure_commit"],
                     "log_sha256": log_sha, "r2_rankings_sha256": inputs["r2"][1],
                     "packet_sha256": inputs["packets"][1], "union_paths": union,
                     "added": added, "candidate_paths": selected,
                     "candidate_count": len(selected), "gold_opened": False,
                     "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "union": len(union),
                          "added": len(added), "total": len(selected)}), flush=True)
    encoded = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    write_new(OUTPUT / "CANDIDATES-B-R7.jsonl", encoded)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-b-stratified-seal-r7/v1",
            "input_sha256": {name: pin for name, (_, pin) in inputs.items()},
            "protocol_sha256": PROTOCOL_SHA, "r6_script_sha256": sha(R6.read_bytes()),
            "graph_rule_sha256": sha(GRAPH.read_bytes()),
            "script_sha256": sha(Path(__file__).read_bytes()),
            "rule": "12 failure-line exact stems, 10 test aliases, rare exact stems fill to 31 extra; union preserved; at most 80 paths",
            "cases": len(rows), "maximum_candidates": max(row["candidate_count"] for row in rows),
            "candidate_sha256": sha(encoded), "gold_opened": False,
            "reserved_confirmation_opened": False, "model_calls": 0}
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    write_new(OUTPUT / "SEAL-B-R7.json", seal_data)
    print(json.dumps({"cases": len(rows), "maximum_candidates": seal["maximum_candidates"],
                      "candidate_sha256": sha(encoded), "seal_sha256": sha(seal_data)}),
          flush=True)


if __name__ == "__main__":
    main()
