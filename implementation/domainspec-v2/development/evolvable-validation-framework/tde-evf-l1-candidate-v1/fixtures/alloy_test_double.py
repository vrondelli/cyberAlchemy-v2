#!/usr/bin/python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def _members(text: str, prefix: str) -> list[str]:
    match = re.search(rf"{re.escape(prefix)}\s*\{{\s*(.*?)\s*\}}", text)
    if match is None:
        raise ValueError(f"missing model member expression: {prefix}")
    value = match.group(1)
    return [] if value == "none" else [item.strip() for item in value.split(" + ")]


def main(argv: list[str]) -> int:
    if argv == ["--version"]:
        print("ALLOY-TEST-DOUBLE fixture-v1")
        return 0
    if (
        len(argv) != 12
        or argv[:8] != ["exec", "-q", "-f", "-s", "sat4j", "-t", "json", "-o"]
        or argv[9:11] != ["-c", "NoViolation"]
    ):
        return 2
    output = Path(argv[8])
    model_path = Path(argv[-1])
    text = model_path.read_text()
    edge_members = _members(text, "fun SelectedEdge : Node -> Node")
    edges = {tuple(item.split("->", 1)) for item in edge_members}
    required = _members(text, "fun RequiredSource : set Node")
    targets = _members(text, "fun Target : one Node")
    if len(targets) != 1:
        return 2
    reach = set(edges)
    changed = True
    while changed:
        additions = {(left, right2) for left, right1 in reach for left2, right2 in edges if right1 == left2} - reach
        changed = bool(additions)
        reach.update(additions)
    violations = sorted(source for source in required if (source, targets[0]) not in reach)
    command_source = next(line for line in text.splitlines() if line.startswith("check NoViolation for "))
    command = {
        "name": "NoViolation",
        "type": "check",
        "source": command_source,
        "scopes": [command_source.removeprefix("check NoViolation for ")],
    }
    output.mkdir(parents=True, exist_ok=True)
    if violations:
        solution = {
            "duration": 0,
            "utctime": "fixture",
            "instances": [{"values": {"Violation": {"tuples": [[item] for item in violations]}}}],
        }
        command["solution"] = [solution]
        (output / "NoViolation-solution-0.json").write_text(json.dumps(solution, sort_keys=True))
    receipt = {"solver": "sat4j", "commands": {"NoViolation": command}}
    (output / "receipt.json").write_text(json.dumps(receipt, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
