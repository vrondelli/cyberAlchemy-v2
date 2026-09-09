#!/usr/bin/python3
from __future__ import annotations

import sys
from pathlib import Path


def rows(path: Path) -> list[tuple[str, ...]]:
    if not path.exists():
        return []
    return [tuple(line.split("\t")) for line in path.read_text().splitlines() if line]


def main(argv: list[str]) -> int:
    if argv == ["--version"]:
        print("SOUFFLE-TEST-DOUBLE fixture-v1")
        return 0
    if len(argv) != 5 or argv[0] != "-F" or argv[2] != "-D":
        return 2
    facts, output, query = Path(argv[1]), Path(argv[3]), Path(argv[4])
    if not query.is_file():
        return 2
    edges = {(left, right) for left, right in rows(facts / "SelectedEdge.facts")}
    reach = set(edges)
    changed = True
    while changed:
        changed = False
        additions = {(left, right2) for left, right1 in reach for left2, right2 in edges if right1 == left2} - reach
        if additions:
            reach.update(additions)
            changed = True
    required = [item[0] for item in rows(facts / "RequiredSource.facts")]
    targets = [item[0] for item in rows(facts / "Target.facts")]
    if len(targets) != 1:
        return 2
    violations = sorted(source for source in required if (source, targets[0]) not in reach)
    output.mkdir(parents=True, exist_ok=True)
    (output / "Violation.csv").write_text("".join(f"{source}\n" for source in violations))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
