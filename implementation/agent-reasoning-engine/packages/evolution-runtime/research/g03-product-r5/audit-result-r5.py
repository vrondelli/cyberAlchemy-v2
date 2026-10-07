#!/usr/bin/env python3
"""Independent, read-only receipt/metric audit for sealed G03 r5 artifacts."""

import hashlib
import json
import math
import sys
from pathlib import Path


def load(path):
    data = path.read_bytes()
    return json.loads(data), hashlib.sha256(data).hexdigest()


def require(condition, reason):
    if not condition:
        raise AssertionError(reason)


def equal_float(actual, expected, reason):
    require(math.isclose(actual, expected, rel_tol=0, abs_tol=1e-12), reason)


def main():
    if len(sys.argv) != 5:
        raise SystemExit("usage: audit-result-r5.py COHORT_ROOT GENERATION_ROOT SCORE_ROOT NEW_AUDIT_JSON")
    cohort_root, generation_root, score_root, output = map(Path, sys.argv[1:])
    source, source_sha = load(cohort_root / "source/manifest.json")
    generation_run, generation_run_sha = load(generation_root / "RUN.json")
    generation, generation_sha = load(generation_root / "RESULT.json")
    references, references_sha = load(cohort_root / "references/manifest.json")
    score_run, score_run_sha = load(score_root / "RUN.json")
    score, score_sha = load(score_root / "RESULT.json")
    analysis, analysis_sha = load(score_root / "ANALYSIS.json")

    ids = source["question_ids"]
    require(len(ids) == 50 and len(set(ids)) == 50 and len(source["rows"]) == 50, "source-cohort")
    require([row["question_id"] for row in source["rows"]] == ids, "source-row-order")
    require(generation_run["source_manifest_file_sha256"] == source_sha, "generation-run-source-binding")
    require(generation["schema_version"] == "are.longmemeval-product-replication-paired-result/v2", "generation-schema")
    require(generation["status"] == "completed" and generation["terminal_count"] == 50, "generation-terminal")
    require(generation["failure_count"] == 0 and generation["unknown_usage"] is False, "generation-failure-or-unknown")
    require(generation["question_ids"] == ids and len(generation["results"]) == 50, "generation-order")
    require(references["generation_result_sha256"] == generation_sha, "reference-generation-binding")
    require(references["cohort_manifest_sha256"] == source_sha, "reference-cohort-binding")
    require(references["generator_reference_access"] is False and references["reference_values_emitted"] is False, "reference-exposure")
    require(score_run["generation_result_sha256"] == generation_sha, "score-run-generation-binding")
    require(score_run["cohort_manifest_sha256"] == source_sha and score_run["reference_manifest_sha256"] == references_sha, "score-run-source-binding")
    require(score_run["planned_judgments"] == generation["completed"] * 2 and score_run["retries"] == 0, "score-run-protocol")
    require(score["status"] == "completed" and score["unknown_usage"] is False and score["reference_values_emitted"] is False, "score-terminal")
    require(score["question_ids"] == ids and score["provider_refused"] == generation["provider_refused"], "score-cohort")
    require(len(score["judgments"]) == generation["completed"] * 2, "judgment-count")
    require(analysis["source_manifest_sha256"] == source_sha and analysis["generation_run_sha256"] == generation_run_sha and analysis["generation_result_sha256"] == generation_sha, "analysis-generation-binding")
    require(analysis["score_run_sha256"] == score_run_sha and analysis["score_result_sha256"] == score_sha, "analysis-score-binding")
    require(analysis["planned_questions"] == 50 and analysis["answered_pairs"] == generation["completed"] and analysis["provider_refused"] == generation["provider_refused"], "analysis-count")

    answered, refused, calls, tokens = [], [], 0, 0
    answers = {}
    for index, row in enumerate(generation["results"]):
        qid = ids[index]
        require(row["question_id"] == qid and row["unknown_usage"] is False, f"generation-row:{qid}")
        task, _ = load(generation_root / f"task-{index:02d}-{qid}" / "RESULT.json")
        require(task == row, f"task-receipt:{qid}")
        calls += row["model_calls"]
        tokens += row["known_tokens"]
        if row["status"] == "provider-refused":
            refused.append(qid)
            require(row["refusal"]["provider_error_code"] == "1301", f"refusal-code:{qid}")
            require(row["known_tokens"] == 0 and row["model_calls"] == 0 and len(row["calls"]) == 0, f"refusal-cost:{qid}")
            continue
        require(row["status"] == "completed", f"unexpected-status:{qid}")
        answered.append(qid)
        require({answer["arm"] for answer in row["answers"]} == {"control", "treatment"}, f"answer-arms:{qid}")
        require(row["known_tokens"] == sum(call["usage"]["total_tokens"] for call in row["calls"]), f"generation-cost:{qid}")
        for answer in row["answers"]:
            answers[(qid, answer["arm"])] = answer["answer_sha256"]
    require(len(answered) == generation["completed"] == 47 and len(refused) == generation["provider_refused"] == 3, "generation-status-count")
    require(generation["model_calls"] == calls and generation["known_tokens"] == tokens, "generation-total-cost")
    require(references["answered_question_ids"] == answered and references["refused_question_ids"] == refused, "reference-selection")
    require(score["fixed_incorrect_question_ids"] == refused, "refusal-fixed-incorrect")

    judgments = {}
    for judgment in score["judgments"]:
        key = (judgment["question_id"], judgment["arm"])
        require(key in answers and key not in judgments, f"judgment-key:{key}")
        require(judgment["answer_sha256"] == answers[key], f"judgment-answer-binding:{key}")
        require(judgment["correct"] is False or judgment["valid"] is True, f"invalid-counted-correct:{key}")
        require(isinstance(judgment["usage"]["total_tokens"], int) and judgment["usage"]["total_tokens"] > 0 and judgment["elapsed_ms"] > 0, f"judge-cost:{key}")
        file_judgment, _ = load(score_root / f"judgment-{key[0]}-{key[1]}.json")
        require(file_judgment == judgment, f"judgment-receipt:{key}")
        judgments[key] = judgment
    require(set(judgments) == set(answers), "judgment-coverage")
    require(score["valid_judgments"] == sum(row["valid"] for row in judgments.values()), "valid-judgment-total")
    require(analysis["invalid_judgments"] == len(judgments) - score["valid_judgments"], "invalid-judgment-total")

    correct = {arm: sum(judgments[(qid, arm)]["correct"] for qid in answered) for arm in ("control", "treatment")}
    for arm in correct:
        total = score["totals"][arm]
        require(total["planned"] == 50 and total["answered_pairs"] == len(answered) and total["provider_refused"] == len(refused), f"score-total-count:{arm}")
        require(total["correct"] == correct[arm] and total["valid"] == sum(judgments[(qid, arm)]["valid"] for qid in answered), f"score-total-judge:{arm}")
        generation_tokens = sum(call["usage"]["total_tokens"] for row in generation["results"] if row["status"] == "completed" for call in row["calls"] if call["arm"] == arm)
        judge_tokens = sum(judgments[(qid, arm)]["usage"]["total_tokens"] for qid in answered)
        generation_ms = sum(row["arm_elapsed_ms"][arm] for row in generation["results"] if row["status"] == "completed")
        judge_ms = sum(judgments[(qid, arm)]["elapsed_ms"] for qid in answered)
        require(total["generation_tokens"] == generation_tokens and total["judge_tokens"] == judge_tokens and total["total_tokens"] == generation_tokens + judge_tokens, f"score-total-tokens:{arm}")
        require(total["generation_arm_elapsed_ms"] == generation_ms and total["judge_elapsed_ms"] == judge_ms, f"score-total-time:{arm}")
    equal_float(analysis["point"]["control_accuracy"], correct["control"] / 50, "control-accuracy")
    equal_float(analysis["point"]["treatment_accuracy"], correct["treatment"] / 50, "treatment-accuracy")
    equal_float(analysis["point"]["accuracy_difference"], (correct["treatment"] - correct["control"]) / 50, "accuracy-difference")
    equal_float(analysis["point"]["token_ratio"], score["totals"]["treatment"]["total_tokens"] / score["totals"]["control"]["total_tokens"], "token-ratio")
    control_ms = sum(score["totals"]["control"][key] for key in ("generation_arm_elapsed_ms", "judge_elapsed_ms"))
    treatment_ms = sum(score["totals"]["treatment"][key] for key in ("generation_arm_elapsed_ms", "judge_elapsed_ms"))
    equal_float(analysis["point"]["time_ratio"], treatment_ms / control_ms, "time-ratio")
    require(analysis["directional_product_headline_admissible"] is False and analysis["quality_directional_candidate"] is True, "claim-boundary")

    audit = {
        "schema_version": "are.g03-r5-independent-receipt-audit/v1",
        "status": "passed",
        "source_manifest_sha256": source_sha,
        "generation_result_sha256": generation_sha,
        "reference_manifest_sha256": references_sha,
        "score_result_sha256": score_sha,
        "analysis_sha256": analysis_sha,
        "planned_questions": 50,
        "answered_pairs": len(answered),
        "provider_refused_question_ids": refused,
        "judgments": len(judgments),
        "invalid_judgments": analysis["invalid_judgments"],
        "correct": correct,
        "point": analysis["point"],
        "claim_ceiling": "Receipt, cost, and point-metric integrity only; no product headline or publication approval",
        "authority_effect": "none",
    }
    with output.open("x", encoding="utf8") as handle:
        json.dump(audit, handle, indent=2)
        handle.write("\n")
    print(json.dumps({"status": "passed", "answered_pairs": len(answered), "provider_refused": len(refused), "judgments": len(judgments), "correct": correct}))


if __name__ == "__main__":
    main()
