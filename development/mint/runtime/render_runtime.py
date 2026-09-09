#!/usr/bin/env python3
"""Typed, deterministic, no-write Stage-2 renderer for Mint."""

from __future__ import annotations

import base64
import hashlib
import json
import re
from pathlib import Path
from typing import Any, Callable


RUNTIME_DIR = Path(__file__).resolve().parent
IR_PATH = RUNTIME_DIR / "ir" / "stage2.v0.1.json"
RENDER_VERSION = "mint.runtime.render.v0.1"
DIGEST_RE = re.compile(r"^[a-f0-9]{64}$")
ID_RE = re.compile(r"^[A-Z][A-Z0-9_-]*$")
SEMANTIC_TOKEN_RE = re.compile(r"\{\{[A-Za-z0-9_.-]+\}\}")
FORBIDDEN_RESOLUTION_PHRASES = (
    "cav2 resolves",
    "cyberalchemy v2 resolves",
    "route to cav2",
    "cav2 is the method authority",
    "framework is the method authority",
)


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _exact(value: Any, required: set[str], label: str, errors: list[str]) -> bool:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return False
    missing = sorted(required - set(value))
    unknown = sorted(set(value) - required)
    if missing:
        errors.append(f"{label} missing fields: {', '.join(missing)}")
    if unknown:
        errors.append(f"{label} unknown fields: {', '.join(unknown)}")
    return not missing and not unknown


def _line(value: Any, label: str, errors: list[str]) -> bool:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")
        return False
    if any(character in value for character in ("\x00", "\r", "\n")):
        errors.append(f"{label} must be a single safe text line")
        return False
    if len(value) > 4096:
        errors.append(f"{label} exceeds 4096 characters")
        return False
    lowered = value.casefold()
    if any(phrase in lowered for phrase in FORBIDDEN_RESOLUTION_PHRASES):
        errors.append(f"{label} contains a forbidden framework-resolution phrase")
        return False
    return True


def _cell(value: str) -> str:
    return value.replace("|", "\\|").strip()


def _bullets(values: list[str]) -> str:
    return "\n".join(f"- {value}" for value in values)


