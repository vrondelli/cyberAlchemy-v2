#!/usr/bin/env python3
"""Receipt-audit and strict JSON admission for question-only r30 plans."""

from collections import Counter
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import sys


ARCHIVE = Path("/home/vlad_/are-benchmark-archive")
WIRE = ARCHIVE / "g03-lme-v2-feasibility-20261005/QUERY-PLAN-WIRES-R30.json"
RUN = ARCHIVE / "g03-lme-v2-query-plan-run-r30"
EXPECTED_WIRE_SHA256 = "f57e18ac2354bd6e346d7e39bfb41eea162da1784864495692253c6a7d20407d"
OPERATORS = {"exact_set", "ordered_neighbor", "count", "comparison",
             "multiple_choice", "premise_check", "procedure", "fact"}
KEYS = {"raw_state_queries", "event_query", "note_query", "answer_operator"}
ANSWER_TEXT = re.compile(r"\\boxed\s*\{|\b(?:correct answer|the answer is|I would answer)\b", re.I)


def digest(path: Path) -> str:
    h = sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def admit(content: str) -> tuple[dict | None, list[str]]:
    failures = []
    try:
        plan = json.loads(content.strip())
    except json.JSONDecodeError:
        return None, ["not-strict-json"]
    if not isinstance(plan, dict) or set(plan) != KEYS:
        return None, ["wrong-object-keys"]
    queries = plan["raw_state_queries"]
    if not isinstance(queries, list) or not 1 <= len(queries) <= 4 or not all(
            isinstance(item, str) and 3 <= len(item.strip()) <= 220 for item in queries):
        failures.append("invalid-raw-queries")
    elif len({item.casefold().strip() for item in queries}) != len(queries):
        failures.append("duplicate-raw-queries")
    for key in ("event_query", "note_query"):
        if not isinstance(plan[key], str) or len(plan[key]) > 280:
            failures.append(f"invalid-{key}")
    if plan["answer_operator"] not in OPERATORS:
        failures.append("invalid-answer-operator")
    if ANSWER_TEXT.search(json.dumps(plan, ensure_ascii=False)):
        failures.append("answer-shaped-text")
    if len(json.dumps(plan, ensure_ascii=False)) > 1800:
        failures.append("overlong-plan")
    return (plan if not failures else None), failures


def main() -> None:
    assert len(sys.argv) == 2, "output-path-required"
    output_path = Path(sys.argv[1])
    assert digest(WIRE) == EXPECTED_WIRE_SHA256, "wire-drift"
    wire = json.loads(WIRE.read_text())
    result_path = RUN / "RESULT.json"
    result = json.loads(result_path.read_text())
    assert result["status"] == "completed-26-query-plan-attempts"
    assert result["tokenizer_calls"] == result["generation_calls"] == 26
    freeze_path = RUN / "FREEZE.json"
    assert result["freeze_sha256"] == digest(freeze_path)
    freeze = json.loads(freeze_path.read_text())
    assert freeze["wire_sha256"] == EXPECTED_WIRE_SHA256
    assert len(wire["rows"]) == len(result["tokenizer_rows"]) == len(result["plan_rows"]) == 26
    rows = []
    for index, (token, response) in enumerate(zip(
            result["tokenizer_rows"], result["plan_rows"]), 1):
        assert token["ordinal"] == response["ordinal"] == index
        assert token["question_id"] == response["question_id"]
        assert token["admitted_8k"]
        expected = freeze["ordered_requests"][index - 1]
        assert expected["question_id"] == response["question_id"]
        raw_path = RUN / f"ATTEMPT-{index:02d}.json"
        token_path = RUN / f"TOKENIZER-{index:02d}.json"
        assert digest(raw_path) == response["raw_sha256"]
        assert digest(token_path) == token["raw_sha256"]
        raw = json.loads(raw_path.read_text())
        assert raw["request_sha256"] == expected["request_sha256"]
        content = raw["response"].get("payload", {}).get("choices", [{}])[0].get("message", {}).get("content")
        assert (sha256(content.encode()).hexdigest() if isinstance(content, str)
                else None) == response["content_sha256"]
        plan, failures = admit(content) if response["response_valid"] else (None, ["invalid-provider-response"])
        rows.append({"question_id": response["question_id"],
                     "response_valid": response["response_valid"],
                     "strict_json_admitted": plan is not None,
                     "failure_reasons": failures,
                     "plan": plan,
                     "raw_sha256": response["raw_sha256"],
                     "content_sha256": response["content_sha256"]})
    counts = Counter(row["plan"]["answer_operator"] for row in rows if row["plan"])
    output = {"schema_version": "are.g03-lme-v2-query-plan-audit-r31/v1",
              "status": "exposed-development-query-plans-audited",
              "wire_sha256": EXPECTED_WIRE_SHA256,
              "result_sha256": digest(result_path),
              "scorer_sha256": digest(Path(__file__)),
              "question_count": 26,
              "admitted_count": sum(row["strict_json_admitted"] for row in rows),
              "operator_counts": dict(sorted(counts.items())),
              "gold_or_evaluator_fields_read": False,
              "confirmation_question_fields_read": False,
              "rows": rows,
              "claim_ceiling": "Question-only query-plan validity; no retrieval, answer score, or superiority"}
    encoded = (json.dumps(output, ensure_ascii=False, indent=2) + "\n").encode()
    fd = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as stream:
        stream.write(encoded)
    print(json.dumps({"questions": 26,
                      "admitted": output["admitted_count"],
                      "operator_counts": output["operator_counts"],
                      "audit_sha256": sha256(encoded).hexdigest()}))


if __name__ == "__main__":
    main()
