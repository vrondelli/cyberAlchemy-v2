#!/usr/bin/env python3
"""Build compact source-only chooser packets from sealed multi-view ranks."""

import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path("/home/vlad_/are-benchmark-archive")
HERE = Path(__file__).parent
RANKS = ROOT / "g02-r11-multiview-file-card-exposed-r1-20261004/SOURCE-SEAL.json"
RANKS_SHA = "2f01525c5e58f35755a3943462d9d90fcac23c1386587ea02aae4620592cd8fb"
PACKETS = ROOT / "g02-r11-search-packets-exposed-r1-20261004/PACKETS.json"
PACKETS_SHA = "2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b"
RANKER = HERE / "seal-g02-r11-multiview-file-card-exposed-r1.py"
RANKER_SHA = "9a94cfff4b2d67ec40777d9f785e44de995357efca63ca7749a69269ab230bfc"
OUTPUT = ROOT / "g02-r11-multiview-choice-packets-exposed-r2-20261004/PACKETS.json"
ISSUE_LIMIT = 5000
PACKET_LIMIT = 32768
CANDIDATES = 24


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def compact_windows(body, query_terms):
    lines = body.splitlines()
    candidates = []
    pattern = re.compile(
        r"\b(?:def|class|function|struct|interface|trait|enum|func|fn|module|macro|import|from|include)\b"
        r"|^\s*(?:#{1,6}\s+|[A-Za-z_][A-Za-z0-9_.-]{2,}\s*[:=])"
    )
    for index, line in enumerate(lines):
        if not line.strip() or len(line) > 600:
            continue
        overlap = len(set(ranker.terms(line)) & query_terms)
        structural = bool(pattern.search(line))
        if overlap or structural:
            candidates.append((-(5 * overlap + int(structural)), index))
    picked = []
    for _, index in sorted(candidates):
        if any(abs(index - previous) <= 2 for previous in picked):
            continue
        picked.append(index)
        if len(picked) == 1:
            break
    if not picked:
        picked = next(([index] for index, line in enumerate(lines) if line.strip()), [])
    return [{"line": index + 1,
             "text": "\n".join(lines[max(0, index - 1):min(len(lines), index + 2)])[:280]}
            for index in picked]


def main():
    pins = {RANKS: RANKS_SHA, PACKETS: PACKETS_SHA, RANKER: RANKER_SHA}
    if OUTPUT.exists() or any(sha(path) != expected for path, expected in pins.items()):
        raise SystemExit("output-exists-or-input-drift")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("frozen_multiview_ranker", RANKER)
    if spec is None or spec.loader is None:
        raise SystemExit("ranker-import")
    global ranker
    ranker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranker)

    rankings = json.loads(RANKS.read_text())
    source_packets = {row["ordinal"]: row for row in json.loads(PACKETS.read_text())["ordered_packets"]}
    ordered = []
    for row in rankings["rows"]:
        ordinal = row["ordinal"]
        source = source_packets[ordinal]
        base = (ROOT / "g02-product-replication-r11-20261002/pairs" /
                f"{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base")
        commit = subprocess.check_output(
            ["git", "-c", f"safe.directory={base}", "-C", str(base), "rev-parse", "HEAD"],
            text=True,
        ).strip()
        issue_digest = hashlib.sha256(source["issue"].encode()).hexdigest()
        if (source["instance_id"] != row["instance_id"] or source["base_commit"] != row["base_commit"]
                or commit != row["base_commit"] or issue_digest != row["issue_sha256"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        issue = source["issue"][:ISSUE_LIMIT]
        query_terms = set(ranker.terms(issue))
        choices = []
        for candidate_id, item in enumerate(row["ranked"][:CANDIDATES], start=1):
            relative = Path(item["path"])
            if relative.is_absolute() or ".." in relative.parts:
                raise SystemExit(f"unsafe-path:{ordinal}:{relative}")
            path = base / relative
            if path.is_symlink() or not path.is_file() or path.stat().st_size > ranker.MAX_FILE_BYTES:
                raise SystemExit(f"source-drift:{ordinal}:{relative}")
            body = path.read_bytes().decode("utf-8")
            structural = ranker.structural_terms(item["path"], body)
            key_terms = []
            for token, _ in __import__("collections").Counter(structural).most_common(12):
                if token not in key_terms:
                    key_terms.append(token)
            choices.append({
                "id": candidate_id,
                "path": item["path"],
                "roles": ranker.artifact_roles(item["path"]),
                "retrieval_views": item["channels"],
                "key_terms": key_terms,
                "evidence_windows": compact_windows(body, query_terms),
            })
        packet = {
            "ordinal": ordinal,
            "instance_id": row["instance_id"],
            "repo": row["repo"],
            "issue": issue,
            "already_read_count": len(row["delivered_paths"]),
            "selection_instruction": "Choose only files strongly evidenced as needing modification; related-but-unchanged files are false positives. Most tasks need zero or one additional file.",
            "maximum_new_reads": 3,
            "candidates": choices,
        }
        size = len(json.dumps(packet, separators=(",", ":")).encode())
        if len(choices) != CANDIDATES or size > PACKET_LIMIT:
            raise SystemExit(f"packet-cap:{ordinal}:{size}")
        ordered.append(packet)

    output = {
        "schema_version": "g02.r11-multiview-choice-packets-exposed-r2/v1",
        "posture": "source-only-exposed-development-no-gold-dsh-or-score",
        "input_sha256": {str(path): expected for path, expected in pins.items()},
        "script_sha256": sha(Path(__file__)),
        "policy": "Fused top 24; path, roles, retrieval views, 12 structural key terms, and one <=280-character issue/structure window per file; issue <=5000 characters; chooser returns 0..3 integer IDs.",
        "ordered_packets": ordered,
        "claim_ceiling": "Exposed read-choice development only; no actual ARE reads, native F1, independent transfer, or superiority.",
    }
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)
    print(json.dumps({"packets": len(ordered), "candidates": sum(len(row["candidates"]) for row in ordered),
                      "maximum_packet_bytes": max(len(json.dumps(row, separators=(",", ":")).encode()) for row in ordered),
                      "sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
