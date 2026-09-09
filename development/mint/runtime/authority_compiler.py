#!/usr/bin/env python3
"""Compile a validated authority package into the exact 18 Markdown views in memory."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import authority_package


COMPILER_VERSION = "mint.runtime.authority-markdown.v0.1"
PROOF_CEILING = "candidate-local Markdown projection only; no apply, ratification, Cedar/FOL correctness, remint, release, deployment, or production proof"


def _lines(title: str, sections: list[tuple[str, list[str]]], package_id: str, semantic_sha256: str) -> str:
    output = [f"# {title}", ""]
    for heading, values in sections:
        output.extend([f"## {heading}", ""])
        output.extend(values or ["- None declared."])
        output.append("")
    output.extend(["---", "", f"Package: `{package_id}`", f"Semantic digest: `{semantic_sha256}`", "Authority effect: `none`", ""])
    return "\n".join(output)


def _render_sections(package: dict[str, Any], semantic_sha256: str) -> dict[str, str]:
    package_id = package["package_id"]
    definitions = [f"- `{item['definition_id']}` — **{item['term']}**: {item['normative_meaning']} Boundary: {item['boundary']}" for item in package["definitions"]]
    sources = [f"- `{item['source_binding_id']}` — `{item['locator']}#{item['selector']}` (`{item['sha256']}`)" for item in package["source_bindings"]]
    rules = [f"{item['baseline_id']}. `{item['rule_id']}` — {item['normative_rule']} Enforcement: `{item['enforcement_state']}`." for item in package["rules"]]
    kinds = [f"- `{item['authority_kind_id']}` — {item['scope']}; ratification `{item['ratification_state']}`; authority effect `{item['authority_effect']}`." for item in package["authority_kinds"]]
    methods = [f"- `{item['method_id']}` — trigger: {item['trigger']}; kinds: {', '.join(f'`{ref}`' for ref in item['authority_kind_refs'])}." for item in package["methods"]]
    decisions = [f"- `{item['decision_id']}` [{item['decision_state']}] — {item['question']} Selected: {item['selected_option']}. Rationale: {item['rationale']}" for item in package["decisions"]]
    transitions = [f"- `{item['transition_id']}` — `{item['subject_ref']}`: {item['before_posture']} -> {item['after_posture']} ({item['requested_effect']})." for item in package["promotion_transitions"]]
    actions = [f"- `{item['action_id']}` [{item['action_kind']}] — downstream `{item['downstream_effect']}`; subjects: {', '.join(f'`{ref}`' for ref in item['subject_refs'])}." for item in package["governed_actions"]]
    projections = [f"- `{item['projection_id']}` — `{item['target']}` support `{item['support_state']}`, mapping `{item['mapping_version']}`." for item in package["projection_declarations"]]
    boundaries = [f"- `{item['definition_id']}`: {item['boundary']}" for item in package["definitions"]]
    roles = sorted({item["lifecycle"]["owner_route"] for family in authority_package.RECORD_FAMILY_ORDER for item in package[family] if "lifecycle" in item})
    role_lines = [f"- `{role}`" for role in roles]
    baseline_paths = ["authority/BASELINE-PRIMITIVES.md", f"authority/constitutions/{package['domain_ref'].split('.')[-1].lower()}-BASELINE-CONSTITUTION.md"]
    contents = {
        "authority-model.md": _lines("Authority Model", [("Authority kinds", kinds), ("Governed actions", actions)], package_id, semantic_sha256),
        "source-spine.md": _lines("Source Spine", [("Bound sources", sources)], package_id, semantic_sha256),
        "promotion-policy.md": _lines("Promotion Policy", [("Owner decisions", decisions), ("Requested transitions", transitions), ("Boundary", ["- Validation cannot ratify or promote."])], package_id, semantic_sha256),
        "constitution.md": _lines("Domain Constitution", [("B1-B9", rules)], package_id, semantic_sha256),
        "definitions.md": _lines("Definitions", [("Normative definitions", definitions)], package_id, semantic_sha256),
        "definitions-index.md": _lines("Definitions Index", [("IDs", [f"- `{item['definition_id']}` — {item['term']}" for item in package["definitions"]])], package_id, semantic_sha256),
        "definition-drift-audit.md": _lines("Definition Drift Audit", [("Bound definitions", [f"- `{item['definition_id']}` -> `{item['schema_ref']}`" for item in package["definitions"]])], package_id, semantic_sha256),
        "methods-catalogue.md": _lines("Methods Catalogue", [("Methods", methods)], package_id, semantic_sha256),
        "definition-localization-route.md": _lines("Definition Localization Route", [("Owner routes", [f"- `{item['definition_id']}` -> `{item['owner_route']}`" for item in package["definitions"]])], package_id, semantic_sha256),
        "authority-postures.md": _lines("Authority Postures", [("Kinds", kinds), ("Decisions", decisions)], package_id, semantic_sha256),
        "boundaries.md": _lines("Boundaries", [("Definition boundaries", boundaries), ("Proof ceiling", [f"- {package['proof_ceiling']}"])], package_id, semantic_sha256),
        "imports-README.md": _lines("Authority Imports", [("Sources", sources), ("Rule", ["- Imports are evidence bindings, never ambient authority."])], package_id, semantic_sha256),
        "constitution-import-pack.md": _lines("Constitution Import Pack", [("Constitution", [f"- `{item['constitution_id']}` version `{item['baseline_version']}`" for item in package["constitutions"]]), ("Rules", rules)], package_id, semantic_sha256),
        "nav-and-decisions.md": _lines("Authority Navigation and Decisions", [("Decisions", decisions), ("Views", projections)], package_id, semantic_sha256),
        "baseline-constitution.md": _lines("Baseline Constitution", [("Complete B1-B9", rules), ("Projection paths", [f"- `{path}`" for path in baseline_paths])], package_id, semantic_sha256),
        "baseline-primitives.md": _lines("Baseline Primitives", [("B1-B9", rules)], package_id, semantic_sha256),
        "project-space-roles.md": _lines("Project Space Roles", [("Owner routes", role_lines)], package_id, semantic_sha256),
        "crosswalk.md": _lines("Related Framework Crosswalk", [("Definitions", definitions), ("Projection declarations", projections)], package_id, semantic_sha256),
    }
    return contents


def compile_markdown(package: Any, mint_module: Any) -> dict[str, Any]:
    package_receipt = authority_package.validate_authority_package(package)
    compiler_sha256 = authority_package.sha256_file(Path(__file__).resolve())
    blockers = [] if package_receipt["status"] == "valid" else [f"PACKAGE_{error_id}" for error_id in package_receipt["error_ids"]]
    files: list[dict[str, Any]] = []
    parity: list[dict[str, Any]] = []
    if not blockers:
        domain_slug = package["domain_ref"].split(".")[-1].lower().replace("_", "-")
        content_by_template = _render_sections(package, package_receipt["semantic_sha256"])
        for ordinal, (template, relative) in enumerate(mint_module.STAGE_2_EFFECTS, 1):
            path = relative.format(domain_slug=domain_slug)
            content = content_by_template[template]
            payload = content.encode("utf-8")
            files.append({"ordinal": ordinal, "path": path, "content": content, "sha256": authority_package.sha256_bytes(payload), "size_bytes": len(payload)})
        if len({item["path"] for item in files}) != 18:
            blockers.append("MARKDOWN_PATH_INVENTORY_INVALID")
            files = []
        else:
            markdown_by_path = {item["path"]: item["content"] for item in files}
            baseline_paths = [f"authority/constitutions/{domain_slug}-BASELINE-CONSTITUTION.md", "authority/BASELINE-PRIMITIVES.md"]
            for rule in package["rules"]:
                present = all(rule["baseline_id"] in markdown_by_path[path] and rule["rule_id"] in markdown_by_path[path] for path in baseline_paths)
                if not present:
                    blockers.append(f"MARKDOWN_BASELINE_PARITY_{rule['baseline_id']}")
                parity.append({"baseline_id": rule["baseline_id"], "rule_ref": rule["rule_id"], "markdown_paths": baseline_paths, "status": "pass"})
    status = "blocked" if blockers else "ready"
    if blockers:
        files = []
        parity = []
    package_output = {
        "schema_version": "mint.authority-markdown-package.v0.1", "status": status,
        "package_id": package_receipt["package_id"], "package_sha256": package_receipt["package_sha256"], "semantic_sha256": package_receipt["semantic_sha256"],
        "files": files, "b1_b9_parity": parity, "proof_ceiling": PROOF_CEILING,
    }
    inventory = [{"path": item["path"], "sha256": item["sha256"], "size_bytes": item["size_bytes"]} for item in files]
    identity = {"compiler_version": COMPILER_VERSION, "compiler_sha256": compiler_sha256, "package_sha256": package_receipt["package_sha256"], "semantic_sha256": package_receipt["semantic_sha256"], "status": status, "inventory": inventory, "blockers": sorted(set(blockers))}
    receipt = {
        "schema_version": "mint.authority-markdown-receipt.v0.1", "receipt_id": authority_package.sha256_bytes(authority_package.canonical_bytes(identity)),
        "compiler_version": COMPILER_VERSION, "compiler_sha256": compiler_sha256, "package_id": package_receipt["package_id"],
        "package_sha256": package_receipt["package_sha256"], "semantic_sha256": package_receipt["semantic_sha256"], "status": status,
        "file_inventory": inventory, "b1_b9_status": "pass" if status == "ready" else "blocked", "blockers": sorted(set(blockers)),
        "writes_performed": 0, "authority_effect": "none", "proof_ceiling": PROOF_CEILING,
    }
    return {"package": package_output, "receipt": receipt}


def load_and_compile(path: Path, mint_module: Any) -> dict[str, Any]:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        package = {"load_error": f"{type(exc).__name__}: {exc}"}
    return compile_markdown(package, mint_module)
