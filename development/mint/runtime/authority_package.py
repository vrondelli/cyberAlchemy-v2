#!/usr/bin/env python3
"""Deterministic, no-write validator for private Mint authority packages."""

from __future__ import annotations

import copy
import hashlib
import json
from pathlib import Path
from typing import Any, Iterable

from jsonschema import Draft202012Validator


VALIDATOR_VERSION = "mint.runtime.authority-package-check.v0.1"
RUNTIME_DIR = Path(__file__).resolve().parent
CONTRACT_PATH = RUNTIME_DIR / "contracts" / "authority-package.v0.1.schema.json"

FAMILY_IDS: tuple[tuple[str, str], ...] = (
    ("definitions", "definition_id"),
    ("constitutions", "constitution_id"),
    ("rules", "rule_id"),
    ("authority_kinds", "authority_kind_id"),
    ("methods", "method_id"),
    ("decisions", "decision_id"),
    ("promotion_transitions", "transition_id"),
    ("governed_actions", "action_id"),
    ("residues", "residue_id"),
    ("projection_declarations", "projection_id"),
)
RECORD_FAMILY_ORDER = tuple(name for name, _ in FAMILY_IDS)
FACET_NAMES = (
    "classification",
    "schema",
    "human_continuation",
    "machine_checkable",
)
BASELINE_IDS = tuple(f"B{index}" for index in range(1, 10))
SET_ARRAY_KEYS = {
    "alternatives", "authority_kind_refs", "definition_refs", "evidence_refs",
    "excluded_record_refs", "included_record_refs", "input_refs", "method_refs",
    "output_refs", "owning_action_refs", "owning_record_refs", "provenance_refs",
    "residue_refs", "source_binding_refs", "subject_refs", "semantic_unit_refs",
    "supersedes_refs", "validator_refs",
}
PROOF_CEILING = (
    "candidate-local semantic validation only; no ratification, render, apply, "
    "remint, projection correctness, release, deployment, or production proof"
)

CHECKS = (
    "json-schema",
    "identity-and-reference-closure",
    "governed-action-linkage",
    "four-facet-accounting",
    "d18-residue",
    "d23-status-axes",
    "source-and-private-boundary",
    "b1-b9-baseline",
    "kind-method-and-promotion-linkage",
    "projection-declarations",
    "deterministic-receipt-and-no-write-ceiling",
)
ERROR_CHECK = {
    "AP_SCHEMA_INVALID": "json-schema",
    "AP_ID_DUPLICATE": "identity-and-reference-closure",
    "AP_INVENTORY_MISMATCH": "identity-and-reference-closure",
    "AP_REFERENCE_UNRESOLVED": "identity-and-reference-closure",
    "AP_ACTION_SUBJECT_UNLINKED": "governed-action-linkage",
    "AP_FACET_STATE_REF_INVALID": "four-facet-accounting",
    "AP_RESIDUE_INVALID": "d18-residue",
    "AP_STATUS_AXIS_COLLAPSE": "d23-status-axes",
    "AP_FAMILY_STATUS_INVALID": "d23-status-axes",
    "AP_SOURCE_BINDING_INVALID": "source-and-private-boundary",
    "AP_SOURCE_SET_DIGEST_MISMATCH": "source-and-private-boundary",
    "AP_PRIVATE_BOUNDARY_VIOLATION": "source-and-private-boundary",
    "AP_RECORD_SET_DIGEST_MISMATCH": "identity-and-reference-closure",
    "AP_BASELINE_INVENTORY_INVALID": "b1-b9-baseline",
    "AP_KIND_METHOD_MISMATCH": "kind-method-and-promotion-linkage",
    "AP_PROMOTION_GATE_INVALID": "kind-method-and-promotion-linkage",
    "AP_PROJECTION_INVALID": "projection-declarations",
    "AP_CIRCULAR_AUTHORITY": "identity-and-reference-closure",
}


