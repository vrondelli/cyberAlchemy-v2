#!/usr/bin/env python3
"""Build r7 packets from sealed source-only Java evidence; no evaluator access."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


ARCHIVE = Path("/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004")
ROOT = ARCHIVE / "exposed-java-evidence-r7"
INPUTS = {
    "r6_packets": (ARCHIVE / "exposed-hybrid-r6/PACKETS.jsonl",
                   "5dd0f9f92348211dff92d401e3018f0f88cf5c278dc120d8692776cc24d99b9e"),
    "evidence": (ROOT / "SOURCE-EVIDENCE.jsonl",
                 "5c99d2fd52c04d714b10f347d5b5bfcfdc8b72dfdb34257d5fa13f4d1adcddc3"),
    "evidence_seal": (ROOT / "SOURCE-SEAL.json",
                      "b72d05cca6bfac47f434cfb00420b06c54dce53b345b98ac3c908642e6e691f7"),
}
BYTE_CAP = 18000
SUMMARY_CAP = 1000


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def exclusive(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(data)


def main() -> None:
    if (ROOT / "PACKETS.jsonl").exists() or (ROOT / "PACKET-SEAL.json").exists():
        raise SystemExit("output-exists")
    data = {}
    for name, (path, expected) in INPUTS.items():
        blob = path.read_bytes()
        if sha(blob) != expected:
            raise SystemExit(f"input-pin-drift:{name}")
        data[name] = json.loads(blob) if name == "evidence_seal" else [
            json.loads(line) for line in blob.splitlines()]
    if (len(data["r6_packets"]) != 24 or len(data["evidence"]) != 24
            or data["evidence_seal"]["cases"] != 24
            or data["evidence_seal"]["gold_opened"]
            or data["evidence_seal"]["model_calls"] != 0
            or data["evidence_seal"]["source_rows_sha256"] != INPUTS["evidence"][1]):
        raise SystemExit("source-seal-drift")
    packets = []
    stats = []
    for index, (old, evidence) in enumerate(zip(data["r6_packets"], data["evidence"])):
        ordinal = index + 1
        if (old["ordinal"] != evidence["ordinal"] or old["ordinal"] != ordinal
                or old["id"] != evidence["id"] or old["language"] != evidence["language"]
                or old["gold_opened"] or evidence["gold_opened"]):
            raise SystemExit(f"identity-drift:{ordinal}")
        if old["language"] != "Java":
            if evidence["candidates"] or evidence["failure_summary"]:
                raise SystemExit(f"python-evidence-drift:{ordinal}")
            packet = {**old, "java_evidence_r7": True}
            packets.append(packet)
            stats.append({"ordinal": ordinal, "prompt_bytes": len(packet["prompt"].encode()),
                          "candidate_count": packet["candidate_count"],
                          "summary_bytes": 0})
            continue
        if (len(evidence["candidates"]) != old["candidate_count"]
                or evidence["failure_markers"] <= 0
                or [row["path"] for row in evidence["candidates"]] != [
                    row["path"] for row in old["candidates"]]):
            raise SystemExit(f"java-evidence-drift:{ordinal}")
        split = old["prompt"].split("\nCandidates:\n", 1)
        if len(split) != 2 or not split[1].startswith("[1] "):
            raise SystemExit(f"prompt-header-drift:{ordinal}")
        summary = evidence["failure_summary"][:SUMMARY_CAP]
        header = split[0] + "\nFailure signals from full log:\n" + summary + "\nCandidates:\n"
        entries = []
        lines = []
        for number, (prior, item) in enumerate(zip(old["candidates"], evidence["candidates"]), 1):
            row = {**prior, "candidate_id": number, "excerpt": item["excerpt"],
                   "excerpt_start_line": item["excerpt_start_line"]}
            entries.append(row)
            lines.append(f"[{number}] {row['path']} | file-rank {row['are_rank']} | "
                         f"chunk-rank {row['chunk_rank']} | {row['excerpt']}")
        prompt = header + "\n".join(lines)
        if len(prompt.encode()) > BYTE_CAP:
            raise SystemExit(f"packet-byte-cap:{ordinal}")
        packet = {**old, "prompt": prompt, "candidates": entries,
                  "java_evidence_r7": True, "gold_opened": False}
        packets.append(packet)
        stats.append({"ordinal": ordinal, "prompt_bytes": len(prompt.encode()),
                      "candidate_count": packet["candidate_count"],
                      "summary_bytes": len(summary.encode())})
    blob = ("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in packets)).encode()
    seal = {"schema_version": "are.g01-bugswarm-java-evidence-packets-exposed-r7/v1",
            "posture": "source-only exposed development; tokenizer/model not run",
            "rule": "preserve r6 candidate IDs/order and Python packets; for Java append first 1000 characters of r7 failure summary to r6 header and replace candidate excerpts with r7 behavior evidence",
            "input_sha256": {name: expected for name, (_, expected) in INPUTS.items()},
            "cases": 24, "maximum_candidates": max(row["candidate_count"] for row in stats),
            "maximum_prompt_bytes": max(row["prompt_bytes"] for row in stats),
            "case_stats": stats, "packets_sha256": sha(blob),
            "gold_opened": False, "model_calls": 0}
    exclusive(ROOT / "PACKETS.jsonl", blob)
    seal_blob = (json.dumps(seal, sort_keys=True, indent=2) + "\n").encode()
    exclusive(ROOT / "PACKET-SEAL.json", seal_blob)
    print(json.dumps({"cases": 24, "maximum_candidates": seal["maximum_candidates"],
                      "maximum_prompt_bytes": seal["maximum_prompt_bytes"],
                      "packets_sha256": sha(blob), "packet_seal_sha256": sha(seal_blob)}))


if __name__ == "__main__":
    main()
