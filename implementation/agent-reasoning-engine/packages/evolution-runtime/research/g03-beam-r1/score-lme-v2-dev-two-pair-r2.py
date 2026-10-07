#!/usr/bin/env python3
"""Score the sealed r2 line-window development pilot; never score holdout IDs."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
RUN = ROOT / "g03-lme-v2-dev-two-pair-run-r2"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
IDS = ("19367bc7", "7e32e4a2")
HASHES = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    RUN / "RESULT.json": "206fa29e99ed92ec9309f3fc99c63c72dc69a96ef74d994e1692a1b55bc6c07e",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    for path, expected in HASHES.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    result = json.loads((RUN / "RESULT.json").read_text())
    assert result["status"] == "completed-four-development-answers"
    assert len(result["answer_rows"]) == 4 and all(row["valid"] for row in result["answer_rows"])
    freeze_path = RUN / "FREEZE.json"
    assert digest(freeze_path) == result["freeze_sha256"]
    freeze = json.loads(freeze_path.read_text())
    assert freeze["ids"] == list(IDS) and len(freeze["ordered_requests"]) == 4
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r2", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            q = json.loads(line)
            if q["id"] in IDS:
                questions[q["id"]] = {"answer": q["answer"], "eval_function": q["eval_function"]}
    assert set(questions) == set(IDS)
    rows = []
    for index, summary in enumerate(result["answer_rows"], 1):
        qid = IDS[(index - 1) // 2]
        arm = ("control", "treatment")[(index - 1) % 2]
        assert (summary["ordinal"], summary["question_id"], summary["arm"]) == (index, qid, arm)
        path = RUN / f"ATTEMPT-{index}.json"
        assert digest(path) == summary["raw_sha256"]
        attempt = json.loads(path.read_text())
        assert attempt["request_sha256"] == freeze["ordered_requests"][index - 1]["request_sha256"]
        answer = attempt["response"]["payload"]["choices"][0]["message"]["content"]
        assert isinstance(answer, str) and sha256(answer.encode()).hexdigest() == summary["answer_sha256"]
        q = questions[qid]
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator in {"norm_phrase_set_match", "mc_choice_match"}
        parsed = scorer.extract_boxed_answer(answer)
        correct = scorer.score_to_bool(scorer.eval_from_spec(q["eval_function"], parsed, q["answer"]))
        rows.append({"question_id": qid, "arm": arm, "evaluator": evaluator,
                     "correct": correct, "answer_sha256": summary["answer_sha256"],
                     "reference_sha256": sha256(str(q["answer"]).encode()).hexdigest(),
                     "attempt_sha256": summary["raw_sha256"],
                     "prompt_tokens": summary["prompt_tokens"],
                     "completion_tokens": summary["completion_tokens"],
                     "elapsed_ms": summary["elapsed_ms"]})
    output = {"schema_version": "are.g03-lme-v2-dev-two-pair-score-r2/v1",
              "status": "scored-two-exposed-development-pairs",
              "source_sha256": {str(path): value for path, value in HASHES.items()},
              "scorer_script_sha256": digest(Path(__file__)),
              "rows": rows,
              "control_correct": sum(row["correct"] for row in rows if row["arm"] == "control"),
              "treatment_correct": sum(row["correct"] for row in rows if row["arm"] == "treatment"),
              "claim_ceiling": "Two exposed development pairs; no independent or full-benchmark superiority claim"}
    encoded = (json.dumps(output, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"control_correct": output["control_correct"],
                      "treatment_correct": output["treatment_correct"],
                      "score_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