def _table(headers: list[str], rows: list[list[str]]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    lines.extend("| " + " | ".join(_cell(value) for value in row) + " |" for row in rows)
    return "\n".join(lines)


def _doc(title: str, body: str) -> bytes:
    return f"# {title}\n\n{body.rstrip()}\n".encode("utf-8")


def _validate_render_input(value: Any, manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if not _exact(value, {"schema_version", "plan_id", "manifest_sha256", "values"}, "render_input", errors):
        return errors
    if value["schema_version"] != "mint.render-input.v0.1":
        errors.append("render_input.schema_version must be mint.render-input.v0.1")
    for field in ("plan_id", "manifest_sha256"):
        if not isinstance(value[field], str) or not DIGEST_RE.fullmatch(value[field]):
            errors.append(f"render_input.{field} must be a lowercase SHA-256")
    values = value["values"]
    fields = {
        "evidence_families", "separable_concerns", "definitions", "constitution_rules",
        "promotion_gates", "related_corpora", "policy_surfaces", "domain_commitment",
        "withholding_boundary", "required_precedent_corpus", "methods", "project_roles",
    }
    if not _exact(values, fields, "render_input.values", errors):
        return errors
    for field in ("domain_commitment", "withholding_boundary", "required_precedent_corpus"):
        _line(values[field], f"render_input.values.{field}", errors)
    policy = values["policy_surfaces"]
    if _exact(policy, {"internal", "external"}, "render_input.values.policy_surfaces", errors):
        _line(policy["internal"], "render_input.values.policy_surfaces.internal", errors)
        _line(policy["external"], "render_input.values.policy_surfaces.external", errors)

    list_contracts = {
        "evidence_families": ({"name", "allowed_use", "blocked_use"}, 1),
        "separable_concerns": ({"left", "right"}, 1),
        "definitions": ({"id", "term", "operational", "formal", "evidence", "source_kind"}, 2),
        "constitution_rules": ({"id", "rule", "validation_mode"}, 1),
        "promotion_gates": ({"name", "condition"}, 1),
        "related_corpora": ({"name", "relation", "allowed_use", "blocked_use"}, 1),
        "methods": ({"kind_id", "method", "validation"}, 1),
        "project_roles": ({"role", "scope", "owner_route"}, 1),
    }
    for field, (item_fields, minimum) in list_contracts.items():
        items = values[field]
        if not isinstance(items, list) or len(items) < minimum:
            errors.append(f"render_input.values.{field} must contain at least {minimum} item(s)")
            continue
        for index, item in enumerate(items):
            label = f"render_input.values.{field}[{index}]"
            if _exact(item, item_fields, label, errors):
                for name in sorted(item_fields):
                    _line(item[name], f"{label}.{name}", errors)

    for field, key in (("definitions", "id"), ("constitution_rules", "id"), ("methods", "kind_id")):
        items = values[field] if isinstance(values[field], list) else []
        identifiers = [item.get(key) for item in items if isinstance(item, dict)]
        if len(identifiers) != len(set(identifiers)):
            errors.append(f"render_input.values.{field} contains duplicate {key} values")
    definitions = values["definitions"] if isinstance(values["definitions"], list) else []
    for index, definition in enumerate(definitions):
        if isinstance(definition, dict) and (not isinstance(definition.get("id"), str) or not ID_RE.fullmatch(definition["id"])):
            errors.append(f"render_input.values.definitions[{index}].id must be an uppercase stable identifier")
    rules = values["constitution_rules"] if isinstance(values["constitution_rules"], list) else []
    for index, rule in enumerate(rules):
        if isinstance(rule, dict) and (not isinstance(rule.get("id"), str) or not ID_RE.fullmatch(rule["id"])):
            errors.append(f"render_input.values.constitution_rules[{index}].id must be an uppercase stable identifier")
    kinds = manifest.get("authority", {}).get("domain_kinds", [])
    kind_ids = {kind.get("id") for kind in kinds if isinstance(kind, dict)}
    method_ids = {item.get("kind_id") for item in values["methods"] if isinstance(item, dict)} if isinstance(values["methods"], list) else set()
    if kind_ids != method_ids:
        errors.append("render_input.values.methods must cover exactly the admitted domain kind IDs")
    return sorted(set(errors))


def authority_model(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    domain = manifest["domain"]
    primary = manifest["authority"]["primary_source"]
    rows = [
        ["Primary source", primary["name"], "official domain source", "cannot replace owner-ratified local rules"],
        ["Related evidence", "supporting-source", "corroboration", "cannot decide domain policy"],
        ["Local synthesis", "candidate", domain["proposal_unit"], "not authority before recorded promotion"],
        ["Workflow witness", "evidence", "records process state", "cannot ratify its own output"],
        ["External policy authority", values["policy_surfaces"]["external"], "bounded external policy", "cannot govern the internal surface"],
    ]
    for kind in manifest["authority"]["domain_kinds"]:
        rows.append([f"**{kind['name']}** (PROPOSED)", kind["counts_as"], kind["owner_route"], kind["blocked_use"]])
    noncollapse = [f"{pair['left']} is not {pair['right']}." for pair in values["separable_concerns"]]
    body = (
        f"Status: candidate; domain-local kinds remain proposed.\n\n"
        f"Governed subject: {domain['governed_subject']}\n\n"
        + _table(["Kind", "Counts as", "Owner route / use", "Blocked use"], rows)
        + "\n\n## Closed-world rule\n\nAnything not enumerated above is denied by default. Mint proposes domain-local kinds; the domain authority owner ratifies them. This table does not alter the framework's authority enumeration.\n\n"
        + "## Non-collapse rules\n\n" + _bullets(noncollapse)
    )
    return _doc(f"{domain['name']} Authority Model", body)


def source_spine(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    domain = manifest["domain"]
    primary = manifest["authority"]["primary_source"]
    rows = [[primary["name"], "primary-source", primary["uri"], "cannot be silently overridden"]]
    rows.extend([[item["name"], "supporting-source", item["allowed_use"], item["blocked_use"]] for item in values["evidence_families"]])
    rows.extend([[item["name"], "related-corpus", item["allowed_use"], item["blocked_use"]] for item in values["related_corpora"]])
    rows.append(["CyberAlchemy v2", "harvested precedent", "citation and provenance only", "forbidden on any resolution path"])
    return _doc(f"{domain['name']} Source Spine", _table(["Source family", "Posture", "Allowed use", "Blocked use"], rows) + "\n\nNo cyclic citation chain promotes authority.")


def promotion_policy(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    domain = manifest["domain"]
    gates = [[item["name"], item["condition"]] for item in values["promotion_gates"]]
    body = (
        "## Ladder\n\n`imported` → `local-evidence` → `candidate` → `owner-ratified`\n\n"
        "## Gates\n\n" + _table(["Gate", "Pass condition"], gates)
        + "\n\nAuthority resolves to this repository's authority surface. Traversing into a framework attachment to resolve a decision is a block."
    )
    return _doc(f"{domain['name']} Promotion Policy", body)


def constitution(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    domain = manifest["domain"]
    rows = [[item["id"], item["rule"], item["validation_mode"]] for item in values["constitution_rules"]]
    rows.extend([
        ["META_CLAIM_PROOF", "Claims may not exceed current evidence.", "compare claim and receipt scope"],
        ["META_NO_LAUNDERING", "Framework citation transfers no framework authority.", "inspect resolution routes"],
        ["META_TERM_DRIFT", "Load-bearing terms must appear in the definitions drift audit.", "resolve definitions audit entry"],
    ])
    noncollapse = _bullets([f"{item['left']} is not {item['right']}." for item in values["separable_concerns"]])
    return _doc(f"{domain['name']} Constitution", _table(["Rule", "Requirement", "Validation mode"], rows) + "\n\n## Non-collapse\n\n" + noncollapse)


def definitions(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    chunks = []
    for item in values["definitions"]:
        chunks.append(f"## {item['id']} — {item['term']}\n\nOperational: {item['operational']}\n\nFormal: {item['formal']}\n\nEvidence: {item['evidence']}\n\nSource kind: `{item['source_kind']}`")
    return _doc(f"{manifest['domain']['name']} Definitions", "\n\n".join(chunks))


def definitions_index(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    rows = [[item["id"], item["term"], "DEFINITIONS.md"] for item in values["definitions"]]
    return _doc("Definitions Index", _table(["ID", "Term", "Canonical home"], rows))


def definition_drift_audit(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    rows = [[item["id"], item["term"], "baseline", "pending first audit"] for item in values["definitions"]]
    return _doc("Definition Drift Audit", _table(["ID", "Term", "Baseline", "Audit state"], rows) + "\n\nThis seeded audit is an operational work surface, not proof that no drift exists.")


def methods_catalogue(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    kind_names = {kind["id"]: kind["name"] for kind in manifest["authority"]["domain_kinds"]}
    rows = [[item["kind_id"], kind_names[item["kind_id"]], item["method"], item["validation"]] for item in values["methods"]]
    return _doc("Governance Methods Catalogue", _table(["Kind ID", "Kind", "Method", "Validation"], rows))


def definition_localization_route(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    body = (
        f"Required precedent corpus: {values['required_precedent_corpus']}\n\n"
        "1. Import precedent as evidence.\n2. Draft a domain-local definition card.\n3. Review operational and formal voices.\n4. Record owner decision.\n5. Update the index and drift audit.\n\nA framework definition is never silently reused as local authority."
    )
    return _doc(f"{manifest['domain']['name']} Definition Localization Route", body)


def authority_postures(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    primary = manifest["authority"]["primary_source"]
    rows = [[primary["name"], "primary", "high", "official-source decisions only"]]
    rows.extend([[item["name"], "supporting", "unrated", item["blocked_use"]] for item in values["evidence_families"]])
    rows.extend([[item["name"], "related", "unrated", item["blocked_use"]] for item in values["related_corpora"]])
    return _doc("Authority Postures", _table(["Source", "Posture", "Confidence", "Boundary"], rows) + "\n\nPosture is not confidence.")


def boundaries(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    policy = values["policy_surfaces"]
    body = f"Internal policy surface: {policy['internal']}\n\nExternal policy surface: {policy['external']}\n\nWithholding boundary: {values['withholding_boundary']}\n\nPrivate material remains private unless a separately owned publication gate passes."
    return _doc("Authority Boundaries", body)


def imports_readme(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    body = f"Imported material is staged here before any promotion decision.\n\nRequired precedent corpus: {values['required_precedent_corpus']}\n\nImport does not imply adoption, authority, or correctness."
    return _doc(f"{manifest['domain']['name']} Authority Imports", body)


def constitution_import_pack(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    body = f"Source corpus: {values['required_precedent_corpus']}\n\nChecklist:\n- identify candidate rule\n- record provenance\n- test domain applicability\n- route to the domain constitution owner\n- record accept, reject, or defer\n\nNo imported rule is active before the recorded owner decision."
    return _doc("Constitution Import Pack", body)


def authority_readme(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    domain = manifest["domain"]
    body = "Navigation surface; not itself authority.\n\n- [Authority model](AUTHORITY-MODEL.md)\n- [Source spine](source-spine.md)\n- [Promotion policy](promotion-policy.md)\n- [Postures](AUTHORITY-POSTURES.md)\n- [Boundaries](boundaries.md)\n- [Methods](METHODS-CATALOGUE.md)\n- [Constitutions](constitutions/)\n- [Decisions](decisions/)\n- [Definitions](../definitions/)"
    return _doc(f"{domain['name']} Authority", body)


def decisions_readme(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    body = f"Signed or attributed decisions belong here after their owner gate.\n\nSeed date: {manifest['run_date']}\n\nRequired fields: decision ID, question, options, selection, rationale, source, timestamp, and remaining blockers. P0/Render-02 creates no decision record."
    return _doc(f"{manifest['domain']['name']} Decisions", body)


def baseline_constitution(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    body = f"Commitment: {values['domain_commitment']}\n\n- preserve source provenance\n- separate evidence from authority\n- keep proposed kinds default denied until ratified\n- keep claims at or below proof"
    return _doc(f"{manifest['domain']['name']} Baseline Constitution", body)


def baseline_primitives(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    rows = [["Domain commitment", values["domain_commitment"]], ["Proposal unit", manifest["domain"]["proposal_unit"]]]
    rows.extend([["Non-collapse", f"{item['left']} is not {item['right']}"] for item in values["separable_concerns"]])
    return _doc("Baseline Primitives", _table(["Primitive", "Meaning"], rows))


def project_space_roles(manifest: dict[str, Any], values: dict[str, Any]) -> bytes:
    rows = [[item["role"], item["scope"], item["owner_route"]] for item in values["project_roles"]]
    return _doc(f"{manifest['domain']['name']} Project-Space Roles", _table(["Role", "Scope", "Owner route"], rows))


COMPILERS: dict[str, Callable[[dict[str, Any], dict[str, Any]], bytes]] = {
    "authority_model": authority_model,
    "source_spine": source_spine,
    "promotion_policy": promotion_policy,
    "constitution": constitution,
    "definitions": definitions,
    "definitions_index": definitions_index,
    "definition_drift_audit": definition_drift_audit,
    "methods_catalogue": methods_catalogue,
    "definition_localization_route": definition_localization_route,
    "authority_postures": authority_postures,
    "boundaries": boundaries,
    "imports_readme": imports_readme,
    "constitution_import_pack": constitution_import_pack,
    "authority_readme": authority_readme,
    "decisions_readme": decisions_readme,
    "baseline_constitution": baseline_constitution,
    "baseline_primitives": baseline_primitives,
    "project_space_roles": project_space_roles,
}


def _load_ir() -> tuple[dict[str, Any] | None, str | None, list[str]]:
    errors: list[str] = []
    try:
        payload = IR_PATH.read_bytes()
        ir = json.loads(payload)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return None, None, [f"render IR load failed: {type(exc).__name__}: {exc}"]
    if not _exact(ir, {"schema_version", "description", "outputs"}, "render_ir", errors):
        return None, digest_bytes(payload), errors
    if ir["schema_version"] != "mint.stage2-ir.v0.1":
        errors.append("render_ir.schema_version must be mint.stage2-ir.v0.1")
    if not isinstance(ir["outputs"], list) or len(ir["outputs"]) != 18:
        errors.append("render IR must contain exactly 18 outputs")
    return ir, digest_bytes(payload), errors


def _make_receipt(package: dict[str, Any], checks: list[dict[str, str]]) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "blockers": package["blockers"],
        "files_rendered": len(package["files"]),
        "proof_ceiling": "deterministic no-write Stage-2 rendering only; no apply, L0/L1, ratification, promotion, or Zagr proof",
        "receipt_id": "",
        "render_id": package["render_id"],
        "schema_version": "mint.render-receipt.v0.1",
        "status": package["status"],
        "stdout_sha256": digest_bytes(canonical_bytes(package)),
        "validation_checks": checks,
        "writes_attempted": 0,
        "writes_performed": 0,
    }
    material = dict(receipt)
    material.pop("receipt_id")
    receipt["receipt_id"] = digest_bytes(canonical_bytes(material))
    return receipt


def render_output(manifest: Any, supplied_p0: Any, render_input: Any, planner: Any) -> dict[str, Any]:
    errors: list[str] = []
    checks: list[dict[str, str]] = []
    expected_p0 = planner.plan_manifest(manifest)
    if not isinstance(supplied_p0, dict) or set(supplied_p0) != {"schema_version", "plan", "receipt"}:
        errors.append("P0 output must be the exact plan/receipt envelope")
    elif supplied_p0 != expected_p0:
        errors.append("P0 output does not match a fresh plan recomputation")
    elif supplied_p0["plan"]["status"] != "ready" or supplied_p0["receipt"]["status"] != "ready":
        errors.append("P0 plan and receipt must be ready")
    checks.append({"check": "p0-recompute-binding", "status": "block" if errors else "pass"})

    shape_errors = _validate_render_input(render_input, manifest if isinstance(manifest, dict) else {})
    errors.extend(shape_errors)
    checks.append({"check": "strict-render-input", "status": "block" if shape_errors else "pass"})

    ir, ir_digest, ir_errors = _load_ir()
    errors.extend(ir_errors)
    checks.append({"check": "typed-render-ir", "status": "block" if ir_errors else "pass"})

    if not shape_errors and isinstance(supplied_p0, dict) and "plan" in supplied_p0:
        if render_input["plan_id"] != supplied_p0["plan"].get("plan_id"):
            errors.append("render input plan_id mismatch")
        if render_input["manifest_sha256"] != supplied_p0["plan"].get("manifest_sha256"):
            errors.append("render input manifest_sha256 mismatch")

    files: list[dict[str, Any]] = []
    if not errors and ir is not None:
        stage2 = [effect for effect in supplied_p0["plan"]["effects"] if effect["stage"] == "stage-2" and effect["disposition"] == "planned"]
        if len(stage2) != 18:
            errors.append("P0 plan must contain exactly 18 planned Stage-2 effects")
        effect_by_ordinal = {effect["ordinal"]: effect for effect in stage2}
        seen_paths: list[str] = []
        for entry in ir["outputs"]:
            if not isinstance(entry, dict) or set(entry) != {"effect_ordinal", "path_template", "source_template", "compiler", "semantic_inputs"}:
                errors.append("render IR output entry shape invalid")
                continue
            effect = effect_by_ordinal.get(entry["effect_ordinal"])
            expected_path = entry["path_template"].format(domain_slug=manifest["domain"]["slug"])
            if effect is None or effect["target_relative_path"] != expected_path or effect["source_template"] != entry["source_template"]:
                errors.append(f"render IR/P0 effect mismatch at ordinal {entry['effect_ordinal']}")
                continue
            compiler = COMPILERS.get(entry["compiler"])
            if compiler is None:
                errors.append(f"unknown render compiler: {entry['compiler']}")
                continue
            content = compiler(manifest, render_input["values"])
            decoded = content.decode("utf-8")
            if SEMANTIC_TOKEN_RE.search(decoded):
                errors.append(f"unresolved semantic token in {expected_path}")
                continue
            seen_paths.append(expected_path)
            files.append(
                {
                    "content_b64": base64.b64encode(content).decode("ascii"),
                    "effect_ordinal": effect["ordinal"],
                    "encoding": "base64",
                    "manifest_sha256": supplied_p0["plan"]["manifest_sha256"],
                    "path": expected_path,
                    "plan_id": supplied_p0["plan"]["plan_id"],
                    "render_version": RENDER_VERSION,
                    "sha256": digest_bytes(content),
                    "size_bytes": len(content),
                    "source_sha256": effect["source_sha256"],
                    "source_template": effect["source_template"],
                    "template_set_sha256": supplied_p0["plan"]["template_set_sha256"],
                }
            )
        path_errors = planner._validate_relative_paths(seen_paths)
        errors.extend(path_errors)
        if len(files) != 18 or len(seen_paths) != len(set(seen_paths)):
            errors.append("renderer did not produce exactly 18 unique files")
    checks.append({"check": "exact-stage2-inventory", "status": "block" if errors else "pass"})
    blockers = sorted(set(errors))
    if blockers:
        files = []
    renderer_digest = digest_bytes(Path(__file__).read_bytes())
    identity = {
        "blockers": blockers,
        "files": [
            {
                "effect_ordinal": item["effect_ordinal"],
                "path": item["path"],
                "sha256": item["sha256"],
                "size_bytes": item["size_bytes"],
                "source_sha256": item["source_sha256"],
            }
            for item in files
        ],
        "ir_sha256": ir_digest,
        "manifest_sha256": expected_p0.get("plan", {}).get("manifest_sha256"),
        "plan_id": expected_p0.get("plan", {}).get("plan_id"),
        "render_input": render_input,
        "renderer_sha256": renderer_digest,
        "template_set_sha256": expected_p0.get("plan", {}).get("template_set_sha256"),
        "version": RENDER_VERSION,
    }
    package: dict[str, Any] = {
        "blockers": blockers,
        "files": files,
        "ir_sha256": ir_digest,
        "manifest_sha256": expected_p0.get("plan", {}).get("manifest_sha256"),
        "plan_id": expected_p0.get("plan", {}).get("plan_id"),
        "render_id": digest_bytes(canonical_bytes(identity)),
        "render_input_sha256": digest_bytes(canonical_bytes(render_input)),
        "renderer_sha256": renderer_digest,
        "schema_version": "mint.render-package.v0.1",
        "status": "blocked" if blockers else "ready",
        "template_set_sha256": expected_p0.get("plan", {}).get("template_set_sha256"),
    }
    receipt = _make_receipt(package, checks)
    return {"package": package, "receipt": receipt, "schema_version": "mint.render-output.v0.1"}