def canonical_bytes(value: Any) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        + "\n"
    ).encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _stable_sort_key(value: Any) -> bytes:
    return canonical_bytes(value)


def _normalize(value: Any, key: str | None = None) -> Any:
    if isinstance(value, dict):
        return {name: _normalize(value[name], name) for name in sorted(value)}
    if isinstance(value, list):
        normalized = [_normalize(item) for item in value]
        if key in SET_ARRAY_KEYS:
            return sorted(normalized, key=_stable_sort_key)
        return normalized
    return value


def normalized_package(package: Any) -> Any:
    if not isinstance(package, dict):
        return _normalize(package)
    result = _normalize(copy.deepcopy(package))
    for family, id_field in FAMILY_IDS:
        values = result.get(family)
        if isinstance(values, list):
            values.sort(
                key=lambda record: (
                    record.get(id_field, "") if isinstance(record, dict) else "",
                    _stable_sort_key(record),
                )
            )
    sources = result.get("source_bindings")
    if isinstance(sources, list):
        sources.sort(
            key=lambda record: (
                record.get("source_binding_id", "") if isinstance(record, dict) else "",
                _stable_sort_key(record),
            )
        )
    return result


def source_set_digest(package: dict[str, Any]) -> str:
    sources = normalized_package(package).get("source_bindings", [])
    return sha256_bytes(canonical_bytes(sources))


def record_set_digest(package: dict[str, Any]) -> str:
    normalized = normalized_package(package)
    payload = [{"family": family, "records": normalized.get(family, [])} for family in RECORD_FAMILY_ORDER]
    return sha256_bytes(canonical_bytes(payload))


def semantic_digest(package: Any) -> str:
    normalized = normalized_package(package)
    if isinstance(normalized, dict):
        normalized = copy.deepcopy(normalized)
        normalized.pop("source_set_sha256", None)
        normalized.pop("canonical_record_set_sha256", None)
    return sha256_bytes(canonical_bytes(normalized))


def _add_error(errors: list[dict[str, str]], error_id: str, path: str, detail: str) -> None:
    errors.append({"error_id": error_id, "path": path, "detail": detail})


def _schema_errors(package: Any) -> list[dict[str, str]]:
    schema = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    errors: list[dict[str, str]] = []
    for failure in sorted(
        Draft202012Validator(schema).iter_errors(package),
        key=lambda item: (list(item.absolute_path), item.message),
    ):
        path = "/" + "/".join(str(part) for part in failure.absolute_path)
        error_id = "AP_SCHEMA_INVALID"
        if failure.validator == "additionalProperties" and "'status' was unexpected" in failure.message:
            error_id = "AP_STATUS_AXIS_COLLAPSE"
        _add_error(errors, error_id, path, failure.message)
    return errors


def _ids(package: dict[str, Any]) -> tuple[dict[str, set[str]], dict[str, str], list[dict[str, str]]]:
    families: dict[str, set[str]] = {}
    owners: dict[str, str] = {}
    errors: list[dict[str, str]] = []
    for family, id_field in FAMILY_IDS:
        family_ids: set[str] = set()
        for index, record in enumerate(package[family]):
            identifier = record[id_field]
            if identifier in owners:
                _add_error(errors, "AP_ID_DUPLICATE", f"/{family}/{index}/{id_field}", f"{identifier} already belongs to {owners[identifier]}")
            owners.setdefault(identifier, family)
            family_ids.add(identifier)
        families[family] = family_ids
    source_ids: set[str] = set()
    for index, source in enumerate(package["source_bindings"]):
        identifier = source["source_binding_id"]
        if identifier in owners:
            _add_error(errors, "AP_ID_DUPLICATE", f"/source_bindings/{index}/source_binding_id", f"{identifier} already belongs to {owners[identifier]}")
        owners.setdefault(identifier, "source_bindings")
        source_ids.add(identifier)
    families["source_bindings"] = source_ids
    return families, owners, errors


