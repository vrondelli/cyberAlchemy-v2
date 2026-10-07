#!/usr/bin/env python3
"""Audit the exact r12 changed-answer receipt and inherited identical requests."""

from collections import Counter
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005"
RUN = ROOT / "g03-lme-v2-dev-form-run-r12b"
PRIOR = ROOT / "g03-lme-v2-dev-state-judge-run-r10/SCORE.json"
R5 = ROOT / "g03-lme-v2-dev-full-run-r5"
R4 = ROOT / "g03-lme-v2-dev-full-run-r4"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE / "DEV-WIRES-R12B.json": "a4acebf4dde831d8fbc249f364b4b266bdace8a74d8e0aca295672108e14ebbd",
    SOURCE / "DEV-WIRES-R9.json": "ec1c38232e217281958ad9976c2d519012c75882cd3de26962856573ed6eb9a5",
    SOURCE / "DEV-WIRES-R3.json": "4389fc85179fe99aeae9faa91e59bbfb3d37b90c6e542611edb405f69d38593b",
    SOURCE / "questions.jsonl": "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    PRIOR: "627690ef89dc59fca5949a7448732efd19d3f80a91209dad2d8fdb5f0ccb6a2e",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def exact_mcnemar(control_only: int, treatment_only: int) -> float:
    n = control_only + treatment_only
    if n == 0:
        return 1.0
    return min(1.0, 2 * sum(math.comb(n, k) for k in range(min(control_only, treatment_only) + 1)) / 2**n)


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    wire = json.loads((SOURCE / "DEV-WIRES-R12B.json").read_text())
    parent = json.loads((SOURCE / "DEV-WIRES-R9.json").read_text())
    r3 = json.loads((SOURCE / "DEV-WIRES-R3.json").read_text())
    prior = json.loads(PRIOR.read_text())
    freeze_path, result_path = RUN / "FREEZE.json", RUN / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[SOURCE / "DEV-WIRES-R12B.json"]
    assert freeze["prior_wire_sha256"] == EXPECTED[SOURCE / "DEV-WIRES-R9.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["tokenizer_calls"] == result["generation_calls"] == 1
    assert result["admitted_8k"] and result["valid_answer"]
    token_path, attempt_path = RUN / "TOKENIZER-01.json", RUN / "ATTEMPT-01.json"
    assert result["token_raw_sha256"] == digest(token_path)
    assert result["attempt_raw_sha256"] == digest(attempt_path)
    token, attempt = json.loads(token_path.read_text()), json.loads(attempt_path.read_text())
    assert token["request_sha256"] == attempt["request_sha256"] == freeze["request_sha256"]
    assert token["admitted_8k"] and token["prompt_tokens"] + freeze["max_tokens"] <= 8192
    answer = attempt["response"]["payload"]["choices"][0]["message"]["content"]
    assert sha256(answer.encode()).hexdigest() == result["answer_sha256"]
    assert attempt["response"]["payload"]["choices"][0]["finish_reason"] == "stop"
    by_qid = {row["id"]: row for row in wire["rows"]}
    old_by_qid = {row["id"]: row for row in parent["rows"]}
    r3_by_qid = {row["id"]: row for row in r3["rows"]}
    assert list(by_qid) == list(old_by_qid) and len(by_qid) == 28
    assert wire["changed_treatment_question_ids"] == ["19367bc7", "7e32e4a2"]
    for qid, row in by_qid.items():
        before = old_by_qid[qid]
        assert row["question"] == before["question"] and row["arms"]["control"] == before["arms"]["control"]
        if qid not in wire["changed_treatment_question_ids"]:
            assert row["arms"]["treatment"] == before["arms"]["treatment"]
    q7 = "7e32e4a2"
    assert by_qid[q7]["arms"]["treatment"]["evidence"] == r3_by_qid[q7]["arms"]["treatment"]["evidence"]
    old_freeze, old_result = json.loads((R5 / "FREEZE.json").read_text()), json.loads((R5 / "RESULT.json").read_text())
    old_request = next(row for row in old_freeze["ordered_requests"] if row["question_id"] == q7 and row["arm"] == "treatment")
    assert old_request["request_sha256"] == "fc565dcef59f4f86df5ca9139cb6c5f3de6749cf519266de8c70cf82fcad36ab"
    old_answer = next(row for row in old_result["answer_rows"] if row["question_id"] == q7 and row["arm"] == "treatment")
    assert old_answer["valid"] and old_answer["raw_source"] == "r4-terminal-root"
    old_raw_path = R4 / f"ATTEMPT-{old_answer['ordinal']:02d}.json"
    assert old_answer["raw_sha256"] == digest(old_raw_path)
    old_raw = json.loads(old_raw_path.read_text())
    assert old_raw["request_sha256"] == old_request["request_sha256"]
    question = None
    with (SOURCE / "questions.jsonl").open() as stream:
        for line in stream:
            item = json.loads(line)
            if item["id"] == "19367bc7":
                question = item
                break
    assert question
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r12", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    assert scorer.eval_name(question["eval_function"]) == "norm_phrase_set_match"
    q193_correct = scorer.score_to_bool(scorer.eval_from_spec(
        question["eval_function"], scorer.extract_boxed_answer(answer), question["answer"]))
    prior_pairs = {row["question_id"]: row for row in prior["pairs"]}
    assert len(prior_pairs) == 28 and prior_pairs[q7]["prior_treatment"] is True
    pairs = []
    for qid, row in prior_pairs.items():
        treatment = (q193_correct if qid == "19367bc7" else
                     True if qid == q7 else row["state_treatment"])
        pairs.append({"question_id": qid, "control": row["control"],
                      "r9_treatment": row["state_treatment"], "r12_treatment": treatment,
                      "resolved": row["control"] is not None and treatment is not None})
    resolved = [row for row in pairs if row["resolved"]]
    cells = Counter((row["control"], row["r12_treatment"]) for row in resolved)
    score = {"schema_version": "are.g03-lme-v2-dev-form-hybrid-r12-score/v1",
             "status": "audited-exposed-development-only",
             "input_sha256": {str(path): digest(path) for path in EXPECTED},
             "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
             "scorer_sha256": digest(Path(__file__)),
             "changed_answer_correct": q193_correct,
             "inherited_identical_form_request_sha256": old_request["request_sha256"],
             "r9_treatment_correct": sum(row["state_treatment"] is True for row in prior_pairs.values()),
             "r12_treatment_correct": sum(row["r12_treatment"] is True for row in pairs),
             "control_correct_bounds": [sum(row["control"] is True for row in pairs),
                                        sum(row["control"] is not False for row in pairs)],
             "resolved_pairs": len(resolved),
             "paired_cells_resolved": {"both_correct": cells[(True, True)],
                                       "control_only": cells[(True, False)],
                                       "treatment_only": cells[(False, True)],
                                       "both_incorrect": cells[(False, False)]},
             "mcnemar_exact_p_resolved": exact_mcnemar(cells[(True, False)], cells[(False, True)]),
             "pairs": pairs,
             "claim_ceiling": "Exposed custom GLM development comparison; no confirmation or superiority claim"}
    encoded = (json.dumps(score, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": score["status"], "changed_answer_correct": q193_correct,
                      "r12_treatment_correct": score["r12_treatment_correct"],
                      "paired_cells_resolved": score["paired_cells_resolved"],
                      "mcnemar_exact_p_resolved": score["mcnemar_exact_p_resolved"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
