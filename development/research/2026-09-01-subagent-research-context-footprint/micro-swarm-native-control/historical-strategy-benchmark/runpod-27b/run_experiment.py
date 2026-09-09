#!/usr/bin/env python3
"""Execute the four-stage micro-shard DAG against an OpenAI-compatible server."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import random
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


STAGE_ORDER = ["micro_extractor", "angle_reducer", "dataset_synthesizer", "judge"]
OUTPUT_LIMIT_ENV = {
    "micro_extractor": "MAX_OUTPUT_TOKENS_EXTRACTOR",
    "angle_reducer": "MAX_OUTPUT_TOKENS_REDUCER",
    "dataset_synthesizer": "MAX_OUTPUT_TOKENS_SYNTHESIZER",
    "judge": "MAX_OUTPUT_TOKENS_JUDGE",
}
OUTPUT_LIMIT_DEFAULT = {
    "micro_extractor": 3600,
    "angle_reducer": 6000,
    "dataset_synthesizer": 5000,
    "judge": 4096,
}

RUBRIC_DIMENSION_MAX = {
    "claim_coverage": 35,
    "conclusion_and_decision_fidelity": 25,
    "evidence_and_proof_status_fidelity": 20,
    "nonclaim_and_authority_preservation": 15,
    "clarity_and_internal_consistency": 5,
}


def distill_mode() -> bool:
    return os.getenv("DISTILL_MODE", "0").lower() in {"1", "true", "yes"}


def judge_response_format() -> dict[str, Any]:
    dimensions = {
        name: {"type": "number", "minimum": 0, "maximum": maximum}
        for name, maximum in RUBRIC_DIMENSION_MAX.items()
    }
    short_list = {
        "type": "array",
        "maxItems": 3,
        "items": {"type": "string", "maxLength": 160},
    }
    candidate = {
        "type": "object",
        "additionalProperties": False,
        "required": ["dimension_scores", "penalties", "total", "strengths", "misses", "invented_claims"],
        "properties": {
            "dimension_scores": {
                "type": "object",
                "additionalProperties": False,
                "required": list(RUBRIC_DIMENSION_MAX),
                "properties": dimensions,
            },
            "penalties": short_list,
            "total": {"type": "number", "minimum": 0, "maximum": 100},
            "strengths": short_list,
            "misses": short_list,
            "invented_claims": short_list,
        },
    }
    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["candidate_1", "candidate_2", "winner", "critical_misses", "shared_misses", "confidence"],
        "properties": {
            "candidate_1": candidate,
            "candidate_2": candidate,
            "winner": {"type": "string", "enum": ["candidate_1", "candidate_2", "tie"]},
            "critical_misses": short_list,
            "shared_misses": short_list,
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        },
    }
    return {"type": "json_schema", "json_schema": {"name": "judge_result", "strict": True, "schema": schema}}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def judge_candidates(role: dict[str, Any], dataset: dict[str, Any], synthesized: str) -> tuple[dict[str, Any], dict[str, str]]:
    candidates = [
        {"source": "swarm", "body": synthesized},
        {"source": "sol", "body": dataset["frozen_sol_baseline"]},
    ]
    random.Random(f"{role['dataset_id']}:qwen-27b").shuffle(candidates)
    blinded = {f"candidate_{index + 1}": item["body"] for index, item in enumerate(candidates)}
    label_map = {f"candidate_{index + 1}": item["source"] for index, item in enumerate(candidates)}
    return blinded, label_map


def post_json(url: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": "Bearer local-experiment"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code}: {body[:2000]}") from error


def parse_api_bases(value: str) -> list[str]:
    parts = [part.strip().rstrip("/") for part in value.split(",")]
    if not parts or any(not part for part in parts):
        raise ValueError("API bases must contain only non-empty comma-separated endpoints")
    return parts


def configured_run_api_bases(args: argparse.Namespace) -> list[str]:
    multi = getattr(args, "api_bases", None)
    if multi is not None:
        return parse_api_bases(multi)
    single = getattr(args, "api_base", None)
    if single is None:
        raise ValueError("one of --api-base or --api-bases is required")
    return parse_api_bases(single)


def role_prompt(role: dict[str, Any], workload: dict[str, Any], outputs: dict[str, Any]) -> str:
    dataset = workload["datasets"][role["dataset_id"]]
    contract = role["contract"]
    common = (
        "You are one bounded research micro-shard. Preserve proof status, limitations, conflicts, "
        "and source anchors. Never invent evidence or inflate authority. Return JSON only, without "
        "markdown fences."
    )
    if distill_mode():
        common += (
            " DISTILL MODE: emit the smallest lossless claim atoms. Preserve every exact number, "
            "digest, SKU, threshold, formula, verdict, proof-status qualifier, blocker, and non-claim. "
            "Delete rhetorical explanation and duplicates. Never fill a missing value from memory."
        )
    if contract == "micro_extractor":
        return (
            f"{common}\nROLE_ID: {role['role_id']}\n"
            f"ANGLE: {dataset['angles'][role['angle_index']]}\nFACET: {role['facet']}\n"
            "Extract only facts relevant to this facet. Output an object with role_id, records "
            "(statement, evidence_anchor, proof_status), conflicts, and non_claims. In distill mode, "
            "use at most 12 records with one fact per record and statements under 240 characters.\n\n"
            f"SOURCE SLICE:\n{dataset['source_slices'][role['angle_index']]}"
        )
    dependencies = [{"role_id": dep, "output": outputs[dep]["content"]} for dep in role["depends_on"]]
    if contract == "angle_reducer":
        return (
            f"{common}\nROLE_ID: {role['role_id']}\nANGLE: {dataset['angles'][role['angle_index']]}\n"
            "Merge the three facet outputs without dropping disagreements or non-claims. Output an "
            "object with role_id, claims, decisions, conflicts, non_claims, and schema_deviations. "
            "In distill mode, deduplicate only exact semantic duplicates; do not generalize exact values.\n\n"
            f"FACET OUTPUTS:\n{json.dumps(dependencies, ensure_ascii=False)}"
        )
    if contract == "dataset_synthesizer":
        return (
            f"{common}\nROLE_ID: {role['role_id']}\n"
            "Reconstruct the strongest faithful research result from the three angle reductions. "
            "Output an object with role_id, claims, conclusions, decisions, conflicts, non_claims, "
            "and open_questions. Retain evidence anchors. In distill mode, use compact claim atoms "
            "and run an omission check before returning: retain all exact identities and numbers, "
            "decision/verdict matrices, result-language rules, stop/falsification rules, and claim ceilings. "
            "Prefer complete coverage over commentary.\n\n"
            f"ANGLE REDUCTIONS:\n{json.dumps(dependencies, ensure_ascii=False)}"
        )
    if contract == "judge":
        synthesized = dependencies[0]["output"]
        blinded, _ = judge_candidates(role, dataset, synthesized)
        return (
            f"{common}\nROLE_ID: {role['role_id']}\n"
            "Score both blinded candidates against the historical gold using the rubric. Output an "
            "object with candidate_1, candidate_2 (dimension_scores, penalties, total, strengths, "
            "misses, invented_claims), winner (candidate_1, candidate_2, or tie), critical_misses, "
            "shared_misses, and confidence. Do not infer candidate identity.\n\n"
            f"RUBRIC:\n{json.dumps(workload['rubric'], ensure_ascii=False)}\n\n"
            f"HISTORICAL GOLD:\n{dataset['withheld_gold']}\n\n"
            f"BLINDED CANDIDATES:\n{json.dumps(blinded, ensure_ascii=False)}"
        )
    raise ValueError(f"unknown contract: {contract}")


async def execute_role(
    role: dict[str, Any], workload: dict[str, Any], outputs: dict[str, Any], api_base: str
) -> tuple[str, dict[str, Any]]:
    prompt = role_prompt(role, workload, outputs)
    max_tokens = int(os.getenv(OUTPUT_LIMIT_ENV[role["contract"]], OUTPUT_LIMIT_DEFAULT[role["contract"]]))
    payload: dict[str, Any] = {
        "model": os.getenv("SERVED_MODEL_NAME", "qwen-27b-microshard"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": float(os.getenv("TEMPERATURE", "0.7")),
        "top_p": float(os.getenv("TOP_P", "0.8")),
        "max_tokens": max_tokens,
        "seed": int(os.getenv("SEED", "20260901")),
        "reasoning_effort": os.getenv("REASONING_EFFORT", "medium"),
    }
    if distill_mode():
        payload["temperature"] = 0.0
        payload["top_p"] = 1.0
        if role["contract"] == "judge":
            payload["reasoning_effort"] = "low"
            payload["response_format"] = judge_response_format()
    timeout = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "240"))
    attempts = int(os.getenv("REQUEST_ATTEMPTS", "2"))
    started_at = utc_now()
    start = time.monotonic()
    error_message = None
    for attempt in range(1, attempts + 1):
        try:
            response = await asyncio.to_thread(post_json, f"{api_base}/chat/completions", payload, timeout)
            choice = response["choices"][0]
            result = {
                "role_id": role["role_id"],
                "dataset_id": role["dataset_id"],
                "contract": role["contract"],
                "status": "complete",
                "attempts": attempt,
                "started_at": started_at,
                "finished_at": utc_now(),
                "elapsed_ms": round((time.monotonic() - start) * 1000, 3),
                "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
                "prompt_characters": len(prompt),
                "content": choice["message"].get("content", ""),
                "finish_reason": choice.get("finish_reason"),
                "usage": response.get("usage", {}),
                "response_id": response.get("id"),
                "selected_api_base": api_base,
            }
            if role["contract"] == "judge":
                synthesized = outputs[role["depends_on"][0]]["content"]
                _, result["blind_label_map"] = judge_candidates(
                    role, workload["datasets"][role["dataset_id"]], synthesized
                )
            return role["role_id"], result
        except Exception as error:  # preserve the terminal error in the receipt
            error_message = f"{type(error).__name__}: {error}"
            if attempt < attempts:
                await asyncio.sleep(min(2 ** attempt, 8))
    return role["role_id"], {
        "role_id": role["role_id"],
        "dataset_id": role["dataset_id"],
        "contract": role["contract"],
        "status": "failed",
        "attempts": attempts,
        "started_at": started_at,
        "finished_at": utc_now(),
        "elapsed_ms": round((time.monotonic() - start) * 1000, 3),
        "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
        "prompt_characters": len(prompt),
        "error": error_message,
        "selected_api_base": api_base,
    }


async def run(args: argparse.Namespace) -> int:
    workload = json.loads(args.workload.read_text(encoding="utf-8"))
    output_dir = args.output
    role_dir = output_dir / "roles"
    role_dir.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, Any] = {}
    stage_receipts: list[dict[str, Any]] = []
    started_at = utc_now()
    run_start = time.monotonic()
    deadline_seconds = float(os.getenv("GLOBAL_DEADLINE_SECONDS", "300"))
    api_bases = configured_run_api_bases(args)
    endpoint_claims = {api_base: 0 for api_base in api_bases}
    next_endpoint = 0

    for stage in STAGE_ORDER:
        roles = [role for role in workload["roles"] if role["contract"] == stage]
        blocked = [role["role_id"] for role in roles if any(outputs.get(dep, {}).get("status") != "complete" for dep in role["depends_on"])]
        if blocked:
            raise RuntimeError(f"stage {stage} has blocked dependencies: {blocked}")
        remaining = deadline_seconds - (time.monotonic() - run_start)
        if remaining <= 0:
            raise TimeoutError(f"global deadline exceeded before {stage}")
        stage_start = time.monotonic()
        assignments = [api_bases[(next_endpoint + index) % len(api_bases)] for index in range(len(roles))]
        next_endpoint += len(roles)
        for api_base in assignments:
            endpoint_claims[api_base] += 1
        tasks = [
            execute_role(role, workload, outputs, api_base)
            for role, api_base in zip(roles, assignments, strict=True)
        ]
        try:
            results = await asyncio.wait_for(asyncio.gather(*tasks), timeout=remaining)
        except asyncio.TimeoutError as error:
            raise TimeoutError(f"global deadline exceeded during {stage}") from error
        for role_id, result in results:
            outputs[role_id] = result
            destination = role_dir / f"{role_id}.json"
            destination.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        failures = [role_id for role_id, result in results if result["status"] != "complete"]
        stage_receipts.append({
            "stage": stage,
            "roles": len(roles),
            "elapsed_ms": round((time.monotonic() - stage_start) * 1000, 3),
            "failures": failures,
            "endpoint_role_counts": {
                api_base: assignments.count(api_base) for api_base in api_bases
            },
        })
        if failures:
            raise RuntimeError(f"stage {stage} failed roles: {failures}")

    run_receipt = {
        "schema_version": "cav2.runpod-27b-run-receipt.v1",
        "status": "complete",
        "started_at": started_at,
        "finished_at": utc_now(),
        "elapsed_ms": round((time.monotonic() - run_start) * 1000, 3),
        "deadline_seconds": deadline_seconds,
        "deadline_result": "PASS" if time.monotonic() - run_start <= deadline_seconds else "FAIL",
        "workload_sha256": hashlib.sha256(args.workload.read_bytes()).hexdigest(),
        "model_id": os.getenv("MODEL_ID", "Qwen/Qwen3.8-27B-FP8"),
        "served_model_name": os.getenv("SERVED_MODEL_NAME", "qwen-27b-microshard"),
        "reasoning_effort": os.getenv("REASONING_EFFORT", "medium"),
        "distill_mode": distill_mode(),
        "runtime_base_image": os.getenv("BASE_VLLM_IMAGE", "unknown"),
        "api_bases": api_bases,
        "api_base_strategy": "deterministic-round-robin" if len(api_bases) > 1 else "single",
        "endpoint_role_counts": endpoint_claims,
        "stages": stage_receipts,
        "role_count": len(outputs),
        "claim_ceiling": workload["claim_ceiling"],
    }
    (output_dir / "run.json").write_text(json.dumps(run_receipt, indent=2) + "\n", encoding="utf-8")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workload", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    endpoint = parser.add_mutually_exclusive_group(required=True)
    endpoint.add_argument("--api-base")
    endpoint.add_argument("--api-bases")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    try:
        return asyncio.run(run(args))
    except Exception as error:
        failure = {
            "schema_version": "cav2.runpod-27b-failure-receipt.v1",
            "status": "failed",
            "finished_at": utc_now(),
            "error_type": type(error).__name__,
            "error": str(error),
        }
        (args.output / "failure.json").write_text(json.dumps(failure, indent=2) + "\n", encoding="utf-8")
        raise


if __name__ == "__main__":
    raise SystemExit(main())
