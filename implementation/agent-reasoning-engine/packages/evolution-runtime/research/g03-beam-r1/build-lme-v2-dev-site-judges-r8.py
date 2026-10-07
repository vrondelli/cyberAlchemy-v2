#!/usr/bin/env python3
"""Freeze two-pass arm-blind judge requests for r7b's four changed answers."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
RUN = ROOT / "g03-lme-v2-dev-site-run-r7b"
PARTIAL = RUN / "PARTIAL-SCORE.json"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    PARTIAL: "350657f5343d45b07afd787031f58bb109c66649ed1af4ce77733b67cba0a7d1",
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
    partial = json.loads(PARTIAL.read_text())
    pending = [row for row in partial["rows"]
               if row["score_reason"] == "new-glm-judgment-required"]
    assert len(pending) == 4 and all(row["valid"] for row in pending)
    qids = {row["question_id"] for row in pending}
    questions = {}
    with SOURCE.open() as stream:
        for line in stream:
            question = json.loads(line)
            if question["id"] in qids:
                questions[question["id"]] = question
    assert set(questions) == qids
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_site_judge", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    wires, mapping = [], []
    for row in pending:
        qid = row["question_id"]
        q = questions[qid]
        raw_path = RUN / f'ATTEMPT-{row["ordinal"]:02d}.json'
        assert digest(raw_path) == row["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        full = raw["response"]["payload"]["choices"][0]["message"]["content"]
        assert sha256(full.encode()).hexdigest() == row["answer_sha256"]
        final = scorer.extract_boxed_answer(full)
        evaluator = scorer.eval_name(q["eval_function"])
        assert evaluator == row["evaluator"]
        build = (scorer._build_abstention_judge_messages if evaluator ==
                 "llm_abstention_checker" else scorer._build_gotchas_judge_messages)
        messages = build(question_text=q["question"], reference_answer=q["answer"],
                         model_full_response=full, model_final_answer=final)
        for repeat in (1, 2):
            blind_id = sha256(f'are-v2-site-judge-r8:{qid}:{repeat}'.encode()).hexdigest()[:24]
            request = {"model": "glm-5.3-flash", "messages": messages,
                       "max_tokens": 2048, "reasoning_effort": "low",
                       "thinking": {"type": "enabled"}, "stream": False}
            request_sha = sha256(json.dumps(request, separators=(",", ":"),
                                              ensure_ascii=False).encode()).hexdigest()
            wires.append({"blind_id": blind_id, "request": request,
                          "request_sha256": request_sha})
            mapping.append({"blind_id": blind_id, "question_id": qid,
                            "repeat": repeat, "answer_sha256": row["answer_sha256"],
                            "answer_raw_sha256": row["raw_sha256"],
                            "request_sha256": request_sha})
    wires.sort(key=lambda row: row["blind_id"])
    mapping.sort(key=lambda row: row["blind_id"])
    assert len(wires) == len(mapping) == 8
    assert len({row["blind_id"] for row in wires}) == 8
    wire = {"schema_version": "are.g03-lme-v2-dev-site-judge-wires-r8/v1",
            "status": "frozen-before-provider-calls",
            "source_sha256": {str(path): value for path, value in EXPECTED.items()},
            "builder_sha256": digest(Path(__file__)),
            "model": "glm-5.3-flash", "maximum_judge_calls": 8,
            "automatic_retries": 0, "reference_values_in_private_wire": True,
            "arm_identity_in_provider_messages": False,
            "official_rubric_prompts_reused": True,
            "judge_model_differs_from_official_default": True,
            "claim_ceiling": "Exposed development GLM-adapted rubric judgments only",
            "wires": wires}
    private_map = {"schema_version": "are.g03-lme-v2-dev-site-judge-map-r8/v1",
                   "wire_sha256": None, "rows": mapping}
    wire_sha = write_new(wire_path, wire)
    private_map["wire_sha256"] = wire_sha
    map_sha = write_new(map_path, private_map)
    print(json.dumps({"judge_wires": len(wires), "questions": len(qids),
                      "wire_sha256": wire_sha, "map_sha256": map_sha}))


if __name__ == "__main__":
    main()
