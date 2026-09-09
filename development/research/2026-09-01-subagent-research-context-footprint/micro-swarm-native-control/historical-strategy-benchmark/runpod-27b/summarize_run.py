#!/usr/bin/env python3
"""Create a deterministic timing/token/quality summary from one completed run."""

from __future__ import annotations

import argparse
import json
import statistics
from pathlib import Path
from typing import Any


def parse_json_content(content: str) -> Any | None:
    text = content.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text.strip())
    except (json.JSONDecodeError, TypeError):
        return None


def percentile(values: list[float], fraction: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * fraction)))
    return round(ordered[index], 3)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    run = json.loads((args.run_dir / "run.json").read_text(encoding="utf-8"))
    roles = [json.loads(path.read_text(encoding="utf-8")) for path in sorted((args.run_dir / "roles").glob("*.json"))]
    elapsed = [float(role["elapsed_ms"]) for role in roles]
    usage_fields = ["prompt_tokens", "completion_tokens", "total_tokens"]
    usage = {field: sum(int(role.get("usage", {}).get(field, 0) or 0) for role in roles) for field in usage_fields}
    judge_outputs = {}
    for role in roles:
        if role["contract"] == "judge":
            parsed = parse_json_content(role.get("content", ""))
            label_map = role.get("blind_label_map", {})
            attributed_scores = {}
            if isinstance(parsed, dict):
                for candidate, source in label_map.items():
                    candidate_result = parsed.get(candidate)
                    if isinstance(candidate_result, dict) and isinstance(candidate_result.get("total"), (int, float)):
                        attributed_scores[source] = candidate_result["total"]
            paired_delta = None
            if "swarm" in attributed_scores and "sol" in attributed_scores:
                paired_delta = attributed_scores["swarm"] - attributed_scores["sol"]
            judge_outputs[role["dataset_id"]] = {
                "role_id": role["role_id"],
                "json_valid": parsed is not None,
                "blind_label_map": label_map,
                "attributed_scores": attributed_scores,
                "paired_delta_swarm_minus_sol": paired_delta,
                "result": parsed,
            }
    summary = {
        "schema_version": "cav2.runpod-27b-run-summary.v1",
        "run_status": run["status"],
        "deadline_result": run["deadline_result"],
        "elapsed_seconds": round(run["elapsed_ms"] / 1000, 3),
        "stage_seconds": {stage["stage"]: round(stage["elapsed_ms"] / 1000, 3) for stage in run["stages"]},
        "roles": len(roles),
        "request_latency_ms": {
            "mean": round(statistics.fmean(elapsed), 3) if elapsed else None,
            "p50": percentile(elapsed, 0.50),
            "p95": percentile(elapsed, 0.95),
            "max": round(max(elapsed), 3) if elapsed else None,
        },
        "usage": usage,
        "judges": judge_outputs,
        "quality_status": "provisional_local_model_judge",
        "claim_ceiling": run["claim_ceiling"],
    }
    args.output.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"summary": str(args.output), "deadline_result": summary["deadline_result"], "elapsed_seconds": summary["elapsed_seconds"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
