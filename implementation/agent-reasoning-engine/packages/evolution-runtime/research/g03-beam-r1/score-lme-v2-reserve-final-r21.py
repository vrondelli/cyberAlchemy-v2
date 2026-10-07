#!/usr/bin/env python3
"""Audit arm-blind r20 votes and decide the preregistered r18 advancement gate."""

from collections import Counter, defaultdict
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ARCHIVE / "g03-lme-v2-reserve-dev-run-r18"
JUDGE = ARCHIVE / "g03-lme-v2-reserve-judge-run-r20"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "DETERMINISTIC-SCORE-R19.json": "c2e9bed37ec4ecaea4193e2a4031748d3cb594285290cd9d5f9e15b03c14877a",
    ANSWER / "JUDGE-WIRES-R20.json": "889c5904897d2e222ad4d4c96d62d16b838a24438314999467992adf0953a792",
    ANSWER / "JUDGE-MAP-R20.json": "ff11acc1c18c28aa44b7eae85a95b10e8e043236d36ded4d6ebbac9bc72e92ee",
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
    lower = min(control_only, treatment_only)
    return min(1.0, 2 * sum(math.comb(n, k) for k in range(lower + 1)) / (2 ** n))


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    deterministic = json.loads((ANSWER / "DETERMINISTIC-SCORE-R19.json").read_text())
    wire = json.loads((ANSWER / "JUDGE-WIRES-R20.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R20.json").read_text())
    freeze_path, result_path = JUDGE / "FREEZE.json", JUDGE / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R20.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-56-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 56
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert len(wire["wires"]) == len(mapping["rows"]) == 56
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 56
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r21", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes = defaultdict(list)
    judge_audit = []
    assert len(result["tokenizer_rows"]) == len(result["judge_rows"]) == 56
    for ordinal, (entry, token, judged) in enumerate(zip(
            wire["wires"], result["tokenizer_rows"], result["judge_rows"]), 1):
        blind_id = entry["blind_id"]
        assert token["ordinal"] == judged["ordinal"] == ordinal
        assert token["blind_id"] == judged["blind_id"] == blind_id
        assert token["admitted_8k"]
        assert by_blind[blind_id]["judge_request_sha256"] == entry["request_sha256"]
        token_path = JUDGE / f"TOKENIZER-{ordinal:02d}.json"
        raw_path = JUDGE / f"JUDGE-{ordinal:02d}.json"
        assert digest(token_path) == token["raw_sha256"]
        assert digest(raw_path) == judged["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["ordinal"] == ordinal and raw["blind_id"] == blind_id
        assert raw["request_sha256"] == entry["request_sha256"]
        answer = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(answer.encode()).hexdigest() if isinstance(answer, str) else None) == judged["answer_sha256"]
        label = None
        reason = "invalid-provider-response" if not judged["response_valid"] else "unparseable-judge-output"
        if judged["response_valid"]:
            try:
                label, _ = scorer._parse_llm_binary_judgement(answer)
                reason = "official-parser"
            except ValueError:
                pass
        key = (by_blind[blind_id]["question_id"], by_blind[blind_id]["arm"])
        votes[key].append((by_blind[blind_id]["repeat"], label))
        judge_audit.append({"ordinal": ordinal, "blind_id": blind_id,
                            "question_id": key[0], "arm": key[1],
                            "repeat": by_blind[blind_id]["repeat"],
                            "label": label, "reason": reason,
                            "raw_sha256": judged["raw_sha256"]})
    assert len(votes) == 28
    verdicts = {}
    for key, repeated in votes.items():
        assert sorted(repeat for repeat, _ in repeated) == [1, 2]
        labels = [label for _, label in sorted(repeated)]
        verdicts[key] = labels[0] if labels[0] is not None and labels[0] == labels[1] else None
    rows = []
    for original in deterministic["rows"]:
        row = dict(original)
        if row["score_reason"] == "pending-independent-llm-judge":
            key = (row["question_id"], row["arm"])
            row["correct"] = bool(verdicts[key]) if verdicts[key] is not None else None
            row["score_reason"] = "glm-two-pass-agreement" if verdicts[key] is not None else "glm-two-pass-unresolved"
            row["judge_labels"] = [label for _, label in sorted(votes[key])]
        rows.append(row)
    by_qid = defaultdict(dict)
    for row in rows:
        by_qid[row["question_id"]][row["arm"]] = row
    assert len(by_qid) == 26 and all(set(arms) == {"control", "treatment"} for arms in by_qid.values())
    pairs = []
    for qid, arms in sorted(by_qid.items()):
        control, treatment = arms["control"]["correct"], arms["treatment"]["correct"]
        pairs.append({"question_id": qid, "domain": arms["control"]["domain"],
                      "question_type": arms["control"]["question_type"],
                      "control": control, "treatment": treatment,
                      "resolved": control is not None and treatment is not None})
    resolved = [row for row in pairs if row["resolved"]]
    counts = Counter((row["control"], row["treatment"]) for row in resolved)
    control_min = sum(row["control"] is True for row in pairs)
    treatment_min = sum(row["treatment"] is True for row in pairs)
    control_max = control_min + sum(row["control"] is None for row in pairs)
    treatment_max = treatment_min + sum(row["treatment"] is None for row in pairs)
    p_value = exact_mcnemar(counts[(True, False)], counts[(False, True)])
    gate = (len(resolved) == 26 and treatment_min >= 14 and
            treatment_min - control_min >= 8 and p_value <= 0.05 and
            result["invalid_responses"] == 0)
    output = {"schema_version": "are.g03-lme-v2-reserve-dev-r21-final-score/v1",
              "status": "audited-second-development-only",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_sha256": digest(Path(__file__)),
              "development_pairs": 26, "deterministic_pairs": 12, "glm_judged_pairs": 14,
              "invalid_judge_responses": result["invalid_responses"],
              "unresolved_arm_scores": sum(value is None for value in verdicts.values()),
              "resolved_pairs": len(resolved), "unresolved_pairs": 26 - len(resolved),
              "control_correct_bounds": [control_min, control_max],
              "treatment_correct_bounds": [treatment_min, treatment_max],
              "paired_cells_resolved": {"both_correct": counts[(True, True)],
                                        "control_only": counts[(True, False)],
                                        "treatment_only": counts[(False, True)],
                                        "both_incorrect": counts[(False, False)]},
              "mcnemar_exact_p_resolved": p_value,
              "preregistered_gate": {"absolute_treatment_minimum": 14,
                                     "paired_correct_advantage_minimum": 8,
                                     "mcnemar_exact_p_maximum": 0.05,
                                     "all_reader_and_judge_valid_required": True,
                                     "passed": gate},
              "judge_audit": judge_audit, "pairs": pairs,
              "claim_ceiling": "Separate 26-question GLM-adapted development comparison; gate to confirmation only, never official V2 or product superiority"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"resolved_pairs": len(resolved),
                      "control_bounds": output["control_correct_bounds"],
                      "treatment_bounds": output["treatment_correct_bounds"],
                      "paired_cells": output["paired_cells_resolved"],
                      "mcnemar_p": p_value, "gate_passed": gate,
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
