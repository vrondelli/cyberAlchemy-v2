#!/usr/bin/env python3
"""Hostile package mutations that the system-ontology validator must reject."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Callable


TEST = Path(__file__).resolve()
PACKAGE = TEST.parents[1]
VALIDATOR = PACKAGE / "scripts/validate.py"
REPO = PACKAGE.parents[3]


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def mutate_json(package: Path, relative: str, mutation: Callable[[dict], None]) -> None:
    path = package / relative
    value = load(path)
    mutation(value)
    write(path, value)


def node(value: dict, node_id: str) -> dict:
    return next(item for item in value["nodes"] if item["id"] == node_id)


def relation(value: dict, relation_id: str) -> dict:
    return next(item for item in value["relations"] if item["id"] == relation_id)


def run_case(name: str, mutation: Callable[[Path], None]) -> None:
    with tempfile.TemporaryDirectory(prefix="lsk-negative-") as temporary:
        candidate = Path(temporary) / "system-ontology"
        shutil.copytree(PACKAGE, candidate, ignore=shutil.ignore_patterns("receipts", "__pycache__"))
        mutation(candidate)
        completed = subprocess.run(
            [sys.executable, str(VALIDATOR), "--package", str(candidate)],
            cwd=REPO.parent,
            text=True,
            capture_output=True,
            check=False,
        )
        if completed.returncode == 0:
            raise AssertionError(f"{name}: validator accepted hostile mutation")
        try:
            result = json.loads(completed.stdout)
        except json.JSONDecodeError as error:
            raise AssertionError(f"{name}: validator did not return a JSON result: {completed.stderr}") from error
        if result.get("overall") != "BLOCK":
            raise AssertionError(f"{name}: expected BLOCK, got {result.get('overall')}")


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="lsk-cwd-") as unrelated:
        from_repo = subprocess.run([sys.executable, str(VALIDATOR)], cwd=REPO, text=True, capture_output=True, check=False)
        from_unrelated = subprocess.run([sys.executable, str(VALIDATOR)], cwd=unrelated, text=True, capture_output=True, check=False)
        if from_repo.returncode != 0 or from_unrelated.returncode != 0 or from_repo.stdout != from_unrelated.stdout:
            raise AssertionError("validator result depends on caller working directory")

    cases: list[tuple[str, Callable[[Path], None]]] = [
        (
            "candidate-ui-kind-rejected",
            lambda package: mutate_json(package, "nodes.json", lambda value: node(value, "language-session-kernel.LanguageQuestionView").update({"kind": "View Model"})),
        ),
        (
            "ds-d8-endpoint-polarity-rejected",
            lambda package: mutate_json(package, "relations.json", lambda value: relation(value, "LSK-REL-001").update({"type": "reads"})),
        ),
        (
            "unknown-product-bridge-endpoint-rejected",
            lambda package: mutate_json(package, "product-bridge.json", lambda value: value["mappings"][0].update({"product_ref": "CA2-UNKNOWN"})),
        ),
        (
            "incomplete-review-binding-rejected",
            lambda package: mutate_json(package, "nodes.json", lambda value: node(value, "language-session-kernel.CandidateReviewBinding")["body"].update({"fields": [field for field in node(value, "language-session-kernel.CandidateReviewBinding")["body"]["fields"] if field["name"] != "preview_digest"]})),
        ),
        (
            "command-without-identity-rejected",
            lambda package: mutate_json(package, "nodes.json", lambda value: next(field for field in node(value, "language-session-kernel.LanguageSessionCommand")["body"]["fields"] if field["name"] == "command_id").update({"identity": False})),
        ),
        (
            "transport-selection-rejected",
            lambda package: mutate_json(package, "nodes.json", lambda value: node(value, "language-session-kernel.LanguageSessionKernelInterface")["body"].update({"interface_kind": "external"})),
        ),
        (
            "implementation-bridge-verb-rejected",
            lambda package: mutate_json(package, "product-bridge.json", lambda value: value["mappings"][0].update({"type": "implemented_by"})),
        ),
        (
            "creates-one-to-one-violation-rejected",
            lambda package: mutate_json(package, "relations.json", lambda value: relation(value, "LSK-REL-024").update({"to": "language-session-kernel.LanguageQuestion"})),
        ),
        (
            "defined-subject-coverage-drop-rejected",
            lambda package: mutate_json(package, "product-bridge.json", lambda value: value.update({"mappings": [mapping for mapping in value["mappings"] if mapping["id"] != "LSK-BRIDGE-021"]})),
        ),
        (
            "authority-inflation-rejected",
            lambda package: mutate_json(package, "nodes.json", lambda value: node(value, "language-session-kernel.LanguageSession").update({"authority_effect": "implementation"})),
        ),
        (
            "source-digest-drift-rejected",
            lambda package: mutate_json(package, "sources.json", lambda value: value["sources"][0].update({"sha256": "0" * 64})),
        ),
        (
            "unresolved-package-owner-rejected",
            lambda package: mutate_json(package, "profile.json", lambda value: value.update({"owner_route": "unresolved"})),
        ),
        (
            "privacy-residue-drop-rejected",
            lambda package: mutate_json(package, "residue.json", lambda value: value.update({"residue": [entry for entry in value["residue"] if entry["kind"] != "context-retention-and-privacy"]})),
        ),
    ]

    for name, mutation in cases:
        run_case(name, mutation)
    print(json.dumps({"status": "PASS", "cwd_independence": True, "negative_mutations": len(cases)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
