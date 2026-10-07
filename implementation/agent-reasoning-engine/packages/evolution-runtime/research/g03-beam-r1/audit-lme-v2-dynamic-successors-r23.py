#!/usr/bin/env python3
"""Screen entity-linked successor states on already exposed dynamic r18 cases.

Uses only question anchors from r22B, selected source states, and their actual
next states in the same trajectory. No gold or confirmation question fields.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
HERE = Path(__file__).parent
EXPECTED = {
    "DYNAMIC-SOURCE-AUDIT-R22B.json": "67906f5e4824a4cec296f4230cf314a007368fd937e7c024d87e6e282e9416d3",
    "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    assert spec and spec.loader
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for name, expected in EXPECTED.items():
        assert digest(ROOT / name) == expected, f"source-drift:{name}"
    audit = json.loads((ROOT / "DYNAMIC-SOURCE-AUDIT-R22B.json").read_text())
    wire = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    by_qid = {row["id"]: row for row in wire["rows"]}
    assert len(audit["rows"]) == 8
    needed = {item["trajectory_id"] for row in audit["rows"]
              for item in by_qid[row["question_id"]]["arms"]["treatment"]["selection"]
              if item["kind"] == "page-state"}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in needed:
                trajectories[raw["id"]] = raw
    assert set(trajectories) == needed
    r9 = module("lme_v2_state_r23", "build-lme-v2-state-transition-r9.py")
    line = module("lme_v2_line_r23", "build-lme-v2-line-window-r2.py")
    r22 = module("lme_v2_dynamic_r22_for_r23", "audit-lme-v2-dynamic-source-r22.py")
    rows = []
    for audit_row in audit["rows"]:
        qid = audit_row["question_id"]
        row = by_qid[qid]
        question = row["question"]
        anchors = [item["query_anchor"] for item in audit_row["targets"]]
        assert all(anchor.casefold() in question.casefold() for anchor in anchors)
        witnesses = []
        for chosen in row["arms"]["treatment"]["selection"]:
            if chosen["kind"] != "page-state":
                continue
            tid, index = chosen["trajectory_id"], int(chosen["state_index"])
            states = trajectories[tid]["states"]
            assert states[index]["state_index"] == index
            before = states[index]
            before_tree = str(before.get("accessibility_tree") or "")
            before_found = [anchor for anchor in anchors if anchor.casefold() in before_tree.casefold()]
            for step in (1, 2):
                if index + step >= len(states):
                    continue
                after = states[index + step]
                after_tree = str(after.get("accessibility_tree") or "")
                after_found = [anchor for anchor in anchors if anchor.casefold() in after_tree.casefold()]
                gained = [anchor for anchor in after_found if anchor not in before_found]
                if not gained:
                    continue
                snippets = []
                for anchor in gained:
                    snippets.extend(r22.related_lines(after_tree, anchor, question, line)[:2])
                witnesses.append({"trajectory_id": tid, "from_state": index,
                                  "to_state": index + step,
                                  "from_page": r9.title(before_tree)[:150],
                                  "to_page": r9.title(after_tree)[:150],
                                  "action": r9.action_label(str(after.get("action") or ""),
                                                            str(states[index + step - 1].get("accessibility_tree") or ""))[:180],
                                  "anchors_before": before_found,
                                  "anchors_after": after_found,
                                  "new_question_anchors": gained,
                                  "new_anchor_excerpts": snippets[:6]})
        witnesses.sort(key=lambda item: (-len(item["new_question_anchors"]),
                                         item["to_state"] - item["from_state"],
                                         item["trajectory_id"], item["from_state"]))
        rows.append({"question_id": qid,
                     "question_sha256": sha256(question.encode()).hexdigest(),
                     "question_anchors": anchors,
                     "selected_page_states": sum(item["kind"] == "page-state"
                                                 for item in row["arms"]["treatment"]["selection"]),
                     "successors_gaining_query_anchor": len(witnesses),
                     "top_witnesses": witnesses[:8]})
    output = {"schema_version": "are.g03-lme-v2-dynamic-successor-audit-r23/v1",
              "status": "source-only-exposed-development-diagnostic",
              "input_sha256": EXPECTED, "builder_sha256": digest(Path(__file__)),
              "answer_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "questions": len(rows), "rows": rows,
              "claim_ceiling": "Successor query-anchor gain only; not answer reach, score, or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows),
                      "questions_with_gain": sum(bool(row["top_witnesses"]) for row in rows),
                      "result_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
