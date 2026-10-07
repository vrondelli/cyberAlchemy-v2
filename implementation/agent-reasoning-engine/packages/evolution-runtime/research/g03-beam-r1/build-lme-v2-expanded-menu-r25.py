#!/usr/bin/env python3
"""Replace only query-eligible r18 packets with bounded observed menu regions."""

from hashlib import sha256
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
PARENT = ROOT / "RESERVE-DEV-WIRES-R18.json"
SCREEN = ROOT / "EXPANDED-MENU-SCREEN-R24B.json"
EXPECTED = {PARENT: "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
            SCREEN: "f3e2b47697bb3718586040ca548f86f1d86d28d2b25cbe8bb75f7f36a76c3871"}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    parent = json.loads(PARENT.read_text())
    screen = json.loads(SCREEN.read_text())
    assert screen["eligible_questions"] == 2
    by_id = {row["question_id"]: row for row in screen["rows"]}
    assert len(by_id) == 2
    changed = []
    for row in parent["rows"]:
        qid = row["id"]
        if qid not in by_id:
            continue
        screen_row = by_id[qid]
        assert sha256(row["question"].encode()).hexdigest() == screen_row["question_sha256"]
        assert screen_row["top_regions"]
        item = screen_row["top_regions"][0]
        assert item["choice_count"] >= 3 and 0 < len(item["evidence"]) <= 4500
        assert sha256(item["evidence"].encode()).hexdigest() == item["evidence_sha256"]
        evidence = ("Observed expanded menu/list from one selected prior trajectory state. "
                    "Items are kept in source order; this is not a claim about other pages.\n"
                    f"Source trajectory/state: {item['trajectory_id']}/{item['state_index']}\n"
                    f"Control: {item['header']}\n"
                    "AXTree region:\n" + item["evidence"])
        assert len(evidence) <= 12000
        row["arms"]["treatment"] = {
            "selection": [{"kind": "expanded-menu-region",
                           "trajectory_id": item["trajectory_id"],
                           "state_index": item["state_index"],
                           "start_line": item["start_line"],
                           "end_line": item["end_line"]}],
            "evidence": evidence,
            "evidence_sha256": sha256(evidence.encode()).hexdigest(),
            "evidence_chars": len(evidence),
            "view_kind": "question-shaped-observed-menu-region"}
        changed.append(qid)
    assert sorted(changed) == sorted(by_id)
    parent.update({"schema_version": "are.g03-lme-v2-expanded-menu-r25/v1",
                   "status": "exposed-second-development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[PARENT],
                   "menu_screen_sha256": EXPECTED[SCREEN],
                   "builder_sha256": digest(Path(__file__)),
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "changed_treatment_question_ids": changed,
                   "claim_ceiling": "Two exposed-development menu packets only; no score, confirmation, or superiority"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"changed_ids": changed,
                      "packet_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
