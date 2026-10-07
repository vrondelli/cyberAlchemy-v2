#!/usr/bin/env python3
"""Rank source UI states by question-to-role evidence on exposed G03 IDs.

The source is pinned trajectory AXTree only; no gold, judge, or confirmation
question fields are read. Query-plan prose is deliberately excluded.
"""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path("/home/vlad_/are-benchmark-archive/g03-lme-v2-feasibility-20261005")
HERE = Path(__file__).parent
EXPECTED = {
    ROOT / "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    ROOT / "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
    ROOT / "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
}
ROLE = re.compile(r"\b(?:tab|menuitem|menu|link|button|columnheader|gridcell|option|textbox|combobox|heading|StaticText)\b")
ANCHOR = re.compile(r'(?:["“]([^"”]{3,100})["”]|`([^`]{3,100})`)')
GENERIC = {"servicenow", "magento", "reddit", "website", "portal", "admin",
           "custom", "system", "question", "criterion", "correct"}


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


def stem(question):
    text = question.partition("\nA.")[0]
    return re.split(r"\b(?:Select ONE|Put your final answer|Mark your final answer|Your final answer)\b",
                    text, maxsplit=1, flags=re.I)[0]


def descriptors(trajectory, site, r9, line):
    result = []
    goal_terms = line.terms(str(trajectory.get("goal") or "")) - GENERIC
    for state in trajectory["states"]:
        tree = str(state.get("accessibility_tree") or "")
        source_lines = tree.replace("\\n", "\n").splitlines()
        role_lines = [(i, value.strip()[:420]) for i, value in enumerate(source_lines)
                      if ROLE.search(value)]
        role_text = "\n".join(value for _, value in role_lines).casefold()
        result.append({"trajectory_id": trajectory["id"],
                       "state_index": state["state_index"],
                       "page": r9.title(tree)[:130],
                       "site": site.source_site(str(state.get("url") or "")),
                       "title_terms": line.terms(r9.title(tree)) - GENERIC,
                       "goal_terms": goal_terms,
                       "role_terms": line.terms(role_text) - GENERIC,
                       "role_text": role_text,
                       "role_lines": role_lines})
    return result


def main():
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    wire = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    assert len(wire["rows"]) == 26
    required = {tid for row in wire["rows"] for tid in haystacks[row["id"]]}
    r9 = module("lme_v2_state_r41", "build-lme-v2-state-transition-r9.py")
    line = module("lme_v2_line_r41", "build-lme-v2-line-window-r2.py")
    site = module("lme_v2_site_r41", "build-lme-v2-site-scope-r7.py")
    by_trajectory = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in required:
                by_trajectory[raw["id"]] = descriptors(raw, site, r9, line)
    assert set(by_trajectory) == required and len(required) == 200
    rows = []
    for row in wire["rows"]:
        question = row["question"]
        text = stem(question)
        qterms = line.terms(text) - GENERIC
        anchors = list(dict.fromkeys((match.group(1) or match.group(2)).casefold()
                                     for match in ANCHOR.finditer(text)))[:12]
        target_site = site.site_for_query(question)
        ranked = []
        for tid in haystacks[row["id"]]:
            for state in by_trajectory[tid]:
                if state["site"] != target_site:
                    continue
                title_hits = len(state["title_terms"] & qterms)
                role_hits = len(state["role_terms"] & qterms)
                goal_hits = len(state["goal_terms"] & qterms)
                anchor_hits = [anchor for anchor in anchors if anchor in state["role_text"]]
                ordered_bonus = (20 if "between" in text.casefold() and
                                 len(anchor_hits) >= 2 else 0)
                score = (14 * len(anchor_hits) + 2.5 * min(role_hits, 16) +
                         3 * min(title_hits, 10) + 0.3 * min(goal_hits, 10) + ordered_bonus)
                if score <= 0:
                    continue
                ranked.append({"trajectory_id": tid, "state_index": state["state_index"],
                               "page": state["page"], "score": round(score, 2),
                               "title_hits": title_hits, "role_hits": role_hits,
                               "goal_hits": goal_hits, "anchor_hits": anchor_hits,
                               "ordered_bonus": ordered_bonus, "descriptor": state})
        ranked.sort(key=lambda item: (-item["score"], -len(item["anchor_hits"]),
                                      item["trajectory_id"], item["state_index"]))
        top = ranked[:10]
        for item in top:
            state = item.pop("descriptor")
            matched = [(i, value) for i, value in state["role_lines"]
                       if any(anchor in value.casefold() for anchor in anchors) or
                       len(line.terms(value) & qterms) >= 2]
            item["source_role_lines"] = [f"L{i}: {value}" for i, value in matched[:8]]
        rows.append({"question_id": row["id"],
                     "question_sha256": sha256(question.encode()).hexdigest(),
                     "site": target_site, "quoted_or_backticked_anchor_count": len(anchors),
                     "candidate_count": len(ranked), "top_states": top})
    output = {"schema_version": "are.g03-lme-v2-role-witness-r41/v1",
              "status": "source-only-exposed-development-screen",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "builder_sha256": digest(Path(__file__)),
              "gold_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "generated_query_plan_prose_used": False,
              "rows": rows,
              "claim_ceiling": "UI role-line candidate relevance only; no answer reach, score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows),
                      "nonempty": sum(bool(row["top_states"]) for row in rows),
                      "screen_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
