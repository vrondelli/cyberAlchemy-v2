#!/usr/bin/env python3
"""Build compact source-only r6 packets; evaluator data is never opened."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
OUTPUT = ARCHIVE / "exposed-hybrid-r6"
INPUTS = {
    "r2": (ARCHIVE / "exposed-cue-packets-r1/PACKETS.jsonl",
           "ebea9efb6d9ccc2b18588d39fc128e542487e6551e1a7203a74ee245862269e7"),
    "rank": (OUTPUT / "RANKED.jsonl",
             "a6d456a8d998df85164412a1b344ddf79f0716853cb93d22b46a8f54ee66c764"),
    "rank_seal": (OUTPUT / "RANK-SEAL.json",
                  "a9c1be13e45394b7c77453b56e013bbcfdef820bef4ec040f9539e96502c67a9"),
    "source": (ARCHIVE / "source-only-r1/code-projection-r1/SOURCE-PROJECTION-RECEIPT.json",
               "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"),
    "queries": (ARCHIVE / "source-only-r1/QUERIES.jsonl",
                "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3"),
}
STOP = {"the", "and", "for", "with", "from", "this", "that", "file", "error", "test"}
BYTE_CAP = 18000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def terms(value: str) -> set[str]:
    return {word for word in re.findall(r"[a-zA-Z_][a-zA-Z_0-9]{2,}", value.lower())
            if word not in STOP}


def excerpt(root: Path, relative: str, query_terms: set[str]) -> tuple[str, int]:
    posix = PurePosixPath(relative)
    if posix.is_absolute() or ".." in posix.parts or ".git" in posix.parts:
        raise SystemExit("unsafe-candidate-path")
    target = root.joinpath(*posix.parts).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise SystemExit("source-path-escape-or-missing")
    lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
    options = [(start, "\n".join(lines[start:start + 120]))
               for start in range(0, max(1, len(lines)), 120)]
    start, best = max(options, key=lambda option: (
        len(query_terms & terms(option[1])), -option[0]))
    return re.sub(r"\s+", " ", best).strip(), start + 1


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    for name in ("PACKETS.jsonl", "PACKET-SEAL.json"):
        if (OUTPUT / name).exists():
            raise SystemExit("output-exists")
    data = {}
    for name, (path, expected) in INPUTS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        data[name] = json.loads(blob) if name in {"rank_seal", "source"} else [
            json.loads(line) for line in blob.splitlines()]
    if (data["rank_seal"]["gold_opened"] or data["rank_seal"]["model_calls"]
            or any(len(data[name]) != 24 for name in ("r2", "rank", "queries"))
            or len(data["source"]["records"]) != 24):
        raise SystemExit("seal-or-denominator-drift")
    output_rows = []
    stats = []
    source_root = ARCHIVE / "source-only-r1/code-projection-r1"
    for index in range(24):
        old, ranked, query = (data[name][index] for name in ("r2", "rank", "queries"))
        source = data["source"]["records"][index]
        ordinal = index + 1
        if (not (old["ordinal"] == ranked["ordinal"] == source["ordinal"] == ordinal)
                or not (old["id"] == ranked["id"] == query["id"] == source["image_tag"])
                or old["gold_opened"] or ranked["gold_opened"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        if old["language"] != "Java":
            if ranked["ordered_paths"] != [row["path"] for row in old["candidates"]]:
                raise SystemExit(f"python-ranking-drift:{ordinal}")
            packet = {**old, "hybrid_r6": True}
            output_rows.append(packet)
            stats.append({"ordinal": ordinal, "candidate_count": packet["candidate_count"],
                          "prompt_bytes": len(packet["prompt"].encode()),
                          "excerpt_cap": None})
            continue
        root = (source_root / Path(source["root"]).name).resolve(strict=True)
        if root != Path(source["root"]).resolve(strict=True) or not root.is_relative_to(
                source_root.resolve(strict=True)):
            raise SystemExit(f"source-root-drift:{ordinal}")
        original = {entry["path"]: entry for entry in old["candidates"]}
        selected = ranked["ordered_paths"]
        if len(selected) > 30 or len(selected) != len(set(selected)):
            raise SystemExit(f"rank-shape-drift:{ordinal}")
        full = {}
        qterms = terms(query["query"])
        for path in selected:
            if path in original:
                row = original[path]
                full[path] = (row["excerpt"], row["excerpt_start_line"])
            else:
                full[path] = excerpt(root, path, qterms)
        split = old["prompt"].split("\nCandidates:\n", 1)
        if len(split) != 2 or not split[1].startswith("[1] "):
            raise SystemExit(f"prompt-header-drift:{ordinal}")
        header = split[0] + "\nCandidates:\n"
        for excerpt_cap in (260, 200, 140, 100):
            entries = []
            lines = []
            for number, path in enumerate(selected, 1):
                text, start = full[path]
                row = {"candidate_id": number, "path": path,
                       "are_rank": old["are_ranked_files"].index(path) + 1,
                       "chunk_rank": old["chunk_ranked_files"].index(path) + 1,
                       "excerpt": text[:excerpt_cap], "excerpt_start_line": start}
                entries.append(row)
                lines.append(f"[{number}] {path} | file-rank {row['are_rank']} | "
                             f"chunk-rank {row['chunk_rank']} | {row['excerpt']}")
            prompt = header + "\n".join(lines)
            if len(prompt.encode()) <= BYTE_CAP:
                break
        else:
            raise SystemExit(f"packet-byte-cap:{ordinal}")
        packet = {**old, "prompt": prompt, "candidates": entries,
                  "candidate_count": len(entries), "hybrid_r6": True,
                  "gold_opened": False}
        output_rows.append(packet)
        stats.append({"ordinal": ordinal, "candidate_count": len(entries),
                      "prompt_bytes": len(prompt.encode()), "excerpt_cap": excerpt_cap})
    blob = ("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in output_rows)).encode()
    seal = {"schema_version": "are.g01-bugswarm-hybrid-packets-exposed-r6/v1",
            "posture": "source-only exposed development; tokenizer and model not run",
            "rule": "Python r2 unchanged; Java r6 candidate ranking with query-overlap excerpts compressed to first passing 260/200/140/100-character cap",
            "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
            "cases": 24, "maximum_candidates": max(row["candidate_count"] for row in stats),
            "maximum_prompt_bytes": max(row["prompt_bytes"] for row in stats),
            "case_stats": stats, "packets_sha256": sha(blob),
            "gold_opened": False, "model_calls": 0}
    exclusive(OUTPUT / "PACKETS.jsonl", blob)
    seal_data = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    exclusive(OUTPUT / "PACKET-SEAL.json", seal_data)
    print(json.dumps({"cases": 24, "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"],
                      "packets_sha256": sha(blob), "packet_seal_sha256": sha(seal_data)}))


if __name__ == "__main__":
    main()
