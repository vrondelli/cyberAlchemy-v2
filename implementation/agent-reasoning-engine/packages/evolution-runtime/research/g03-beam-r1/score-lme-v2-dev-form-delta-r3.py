#!/usr/bin/env python3
"""Score one sealed r3 development delta and bind three inherited r2 answers."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
R2 = ROOT / "g03-lme-v2-dev-two-pair-run-r2"
R3 = ROOT / "g03-lme-v2-dev-form-run-r3"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    R2 / "RESULT.json": "206fa29e99ed92ec9309f3fc99c63c72dc69a96ef74d994e1692a1b55bc6c07e",
    R2 / "SCORE.json": "9164ff0e7aadde59d38f5fe1952e6e6a5dae14314f0a0addf40891786e064c2c",
    R3 / "RESULT.json": "9ed171fddea63a344341cb13266877d8efec081cd4da58b2c7102ac6b726990a",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    target = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    r2_score = json.loads((R2 / "SCORE.json").read_text())
    r2_result = json.loads((R2 / "RESULT.json").read_text())
    r3_result = json.loads((R3 / "RESULT.json").read_text())
    assert r3_result["status"] == "completed-one-development-delta"
    assert r3_result["answer"]["valid"] and r3_result["generation_calls"] == 1
    freeze_path = R3 / "FREEZE.json"
    assert digest(freeze_path) == r3_result["freeze_sha256"]
    freeze = json.loads(freeze_path.read_text())
    assert freeze["predecessor_result_sha256"] == EXPECTED[R2 / "RESULT.json"]
    assert freeze["changed"]["question_id"] == "7e32e4a2"
    assert freeze["changed"]["arm"] == "treatment" and len(freeze["inherited"]) == 3
    r2_rows = {(row["question_id"], row["arm"]): row for row in r2_score["rows"]}
    assert len(r2_rows) == 4
    for inherited in freeze["inherited"]:
        key = (inherited["question_id"], inherited["arm"])
        assert key in r2_rows and key != ("7e32e4a2", "treatment")
        old = r2_result["answer_rows"][inherited["predecessor_ordinal"] - 1]
        assert inherited["answer_sha256"] == old["answer_sha256"] == r2_rows[key]["answer_sha256"]
        assert inherited["predecessor_raw_sha256"] == old["raw_sha256"]
    attempt_path = R3 / "ATTEMPT.json"
    assert digest(attempt_path) == r3_result["answer"]["raw_sha256"]
    attempt = json.loads(attempt_path.read_text())
    assert attempt["request_sha256"] == freeze["changed"]["request_sha256"]
    answer = attempt["response"]["payload"]["choices"][0]["message"]["content"]
    assert isinstance(answer, str) and sha256(answer.encode()).hexdigest() == r3_result["answer"]["answer_sha256"]
    question = None
    with SOURCE.open() as stream:
        for line in stream:
            row = json.loads(line)
            if row["id"] == "7e32e4a2":
                question = {"answer": row["answer"], "eval_function": row["eval_function"]}
                break
    assert question is not None and question["eval_function"].startswith("mc_choice_match|")
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r3", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    parsed = scorer.extract_boxed_answer(answer)
    correct = scorer.score_to_bool(scorer.eval_from_spec(
        question["eval_function"], parsed, question["answer"]))
    delta = {"question_id": "7e32e4a2", "arm": "treatment",
             "evaluator": "mc_choice_match", "correct": correct,
             "answer_sha256": r3_result["answer"]["answer_sha256"],
             "reference_sha256": sha256(str(question["answer"]).encode()).hexdigest(),
             "attempt_sha256": r3_result["answer"]["raw_sha256"],
             "prompt_tokens": r3_result["answer"]["prompt_tokens"],
             "completion_tokens": r3_result["answer"]["completion_tokens"],
             "elapsed_ms": r3_result["answer"]["elapsed_ms"]}
    rows = [delta if (row["question_id"], row["arm"]) ==
            ("7e32e4a2", "treatment") else row for row in r2_score["rows"]]
    assert len(rows) == 4
    output = {"schema_version": "are.g03-lme-v2-dev-form-delta-score-r3/v1",
              "status": "scored-two-exposed-development-pairs-with-one-delta",
              "source_sha256": {str(path): value for path, value in EXPECTED.items()},
              "scorer_script_sha256": digest(Path(__file__)),
              "inherited_answers": 3, "new_generation_calls": 1,
              "rows": rows,
              "control_correct": sum(row["correct"] for row in rows if row["arm"] == "control"),
              "treatment_correct": sum(row["correct"] for row in rows if row["arm"] == "treatment"),
              "claim_ceiling": "Two exposed development pairs; no independent or full-benchmark superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"control_correct": output["control_correct"],
                      "treatment_correct": output["treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
