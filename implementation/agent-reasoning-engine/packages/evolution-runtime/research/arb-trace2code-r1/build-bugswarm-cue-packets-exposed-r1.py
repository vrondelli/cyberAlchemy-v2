#!/usr/bin/env python3
"""Build exposed BugSwarm r1 packets with sealed source-only full-log cues.

No evaluator artifact or gold path is opened. This is an exposed development
packet, not an amendment to the frozen r1 campaign or a fresh prediction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
from time import perf_counter


SOURCE_SHA = "29ace43945778671bfa2ec77bdda5f4bd57de8be385c354a822d6406b3535818"
QUERIES_SHA = "4dafeef345483b050df368efc6f3ec636b0b1bca5681950c08ab5da5846ce8e3"
ORIGINAL_PACKETS_SHA = "ee0d6ff047426241b6533e5938f7da97219a6f64336b13e354b739c68e6baa76"
ORIGINAL_SEAL_SHA = "be138a42969914a63a719b7ac50f5aa86f59c5a6ae5b9f6a4bd990ad23409bc4"
CUES_SHA = "6b2a645fd525fe96b07acde1baa4b52a588a9af84e0718dcc8eeb8a230b93734"
CUE_SEAL_SHA = "ee0fb3eec38a0278a14c985b9beb6f2bbe4b94e0c4e2fd2dc2d6e1f8d3175447"
STOP = {"the", "and", "for", "with", "from", "this", "that", "file", "error", "test"}
PROMPT_BYTE_CAP = 18000


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def terms(value: str) -> set[str]:
    return {token for token in re.findall(r"[a-zA-Z_][a-zA-Z_0-9]{2,}", value.lower())
            if token not in STOP}


def excerpt(root: Path, relative: str, qterms: set[str]) -> tuple[str, int]:
    path = PurePosixPath(relative)
    if path.is_absolute() or ".." in path.parts or ".git" in path.parts:
        raise ValueError("unsafe-candidate-path")
    target = root.joinpath(*path.parts).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise ValueError("candidate-source-escape-or-missing")
    lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
    options = [(start, "\n".join(lines[start:start + 120]))
               for start in range(0, max(1, len(lines)), 120)]
    start, best = max(options, key=lambda option: (len(qterms & terms(option[1])), -option[0]))
    return re.sub(r"\s+", " ", best).strip()[:420], start + 1


def write_exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    archive = args.archive_root.resolve(strict=True)
    output = args.output_dir
    source_root = archive / "source-only-r1" / "code-projection-r1"
    source_receipt = source_root / "SOURCE-PROJECTION-RECEIPT.json"
    queries_path = archive / "source-only-r1" / "QUERIES.jsonl"
    originals_path = archive / "vps-run-r1" / "packets-r1" / "PACKETS.jsonl"
    original_seal = archive / "vps-run-r1" / "packets-r1" / "PACKET-SEAL.json"
    cues_path = archive / "exposed-full-log-cues-r1" / "SOURCE-CUES.jsonl"
    cue_seal = archive / "exposed-full-log-cues-r1" / "SOURCE-SEAL.json"
    pins = ((source_receipt, SOURCE_SHA), (queries_path, QUERIES_SHA),
            (originals_path, ORIGINAL_PACKETS_SHA), (original_seal, ORIGINAL_SEAL_SHA),
            (cues_path, CUES_SHA), (cue_seal, CUE_SEAL_SHA))
    if any(sha(path) != expected for path, expected in pins):
        raise SystemExit("source-input-pin-drift")
    if not output.is_dir() or any(output.iterdir()):
        raise SystemExit("output-dir-missing-or-not-empty")
    sources = json.loads(source_receipt.read_bytes())["records"]
    queries = [json.loads(line) for line in queries_path.read_text().splitlines()]
    originals = [json.loads(line) for line in originals_path.read_text().splitlines()]
    cues = [json.loads(line) for line in cues_path.read_text().splitlines()]
    if not (len(sources) == len(queries) == len(originals) == len(cues) == 24):
        raise SystemExit("denominator-drift")
    packets = []
    case_stats = []
    for ordinal, (source, query, old, cue) in enumerate(zip(sources, queries, originals, cues), 1):
        if (not (source["ordinal"] == old["ordinal"] == cue["ordinal"] == ordinal)
                or not (source["image_tag"] == query["id"] == old["id"] == cue["id"])
                or not (source["commit"] == query["base_commit"] == old["base_commit"] == cue["base_commit"])
                or source["repo"] != cue["repo"] or old["query_sha256"] != query["query_sha256"]
                or old["candidate_count"] != len(old["candidates"]) or cue["cue_count"] != len(cue["cue_paths"])
                or len(set(cue["cue_paths"])) != len(cue["cue_paths"])
                or len(cue["cue_paths"]) > 10 or cue["gold_opened"]):
            raise SystemExit(f"case-identity-drift:{ordinal}")
        original_paths = [entry["path"] for entry in old["candidates"]]
        if (len(set(original_paths)) != len(original_paths)
                or any(entry["candidate_id"] != index for index, entry in enumerate(old["candidates"], 1))
                or not set(cue["cue_paths"]).issubset(old["are_ranked_files"])):
            raise SystemExit(f"candidate-identity-drift:{ordinal}")
        root = (source_root / Path(source["root"]).name).resolve(strict=True)
        if not root.is_relative_to(source_root.resolve(strict=True)):
            raise SystemExit(f"source-root-escape:{ordinal}")
        qterms = terms(query["query"])
        entries = list(old["candidates"])
        prompt = old["prompt"]
        new_paths = [path for path in cue["cue_paths"] if path not in original_paths]
        began = perf_counter()
        for path in new_paths:
            text, start = excerpt(root, path, qterms)
            entry = {"candidate_id": len(entries) + 1, "path": path,
                     "are_rank": old["are_ranked_files"].index(path) + 1,
                     "chunk_rank": old["chunk_ranked_files"].index(path) + 1,
                     "excerpt": text, "excerpt_start_line": start}
            line = (f"\n[{entry['candidate_id']}] {path} | file-rank {entry['are_rank']} | "
                    f"chunk-rank {entry['chunk_rank']} | {text}")
            if len((prompt + line).encode()) > PROMPT_BYTE_CAP:
                raise SystemExit(f"expanded-packet-byte-cap:{ordinal}")
            prompt += line
            entries.append(entry)
        elapsed_ms = round((perf_counter() - began) * 1000, 3)
        if len(entries) > 30 or len(set(entry["path"] for entry in entries)) != len(entries):
            raise SystemExit(f"expanded-candidate-cap:{ordinal}")
        packets.append({**old, "prompt": prompt, "candidates": entries,
                        "candidate_count": len(entries), "exposed_development": True,
                        "source_cue_sha256": CUES_SHA, "gold_opened": False})
        case_stats.append({"ordinal": ordinal, "original_candidates": len(original_paths),
                           "new_cues": len(new_paths), "expanded_candidates": len(entries),
                           "prompt_bytes": len(prompt.encode()), "source_excerpt_ms": elapsed_ms})
    packet_data = ("".join(json.dumps(packet, ensure_ascii=False) + "\n" for packet in packets)).encode()
    seal = {"schema_version": "are.g01-bugswarm-expanded-cue-packets-exposed-r1/v1",
            "posture": "exposed source-only development; not frozen-r1 amendment or independent claim",
            "rule": "preserve original packet and append up to ten sealed full-log cue paths in fixed cue order",
            "source_projection_sha256": SOURCE_SHA, "queries_sha256": QUERIES_SHA,
            "original_packets_sha256": ORIGINAL_PACKETS_SHA, "original_seal_sha256": ORIGINAL_SEAL_SHA,
            "source_cues_sha256": CUES_SHA, "source_cue_seal_sha256": CUE_SEAL_SHA,
            "cases": len(packets), "maximum_candidates": max(row["candidate_count"] for row in packets),
            "maximum_prompt_bytes": max(row["prompt_bytes"] for row in case_stats),
            "case_stats": case_stats, "packets_sha256": hashlib.sha256(packet_data).hexdigest(),
            "gold_opened": False, "model_calls": 0}
    seal_data = (json.dumps(seal, indent=2, sort_keys=True) + "\n").encode()
    write_exclusive(output / "PACKETS.jsonl", packet_data)
    write_exclusive(output / "PACKET-SEAL.json", seal_data)
    print(json.dumps({"cases": len(packets), "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"],
                      "packets_sha256": seal["packets_sha256"],
                      "seal_sha256": hashlib.sha256(seal_data).hexdigest()}))


if __name__ == "__main__":
    main()
