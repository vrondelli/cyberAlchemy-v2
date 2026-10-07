#!/usr/bin/env python3
"""Source-only screen for bounded expanded-menu regions in r18 selected states.

Question text chooses the dropdown intent; source AXTree supplies the full
ordered menu/list region. No reference answers or confirmation question fields.
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
    "RESERVE-DEV-WIRES-R18.json": "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
    "trajectories.jsonl": "363cec9a8e87aa8d9101ce4e600aadbf7031d674056ebe4f969e8424abc5f3c6",
}
INTENT = re.compile(r"\b(?:dropdown|drop-down|filter option labels|sorting.criteria)\b", re.I)
MENU = re.compile(r"\bmenu(?:item)?\b|hasPopup='menu'|\blist(?:item)?\b", re.I)
STOP = re.compile(r"\b(?:article|main|grid|table|footer|contentinfo)\b", re.I)


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


def indent(line: str) -> int:
    return len(line) - len(line.lstrip("\t "))


def menu_regions(tree: str, question: str, terms) -> list[dict]:
    lines = [line for line in tree.replace("\\n", "\n").splitlines() if line.strip()]
    qterms = terms(question)
    regions = []
    for index, line in enumerate(lines):
        if not ("expanded=True" in line and "hasPopup='menu'" in line or
                re.search(r"\bmenu '[^']+'", line, re.I)):
            continue
        level = indent(line)
        selected = [(index, line)]
        for next_index in range(index + 1, min(len(lines), index + 42)):
            nxt = lines[next_index]
            if STOP.search(nxt) and indent(nxt) <= level:
                break
            if indent(nxt) < level:
                break
            if (indent(nxt) == level and next_index > index + 1 and
                    not MENU.search(nxt) and not re.search(r"\b(?:link|button)\b", nxt, re.I)):
                break
            selected.append((next_index, nxt))
        # Do not confuse page chrome with an opened choice menu. An observed
        # region must include several selectable items in bounded succession.
        choices = [(line_index, value) for line_index, value in selected[1:]
                   if re.search(r"\b(?:menuitem|link|option)\b", value, re.I)]
        if len(choices) < 3:
            continue
        overlap = len(terms(" ".join(value for _, value in selected)) & qterms)
        header_overlap = len(terms(line) & qterms)
        score = 5 * header_overlap + overlap + min(len(choices), 12) / 10
        rendered = "\n".join(f"L{line_index}: {value.strip()[:320]}"
                             for line_index, value in selected)
        regions.append({"start_line": index, "end_line": selected[-1][0],
                        "header": line.strip()[:220], "choice_count": len(choices),
                        "score": score, "evidence": rendered[:4500],
                        "evidence_sha256": sha256(rendered[:4500].encode()).hexdigest()})
    return regions


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for name, expected in EXPECTED.items():
        assert digest(ROOT / name) == expected, f"source-drift:{name}"
    wire = json.loads((ROOT / "RESERVE-DEV-WIRES-R18.json").read_text())
    # Multiple-choice distractors may mention a dropdown even when the
    # question is not asking for an opened menu's contents.
    targets = [row for row in wire["rows"]
               if INTENT.search(row["question"].partition("\nA.")[0])]
    needed = {item["trajectory_id"] for row in targets
              for item in row["arms"]["treatment"]["selection"]
              if item["kind"] == "page-state"}
    trajectories = {}
    with (ROOT / "trajectories.jsonl").open() as stream:
        for source_line in stream:
            raw = json.loads(source_line)
            if raw["id"] in needed:
                trajectories[raw["id"]] = raw
    assert set(trajectories) == needed
    line = module("lme_v2_line_r24", "build-lme-v2-line-window-r2.py")
    results = []
    for row in targets:
        candidates = []
        for selected in row["arms"]["treatment"]["selection"]:
            if selected["kind"] != "page-state":
                continue
            tid, index = selected["trajectory_id"], int(selected["state_index"])
            state = trajectories[tid]["states"][index]
            for region in menu_regions(str(state.get("accessibility_tree") or ""),
                                       row["question"], line.terms):
                region.update({"trajectory_id": tid, "state_index": index})
                candidates.append(region)
        candidates.sort(key=lambda item: (-item["score"], -item["choice_count"],
                                          item["trajectory_id"], item["state_index"],
                                          item["start_line"]))
        results.append({"question_id": row["id"],
                        "question_sha256": sha256(row["question"].encode()).hexdigest(),
                        "selected_source_regions": len(candidates),
                        "top_regions": candidates[:4]})
    output = {"schema_version": "are.g03-lme-v2-expanded-menu-screen-r24/v1",
              "status": "source-only-exposed-development-screen",
              "input_sha256": EXPECTED, "builder_sha256": digest(Path(__file__)),
              "question_text_only_for_intent": True,
              "answer_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "eligible_questions": len(targets), "rows": results,
              "claim_ceiling": "Expanded-menu region availability only; no answer, score, or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"eligible_questions": len(targets),
                      "with_region": sum(bool(row["top_regions"]) for row in results),
                      "result_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
