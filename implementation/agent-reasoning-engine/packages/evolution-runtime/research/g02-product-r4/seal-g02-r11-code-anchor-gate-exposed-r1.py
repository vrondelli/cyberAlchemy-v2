#!/usr/bin/env python3
"""Source-only abstention projection over sealed exposed r11 C++ choices."""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path


PACKETS_SHA = "8865de1df1268d3db7ffe65afbead0174a1e6d1ec4c386228b7bbe7e33752255"
CHOICES_SHA = "5ebfe8c89292b071566b099e7af442e3df83022633ba947d36f4f06823439bf0"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def code_anchor(issue):
    quoted = re.findall(r"`([^`\n]{1,120})`", issue)
    anchors = []
    for token in quoted:
        if ("::" in token or re.search(r"\b[A-Z][A-Z0-9_]{3,}\b", token) or
                re.search(r"#\s*define\s+[A-Za-z_]", token)):
            anchors.append(token)
    return anchors


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("packets", type=Path)
    ap.add_argument("sealed_choices", type=Path)
    ap.add_argument("output", type=Path)
    args = ap.parse_args()
    if sha(args.packets.read_bytes()) != PACKETS_SHA or sha(args.sealed_choices.read_bytes()) != CHOICES_SHA:
        raise SystemExit("source input drift")
    packets = json.loads(args.packets.read_text())["ordered_packets"]
    choices = json.loads(args.sealed_choices.read_text())
    if ([row["ordinal"] for row in packets] != [4, 8, 12] or
            [row["ordinal"] for row in choices["rows"]] != [4, 8, 12] or
            choices["posture"] != "exposed-development-model-output-sealed-before-gold"):
        raise SystemExit("source shape drift")
    rows = []
    for packet, choice in zip(packets, choices["rows"]):
        anchors = code_anchor(packet["issue"])
        admitted = bool(anchors)
        paths = choice["selected_paths"] if admitted else []
        eligible = {item["path"] for item in packet["candidates"]}
        if len(paths) > 3 or len(set(paths)) != len(paths) or not set(paths) <= eligible:
            raise SystemExit("choice bound drift")
        rows.append({"ordinal": packet["ordinal"],
                     "issue_sha256": sha(packet["issue"].encode()),
                     "anchor_count": len(anchors),
                     "admitted": admitted,
                     "selected_paths": paths,
                     "suppressed_slots": len(choice["selected_paths"]) - len(paths)})
    result = {"schema_version": "g02.r11-code-anchor-gate-exposed-seal/v1",
              "posture": "source-and-sealed-choice-only-exposed-development-no-gold-dsh-or-score",
              "packets_sha256": PACKETS_SHA, "choices_sha256": CHOICES_SHA,
              "script_sha256": sha(Path(__file__).read_bytes()),
              "rule": "admit at most three previously sealed source-only chooser paths only if the issue has a backticked token containing C++ ::, uppercase snake-case identifier, or #define symbol; otherwise abstain",
              "rows": rows,
              "claim_ceiling": "Post-hoc exposed source-only gate; no actual ARE read, native score, independent quality, or superiority."}
    data = (json.dumps(result, sort_keys=True, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "wb") as target:
        target.write(data)
    print(json.dumps({"admitted": sum(row["admitted"] for row in rows),
                      "proposed_slots": sum(len(row["selected_paths"]) for row in rows),
                      "suppressed_slots": sum(row["suppressed_slots"] for row in rows),
                      "seal_sha256": sha(data)}))


if __name__ == "__main__":
    main()
