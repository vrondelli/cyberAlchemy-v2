#!/usr/bin/env python3
from __future__ import annotations

import ast
import hashlib
import json
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any


RUN_ID = "20260825T125032Z-domain-corpus-leakage"
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[5]

CANDIDATE_ROOT = REPO / "projects/domainspec-v2/development/remaining-meta-types/candidates"
BASELINE_PATH = REPO / "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/baseline/ALL-13-BASELINE.json"
SOURCE_LOCK_PATH = REPO / "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/baseline/SOURCE-LOCK-VALIDATION.json"

ANCHOR_PATHS = [
    "projects/domainspec-v2/impl/spec/meta-types/LEARNING-ORDER.md",
    "projects/domainspec-v2/development/refinement-runs/20260809T195857Z-remaining-active-meta-types/stages/06-invoke-design/DESIGN.md",
    "projects/domainspec-v2/development/refinement-runs/20260809T195857Z-remaining-active-meta-types/stages/09-invoke-plan/WORK-PACK.md",
    "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/README.md",
    "projects/domainspec-v2/impl/architecture-conformance/families/effects-connections/contracts/w3-contracts.ts",
    "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/README.md",
    "projects/domainspec-v2/impl/architecture-conformance/families/orchestration-lifecycle/contracts/w4-contracts.ts",
    "projects/domainspec-v2/impl/architecture-conformance/kernel/testing/validate-provider-firewalls.mjs",
    "projects/domainspec-v2/impl/architecture-conformance/kernel/testing/provider-firewalls.test.ts",
    "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/planning-correction-r10/PLAN-AUTHORING-BLOCKER-RECEIPT.json",
    "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/planning-correction-r10/RESULT.md",
    "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/planning-correction-r10/decision-gate/MTC-TARGET-FIREWALL-OWNERSHIP-001.request.json",
    "projects/domainspec-v2/development/meta-type-closure-epoch/execution-runs/wp-mtc-001/planning-correction-r10/decision-gate/MTC-TARGET-FIREWALL-OWNERSHIP-001.admissibility-receipt.json",
]

GENERIC_TARGETS = {
    ("Event", "python"),
    ("Event", "rust"),
    ("Interface", "rust"),
    ("Mapping", "python"),
    ("Mapping", "rust"),
}

INLINE_CASE_TARGETS = {
    ("Entity", "typescript"), ("Entity", "python"), ("Entity", "rust"),
    ("Value Object", "typescript"), ("Value Object", "python"), ("Value Object", "rust"),
    ("Event", "typescript"),
    ("Interface", "typescript"),
    ("Mapping", "typescript"),
    ("State Machine", "typescript"),
    ("Workflow", "typescript"),
}

SYSTEM_PATTERNS = {
    "Calculation": r"settlement",
    "Entity": r"Settlement|settlement|organization_id",
    "Event": r"Settlement|settlement",
    "Interface": r"Settlement|settlement",
    "Mapping": r"Settlement|settlement",
    "Operation": r"Settlement|settlement|Payout|payout",
    "Policy": r"Settlement|settlement",
    "Query": r"Settlement|settlement|Payout|payout",
    "Rule": r"Settle|settle|settlement",
    "State Machine": r"Settlement|settlement|settled|can-settle",
    "Value Object": r"Settlement|settlement|currency|account",
    "Workflow": r"Settlement|settlement",
}

INLINE_PATTERNS = {
    "Entity": r"type SettlementEntityInput|class SettlementEntitySnapshot|pub struct SettlementEntityInput",
    "Value Object": r"type SettlementValueInput|class SettlementValueInput|pub struct SettlementValueInput",
    "Event": r"makeSettlementEventCase",
    "Interface": r"makeSettlementInterfaceCase",
    "Mapping": r"makeSettlementMappingCase",
    "State Machine": r"settlementTransitions|makeSettlementStateMachineCase",
    "Workflow": r"makeSettlementWorkflowCase",
}

