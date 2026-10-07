#!/usr/bin/env python3
"""Audit r7b answer delta and apply official deterministic development rules."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005"
RUN = ROOT / "g03-lme-v2-dev-site-run-r7b"
OLD_SCORE = ROOT / "g03-lme-v2-dev-judge-run-r6/SCORE.json"
OLD_AUDIT = ROOT / "g03-lme-v2-dev-full-run-r5/AUDIT.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE / "DEV-WIRES-R7.json": "dc0896dd41756d35ddb4645a4f5598b2761bd0a760e547e0c37744caa6ccf97d",
    SOURCE / "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    OLD_SCORE: "870e8b9a13681db489911a4fab60f78a477f3e2a30fd51141346df708f50e13a",
    OLD_AUDIT: "4b77b5e4199c83f0325637ec478b944a13edfd389af6faee58bea1e06bae9511",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}
DETERMINISTIC = {"mc_choice_match", "mc_choice_set_match", "norm_phrase_set_match",
                 "norm_phrase_set_match_ordered"}


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
        assert digest(path) == expected, f"input-drift:{path.name}"
    wire = json.loads((SOURCE / "DEV-WIRES-R7.json").read_text())
    old = json.loads(OLD_SCORE.read_text())
    old_audit = json.loads(OLD_AUDIT.read_text())
    freeze_path, result_path = RUN / "FREEZE.json", RUN / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["schema_version"] == "are.g03-lme-v2-dev-site-r7b-freeze/v1"
    assert freeze["wire_sha256"] == EXPECTED[SOURCE / "DEV-WIRES-R7.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-10-changed-development-treatments"
    assert result["tokenizer_calls"] == result["generation_calls"] == 10
    assert len(result["tokenizer_rows"]) == len(result["answer_rows"]) == 10
    changed = wire["changed_treatment_question_ids"]
    assert len(changed) == 10 and [row["question_id"] for row in freeze["ordered_requests"]] == changed
    old_by_key = {(row["question_id"], row["arm"]): row
                  for row in old_audit["rows"]}
    assert len(old_by_key) == 56
    old_correct = {pair["question_id"]: pair["treatment"] for pair in old["pairs"]}
    assert len(old_correct) == 28
    questions = {}
    with (SOURCE / "questions.jsonl").open() as stream:
        for line in stream:
            question = json.loads(line)
            if question["id"] in changed:
                questions[question["id"]] = question
    assert set(questions) == set(changed)
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_site_r7b", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    rows = []
    for index, qid in enumerate(changed, 1):
        token = result["tokenizer_rows"][index - 1]
        answer = result["answer_rows"][index - 1]
        binding = freeze["ordered_requests"][index - 1]
        assert token["ordinal"] == answer["ordinal"] == index
        assert token["question_id"] == answer["question_id"] == binding["question_id"] == qid
        assert token["admitted_8k"]
        assert digest(RUN / f"TOKENIZER-{index:02d}.json") == token["raw_sha256"]
        path = RUN / f"ATTEMPT-{index:02d}.json"
        assert digest(path) == answer["raw_sha256"]
        raw = json.loads(path.read_text())
        assert raw["request_sha256"] == binding["request_sha256"]
        assert raw["question_id"] == qid and raw["ordinal"] == index
        text = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(text.encode()).hexdigest() if isinstance(text, str) else None) == answer["answer_sha256"]
        old_row = old_by_key[(qid, "treatment")]
        evaluator = scorer.eval_name(questions[qid]["eval_function"])
        correct = None
        reason = "new-glm-judgment-required"
        if not answer["valid"]:
            correct, reason = False, "invalid-answer-counted-incorrect"
        elif answer["answer_sha256"] == old_row["answer_sha256"]:
            correct, reason = old_correct[qid], "identical-answer-inherited-score"
        elif evaluator in DETERMINISTIC:
            parsed = scorer.extract_boxed_answer(text)
            correct = scorer.score_to_bool(scorer.eval_from_spec(
                questions[qid]["eval_function"], parsed, questions[qid]["answer"]))
            reason = "official-deterministic-rule"
        else:
            assert evaluator in {"llm_abstention_checker", "llm_gotchas_checker"}
        rows.append({"question_id": qid, "ordinal": index, "evaluator": evaluator,
                     "valid": answer["valid"], "correct": correct, "score_reason": reason,
                     "old_correct": old_correct[qid], "answer_sha256": answer["answer_sha256"],
                     "old_answer_sha256": old_row["answer_sha256"],
                     "raw_sha256": answer["raw_sha256"],
                     "prompt_tokens": answer["prompt_tokens"],
                     "completion_tokens": answer["completion_tokens"]})
    assert len(rows) == 10
    output = {"schema_version": "are.g03-lme-v2-dev-site-r7b-partial-score/v1",
              "status": "audited-answer-delta-pending-llm-judgments",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_sha256": digest(Path(__file__)),
              "changed_treatments": 10,
              "deterministic_changed": sum(row["evaluator"] in DETERMINISTIC for row in rows),
              "new_judgment_required": sum(row["score_reason"] == "new-glm-judgment-required" for row in rows),
              "rows": rows,
              "claim_ceiling": "Exposed development delta; no confirmation or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"],
                      "new_judgment_required": output["new_judgment_required"],
                      "deterministic_changed": output["deterministic_changed"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
