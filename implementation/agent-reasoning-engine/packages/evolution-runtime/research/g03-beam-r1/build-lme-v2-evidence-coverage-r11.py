#!/usr/bin/env python3
"""Repair exposed V2 state packets using source-only field coverage.

No evaluator gold, answer, question type, or confirmation question is read.
The exact r9 control is preserved. This is a development candidate only.
"""

from collections import Counter
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
PARENT = ROOT / "DEV-WIRES-R9.json"
INDEX = ROOT / "STATE-INDEX-R9.sqlite"
SOURCE = ROOT / "trajectories.jsonl"
HAYSTACK = ROOT / "lme_v2_small.json"
EXPECTED = {
    PARENT: "ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5",
    INDEX: "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
    SOURCE: "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    HAYSTACK: "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
}
HERE = Path(__file__).parent
FIELD = re.compile(r"(?:combobox|textbox|checkbox|radiobutton|spinbutton|option|StaticText|heading|button)\b", re.I)
CHROME = re.compile(r"(?:favorite|landing page|service management|more menus|search catalog|recent searches|suggestion|response time)", re.I)
CAP = 12000


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


def rarity(con: sqlite3.Connection, words: set[str]) -> dict[str, float]:
    total = con.execute("SELECT count(*) FROM state_docs").fetchone()[0]
    assert total == 5095
    result = {}
    for word in words:
        count = con.execute("SELECT count(*) FROM state_docs WHERE state_docs MATCH ?",
                            (f'"{word}"',)).fetchone()[0]
        result[word] = math.log((total + 1) / (count + 1))
    return result


def field_lines(tree: str, query_terms: set[str], weights: dict[str, float],
                anchors: list[str]) -> list[tuple[float, int, str]]:
    lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    scored = []
    for index, line in enumerate(lines):
        terms = query_terms & set(re.findall(r"[a-z0-9]+", line.lower()))
        exact = sum(anchor.casefold() in line.casefold() for anchor in anchors)
        value = sum(weights[term] for term in terms) + 8 * exact
        if FIELD.search(line):
            value *= 1.25
        if CHROME.search(line):
            value *= 0.1
        if value > 0:
            scored.append((value, index, line))
    return sorted(scored, key=lambda row: (-row[0], row[1]))


def coverage_score(tree: str, query_terms: set[str], weights: dict[str, float],
                   anchors: list[str]) -> float:
    lines = field_lines(tree, query_terms, weights, anchors)
    if not lines:
        return 0.0
    return sum(value for value, _, _ in lines[:3]) + 0.15 * len(lines[:10])


def render_state(entry: dict, trajectory: dict, question_terms: set[str],
                 weights: dict[str, float], anchors: list[str]) -> str:
    state = trajectory["states"][entry["state_index"]]
    tree = str(state.get("accessibility_tree") or "")
    prior = trajectory["states"][entry["state_index"] - 1] if entry["state_index"] else None
    prior_tree = str(prior.get("accessibility_tree") or "") if prior else ""
    lines = [f"### Page state {entry['trajectory_id']}/{entry['state_index']}",
             f"Page: {entry['page_title'][:140]}",
             f"URL: {str(state.get('url') or '')[:170]}",
             f"Goal: {str(trajectory.get('goal') or '')[:170]}",
             f"Transition: {entry['action_label'][:140]}"]
    if prior:
        lines.append(f"Previous page: {entry['prior_title'][:120]}")
    lines.append("Relevant observed fields (ranked; source line numbers retained):")
    selected = []
    seen = set()
    source_lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    for _, index, line in field_lines(tree, question_terms, weights, anchors):
        if index in seen:
            continue
        selected.append(f"L{index}: {line[:300]}")
        seen.add(index)
        # Keep a nearby field/value or option line, not a broad navigation window.
        for neighbor in (index - 1, index + 1):
            if 0 <= neighbor < len(source_lines) and neighbor not in seen:
                item = source_lines[neighbor]
                if item and (FIELD.search(item) or "value=" in item):
                    selected.append(f"L{neighbor}: {item[:300]}")
                    seen.add(neighbor)
        if sum(len(item) + 1 for item in selected) >= 1650 or len(selected) >= 14:
            break
    lines.extend(selected)
    return "\n".join(lines)[:2300]


