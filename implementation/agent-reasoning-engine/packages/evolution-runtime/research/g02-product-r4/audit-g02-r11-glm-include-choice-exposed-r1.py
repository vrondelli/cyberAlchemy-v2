#!/usr/bin/env python3
"""Evaluator-only file-hit audit of sealed GLM choices on exposed r11 C++ tasks."""

import argparse
import hashlib
import json
import os
import sys
from collections import Counter
from pathlib import Path


RESPONSE_SEAL_SHA256 = "6de9a6533417dc95231fb7e2539dd951bb55f6963deda9bbe224ce0ddece9f10"
PARQUET_SHA256 = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
UPSTREAM = Path("/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream")


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    root = args.root
    if sha(root / "SEALED-RESPONSES.json") != RESPONSE_SEAL_SHA256 or \
            sha(UPSTREAM / "data/full.parquet") != PARQUET_SHA256:
        raise SystemExit("sealed model/gold input drift")
    sealed = json.loads((root / "SEALED-RESPONSES.json").read_text())
    packets = json.loads((root / "PACKETS.json").read_text())
    if (sealed.get("posture") != "exposed-development-model-output-sealed-before-gold" or
            sealed.get("packet_seal_sha256") != sha(root / "PACKETS.json") or
            [row["ordinal"] for row in sealed["rows"]] != [4, 8, 12] or
            [packet["ordinal"] for packet in packets["ordered_packets"]] != [4, 8, 12]):
        raise SystemExit("sealed response binding drift")
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / "data/full.parquet"))
    rows = []
    totals = Counter()
    for record, packet in zip(sealed["rows"], packets["ordered_packets"]):
        ordinal = record["ordinal"]
        response_path = root / f"RESPONSE-{ordinal}.json"
        response = json.loads(response_path.read_text())
        if (sha(response_path) != record["response_sha256"] or
                response.get("paths") != record["selected_paths"] or
                response.get("status") != "valid" or response.get("ordinal") != ordinal):
            raise SystemExit("sealed response drift")
        eligible = {candidate["path"] for candidate in packet["candidates"]}
        chosen = set(record["selected_paths"])
        if len(chosen) != len(record["selected_paths"]) or len(chosen) > 3 or not chosen <= eligible:
            raise SystemExit("choice outside source pool")
        gold = set(loader.get(packet["instance_id"]).files())
        delivered = set(packet["already_read_paths"])
        row = {"ordinal": ordinal, "undelivered_gold": len(gold - delivered),
               "proposed_slots": len(chosen), "new_gold_hits": len(chosen & (gold - delivered)),
               "false_positive_files": len(chosen - gold),
               "known_tokens": record["known_tokens"], "elapsed_ms": record["elapsed_ms"]}
        rows.append(row)
        for key, value in row.items():
            if key != "ordinal":
                totals[key] += value
    if totals["known_tokens"] != sealed["known_tokens_total"]:
        raise SystemExit("usage total drift")
    output = {"schema_version": "g02.r11-glm-include-choice-exposed-audit/v1",
              "posture": "evaluator-only-exposed-development-no-native-score",
              "response_seal_sha256": RESPONSE_SEAL_SHA256,
              "native_gold_parquet_sha256": PARQUET_SHA256,
              "rows": rows, "totals": dict(sorted(totals.items())),
              "claim_ceiling": "Model-chosen file-hit and cost diagnostic only; no actual ARE read, native F1, independent cohort, or superiority."}
    data = (json.dumps(output, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(root / "EVAL-AUDIT.json", os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as destination:
        destination.write(data)
    print(json.dumps({"totals": output["totals"], "receipt_sha256": hashlib.sha256(data).hexdigest()}))


if __name__ == "__main__":
    main()
