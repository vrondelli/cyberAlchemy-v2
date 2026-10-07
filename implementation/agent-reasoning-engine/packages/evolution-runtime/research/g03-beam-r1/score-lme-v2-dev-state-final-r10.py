#!/usr/bin/env python3
"""Audit r10 judge receipts and score r9's exposed 28 development pairs."""

from collections import Counter, defaultdict
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ROOT / "g03-lme-v2-dev-state-run-r9"
JUDGE = ROOT / "g03-lme-v2-dev-state-judge-run-r10"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "PARTIAL-SCORE.json": "2d7b4fc1e8356ca196c3df1b3ca782b38efdf38a3ecbfef379d3add798903522",
    ANSWER / "JUDGE-WIRES-R10.json": "beb3d7a5567a98a7c4eb2fe8d8a8e3e553df9111b745338bd762f910dd99b0f4",
    ANSWER / "JUDGE-MAP-R10.json": "0367f0aac52c9f400d19237c3eb7cb27dc10ffb170247bab27c96ad21609c361",
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
    k = min(control_only, treatment_only)
    return min(1.0, 2 * sum(math.comb(n, index) for index in range(k + 1)) / (2 ** n))


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    partial = json.loads((ANSWER / "PARTIAL-SCORE.json").read_text())
    wire = json.loads((ANSWER / "JUDGE-WIRES-R10.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R10.json").read_text())
    freeze_path, result_path = JUDGE / "FREEZE.json", JUDGE / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R10.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-32-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 32
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert len(wire["wires"]) == len(mapping["rows"]) == 32
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 32
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_state_final", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes = defaultdict(list)
    judge_audit = []
    assert len(result["tokenizer_rows"]) == len(result["judge_rows"]) == 32
    for ordinal, (entry, token, row) in enumerate(zip(
            wire["wires"], result["tokenizer_rows"], result["judge_rows"]), 1):
        blind_id = entry["blind_id"]
        assert token["ordinal"] == row["ordinal"] == ordinal
        assert token["blind_id"] == row["blind_id"] == blind_id
        assert token["admitted_8k"] and by_blind[blind_id]["request_sha256"] == entry["request_sha256"]
        assert digest(JUDGE / f"TOKENIZER-{ordinal:02d}.json") == token["raw_sha256"]
        raw_path = JUDGE / f"JUDGE-{ordinal:02d}.json"
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["ordinal"] == ordinal and raw["blind_id"] == blind_id
        assert raw["request_sha256"] == entry["request_sha256"]
        content = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(content.encode()).hexdigest() if isinstance(content, str) else None) == row["answer_sha256"]
        label = None
        reason = "invalid-provider-response" if not row["response_valid"] else "unparseable-judge-output"
        if row["response_valid"]:
            try:
                label, _ = scorer._parse_llm_binary_judgement(content)
                reason = "official-parser"
            except ValueError:
                pass
        qid = by_blind[blind_id]["question_id"]
        votes[qid].append((by_blind[blind_id]["repeat"], label))
        judge_audit.append({"ordinal": ordinal, "blind_id": blind_id,
                            "question_id": qid, "repeat": by_blind[blind_id]["repeat"],
                            "label": label, "reason": reason,
                            "raw_sha256": row["raw_sha256"]})
    assert len(votes) == 16
    verdicts = {}
    for qid, repeated in votes.items():
        assert sorted(repeat for repeat, _ in repeated) == [1, 2]
        labels = [label for _, label in sorted(repeated)]
        verdicts[qid] = bool(labels[0]) if labels[0] is not None and labels[0] == labels[1] else None
    pairs = []
    for row in partial["rows"]:
        qid = row["question_id"]
        treatment = verdicts[qid] if row["score_reason"] == "pending-blind-glm-judge" else row["correct"]
        pairs.append({"question_id": qid, "question_type": row["question_type"],
                      "control": row["control_correct"],
                      "prior_treatment": row["prior_treatment_correct"],
                      "state_treatment": treatment,
                      "judge_labels": [label for _, label in sorted(votes[qid])] if qid in votes else None,
                      "resolved": row["control_correct"] is not None and treatment is not None})
    assert len(pairs) == 28 and len({row["question_id"] for row in pairs}) == 28
    resolved = [row for row in pairs if row["resolved"]]
    cells = Counter((row["control"], row["state_treatment"]) for row in resolved)
    control_min = sum(row["control"] is True for row in pairs)
    treatment_min = sum(row["state_treatment"] is True for row in pairs)
    prior_min = sum(row["prior_treatment"] is True for row in pairs)
    output = {"schema_version": "are.g03-lme-v2-dev-state-r10-final-score/v1",
              "status": "audited-exposed-development-only",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_script_sha256": digest(Path(__file__)),
              "development_pairs": 28, "deterministic_pairs": 12, "glm_judged_pairs": 16,
              "invalid_answers_counted_incorrect": partial["invalid_answers_counted_incorrect"],
              "invalid_judge_responses": result["invalid_responses"],
              "unresolved_new_judge_arms": sum(value is None for value in verdicts.values()),
              "resolved_pairs": len(resolved), "unresolved_pairs": len(pairs) - len(resolved),
              "control_correct_bounds_all_28": [control_min, control_min + sum(row["control"] is None for row in pairs)],
              "prior_treatment_correct_bounds_all_28": [prior_min, prior_min + sum(row["prior_treatment"] is None for row in pairs)],
              "state_treatment_correct_bounds_all_28": [treatment_min, treatment_min + sum(row["state_treatment"] is None for row in pairs)],
              "paired_cells_resolved": {"both_correct": cells[(True, True)],
                                        "control_only": cells[(True, False)],
                                        "treatment_only": cells[(False, True)],
                                        "both_incorrect": cells[(False, False)]},
              "mcnemar_exact_p_resolved": exact_mcnemar(cells[(True, False)], cells[(False, True)]),
              "judge_audit": judge_audit, "pairs": pairs,
              "claim_ceiling": "Exposed 28-question GLM-adapted development comparison; no confirmation or superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": output["status"],
                      "control_correct_bounds_all_28": output["control_correct_bounds_all_28"],
                      "prior_treatment_correct_bounds_all_28": output["prior_treatment_correct_bounds_all_28"],
                      "state_treatment_correct_bounds_all_28": output["state_treatment_correct_bounds_all_28"],
                      "paired_cells_resolved": output["paired_cells_resolved"],
                      "mcnemar_exact_p_resolved": output["mcnemar_exact_p_resolved"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
