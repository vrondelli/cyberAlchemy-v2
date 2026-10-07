#!/usr/bin/env python3
"""Seal one source-only G02 delivered-file choice per exposed pair, if supported.

No gold, DSH, native score, or model output beyond the pre-existing packet enters
this selector. The output is development evidence, never a frozen benchmark arm.
"""

import hashlib
import json
import re
import sys
from collections import defaultdict
from pathlib import Path


BASE = Path("/opt/are/evolution-runtime")
PACKETS = BASE / "g02-r4-reviewer-packets-r1"
OUTPUT = BASE / "g02-r4-delivered-quoted-anchors-r1"
EXPECTED_PACKET_SEAL_SHA = "11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d"
WORD = re.compile(r"[A-Za-z_][A-Za-z0-9_./:-]{4,}")
INLINE = re.compile(r"`([^`\n]{5,80})`")
GENERIC = {"Python", "JavaScript", "TypeScript", "README", "Docker", "GitHub"}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def identifiers(issue):
    return {word for quoted in INLINE.findall(issue) for word in WORD.findall(quoted)
            if word not in GENERIC}


def contains(text, value):
    return re.search(r"(?<![A-Za-z0-9_])" + re.escape(value) + r"(?![A-Za-z0-9_])", text) is not None


def choose(packet):
    names = identifiers(packet["issue"])
    selected = set(packet["current_selected_files"])
    by_path = defaultdict(lambda: {"identifiers": set(), "indexes": set()})
    for handle in packet["delivered_reads"]:
        path = handle["path"]
        if path in selected:
            continue
        matched = {name for name in names if contains(handle["snippet"], name)}
        if matched:
            by_path[path]["identifiers"].update(matched)
            by_path[path]["indexes"].add(handle["index"])
    options = [(path, data) for path, data in by_path.items() if len(data["identifiers"]) >= 2]
    if not options:
        return None
    path, data = min(options, key=lambda item: (-len(item[1]["identifiers"]),
                                                min(item[1]["indexes"]), item[0]))
    return {"path": path, "matched_identifiers": sorted(data["identifiers"]),
            "delivered_read_indexes": sorted(data["indexes"])}


def main():
    if sys.argv[1:] != ["seal"]:
        raise SystemExit("usage: seal-delivered-quoted-anchors-r1.py seal")
    if sha(PACKETS / "SEAL.json") != EXPECTED_PACKET_SEAL_SHA:
        raise ValueError("packet seal drift")
    packet_seal = json.loads((PACKETS / "SEAL.json").read_text())
    if len(packet_seal["packets"]) != 32:
        raise ValueError("exposed pair count drift")
    rows = []
    for binding in packet_seal["packets"]:
        path = Path(binding["path"])
        if not path.is_relative_to(PACKETS) or sha(path) != binding["sha256"]:
            raise ValueError("packet binding drift")
        packet = json.loads(path.read_text())
        rows.append({"cohort": binding["cohort"], "pair": binding["pair"],
                     "packet_path": str(path), "packet_sha256": binding["sha256"],
                     "instance_id": packet["instance_id"], "choice": choose(packet)})
    result = {"schema_version": "g02.delivered-quoted-anchor-seal/v1",
              "posture": "source-only-exposed-development-no-gold-score-or-new-model-call",
              "packet_seal_sha256": EXPECTED_PACKET_SEAL_SHA,
              "selector_sha256": sha(Path(__file__)),
              "rule": "At most one previously delivered but unselected file per pair; require at least two distinct backtick-quoted issue identifiers in its delivered snippets; prefer more matches, then earlier read, then lexical path.",
              "rows": rows,
              "claim_ceiling": "Source-only development selections; no native quality, cost, fresh holdout, or superiority result.",
              "open_questions": ["Do the selected files recover omitted gold at useful precision on both exposed cohorts?"]}
    OUTPUT.mkdir(mode=0o700)
    output = OUTPUT / "SEAL.json"
    with output.open("x") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    output.chmod(0o600)
    print(json.dumps({"status": "source-only-sealed", "rows": len(rows),
                      "selected_files": sum(row["choice"] is not None for row in rows),
                      "seal_sha256": sha(output)}, sort_keys=True))


if __name__ == "__main__":
    main()
