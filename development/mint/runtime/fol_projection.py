#!/usr/bin/env python3
"""Project package relations into a strict internal TPTP FOF syntax subset."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import authority_package


COMPILER_VERSION = "mint.runtime.authority-fol.v0.1"
LANGUAGE_PROFILE = "tptp-fof-internal-subset.v0.1"
PROOF_CEILING = (
    "candidate-local internal TPTP-FOF-subset structural parity only; no theorem proving, "
    "satisfiability result, rule enforcement, ratification, release, deployment, or production proof"
)
FACT_RE = re.compile(
    r"^fof\((?P<name>[a-z][a-z0-9_]*), axiom, (?P<predicate>[a-z][a-z0-9_]*)"
    r"\('(?P<first>[A-Z][A-Z0-9._:-]*)'(?:,'(?P<second>[A-Z][A-Z0-9._:-]*)')?\)\)\.$"
)
INVARIANTS: dict[str, tuple[str, dict[str, Any]]] = {
    "rule_constitution_total": (
        "fof(rule_constitution_total, axiom, ! [R] : (rule(R) => ? [C] : (constitution(C) & rule_constitution(R,C)))).",
        {"formula_kind": "quantified", "quantifiers": ["forall:R", "exists:C"], "antecedent": "rule", "range": "constitution", "relation": "rule_constitution", "constraint": "total"},
    ),
    "rule_constitution_functional": (
        "fof(rule_constitution_functional, axiom, ! [R,C1,C2] : ((rule_constitution(R,C1) & rule_constitution(R,C2)) => C1 = C2)).",
        {"formula_kind": "quantified", "quantifiers": ["forall:R", "forall:C1", "forall:C2"], "relation": "rule_constitution", "constraint": "functional"},
    ),
    "method_kind_total": (
        "fof(method_kind_total, axiom, ! [M] : (method(M) => ? [K] : (authority_kind(K) & method_kind(M,K)))).",
        {"formula_kind": "quantified", "quantifiers": ["forall:M", "exists:K"], "antecedent": "method", "range": "authority_kind", "relation": "method_kind", "constraint": "total"},
    ),
}


def _name(prefix: str, *identifiers: str) -> str:
    digest = authority_package.sha256_bytes(authority_package.canonical_bytes(list(identifiers)))[:16]
    return f"{prefix}_{digest}"


def fact_ast(name: str, predicate: str, arguments: list[str]) -> dict[str, Any]:
    return {
        "formula_kind": "fact",
        "name": name,
        "role": "axiom",
        "predicate": predicate,
        "arguments": arguments,
    }


def render_fact(name: str, predicate: str, arguments: list[str]) -> str:
    encoded = ",".join(f"'{argument}'" for argument in arguments)
    return f"fof({name}, axiom, {predicate}({encoded}))."


def parse_statement(statement: str) -> dict[str, Any] | None:
    fact = FACT_RE.fullmatch(statement)
    if fact is not None:
        arguments = [fact.group("first")]
        if fact.group("second") is not None:
            arguments.append(fact.group("second"))
        return fact_ast(fact.group("name"), fact.group("predicate"), arguments)
    for _, (canonical, ast) in INVARIANTS.items():
        if statement == canonical:
            return ast
    return None


def statement_has_parity(statement: str, expected: dict[str, Any]) -> bool:
    return parse_statement(statement) == expected


def _statement(
    statement_id: str,
    kind: str,
    semantic_unit_refs: list[str],
    statement: str,
    expected_ast: dict[str, Any],
) -> dict[str, Any] | None:
    parsed = parse_statement(statement)
    if parsed != expected_ast:
        return None
    return {
        "statement_id": statement_id,
        "statement_kind": kind,
        "semantic_unit_refs": semantic_unit_refs,
        "statement": statement,
        "sha256": authority_package.sha256_bytes(statement.encode("utf-8")),
        "parsed_ast": parsed,
    }


def compile_fol(package: Any) -> dict[str, Any]:
    package_receipt = authority_package.validate_authority_package(package)
    compiler_sha256 = authority_package.sha256_file(Path(__file__).resolve())
    blockers = (
        []
        if package_receipt["status"] == "valid"
        else [f"FOL_PACKAGE_{error_id}" for error_id in package_receipt["error_ids"]]
    )
    statements: list[dict[str, Any]] = []
    parity: list[dict[str, Any]] = []
    invariant_parity: list[dict[str, str]] = []

    def add_fact(predicate: str, arguments: list[str], semantic_refs: list[str]) -> str | None:
        name = _name(predicate, *arguments)
        ast = fact_ast(name, predicate, arguments)
        record = _statement(name, "fact", semantic_refs, render_fact(name, predicate, arguments), ast)
        if record is None:
            blockers.append("FOL_INTERNAL_ROUND_TRIP_FAILED")
            return None
        statements.append(record)
        return name

    if not blockers:
        for constitution in sorted(package["constitutions"], key=lambda item: item["constitution_id"]):
            add_fact("constitution", [constitution["constitution_id"]], [constitution["constitution_id"]])
        for rule in sorted(package["rules"], key=lambda item: item["rule_id"]):
            statement_ids = [
                add_fact("rule", [rule["rule_id"]], [rule["rule_id"]]),
                add_fact(
                    "rule_constitution",
                    [rule["rule_id"], rule["constitution_ref"]],
                    [rule["rule_id"], rule["constitution_ref"]],
                ),
            ]
            parity.append(
                {
                    "semantic_unit_ref": rule["rule_id"],
                    "statement_ids": [item for item in statement_ids if item is not None],
                    "parity_state": "pass" if None not in statement_ids else "blocked",
                }
            )
        for kind in sorted(package["authority_kinds"], key=lambda item: item["authority_kind_id"]):
            add_fact("authority_kind", [kind["authority_kind_id"]], [kind["authority_kind_id"]])
        for method in sorted(package["methods"], key=lambda item: item["method_id"]):
            statement_ids: list[str | None] = [
                add_fact("method", [method["method_id"]], [method["method_id"]])
            ]
            for kind_id in sorted(method["authority_kind_refs"]):
                statement_ids.append(
                    add_fact(
                        "method_kind",
                        [method["method_id"], kind_id],
                        [method["method_id"], kind_id],
                    )
                )
            parity.append(
                {
                    "semantic_unit_ref": method["method_id"],
                    "statement_ids": [item for item in statement_ids if item is not None],
                    "parity_state": "pass" if None not in statement_ids else "blocked",
                }
            )
        for invariant_id, (statement, ast) in INVARIANTS.items():
            record = _statement(invariant_id, "invariant", [], statement, ast)
            if record is None:
                blockers.append("FOL_INTERNAL_INVARIANT_PARSE_FAILED")
                invariant_parity.append({"invariant_id": invariant_id, "parity_state": "blocked"})
            else:
                statements.append(record)
                invariant_parity.append({"invariant_id": invariant_id, "parity_state": "pass"})

    if blockers:
        status = "blocked"
        statements = []
        parity = []
        invariant_parity = []
    else:
        status = "ready"
    program = "\n".join(item["statement"] for item in statements) + ("\n" if statements else "")
    program_sha256 = authority_package.sha256_bytes(program.encode("utf-8"))
    projection = {
        "schema_version": "mint.authority-fol-projection.v0.1",
        "status": status,
        "package_id": package_receipt["package_id"],
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "language_profile": LANGUAGE_PROFILE,
        "program": program,
        "program_sha256": program_sha256,
        "statements": statements,
        "per_unit_parity": parity,
        "invariant_parity": invariant_parity,
        "proof_ceiling": PROOF_CEILING,
    }
    inventory = [
        {"statement_id": item["statement_id"], "sha256": item["sha256"], "size_bytes": len(item["statement"].encode("utf-8"))}
        for item in statements
    ]
    identity = {
        "compiler_version": COMPILER_VERSION,
        "compiler_sha256": compiler_sha256,
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "status": status,
        "language_profile": LANGUAGE_PROFILE,
        "program_sha256": program_sha256,
        "statement_inventory": inventory,
        "per_unit_parity": parity,
        "invariant_parity": invariant_parity,
        "blockers": sorted(set(blockers)),
        "authority_effect": "none",
    }
    receipt = {
        "schema_version": "mint.authority-fol-receipt.v0.1",
        "receipt_id": authority_package.sha256_bytes(authority_package.canonical_bytes(identity)),
        "compiler_version": COMPILER_VERSION,
        "compiler_sha256": compiler_sha256,
        "package_id": package_receipt["package_id"],
        "package_sha256": package_receipt["package_sha256"],
        "semantic_sha256": package_receipt["semantic_sha256"],
        "status": status,
        "language_profile": LANGUAGE_PROFILE,
        "program_sha256": program_sha256,
        "statement_inventory": inventory,
        "per_unit_parity": parity,
        "invariant_parity": invariant_parity,
        "blockers": sorted(set(blockers)),
        "writes_performed": 0,
        "authority_effect": "none",
        "proof_ceiling": PROOF_CEILING,
    }
    return {"projection": projection, "receipt": receipt}


def load_and_compile(path: Path) -> dict[str, Any]:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        package = {"load_error": f"{type(exc).__name__}: {exc}"}
    return compile_fol(package)
