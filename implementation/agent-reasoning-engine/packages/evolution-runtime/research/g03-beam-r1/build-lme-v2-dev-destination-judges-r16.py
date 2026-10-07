#!/usr/bin/env python3
"""Freeze two arm-blind official-rubric GLM-adapted development judgments."""

from hashlib import sha256
import importlib.util
import json
import os
from pathlib import Path
import sys


ROOT = Path("/home/vlad_/are-benchmark-archive")
SOURCE = ROOT / "g03-lme-v2-feasibility-20261005/questions.jsonl"
RUN = ROOT / "g03-lme-v2-dev-destination-run-r15"
MODULE = ROOT / "g03-lme-v2-official-harness-2cc8c540/evaluation/qa_eval_metrics.py"
EXPECTED = {
    SOURCE: "0a3ae5ebea938c24d7800e1e0b0828e08ae1646f939a53853b2b8cdc08e292b7",
    RUN / "RESULT.json": "495f9f7dc7a91d8e34a33aa9e41b1683609b9a781ae39922a985b268b05b22dd",
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
    result = json.loads((RUN / "RESULT.json").read_text())
    freeze = json.loads((RUN / "FREEZE.json").read_text())
    attempt_path = RUN / "ATTEMPT-01.json"
    assert result["valid_answer"] and result["admitted_8k"]
    assert result["freeze_sha256"] == digest(RUN / "FREEZE.json")
    assert result["attempt_raw_sha256"] == digest(attempt_path)
    raw = json.loads(attempt_path.read_text())
    assert raw["request_sha256"] == freeze["request_sha256"]
    full = raw["response"]["payload"]["choices"][0]["message"]["content"]
    assert sha256(full.encode()).hexdigest() == result["answer_sha256"]
    question = None
    with SOURCE.open() as stream:
        for line in stream:
            item = json.loads(line)
            if item["id"] == freeze["question_id"]:
                question = item
                break
    assert question and question["id"] == "6a7f0d24"
    spec = importlib.util.spec_from_file_location("lme_v2_qa_eval_metrics_r16", MODULE)
    assert spec and spec.loader
    scorer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scorer)
    assert scorer.eval_name(question["eval_function"]) == "llm_abstention_checker"
    final = scorer.extract_boxed_answer(full)
    messages = scorer._build_abstention_judge_messages(
        question_text=question["question"], reference_answer=question["answer"],
        model_full_response=full, model_final_answer=final)
    wires, mapping = [], []
    for repeat in (1, 2):
        blind_id = sha256(f"are-v2-destination-judge-r16:{question['id']}:{repeat}".encode()).hexdigest()[:24]
        request = {"model": "glm-5.3-flash", "messages": messages,
                   "max_tokens": 2048, "reasoning_effort": "low",
                   "thinking": {"type": "enabled"}, "stream": False}
        request_sha = sha256(json.dumps(request, separators=(",", ":"),
                                          ensure_ascii=False).encode()).hexdigest()
        wires.append({"blind_id": blind_id, "request": request,
                      "request_sha256": request_sha})
        mapping.append({"blind_id": blind_id, "question_id": question["id"],
                        "repeat": repeat, "answer_sha256": result["answer_sha256"],
                        "answer_raw_sha256": result["attempt_raw_sha256"],
                        "request_sha256": request_sha})
    wires.sort(key=lambda row: row["blind_id"])
    mapping.sort(key=lambda row: row["blind_id"])
    wire = {"schema_version": "are.g03-lme-v2-dev-destination-judge-wires-r16/v1",
            "status": "frozen-before-provider-calls",
            "source_sha256": {str(path): value for path, value in EXPECTED.items()},
            "builder_sha256": digest(Path(__file__)),
            "model": "glm-5.3-flash", "maximum_judge_calls": 2,
            "automatic_retries": 0, "reference_values_in_private_wire": True,
            "arm_identity_in_provider_messages": False,
            "official_rubric_prompts_reused": True,
            "judge_model_differs_from_official_default": True,
            "claim_ceiling": "Exposed development GLM-adapted rubric judgments only",
            "wires": wires}
    wire_sha = write_new(wire_path, wire)
    private_map = {"schema_version": "are.g03-lme-v2-dev-destination-judge-map-r16/v1",
                   "wire_sha256": wire_sha, "rows": mapping}
    map_sha = write_new(map_path, private_map)
    print(json.dumps({"judge_wires": len(wires), "wire_sha256": wire_sha,
                      "map_sha256": map_sha}))


if __name__ == "__main__":
    main()
