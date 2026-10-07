#!/usr/bin/env python3
"""Audit all r9 treatment answers and score official deterministic dev rules."""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005"
RUN = ROOT / "g03-lme-v2-dev-state-run-r9"
PRIOR = ROOT / "g03-lme-v2-dev-site-judge-run-r8/SCORE.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE / "DEV-WIRES-R9.json": "ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5",
    SOURCE / "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    PRIOR: "05579acd67ba8d525de190215aa0384197b9b18d33a827722e071895a952993d",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}
DETERMINISTIC = {"mc_choice_match", "mc_choice_set_match", "norm_phrase_set_match",
                 "norm_phrase_set_match_ordered"}


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
    wire = json.loads((SOURCE / "DEV-WIRES-R9.json").read_text())
    prior = json.loads(PRIOR.read_text())
    prior_by_qid = {row["question_id"]: row for row in prior["pairs"]}
    assert len(prior_by_qid) == 28
    freeze_path, result_path = RUN / "FREEZE.json", RUN / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["schema_version"] == "are.g03-lme-v2-dev-state-r9-freeze/v1"
    assert freeze["wire_sha256"] == EXPECTED[SOURCE / "DEV-WIRES-R9.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-28-development-treatments"
    assert result["tokenizer_calls"] == result["generation_calls"] == 28
    assert len(result["tokenizer_rows"]) == len(result["answer_rows"]) == 28
    ids = [row["id"] for row in sorted(wire["rows"], key=lambda row: row["id"])]
    assert [row["question_id"] for row in freeze["ordered_requests"]] == ids
    questions = {}
    with (SOURCE / "questions.jsonl").open() as stream:
        for line in stream:
            q = json.loads(line)
            if q["id"] in ids:
                questions[q["id"]] = q
    assert set(questions) == set(ids)
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_state_r9", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    rows = []
    for index, qid in enumerate(ids, 1):
        token = result["tokenizer_rows"][index - 1]
        answer = result["answer_rows"][index - 1]
        binding = freeze["ordered_requests"][index - 1]
        assert token["ordinal"] == answer["ordinal"] == index
        assert token["question_id"] == answer["question_id"] == binding["question_id"] == qid
        assert token["admitted_8k"]
        assert digest(RUN / f"TOKENIZER-{index:02d}.json") == token["raw_sha256"]
        raw_path = RUN / f"ATTEMPT-{index:02d}.json"
        assert digest(raw_path) == answer["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == binding["request_sha256"]
        assert raw["question_id"] == qid and raw["ordinal"] == index
        text = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(text.encode()).hexdigest() if isinstance(text, str) else None) == answer["answer_sha256"]
        q = questions[qid]
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator in DETERMINISTIC | {"llm_abstention_checker", "llm_gotchas_checker"}
        correct = None
        reason = "pending-blind-glm-judge"
        if not answer["valid"]:
            correct, reason = False, "invalid-answer-counted-incorrect"
        elif evaluator in DETERMINISTIC:
            parsed = scorer.extract_boxed_answer(text)
            correct = scorer.score_to_bool(scorer.eval_from_spec(
                q["eval_function"], parsed, q["answer"]))
            reason = "official-deterministic-rule"
        rows.append({"question_id": qid, "ordinal": index,
                     "question_type": q["question_type"], "evaluator": evaluator,
                     "valid": answer["valid"], "correct": correct,
                     "score_reason": reason,
                     "prior_treatment_correct": prior_by_qid[qid]["site_treatment"],
                     "control_correct": prior_by_qid[qid]["control"],
                     "answer_sha256": answer["answer_sha256"],
                     "raw_sha256": answer["raw_sha256"],
                     "prompt_tokens": answer["prompt_tokens"],
                     "completion_tokens": answer["completion_tokens"]})
    assert len(rows) == 28
    deterministic = [row for row in rows if row["evaluator"] in DETERMINISTIC]
    assert len(deterministic) == 12
    counts = Counter((row["control_correct"], row["correct"]) for row in deterministic)
    output = {"schema_version": "are.g03-lme-v2-dev-state-r9-partial-score/v1",
              "status": "audited-28-answers-12-deterministic-rules",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_sha256": digest(Path(__file__)),
              "development_questions": 28, "deterministic_questions": 12,
              "llm_judged_questions": 16,
              "invalid_answers_counted_incorrect": result["invalid_answers"],
              "deterministic_control_correct": sum(row["control_correct"] is True for row in deterministic),
              "deterministic_state_treatment_correct": sum(row["correct"] is True for row in deterministic),
              "deterministic_prior_treatment_correct": sum(row["prior_treatment_correct"] is True for row in deterministic),
              "deterministic_paired_cells": {"both_correct": counts[(True, True)],
                                            "control_only": counts[(True, False)],
                                            "treatment_only": counts[(False, True)],
                                            "both_incorrect": counts[(False, False)]},
              "rows": rows,
              "claim_ceiling": "Exposed development deterministic subset; no full score, confirmation, or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"],
                      "control_correct": output["deterministic_control_correct"],
                      "prior_treatment_correct": output["deterministic_prior_treatment_correct"],
                      "state_treatment_correct": output["deterministic_state_treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
