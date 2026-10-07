#!/usr/bin/env python3
"""Screen source-state relations on the already-exposed G03 development set.

Question/planner text is used only to retrieve and rank pinned source states.
No answer, evaluator, or confirmation record is read.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
ARCHIVE = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-query-plan-run-r30")
HERE = Path(__file__).parent
EXPECTED = {
    ROOT / "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    ROOT / "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    ROOT / "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    ROOT / "STATE-INDEX-R9.sqlite": "52b47b9f32283b58c64f69a5eb83cce0d1886c28283f42374103a94cd63f6ff4",
    ARCHIVE / "AUDIT-R31.json": "2858847de885f823518f0f5d0b04c72926f36b0ca0d4d0279ab0549491caa8bd",
    ROOT / "QUERY-RETRIEVAL-SCREEN-R32.json": "deaafa991998be12d6eec3536361c0eda2f6a20c14c4cddea8f317e740bf95eb",
}
TITLE_CASE = re.compile(r"\b[A-Z][A-Za-z0-9-]*(?:\s+[A-Z][A-Za-z0-9-]*){1,4}\b")
QUOTED = re.compile(r'["“]([^"”]{3,80})["”]')
GENERIC = {"service now", "service catalog"}


def digest(path):
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    item = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(item)
    return item


def phrases(question):
    main = question.partition("\nA.")[0]
    main = re.split(r"\b(?:Select ONE|Put your final answer|Mark your final answer|Your final answer)\b",
                    main, maxsplit=1, flags=re.I)[0]
    return list(dict.fromkeys(x.group().strip() for x in TITLE_CASE.finditer(main)
                              if x.group().strip().casefold() not in GENERIC))


def score_state(state, previous, question, named, r9):
    tree = str(state.get("accessibility_tree") or "")
    title = r9.title(tree).casefold()
    prior_tree = str(previous.get("accessibility_tree") or "") if previous else ""
    prior_title = r9.title(prior_tree).casefold() if previous else ""
    stem = question.partition("\nA.")[0]
    qlow = stem.casefold()
    quoted = [x.group(1).casefold() for x in QUOTED.finditer(stem)]
    title_matches = [x for x in named if x.casefold() in title]
    prior_matches = [x for x in named if x.casefold() in prior_title and x not in title_matches]
    quoted_hits = [x for x in quoted if x in tree.casefold()]
    expanded = bool(re.search(r"(?:menu|listbox|combobox|button) '[^']{0,70}'[^\n]*expanded=True", tree))
    score = 15 * len(title_matches) + 24 * len(prior_matches) + 10 * len(quoted_hits)
    if title_matches and prior_matches:
        score += 35
    if "dropdown" in qlow and expanded:
        score += 22
    if previous and title_matches and str(state.get("action") or "").startswith("click("):
        score += 9
    if "after" in qlow and previous and title_matches and prior_matches:
        score += 15
    return score, {"title_matches": title_matches, "predecessor_title_matches": prior_matches,
                   "quoted_anchor_hits": quoted_hits, "expanded_control": expanded}


def main():
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    wires = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    plans = json.loads((ARCHIVE / "AUDIT-R31.json").read_text())
    by_id = {row["question_id"]: row["plan"] for row in plans["rows"]}
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    required = {tid for row in wires["rows"] for tid in haystacks[row["id"]]}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in required:
                trajectories[raw["id"]] = raw
    assert len(wires["rows"]) == len(by_id) == 26 and len(trajectories) == 200
    r9 = module("lme_v2_state_r33", "build-lme-v2-state-transition-r9.py")
    prior_screen = json.loads((ROOT / "QUERY-RETRIEVAL-SCREEN-R32.json").read_text())
    prior_by_id = {row["question_id"]: row for row in prior_screen["rows"]}
    assert len(prior_by_id) == 26
    rows = []
    for row in wires["rows"]:
        qid, question = row["id"], row["question"]
        assert by_id[qid] is not None
        target_site = prior_by_id[qid]["site"]
        named = phrases(question)
        candidates = {}
        for query_row in prior_by_id[qid]["query_rows"]:
            for rank, item in enumerate(query_row["top_states"]):
                key = (item["trajectory_id"], item["state_index"])
                candidates[key] = min(candidates.get(key, 1000), rank + 1)
        for selection in row["arms"]["treatment"]["selection"]:
            if selection["kind"] == "page-state":
                key = (selection["trajectory_id"], selection["state_index"])
                candidates.setdefault(key, 50)
        # A successor can be absent from FTS candidate lists despite its predecessor
        # identifying the requested entity. Add only adjacent source states.
        for tid, index in list(candidates):
            if index + 1 < len(trajectories[tid]["states"]):
                candidates.setdefault((tid, index + 1), 100)
        scored = []
        for (tid, index), lexical_rank in candidates.items():
            states = trajectories[tid]["states"]
            state = states[index]
            previous = states[index - 1] if index else None
            relation, features = score_state(state, previous, question, named, r9)
            lexical = max(0, 20 - lexical_rank / 5)
            scored.append({"trajectory_id": tid, "state_index": index,
                           "page": r9.title(str(state.get("accessibility_tree") or ""))[:120],
                           "relation_score": relation, "lexical_score": round(lexical, 2),
                           "score": round(relation + lexical, 2), "features": features})
        scored.sort(key=lambda x: (-x["score"], x["trajectory_id"], x["state_index"]))
        rows.append({"question_id": qid, "question_sha256": sha256(question.encode()).hexdigest(),
                     "site": target_site, "named_phrase_count": len(named),
                     "candidate_count": len(scored), "top_states": scored[:10]})
    output = {"schema_version": "are.g03-lme-v2-relation-screen-r33/v1",
              "status": "source-only-exposed-development-screen",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "builder_sha256": digest(Path(__file__)),
              "gold_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "generated_plan_text_treated_as_untrusted_hints": True,
              "rows": rows,
              "claim_ceiling": "Candidate source-state relevance only; no answer score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows), "screen_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
