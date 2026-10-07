#!/usr/bin/env python3
"""Audit r36 answers, score deterministic exposed cases, freeze blind judge."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys

ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
RUN = ARCHIVE / "g03-lme-v2-relation-run-r36"
SOURCE = ARCHIVE / "g03-lme-v2-feasibility-20261005/questions.jsonl"
MODULE = ARCHIVE / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    RUN / "RESULT.json": "41cf6ab666b286366c036bd863a0db17900275ce336777fe12540563a1811246",
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}
IDS = ["01307e07", "4dffe641", "83a77f9d", "ca8e070b"]


def digest(path):
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_new(path, data):
    encoded = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    return sha256(encoded).hexdigest()


def main():
    assert len(sys.argv) == 4, "score-wire-map-paths-required"
    score_path, wire_path, map_path = map(Path, sys.argv[1:])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    result = json.loads((RUN / "RESULT.json").read_text())
    freeze = json.loads((RUN / "FREEZE.json").read_text())
    assert result["freeze_sha256"] == digest(RUN / "FREEZE.json")
    assert result["status"] == "completed-four-exposed-development-answers"
    assert result["valid_answers"] == 4
    assert [row["question_id"] for row in result["answer_rows"]] == IDS
    for index, row in enumerate(result["answer_rows"], 1):
        raw_path = RUN / f"ATTEMPT-{index:02d}.json"
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == freeze["ordered_requests"][index - 1]["request_sha256"]
        answer = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(answer.encode()).hexdigest() == row["answer_sha256"]
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r37", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    questions = {}
    with SOURCE.open() as stream:
        for source_line in stream:
            question = json.loads(source_line)
            if question["id"] in IDS:
                questions[question["id"]] = question
    assert set(questions) == set(IDS)
    deterministic = []
    candidates, mapping = [], []
    for index, qid in enumerate(IDS, 1):
        raw = json.loads((RUN / f"ATTEMPT-{index:02d}.json").read_text())
        full = raw["response"]["payload"]["choices"][0]["message"]["content"]
        question = questions[qid]
        final = scorer.extract_boxed_answer(full)
        evaluator = scorer.eval_name(question["eval_function"])
        if evaluator != "llm_abstention_checker":
            correct = scorer.score_to_bool(scorer.eval_from_spec(
                question["eval_function"], final, question["answer"]))
            deterministic.append({"question_id": qid, "eval_name": evaluator,
                                  "correct": correct,
                                  "answer_sha256": result["answer_rows"][index - 1]["answer_sha256"]})
            continue
        messages = scorer._build_abstention_judge_messages(
            question_text=question["question"], reference_answer=question["answer"],
            model_full_response=full, model_final_answer=final)
        for repeat in (1, 2):
            blind_id = sha256(f"are-v2-relation-judge-r37:{qid}:{repeat}".encode()).hexdigest()[:24]
            request = {"model": "glm-5.3-flash", "messages": messages,
                       "max_tokens": 2048, "reasoning_effort": "low",
                       "thinking": {"type": "enabled"}, "stream": False}
            request_sha = sha256(json.dumps(request, separators=(",", ":"),
                                              ensure_ascii=False).encode()).hexdigest()
            candidates.append({"blind_id": blind_id, "request": request,
                               "request_sha256": request_sha})
            mapping.append({"blind_id": blind_id, "question_id": qid,
                            "repeat": repeat,
                            "answer_sha256": result["answer_rows"][index - 1]["answer_sha256"],
                            "answer_raw_sha256": result["answer_rows"][index - 1]["raw_sha256"],
                            "judge_request_sha256": request_sha})
    assert len(deterministic) == 3 and len(candidates) == 2
    candidates.sort(key=lambda item: item["blind_id"])
    mapping.sort(key=lambda item: item["blind_id"])
    score = {"schema_version": "are.g03-lme-v2-relation-r37-partial-score/v1",
             "status": "three-deterministic-one-llm-pending",
             "reader_result_sha256": EXPECTED[RUN / "RESULT.json"],
             "scorer_sha256": digest(Path(__file__)),
             "deterministic": deterministic,
             "llm_question_id": "83a77f9d",
             "claim_ceiling": "Four exposed-development deltas only; no independent superiority"}
    score_sha = write_new(score_path, score)
    wire = {"schema_version": "are.g03-lme-v2-relation-judge-wires-r37/v1",
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
    map_sha = write_new(map_path, {"schema_version": "are.g03-lme-v2-relation-judge-map-r37/v1",
                                    "wire_sha256": wire_sha, "rows": mapping})
    print(json.dumps({"deterministic": deterministic,
                      "score_sha256": score_sha, "wire_sha256": wire_sha,
                      "map_sha256": map_sha}))


if __name__ == "__main__":
    main()
