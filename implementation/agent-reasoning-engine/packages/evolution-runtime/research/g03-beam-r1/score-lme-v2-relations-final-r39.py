#!/usr/bin/env python3
"""Audit r38 blind judgments and compute exposed r35 transfer delta."""

from hashlib import sha256
import importlib.util
import json
import math
import os
from pathlib import Path
import sys

ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ARCHIVE / "g03-lme-v2-relation-run-r36"
JUDGE = ARCHIVE / "g03-lme-v2-relation-judge-run-r38"
OLD = ARCHIVE / "g03-lme-v2-reserve-judge-run-r20/SCORE-R21.json"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "PARTIAL-SCORE-R37.json": "a0053fadd3c38f42a10ce7c40eb15ef119eea681cd9f30603efdace757def1e1",
    ANSWER / "JUDGE-WIRES-R37.json": "96224539180faa45ce282446f0aa9cac424c33191e4cc3a64ea426cbfc600728",
    ANSWER / "JUDGE-MAP-R37.json": "ac87708e9024ebd2878d512ce70f0af77bc32eac9f9e844bc917f4299874685b",
    JUDGE / "RESULT.json": "22b4734f74e5dcad6c741b6ff5773297c4444cf41b0e28c1e212277e780f2410",
    OLD: "2887ade8a0098320bfb0eac59c829a4d0c3e4554a1487878cea80b32dc76dd4f",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


def digest(path):
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def mcnemar(pairs):
    control_only = sum(row["control"] is True and row["treatment"] is False
                       for row in pairs if row["resolved"])
    treatment_only = sum(row["control"] is False and row["treatment"] is True
                         for row in pairs if row["resolved"])
    total = control_only + treatment_only
    p = min(1.0, 2 * sum(math.comb(total, i) for i in range(min(control_only, treatment_only) + 1))
            / (2 ** total)) if total else 1.0
    return p, control_only, treatment_only


def main():
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert not output_path.exists(), "output-exists"
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    partial = json.loads((ANSWER / "PARTIAL-SCORE-R37.json").read_text())
    wire = json.loads((ANSWER / "JUDGE-WIRES-R37.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R37.json").read_text())
    result = json.loads((JUDGE / "RESULT.json").read_text())
    freeze = json.loads((JUDGE / "FREEZE.json").read_text())
    assert result["freeze_sha256"] == digest(JUDGE / "FREEZE.json")
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R37.json"]
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert result["status"] == "completed-two-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 2
    assert result["invalid_responses"] == 0
    assert len(wire["wires"]) == len(mapping["rows"]) == 2
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 2
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r39", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes, judge_audit = [], []
    for ordinal, (entry, token, judged) in enumerate(zip(
            wire["wires"], result["tokenizer_rows"], result["judge_rows"]), 1):
        blind_id = entry["blind_id"]
        assert token["ordinal"] == judged["ordinal"] == ordinal
        assert token["blind_id"] == judged["blind_id"] == blind_id
        assert token["admitted_8k"] and judged["response_valid"]
        assert by_blind[blind_id]["judge_request_sha256"] == entry["request_sha256"]
        raw_path = JUDGE / f"JUDGE-{ordinal:02d}.json"
        token_path = JUDGE / f"TOKENIZER-{ordinal:02d}.json"
        assert digest(raw_path) == judged["raw_sha256"]
        assert digest(token_path) == token["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == entry["request_sha256"]
        response = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(response.encode()).hexdigest() == judged["answer_sha256"]
        label, _ = scorer._parse_llm_binary_judgement(response)
        votes.append((by_blind[blind_id]["repeat"], label))
        judge_audit.append({"ordinal": ordinal, "blind_id": blind_id,
                            "repeat": by_blind[blind_id]["repeat"],
                            "label": label, "raw_sha256": judged["raw_sha256"]})
    assert sorted(repeat for repeat, _ in votes) == [1, 2]
    labels = [label for _, label in sorted(votes)]
    llm_correct = bool(labels[0]) if labels[0] == labels[1] else None
    changed = {row["question_id"]: row["correct"] for row in partial["deterministic"]}
    assert len(changed) == 3 and partial["llm_question_id"] == "83a77f9d"
    changed["83a77f9d"] = llm_correct
    old = json.loads(OLD.read_text())
    assert len(old["pairs"]) == 26
    old_by_id = {row["question_id"]: row for row in old["pairs"]}
    assert all(old_by_id[qid]["resolved"] and old_by_id[qid]["treatment"] is False
               for qid in changed)
    pairs = []
    for row in old["pairs"]:
        current = dict(row)
        if current["question_id"] in changed:
            current["treatment"] = changed[current["question_id"]]
            current["resolved"] = current["treatment"] is not None
        pairs.append(current)
    p_old, control_old, treatment_old = mcnemar(old["pairs"])
    assert p_old == old["mcnemar_exact_p_resolved"]
    p, control_only, treatment_only = mcnemar(pairs)
    resolved_treatment = sum(row["treatment"] is True for row in pairs if row["resolved"])
    unresolved = sum(not row["resolved"] for row in pairs)
    assert len(pairs) == 26 and unresolved == 1
    output = {"schema_version": "are.g03-lme-v2-relation-r39-final-score/v1",
              "status": "audited-exposed-development-counterfactual-only",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "scorer_sha256": digest(Path(__file__)),
              "changed_treatment_results": changed,
              "judge_labels": labels, "judge_audit": judge_audit,
              "newly_correct_vs_r18": sum(value is True for value in changed.values()),
              "old_resolved_discordant": {"control_only": control_old,
                                          "treatment_only": treatment_old},
              "new_resolved_discordant": {"control_only": control_only,
                                          "treatment_only": treatment_only},
              "counterfactual_treatment_correct_bounds": [resolved_treatment,
                                                          resolved_treatment + unresolved],
              "control_correct_bounds": old["control_correct_bounds"],
              "resolved_pairs": 26 - unresolved,
              "mcnemar_exact_p_resolved_descriptive": p,
              "prespecified_r18_gate_still_failed": True,
              "claim_ceiling": "Repeatedly tuned exposed-development result, not an independent transfer or superiority claim"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"newly_correct_vs_r18": output["newly_correct_vs_r18"],
                      "treatment_bounds": output["counterfactual_treatment_correct_bounds"],
                      "control_bounds": output["control_correct_bounds"],
                      "resolved_p": p, "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
