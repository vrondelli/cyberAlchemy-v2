#!/usr/bin/env python3
"""Render CRITERION.md deterministically from CRITERION.json."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def render(data: dict) -> str:
    lines = [
        "# Native Micro-Swarm Control Criterion",
        "",
        f"Criterion ID: `{data['criterion_id']}`",
        "",
        "## Hypothesis",
        "",
        data["hypothesis"],
        "",
        "## Arms",
        "",
    ]
    for arm_id, arm in data["arms"].items():
        lines += [
            f"### {arm_id}", "", f"- Model: `{arm['model']}`",
            f"- Tasks: {', '.join(arm['task_ids'])}",
            f"- Isolation: {arm['isolation']}",
            f"- Output: {arm['output_shape']}", "",
        ]
    lines += ["## Measurements", ""]
    for key, value in data["measurements"].items():
        lines.append(f"- `{key}`: {value}")
    lines += ["", "## Mechanical verdict rule", ""]
    for verdict in data["mechanical_verdict_rule"]["precedence"]:
        lines += [f"### {verdict}", ""]
        lines += [f"- {item}" for item in data["mechanical_verdict_rule"][verdict]]
        lines.append("")
    lines += ["## Non-goals", ""] + [f"- {item}" for item in data["non_goals"]]
    lines += ["", "## Reproducibility", ""] + [f"1. {item}" for item in data["reproducibility"]]
    lines += ["", "## Claim ceiling", "", data["claim_ceiling"], ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = render(json.loads((ROOT / "CRITERION.json").read_text()))
    target = ROOT / "CRITERION.md"
    if args.check:
        if not target.exists() or target.read_text() != expected:
            print("CRITERION_VIEW=drift")
            return 1
        print("CRITERION_VIEW=pass")
        return 0
    target.write_text(expected)
    print("CRITERION_VIEW=rendered")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

