#!/usr/bin/env python3
"""Audit all r18 reader receipts, then score only official deterministic rules."""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ARCHIVE / "g03-lme-v2-feasibility-20261005/questions.jsonl"
WIRE = ARCHIVE / "g03-lme-v2-feasibility-20261005/RESERVE-DEV-WIRES-R18.json"
RUN = ARCHIVE / "g03-lme-v2-reserve-dev-run-r18"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
            WIRE: "f4d01912d4b95a02deec2b4f382bbcf773c8edd9886dda1839a5709335dfac21",
            MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac"}
DETERMINISTIC = {"mc_choice_match", "mc_choice_set_match",
                 "norm_phrase_set_match", "norm_phrase_set_match_ordered"}
PENDING = {"llm_abstention_checker", "llm_gotchas_checker"}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"source-drift:{path.name}"
    result_path = RUN / "RESULT.json"
    result = json.loads(result_path.read_text())
    assert result["status"] == "completed-52-second-development-answers"
    assert result["tokenizer_calls"] == result["generation_calls"] == 52
    assert result["valid_answers"] == 52 and result["invalid_answers"] == 0
    assert len(result["answer_rows"]) == len(result["tokenizer_rows"]) == 52
    freeze_path = RUN / "FREEZE.json"
    assert digest(freeze_path) == result["freeze_sha256"]
    freeze = json.loads(freeze_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[WIRE]
    # The exact request-order binding is checked against each raw receipt below.
    for index, (token, answer) in enumerate(zip(result["tokenizer_rows"],
                                                result["answer_rows"]), 1):
        assert token["ordinal"] == answer["ordinal"] == index
        assert token["question_id"] == answer["question_id"]
        assert token["arm"] == answer["arm"]
        assert token["admitted_8k"] and answer["valid"]
        assert freeze["ordered_requests"][index - 1]["question_id"] == answer["question_id"]
        assert freeze["ordered_requests"][index - 1]["arm"] == answer["arm"]
        for prefix, digest_field in (("TOKENIZER", token["raw_sha256"]),
                                     ("ATTEMPT", answer["raw_sha256"])):
            path = RUN / f"{prefix}-{index:02d}.json"
            assert digest(path) == digest_field, f"raw-drift:{prefix}:{index}"
        raw = json.loads((RUN / f"ATTEMPT-{index:02d}.json").read_text())
        assert raw["request_sha256"] == freeze["ordered_requests"][index - 1]["request_sha256"]
        full = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(full.encode()).hexdigest() == answer["answer_sha256"]
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r19", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    ids = {row["question_id"] for row in result["answer_rows"]}
    assert len(ids) == 26
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            raw = json.loads(line)
            if raw["id"] in ids:
                questions[raw["id"]] = {"question": raw["question"],
                                        "answer": raw["answer"],
                                        "eval_function": raw["eval_function"],
                                        "question_type": raw["question_type"],
                                        "domain": raw["domain"]}
    assert set(questions) == ids
    rows = []
    for answer in result["answer_rows"]:
        qid = answer["question_id"]
        q = questions[qid]
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator in DETERMINISTIC | PENDING
        correct = None
        reason = "pending-independent-llm-judge" if evaluator in PENDING else "official-deterministic-rule"
        if evaluator in DETERMINISTIC:
            raw = json.loads((RUN / f'ATTEMPT-{answer["ordinal"]:02d}.json').read_text())
            full = raw["response"]["payload"]["choices"][0]["message"]["content"]
            parsed = scorer.extract_boxed_answer(full)
            correct = scorer.score_to_bool(scorer.eval_from_spec(q["eval_function"],
                                                                 parsed, q["answer"]))
        rows.append({"ordinal": answer["ordinal"], "question_id": qid,
                     "arm": answer["arm"], "domain": q["domain"],
                     "question_type": q["question_type"], "evaluator": evaluator,
                     "valid": answer["valid"], "correct": correct,
                     "score_reason": reason,
                     "reference_sha256": sha256(str(q["answer"]).encode()).hexdigest(),
                     "answer_sha256": answer["answer_sha256"],
                     "raw_sha256": answer["raw_sha256"],
                     "prompt_tokens": answer["prompt_tokens"],
                     "completion_tokens": answer["completion_tokens"]})
    counts = Counter((row["arm"], row["correct"]) for row in rows
                     if row["correct"] is not None)
    pending_ids = {row["question_id"] for row in rows if row["correct"] is None}
    output = {"schema_version": "are.g03-lme-v2-reserve-dev-r19-deterministic/v1",
              "status": "deterministic-scored-llm-pending",
              "input_sha256": {str(path): expected for path, expected in EXPECTED.items()},
              "reader_result_sha256": digest(result_path),
              "reader_freeze_sha256": digest(freeze_path),
              "scorer_sha256": digest(Path(__file__)),
              "development_questions": 26,
              "deterministic_questions": 26 - len(pending_ids),
              "llm_judged_questions_pending": len(pending_ids),
              "deterministic_control_correct": counts[("control", True)],
              "deterministic_treatment_correct": counts[("treatment", True)],
              "rows": rows,
              "claim_ceiling": "Separate development deterministic subset only; no confirmation or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"deterministic_questions": output["deterministic_questions"],
                      "pending_questions": len(pending_ids),
                      "control_correct": output["deterministic_control_correct"],
                      "treatment_correct": output["deterministic_treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
