#!/usr/bin/env python3
"""Audit r8 judge receipts and compare r7 site scope on 28 exposed pairs."""

from collections import Counter, defaultdict
from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ROOT / "g03-lme-v2-dev-site-run-r7b"
JUDGE = ROOT / "g03-lme-v2-dev-site-judge-run-r8"
OLD = ROOT / "g03-lme-v2-dev-judge-run-r6/SCORE.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "PARTIAL-SCORE.json": "350657f5343d45b07afd787031f58bb109c66649ed1af4ce77733b67cba0a7d1",
    ANSWER / "JUDGE-WIRES-R8.json": "5b742c088bbd200cf6327f6671e274c1b46cf537652e681add691300477fadaa",
    ANSWER / "JUDGE-MAP-R8.json": "767ebd37db06db47e86dad824173df07aff5da6d574796f9ce33edf993b58f21",
    OLD: "870e8b9a13681db489911a4fab60f78a477f3e2a30fd51141346df708f50e13a",
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
    wire = json.loads((ANSWER / "JUDGE-WIRES-R8.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R8.json").read_text())
    old = json.loads(OLD.read_text())
    freeze_path, result_path = JUDGE / "FREEZE.json", JUDGE / "RESULT.json"
    freeze, result = json.loads(freeze_path.read_text()), json.loads(result_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R8.json"]
    assert result["freeze_sha256"] == digest(freeze_path)
    assert result["status"] == "completed-8-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 8
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert len(wire["wires"]) == len(mapping["rows"]) == 8
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 8
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_site_score", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes = defaultdict(list)
    judge_audit = []
    assert len(result["tokenizer_rows"]) == len(result["judge_rows"]) == 8
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
    assert len(votes) == 4
    verdicts = {}
    for qid, repeated in votes.items():
        assert sorted(repeat for repeat, _ in repeated) == [1, 2]
        labels = [label for _, label in sorted(repeated)]
        verdicts[qid] = bool(labels[0]) if labels[0] is not None and labels[0] == labels[1] else None
    new_by_qid = {}
    for row in partial["rows"]:
        qid = row["question_id"]
        assert qid not in new_by_qid
        new_by_qid[qid] = verdicts[qid] if row["score_reason"] == "new-glm-judgment-required" else row["correct"]
    assert len(new_by_qid) == 10 and set(verdicts).issubset(new_by_qid)
    pairs = []
    for old_pair in old["pairs"]:
        qid = old_pair["question_id"]
        candidate = new_by_qid.get(qid, old_pair["treatment"])
        pairs.append({"question_id": qid, "question_type": old_pair["question_type"],
                      "control": old_pair["control"], "prior_treatment": old_pair["treatment"],
                      "site_treatment": candidate,
                      "changed_evidence": qid in new_by_qid,
                      "resolved": old_pair["control"] is not None and candidate is not None})
    assert len(pairs) == 28 and sum(row["changed_evidence"] for row in pairs) == 10
    resolved = [row for row in pairs if row["resolved"]]
    cells = Counter((row["control"], row["site_treatment"]) for row in resolved)
    control_min = sum(row["control"] is True for row in pairs)
    treatment_min = sum(row["site_treatment"] is True for row in pairs)
    output = {"schema_version": "are.g03-lme-v2-dev-site-r8-final-score/v1",
              "status": "audited-exposed-development-only",
              "input_sha256": {str(path): digest(path) for path in EXPECTED},
              "freeze_sha256": digest(freeze_path), "result_sha256": digest(result_path),
              "scorer_script_sha256": digest(Path(__file__)),
              "development_pairs": 28, "changed_treatment_evidence": 10,
              "new_invalid_answers_counted_incorrect": sum(
                  row["score_reason"] == "invalid-answer-counted-incorrect"
                  for row in partial["rows"]),
              "invalid_judge_responses": result["invalid_responses"],
              "unresolved_new_judge_arms": sum(value is None for value in verdicts.values()),
              "resolved_pairs": len(resolved), "unresolved_pairs": len(pairs) - len(resolved),
              "control_correct_bounds_all_28": [control_min, control_min + sum(row["control"] is None for row in pairs)],
              "site_treatment_correct_bounds_all_28": [treatment_min, treatment_min + sum(row["site_treatment"] is None for row in pairs)],
              "prior_treatment_correct_bounds_all_28": old["treatment_correct_bounds_all_28"],
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
                      "site_treatment_correct_bounds_all_28": output["site_treatment_correct_bounds_all_28"],
                      "paired_cells_resolved": output["paired_cells_resolved"],
                      "mcnemar_exact_p_resolved": output["mcnemar_exact_p_resolved"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
