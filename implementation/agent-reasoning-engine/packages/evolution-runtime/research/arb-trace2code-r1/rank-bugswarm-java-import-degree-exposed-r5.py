#!/usr/bin/env python3
"""Rank sealed Java import neighbors by source-only seed-edge degree."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-java-import-neighborhood-r4"
SOURCE_SHA = "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"
POOL_SHA = "119922f2e00ac099cf87c582f39f44a8f50886ab8839850003a7cd4a89a70234"
PACKETS_SHA = "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"
STEMS_SHA = "c594e02045ab104e656eb00b4d9c3bfc2a41bb0b81feb67169c288bf9d622dd2"
PACKAGE = re.compile(r"(?m)^\s*package\s+([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\s*;")
IMPORT = re.compile(r"(?m)^\s*import\s+(?:static\s+)?([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+)\s*;")
PARSE_BYTES = 262144


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def referenced(name: str, qualified: str) -> bool:
    return name == qualified or name.startswith(qualified + ".")


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    source_root = ARCHIVE / "source-only-r1" / "code-projection-r1"
    source_path = source_root / "SOURCE-PROJECTION-RECEIPT.json"
    pool_path = ROOT / "SOURCE-POOL.jsonl"
    packet_path = ARCHIVE / "exposed-cue-packets-r1" / "PACKETS.jsonl"
    stem_path = ARCHIVE / "exposed-java-class-stems-r3" / "SOURCE-CUES.jsonl"
    output = ROOT / "RANKED-DEGREE.jsonl"
    seal_path = ROOT / "DEGREE-RANK-SEAL.json"
    if (output.exists() or seal_path.exists() or digest(source_path) != SOURCE_SHA
            or digest(pool_path) != POOL_SHA or digest(packet_path) != PACKETS_SHA
            or digest(stem_path) != STEMS_SHA):
        raise SystemExit("input-pin-or-output-drift")
    sources = json.loads(source_path.read_bytes())["records"]
    pools = [json.loads(line) for line in pool_path.read_text().splitlines()]
    packets = [json.loads(line) for line in packet_path.read_text().splitlines()]
    stems = [json.loads(line) for line in stem_path.read_text().splitlines()]
    if not (len(sources) == len(pools) == len(packets) == len(stems) == 24):
        raise SystemExit("denominator-drift")
    rows = []
    for ordinal, (source, pool, packet, stem) in enumerate(zip(sources, pools, packets, stems), 1):
        if (not (source["ordinal"] == pool["ordinal"] == packet["ordinal"]
                 == stem["ordinal"] == ordinal)
                or not (source["image_tag"] == pool["id"] == packet["id"] == stem["id"])):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        if pool["language"] != "Java":
            rows.append({"ordinal": ordinal, "id": pool["id"], "language": "Python",
                         "ordered_paths": [], "edge_counts": {}, "gold_opened": False})
            continue
        code_root = (source_root / Path(source["root"]).name).resolve(strict=True)
        if code_root != Path(source["root"]).resolve(strict=True):
            raise SystemExit(f"source-root-drift:{ordinal}")
        seeds = {entry["path"] for entry in packet["candidates"]} | set(stem["cue_paths"])
        candidates = set(pool["pool_paths"])
        if not seeds or seeds & candidates:
            raise SystemExit(f"seed-pool-overlap:{ordinal}")
        names: dict[str, str] = {}
        imports: dict[str, set[str]] = {}
        for rel in sorted(seeds | candidates):
            posix = PurePosixPath(rel)
            if posix.is_absolute() or ".." in posix.parts or ".git" in posix.parts:
                raise SystemExit(f"unsafe-path:{ordinal}")
            target = code_root.joinpath(*posix.parts).resolve(strict=True)
            if not target.is_relative_to(code_root) or not target.is_file():
                raise SystemExit(f"source-path-drift:{ordinal}")
            text = target.read_bytes()[:PARSE_BYTES].decode("utf-8", errors="replace")
            package = PACKAGE.search(text)
            if package:
                names[rel] = package.group(1) + "." + posix.stem
            imports[rel] = {match.group(1) for match in IMPORT.finditer(text)}
        direct = set(pool["direct_paths"])
        reverse = set(pool["reverse_paths"])
        counts = {}
        for rel in candidates:
            qualified = names.get(rel)
            direct_count = (sum(any(referenced(name, qualified) for name in imports[seed])
                                for seed in seeds) if rel in direct and qualified else 0)
            reverse_count = (sum(any(referenced(name, names[seed]) for name in imports[rel])
                                 for seed in seeds if seed in names) if rel in reverse else 0)
            if (rel in direct and direct_count == 0) or (rel in reverse and reverse_count == 0):
                raise SystemExit(f"edge-count-drift:{ordinal}:{rel}")
            counts[rel] = [direct_count, reverse_count]
        are_rank = {path: index for index, path in enumerate(packet["are_ranked_files"], 1)}
        ordered = sorted(candidates, key=lambda path: (
            0 if path in direct else 1, -counts[path][0], -counts[path][1],
            are_rank[path], path))
        rows.append({"ordinal": ordinal, "id": pool["id"], "language": "Java",
                     "ordered_paths": ordered, "edge_counts": counts, "gold_opened": False})
    data = ("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-java-import-degree-rank-r5/v1",
            "posture": "source-only exposed ranking; not model packet or claim",
            "rule": "direct-edge paths first; then descending number of distinct seed importers, reverse seed references, original ARE rank, path; reverse-only next",
            "source_projection_sha256": SOURCE_SHA, "source_pool_sha256": POOL_SHA,
            "packets_sha256": PACKETS_SHA, "class_stems_sha256": STEMS_SHA,
            "cases": len(rows), "ranked_rows_sha256": hashlib.sha256(data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    exclusive(output, data)
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    exclusive(seal_path, seal_data)
    print(json.dumps({"cases": len(rows), "ranked_rows_sha256": seal["ranked_rows_sha256"],
                      "rank_seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