def _require_refs(
    errors: list[dict[str, str]], refs: Iterable[str], allowed: set[str], path: str
) -> None:
    for index, ref in enumerate(refs):
        if ref not in allowed:
            _add_error(errors, "AP_REFERENCE_UNRESOLVED", f"{path}/{index}", f"unresolved internal reference: {ref}")


def _lifecycle_refs(
    errors: list[dict[str, str]], record: dict[str, Any], path: str,
    sources: set[str], residues: set[str],
) -> None:
    lifecycle = record["lifecycle"]
    _require_refs(errors, lifecycle["provenance_refs"], sources, f"{path}/lifecycle/provenance_refs")
    _require_refs(errors, lifecycle["residue_refs"], residues, f"{path}/lifecycle/residue_refs")


def _semantic_errors(package: dict[str, Any]) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    families, owners, id_errors = _ids(package)
    errors.extend(id_errors)
    all_ids = set(owners)
    record_ids = all_ids - families["source_bindings"]
    action_ids = families["governed_actions"]
    residue_ids = families["residues"]
    source_ids = families["source_bindings"]
    decision_ids = families["decisions"]

    if set(package["source_binding_refs"]) != source_ids:
        _add_error(errors, "AP_INVENTORY_MISMATCH", "/source_binding_refs", "source_binding_refs must equal the source binding IDs")
    for family, _ in FAMILY_IDS:
        expected = families[family]
        actual = set(package["record_inventory"][family])
        if actual != expected:
            _add_error(errors, "AP_INVENTORY_MISMATCH", f"/record_inventory/{family}", f"inventory differs: expected {sorted(expected)}, observed {sorted(actual)}")

    for index, source in enumerate(package["source_bindings"]):
        path = f"/source_bindings/{index}"
        _require_refs(errors, source["owning_record_refs"], record_ids, f"{path}/owning_record_refs")
        _require_refs(errors, source["owning_action_refs"], action_ids, f"{path}/owning_action_refs")
        if source["source_kind"].startswith("private-") and source["locator"].lower().startswith(("http://", "https://")):
            _add_error(errors, "AP_PRIVATE_BOUNDARY_VIOLATION", f"{path}/locator", "private source locator must not be a public HTTP URL")

    for family, id_field in FAMILY_IDS:
        for index, record in enumerate(package[family]):
            path = f"/{family}/{index}"
            own_id = record[id_field]
            if "lifecycle" in record:
                _lifecycle_refs(errors, record, path, source_ids, residue_ids)
            for key, value in record.items():
                refs: list[str] = []
                if key.endswith("_ref") and isinstance(value, str):
                    refs = [value]
                elif key.endswith("_refs") and isinstance(value, list):
                    refs = [item for item in value if isinstance(item, str)]
                if own_id in refs:
                    _add_error(errors, "AP_CIRCULAR_AUTHORITY", f"{path}/{key}", f"{own_id} self-references through {key}")

    for index, definition in enumerate(package["definitions"]):
        path = f"/definitions/{index}"
        _require_refs(errors, definition["source_binding_refs"], source_ids, f"{path}/source_binding_refs")
        _require_refs(errors, [definition["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        if definition["lifecycle"]["lifecycle_status"] != definition["definition_lifecycle"]:
            _add_error(errors, "AP_FAMILY_STATUS_INVALID", f"{path}/lifecycle/lifecycle_status", "definition lifecycle axes disagree")

    rule_by_id = {item["rule_id"]: item for item in package["rules"]}
    for index, constitution in enumerate(package["constitutions"]):
        path = f"/constitutions/{index}"
        _require_refs(errors, constitution["rule_refs"], families["rules"], f"{path}/rule_refs")
        _require_refs(errors, constitution["source_binding_refs"], source_ids, f"{path}/source_binding_refs")
        _require_refs(errors, [constitution["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        inventory = constitution["baseline_inventory"]
        observed_baselines = tuple(item["baseline_id"] for item in inventory)
        observed_positions = tuple(item["position"] for item in inventory)
        observed_rules = tuple(item["rule_ref"] for item in inventory)
        if observed_baselines != BASELINE_IDS or observed_positions != tuple(range(1, 10)) or list(observed_rules) != constitution["rule_refs"]:
            _add_error(errors, "AP_BASELINE_INVENTORY_INVALID", f"{path}/baseline_inventory", "B1-B9 must be complete, ordered, positioned 1-9, and equal rule_refs")
        for item in inventory:
            rule = rule_by_id.get(item["rule_ref"])
            if rule is not None and (rule["baseline_id"] != item["baseline_id"] or rule["constitution_ref"] != constitution["constitution_id"]):
                _add_error(errors, "AP_BASELINE_INVENTORY_INVALID", f"{path}/baseline_inventory", f"{item['rule_ref']} does not match its baseline or constitution")

    for index, rule in enumerate(package["rules"]):
        path = f"/rules/{index}"
        _require_refs(errors, [rule["constitution_ref"]], families["constitutions"], f"{path}/constitution_ref")
        _require_refs(errors, rule["definition_refs"], families["definitions"], f"{path}/definition_refs")
        _require_refs(errors, [rule["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        if rule["lifecycle"]["lifecycle_status"] != rule["rule_lifecycle"]:
            _add_error(errors, "AP_FAMILY_STATUS_INVALID", f"{path}/lifecycle/lifecycle_status", "rule lifecycle axes disagree")

    methods = {item["method_id"]: item for item in package["methods"]}
    kinds = {item["authority_kind_id"]: item for item in package["authority_kinds"]}
    decisions = {item["decision_id"]: item for item in package["decisions"]}
    for index, kind in enumerate(package["authority_kinds"]):
        path = f"/authority_kinds/{index}"
        _require_refs(errors, kind["method_refs"], families["methods"], f"{path}/method_refs")
        _require_refs(errors, [kind["owner_gate_ref"]], decision_ids, f"{path}/owner_gate_ref")
        _require_refs(errors, [kind["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        if kind["lifecycle"]["lifecycle_status"] != kind["authority_kind_lifecycle"]:
            _add_error(errors, "AP_FAMILY_STATUS_INVALID", f"{path}/lifecycle/lifecycle_status", "authority-kind lifecycle axes disagree")
        reverse = {method_id for method_id, method in methods.items() if kind["authority_kind_id"] in method["authority_kind_refs"]}
        if set(kind["method_refs"]) != reverse:
            _add_error(errors, "AP_KIND_METHOD_MISMATCH", f"{path}/method_refs", f"kind/method relation differs: expected {sorted(reverse)}")
        gate = decisions.get(kind["owner_gate_ref"])
        if kind["ratification_state"] == "ratified" and (gate is None or gate["decision_state"] != "accepted"):
            _add_error(errors, "AP_PROMOTION_GATE_INVALID", f"{path}/owner_gate_ref", "ratified kind requires an accepted owner decision")

    for index, method in enumerate(package["methods"]):
        path = f"/methods/{index}"
        _require_refs(errors, method["authority_kind_refs"], families["authority_kinds"], f"{path}/authority_kind_refs")
        _require_refs(errors, method["source_binding_refs"], source_ids, f"{path}/source_binding_refs")
        _require_refs(errors, [method["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        reverse = {kind_id for kind_id, kind in kinds.items() if method["method_id"] in kind["method_refs"]}
        if set(method["authority_kind_refs"]) != reverse:
            _add_error(errors, "AP_KIND_METHOD_MISMATCH", f"{path}/authority_kind_refs", f"method/kind relation differs: expected {sorted(reverse)}")

    for index, decision in enumerate(package["decisions"]):
        path = f"/decisions/{index}"
        _require_refs(errors, [decision["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        _require_refs(errors, decision["supersedes_refs"], decision_ids, f"{path}/supersedes_refs")
        if decision["lifecycle"]["lifecycle_status"] != decision["decision_state"]:
            _add_error(errors, "AP_FAMILY_STATUS_INVALID", f"{path}/lifecycle/lifecycle_status", "decision lifecycle axes disagree")

    for index, transition in enumerate(package["promotion_transitions"]):
        path = f"/promotion_transitions/{index}"
        _require_refs(errors, [transition["subject_ref"]], record_ids, f"{path}/subject_ref")
        _require_refs(errors, [transition["owner_gate_decision_ref"]], decision_ids, f"{path}/owner_gate_decision_ref")
        _require_refs(errors, [transition["last_action_ref"]], action_ids, f"{path}/last_action_ref")
        gate = decisions.get(transition["owner_gate_decision_ref"])
        if gate is None or gate["decision_state"] != "accepted" or transition["owner_receipt_ref"] not in gate["evidence_refs"]:
            _add_error(errors, "AP_PROMOTION_GATE_INVALID", path, "promotion transition requires an accepted decision containing owner_receipt_ref")

    residues = {item["residue_id"]: item for item in package["residues"]}
    for index, residue in enumerate(package["residues"]):
        path = f"/residues/{index}"
        _require_refs(errors, [residue["source_operation_ref"]], action_ids, f"{path}/source_operation_ref")
        if residue["action_effect"] != "continue" and residue["promotion_effect"] == "allow":
            _add_error(errors, "AP_RESIDUE_INVALID", f"{path}/promotion_effect", "blocking or deferred residue cannot allow promotion")

    for index, action in enumerate(package["governed_actions"]):
        path = f"/governed_actions/{index}"
        _require_refs(errors, action["subject_refs"], record_ids - action_ids, f"{path}/subject_refs")
        _require_refs(errors, action["residue_refs"], residue_ids, f"{path}/residue_refs")
        if not action["subject_refs"]:
            _add_error(errors, "AP_ACTION_SUBJECT_UNLINKED", f"{path}/subject_refs", "action requires at least one affected record")
        for facet_name in FACET_NAMES:
            facet = action["facets"][facet_name]
            residue = residues.get(facet["ref"])
            if facet["state"] == "missing_with_residue":
                if residue is None or residue.get("residue_type") != "missing_action_facet" or residue.get("facet_name") != facet_name or residue.get("source_operation_ref") != action["action_id"] or facet["ref"] not in action["residue_refs"]:
                    _add_error(errors, "AP_FACET_STATE_REF_INVALID", f"{path}/facets/{facet_name}", "missing facet must reference one compatible action residue")
                elif residue["action_effect"] != action["downstream_effect"]:
                    _add_error(errors, "AP_RESIDUE_INVALID", f"{path}/facets/{facet_name}", "facet residue effect must equal action downstream_effect")
            elif residue is not None:
                _add_error(errors, "AP_FACET_STATE_REF_INVALID", f"{path}/facets/{facet_name}/ref", "bound or created facet cannot reference residue")

    for index, projection in enumerate(package["projection_declarations"]):
        path = f"/projection_declarations/{index}"
        semantic_units = set(projection["semantic_unit_refs"])
        included = set(projection["included_record_refs"])
        excluded = {item["record_ref"] for item in projection["excluded_record_refs"]}
        parity_units = {item["semantic_unit_ref"] for item in projection["per_unit_parity"]}
        _require_refs(errors, semantic_units, record_ids, f"{path}/semantic_unit_refs")
        _require_refs(errors, included | excluded, record_ids, f"{path}/included_or_excluded")
        if semantic_units != included | excluded or semantic_units != parity_units or included & excluded:
            _add_error(errors, "AP_PROJECTION_INVALID", path, "semantic units, included/excluded partition, and per-unit parity must agree exactly")
        for excluded_index, item in enumerate(projection["excluded_record_refs"]):
            if item["residue_ref"] not in residue_ids:
                _add_error(errors, "AP_PROJECTION_INVALID", f"{path}/excluded_record_refs/{excluded_index}/residue_ref", "excluded record requires a known residue")
        for parity_index, item in enumerate(projection["per_unit_parity"]):
            _require_refs(errors, item["residue_refs"], residue_ids, f"{path}/per_unit_parity/{parity_index}/residue_refs")
            if item["parity_state"] == "pass" and item["residue_refs"]:
                _add_error(errors, "AP_PROJECTION_INVALID", f"{path}/per_unit_parity/{parity_index}", "passing parity cannot carry residue")
            if item["parity_state"] != "pass" and not item["residue_refs"]:
                _add_error(errors, "AP_PROJECTION_INVALID", f"{path}/per_unit_parity/{parity_index}", "non-passing parity requires residue")
        if projection["support_state"] == "supported" and (excluded or any(item["parity_state"] != "pass" for item in projection["per_unit_parity"])):
            _add_error(errors, "AP_PROJECTION_INVALID", path, "supported projection must include every semantic unit with passing parity")

    if package["source_set_sha256"] != source_set_digest(package):
        _add_error(errors, "AP_SOURCE_SET_DIGEST_MISMATCH", "/source_set_sha256", "source binding set digest differs from canonical source bindings")
    if package["canonical_record_set_sha256"] != record_set_digest(package):
        _add_error(errors, "AP_RECORD_SET_DIGEST_MISMATCH", "/canonical_record_set_sha256", "record set digest differs from fixed-family canonical records")
    return errors


def validate_authority_package(package: Any) -> dict[str, Any]:
    package_sha256 = sha256_bytes(canonical_bytes(normalized_package(package)))
    semantic_sha256 = semantic_digest(package)
    errors = _schema_errors(package)
    if not errors and isinstance(package, dict):
        errors.extend(_semantic_errors(package))
    errors = sorted(
        {canonical_bytes(item): item for item in errors}.values(),
        key=lambda item: (item["error_id"], item["path"], item["detail"]),
    )
    blocked_checks = {ERROR_CHECK.get(item["error_id"], "json-schema") for item in errors}
    checks = [
        {"check": name, "status": "block" if name in blocked_checks else "pass"}
        for name in CHECKS
    ]
    error_ids = sorted({item["error_id"] for item in errors})
    status = "blocked" if errors else "valid"
    validator_sha256 = sha256_file(Path(__file__).resolve())
    identity = {
        "validator_version": VALIDATOR_VERSION,
        "validator_sha256": validator_sha256,
        "package_id": package.get("package_id") if isinstance(package, dict) else None,
        "package_sha256": package_sha256,
        "semantic_sha256": semantic_sha256,
        "status": status,
        "checks": checks,
        "errors": errors,
        "authority_effect": "none",
    }
    receipt = {
        "schema_version": "mint.authority-package-validation-receipt.v0.1",
        "receipt_id": sha256_bytes(canonical_bytes(identity)),
        "validator_version": VALIDATOR_VERSION,
        "validator_sha256": validator_sha256,
        "package_id": identity["package_id"],
        "package_sha256": package_sha256,
        "semantic_sha256": semantic_sha256,
        "status": status,
        "validation_checks": checks,
        "error_ids": error_ids,
        "errors": errors,
        "effects_planned": 0,
        "effects_applied": 0,
        "writes_attempted": 0,
        "writes_performed": 0,
        "external_commands_executed": 0,
        "network_calls": 0,
        "git_operations": 0,
        "authority_effect": "none",
        "proof_ceiling": PROOF_CEILING,
    }
    return receipt


def load_and_validate(path: Path) -> dict[str, Any]:
    try:
        package = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        package = {"load_error": f"{type(exc).__name__}: {exc}"}
    return validate_authority_package(package)
