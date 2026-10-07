#!/usr/bin/env python3
"""Source-only direct/reverse Java import pool around exposed BugSwarm seeds.

This unranked pool is a candidate-generation diagnostic. It does not read gold,
send a model request, or authorize adding the whole pool to a model packet.
"""

from __future__ import annotations

from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-java-import-neighborhood-r4"
SOURCE_SHA = "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"
STEMS_SHA = "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"
PACKAGE = re.compile(r"(?m)^\s*package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*;")
IMPORT = re.compile(r"(?m)^\s*import\s+(?:static\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+)\s*;")
MAX_PARSED_BYTES = 262144
MAX_POOL = 5000


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def resolve_import(name: str, qualified: dict[str, list[str]]) -> str | None:
    parts = name.split(".")
    while len(parts) >= 2:
        found = qualified.get(".".join(parts), [])
        if len(found) == 1:
            return found[0]
        parts.pop()
    return None


def main() -> None:
    source_root = ARCHIVE / "source-only-r1" / "code-projection-r1"
    source_path = source_root / "SOURCE-PROJECTION-RECEIPT.json"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    stems_path = ARCHIVE / "exposed-java-class-stems-r3" / "SOURCE-CUES.jsonl"
    if (OUTPUT.exists() or digest(source_path) != SOURCE_SHA
            or digest(packet_path) != PACKETS_SHA or digest(stems_path) != STEMS_SHA):
        raise SystemExit("input-pin-drift-or-output-exists")
    records = json.loads(source_path.read_bytes())["records"]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    stems = [json.loads(line) for line in stems_path.read_text().splitlines()]
    if not (len(records) == len(packets) == len(stems) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (record, packet, stem) in enumerate(zip(records, packets, stems), 1):
        if (not (record["ordinal"] == packet["ordinal"] == stem["ordinal"] == ordinal)
                or not (record["image_tag"] == packet["id"] == stem["id"])
                or record["commit"] != packet["base_commit"]
                or packet["language"] != stem["language"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        if stem["language"] != "Java":
            rows.append({"ordinal": ordinal, "id": packet["id"], "language": "Python",
                         "seed_count": 0, "direct_paths": [], "reverse_paths": [],
                         "pool_paths": [], "gold_opened": False})
            continue
        root = (source_root / Path(record["root"]).name).resolve(strict=True)
        if (root != Path(record["root"]).resolve(strict=True)
                or not root.is_relative_to(source_root.resolve(strict=True))):
            raise SystemExit(f"source-root-drift:{ordinal}")
        paths = sorted(packet["are_ranked_files"])
        if (len(paths) != record["projected_files"] or len(paths) != len(set(paths))):
            raise SystemExit(f"source-count-drift:{ordinal}")
        tree = hashlib.sha256()
        qualified: dict[str, list[str]] = defaultdict(list)
        imports: dict[str, list[str]] = {}
        for rel in paths:
            posix = PurePosixPath(rel)
            if posix.is_absolute() or ".." in posix.parts or ".git" in posix.parts:
                raise SystemExit(f"unsafe-path:{ordinal}")
            target = root.joinpath(*posix.parts).resolve(strict=True)
            if not target.is_relative_to(root) or not target.is_file():
                raise SystemExit(f"source-path-drift:{ordinal}")
            content = target.read_bytes()
            tree.update((rel + "\0").encode())
            tree.update(hashlib.sha256(content).digest())
            text = content[:MAX_PARSED_BYTES].decode("utf-8", errors="replace")
            package = PACKAGE.search(text)
            if package:
                qualified[package.group(1) + "." + posix.stem].append(rel)
            imports[rel] = [match.group(1) for match in IMPORT.finditer(text)]
        if tree.hexdigest() != record["projected_tree_sha256"]:
            raise SystemExit(f"source-tree-hash-drift:{ordinal}")
        seeds = {entry["path"] for entry in packet["candidates"]} | set(stem["cue_paths"])
        if not seeds or not seeds.issubset(paths):
            raise SystemExit(f"seed-path-drift:{ordinal}")
        direct = set()
        reverse = set()
        for rel, names in imports.items():
            targets = {resolved for name in names if (resolved := resolve_import(name, qualified))}
            if rel in seeds:
                direct.update(targets - seeds)
            elif targets & seeds:
                reverse.add(rel)
        pool = sorted((direct | reverse) - seeds)
        if len(pool) > MAX_POOL:
            raise SystemExit(f"pool-cap:{ordinal}")
        rows.append({"ordinal": ordinal, "id": packet["id"], "language": "Java",
                     "seed_count": len(seeds), "direct_paths": sorted(direct - seeds),
                     "reverse_paths": sorted(reverse - seeds), "pool_paths": pool,
                     "gold_opened": False})
        print(json.dumps({"ordinal": ordinal, "seeds": len(seeds),
                          "direct": len(direct), "reverse": len(reverse),
                          "pool": len(pool)}), flush=True)
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-java-import-neighborhood-source-r4/v1",
            "posture": "unranked source-only pool on exposed cases; not a model packet or fresh claim",
            "rule": "exact unique package+file-stem resolution of direct and reverse Java imports around r2 packet plus r3 class-stem seeds; parse first 256KiB/file; no wildcard imports",
            "source_projection_sha256": SOURCE_SHA, "packets_sha256": PACKETS_SHA,
            "class_stems_sha256": STEMS_SHA, "cases": len(rows),
            "maximum_pool": max(len(row["pool_paths"]) for row in rows),
            "source_rows_sha256": hashlib.sha256(data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    OUTPUT.mkdir(mode=0o700)
    exclusive(OUTPUT / "SOURCE-POOL.jsonl", data)
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(OUTPUT / "SOURCE-SEAL.json", seal_data)
    print(json.dumps({"cases": len(rows), "maximum_pool": seal["maximum_pool"],
                      "source_rows_sha256": seal["source_rows_sha256"],
                      "source_seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
