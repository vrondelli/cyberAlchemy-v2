#!/usr/bin/env python3
"""Source-only exact-action witness screen for exposed V2 questions.

Question text supplies the action label; trajectories supply the observed
before/after surface. No answer, evaluator, type label, or held-out question
field is read. Output is a diagnostic candidate set, not a treatment run.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
R12 = ROOT / "DEV-WIRES-R12B.json"
EXPECTED = {
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    R12: "a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd",
}
HERE = Path(__file__).parent
QUOTED = re.compile(r"`([^`\n]{2,80})`|\"([^\"\n]{2,80})\"|'([^'\n]{2,80})'")
CLICK_NEAR = re.compile(r"\bclick(?:ing)?(?:\s+\w+){0,7}\s*$", re.I)
FIELD = re.compile(r"\b(?:combobox|textbox|checkbox|radiobutton|spinbutton|option|StaticText|heading|button|link|dialog|alert|status)\b", re.I)


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


def action_cue(question: str) -> str | None:
    labels = []
    for match in QUOTED.finditer(question):
        preceding = question[max(0, match.start() - 100):match.start()]
        if CLICK_NEAR.search(preceding):
            labels.append(next(value for value in match.groups() if value).strip())
    if labels:
        return labels[-1]
    if re.search(r"\bafter I reply\b", question, re.I):
        return "Reply"
    return None


def bounded_dialog(tree: str) -> list[str]:
    lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    starts = [index for index, line in enumerate(lines) if re.search(r"\bdialog\b", line, re.I)]
    if not starts:
        return []
    # The last dialog is normally the newly opened overlay, not a menu.
    start = starts[-1]
    return [f"L{index}: {lines[index][:330]}" for index in range(start, min(len(lines), start + 45))
            if FIELD.search(lines[index])][:24]


def changed_excerpt(before: str, after: str, terms: set[str], line_module) -> list[str]:
    old = {line.strip() for line in before.replace("\\n", "\n").splitlines() if line.strip()}
    candidates = []
    for line in after.replace("\\n", "\n").splitlines():
        line = line.strip()
        if not line or line in old or not FIELD.search(line):
            continue
        hits = len(line_module.terms(line) & terms)
        if hits:
            candidates.append((hits, line[:330]))
    candidates.sort(key=lambda row: (-row[0], row[1]))
    return [line for _, line in candidates[:12]]


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    r9 = module(HERE / "build-lme-v2-state-transition-r9.py", "lme_v2_state_r9_for_r14")
    site = module(HERE / "build-lme-v2-site-scope-r7.py", "lme_v2_site_r7_for_r14")
    line = module(HERE / "build-lme-v2-line-window-r2.py", "lme_v2_line_r2_for_r14")
    wires = json.loads(R12.read_text())
    haystacks = json.loads(HAYSTACK.read_text())
    assert len(wires["rows"]) == 28
    target_rows = [row for row in wires["rows"] if action_cue(row["question"])]
    required = {tid for row in target_rows for tid in haystacks[row["id"]]}
    trajectories = {}
    with SOURCE.open() as stream:
        for source_line in stream:
            trajectory = json.loads(source_line)
            if trajectory["id"] in required:
                trajectories[trajectory["id"]] = trajectory
    assert set(trajectories) == required
    rows = []
    for row in wires["rows"]:
        question, qid = row["question"], row["id"]
        cue = action_cue(question)
        if not cue:
            rows.append({"question_id": qid, "cue": None, "matched_transitions": 0,
                         "top_witnesses": []})
            continue
        target_site = site.site_for_query(question)
        terms = line.terms(question)
        matches = []
        for tid in haystacks[qid]:
            trajectory = trajectories[tid]
            states = trajectory["states"]
            for index in range(1, len(states)):
                before, after = states[index - 1], states[index]
                prior_tree = str(before.get("accessibility_tree") or "")
                after_tree = str(after.get("accessibility_tree") or "")
                action = r9.action_label(str(after.get("action") or ""), prior_tree)
                if cue.casefold() not in action.casefold():
                    continue
                after_site = site.source_site(str(after.get("url") or ""))
                if after_site != target_site:
                    continue
                before_title, after_title = r9.title(prior_tree), r9.title(after_tree)
                dialog = bounded_dialog(after_tree)
                changed = changed_excerpt(prior_tree, after_tree, terms, line)
                title_hits = len(line.terms(before_title + " " + after_title) & terms)
                changed_hits = sum(len(line.terms(value) & terms) for value in changed[:6])
                goal_hits = len(line.terms(str(trajectory.get("goal") or "")) & terms)
                score = (5 + 2 * title_hits + min(changed_hits, 12) +
                         0.5 * min(goal_hits, 8) + (2 if dialog else 0))
                matches.append({"trajectory_id": tid, "from_state": index - 1,
                                "to_state": index, "score": score,
                                "action": action[:180],
                                "before_page": before_title[:150],
                                "after_page": after_title[:150],
                                "navigation_occurred": before_title != after_title,
                                "dialog_lines": dialog,
                                "changed_lines": changed})
        matches.sort(key=lambda item: (-item["score"], item["trajectory_id"],
                                       item["to_state"]))
        selected = []
        seen = set()
        for item in matches:
            if item["trajectory_id"] in seen:
                continue
            selected.append(item)
            seen.add(item["trajectory_id"])
            if len(selected) == 5:
                break
        rows.append({"question_id": qid, "question_sha256": sha256(question.encode()).hexdigest(),
                     "cue": cue, "site": target_site, "matched_transitions": len(matches),
                     "top_witnesses": selected})
    output = {"schema_version": "are.g03-lme-v2-dev-action-witness-r14/v1",
              "status": "source-only-exposed-development-screen",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "builder_sha256": digest(Path(__file__)),
              "gold_fields_used": False, "question_type_labels_used": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "development_questions": len(rows), "rows": rows,
              "claim_ceiling": "Exact-action witness availability only; no answer, score or superiority claim"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows),
                      "with_action_cue": sum(bool(row["cue"]) for row in rows),
                      "with_exact_action_witness": sum(bool(row["top_witnesses"]) for row in rows),
                      "result_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
