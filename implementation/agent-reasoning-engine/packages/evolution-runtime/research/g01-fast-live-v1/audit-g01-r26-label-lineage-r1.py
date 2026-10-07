#!/usr/bin/env python3
"""Evaluator-only audit of the exposed G01 r26 TypeScript gold lineage.

This script must never be imported by a source selector or benchmark arm. It
does not change a frozen prediction, native score, or task definition.
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


INSTANCE = "Multi-SWE-Bench__typescript__maintenance__bugfix__8d2ac221"
PARQUET_SHA = "2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8"
PREDICTION_SHA = "ff87c9c053183808113fa3634bc5325186b2c6619c47fb5cff1dca83237ea92c"
SCORE_SHA = "4dc90bd74a30049d957937f9dd2162cb63a5cfe49a4371cf2b75042c829d5279"
SELECTED_PATH = "packages/runtime-core/src/componentSlots.ts"
CALLER_PATH = "packages/runtime-core/src/renderer.ts"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def numbered_lines(annotation):
    start, end = annotation["start_line"], annotation["end_line"]
    rows = annotation.get("content", "").splitlines()
    if len(rows) != end - start + 1:
        raise ValueError("annotation-line-count")
    content = []
    for number, row in enumerate(rows, start):
        match = re.fullmatch(r"(\d+)\t(.*)", row)
        if match is None or int(match.group(1)) != number:
            raise ValueError("annotation-numbering")
        content.append(match.group(2))
    return content


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--prediction", type=Path, required=True)
    parser.add_argument("--score", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    parquet = args.upstream / "data/full.parquet"
    if (sha(parquet), sha(args.prediction), sha(args.score)) != (
        PARQUET_SHA, PREDICTION_SHA, SCORE_SHA
    ):
        raise ValueError("pinned-input-drift")
    sys.path.insert(0, str(args.upstream))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

    gold = GoldLoader(str(parquet)).get(INSTANCE)
    prediction = json.loads(args.prediction.read_text())
    score = json.loads(args.score.read_text())
    if gold is None or prediction.get("instance_id") != INSTANCE:
        raise ValueError("instance-mismatch")
    if prediction["traj_data"]["pred_files"] != [SELECTED_PATH]:
        raise ValueError("selected-path-drift")
    if score["native"]["final"]["file"]["intersection"] != 0:
        raise ValueError("native-score-drift")

    annotations = []
    for index, item in enumerate(gold.init + gold.add):
        relative = _normalize_rel_path(item["file"])
        path = (args.base / relative).resolve()
        if not path.is_relative_to(args.base.resolve()) or not path.is_file():
            raise ValueError("annotation-source-unavailable")
        base_lines = path.read_text(errors="replace").splitlines()
        start, end = item["start_line"], item["end_line"]
        content = numbered_lines(item)
        annotations.append({
            "index": index,
            "group": "init" if index < len(gold.init) else "add",
            "path": relative,
            "start_line": start,
            "end_line": end,
            "base_line_count": len(base_lines),
            "numbered_content_exactly_matches_base": (
                1 <= start <= end <= len(base_lines)
                and content == base_lines[start - 1:end]
            ),
            "source_sha256": sha(path),
        })
    patch = (gold._data.get("patch") or "") + "\n" + (
        gold._data.get("test_patch") or ""
    )
    patch_paths = sorted(set(re.findall(r"(?m)^\+\+\+ b/(.+)$", patch)))
    caller_lines = (args.base / CALLER_PATH).read_text().splitlines()
    import_lines = [i for i, line in enumerate(caller_lines, 1)
                    if "from './componentSlots'" in line]
    call_lines = [i for i, line in enumerate(caller_lines, 1)
                  if "updateSlots(" in line]
    gold_ranges = [(a["start_line"], a["end_line"])
                   for a in annotations if a["path"] == CALLER_PATH]
    if len(annotations) != 1 or not annotations[0]["numbered_content_exactly_matches_base"]:
        raise ValueError("unexpected-annotation-lineage")
    result = {
        "schema_version": "are.g01-r26-label-lineage-audit/v1",
        "posture": "evaluator-only-post-score; exposed task; no prediction or score mutation",
        "instance_id": INSTANCE,
        "gold_parquet_sha256": PARQUET_SHA,
        "prediction_sha256": PREDICTION_SHA,
        "native_score_sha256": SCORE_SHA,
        "annotations": annotations,
        "reference_patch_paths": patch_paths,
        "reference_patch_sha256": hashlib.sha256(patch.encode()).hexdigest(),
        "selected_paths": prediction["traj_data"]["pred_files"],
        "source_only_direct_relation": {
            "caller_path": CALLER_PATH,
            "import_lines": import_lines,
            "update_slots_call_lines": call_lines,
            "call_lines_in_gold_range": [line for line in call_lines
                                         if any(start <= line <= end
                                                for start, end in gold_ranges)],
        },
        "claim_ceiling": (
            "The gold context matches the pinned base and differs from the reference "
            "patch path. This is a metric-target distinction, not proof of a scorer "
            "defect, source-selector improvement, or superiority."
        ),
        "open_questions": [
            "Can a score-blind, task-grounded context relationship recover gold-range evidence across exposed tasks without hurting precision or cost?",
            "Does an independently label-screened fresh cohort reproduce any qualified gains?",
        ],
    }
    args.out.parent.mkdir(parents=True, exist_ok=False)
    with args.out.open("x") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    args.out.chmod(0o600)
    print(json.dumps({"status": "audited", "result_sha256": sha(args.out),
                      "annotation_paths": [row["path"] for row in annotations],
                      "patch_paths": patch_paths,
                      "direct_call_in_gold": bool(result["source_only_direct_relation"]
                                                  ["call_lines_in_gold_range"])}))


if __name__ == "__main__":
    main()
