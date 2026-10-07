#!/usr/bin/env python3
"""Audit r15 reader and r16 blind judges; update exposed development pairs."""

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
ANSWER = ROOT / "g03-lme-v2-dev-destination-run-r15"
JUDGE = ROOT / "g03-lme-v2-dev-destination-judge-run-r16"
PRIOR = ROOT / "g03-lme-v2-dev-form-run-r12b/SCORE.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE / "DEV-WIRES-R15.json": "d3bd2d763beb332d2fdaaee071cbc31f6488f258c33b54ffe16594aec92773f3",
    ANSWER / "RESULT.json": "495f9f7dc7a91d8e34a33aa9e41b1683609b9a781ae39922a985b268b05b22dd",
    ANSWER / "JUDGE-WIRES-R16.json": "c870f118f8c0dd9d7d16db1954847bbb42933333ea3367c5f89939a5b3d73846",
    ANSWER / "JUDGE-MAP-R16.json": "3278b1cabb316952a13749ba2ae4d73b6a40ed55237508d3eb36f375110f8550",
    JUDGE / "RESULT.json": "cfd533588c162ef638c21b33afdfdf854991688fc62a63a4fdc96776a113f0eb",
    PRIOR: "cb485266348ca21a1bf0ea249a73558191363eec494c9a1a9d68d02089b0e9d9",
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
    return min(1.0, 2 * sum(math.comb(n, i) for i in range(k + 1)) / 2**n)


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    wire = json.loads((SOURCE / "DEV-WIRES-R15.json").read_text())
    assert wire["changed_treatment_question_ids"] == ["6a7f0d24"] and len(wire["rows"]) == 28
    prior = json.loads(PRIOR.read_text())
    answer_freeze = json.loads((ANSWER / "FREEZE.json").read_text())
    answer_result = json.loads((ANSWER / "RESULT.json").read_text())
    assert answer_freeze["wire_sha256"] == EXPECTED[SOURCE / "DEV-WIRES-R15.json"]
    assert answer_result["freeze_sha256"] == digest(ANSWER / "FREEZE.json")
    assert answer_result["valid_answer"] and answer_result["admitted_8k"]
    assert answer_result["tokenizer_calls"] == answer_result["generation_calls"] == 1
    assert answer_result["token_raw_sha256"] == digest(ANSWER / "TOKENIZER-01.json")
    assert answer_result["attempt_raw_sha256"] == digest(ANSWER / "ATTEMPT-01.json")
    answer_raw = json.loads((ANSWER / "ATTEMPT-01.json").read_text())
    full = answer_raw["response"]["payload"]["choices"][0]["message"]["content"]
    assert sha256(full.encode()).hexdigest() == answer_result["answer_sha256"]
    judge_wire = json.loads((ANSWER / "JUDGE-WIRES-R16.json").read_text())
    judge_map = json.loads((ANSWER / "JUDGE-MAP-R16.json").read_text())
    judge_freeze = json.loads((JUDGE / "FREEZE.json").read_text())
    judge_result = json.loads((JUDGE / "RESULT.json").read_text())
    assert judge_map["wire_sha256"] == judge_freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R16.json"]
    assert judge_result["freeze_sha256"] == digest(JUDGE / "FREEZE.json")
    assert judge_result["tokenizer_calls"] == judge_result["generation_calls"] == 2
    assert judge_result["invalid_responses"] == 0
    assert len(judge_wire["wires"]) == len(judge_map["rows"]) == 2
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r16_score", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    by_blind = {row["blind_id"]: row for row in judge_map["rows"]}
    assert len(by_blind) == 2
    labels = []
    audits = []
    for ordinal, (entry, token, judged) in enumerate(zip(
            judge_wire["wires"], judge_result["tokenizer_rows"], judge_result["judge_rows"]), 1):
        blind_id = entry["blind_id"]
        assert by_blind[blind_id]["question_id"] == "6a7f0d24"
        assert by_blind[blind_id]["answer_sha256"] == answer_result["answer_sha256"]
        assert by_blind[blind_id]["answer_raw_sha256"] == answer_result["attempt_raw_sha256"]
        assert token["ordinal"] == judged["ordinal"] == ordinal
        assert token["blind_id"] == judged["blind_id"] == blind_id
        assert token["admitted_8k"] and judged["response_valid"]
        assert digest(JUDGE / f"TOKENIZER-{ordinal:02d}.json") == token["raw_sha256"]
        raw_path = JUDGE / f"JUDGE-{ordinal:02d}.json"
        assert digest(raw_path) == judged["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == entry["request_sha256"]
        content = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(content.encode()).hexdigest() == judged["answer_sha256"]
        label, _ = scorer._parse_llm_binary_judgement(content)
        labels.append((by_blind[blind_id]["repeat"], label))
        audits.append({"ordinal": ordinal, "blind_id": blind_id, "label": label,
                       "raw_sha256": judged["raw_sha256"]})
    labels.sort()
    assert [repeat for repeat, _ in labels] == [1, 2]
    verdict = bool(labels[0][1]) if labels[0][1] == labels[1][1] else None
    prior_pairs = {row["question_id"]: row for row in prior["pairs"]}
    assert len(prior_pairs) == 28 and prior_pairs["6a7f0d24"]["r12_treatment"] is False
    pairs = []
    for qid, row in prior_pairs.items():
        current = verdict if qid == "6a7f0d24" else row["r12_treatment"]
        pairs.append({"question_id": qid, "control": row["control"],
                      "r12_treatment": row["r12_treatment"], "r15_treatment": current,
                      "resolved": row["control"] is not None and current is not None})
    resolved = [row for row in pairs if row["resolved"]]
    cells = Counter((row["control"], row["r15_treatment"]) for row in resolved)
    score = {"schema_version": "are.g03-lme-v2-dev-destination-r16-score/v1",
             "status": "audited-exposed-development-only",
             "input_sha256": {str(path): digest(path) for path in EXPECTED},
             "answer_freeze_sha256": digest(ANSWER / "FREEZE.json"),
             "judge_freeze_sha256": digest(JUDGE / "FREEZE.json"),
             "scorer_sha256": digest(Path(__file__)),
             "blind_judge_labels": labels, "blind_judge_audit": audits,
             "changed_answer_verdict": verdict,
             "r12_treatment_correct": prior["r12_treatment_correct"],
             "r15_treatment_correct_bounds": [sum(row["r15_treatment"] is True for row in pairs),
                                              sum(row["r15_treatment"] is not False for row in pairs)],
             "control_correct_bounds": prior["control_correct_bounds"],
             "resolved_pairs": len(resolved),
             "paired_cells_resolved": {"both_correct": cells[(True, True)],
                                       "control_only": cells[(True, False)],
                                       "treatment_only": cells[(False, True)],
                                       "both_incorrect": cells[(False, False)]},
             "mcnemar_exact_p_resolved": exact_mcnemar(cells[(True, False)], cells[(False, True)]),
             "pairs": pairs,
             "claim_ceiling": "Repeatedly exposed custom GLM development comparison; no confirmation or superiority claim"}
    encoded = (json.dumps(score, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"status": score["status"], "judge_labels": labels,
                      "r15_treatment_correct_bounds": score["r15_treatment_correct_bounds"],
                      "paired_cells_resolved": score["paired_cells_resolved"],
                      "mcnemar_exact_p_resolved": score["mcnemar_exact_p_resolved"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
