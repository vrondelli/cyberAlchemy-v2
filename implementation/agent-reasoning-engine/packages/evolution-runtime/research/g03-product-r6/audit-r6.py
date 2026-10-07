#!/usr/bin/env python3
"""Independent r6 receipt, judge-output, and quality-interval audit."""
import glob
import hashlib
import json
import math
import re
import sys
from pathlib import Path


def load(path):
    raw = path.read_bytes()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()


def check(value, reason):
    if not value:
        raise AssertionError(reason)


def close(a, b, reason):
    check(math.isclose(a, b, rel_tol=0, abs_tol=1e-12), reason)


def main():
    if len(sys.argv) != 5:
        raise SystemExit("usage: audit-r6.py COHORT_ROOT GENERATION_ROOT SCORE_ROOT NEW_AUDIT_JSON")
    cohort, generation_root, score_root, output = map(Path, sys.argv[1:])
    source, source_sha = load(cohort / "source/manifest.json")
    freeze, freeze_sha = load(cohort / "FREEZE.json")
    run, run_sha = load(generation_root / "RUN.json")
    generated, generated_sha = load(generation_root / "RESULT.json")
    references, references_sha = load(cohort / "references/manifest.json")
    score_run, score_run_sha = load(score_root / "RUN.json")
    scored, scored_sha = load(score_root / "RESULT.json")
    analysis, analysis_sha = load(score_root / "ANALYSIS.json")
    ids = source["question_ids"]
    check(len(ids) == 40 and len(set(ids)) == 40 and len(source["rows"]) == 40, "cohort")
    check(freeze["status"] == "frozen-before-model-dispatch" and freeze["file_sha256"]["source_manifest"] == source_sha, "freeze")
    check(run["source_manifest_file_sha256"] == source_sha, "generation-run-binding")
    check(generated["status"] == "completed" and generated["terminal_count"] == 40 and generated["failure_count"] == 0 and generated["unknown_usage"] is False, "generation-terminal")
    check(generated["question_ids"] == ids and len(generated["results"]) == 40, "generation-order")
    check(references["generation_result_sha256"] == generated_sha and references["cohort_manifest_sha256"] == source_sha, "reference-bindings")
    check(references["generator_reference_access"] is False and references["reference_values_emitted"] is False, "reference-leakage")
    check(score_run["generation_result_sha256"] == generated_sha and score_run["reference_manifest_sha256"] == references_sha, "score-run-bindings")
    check(scored["status"] == "completed" and scored["unknown_usage"] is False and scored["question_ids"] == ids, "score-terminal")
    check(analysis["source_manifest_sha256"] == source_sha and analysis["generation_result_sha256"] == generated_sha and analysis["score_result_sha256"] == scored_sha, "analysis-bindings")
    check(analysis["generation_run_sha256"] == run_sha and analysis["score_run_sha256"] == score_run_sha, "analysis-run-bindings")
    check(analysis["planned_questions"] == 40 and len(analysis["rows"]) == 40, "analysis-cohort")

    answers, refused, calls, tokens = {}, [], 0, 0
    for index, result in enumerate(generated["results"]):
        qid = ids[index]
        check(result["question_id"] == qid and result["unknown_usage"] is False, f"generation-row:{qid}")
        task, _ = load(generation_root / f"task-{index:02d}-{qid}" / "RESULT.json")
        check(task == result, f"task-receipt:{qid}")
        calls += result["model_calls"]
        tokens += result["known_tokens"]
        if result["status"] == "provider-refused":
            refused.append(qid)
            check(result["refusal"]["provider_error_code"] == "1301" and result["model_calls"] == 0 and result["known_tokens"] == 0, f"refusal:{qid}")
            continue
        check(result["status"] == "completed", f"status:{qid}")
        check({answer["arm"] for answer in result["answers"]} == {"control", "treatment"}, f"arms:{qid}")
        check(result["known_tokens"] == sum(call["usage"]["total_tokens"] for call in result["calls"]), f"tokens:{qid}")
        for answer in result["answers"]:
            answers[(qid, answer["arm"])] = answer["answer_sha256"]
    check(generated["model_calls"] == calls and generated["known_tokens"] == tokens, "generation-totals")
    check(len(answers) == generated["completed"] * 2 and len(refused) == generated["provider_refused"], "generation-accounting")
    check(references["answered_question_ids"] == [qid for qid in ids if qid not in refused] and references["refused_question_ids"] == refused, "reference-selection")
    check(scored["fixed_incorrect_question_ids"] == refused and scored["provider_refused"] == len(refused), "scored-refusals")

    event_by_hash = {}
    for path in glob.glob(str(score_root / "event-*.json")):
        event, _ = load(Path(path))
        if event.get("channel") == "model" and event.get("phase") == "completed":
            key = event.get("response_sha256")
            check(key not in event_by_hash and isinstance(event.get("output"), str), "judge-event")
            event_by_hash[key] = event
    judgments = {}
    for row in scored["judgments"]:
        key = (row["question_id"], row["arm"])
        check(key in answers and key not in judgments and row["answer_sha256"] == answers[key], f"judgment-binding:{key}")
        check(row["parser_version"] == "yes-no-optional-period/v1", f"parser-version:{key}")
        event = event_by_hash.get(row["judge_response_sha256"])
        check(event is not None and event["usage"]["total_tokens"] == row["usage"]["total_tokens"], f"judge-event-binding:{key}")
        match = re.fullmatch(r"(yes|no)\.?", event["output"].strip().lower())
        check(row["valid"] is (match is not None) and row["correct"] is (match is not None and match.group(1) == "yes"), f"judge-parsing:{key}")
        file_row, _ = load(score_root / f"judgment-{key[0]}-{key[1]}.json")
        check(file_row == row, f"judgment-receipt:{key}")
        judgments[key] = row
    check(set(judgments) == set(answers) and len(event_by_hash) == len(judgments), "judge-coverage")
    check(scored["valid_judgments"] == sum(row["valid"] for row in judgments.values()), "valid-count")
    check(analysis["invalid_judgments"] == len(judgments) - scored["valid_judgments"], "invalid-count")

    correct = {arm: sum(judgments[(qid, arm)]["correct"] for qid in ids if qid not in refused) for arm in ("control", "treatment")}
    sensitivity_control = correct["control"] + sum(not judgments[(qid, "control")]["valid"] for qid in ids if qid not in refused)
    primary = (correct["treatment"] - correct["control"]) / 40
    sensitivity = (correct["treatment"] - sensitivity_control) / 40
    close(analysis["point"]["accuracy_difference"], primary, "primary-point")
    close(analysis["point"]["control_favoring_sensitivity_difference"], sensitivity, "sensitivity-point")
    check(analysis["provider_refused"] == len(refused), "analysis-refusals")

    groups = [[row for row in analysis["rows"] if row["question_type"] == kind] for kind in sorted({row["question_type"] for row in analysis["rows"]})]
    check(len(groups) == 5 and all(len(group) == 8 for group in groups), "strata")
    state = int(source_sha[:8], 16) or 1
    draws = {"accuracy_difference": [], "control_favoring_sensitivity_difference": []}
    for _ in range(20_000):
        sample = []
        for group in groups:
            for _ in range(len(group)):
                state ^= (state << 13) & 0xffffffff
                state ^= state >> 17
                state ^= (state << 5) & 0xffffffff
                state &= 0xffffffff
                sample.append(group[int((state / 0x100000000) * len(group))])
        p = (sum(row["treatment"]["correct"] for row in sample) - sum(row["control"]["correct"] for row in sample)) / 40
        s = (sum(row["treatment"]["correct"] and row["treatment"]["judge_valid"] for row in sample) -
             sum(row["control"]["correct"] or not row["control"]["judge_valid"] for row in sample)) / 40
        draws["accuracy_difference"].append(p)
        draws["control_favoring_sensitivity_difference"].append(s)
    for key, values in draws.items():
        values.sort()
        expected = (values[int(.025 * (len(values) - 1))], values[int(.975 * (len(values) - 1))])
        for actual, value in zip(analysis["intervals"][key], expected):
            close(actual, value, f"bootstrap:{key}")
    gate = analysis["intervals"]["accuracy_difference"][0] > .10 and analysis["intervals"]["control_favoring_sensitivity_difference"][0] > 0
    check(analysis["accuracy_directional_gate_pass"] is gate, "direction-gate")
    audit = {"schema_version": "are.g03-r6-independent-audit/v1", "status": "passed", "freeze_sha256": freeze_sha,
             "source_manifest_sha256": source_sha, "generation_result_sha256": generated_sha,
             "reference_manifest_sha256": references_sha, "score_result_sha256": scored_sha,
             "analysis_sha256": analysis_sha, "planned": 40, "answered": generated["completed"], "refused": refused,
             "judgments": len(judgments), "invalid_judgments": analysis["invalid_judgments"],
             "correct": correct, "primary_difference": primary, "sensitivity_difference": sensitivity,
             "accuracy_directional_gate_pass": gate, "claim_ceiling": "Receipt, judge, and metric integrity only; no publication approval",
             "authority_effect": "none"}
    with output.open("x", encoding="utf8") as stream:
        json.dump(audit, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"status": "passed", "correct": correct, "refused": len(refused), "invalid_judgments": analysis["invalid_judgments"], "gate": gate}))


if __name__ == "__main__":
    main()
