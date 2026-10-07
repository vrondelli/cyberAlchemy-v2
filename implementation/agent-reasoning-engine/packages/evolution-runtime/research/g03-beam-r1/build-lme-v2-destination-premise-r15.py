#!/usr/bin/env python3
"""Render exact-action post-surface evidence when a question posits a page.

Only exposed question text and sealed source-only r14 witnesses are read.
No answer, evaluator, type label, or confirmation question field is used.
"""

from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
R12 = ROOT / "DEV-WIRES-R12B.json"
R14 = ROOT / "ACTION-WITNESSES-R14.json"
EXPECTED = {
    R12: "a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd",
    R14: "0075d0ec84e4771dabc6d68a792cb4da8014407d4e6c8dbac71599a534e54042",
}
DESTINATION = re.compile(r"\bresulting page called\s+[`\"']([^`\"'\n]{2,80})[`\"']", re.I)


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def evidence_for(question: str, witness_row: dict) -> tuple[str, dict] | None:
    match = DESTINATION.search(question)
    if not match or not witness_row["cue"]:
        return None
    claimed = match.group(1).strip()
    candidates = [item for item in witness_row["top_witnesses"]
                  if item["dialog_lines"] and not item["navigation_occurred"] and
                  claimed.casefold() not in item["after_page"].casefold()]
    if not candidates:
        return None
    item = candidates[0]
    lines = ["Observed prior agent trajectory after the question's named click:",
             f"Source trajectory/state: {item['trajectory_id']}/{item['from_state']} -> {item['to_state']}",
             f"Action: {item['action']}",
             f"Before page title: {item['before_page']}",
             f"After page title: {item['after_page']}",
             "The observed page title did not change; an in-page dialog became visible.",
             "Visible dialog lines in the captured post-action AXTree:",
             *item["dialog_lines"]]
    if not any(re.search(rf"\b{re.escape(claimed)}\b", line, re.I)
               for line in item["dialog_lines"]):
        lines.append(f"No label matching '{claimed}' appears in these captured dialog lines.")
    lines.append("This is one observed source state, not a guarantee about unobserved pages or later actions.")
    evidence = "\n".join(lines)
    return evidence, item


def main() -> None:
    assert len(sys.argv) == 2, "packet-output-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    parent = json.loads(R12.read_text())
    witnesses = json.loads(R14.read_text())
    by_qid = {row["question_id"]: row for row in witnesses["rows"]}
    assert len(parent["rows"]) == len(by_qid) == 28
    changed = []
    for row in parent["rows"]:
        qid = row["id"]
        if "question_sha256" in by_qid[qid]:
            assert sha256(row["question"].encode()).hexdigest() == by_qid[qid]["question_sha256"]
        old_control = json.dumps(row["arms"]["control"], sort_keys=True)
        resolved = evidence_for(row["question"], by_qid[qid])
        if resolved:
            evidence, item = resolved
            assert evidence and len(evidence) <= 12000
            row["arms"]["treatment"] = {
                "selection": [{"kind": "observed-post-action-dialog",
                               "trajectory_id": item["trajectory_id"],
                               "from_state": item["from_state"], "to_state": item["to_state"]}],
                "evidence": evidence,
                "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                "evidence_chars": len(evidence),
                "view_kind": "exact-action-destination-premise-witness"}
            changed.append(qid)
        assert json.dumps(row["arms"]["control"], sort_keys=True) == old_control
    parent.update({"schema_version": "are.g03-lme-v2-dev-destination-premise-r15/v1",
                   "status": "development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[R12],
                   "action_screen_sha256": EXPECTED[R14],
                   "builder_sha256": digest(Path(__file__)),
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "changed_treatment_question_ids": changed,
                   "arms": {"control": parent["arms"]["control"],
                            "treatment": "r12 source retrieval with exact-action destination-premise witness when observed"},
                   "claim_ceiling": "Exposed source-only candidate packets; no score or superiority claim"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(parent["rows"]), "changed_ids": changed,
                      "packet_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
