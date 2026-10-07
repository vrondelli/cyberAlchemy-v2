#!/usr/bin/env python3
"""Project frozen reserve question IDs through the already exposed r15 retrieval.

Only selected question/image fields, haystack IDs, and trajectory source enter
retrieval. Reference answers, evaluator functions, and confirmation rows do not.
"""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
HERE = Path(__file__).parent
EXPECTED = {
    "RESERVE-DEV-R17.json": "73a339ee139501baf081e3f6f88d51836155e4cbdb4052320a58e00bc9756a20",
    "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    "LINE-INDEX-R2.sqlite": "b7fc0a4395ac7f6064ba8d3030ede5e0e2bdb88c39935e91b249c967e794d66d",
    "STATE-INDEX-R9.sqlite": "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
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


def arm(chosen: list[dict], evidence: str, kind: str) -> dict:
    assert evidence and len(evidence) <= 12000
    return {"selection": chosen, "evidence": evidence,
            "evidence_sha256": sha256(evidence.encode()).hexdigest(),
            "evidence_chars": len(evidence), "view_kind": kind}


def action_witness(question: str, haystack: list[str], trajectories: dict,
                   site_module, r9, r14, line_module) -> dict:
    cue = r14.action_cue(question)
    if not cue:
        return {"cue": None, "top_witnesses": []}
    target_site = site_module.site_for_query(question)
    terms = line_module.terms(question)
    matches = []
    for tid in haystack:
        trajectory = trajectories[tid]
        states = trajectory["states"]
        for index in range(1, len(states)):
            before, after = states[index - 1], states[index]
            prior_tree = str(before.get("accessibility_tree") or "")
            after_tree = str(after.get("accessibility_tree") or "")
            action = r9.action_label(str(after.get("action") or ""), prior_tree)
            if cue.casefold() not in action.casefold() or site_module.source_site(
                    str(after.get("url") or "")) != target_site:
                continue
            before_title, after_title = r9.title(prior_tree), r9.title(after_tree)
            dialog = r14.bounded_dialog(after_tree)
            changed = r14.changed_excerpt(prior_tree, after_tree, terms, line_module)
            title_hits = len(line_module.terms(before_title + " " + after_title) & terms)
            changed_hits = sum(len(line_module.terms(value) & terms) for value in changed[:6])
            goal_hits = len(line_module.terms(str(trajectory.get("goal") or "")) & terms)
            score = 5 + 2 * title_hits + min(changed_hits, 12) + 0.5 * min(goal_hits, 8) + (2 if dialog else 0)
            matches.append({"trajectory_id": tid, "from_state": index - 1,
                            "to_state": index, "score": score, "action": action[:180],
                            "before_page": before_title[:150], "after_page": after_title[:150],
                            "navigation_occurred": before_title != after_title,
                            "dialog_lines": dialog, "changed_lines": changed})
    matches.sort(key=lambda item: (-item["score"], item["trajectory_id"], item["to_state"]))
    chosen, seen = [], set()
    for item in matches:
        if item["trajectory_id"] not in seen:
            chosen.append(item)
            seen.add(item["trajectory_id"])
        if len(chosen) == 5:
            break
    return {"cue": cue, "top_witnesses": chosen}


def main() -> None:
    assert len(sys.argv) == 2, "packet-output-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for name, expected in EXPECTED.items():
        if expected:
            assert digest(ROOT / name) == expected, f"source-drift:{name}"
    manifest = json.loads((ROOT / "RESERVE-DEV-R17.json").read_text())
    assert manifest["status"] == "metadata-only-frozen-before-question-text-gold-or-model"
    selected = {row["id"]: row for row in manifest["rows"]}
    assert len(selected) == 26
    questions = {}
    with (ROOT / "questions.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in selected:
                questions[raw["id"]] = {"question": raw["question"], "image": raw["image"]}
    assert set(questions) == set(selected)
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    required = {tid for qid in selected for tid in haystacks[qid]}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in required:
                trajectories[raw["id"]] = raw
    assert set(trajectories) == required and len(required) == 200
    line = module("lme_v2_line_r18", "build-lme-v2-line-window-r2.py")
    site = module("lme_v2_site_r18", "build-lme-v2-site-scope-r7.py")
    r9 = module("lme_v2_state_r18", "build-lme-v2-state-transition-r9.py")
    form = module("lme_v2_form_r18", "build-lme-v2-form-procedure-r3.py")
    r12 = module("lme_v2_hybrid_r18", "build-lme-v2-form-hybrid-r12.py")
    r14 = module("lme_v2_action_r18", "screen-lme-v2-action-witness-r14.py")
    r15 = module("lme_v2_destination_r18", "build-lme-v2-destination-premise-r15.py")
    df, count = Counter(), 0
    for trajectory in trajectories.values():
        for state in trajectory["states"]:
            for _, body in line.windows(str(state.get("accessibility_tree") or "")):
                df.update(line.terms(body))
                count += 1
    lcon = sqlite3.connect(f"file:{ROOT / 'LINE-INDEX-R2.sqlite'}?mode=ro", uri=True)
    scon = sqlite3.connect(f"file:{ROOT / 'STATE-INDEX-R9.sqlite'}?mode=ro", uri=True)
    rows, modes = [], Counter()
    for qid in sorted(selected):
        q = questions[qid]
        question = q["question"]
        assert bool(q["image"]) == selected[qid]["image_present"]
        pool = line.candidates(lcon, trajectories, haystacks[qid], question, df, count)
        control_selected = line.select(pool, "control")
        control = arm([{"trajectory_id": item["trajectory_id"],
                        "state_index": item["state_index"],
                        "segment_index": item["segment_index"]} for item in control_selected],
                      line.render(control_selected, trajectories), "lexical-line-window")
        target_site = site.site_for_query(question)
        anchors = r9.anchor_phrases(question)
        states = r9.state_candidates(scon, question, haystacks[qid], target_site,
                                     trajectories, line)
        paths = r9.path_candidates(scon, question, haystacks[qid], target_site,
                                   trajectories, {tid: r9.ledger(trajectories[tid])
                                                  for tid in haystacks[qid]}, line)
        chosen_states = r9.select_state(states)
        chosen_paths = [entry for entry in paths if entry["score"] >= 3][:1]
        pieces = []
        if chosen_paths:
            item = chosen_paths[0]
            pieces.append(r9.render_path(item, trajectories[item["trajectory_id"]],
                                         r9.ledger(trajectories[item["trajectory_id"]]),
                                         question, line, 2200))
        for item in chosen_states:
            pieces.append(r9.render_state(item, trajectories[item["trajectory_id"]],
                                          question, anchors, line, 2400))
        if pieces:
            treatment = arm([{"kind": "action-path", "trajectory_id": item["trajectory_id"]}
                             for item in chosen_paths] +
                            [{"kind": "page-state", "trajectory_id": item["trajectory_id"],
                              "state_index": item["state_index"]} for item in chosen_states],
                            "\n\n".join(pieces)[:12000], "site-scoped-page-and-action-path")
        else:
            treatment = dict(control)
            treatment["view_kind"] = "lexical-fallback-no-state-candidate"
        mode = treatment["view_kind"]
        options = form.options_for(question)
        if options:
            resolved = form.form_evidence(options, haystacks[qid], trajectories)
            if resolved:
                evidence, items = resolved
                treatment = arm([{"kind": "item-form", "trajectory_id": item["trajectory_id"],
                                  "state_index": item["state_index"], "item": item["item"]}
                                 for item in items], evidence, "source-grounded-item-form-comparison")
                mode = treatment["view_kind"]
        elif r12.form_targets(question):
            resolved = r12.integrated_form_evidence(scon, question, haystacks[qid],
                                                     trajectories, site)
            if resolved:
                evidence, items = resolved
                treatment = arm([{"kind": "listed-form-field", "trajectory_id": item[1],
                                  "state_index": item[2], "page": item[3]}
                                 for item in items], evidence, "observed-integration-field-on-listed-form")
                mode = treatment["view_kind"]
        witness = action_witness(question, haystacks[qid], trajectories, site, r9, r14, line)
        destination = r15.evidence_for(question, witness)
        if destination:
            evidence, item = destination
            treatment = arm([{"kind": "observed-post-action-dialog",
                              "trajectory_id": item["trajectory_id"],
                              "from_state": item["from_state"], "to_state": item["to_state"]}],
                            evidence, "exact-action-destination-premise-witness")
            mode = treatment["view_kind"]
        modes[mode] += 1
        rows.append({"id": qid, "domain": selected[qid]["domain"],
                     "question_type_metadata_only": selected[qid]["question_type"],
                     "question": question, "question_image": q["image"],
                     "arms": {"control": control, "treatment": treatment}})
    lcon.close()
    scon.close()
    output = {"schema_version": "are.g03-lme-v2-reserve-dev-r18/v1",
              "status": "second-development-source-only-not-token-qualified",
              "cohort_sha256": EXPECTED["RESERVE-DEV-R17.json"],
              "source_sha256": {name: digest(ROOT / name) for name in EXPECTED},
              "builder_sha256": digest(Path(__file__)),
              "gold_fields_used_by_builder": False,
              "confirmation_question_fields_selected_or_emitted": False,
              "treatment_mode_counts": dict(sorted(modes.items())),
              "same_max_evidence_chars": 12000,
              "rows": rows,
              "claim_ceiling": "Frozen reserve development packets only; no score, confirmation, or superiority claim"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"rows": len(rows), "modes": output["treatment_mode_counts"],
                      "packet_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
