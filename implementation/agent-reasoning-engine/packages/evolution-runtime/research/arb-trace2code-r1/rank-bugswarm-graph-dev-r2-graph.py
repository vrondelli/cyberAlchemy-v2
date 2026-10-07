#!/usr/bin/env python3
"""Source-only failure-anchored symbol/import graph ranker for G01 development."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import time


PINS = {
    "candidate": "c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332",
    "projection": "201f4ba4d31d93dbfbff5f808307c079d46f4db2319cb40a4df08e7d0bb9bf51",
    "queries": "9ccaeb5a21d3391f819eddb151a38cb3d2a287562abe1850df2a4cc8ab81a561",
    "are_seal": "45600cfba313f530d2357fb30ec3304fe8ea23ea02c0fcb21b30d210c9a95824",
    "preflight": "03ec15d02446aef5d47d1a190b640a16876732d2498f1ebcb59578ef22aecd34",
}
FILENAME = re.compile(r"(?<![A-Za-z0-9_])[/A-Za-z0-9_$.-]+\.(?:py|java)\b", re.I)
IDENT = re.compile(r"\b[A-Z][A-Za-z0-9_]{3,}\b")
JAVA_PACKAGE = re.compile(r"(?m)^\s*package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*;")
JAVA_IMPORT = re.compile(r"(?m)^\s*import\s+(?:static\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+)\s*;")
JAVA_DECL = re.compile(r"\b(?:class|interface|enum|record)\s+([A-Za-z_]\w*)")
PY_IMPORT = re.compile(r"(?m)^\s*(?:from\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s+import|import\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*))")
PY_DECL = re.compile(r"(?m)^\s*(?:class|def)\s+([A-Za-z_]\w*)")
STOP = {"Error", "Exception", "Failed", "Failure", "Test", "Tests", "Build",
        "Java", "Python", "Result", "Running", "Traceback", "File", "AssertionError",
        "RuntimeError", "ImportError", "TypeError", "ValueError", "IndexError"}
MAX_LOG_BYTES = 65536
MAX_PARSED_FILE_BYTES = 262144
MAX_FILENAME_SEEDS = 10
MAX_SYMBOL_SEEDS = 10
MAX_GRAPH_NEIGHBORS = 20


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def is_test(path: str) -> bool:
    parts = PurePosixPath(path).parts
    base = parts[-1].lower()
    return any(part.lower() in {"test", "tests", "testing", "testdata", "fixtures"}
               for part in parts[:-1]) or (base.startswith("test_")
               or base.endswith("_test.py") or base.endswith("test.java")
               or base.endswith("tests.java"))


def path_safe(path: str) -> bool:
    posix = PurePosixPath(path)
    return bool(path) and not posix.is_absolute() and ".." not in posix.parts \
        and ".git" not in posix.parts and "\\" not in path


def resolve_unique(name: str, qualified: dict[str, list[str]]) -> str | None:
    parts = name.split(".")
    while parts:
        found = qualified.get(".".join(parts), [])
        if len(found) == 1:
            return found[0]
        parts.pop()
    return None


def graph_for_case(root: Path, paths: list[str], language: str) -> tuple[dict[str, set[str]], dict[str, set[str]], dict[str, list[str]], str]:
    qualified: dict[str, list[str]] = defaultdict(list)
    symbols: dict[str, list[str]] = defaultdict(list)
    import_names: dict[str, list[str]] = {}
    tree = hashlib.sha256()
    for rel in sorted(paths):
        if not path_safe(rel):
            raise SystemExit("unsafe-source-path")
        target = root.joinpath(*PurePosixPath(rel).parts).resolve(strict=True)
        if not target.is_relative_to(root) or not target.is_file():
            raise SystemExit("source-path-escape-or-missing")
        data = target.read_bytes()
        tree.update(rel.encode() + b"\0" + hashlib.sha256(data).digest())
        text = data[:MAX_PARSED_FILE_BYTES].decode("utf-8", errors="replace")
        stem = PurePosixPath(rel).stem
        if language == "Java":
            package = JAVA_PACKAGE.search(text)
            if package:
                qualified[package.group(1) + "." + stem].append(rel)
            import_names[rel] = [match.group(1) for match in JAVA_IMPORT.finditer(text)]
            declarations = JAVA_DECL.findall(text)
        else:
            module = rel.removesuffix(".py").replace("/", ".")
            qualified[module].append(rel)
            if module.endswith(".__init__"):
                qualified[module.removesuffix(".__init__")].append(rel)
            import_names[rel] = [match.group(1) or match.group(2)
                                 for match in PY_IMPORT.finditer(text)]
            declarations = PY_DECL.findall(text)
        for symbol in set([stem, *declarations]):
            symbols[symbol.lower()].append(rel)
    direct: dict[str, set[str]] = {path: set() for path in paths}
    reverse: dict[str, set[str]] = {path: set() for path in paths}
    for path, names in import_names.items():
        for name in names:
            target = resolve_unique(name, qualified)
            if target and target != path:
                direct[path].add(target)
                reverse[target].add(path)
    return direct, reverse, symbols, tree.hexdigest()


def rank_case(root: Path, baseline: list[str], log_text: str,
              query: str, language: str) -> tuple[list[str], dict]:
    started = time.monotonic()
    paths = set(baseline)
    direct, reverse, symbols, tree_sha = graph_for_case(root, baseline, language)
    by_basename: dict[str, list[str]] = defaultdict(list)
    for path in baseline:
        if not is_test(path):
            by_basename[PurePosixPath(path).name.lower()].append(path)
    tail = log_text[-MAX_LOG_BYTES:]
    filename_hits: Counter[str] = Counter()
    exact_hits: Counter[str] = Counter()
    for match in FILENAME.finditer(tail):
        token = match.group().replace("\\", "/").lower()
        options = by_basename.get(PurePosixPath(token).name, [])
        suffix = [path for path in options if token.endswith(path.lower())
                  or path.lower().endswith(token)]
        resolved = suffix if len(suffix) == 1 else options if len(options) == 1 else []
        for path in resolved:
            filename_hits[path] += 1
            if len(suffix) == 1:
                exact_hits[path] += 1
    filename_seeds = sorted(filename_hits, key=lambda path: (
        -int(path in exact_hits), -filename_hits[path], baseline.index(path), path))[:MAX_FILENAME_SEEDS]
    focused = "\n".join(line for line in tail.splitlines()
                        if re.search(r"error|fail|exception|traceback|\bat\s|File\s+\"", line, re.I))
    anchors = {word.lower() for word in IDENT.findall(focused + "\n" + query)
               if word not in STOP}
    symbol_score: dict[str, float] = defaultdict(float)
    for anchor in anchors:
        matches = symbols.get(anchor, [])
        if 1 <= len(matches) <= 5:
            for path in matches:
                if not is_test(path):
                    symbol_score[path] += 0.7 / len(matches)
    symbol_seeds = sorted(symbol_score, key=lambda path: (
        -symbol_score[path], baseline.index(path), path))[:MAX_SYMBOL_SEEDS]
    seeds = list(dict.fromkeys(filename_seeds + symbol_seeds))[:20]
    graph_score: dict[str, float] = defaultdict(float)
    for seed in seeds:
        weight = 1.0 if seed in filename_seeds else 0.7
        for neighbor in direct[seed]:
            if not is_test(neighbor):
                graph_score[neighbor] += 0.35 * weight
        for neighbor in reverse[seed]:
            if not is_test(neighbor):
                graph_score[neighbor] += 0.25 * weight
    graph_neighbors = sorted((path for path in graph_score if path not in seeds),
                             key=lambda path: (-graph_score[path], baseline.index(path), path))[:MAX_GRAPH_NEIGHBORS]
    graph_keep = set(graph_neighbors)
    final_score = {}
    for position, path in enumerate(baseline, 1):
        score = 1.0 / position
        if path in filename_seeds:
            score += 2.0 if path in exact_hits else 1.25
        if path in symbol_seeds:
            score += min(symbol_score[path], 1.4)
        if path in graph_keep:
            score += min(graph_score[path], 0.7)
        if is_test(path):
            score -= 0.5
        final_score[path] = score
    ranking = sorted(baseline, key=lambda path: (-final_score[path], baseline.index(path), path))
    if len(ranking) != len(baseline) or set(ranking) != paths:
        raise SystemExit("ranking-coverage-drift")
    diagnostic = {"filename_seed_count": len(filename_seeds),
                  "symbol_seed_count": len(symbol_seeds),
                  "graph_neighbor_count": len(graph_neighbors),
                  "anchor_count": len(anchors),
                  "source_tree_sha256": tree_sha,
                  "ranker_elapsed_ms": round((time.monotonic() - started) * 1000)}
    return ranking, diagnostic


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in (*PINS, "rankings", "r1_logs", "r2_logs", "output_dir"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    args = parser.parse_args()
    if (not args.output_dir.is_dir() or any(args.output_dir.iterdir())
            or any(sha(getattr(args, name).read_bytes()) != pin for name, pin in PINS.items())):
        raise SystemExit("input-pin-drift-or-output-not-empty")
    candidates = json.loads(args.candidate.read_bytes())["development"]
    records = json.loads(args.projection.read_bytes())["records"]
    queries = [json.loads(line) for line in args.queries.read_text().splitlines()]
    seals = json.loads(args.are_seal.read_bytes())["rankings"]
    prior = json.loads(args.preflight.read_bytes())["results"]
    if not all(len(items) == 24 for items in (candidates, records, queries, seals, prior)):
        raise SystemExit("denominator-drift")
    output = []
    for ordinal, (case, record, query, seal, pf) in enumerate(zip(
            candidates, records, queries, seals, prior), 1):
        path = args.rankings / f"ARE-RANKING-{ordinal:02d}.json"
        data = path.read_bytes()
        baseline = json.loads(data)
        if (seal["ordinal"] != ordinal or sha(data) != seal["ranking_sha256"]
                or record["ordinal"] != ordinal or record["image_tag"] != case["image_tag"]
                or query["id"] != case["image_tag"] or baseline["id"] != case["image_tag"]
                or baseline["base_commit"] != case["failure_commit"]):
            raise SystemExit("source-identity-drift:" + str(ordinal))
        root = Path(record["root"]).resolve(strict=True)
        if ordinal in (11, 21):
            log_path = args.r2_logs / f"HTTP-PROVISIONAL-REPLACEMENT-LOG-{ordinal:02d}-{case['failure_job_id']}.txt"
            log_sha = case["log_sha256"]
        else:
            if pf["position"] != ordinal or pf["image_tag"] != case["image_tag"]:
                raise SystemExit("prior-preflight-identity-drift")
            log_path = args.r1_logs / f"HTTP-PROVISIONAL-FAILURE-LOG-{ordinal:02d}-{case['failure_job_id']}.txt"
            log_sha = pf["log_sha256"]
        log = log_path.read_bytes()
        if sha(log) != log_sha:
            raise SystemExit("log-hash-drift:" + str(ordinal))
        ranking, diag = rank_case(root, baseline["ranked_files"],
                                  log.decode("utf-8", errors="replace"),
                                  query["query"], case["language"])
        if diag["source_tree_sha256"] != record["projected_tree_sha256"]:
            raise SystemExit("source-tree-drift:" + str(ordinal))
        output.append({"schema_version": "are.g01-bugswarm-graph-dev-rank-r2/v1",
                       "ordinal": ordinal, "id": case["image_tag"], "repo": case["repo"],
                       "language": case["language"], "base_commit": case["failure_commit"],
                       "query_sha256": query["query_sha256"], "log_sha256": log_sha,
                       "are_ranking_sha256": seal["ranking_sha256"],
                       "ranked_files": ranking, "candidate_count": len(ranking),
                       **diag, "gold_opened": False, "model_calls": 0})
        print(json.dumps({"ordinal": ordinal, "filename_seeds": diag["filename_seed_count"],
                          "symbol_seeds": diag["symbol_seed_count"],
                          "graph_neighbors": diag["graph_neighbor_count"],
                          "ranker_elapsed_ms": diag["ranker_elapsed_ms"]}), flush=True)
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in output)).encode()
    target = args.output_dir / "GRAPH-RANKINGS-R2.jsonl"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    seal = {"schema_version": "are.g01-bugswarm-graph-dev-rank-seal-r2/v1",
            "input_sha256": PINS, "script_sha256": sha(Path(__file__).read_bytes()),
            "rule": "last 64 KiB of original failure log; unique non-test filename cues, non-test class/def symbol anchors, direct/reverse exact import neighbors; max 10 filename seeds, 10 symbol seeds, 20 neighbors; baseline 1/rank plus fixed cue, symbol and graph boosts and test penalty; complete ranking",
            "cases": len(output), "rankings_sha256": sha(data),
            "total_ranker_elapsed_ms": sum(row["ranker_elapsed_ms"] for row in output),
            "gold_opened": False, "reserved_confirmation_opened": False, "model_calls": 0}
    encoded = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    target = args.output_dir / "GRAPH-RANKING-SEAL-R2.json"
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"cases": len(output), "rankings_sha256": sha(data),
                      "seal_sha256": sha(encoded),
                      "total_ranker_elapsed_ms": seal["total_ranker_elapsed_ms"]}), flush=True)


if __name__ == "__main__":
    main()
