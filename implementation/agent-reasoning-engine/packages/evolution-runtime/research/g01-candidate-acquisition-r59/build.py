#!/usr/bin/env python3
"""Seal bounded r59 candidate sets without reading evaluator labels."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re

PINS = {
    "windows": "6c54a8073a75de14897d2f128e6e328316f633dcd44d9d1a9525d52374431085",
    "projection_r1": "d5e909aa9d2250e437bc5f9ad8b6c0845204ad9bbe86c1e465b2dccbe8fc350e",
    "projection_r2b": "cdee5d69535ff44ac1aca8d8f3fcea4b59f9b7519db504eeb328781738281ea2",
    "are_r1": "12e306508cf810dcd6b066fe5316c3a17590c3866d0971dfe574af96945935a2",
    "are_r2b": "2782baa52bf05d6c91f61a76b743f526727aaf1f223f0107771914b290add39d",
    "chunk_r1": "1d59bbe5f59aca53b1a2a7e4ee676d5d45af6c20c174ec2418ce0b6abf7a110c",
    "chunk_r2b": "bfd243faebe96258ff730bc8eb0d2796f25750d33f91c32e1a59e3ed34c5427f",
}
TOKEN = re.compile(r"[A-Za-z_][A-Za-z0-9_]{1,}")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def save_exclusive(path, value):
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write("\n")


def union(first, second, depth, cap):
    output = []
    for path in first[:depth] + second[:depth]:
        if path not in output:
            output.append(path)
    return output[:cap]


def candidate_directory(seed):
    parent = PurePosixPath(seed).parent
    return None if str(parent) == "." else parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", type=Path, required=True)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    files = {"windows": args.archive / "bounded-swerank-r56/source-run-r2/WINDOWS.json"}
    for cohort in ("r1", "r2b"):
        files[f"projection_{cohort}"] = args.archive / f"source-projection-{cohort}/SOURCE-PROJECTION-RECEIPT.json"
        files[f"are_{cohort}"] = args.archive / f"are-rankings-{cohort}/ARE-RANKINGS.jsonl"
        files[f"chunk_{cohort}"] = args.archive / f"chunk-bm25-rankings-{cohort}/CHUNK-BM25-RANKINGS.jsonl"
    for name, path in files.items():
        if sha(path) != PINS[name]:
            raise SystemExit(f"input drift: {name}")
    if args.output.exists():
        raise SystemExit("output exists")
    windows = {(row["cohort"], row["id"]): row for row in json.loads(files["windows"].read_text())}
    if len(windows) != 48:
        raise SystemExit("window denominator drift")
    output = []
    for cohort in ("r1", "r2b"):
        projections = {row["case"]: row for row in json.loads(files[f"projection_{cohort}"].read_text())["records"]}
        are = {row["id"]: row["ranked_files"] for row in rows(files[f"are_{cohort}"])}
        chunk = {row["id"]: row["ranked_files"] for row in rows(files[f"chunk_{cohort}"])}
        for key in sorted(k for k in windows if k[0] == cohort):
            case_id = key[1]
            raw = windows[key]
            root = Path(projections[case_id]["root"]).resolve(strict=True)
            a = union(are[case_id], chunk[case_id], 10, 20)
            b = union(are[case_id], chunk[case_id], 15, 30)
            if a != raw["candidates"] or not set(a).issubset(b):
                raise SystemExit("baseline candidate mismatch")
            universe = set(are[case_id]) | set(chunk[case_id])
            query_tokens = {token.casefold() for token in TOKEN.findall(raw["query"])}
            c = list(a)
            for seed in a:
                parent = candidate_directory(seed)
                if parent is None:
                    continue
                siblings = [path for path in universe if path.endswith(".py")
                            and PurePosixPath(path).parent == parent and path not in c]
                siblings.sort(key=lambda path: (-len(query_tokens & {token.casefold() for token in TOKEN.findall(path)}), path))
                for path in siblings:
                    if len(c) == 30:
                        break
                    c.append(path)
                if len(c) == 30:
                    break
            for path in set(a + b + c):
                rel = PurePosixPath(path)
                if rel.is_absolute() or ".." in rel.parts:
                    raise SystemExit("unsafe candidate")
                source = root.joinpath(*rel.parts).resolve(strict=True)
                if not source.is_relative_to(root) or not source.is_file():
                    raise SystemExit("candidate outside source root")
            output.append({"schema_version": "are.g01-r59-candidates/v1", "cohort": cohort,
                           "id": case_id, "repo": raw["repo"], "query_sha256": raw["query_sha256"],
                           "a": a, "b": b, "c": c, "source_root": str(root)})
    if len(output) != 48:
        raise SystemExit("output denominator drift")
    args.output.mkdir(parents=True)
    save_exclusive(args.output / "RUN-FREEZE.json", {"schema_version": "are.g01-r59-freeze/v1",
        "cases": 48, "input_sha256": PINS, "script_sha256": sha(Path(__file__)),
        "protocol_sha256": sha(Path(__file__).with_name("PROTOCOL.md")), "gold_opened": False})
    ranking_file = args.output / "CANDIDATES.jsonl"
    ranking_file.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output))
    save_exclusive(args.output / "SOURCE-SEAL.json", {"schema_version": "are.g01-r59-source-seal/v1",
        "status": "complete", "cases": 48, "candidate_sha256": sha(ranking_file),
        "freeze_sha256": sha(args.output / "RUN-FREEZE.json"), "gold_opened": False})
    print((args.output / "SOURCE-SEAL.json").read_text())


if __name__ == "__main__":
    main()
