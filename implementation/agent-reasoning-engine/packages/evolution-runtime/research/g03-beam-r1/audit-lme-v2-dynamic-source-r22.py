#!/usr/bin/env python3
"""Source-only reach screen for eight already exposed dynamic r18 questions.

Anchors below occur in question text. No reference answer/evaluator or
confirmation question text enters this audit. The result is diagnostic, not a
candidate packet, score, or answer-availability proof.
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
    "RESERVE-DEV-R17.json": "73a339ee139501baf081e3f6f88d51836155e4cbdb4052320a58e00bc9756a20",
    "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
    "lme_v2_small.json": "9b5301defb23a088a5f06e45ff8d5f35e569d78305a66d492046a9fff9b46593",
}
ANCHORS = {
    "01307e07": ["Filters", "Incident"],
    "4dffe641": ["Loaner Laptop", "Order Status", "Total"],
    "9ff0ffff": ["Data Management", "Deletion Jobs", "reopening"],
    "ce1cdb2d": ["problem", "progress bar", "approval stage"],
    "6feb33d4": ["downvote", "post"],
    "83a77f9d": ["Most Commented"],
    "91d0775e": ["Most Viewed Products", "Braintree Transaction Source"],
    "e83245c5": ["Toolbox"],
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


def related_lines(tree: str, anchor: str, question: str, line_module) -> list[str]:
    lines = [line.strip() for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    qterms = line_module.terms(question)
    hits = []
    for index, line in enumerate(lines):
        if anchor.casefold() not in line.casefold():
            continue
        context = " ".join(lines[max(0, index - 1):min(len(lines), index + 2)])
        score = len(line_module.terms(context) & qterms)
        hits.append((score, index, context[:700]))
    hits.sort(key=lambda row: (-row[0], row[1]))
    return [f"L{index}: {context}" for _, index, context in hits[:4]]


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for name, expected in EXPECTED.items():
        assert digest(ROOT / name) == expected, f"input-drift:{name}"
    manifest = json.loads((ROOT / "RESERVE-DEV-R17.json").read_text())
    manifest_ids = {row["id"] for row in manifest["rows"]}
    wires = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    by_qid = {row["id"]: row for row in wires["rows"]}
    assert set(ANCHORS) <= manifest_ids and set(ANCHORS) <= set(by_qid)
    assert all(by_qid[qid]["question_type_metadata_only"].startswith("dynamic-")
               for qid in ANCHORS)
    for qid, anchors in ANCHORS.items():
        text = by_qid[qid]["question"].casefold()
        assert all(anchor.casefold() in text for anchor in anchors), f"non-query-anchor:{qid}"
    haystacks = json.loads((ROOT / "lme_v2_small.json").read_text())
    needed = {tid for qid in ANCHORS for tid in haystacks[qid]}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in needed:
                trajectories[raw["id"]] = raw
    assert set(trajectories) == needed
    site = module("lme_v2_site_r22", "build-lme-v2-site-scope-r7.py")
    line = module("lme_v2_line_r22", "build-lme-v2-line-window-r2.py")
    r9 = module("lme_v2_state_r22", "build-lme-v2-state-transition-r9.py")
    rows = []
    for qid in sorted(ANCHORS):
        wire = by_qid[qid]
        question = wire["question"]
        target_site = site.site_for_query(question)
        selected = {(item["trajectory_id"], item["state_index"])
                    for item in wire["arms"]["treatment"]["selection"]
                    if item["kind"] == "page-state"}
        targets = []
        for anchor in ANCHORS[qid]:
            matches = []
            for tid in haystacks[qid]:
                trajectory = trajectories[tid]
                for state in trajectory["states"]:
                    if site.source_site(str(state.get("url") or "")) != target_site:
                        continue
                    tree = str(state.get("accessibility_tree") or "")
                    if anchor.casefold() not in tree.casefold():
                        continue
                    excerpts = related_lines(tree, anchor, question, line)
                    if not excerpts:
                        continue
                    state_index = int(state["state_index"])
                    related = len(line.terms(" ".join(excerpts)) & line.terms(question))
                    matches.append({"trajectory_id": tid, "state_index": state_index,
                                    "page": r9.title(tree)[:150],
                                    "score": related,
                                    "selected_by_r18": (tid, state_index) in selected,
                                    "excerpts": excerpts})
            matches.sort(key=lambda item: (-item["score"], item["trajectory_id"],
                                           item["state_index"]))
            # Diversify the displayed witnesses by trajectory; the complete
            # match count remains available without printing all source text.
            displayed, seen = [], set()
            for item in matches:
                if item["trajectory_id"] in seen:
                    continue
                displayed.append(item)
                seen.add(item["trajectory_id"])
                if len(displayed) == 6:
                    break
            targets.append({"query_anchor": anchor, "matching_states": len(matches),
                            "matching_trajectories": len({item["trajectory_id"] for item in matches}),
                            "r18_selected_state_matches": sum(item["selected_by_r18"] for item in matches),
                            "top_diverse_witnesses": displayed})
        rows.append({"question_id": qid, "question_sha256": sha256(question.encode()).hexdigest(),
                     "site": target_site, "haystack_trajectories": len(haystacks[qid]),
                     "r18_selected_page_states": len(selected), "targets": targets})
    output = {"schema_version": "are.g03-lme-v2-dynamic-source-audit-r22/v1",
              "status": "source-only-exposed-development-diagnostic",
              "input_sha256": {name: expected for name, expected in EXPECTED.items()},
              "builder_sha256": digest(Path(__file__)),
              "question_anchors_only": True, "answer_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "questions": len(rows), "rows": rows,
              "claim_ceiling": "Anchor presence and selected-state overlap only; not answer reach, score or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": len(rows),
                      "zero_anchor_targets": sum(target["matching_states"] == 0
                                                 for row in rows for target in row["targets"]),
                      "audit_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