SEMANTIC_INLINE_PATTERNS = {
    "Event": r"def evaluate_event|pub fn evaluate_event",
    "Interface": r"pub fn evaluate_interface",
    "Mapping": r"def evaluate_mapping|pub fn evaluate_mapping",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized_repo_path(path: Path | str) -> str:
    value = Path(path)
    if value.is_absolute():
        value = value.relative_to(REPO)
    return value.as_posix()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def line_evidence(path: Path, pattern: str, category: str, note: str) -> dict[str, Any]:
    matcher = re.compile(pattern, re.IGNORECASE)
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if matcher.search(line):
            return {
                "category": category,
                "path": normalized_repo_path(path),
                "line_start": number,
                "line_end": number,
                "literal": line.strip()[:260],
                "note": note,
            }
    raise RuntimeError(f"evidence pattern did not match {path}: {pattern}")


def resolve_ts_import(target: Path, specifier: str) -> Path:
    value = (target.parent / specifier).resolve()
    if value.suffix == ".js":
        value = value.with_suffix(".ts")
    return value


def dependency_role(path: Path | None, specifier: str) -> tuple[str, str]:
    if path is None:
        return "standard_library", "language-runtime"
    value = normalized_repo_path(path)
    if "/realizations/" in value and "/fixtures/" in value:
        return "realization_fixture", "financial-settlement-corpus"
    if "/fixtures/" in value:
        return "corpus_fixture", "financial-settlement-corpus"
    if "/mutations/" in value or "/hostiles/" in value:
        return "test_evidence_helper", "test-corpus"
    if "/evaluator/" in value or "/decoder/" in value:
        return "semantic_evaluator_decoder", "generic-meta-type-semantics"
    if "/contracts/" in value:
        return "generic_contract", "generic-meta-type-semantics"
    return "internal_other", "uncertain"


def direct_imports(path: Path, language: str) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    imports: list[dict[str, Any]] = []
    if language == "typescript":
        pattern = re.compile(r"(^|\n)(import\s+(?:type\s+)?[\s\S]*?\sfrom\s+\"([^\"]+)\";)")
        for match in pattern.finditer(text):
            statement = match.group(2)
            specifier = match.group(3)
            start = text[: match.start(2)].count("\n") + 1
            end = start + statement.count("\n")
            resolved = resolve_ts_import(path, specifier) if specifier.startswith(".") else None
            role, owner = dependency_role(resolved, specifier)
            imports.append({
                "specifier": specifier,
                "line_start": start,
                "line_end": end,
                "import_kind": "type-only" if statement.lstrip().startswith("import type") else "runtime",
                "resolved_path": normalized_repo_path(resolved) if resolved else None,
                "resolved_exists": resolved.exists() if resolved else None,
                "resolved_sha256": sha256(resolved) if resolved and resolved.exists() else None,
                "role": role,
                "owner": owner,
            })
    elif language == "python":
        tree = ast.parse(text)
        for node in tree.body:
            if not isinstance(node, (ast.Import, ast.ImportFrom)):
                continue
            if isinstance(node, ast.Import):
                specifier = ",".join(alias.name for alias in node.names)
            else:
                specifier = ("." * node.level) + (node.module or "")
            resolved: Path | None = None
            if specifier == "fixtures.can_settle_payout":
                resolved = REPO / "projects/domainspec-v2/impl/architecture-conformance/targets/python/fixtures/can_settle_payout.py"
            role, owner = dependency_role(resolved, specifier)
            imports.append({
                "specifier": specifier,
                "line_start": node.lineno,
                "line_end": getattr(node, "end_lineno", node.lineno),
                "import_kind": "runtime",
                "resolved_path": normalized_repo_path(resolved) if resolved else None,
                "resolved_exists": resolved.exists() if resolved else None,
                "resolved_sha256": sha256(resolved) if resolved and resolved.exists() else None,
                "role": role,
                "owner": owner,
            })
    elif language == "rust":
        for number, line in enumerate(text.splitlines(), 1):
            if re.match(r"\s*use\s+", line):
                role, owner = dependency_role(None, line)
                imports.append({
                    "specifier": line.strip(),
                    "line_start": number,
                    "line_end": number,
                    "import_kind": "runtime",
                    "resolved_path": None,
                    "resolved_exists": None,
                    "resolved_sha256": None,
                    "role": role,
                    "owner": owner,
                })
            path_match = re.search(r"#\[path\s*=\s*\"([^\"]+)\"\]", line)
            if path_match:
                specifier = path_match.group(1)
                resolved = (path.parent / specifier).resolve()
                role, owner = dependency_role(resolved, specifier)
                imports.append({
                    "specifier": specifier,
                    "line_start": number,
                    "line_end": number + 1,
                    "import_kind": "runtime-module",
                    "resolved_path": normalized_repo_path(resolved),
                    "resolved_exists": resolved.exists(),
                    "resolved_sha256": sha256(resolved) if resolved.exists() else None,
                    "role": role,
                    "owner": owner,
                })
    return imports


def target_classifications(label: str, language: str, imports: list[dict[str, Any]]) -> list[str]:
    key = (label, language)
    if key in GENERIC_TARGETS:
        return ["clean_generic", "uncertain"]
    classes = ["system_domain_vocabulary"]
    roles = {item["role"] for item in imports if item["import_kind"] != "type-only"}
    if "corpus_fixture" in roles or "realization_fixture" in roles:
        classes.append("fixture_corpus_import")
    if "semantic_evaluator_decoder" in roles:
        classes.append("semantic_evaluator_decoder_import")
    if "realization_fixture" in roles:
        classes.append("realization_import")
    if key in INLINE_CASE_TARGETS:
        classes.append("inline_domain_case_construction")
    if "test_evidence_helper" in roles:
        classes.append("test_only_evidence")
    return classes


def target_evidence(path: Path, label: str, language: str, classes: list[str], imports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    if "clean_generic" in classes:
        evidence.append({
            "category": "clean_generic",
            "path": normalized_repo_path(path),
            "line_start": 1,
            "line_end": len(path.read_text(encoding="utf-8").splitlines()),
            "literal": None,
            "note": "Full-file contextual review found corpus-generic vocabulary and no Financial Settlement, Bolina, Shipment Priority, internal fixture, family evaluator, or realization dependency.",
        })
        evidence.append(line_evidence(path, SEMANTIC_INLINE_PATTERNS[label], "uncertain", "The file implements generic evaluator behavior inline. It is corpus-clean, but whether that behavior belongs to the native target or duplicates family-owned semantics needs a separate semantic ownership decision."))
    if "system_domain_vocabulary" in classes:
        evidence.append(line_evidence(path, SYSTEM_PATTERNS[label], "system_domain_vocabulary", "Contextual identifier or literal names the Financial Settlement system domain; this is not a token-only inference."))
    if "inline_domain_case_construction" in classes:
        evidence.append(line_evidence(path, INLINE_PATTERNS[label], "inline_domain_case_construction", "The target declares or constructs a settlement-specific case/value/entity rather than only a language-native generic observation."))
    role_to_class = {
        "corpus_fixture": "fixture_corpus_import",
        "realization_fixture": "fixture_corpus_import",
        "semantic_evaluator_decoder": "semantic_evaluator_decoder_import",
        "test_evidence_helper": "test_only_evidence",
    }
    emitted: set[tuple[str, int]] = set()
    for item in imports:
        if item["import_kind"] == "type-only":
            continue
        category = role_to_class.get(item["role"])
        if not category or category not in classes:
            continue
        key = (category, item["line_start"])
        if key in emitted:
            continue
        emitted.add(key)
        evidence.append({
            "category": category,
            "path": normalized_repo_path(path),
            "line_start": item["line_start"],
            "line_end": item["line_end"],
            "literal": item["specifier"],
            "note": f"Direct {item['import_kind']} dependency resolves to {item['resolved_path']} ({item['owner']}).",
        })
    if "realization_import" in classes:
        item = next(item for item in imports if item["role"] == "realization_fixture")
        evidence.append({
            "category": "realization_import",
            "path": normalized_repo_path(path),
            "line_start": item["line_start"],
            "line_end": item["line_end"],
            "literal": item["specifier"],
            "note": "Target imports a realization-owned fixture, reversing the intended target-to-adapter dependency direction.",
        })
    return evidence


def selected_lines(path: Path, selectors: list[tuple[int, int]]) -> list[dict[str, Any]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    return [
        {
            "path": normalized_repo_path(path),
            "line_start": start,
            "line_end": end,
            "sha256": sha256(path),
            "text": "\n".join(lines[start - 1:end]),
        }
        for start, end in selectors
    ]


def build_inventory() -> tuple[dict[str, Any], dict[str, Any]]:
    baseline = load_json(BASELINE_PATH)
    baseline_by_type = {row["id"]: row for row in baseline["meta_type_denominator"]}
    candidates: list[dict[str, Any]] = []
    target_rows: list[dict[str, Any]] = []
    dependencies: dict[str, dict[str, Any]] = {}

    for candidate_path in sorted(CANDIDATE_ROOT.glob("*.json")):
        candidate = load_json(candidate_path)
        meta = candidate["meta_type"]
        meta_type_id = meta["id"]
        baseline_row = baseline_by_type[meta_type_id]
        candidate_hash = sha256(candidate_path)
        candidate_row = {
            "meta_type_id": meta_type_id,
            "meta_type_label": meta["label"],
            "candidate_id": candidate["candidate_id"],
            "candidate_path": normalized_repo_path(candidate_path),
            "candidate_sha256": candidate_hash,
            "baseline_candidate_sha256": baseline_row["candidate_sha256"],
            "candidate_matches_baseline": candidate_hash == baseline_row["candidate_sha256"],
            "target_slot_count": len(candidate.get("targets", [])),
            "declared_target_path_count": 0,
        }
        for index, target in enumerate(candidate.get("targets", [])):
            language = target["language"]
            source = target.get("source") or target.get("source_ref") or {}
            declared_path = source.get("path")
            declared_sha = source.get("sha256")
            declared_size = source.get("size_bytes")
            if not declared_path:
                target_rows.append({
                    "meta_type_id": meta_type_id,
                    "meta_type_label": meta["label"],
                    "candidate_path": normalized_repo_path(candidate_path),
                    "candidate_target_json_pointer": f"/targets/{index}",
                    "language": language,
                    "declared_path": None,
                    "normalized_path": None,
                    "exists": None,
                    "declared_sha256": declared_sha,
                    "actual_sha256": None,
                    "declared_size_bytes": declared_size,
                    "actual_size_bytes": None,
                    "source_lock_status": "missing-declaration",
                    "direct_imports": [],
                })
                continue
            candidate_row["declared_target_path_count"] += 1
            path = REPO / declared_path
            imports = direct_imports(path, language)
            for item in imports:
                if not item["resolved_path"]:
                    continue
                dep_path = REPO / item["resolved_path"]
                dependencies[item["resolved_path"]] = {
                    "path": item["resolved_path"],
                    "exists": dep_path.exists(),
                    "sha256": sha256(dep_path) if dep_path.exists() else None,
                    "size_bytes": dep_path.stat().st_size if dep_path.exists() else None,
                    "role": item["role"],
                    "owner": item["owner"],
                }
            actual_sha = sha256(path)
            actual_size = path.stat().st_size
            target_rows.append({
                "meta_type_id": meta_type_id,
                "meta_type_label": meta["label"],
                "candidate_path": normalized_repo_path(candidate_path),
                "candidate_target_json_pointer": f"/targets/{index}",
                "language": language,
                "declared_path": declared_path,
                "normalized_path": normalized_repo_path(path.resolve()),
                "exists": path.exists(),
                "declared_sha256": declared_sha,
                "actual_sha256": actual_sha,
                "declared_size_bytes": declared_size,
                "actual_size_bytes": actual_size,
                "source_lock_status": "match" if declared_sha == actual_sha and (declared_size is None or declared_size == actual_size) else "drift",
                "direct_imports": imports,
            })
        candidates.append(candidate_row)

    def meta_order(value: dict[str, Any]) -> tuple[int, str]:
        match = re.search(r"D1\.(\d+)", value["meta_type_id"])
        return (int(match.group(1)) if match else 999, value["language"])

    target_rows.sort(key=meta_order)
    candidates.sort(key=lambda value: meta_order({**value, "language": ""}))
    normalized = [row["normalized_path"] for row in target_rows if row["normalized_path"]]
    counts = {
        "meta_type_count": len(candidates),
        "target_language_slot_count": len(target_rows),
        "declared_target_path_count": len(normalized),
        "unique_normalized_target_path_count": len(set(normalized)),
        "missing_target_path_declaration_count": sum(row["source_lock_status"] == "missing-declaration" for row in target_rows),
        "missing_target_file_count": sum(row["exists"] is False for row in target_rows),
        "matching_target_source_lock_count": sum(row["source_lock_status"] == "match" for row in target_rows),
        "drifted_target_source_lock_count": sum(row["source_lock_status"] == "drift" for row in target_rows),
        "language_declared_path_counts": dict(sorted(Counter(row["language"] for row in target_rows if row["normalized_path"]).items())),
    }
    inventory = {
        "schema_version": "domainspec.architecture-pattern-inventory.target-inventory/v1",
        "run_id": RUN_ID,
        "result": "pass-with-findings",
        "denominator_derivation": "The 13 current candidate manifests are authoritative for target slots. Every targets[] row is included; source.path/source_ref.path is normalized once. No directory discovery adds targets.",
        "baseline": {
            "path": normalized_repo_path(BASELINE_PATH),
            "sha256": sha256(BASELINE_PATH),
            "source_lock_validation_path": normalized_repo_path(SOURCE_LOCK_PATH),
            "source_lock_validation_sha256": sha256(SOURCE_LOCK_PATH),
            "source_lock_validation_freshness": "historic-only; current bytes independently rehashed by this audit",
        },
        "counts": counts,
        "candidate_inventory": candidates,
        "target_inventory": target_rows,
        "dependency_inventory": [dependencies[key] for key in sorted(dependencies)],
        "closure_findings": [
            "Enum declares TypeScript, Python, and Rust target slots but no source path/hash/size in the candidate manifest.",
            "Rule has three current one-byte newline-normalization drifts relative to its candidate source locks.",
            "All 36 declared paths exist and are unique; all 13 candidate manifests match the frozen ALL-13 baseline.",
        ],
        "claim_ceiling": "Exact current target-declaration and direct-import inventory only; not implementation acceptance, target ownership selection, admission, or repair authority.",
        "authority_effect": "none",
    }

    finding_rows: list[dict[str, Any]] = []
    for row in target_rows:
        if row["normalized_path"] is None:
            finding_rows.append({
                "meta_type_id": row["meta_type_id"],
                "meta_type_label": row["meta_type_label"],
                "language": row["language"],
                "path": None,
                "primary_classification": "uncertain",
                "classifications": ["uncertain"],
                "system_corpus": "logistics-shipment-priority",
                "severity": "inventory-blocker",
                "evidence": [{
                    "category": "uncertain",
                    "path": row["candidate_path"],
                    "json_pointer": row["candidate_target_json_pointer"],
                    "literal": "target slot has language but no source/source_ref path, hash, or size",
                    "note": "Enum's candidate identity is Shipment Priority, but target bytes cannot be classified without declared source paths.",
                }],
                "direct_imports": [],
            })
            continue
        path = REPO / row["normalized_path"]
        classes = target_classifications(row["meta_type_label"], row["language"], row["direct_imports"])
        finding_rows.append({
            "meta_type_id": row["meta_type_id"],
            "meta_type_label": row["meta_type_label"],
            "language": row["language"],
            "path": row["normalized_path"],
            "primary_classification": "clean_generic" if "clean_generic" in classes else ("fixture_corpus_import" if "fixture_corpus_import" in classes else "system_domain_vocabulary"),
            "classifications": classes,
            "system_corpus": None if "clean_generic" in classes else "financial-settlement",
            "severity": "review" if "clean_generic" in classes else ("high" if any(value in classes for value in ["fixture_corpus_import", "semantic_evaluator_decoder_import", "realization_import", "inline_domain_case_construction"]) else "medium"),
            "evidence": target_evidence(path, row["meta_type_label"], row["language"], classes, row["direct_imports"]),
            "direct_imports": row["direct_imports"],
        })

    classification_counts = Counter()
    for row in finding_rows:
        classification_counts.update(row["classifications"])
    by_language = {}
    for language in ["typescript", "python", "rust"]:
        rows = [row for row in finding_rows if row["language"] == language]
        by_language[language] = {
            "target_slots": len(rows),
            "declared_paths": sum(row["path"] is not None for row in rows),
            "clean_generic": sum("clean_generic" in row["classifications"] for row in rows),
            "leakage_candidate": sum(row["path"] is not None and "clean_generic" not in row["classifications"] for row in rows),
            "uncertain_missing_path": sum(row["path"] is None for row in rows),
        }
    by_type = {}
    for candidate in candidates:
        rows = [row for row in finding_rows if row["meta_type_id"] == candidate["meta_type_id"]]
        by_type[candidate["meta_type_label"]] = {
            "meta_type_id": candidate["meta_type_id"],
            "declared_paths": sum(row["path"] is not None for row in rows),
            "clean_generic": sum("clean_generic" in row["classifications"] for row in rows),
            "leakage_candidate": sum(row["path"] is not None and "clean_generic" not in row["classifications"] for row in rows),
            "uncertain_missing_path": sum(row["path"] is None for row in rows),
        }

    leakage = {
        "schema_version": "domainspec.architecture-pattern-inventory.leakage-findings/v1",
        "run_id": RUN_ID,
        "result": "findings-present",
        "classification_policy": {
            "contextual_rule": "A token alone is not proof. system_domain_vocabulary requires a contextual identifier/literal that names a business concept or behavior; import classifications require an exact resolved dependency.",
            "clean_generic": "Target contains corpus-generic meta-type data/evaluation and no contextual system corpus or forbidden internal dependency in the reviewed full file. This does not settle whether inline evaluation duplicates family-owned semantics.",
            "system_domain_vocabulary": "Target embeds Financial Settlement business names, identifiers, state, routes, or outcomes.",
            "fixture_corpus_import": "Target directly imports a system/example fixture or candidate fixture.",
            "semantic_evaluator_decoder_import": "Target directly imports runtime family evaluation or decoding behavior that the selected Design assigns to composition.",
            "realization_import": "Target directly imports a realization-owned module.",
            "inline_domain_case_construction": "Target declares or constructs a Financial Settlement case/entity/value within the generic target layer.",
            "test_only_evidence": "Target directly imports hostile/mutation evidence intended for validation rather than reusable target runtime.",
            "uncertain": "Either a target language slot has no source declaration, or a corpus-generic target implements evaluator behavior inline whose semantic owner cannot be settled by dependency/corpus evidence alone.",
        },
        "counts": {
            "classification_membership": dict(sorted(classification_counts.items())),
            "by_language": by_language,
            "by_type": by_type,
            "bolina_declared_target_path_count": 0,
            "logistics_shipment_priority_declared_target_path_count": 0,
            "financial_settlement_leakage_candidate_path_count": sum(row["system_corpus"] == "financial-settlement" for row in finding_rows),
        },
        "firewall_analysis": {
            "current_scope": "TypeScript runtime import path firewall; type-only imports are intentionally excluded.",
            "true_positive_paths": [
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/event-v1.ts",
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/interface-v1.ts",
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/mapping-v1.ts",
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/rule-v1.ts",
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/state-machine-v1.ts",
                "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/workflow-v1.ts",
            ],
            "false_negatives": [
                "Policy TypeScript/Python/Rust hard-code settlement.route.* strategy identities without any forbidden import.",
                "Entity, Value Object, Operation, Query, and Calculation targets embed Financial Settlement concepts in all three languages without cross-layer imports.",
                "Rule Python imports fixtures.can_settle_payout and Rule Rust includes ../../fixtures/can_settle_payout.rs; the current TypeScript-only import scanner does not inspect either language.",
                "State Machine and Workflow Python/Rust embed settlement states, effect intents, or outcomes without a forbidden TypeScript import.",
            ],
            "false_positive_risk": [
                "A path segment named fixtures does not by itself prove system leakage; ownership and fixture contents must be checked.",
                "Family contract type-only imports are benign shape dependencies under the current contract and must not be promoted to runtime violations.",
                "Generic words such as state, route, account, or order are not sufficient evidence without contextual business identifiers or behavior.",
            ],
        },
        "findings": finding_rows,
        "repair_denominator_candidates": {
            "ownership_review_target_paths": 31,
            "corpus_generic_semantic_ownership_review_paths": 5,
            "direct_cross_lane_target_paths": 8,
            "inline_domain_case_target_paths": 11,
            "enum_missing_source_declarations": 3,
            "candidate_scope_statement": "Candidate review scope starts with 31 Financial Settlement leakage candidates, five corpus-generic targets whose inline evaluator ownership remains uncertain, eight direct cross-lane import targets, and three Enum source declarations. Exact repair and binding/provider/request/candidate/receipt fan-out must be derived in a new Plan after ownership selection; this audit does not assert that transitive denominator.",
        },
        "decision_effect": "none",
        "authority_effect": "none",
    }
    return inventory, leakage


def markdown_files(inventory: dict[str, Any], leakage: dict[str, Any]) -> dict[str, str]:
    c = leakage["counts"]["classification_membership"]
    architecture = f"""# DomainSpec v2 Meta-Type Target Architecture Audit

## Outcome

The current target layer is not consistently generic. Of 36 declared target files, 31 carry Financial Settlement vocabulary or stronger cross-layer evidence. Five are corpus-generic, but they implement evaluator behavior inline, so semantic ownership remains unresolved rather than proven clean. Enum contributes three language slots but declares no target source paths, so its bytes are not classifiable from the current candidate manifest.

This is an observed architecture audit, not a repair decision. The exact machine denominator is in [TARGET-INVENTORY.json](./TARGET-INVENTORY.json), and path-level evidence is in [LEAKAGE-FINDINGS.json](./LEAKAGE-FINDINGS.json).

## Intended layers

The selected Design separates authored meaning from native observation. Its relevant constraints are:

- DomainSpec does not generate business meaning (Design line 13).
- the proof denominator is authored outside candidates/providers (line 108);
- a target observation contains native facts and no expected outcomes (lines 110-112);
- a realization composition adapter imports exactly one family and one language target (lines 132-162);
- expected outcomes and mutants do not flow into targets (lines 148-159);
- the Work Pack's per-type target unit includes the native observation, composition adapter, and provider as distinct responsibilities (Work Pack lines 59-64).

Recommended dependency direction:

```text
system-owned corpus (descriptor, observation, hostiles, expected outcomes)
    -> realization composition adapter
        -> generic family evaluator + language-native target
            -> provider execution and candidate-local evidence
```

The system corpus supplies inputs. It does not become reusable DomainSpec target implementation.

## Observed layers

```text
candidate manifest
    -> target
        -> inline Financial Settlement vocabulary/builders ({c.get('system_domain_vocabulary', 0)} paths / {c.get('inline_domain_case_construction', 0)} builders)
        -> family fixtures/evaluators in TypeScript and Rule fixtures across languages
        -> provider/factory execution
```

The strongest leakage is not merely naming. Eight target paths directly depend on corpus/realization fixtures, five TypeScript targets also import family evaluator/decoder runtime behavior, and one Event target imports hostile test evidence. Policy demonstrates the opposite failure mode: all three Policy targets hard-code settlement routing while importing nothing forbidden.

## System corpus ownership

- **Financial Settlement** is example/proof-corpus data. W3/W4 call it a Financial Settlement fixture, and their contracts cap claims at `candidate-local-exact-fixture`.
- **Shipment Priority** is the Enum candidate's logistics corpus, but Enum's three target source paths are missing from its manifest.
- **Bolina** is absent from all 36 declared target files. This audit does not infer anything about Bolina outside that exact denominator.

## Observed-versus-intended gap

| Concern | Intended | Observed |
|---|---|---|
| Generic target | Native language facts/projection only | 31 paths contain system-domain vocabulary or stronger leakage evidence; five corpus-generic targets still contain inline evaluator logic needing semantic review |
| Composition | Adapter joins family + target + supplied corpus | Five TS targets import family evaluator runtime and settlement fixtures directly |
| Realization boundary | Target is an adapter input | Rule TS imports a realization fixture; Rule Python/Rust import target fixture modules |
| Test evidence | Corpus/hostiles remain outside target runtime | Event TS imports a hostile mutation helper |
| Multi-language firewall | Same ownership rule in TS/Python/Rust | Current scanner observes TS runtime imports only |
| Inventory closure | Each language slot binds an exact source | Enum has three slots and zero source declarations |

## Claim ceiling

This package proves the current candidate-declared target denominator, direct imports, contextual literals, and layer mismatches. It does not choose ownership, assert every path must be rewritten, freeze the transitive repair denominator, admit a candidate, or authorize product mutation.
"""

    foundations = """# Architecture Foundations

## Target

A target is a language-native observation/projection of one generic meta-type contract. It may carry language mechanisms and type-only contract shapes. It does not own a business system's named cases, expected outcomes, hostiles, or fixture construction.

## System-owned corpus

A system-owned corpus supplies descriptors, observations, domain vocabulary, expected outcomes, and hostile cases for a concrete system such as Financial Settlement or Shipment Priority. Its proof may be reused as test input, but that does not make it generic DomainSpec implementation.

## Realization composition adapter

The adapter is the explicit join. It receives a system corpus case and combines exactly one generic family evaluator with one language-native target. Moving the join here preserves separate meta-type semantics and keeps system meaning outside generic targets.

## Provider

The provider executes the selected adapter/target path and records evidence. It does not become the author of family semantics or the owner of system corpus meaning.

## Evidence hierarchy

An exact resolved runtime import is stronger boundary evidence than a token. A contextual business identifier or complete behavior is stronger than a generic word. A path name alone is insufficient without owner/content evidence.
"""

    dependency_rules = """# Dependency Rules

1. A target may import language-runtime libraries and type-only generic contracts.
2. A target must not import family evaluator/decoder runtime, realization implementation, system fixtures, expected outcomes, mutants, or hostile test helpers.
3. A system corpus may depend on its own domain vocabulary and cases, but remains outside the generic target layer.
4. A realization composition adapter may depend on exactly one family evaluator and one target, and receives the system corpus as input.
5. A provider may execute the adapter and record evidence; it does not absorb authored semantics.
6. Every candidate language slot must declare one exact normalized source path, hash, and size.
7. Cross-language firewall validation must inspect TypeScript, Python, and Rust dependency forms and must pair import scanning with contextual literal/ownership evidence.

The current dependency findings are enumerated in [../LEAKAGE-FINDINGS.json](../LEAKAGE-FINDINGS.json).
"""

    testing = """# Testing Alignment

Required future checks, after a new ownership decision and Plan:

- verify target source declarations close all 13 types and 39 language slots;
- scan TypeScript runtime imports while preserving the type-only exemption;
- resolve Python internal imports and Rust `#[path]` modules, not only TypeScript imports;
- fail when targets import system fixtures, realizations, evaluators/decoders, expected outcomes, mutants, or hostiles;
- use contextual domain-literal evidence to catch import-free Policy/Entity/Value Object/Operation/Query/Calculation leakage without treating generic words as failures;
- test generic targets independently from Financial Settlement and Shipment Priority corpora;
- test the composition adapter with corpus supplied as input;
- preserve exact source hashes and fail current-byte freshness separately from historical receipts.

Current source freshness is not fully closed: three Rule target locks differ by one newline byte from the live files, and Enum has no source locks to check.
"""

    observability = """# Observability Alignment

No telemetry or authority state was changed by this audit. A future validator can emit non-authorizing run-local evidence for:

- candidate count and target language-slot count;
- declared, missing, duplicate, and drifted target paths;
- runtime imports by ownership role and language;
- contextual system-domain findings by corpus and type;
- inline case builders and test-only imports;
- source-lock freshness and validator coverage.

These signals describe evidence quality. They must not imply admission, promotion, product readiness, or owner acceptance.
"""

    concepts = """# Concepts

| Concept | Owner | Meaning in this audit |
|---|---|---|
| Generic meta-type semantics | DomainSpec family | Cross-language invariant and evaluator meaning |
| Language-native target | DomainSpec target | Native observation/projection without system meaning |
| System-owned corpus | Consuming system or explicit example package | Descriptor, observation, hostiles, expected outcomes, and domain cases |
| Realization composition adapter | DomainSpec realization boundary | Joins one family evaluator, one target, and supplied corpus input |
| Provider | Realization/provider layer | Executes the selected adapter/target and records evidence |
| Candidate manifest | Candidate governance | Binds exact target sources; does not promote them |
| Firewall | Kernel test boundary | Detects forbidden ownership dependencies; current implementation is import- and TS-centered |
"""

    relationships = """# Relationships

| From | Relationship | To | Allowed? |
|---|---|---|---|
| System-owned corpus | supplies descriptor/observation/hostiles | Realization composition adapter | Yes |
| Composition adapter | imports one generic evaluator | Family semantics | Yes |
| Composition adapter | imports one language-native target | Target | Yes |
| Provider | executes | Composition adapter | Yes |
| Target | type-only shape dependency | Generic contract | Yes |
| Target | runtime import | Family evaluator/decoder | No |
| Target | runtime import | System fixture or realization fixture | No |
| Target | embeds | System expected outcomes/hostiles/case construction | No under the recommended architecture |
"""

    pattern_readme = """# Domain-Corpus Separation Pattern Library

This pattern library distills the audit without changing product bytes or selecting a repair.

- [Architecture foundations](./ARCHITECTURE-FOUNDATIONS.md)
- [Dependency rules](./DEPENDENCY-RULES.md)
- [Testing alignment](./TESTING-ALIGNMENT.md)
- [Observability alignment](./OBSERVABILITY-ALIGNMENT.md)
- [Concepts](./CONCEPTS.md)
- [Relationships](./RELATIONSHIPS.md)

The machine inventory remains authoritative for counts and exact paths: [../TARGET-INVENTORY.json](../TARGET-INVENTORY.json) and [../LEAKAGE-FINDINGS.json](../LEAKAGE-FINDINGS.json).
"""

    library_index = """# Architecture Pattern Library

## Patterns extracted

1. **Corpus outside target** — business-system cases are inputs, not generic target implementation.
2. **Adapter-owned composition** — the realization adapter is the sole runtime join between one family evaluator and one language target.
3. **Target as native observation** — language mechanisms are allowed; expected outcomes and system case construction are not.
4. **Contextual firewall** — exact dependency paths are primary evidence, while literals require contextual interpretation.
5. **Candidate-local fixture ceiling** — fixture proof does not make Financial Settlement reusable DomainSpec infrastructure.
6. **Cross-language parity** — Python and Rust dependency forms must receive the same ownership checks as TypeScript.

See the [pattern-library index](./pattern-library/README.md) for foundations and rules.
"""

    recommendation = """# Recommendation

## Recommended architecture

Keep generic targets free of system-owned cases. Place Financial Settlement and Shipment Priority descriptors, observations, expected outcomes, hostiles, and builders in a system-owned corpus package. Pass those cases into a realization composition adapter that joins one family evaluator with one language-native target. Providers execute that adapter and record evidence.

## Decision-gate effect

Do not select the current A/B/C options as written. They all assume that settlement construction belongs somewhere inside the generic target/helper/provider surface. In particular, current option B cannot be narrowed to system-owned corpus plus adapter composition without changing its ownership semantics.

Preserve the stable blocker identity `MTC-TARGET-FIREWALL-OWNERSHIP-001`, but supersede and reissue its request/options as a new revision. The recommended revised option is:

- **A2 — System-owned corpus + adapter composition:** target stays generic; corpus stays with the consuming system/example package; adapter owns the explicit join; provider only executes it.

Alternatives can cover a transitional corpus package or provider invocation shape, but none should make the target the owner of settlement fixtures.

## Bounded next route

Run `decision-gate` to invalidate/supersede the current option set and present revised ownership options. Only after explicit user selection should Invoke Plan derive exact transitive repair closure. The starting review denominator is 31 leakage-candidate target paths, five corpus-generic targets with unresolved inline evaluator ownership, eight direct cross-lane target paths, three missing Enum source declarations, and their selector-derived binding/provider/request/candidate/receipt fan-out.

No repair, Plan correction, candidate postimage, decision selection, or authority change is part of this audit.
"""

    return {
        "ARCHITECTURE.md": architecture,
        "ARCHITECTURE-PATTERN-LIBRARY.md": library_index,
        "RECOMMENDATION.md": recommendation,
        "pattern-library/README.md": pattern_readme,
        "pattern-library/ARCHITECTURE-FOUNDATIONS.md": foundations,
        "pattern-library/DEPENDENCY-RULES.md": dependency_rules,
        "pattern-library/TESTING-ALIGNMENT.md": testing,
        "pattern-library/OBSERVABILITY-ALIGNMENT.md": observability,
        "pattern-library/CONCEPTS.md": concepts,
        "pattern-library/RELATIONSHIPS.md": relationships,
    }


def validate_links(markdown_paths: list[Path]) -> list[str]:
    failures = []
    pattern = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
    for path in markdown_paths:
        for target in pattern.findall(path.read_text(encoding="utf-8")):
            if target.startswith(("http://", "https://", "#")):
                continue
            resolved = (path.parent / target.split("#", 1)[0]).resolve()
            if not resolved.exists():
                failures.append(f"{path.relative_to(HERE)} -> {target}")
    return failures


def main() -> None:
    inventory, leakage = build_inventory()
    dump_json(HERE / "TARGET-INVENTORY.json", inventory)
    dump_json(HERE / "LEAKAGE-FINDINGS.json", leakage)
    for relative, content in markdown_files(inventory, leakage).items():
        path = HERE / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content.rstrip() + "\n", encoding="utf-8")

    source_anchors = []
    for relative in ANCHOR_PATHS:
        path = REPO / relative
        source_anchors.append({
            "path": relative,
            "exists": path.exists(),
            "sha256": sha256(path) if path.exists() else None,
            "size_bytes": path.stat().st_size if path.exists() else None,
        })
    source_anchors.extend([
        {"path": normalized_repo_path(BASELINE_PATH), "exists": True, "sha256": sha256(BASELINE_PATH), "size_bytes": BASELINE_PATH.stat().st_size},
        {"path": normalized_repo_path(SOURCE_LOCK_PATH), "exists": True, "sha256": sha256(SOURCE_LOCK_PATH), "size_bytes": SOURCE_LOCK_PATH.stat().st_size},
    ])

    markdown_paths = sorted(HERE.rglob("*.md"))
    json_paths = [HERE / "TARGET-INVENTORY.json", HERE / "LEAKAGE-FINDINGS.json"]
    link_failures = validate_links(markdown_paths)
    whitespace_failures = []
    eof_failures = []
    symlinks = []
    for path in sorted(HERE.rglob("*")):
        if path.is_symlink():
            symlinks.append(str(path.relative_to(HERE)))
        if not path.is_file() or path.name == "build-audit.py":
            continue
        data = path.read_bytes()
        if not data.endswith(b"\n") or data.endswith(b"\n\n"):
            eof_failures.append(str(path.relative_to(HERE)))
        text = data.decode("utf-8")
        if any(line.endswith((" ", "\t")) for line in text.splitlines()):
            whitespace_failures.append(str(path.relative_to(HERE)))
    for path in json_paths:
        load_json(path)

    checks = {
        "source_anchor_exists": all(item["exists"] for item in source_anchors),
        "candidate_count_13": inventory["counts"]["meta_type_count"] == 13,
        "language_slot_count_39": inventory["counts"]["target_language_slot_count"] == 39,
        "declared_path_count_36": inventory["counts"]["declared_target_path_count"] == 36,
        "unique_path_count_36": inventory["counts"]["unique_normalized_target_path_count"] == 36,
        "all_declared_targets_exist": inventory["counts"]["missing_target_file_count"] == 0,
        "enum_missing_declarations_exactly_3": inventory["counts"]["missing_target_path_declaration_count"] == 3,
        "current_source_locks_33_match_3_drift": inventory["counts"]["matching_target_source_lock_count"] == 33 and inventory["counts"]["drifted_target_source_lock_count"] == 3,
        "candidate_manifests_match_baseline": all(row["candidate_matches_baseline"] for row in inventory["candidate_inventory"]),
        "classification_covers_all_slots": len(leakage["findings"]) == 39,
        "declared_path_classification_31_leakage_5_clean": leakage["counts"]["financial_settlement_leakage_candidate_path_count"] == 31 and leakage["counts"]["classification_membership"].get("clean_generic") == 5,
        "semantic_ownership_uncertain_5_plus_enum_uncertain_3": leakage["counts"]["classification_membership"].get("uncertain") == 8,
        "markdown_links_resolve": not link_failures,
        "json_parses": True,
        "no_trailing_whitespace": not whitespace_failures,
        "single_lf_eof": not eof_failures,
        "no_symlinks": not symlinks,
    }
    validation = {
        "schema_version": "domainspec.architecture-pattern-inventory.validation/v1",
        "run_id": RUN_ID,
        "result": "pass" if all(checks.values()) else "block",
        "audit_integrity": "pass" if all(checks.values()) else "block",
        "candidate_source_lock_freshness": "block",
        "checks": checks,
        "details": {
            "markdown_link_failures": link_failures,
            "whitespace_failures": whitespace_failures,
            "eof_failures": eof_failures,
            "symlinks": symlinks,
            "source_anchors": source_anchors,
            "current_source_lock_drift_paths": [row["normalized_path"] for row in inventory["target_inventory"] if row["source_lock_status"] == "drift"],
        },
        "artifact_hashes": [
            {"path": str(path.relative_to(HERE)), "sha256": sha256(path), "size_bytes": path.stat().st_size}
            for path in sorted([*markdown_paths, *json_paths])
        ],
        "claim_ceiling": "Audit package integrity PASS. Current candidate source-lock freshness does not pass because three Rule locks drift and Enum declares no target sources.",
        "decision_effect": "none",
        "authority_effect": "none",
    }
    dump_json(HERE / "VALIDATION.json", validation)
    if validation["result"] != "pass":
        raise SystemExit("audit validation blocked")

    receipt_artifacts = [path for path in sorted(HERE.rglob("*")) if path.is_file() and path.name not in {"HELPER-RECEIPT.json"}]
    receipt = {
        "schema_version": "domainspec.architecture-pattern-inventory.helper-receipt/v1",
        "run_id": RUN_ID,
        "result": "pass-with-findings",
        "route": "architecture-pattern-inventory",
        "objective": "Audit the exact DomainSpec v2 13-meta-type candidate target denominator for system-domain corpus and layer leakage.",
        "counts": {
            **inventory["counts"],
            "financial_settlement_leakage_candidate_path_count": leakage["counts"]["financial_settlement_leakage_candidate_path_count"],
            "clean_generic_path_count": leakage["counts"]["classification_membership"]["clean_generic"],
            "corpus_generic_semantic_ownership_uncertain_path_count": leakage["repair_denominator_candidates"]["corpus_generic_semantic_ownership_review_paths"],
            "direct_cross_lane_target_path_count": leakage["repair_denominator_candidates"]["direct_cross_lane_target_paths"],
            "inline_domain_case_target_path_count": leakage["repair_denominator_candidates"]["inline_domain_case_target_paths"],
        },
        "key_findings": [
            "31/36 declared target paths contain contextual Financial Settlement vocabulary or stronger ownership leakage evidence; five are corpus-generic but still have unresolved inline evaluator ownership.",
            "Policy is a strong import-firewall false negative in TypeScript, Python, and Rust because settlement.route.* identities and selection behavior are inline.",
            "Rule Python and Rust directly bind candidate fixtures but are outside the current TypeScript-only import firewall.",
            "Enum declares three language target slots with no source path/hash/size; its Shipment Priority corpus cannot be byte-classified.",
            "All three Rule source locks are stale by one newline byte; the prior source-lock receipt is historic, not current proof.",
            "No Bolina vocabulary appears in the exact 36-path declared target denominator.",
        ],
        "observed_architecture": "System corpus, target behavior, family evaluation, and test evidence are partially collapsed into the target layer.",
        "recommended_architecture": "System-owned corpus -> realization composition adapter -> generic family evaluator + language-native target -> provider execution.",
        "recommended_next_route": "decision-gate revision: preserve MTC-TARGET-FIREWALL-OWNERSHIP-001 as the stable scope, supersede/reissue the option set, and recommend system-owned corpus plus adapter composition before any Invoke Plan correction.",
        "artifact_inventory": [
            {"path": str(path.relative_to(HERE)), "sha256": sha256(path), "size_bytes": path.stat().st_size}
            for path in receipt_artifacts
        ],
        "validation_path": "VALIDATION.json",
        "validation_sha256": sha256(HERE / "VALIDATION.json"),
        "changed_byte_scope": f"{normalized_repo_path(HERE)}/ only",
        "product_bytes_changed": False,
        "plan_bytes_changed": False,
        "decision_effect": "none",
        "authority_effect": "none",
        "owner_renewal_required": False,
        "claim_ceiling": "Read-only architecture inventory and recommendations. No repair denominator freeze, ownership selection, implementation acceptance, admission, promotion, merge, or release claim.",
        "join_status": "ready-for-parent-rejoin",
    }
    dump_json(HERE / "HELPER-RECEIPT.json", receipt)


if __name__ == "__main__":
    main()
