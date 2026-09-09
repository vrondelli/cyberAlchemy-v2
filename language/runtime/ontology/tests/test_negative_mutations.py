#!/usr/bin/env python3
"""Fail-closed regression mutations for the Language Runtime product ontology."""

from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
from pathlib import Path
from typing import Any, Callable


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = Path(__file__).resolve().parents[5]
VALIDATOR_PATH = PACKAGE_ROOT / "scripts" / "validate.py"


def load_validator() -> Any:
    spec = importlib.util.spec_from_file_location("lrpo_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load ontology validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_json(root: Path, relative_path: str) -> dict[str, Any]:
    return json.loads((root / relative_path).read_text(encoding="utf-8"))


def write_json(root: Path, relative_path: str, value: dict[str, Any]) -> None:
    (root / relative_path).write_text(
        json.dumps(value, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def definition_for(document: dict[str, Any], subject_ref: str) -> dict[str, Any]:
    return next(item for item in document["definitions"] if item["subject_ref"] == subject_ref)


def node_for(document: dict[str, Any], node_id: str) -> dict[str, Any]:
    return next(item for item in document["nodes"] if item["id"] == node_id)


def relation_for(document: dict[str, Any], relation_id: str) -> dict[str, Any]:
    return next(item for item in document["relations"] if item["id"] == relation_id)


def run_mutation(name: str, mutate: Callable[[Path], None], expected_fragment: str) -> None:
    with tempfile.TemporaryDirectory(prefix="lrpo-negative-") as temporary:
        mutant_root = Path(temporary) / "ontology"
        shutil.copytree(PACKAGE_ROOT, mutant_root)
        mutate(mutant_root)
        validator = load_validator()
        validator.PACKAGE_ROOT = mutant_root
        validator.REPOSITORY_ROOT = REPOSITORY_ROOT
        result = validator.validate_package()
        errors = "\n".join(result["errors"])
        if result["status"] != "BLOCK" or expected_fragment not in errors:
            raise AssertionError(
                f"{name} did not fail closed with {expected_fragment!r}:\n{errors}"
            )


def unknown_definition_subject(root: Path) -> None:
    document = load_json(root, "definitions.json")
    document["definitions"][0]["subject_ref"] = "CA2-SYS-UNKNOWN-SUBJECT"
    write_json(root, "definitions.json", document)


def runtime_contract_without_kind(root: Path) -> None:
    document = load_json(root, "definitions.json")
    definition_for(document, "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE")["authority_kind_ref"] = None
    write_json(root, "definitions.json", document)


def runtime_contract_marked_accepted(root: Path) -> None:
    document = load_json(root, "nodes.json")
    node_for(document, "CA2-SYS-LANGUAGE-RUNTIME-CONTRACT-CANDIDATE")["candidate_status"] = "projected"
    write_json(root, "nodes.json", document)


def experiment_treated_as_run_evidence(root: Path) -> None:
    document = load_json(root, "relations.json")
    relation_for(document, "LRPO-REL-045")["type"] = "observed_by"
    write_json(root, "relations.json", document)


def direct_question_record_rendering(root: Path) -> None:
    document = load_json(root, "relations.json")
    relation_for(document, "LRPO-REL-020")["target"] = "CA2-SYS-LANGUAGE-QUESTION-RECORD"
    write_json(root, "relations.json", document)


def stale_review_token_allowed(root: Path) -> None:
    document = load_json(root, "definitions.json")
    definition = definition_for(document, "CA2-RULE-REVIEW-BEFORE-CANDIDATE-EMISSION")
    definition["formal_voice"]["normative_candidate"] = "A reviewed draft may be materialized."
    write_json(root, "definitions.json", document)


def missing_policy_fixture(root: Path) -> None:
    document = load_json(root, "sources.json")
    document["sources"] = [
        source for source in document["sources"]
        if source["id"] != "SRC-LRPO-GOVERNANCE-POLICY-EXERCISE"
    ]
    write_json(root, "sources.json", document)


def dropped_unresolved_recommendation(root: Path) -> None:
    document = load_json(root, "definitions.json")
    definition = definition_for(document, "CA2-SYS-LANGUAGE-RUNTIME-EXPERIMENT-FRAME")
    replacement = copy.deepcopy(definition)
    for key in ("domain_context_voice", "operational_interpretation", "forbidden_collapse"):
        replacement[key] = "The exact bounded exercise is preserved."
    replacement["formal_voice"]["normative_candidate"] = "The exact bounded exercise is preserved through interruption."
    replacement["source_refs"] = [
        ref for ref in replacement["source_refs"]
        if ref["selector"] != "Rule Review Recommendation"
    ]
    definition.clear()
    definition.update(replacement)
    write_json(root, "definitions.json", document)


def missing_single_writer_expiry(root: Path) -> None:
    document = load_json(root, "residue.json")
    document["residue"] = [
        item for item in document["residue"]
        if item["id"] != "LRPO-RES-010-SINGLE-WRITER-FRAME-EXPIRY"
    ]
    write_json(root, "residue.json", document)


def omitted_question_view_endpoint(root: Path) -> None:
    document = load_json(root, "views/system-view.json")
    document["node_refs"].remove("CA2-SYS-LANGUAGE-QUESTION-VIEW")
    write_json(root, "views/system-view.json", document)


def missing_language_context_edge(root: Path) -> None:
    document = load_json(root, "relations.json")
    document["relations"] = [
        item for item in document["relations"] if item["id"] != "LRPO-REL-049"
    ]
    write_json(root, "relations.json", document)


def missing_language_binding_source(root: Path) -> None:
    document = load_json(root, "sources.json")
    document["sources"] = [
        item for item in document["sources"]
        if item["id"] != "SRC-LRPO-LANGUAGE-AUTHORITY-BINDINGS"
    ]
    write_json(root, "sources.json", document)


def open_realization_silently_selected(root: Path) -> None:
    document = load_json(root, "definitions.json")
    definition = definition_for(document, "CA2-CAP-RESOLVE-LANGUAGE-CONTEXT")
    definition["formal_voice"]["boundary_conditions"][1] = (
        "The resolver may select the most likely realization."
    )
    write_json(root, "definitions.json", document)


def definition_pack_drops_language_binding(root: Path) -> None:
    document = load_json(root, "definitions.json")
    definition = definition_for(document, "CA2-OUTPUT-DEFINITION-PACK")
    definition["formal_voice"]["expression"] = (
        "LanguageToDefine = {reuse -> reuse, specialize -> specialize, "
        "propose -> define_new_candidate, open -> unresolved}"
    )
    write_json(root, "definitions.json", document)


def main() -> int:
    cases = [
        ("unknown definition subject", unknown_definition_subject, "unknown subject_ref"),
        ("runtime contract kind", runtime_contract_without_kind, "must bind kind.runtime_contract"),
        ("runtime contract accepted", runtime_contract_marked_accepted, "must remain blocked"),
        ("experiment as evidence", experiment_treated_as_run_evidence, "must remain design intent"),
        ("direct record render", direct_question_record_rendering, "must render Question View"),
        ("stale review token", stale_review_token_allowed, "review binding must become stale"),
        ("missing fixture", missing_policy_fixture, "must bind the exact Governance Policy exercise source"),
        ("dropped recommendation", dropped_unresolved_recommendation, "must preserve the unresolved Rule Review Recommendation"),
        ("missing frame expiry", missing_single_writer_expiry, "LRPO-RES-010-SINGLE-WRITER-FRAME-EXPIRY"),
        ("omitted view endpoint", omitted_question_view_endpoint, "endpoints are not both visible"),
        ("missing Language Context edge", missing_language_context_edge, "missing required edge"),
        ("missing Language binding source", missing_language_binding_source, "missing Language Context sources"),
        ("silent open realization", open_realization_silently_selected, "must preserve exact source epoch and open realization gaps"),
        ("Definition Pack drops Language binding", definition_pack_drops_language_binding, "must preserve the Language Context View binding"),
    ]
    for name, mutate, expected in cases:
        run_mutation(name, mutate, expected)
    print(json.dumps({"status": "PASS", "negative_mutations": len(cases)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
