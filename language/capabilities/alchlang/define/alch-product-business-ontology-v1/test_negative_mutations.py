#!/usr/bin/env python3
"""Prove semantic validation fails closed under representative mutations."""

from __future__ import annotations

import json
import shutil
import sys
import tempfile
from pathlib import Path

sys.dont_write_bytecode = True

from validate import ROOT, validate


def mutate_json(root: Path, name: str, mutation) -> None:
    path = root / name
    value = json.loads(path.read_text(encoding="utf-8"))
    mutation(value)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def run_case(name: str, mutation, expected_fragment: str) -> tuple[bool, str]:
    with tempfile.TemporaryDirectory(prefix="alch-ontology-mutation-") as temporary:
        root = Path(temporary) / "package"
        shutil.copytree(ROOT, root)
        mutation(root)
        result = validate(root)
        errors = "\n".join(result["errors"])
        return result["status"] == "FAIL" and expected_fragment in errors, errors


def main() -> int:
    cases = [
        (
            "record semantic collapse",
            lambda root: mutate_json(root, "business-ontology.json", lambda doc: next(node for node in doc["nodes"] if node["id"] == "b_record").update(kind="rule_declaration")),
            "record is not restricted to data-shape declaration",
        ),
        (
            "orthogonality collapse",
            lambda root: mutate_json(root, "business-ontology.json", lambda doc: doc["orthogonality"].update(constraint="record")),
            "orthogonality maps different meanings to the same construct",
        ),
        (
            "dangling business edge",
            lambda root: mutate_json(root, "business-ontology.json", lambda doc: doc["relations"][0].update(target="missing")),
            "business ontology dangling relation",
        ),
        (
            "product and language collapse",
            lambda root: mutate_json(root, "product-ontology.json", lambda doc: doc["nodes"][0].update(kind="record")),
            "product ontology collapses product meaning into language declarations",
        ),
        (
            "definition voice removal",
            lambda root: (root / "DEFINITIONS.md").write_text((root / "DEFINITIONS.md").read_text(encoding="utf-8").replace("**Operational.**", "Operational.", 1), encoding="utf-8"),
            "lacks **Operational.**",
        ),
        (
            "Alch source record introduction",
            lambda root: (root / "alch-language-model.alch").write_text((root / "alch-language-model.alch").read_text(encoding="utf-8") + "\nrecord WrongCollapse:\n  value: string required\n", encoding="utf-8"),
            "semantic-core Alch source wrongly models concepts as records",
        ),
    ]
    failures: list[str] = []
    for name, mutation, fragment in cases:
        passed, errors = run_case(name, mutation, fragment)
        print(f"{'PASS' if passed else 'FAIL'} {name}")
        if not passed:
            failures.append(f"{name}: expected {fragment!r}; errors={errors!r}")
    if failures:
        print("\n".join(failures))
        return 1
    print(f"PASS {len(cases)}/{len(cases)} negative semantic mutations rejected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