def main() -> None:
    assert len(sys.argv) == 2, "packet-output-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    r9 = module(HERE / "build-lme-v2-state-transition-r9.py", "lme_v2_state_r9_for_r11")
    r3 = module(HERE / "build-lme-v2-form-procedure-r3.py", "lme_v2_form_r3_for_r11")
    site = module(HERE / "build-lme-v2-site-scope-r7.py", "lme_v2_site_r7_for_r11")
    line = module(HERE / "build-lme-v2-line-window-r2.py", "lme_v2_line_r2_for_r11")
    parent = json.loads(PARENT.read_text())
    haystacks = json.loads(HAYSTACK.read_text())
    required = {tid for row in parent["rows"] for tid in haystacks[row["id"]]}
    trajectories = {}
    with SOURCE.open() as stream:
        for source_line in stream:
            trajectory = json.loads(source_line)
            if trajectory["id"] in required:
                trajectories[trajectory["id"]] = trajectory
    assert set(trajectories) == required
    con = sqlite3.connect(f"file:{INDEX}?mode=ro", uri=True)
    changed = []
    diagnostics = []
    for row in parent["rows"]:
        question, qid = row["question"], row["id"]
        original_control = json.dumps(row["arms"]["control"], sort_keys=True)
        options = r3.options_for(question)
        if options:
            special = r3.form_evidence(options, haystacks[qid], trajectories)
            if special is not None:
                evidence, selected = special
                row["arms"]["treatment"] = {
                    "selection": [{"kind": "item-form", "trajectory_id": entry["trajectory_id"],
                                   "state_index": entry["state_index"], "item": entry["item"]}
                                  for entry in selected],
                    "evidence": evidence,
                    "evidence_sha256": sha256(evidence.encode()).hexdigest(),
                    "evidence_chars": len(evidence),
                    "view_kind": "source-grounded-item-form-comparison"}
                changed.append(qid)
                diagnostics.append({"question_id": qid, "mode": "item-form",
                                    "selected_states": len(selected), "evidence_chars": len(evidence)})
                assert json.dumps(row["arms"]["control"], sort_keys=True) == original_control
                continue
        query_terms = line.terms(question)
        anchors = r9.anchor_phrases(question)
        weights = rarity(con, query_terms)
        target = site.site_for_query(question)
        candidates = r9.state_candidates(con, question, haystacks[qid], target, trajectories, line)
        assert candidates
        ranked = []
        for candidate in candidates[:500]:
            trajectory = trajectories[candidate["trajectory_id"]]
            index = candidate["state_index"]
            tree = str(trajectory["states"][index].get("accessibility_tree") or "")
            score = coverage_score(tree, query_terms, weights, anchors)
            if score <= 0:
                continue
            before = trajectory["states"][index - 1] if index else None
            prior_tree = str(before.get("accessibility_tree") or "") if before else ""
            candidate = dict(candidate)
            candidate.update({"coverage_score": score, "page_title": r9.title(tree),
                              "prior_title": r9.title(prior_tree),
                              "action_label": r9.action_label(str(trajectory["states"][index].get("action") or ""), prior_tree)})
            ranked.append(candidate)
        ranked.sort(key=lambda entry: (-entry["coverage_score"], -entry["score"],
                                       entry["trajectory_id"], entry["state_index"]))
        selected = []
        by_trajectory = Counter()
        for entry in ranked:
            if by_trajectory[entry["trajectory_id"]] >= 1:
                continue
            selected.append(entry)
            by_trajectory[entry["trajectory_id"]] += 1
            if len(selected) == 5:
                break
        assert selected
        evidence = "\n\n".join(render_state(entry, trajectories[entry["trajectory_id"]],
                                             query_terms, weights, anchors) for entry in selected)[:CAP]
        row["arms"]["treatment"] = {
            "selection": [{"kind": "field-focused-page-state", "trajectory_id": entry["trajectory_id"],
                           "state_index": entry["state_index"]} for entry in selected],
            "evidence": evidence, "evidence_sha256": sha256(evidence.encode()).hexdigest(),
            "evidence_chars": len(evidence), "view_kind": "site-scoped-field-focused-page-states",
            "query_site": target}
        assert json.dumps(row["arms"]["control"], sort_keys=True) == original_control
        changed.append(qid)
        diagnostics.append({"question_id": qid, "mode": "field-focused",
                            "selected_states": len(selected), "evidence_chars": len(evidence),
                            "top_coverage_score": selected[0]["coverage_score"]})
    con.close()
    assert len(changed) == len(parent["rows"]) == len(diagnostics) == 28
    parent.update({"schema_version": "are.g03-lme-v2-dev-evidence-coverage-r11/v1",
                   "status": "development-source-only-not-token-qualified",
                   "parent_wire_sha256": EXPECTED[PARENT],
                   "builder_sha256": digest(Path(__file__)),
                   "gold_fields_used_by_builder": False,
                   "confirmation_question_fields_selected_or_emitted": False,
                   "changed_treatment_question_ids": changed,
                   "coverage_diagnostics": diagnostics,
                   "arms": {"control": parent["arms"]["control"],
                            "treatment": "site-scoped field-focused page states or source-grounded item-form comparison"},
                   "claim_ceiling": "Exposed development source packets only; no score or superiority claim"})
    encoded = (json.dumps(parent, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(parent["rows"]), "changed_treatments": len(changed),
                      "min_evidence_chars": min(item["evidence_chars"] for item in diagnostics),
                      "max_evidence_chars": max(item["evidence_chars"] for item in diagnostics),
                      "packet_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
