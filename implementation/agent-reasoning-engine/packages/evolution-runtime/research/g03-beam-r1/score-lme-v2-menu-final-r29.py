#!/usr/bin/env python3
"""Audit two blind r28 judgments and score the two exposed menu deltas."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
ANSWER = ARCHIVE / "g03-lme-v2-expanded-menu-run-r26"
JUDGE = ARCHIVE / "g03-lme-v2-menu-judge-run-r28"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    ANSWER / "PARTIAL-SCORE-R27.json": "1651e62048fd286dac599adb793292f0abc7ec9269145e99000bba646085f58e",
    ANSWER / "JUDGE-WIRES-R27.json": "855ba6160bbbbbd55bd4197293da647804d1a74f7979037b050741449d86f930",
    ANSWER / "JUDGE-MAP-R27.json": "2827b2b16187f2308f9b7187857f53ef9a42080c38a927a81b545cd1ad0633e1",
    JUDGE / "RESULT.json": "7b2ff54c663ce94f42f82e2a992c32656387a81aefa228285c913d9f2fa360cd",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


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
    partial = json.loads((ANSWER / "PARTIAL-SCORE-R27.json").read_text())
    wire = json.loads((ANSWER / "JUDGE-WIRES-R27.json").read_text())
    mapping = json.loads((ANSWER / "JUDGE-MAP-R27.json").read_text())
    result = json.loads((JUDGE / "RESULT.json").read_text())
    freeze_path = JUDGE / "FREEZE.json"
    freeze = json.loads(freeze_path.read_text())
    assert result["freeze_sha256"] == digest(freeze_path)
    assert freeze["wire_sha256"] == EXPECTED[ANSWER / "JUDGE-WIRES-R27.json"]
    assert mapping["wire_sha256"] == freeze["wire_sha256"]
    assert result["status"] == "completed-two-judge-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 2
    assert result["invalid_responses"] == 0
    assert len(wire["wires"]) == len(mapping["rows"]) == 2
    by_blind = {row["blind_id"]: row for row in mapping["rows"]}
    assert len(by_blind) == 2
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r29", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    votes, audit = [], []
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
        audit.append({"ordinal": ordinal, "blind_id": blind_id,
                      "repeat": by_blind[blind_id]["repeat"],
                      "label": label, "raw_sha256": judged["raw_sha256"]})
    assert sorted(repeat for repeat, _ in votes) == [1, 2]
    ordered_labels = [label for _, label in sorted(votes)]
    second_correct = (bool(ordered_labels[0]) if ordered_labels[0] == ordered_labels[1]
                      else None)
    assert partial["deterministic_question_id"] == "01307e07"
    assert partial["llm_question_id"] == "83a77f9d"
    output = {"schema_version": "are.g03-lme-v2-menu-r29-final-score/v1",
              "status": "audited-two-exposed-development-deltas-only",
              "input_sha256": {str(path): value for path, value in EXPECTED.items()},
              "scorer_sha256": digest(Path(__file__)),
              "deterministic_question_correct": partial["deterministic_correct"],
              "llm_question_correct": second_correct,
              "judge_labels": ordered_labels, "judge_audit": audit,
              "newly_correct_count": int(partial["deterministic_correct"]) + int(second_correct is True),
              "claim_ceiling": "Two already exposed development deltas only; no confirmation, independent improvement, or superiority"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"deterministic_correct": output["deterministic_question_correct"],
                      "llm_correct": output["llm_question_correct"],
                      "newly_correct": output["newly_correct_count"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
