#!/usr/bin/env python3
"""Add a source-only form-comparison view to V2 development treatment packets.

The trigger is the question's own listed items and Order Now language. The
extractor never reads a reference answer, evaluator, question type, or holdout
question text. R2 lexical control packets remain byte-identical.
"""

from __future__ import annotations

from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
R2 = ROOT / "DEV-WIRES-R2.json"
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
EXPECTED = {
    R2: "99be56cad573d2eacf5ba327cb463288ba6060e80fe5eac9fceed372f7e07f05",
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
}
OPTIONS = re.compile(r"(?m)^([A-E])\.\s+([^\n]+?)\s*$")
FAVORITE = re.compile(r"Create favorite for ([^'\n]+)", re.IGNORECASE)
CONTROL = re.compile(r"(?:combobox|textbox|checkbox|radiobutton|spinbutton) '([^']+)'", re.IGNORECASE)


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def options_for(question: str) -> list[tuple[str, str]]:
    if "order now" not in question.lower() or not any(
        phrase in question.lower() for phrase in ("visible change", "steps", "configuration")
    ):
        return []
    matches = [(letter, name.strip()) for letter, name in OPTIONS.findall(question)]
    if len(matches) != 5 or [letter for letter, _ in matches] != list("ABCDE"):
        return []
    if len({name.lower() for _, name in matches}) != 5:
        return []
    return matches


def page_controls(tree: str) -> list[str]:
    active = False
    labels = []
    for line in tree.splitlines():
        if "Search catalog" in line:
            active = True
        if "Order Now" in line and "button" in line:
            break
        if not active:
            continue
        match = CONTROL.search(line)
        if match:
            label = match.group(1).strip()
            if label.lower() != "search catalog" and label not in labels:
                labels.append(label)
    return labels


def form_evidence(options: list[tuple[str, str]], haystack: list[str],
                  trajectories: dict[str, dict]) -> tuple[str, list[dict]] | None:
    names = {name.casefold(): (letter, name) for letter, name in options}
    observations = {letter: [] for letter, _ in options}
    for trajectory_id in haystack:
        trajectory = trajectories[trajectory_id]
        for state in trajectory["states"]:
            tree = str(state.get("accessibility_tree") or "")
            if "Order Now" not in tree or "Create favorite for" not in tree:
                continue
            match = FAVORITE.search(tree)
            if not match:
                continue
            target = names.get(match.group(1).strip().casefold())
            if target is None:
                continue
            controls = page_controls(tree)
            if not controls:
                continue
            letter, name = target
            observations[letter].append({"letter": letter, "item": name,
                                         "trajectory_id": trajectory_id,
                                         "state_index": state["state_index"],
                                         "controls": controls})
    if any(not observations[letter] for letter, _ in options):
        return None
    selected = []
    for letter, name in options:
        # Prefer the fullest witnessed item form. Break ties toward the earliest
        # state, where defaults have not yet been changed by the agent.
        selected.append(sorted(observations[letter],
                               key=lambda row: (-len(row["controls"]),
                                                row["trajectory_id"], row["state_index"]))[0])
    lines = [
        "These are observed catalog item forms from prior agent trajectories.",
        "Count distinct visible configurable inputs on each item page before its Order Now button.",
        "The Search catalog navigation control is excluded; Quantity is included.",
        "A form observation is not itself proof that every input is required.",
    ]
    for row in selected:
        lines.extend([f'### {row["letter"]}. {row["item"]}',
                      f'Source trajectory/state: {row["trajectory_id"]}/{row["state_index"]}',
                      f'Visible configurable inputs ({len(row["controls"])}): '
                      + "; ".join(row["controls"])])
    evidence = "\n".join(lines)
    assert len(evidence) <= 12000
    return evidence, selected


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    source = json.loads(R2.read_text())
    assert source["schema_version"] == "are.g03-lme-v2-dev-line-window-r2/v1"
    assert len(source["rows"]) == 28
    haystacks = json.loads(HAYSTACK.read_text())
    targets = {row["id"]: options_for(row["question"]) for row in source["rows"]}
    targets = {qid: opts for qid, opts in targets.items() if opts}
    required = {trajectory_id for qid in targets for trajectory_id in haystacks[qid]}
    trajectories = {}
    with SOURCE.open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] in required:
                trajectories[row["id"]] = row
    assert len(trajectories) == len(required)
    changed = []
    for row in source["rows"]:
        opts = targets.get(row["id"])
        if not opts:
            continue
        resolved = form_evidence(opts, haystacks[row["id"]], trajectories)
        if resolved is None:
            continue
        evidence, selection = resolved
        control_before = json.dumps(row["arms"]["control"], sort_keys=True)
        row["arms"]["treatment"] = {
            "selection": [{"trajectory_id": entry["trajectory_id"],
                           "state_index": entry["state_index"], "item": entry["item"],
                           "input_count": len(entry["controls"])} for entry in selection],
            "evidence": evidence, "evidence_sha256": sha256(evidence.encode()).hexdigest(),
            "evidence_chars": len(evidence),
            "view_kind": "source-grounded-item-form-comparison",
        }
        assert json.dumps(row["arms"]["control"], sort_keys=True) == control_before
        changed.append(row["id"])
    source["schema_version"] = "are.g03-lme-v2-dev-form-procedure-r3/v1"
    source["status"] = "development-source-only-not-token-qualified"
    source["parent_wire_sha256"] = EXPECTED[R2]
    source["builder_sha256"] = digest(Path(__file__))
    source["structured_form_question_count"] = len(changed)
    source["structured_form_question_ids"] = changed
    source["arms"]["treatment"] = "episode-linked line windows plus source-grounded item-form comparison when question requests it"
    source["claim_ceiling"] = "Development source packets only; no score or superiority claim"
    encoded = (json.dumps(source, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(source["rows"]), "structured_form_questions": len(changed),
                      "changed_ids": changed, "wire_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
