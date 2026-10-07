#!/usr/bin/env python3
"""Screen observed state changes for exposed V2 questions, without answers.

This diagnostic reads only the 28 exposed question texts, their small-tier
haystack IDs, trajectory source, and the pinned r9 source-state index.
It does not read gold, evaluator configuration, type labels, or confirmation
question fields. Its ranked events are not model-ready treatment packets.
"""

from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
R12 = ROOT / "DEV-WIRES-R12B.json"
INDEX = ROOT / "STATE-INDEX-R9.sqlite"
EXPECTED = {
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    R12: "a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd",
    INDEX: "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
}
HERE = Path(__file__).parent
ID_PREFIX = re.compile(r"^\s*\[[^]]+\]\s*")
SPACE = re.compile(r"\s+")
SOURCE_FIELD = re.compile(r"\b(?:combobox|textbox|checkbox|radiobutton|spinbutton|option|StaticText|heading|button|link|alert|status)\b", re.I)
CHROME = re.compile(r"(?:favorite|landing page|response time|service management|more menus|search catalog|recent searches|suggestion)", re.I)


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def norm(line: str) -> str:
    return SPACE.sub(" ", ID_PREFIX.sub("", line).strip())


def changed_lines(before: str, after: str) -> tuple[list[str], list[str]]:
    old = {norm(line): line.strip() for line in before.replace("\\n", "\n").splitlines()
           if norm(line)}
    new = {norm(line): line.strip() for line in after.replace("\\n", "\n").splitlines()
           if norm(line)}
    return ([new[key] for key in new.keys() - old.keys()],
            [old[key] for key in old.keys() - new.keys()])


def best_lines(lines: list[str], terms: set[str], anchors: list[str],
               line_module, limit: int) -> list[dict]:
    scored = []
    for line in lines:
        if not SOURCE_FIELD.search(line) or CHROME.search(line):
            continue
        term_hits = len(line_module.terms(line) & terms)
        exact_hits = sum(anchor.casefold() in line.casefold() for anchor in anchors)
        score = 3 * exact_hits + term_hits + (1 if "value=" in line else 0)
        if score:
            scored.append({"score": score, "line": line[:400]})
    return sorted(scored, key=lambda row: (-row["score"], row["line"]))[:limit]


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    r9 = module(HERE / "build-lme-v2-state-transition-r9.py", "lme_v2_state_r9_for_r13")
    line = module(HERE / "build-lme-v2-line-window-r2.py", "lme_v2_line_r2_for_r13")
    site = module(HERE / "build-lme-v2-site-scope-r7.py", "lme_v2_site_r7_for_r13")
    wires = json.loads(R12.read_text())
    assert len(wires["rows"]) == 28
    haystacks = json.loads(HAYSTACK.read_text())
    required = {tid for row in wires["rows"] for tid in haystacks[row["id"]]}
    trajectories = {}
    with SOURCE.open() as stream:
        for item in stream:
            trajectory = json.loads(item)
            if trajectory["id"] in required:
                trajectories[trajectory["id"]] = trajectory
    assert set(trajectories) == required and len(required) == 200
    con = sqlite3.connect(f"file:{INDEX}?mode=ro", uri=True)
    rows = []
    for question in wires["rows"]:
        qid, text = question["id"], question["question"]
        target_site = site.site_for_query(text)
        terms = line.terms(text)
        anchors = r9.anchor_phrases(text)
        states = r9.state_candidates(con, text, haystacks[qid], target_site,
                                     trajectories, line)
        candidates = []
        for item in states[:600]:
            index = item["state_index"]
            if index == 0:
                continue
            trajectory = trajectories[item["trajectory_id"]]
            before, after = trajectory["states"][index - 1:index + 1]
            old_tree = str(before.get("accessibility_tree") or "")
            new_tree = str(after.get("accessibility_tree") or "")
            added, removed = changed_lines(old_tree, new_tree)
            add_hits = best_lines(added, terms, anchors, line, 5)
            remove_hits = best_lines(removed, terms, anchors, line, 3)
            action = r9.action_label(str(after.get("action") or ""), old_tree)
            action_hits = len(line.terms(action) & terms)
            page_title = r9.title(new_tree)
            title_hits = len(line.terms(page_title) & terms)
            score = (sum(hit["score"] for hit in add_hits[:3]) +
                     0.5 * sum(hit["score"] for hit in remove_hits[:2]) +
                     2 * action_hits + title_hits -
                     0.1 * math.log1p(len(added) + len(removed)))
            if score <= 0 or not (add_hits or remove_hits):
                continue
            candidates.append({"trajectory_id": item["trajectory_id"],
                               "from_state": index - 1, "to_state": index,
                               "score": round(score, 4), "action": action[:180],
                               "before_page": r9.title(old_tree)[:120],
                               "after_page": page_title[:120],
                               "added_line_count": len(added),
                               "removed_line_count": len(removed),
                               "added_matches": add_hits,
                               "removed_matches": remove_hits})
        candidates.sort(key=lambda entry: (-entry["score"], entry["trajectory_id"],
                                           entry["to_state"]))
        selected = []
        seen_trajectory = set()
        for item in candidates:
            if item["trajectory_id"] in seen_trajectory:
                continue
            selected.append(item)
            seen_trajectory.add(item["trajectory_id"])
            if len(selected) == 8:
                break
        rows.append({"question_id": qid, "question_sha256": sha256(text.encode()).hexdigest(),
                     "site": target_site, "anchors": anchors,
                     "state_candidates": len(states),
                     "scored_transition_candidates": len(candidates),
                     "top_transitions": selected})
    con.close()
    output = {"schema_version": "are.g03-lme-v2-dev-transition-inventory-r13/v1",
              "status": "source-only-exposed-development-diagnostic",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "builder_sha256": digest(Path(__file__)),
              "gold_fields_used": False,
              "question_type_labels_used": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "indexed_trajectories": len(required),
              "development_questions": len(rows), "rows": rows,
              "claim_ceiling": "Transition candidate availability only; no answer, score, or superiority claim"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"], "questions": len(rows),
                      "with_transition_candidates": sum(bool(row["top_transitions"]) for row in rows),
                      "result_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
