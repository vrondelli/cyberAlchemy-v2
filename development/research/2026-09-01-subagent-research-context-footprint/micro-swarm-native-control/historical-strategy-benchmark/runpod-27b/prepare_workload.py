#!/usr/bin/env python3
"""Build a hash-verified standalone workload without committing private source bytes."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


BENCHMARK_REL = Path(
    "cyberAlchemy-v2/development/research/2026-09-01-subagent-research-context-footprint/"
    "micro-swarm-native-control/historical-strategy-benchmark"
)
BASELINE_PREFIX = {
    "context-footprint": "cf",
    "define-model-selection": "define",
    "contextual-framings": "framing",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verified_text(repo_root: Path, ref: dict[str, Any]) -> str:
    path = repo_root / ref["path"]
    actual_size = path.stat().st_size
    actual_digest = sha256(path)
    if actual_size != ref["size"] or actual_digest != ref["sha256"]:
        raise ValueError(
            f"frozen source mismatch for {ref['path']}: "
            f"size={actual_size}, sha256={actual_digest}"
        )
    return path.read_text(encoding="utf-8")


def select_lines(text: str, selectors: list[str]) -> str:
    lines = text.splitlines()
    selected: list[str] = []
    for selector in selectors:
        _, line_range = selector.rsplit(":L", 1)
        start_text, end_text = line_range.split("-L", 1)
        start, end = int(start_text), int(end_text)
        if start < 1 or end < start or end > len(lines):
            raise ValueError(f"invalid selector {selector} for {len(lines)} lines")
        selected.append(f"[{selector}]\n" + "\n".join(lines[start - 1 : end]))
    return "\n\n".join(selected)


def build_workload(repo_root: Path) -> dict[str, Any]:
    benchmark = repo_root / BENCHMARK_REL
    manifest = load_json(benchmark / "manifest.json")
    role_sheet = load_json(benchmark / "CA2-FANOUT-SHEET.microshard.json")
    rubric = load_json(benchmark / "rubric.json")
    datasets: dict[str, Any] = {}

    for dataset in manifest["datasets"]:
        dataset_id = dataset["dataset_id"]
        research = verified_text(repo_root, dataset["input_ref"])
        gold = verified_text(repo_root, dataset["withheld_gold_ref"])
        slices = [
            select_lines(research, selectors)
            for selectors in dataset["angle_source_selectors"]
        ]
        prefix = BASELINE_PREFIX[dataset_id]
        baseline_path = benchmark / "runs/20260901T153419Z/control" / f"{prefix}-sol-baseline.json"
        datasets[dataset_id] = {
            "dataset_id": dataset_id,
            "historical_result_status": dataset["historical_result_status"],
            "angles": dataset["angles"],
            "angle_source_selectors": dataset["angle_source_selectors"],
            "source_slices": slices,
            "withheld_gold": gold,
            "frozen_sol_baseline": load_json(baseline_path),
            "source_refs": {
                "input": dataset["input_ref"],
                "gold": dataset["withheld_gold_ref"],
                "baseline": str(baseline_path.relative_to(repo_root)),
                "baseline_sha256": sha256(baseline_path),
            },
        }

    roles = [
        role
        for role in role_sheet["roles"]
        if role["contract"] in {"micro_extractor", "angle_reducer", "dataset_synthesizer", "judge"}
    ]
    for role in roles:
        if role["contract"] == "judge":
            role["depends_on"] = [dependency for dependency in role["depends_on"] if "baseline" not in dependency]

    return {
        "schema_version": "cav2.runpod-27b-workload.v1",
        "benchmark_id": manifest["benchmark_id"],
        "source_strategy_id": role_sheet["strategy_id"],
        "roles": roles,
        "datasets": datasets,
        "rubric": rubric,
        "blindness": {
            "extractors": "angle slice only; no gold or frozen Sol baseline",
            "reducers": "three same-angle extractor outputs only",
            "synthesizers": "three dataset-local reducer outputs only",
            "judges": "randomized candidate labels, withheld gold, and rubric",
        },
        "claim_ceiling": manifest["claim_ceiling"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    workload = build_workload(args.repo_root.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(workload, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    args.output.write_text(encoded, encoding="utf-8")
    print(json.dumps({"output": str(args.output), "sha256": hashlib.sha256(encoded.encode()).hexdigest(), "roles": len(workload["roles"])}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
