#!/usr/bin/env python3
"""Audit two exposed menu answers; score deterministic and freeze blind judge."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
RUN = ARCHIVE / "g03-lme-v2-expanded-menu-run-r26"
SOURCE = ARCHIVE / "g03-lme-v2-feasibility-20261005/questions.jsonl"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {RUN / "RESULT.json": "9c5421f0d6e29042ec8612b9d73282096a5c699d7e7c035a20fa3d5bd268acc9",
            SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
            MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac"}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_new(path: Path, data: dict) -> str:
    encoded = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    return sha256(encoded).hexdigest()


def main() -> None:
    assert len(sys.argv) == 4, "score-wire-map-paths-required"
    score_path, wire_path, map_path = map(Path, sys.argv[1:])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    result = json.loads((RUN / "RESULT.json").read_text())
    freeze = json.loads((RUN / "FREEZE.json").read_text())
    assert result["freeze_sha256"] == digest(RUN / "FREEZE.json")
    assert result["status"] == "completed-two-exposed-development-answers"
    assert result["valid_answers"] == 2
    assert [row["question_id"] for row in result["answer_rows"]] == ["01307e07", "83a77f9d"]
    for index, row in enumerate(result["answer_rows"], 1):
        raw_path = RUN / f"ATTEMPT-{index:02d}.json"
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == freeze["ordered_requests"][index - 1]["request_sha256"]
        answer = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(answer.encode()).hexdigest() == row["answer_sha256"]
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r27", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            q = json.loads(line)
            if q["id"] in {"01307e07", "83a77f9d"}:
                questions[q["id"]] = q
    assert set(questions) == {"01307e07", "83a77f9d"}
    raw_one = json.loads((RUN / "ATTEMPT-01.json").read_text())
    full_one = raw_one["response"]["payload"]["choices"][0]["message"]["content"]
    q_one = questions["01307e07"]
    assert scorer.eval_name(q_one["eval_function"]) == "norm_phrase_set_match"
    final_one = scorer.extract_boxed_answer(full_one)
    correct_one = scorer.score_to_bool(scorer.eval_from_spec(
        q_one["eval_function"], final_one, q_one["answer"]))
    raw_two = json.loads((RUN / "ATTEMPT-02.json").read_text())
    full_two = raw_two["response"]["payload"]["choices"][0]["message"]["content"]
    q_two = questions["83a77f9d"]
    assert scorer.eval_name(q_two["eval_function"]) == "llm_abstention_checker"
    final_two = scorer.extract_boxed_answer(full_two)
    messages = scorer._build_abstention_judge_messages(
        question_text=q_two["question"], reference_answer=q_two["answer"],
        model_full_response=full_two, model_final_answer=final_two)
    candidates, mapping = [], []
    for repeat in (1, 2):
        blind_id = sha256(f"are-v2-menu-judge-r27:{q_two['id']}:{repeat}".encode()).hexdigest()[:24]
        request = {"model": "glm-5.3-flash", "messages": messages,
                   "max_tokens": 2048, "reasoning_effort": "low",
                   "thinking": {"type": "enabled"}, "stream": False}
        request_sha = sha256(json.dumps(request, separators=(",", ":"),
                                          ensure_ascii=False).encode()).hexdigest()
        candidates.append({"blind_id": blind_id, "request": request,
                           "request_sha256": request_sha})
        mapping.append({"blind_id": blind_id, "question_id": q_two["id"],
                        "repeat": repeat, "answer_sha256": result["answer_rows"][1]["answer_sha256"],
                        "answer_raw_sha256": result["answer_rows"][1]["raw_sha256"],
                        "judge_request_sha256": request_sha})
    candidates.sort(key=lambda row: row["blind_id"])
    mapping.sort(key=lambda row: row["blind_id"])
    score = {"schema_version": "are.g03-lme-v2-menu-r27-partial-score/v1",
             "status": "one-deterministic-one-llm-pending",
             "reader_result_sha256": EXPECTED[RUN / "RESULT.json"],
             "scorer_sha256": digest(Path(__file__)),
             "deterministic_question_id": q_one["id"], "deterministic_correct": correct_one,
             "llm_question_id": q_two["id"],
             "claim_ceiling": "Two exposed-development deltas only; no confirmation or superiority"}
    score_sha = write_new(score_path, score)
    wire = {"schema_version": "are.g03-lme-v2-menu-judge-wires-r27/v1",
            "status": "frozen-before-judge-provider-calls",
            "source_sha256": {str(path): value for path, value in EXPECTED.items()},
            "builder_sha256": digest(Path(__file__)),
            "model": "glm-5.3-flash", "maximum_judge_calls": 2,
            "automatic_retries": 0, "reference_values_in_private_wire": True,
            "arm_identity_in_provider_messages": False,
            "official_rubric_prompts_reused": True,
            "judge_model_differs_from_official_default": True,
            "claim_ceiling": "Exposed-development GLM-adapted rubric judgments only",
            "wires": candidates}
    wire_sha = write_new(wire_path, wire)
    map_sha = write_new(map_path, {"schema_version": "are.g03-lme-v2-menu-judge-map-r27/v1",
                                    "wire_sha256": wire_sha, "rows": mapping})
    print(json.dumps({"deterministic_correct": correct_one,
                      "score_sha256": score_sha, "wire_sha256": wire_sha,
                      "map_sha256": map_sha}))


if __name__ == "__main__":
    main()
