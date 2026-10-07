#!/usr/bin/env python3
"""Freeze arm-blind, two-pass GLM judge wires for V2 development answers."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
R4 = ROOT / "g03-lme-v2-dev-full-run-r4"
R5 = ROOT / "g03-lme-v2-dev-full-run-r5"
AUDIT = R5 / "AUDIT.json"
PARTIAL = R5 / "DETERMINISTIC-SCORE.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    AUDIT: "4b77b5e4199c83f0325637ec478b944a13edfd389af6faee58bea1e06bae9511",
    PARTIAL: "13ebb2dcf3bd205777a15c0f921bafc941c6c8bc4278c21d713f17d945d3bf3f",
    MODULE: "f8ba659e237c4282a07a92538090ea500ce8483820b390b1d19af187c01417ac",
}


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def write_new(path: Path, payload: dict) -> str:
    encoded = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    return sha256(encoded).hexdigest()


def main() -> None:
    assert len(sys.argv) == 3, "wire-and-map-paths-required"
    wire_path, map_path = Path(sys.argv[1]), Path(sys.argv[2])
    for path, expected in EXPECTED.items():
        assert digest(path) == expected, f"input-drift:{path.name}"
    audit = json.loads(AUDIT.read_text())
    partial = json.loads(PARTIAL.read_text())
    assert audit["status"] == "passed-56-attempts-28-pairs-one-invalid"
    assert partial["llm_judged_questions_pending"] == 16
    pending = {(row["question_id"], row["arm"]): row for row in partial["rows"]
               if row["score_reason"] == "pending-independent-llm-judge"}
    assert len(pending) == 32 and all(row["valid"] for row in pending.values())
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_judge", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    qids = {qid for qid, _ in pending}
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            q = json.loads(line)
            if q["id"] in qids:
                questions[q["id"]] = {"question": q["question"], "answer": q["answer"],
                                      "eval_function": q["eval_function"]}
    assert set(questions) == qids and len(qids) == 16
    candidates = []
    mapping = []
    for qid, arm in sorted(pending):
        row = pending[(qid, arm)]
        q = questions[qid]
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator in {"llm_abstention_checker", "llm_gotchas_checker"}
        raw_root = R4 if row["ordinal"] <= 28 else R5
        raw_path = raw_root / f'ATTEMPT-{row["ordinal"]:02d}.json'
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        full = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(full.encode()).hexdigest() == row["answer_sha256"]
        final = scorer.extract_boxed_answer(full)
        build = (scorer._build_abstention_judge_messages if evaluator ==
                 "llm_abstention_checker" else scorer._build_gotchas_judge_messages)
        messages = build(question_text=q["question"], reference_answer=q["answer"],
                         model_full_response=full, model_final_answer=final)
        for repeat in (1, 2):
            blind_id = sha256(f'are-v2-judge-r6:{qid}:{arm}:{repeat}'.encode()).hexdigest()[:24]
            request = {"model": "glm-5.3-flash", "messages": messages,
                       "max_tokens": 2048, "reasoning_effort": "low",
                       "thinking": {"type": "enabled"}, "stream": False}
            request_sha = sha256(json.dumps(request, separators=(",", ":"),
                                              ensure_ascii=False).encode()).hexdigest()
            candidates.append({"blind_id": blind_id, "request": request,
                               "request_sha256": request_sha})
            mapping.append({"blind_id": blind_id, "question_id": qid, "arm": arm,
                            "repeat": repeat, "evaluator": evaluator,
                            "answer_sha256": row["answer_sha256"],
                            "reference_sha256": sha256(str(q["answer"]).encode()).hexdigest(),
                            "answer_raw_sha256": row["raw_sha256"],
                            "judge_request_sha256": request_sha})
    candidates.sort(key=lambda row: row["blind_id"])
    mapping.sort(key=lambda row: row["blind_id"])
    assert len(candidates) == len(mapping) == 64
    assert len({row["blind_id"] for row in candidates}) == 64
    wire = {"schema_version": "are.g03-lme-v2-dev-blind-judge-wires-r6/v1",
            "status": "frozen-before-judge-provider-calls",
            "source_sha256": {str(path): value for path, value in EXPECTED.items()},
            "builder_sha256": digest(Path(__file__)),
            "model": "glm-5.3-flash", "maximum_judge_calls": 64,
            "automatic_retries": 0, "reference_values_in_private_wire": True,
            "arm_identity_in_provider_messages": False,
            "official_rubric_prompts_reused": True,
            "judge_model_differs_from_official_default": True,
            "claim_ceiling": "Exposed development GLM-adapted rubric judgments; not native V2 or superiority",
            "wires": candidates}
    private_map = {"schema_version": "are.g03-lme-v2-dev-blind-judge-map-r6/v1",
                   "wire_sha256": None, "rows": mapping,
                   "claim_ceiling": "Private arm map, not an independent score"}
    wire_sha = write_new(wire_path, wire)
    private_map["wire_sha256"] = wire_sha
    map_sha = write_new(map_path, private_map)
    print(json.dumps({"judge_wires": len(candidates), "questions": len(qids),
                      "wire_sha256": wire_sha, "map_sha256": map_sha}))


if __name__ == "__main__":
    main()
