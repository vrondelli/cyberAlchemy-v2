#!/usr/bin/env python3
"""Audit frozen GLM judge receipts and score exposed V2 development pairs."""

from collections import Counter, defaultdict
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ROOT / "g03-lme-v2-dev-full-run-r5"
JUDGE = ROOT / "g03-lme-v2-dev-judge-run-r6"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "DETERMINISTIC-SCORE.json": "13ebb2dcf3bd205777a15c0f921bafc941c6c8bc4278c21d713f17d945d3bf3f",
    ANSWER / "JUDGE-WIRES-R6.json": "4911e989cc02f030d35c955ec4a7bae7323f3c894fac4da15956cf4b01dc94d6",
    ANSWER / "JUDGE-MAP-R6.json": "85e45a8cd683b638daffee7053eda9fde6bf9cdf9ad0365fc232fc11ab5fe04c",
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
    score = json.loads((ANSWER / "DETERMINISTIC-SCORE.json").read_text())
    wire = json.loads((ANSWER / "JUDGE-WIRES-R6.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R6.json").read_text())
    freeze_path, result_path = JUDGE / "FREEZE.json", JUDGE / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R6.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-64-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 64
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert len(wire["wires"]) == len(mapping["rows"]) == 64
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 64
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_judge_score", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes = defaultdict(list)
    judge_audit = []
    assert len(result["tokenizer_rows"]) == len(result["judge_rows"]) == 64
    for ordinal, (entry, token_row, result_row) in enumerate(zip(
            wire["wires"], result["tokenizer_rows"], result["judge_rows"]), 1):
        blind_id = entry["blind_id"]
        assert token_row["ordinal"] == result_row["ordinal"] == ordinal
        assert token_row["blind_id"] == result_row["blind_id"] == blind_id
        assert token_row["admitted_8k"]
        assert by_blind[blind_id]["judge_request_sha256"] == entry["request_sha256"]
        token_path = JUDGE / f"TOKENIZER-{ordinal:02d}.json"
        raw_path = JUDGE / f"JUDGE-{ordinal:02d}.json"
        assert digest(token_path) == token_row["raw_sha256"]
        assert digest(raw_path) == result_row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["ordinal"] == ordinal and raw["blind_id"] == blind_id
        assert raw["request_sha256"] == entry["request_sha256"]
        answer = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(answer.encode()).hexdigest() if isinstance(answer, str) else None) == result_row["answer_sha256"]
        label = None
        reason = "invalid-provider-response" if not result_row["response_valid"] else "unparseable-judge-output"
        if result_row["response_valid"]:
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
                            "raw_sha256": result_row["raw_sha256"]})
    assert len(votes) == 32
    verdicts = {}
    for key, repeated in votes.items():
        assert sorted(repeat for repeat, _ in repeated) == [1, 2]
        labels = [label for _, label in sorted(repeated)]
        verdicts[key] = labels[0] if labels[0] is not None and labels[0] == labels[1] else None
    rows = []
    for original in score["rows"]:
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
    assert len(by_qid) == 28 and all(set(arms) == {"control", "treatment"} for arms in by_qid.values())
    pairs = []
    for qid, arms in sorted(by_qid.items()):
        control, treatment = arms["control"]["correct"], arms["treatment"]["correct"]
        pairs.append({"question_id": qid, "question_type": arms["control"]["question_type"],
                      "control": control, "treatment": treatment,
                      "resolved": control is not None and treatment is not None})
    resolved = [row for row in pairs if row["resolved"]]
    counts = Counter((row["control"], row["treatment"]) for row in resolved)
    unresolved = len(pairs) - len(resolved)
    treatment_min = sum(row["treatment"] is True for row in pairs)
    control_min = sum(row["control"] is True for row in pairs)
    output = {"schema_version": "are.g03-lme-v2-dev-r6-glm-adapted-score/v1",
              "status": "audited-exposed-development-only",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_script_sha256": digest(Path(__file__)),
              "development_pairs": 28, "deterministic_pairs": 12, "glm_judged_pairs": 16,
              "invalid_answer_counted_incorrect": 1,
              "invalid_judge_responses": result["invalid_responses"],
              "unresolved_arm_scores": sum(value is None for value in verdicts.values()),
              "resolved_pairs": len(resolved), "unresolved_pairs": unresolved,
              "resolved_control_correct": sum(row["control"] is True for row in resolved),
              "resolved_treatment_correct": sum(row["treatment"] is True for row in resolved),
              "control_correct_bounds_all_28": [control_min, control_min + sum(row["control"] is None for row in pairs)],
              "treatment_correct_bounds_all_28": [treatment_min, treatment_min + sum(row["treatment"] is None for row in pairs)],
              "paired_cells_resolved": {"both_correct": counts[(True, True)],
                                        "control_only": counts[(True, False)],
                                        "treatment_only": counts[(False, True)],
                                        "both_incorrect": counts[(False, False)]},
              "mcnemar_exact_p_resolved": exact_mcnemar(counts[(True, False)], counts[(False, True)]),
              "judge_audit": judge_audit, "pairs": pairs,
              "claim_ceiling": "Exposed 28-question GLM-adapted development comparison; not native official V2, confirmation, or product superiority"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"], "resolved_pairs": len(resolved),
                      "control_correct_bounds_all_28": output["control_correct_bounds_all_28"],
                      "treatment_correct_bounds_all_28": output["treatment_correct_bounds_all_28"],
                      "paired_cells_resolved": output["paired_cells_resolved"],
                      "mcnemar_exact_p_resolved": output["mcnemar_exact_p_resolved"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
