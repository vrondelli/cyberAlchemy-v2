#!/usr/bin/env python3
"""Score only official deterministic rules after the r5 56-attempt audit."""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
R4 = ROOT / "g03-lme-v2-dev-full-run-r4"
R5 = ROOT / "g03-lme-v2-dev-full-run-r5"
AUDIT = R5 / "AUDIT.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    AUDIT: "4b77b5e4199c83f0325637ec478b944a13edfd389af6faee58bea1e06bae9511",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}
DETERMINISTIC = {"mc_choice_match", "mc_choice_set_match",
                 "norm_phrase_set_match", "norm_phrase_set_match_ordered"}
PENDING = {"llm_abstention_checker", "llm_gotchas_checker"}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    audit = json.loads(AUDIT.read_text())
    assert audit["status"] == "passed-56-attempts-28-pairs-one-invalid"
    assert len(audit["rows"]) == 56
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_full", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    dev_ids = {row["question_id"] for row in audit["rows"]}
    assert len(dev_ids) == 28
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            q = json.loads(line)
            if q["id"] in dev_ids:
                questions[q["id"]] = {"answer": q["answer"],
                                      "eval_function": q["eval_function"],
                                      "question_type": q["question_type"],
                                      "domain": q["domain"]}
    assert set(questions) == dev_ids
    rows = []
    for row in audit["rows"]:
        q = questions[row["question_id"]]
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator in DETERMINISTIC | PENDING
        correctness = None
        reason = "pending-independent-llm-judge" if evaluator in PENDING else "official-deterministic-rule"
        if not row["valid"]:
            correctness = False
            reason = "invalid-answer-counts-incorrect"
        elif evaluator in DETERMINISTIC:
            raw_root = R4 if row["ordinal"] <= 28 else R5
            raw_path = raw_root / f'ATTEMPT-{row["ordinal"]:02d}.json'
            assert digest(raw_path) == row["raw_sha256"]
            raw = json.loads(raw_path.read_text())
            text = raw["response"]["payload"]["choices"][0]["message"]["content"]
            assert sha256(text.encode()).hexdigest() == row["answer_sha256"]
            parsed = scorer.extract_boxed_answer(text)
            correctness = scorer.score_to_bool(scorer.eval_from_spec(
                q["eval_function"], parsed, q["answer"]))
        rows.append({"ordinal": row["ordinal"], "question_id": row["question_id"],
                     "arm": row["arm"], "domain": q["domain"],
                     "question_type": q["question_type"], "evaluator": evaluator,
                     "valid": row["valid"], "correct": correctness,
                     "score_reason": reason,
                     "reference_sha256": sha256(str(q["answer"]).encode()).hexdigest(),
                     "answer_sha256": row["answer_sha256"],
                     "raw_sha256": row["raw_sha256"],
                     "prompt_tokens": row["prompt_tokens"],
                     "completion_tokens": row["completion_tokens"]})
    deterministic_ids = {qid for qid, q in questions.items() if
                         scorer.eval_name(q["eval_function"]) in DETERMINISTIC}
    pending_ids = dev_ids - deterministic_ids
    assert len(deterministic_ids) == 12 and len(pending_ids) == 16
    counts = Counter((row["arm"], row["correct"]) for row in rows
                     if row["question_id"] in deterministic_ids)
    output = {"schema_version": "are.g03-lme-v2-dev-r5-deterministic-score/v1",
              "status": "twelve-deterministic-pairs-scored-sixteen-llm-pairs-pending",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "scorer_script_sha256": digest(Path(__file__)),
              "development_questions": 28, "deterministic_questions": 12,
              "llm_judged_questions_pending": 16,
              "invalid_answers_counted_incorrect": 1,
              "deterministic_control_correct": counts[("control", True)],
              "deterministic_treatment_correct": counts[("treatment", True)],
              "rows": rows,
              "claim_ceiling": "Exposed development deterministic subset only; no full V2 score or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"],
                      "control_correct": output["deterministic_control_correct"],
                      "treatment_correct": output["deterministic_treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
