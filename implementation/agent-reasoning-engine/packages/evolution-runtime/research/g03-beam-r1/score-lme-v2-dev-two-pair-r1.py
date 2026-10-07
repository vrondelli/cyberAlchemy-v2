#!/usr/bin/env python3
"""Score sealed V2 development answers with pinned official deterministic rules."""

from __future__ import annotations

import argparse
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path


EXPECTED = {
    "questions": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    "result": "f40626a1185bc2ae74e29ea98623f070cbc69fcf8c5e20893bfa3e4015eeaa14",
    "official_scorer": "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}
IDS = ("19367bc7", "7e32e4a2")


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source_root", type=Path)
    parser.add_argument("run_root", type=Path)
    parser.add_argument("official_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    qpath = args.source_root / "questions.jsonl"
    rpath = args.run_root / "RESULT.json"
    scorer_path = args.official_root / "evaluation/qa_eval_metrics.py"
    assert digest(qpath) == EXPECTED["questions"]
    assert digest(rpath) == EXPECTED["result"]
    assert digest(scorer_path) == EXPECTED["official_scorer"]
    result = json.loads(rpath.read_text())
    assert result["status"] == "completed-four-development-answers"
    assert len(result["answer_rows"]) == 4
    assert all(row["valid"] for row in result["answer_rows"])
    freeze_path = args.run_root / "FREEZE.json"
    assert digest(freeze_path) == result["freeze_sha256"]
    freeze = json.loads(freeze_path.read_text())
    assert freeze["ids"] == list(IDS) and len(freeze["ordered_requests"]) == 4
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics", scorer_path)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with qpath.open() as source:
        for line in source:
            q = json.loads(line)
            if q["id"] in IDS:
                questions[q["id"]] = {"answer": q["answer"],
                                      "eval_function": q["eval_function"]}
    assert set(questions) == set(IDS)
    rows = []
    for index, summary in enumerate(result["answer_rows"], start=1):
        expected_id, expected_arm = IDS[(index - 1) // 2], ("control", "treatment")[(index - 1) % 2]
        assert summary["ordinal"] == index
        assert (summary["question_id"], summary["arm"]) == (expected_id, expected_arm)
        path = args.run_root / f"ATTEMPT-{index}.json"
        assert digest(path) == summary["raw_sha256"]
        raw = json.loads(path.read_text())
        assert raw["question_id"] == expected_id and raw["arm"] == expected_arm
        assert raw["request_sha256"] == freeze["ordered_requests"][index - 1]["request_sha256"]
        answer_text = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert isinstance(answer_text, str) and sha256(answer_text.encode()).hexdigest() == summary["answer_sha256"]
        parsed = scorer.extract_boxed_answer(answer_text)
        q = questions[expected_id]
        eval_name = scorer.eval_name(q["eval_function"])
        assert eval_name in {"norm_phrase_set_match", "mc_choice_match"}, "non-deterministic-evaluator"
        correct = scorer.score_to_bool(scorer.eval_from_spec(
            q["eval_function"], parsed, q["answer"]))
        rows.append({"question_id": expected_id, "arm": expected_arm,
                     "evaluator": eval_name, "correct": correct,
                     "answer_sha256": summary["answer_sha256"],
                     "reference_sha256": sha256(str(q["answer"]).encode()).hexdigest(),
                     "attempt_sha256": summary["raw_sha256"],
                     "prompt_tokens": summary["prompt_tokens"],
                     "completion_tokens": summary["completion_tokens"],
                     "elapsed_ms": summary["elapsed_ms"]})
    output = {"schema_version": "are.g03-lme-v2-dev-two-pair-score/v1",
              "status": "scored-two-exposed-development-pairs",
              "dataset_revision": "f152293e235517d504809563c833d7190b8c713b",
              "official_harness_commit": "2cc8c540bdb87fe6761629b585e727e1c4704520",
              "source_sha256": EXPECTED,
              "scorer_script_sha256": digest(Path(__file__)),
              "rows": rows,
              "control_correct": sum(row["correct"] for row in rows if row["arm"] == "control"),
              "treatment_correct": sum(row["correct"] for row in rows if row["arm"] == "treatment"),
              "claim_ceiling": "Two exposed development pairs; no independent or full-benchmark superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"], "control_correct": output["control_correct"],
                      "treatment_correct": output["treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
