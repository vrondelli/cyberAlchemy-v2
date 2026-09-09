"""Deterministic, read-only admission validator for one Mint/Zagr pilot contract."""

from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path, PurePosixPath
from typing import Any


VALIDATOR_VERSION = "mint.runtime.pilot-check.v0.1"
CONTRACT_VERSION = "mint.pilot-contract.v0.1"
RECEIPT_VERSION = "mint.pilot-validation-receipt.v0.1"
PROOF_CEILING = (
    "pilot input admission only; no render, apply, recover, mint, ratification, "
    "promotion, release, deployment, or production proof"
)
EXPECTED_CONTRACTS = {
    "apply": "mint.apply-request.v0.1",
    "plan": "mint.plan.v0.1",
    "recover": "mint.apply-request.v0.1",
    "render": "mint.render-input.v0.1",
}


def _exact(value: Any, keys: set[str], label: str, errors: list[str]) -> bool:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return False
    missing = sorted(keys - set(value))
    unknown = sorted(set(value) - keys)
    if missing:
        errors.append(f"{label} missing fields: {', '.join(missing)}")
    if unknown:
        errors.append(f"{label} unknown fields: {', '.join(unknown)}")
    return not missing and not unknown


def _string(value: Any, label: str, errors: list[str]) -> bool:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")
        return False
    return True


def _digest(value: Any, label: str, planner: Any, errors: list[str]) -> bool:
    if not isinstance(value, str) or not planner.SHA256_RE.fullmatch(value):
        errors.append(f"{label} must be a lowercase SHA-256")
        return False
    return True


def _shape_errors(contract: Any, planner: Any) -> list[str]:
    errors: list[str] = []
    top = {
        "authority", "contracts", "domain", "effects", "inputs", "isolation",
        "pilot_id", "proof_ceiling", "request_id", "run_date", "schema_version",
        "sources", "zagr_snapshot",
    }
    if not _exact(contract, top, "pilot contract", errors):
        return errors
    if contract["schema_version"] != CONTRACT_VERSION:
        errors.append(f"schema_version must be {CONTRACT_VERSION}")
    for field in ("pilot_id", "request_id"):
        _string(contract[field], field, errors)
    if _string(contract["run_date"], "run_date", errors):
        try:
            parsed = dt.date.fromisoformat(contract["run_date"])
            if parsed.isoformat() != contract["run_date"]:
                raise ValueError
        except ValueError:
            errors.append("run_date must be an exact YYYY-MM-DD date")
    if contract["proof_ceiling"] != PROOF_CEILING:
        errors.append("proof_ceiling exceeds or differs from the fixed pilot-admission ceiling")

    domain = contract["domain"]
    if _exact(domain, {"domain_id", "governed_subject", "owner_selection"}, "domain", errors):
        _string(domain["domain_id"], "domain.domain_id", errors)
        _string(domain["governed_subject"], "domain.governed_subject", errors)
        selection = domain["owner_selection"]
        if _exact(selection, {"evidence_ref", "evidence_sha256", "owner_route"}, "domain.owner_selection", errors):
            _string(selection["evidence_ref"], "domain.owner_selection.evidence_ref", errors)
            _digest(selection["evidence_sha256"], "domain.owner_selection.evidence_sha256", planner, errors)
            _string(selection["owner_route"], "domain.owner_selection.owner_route", errors)

    sources = contract["sources"]
    if not isinstance(sources, list) or not sources:
        errors.append("sources must contain at least one source binding")
    else:
        source_keys = {"owner_route", "path", "precedence_disposition", "selector", "sha256", "status"}
        for index, source in enumerate(sources):
            label = f"sources[{index}]"
            if not _exact(source, source_keys, label, errors):
                continue
            for field in ("owner_route", "path", "selector"):
                _string(source[field], f"{label}.{field}", errors)
            _digest(source["sha256"], f"{label}.sha256", planner, errors)
            if source["status"] != "current":
                errors.append(f"{label}.status must be current")
            if source["precedence_disposition"] not in ("primary", "supplemental"):
                errors.append(f"{label}.precedence_disposition must be primary or supplemental")

    authority = contract["authority"]
    authority_keys = {
        "authority_owner_route", "blocked_use", "ratification_status", "triage_receipt_ref",
        "triage_receipt_sha256", "triage_verdict",
    }
    if _exact(authority, authority_keys, "authority", errors):
        for field in ("authority_owner_route", "blocked_use", "triage_receipt_ref"):
            _string(authority[field], f"authority.{field}", errors)
        _digest(authority["triage_receipt_sha256"], "authority.triage_receipt_sha256", planner, errors)
        if authority["triage_verdict"] != "new-authority (domain-local)":
            errors.append("authority.triage_verdict must be new-authority (domain-local)")
        if authority["ratification_status"] != "pending":
            errors.append("authority.ratification_status must be pending")

    inputs = contract["inputs"]
    input_keys = {
        "ir_ref", "ir_sha256", "joined_closeout_ref", "joined_closeout_sha256",
        "manifest_ref", "manifest_sha256", "render_input_ref", "render_input_sha256",
        "runtime_ref", "runtime_sha256", "template_root", "template_set_sha256",
    }
    if _exact(inputs, input_keys, "inputs", errors):
        for field in ("ir_ref", "joined_closeout_ref", "manifest_ref", "render_input_ref", "runtime_ref", "template_root"):
            _string(inputs[field], f"inputs.{field}", errors)
        for field in ("ir_sha256", "joined_closeout_sha256", "manifest_sha256", "render_input_sha256", "runtime_sha256", "template_set_sha256"):
            _digest(inputs[field], f"inputs.{field}", planner, errors)

    isolation = contract["isolation"]
    isolation_keys = {
        "allowed_root", "journal_root", "protected_paths", "target_must_be_absent",
        "target_path", "visibility", "workspace_root", "zagr_root",
    }
    if _exact(isolation, isolation_keys, "isolation", errors):
        for field in ("allowed_root", "journal_root", "target_path", "workspace_root", "zagr_root"):
            _string(isolation[field], f"isolation.{field}", errors)
        if isolation["visibility"] != "private":
            errors.append("isolation.visibility must be private")
        if isolation["target_must_be_absent"] is not True:
            errors.append("isolation.target_must_be_absent must be true")
        protected = isolation["protected_paths"]
        if not isinstance(protected, list) or not protected or any(not isinstance(item, str) or not item for item in protected):
            errors.append("isolation.protected_paths must contain non-empty path strings")
        elif len(protected) != len(set(protected)):
            errors.append("isolation.protected_paths must be unique")

    contracts = contract["contracts"]
    if _exact(contracts, set(EXPECTED_CONTRACTS), "contracts", errors):
        for name, expected in EXPECTED_CONTRACTS.items():
            if contracts[name] != expected:
                errors.append(f"contracts.{name} must be {expected}")

    effects = contract["effects"]
    effect_keys = {"external_commands", "filesystem", "git", "network", "scaffolder"}
    if _exact(effects, effect_keys, "effects", errors):
        for name in sorted(effect_keys):
            if effects[name] is not False:
                errors.append(f"effects.{name} must be false")

    snapshot = contract["zagr_snapshot"]
    if _exact(snapshot, {"after_check_required", "before_sha256", "root", "selectors"}, "zagr_snapshot", errors):
        _string(snapshot["root"], "zagr_snapshot.root", errors)
        _digest(snapshot["before_sha256"], "zagr_snapshot.before_sha256", planner, errors)
        if snapshot["after_check_required"] is not True:
            errors.append("zagr_snapshot.after_check_required must be true")
        selectors = snapshot["selectors"]
        if not isinstance(selectors, list) or not selectors or any(not isinstance(item, str) or not item for item in selectors):
            errors.append("zagr_snapshot.selectors must contain non-empty relative paths")
        elif len(selectors) != len(set(selectors)):
            errors.append("zagr_snapshot.selectors must be unique")
    return sorted(set(errors))


def _path(raw: str, label: str, planner: Any, errors: list[str]) -> Path | None:
    path = Path(raw)
    if not path.is_absolute():
        errors.append(f"{label} must be absolute")
        return None
    if planner._contains_dotdot(raw) or raw != path.as_posix():
        errors.append(f"{label} must be normalized")
    if planner._has_existing_symlink_component(path):
        errors.append(f"{label} contains an existing symlink component")
    return path


def _regular_binding(
    raw: str,
    expected: str,
    kind: str,
    planner: Any,
    errors: list[str],
    bindings: list[dict[str, Any]],
) -> Path | None:
    path = _path(raw, kind, planner, errors)
    if path is None:
        return None
    if path.is_symlink() or not path.is_file():
        errors.append(f"{kind} must be an existing non-symlink regular file")
        return path
    actual = planner.sha256_file(path)
    if actual != expected:
        errors.append(f"{kind} digest mismatch")
    bindings.append({"kind": kind, "path": raw, "sha256": actual, "size_bytes": path.stat().st_size})
    return path


def selector_set_digest(root: Path, selectors: list[str], planner: Any) -> tuple[str | None, list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    records: list[dict[str, Any]] = []
    for selector in selectors:
        relative = PurePosixPath(selector)
        if relative.is_absolute() or ".." in relative.parts or "." in relative.parts or selector != relative.as_posix():
            errors.append(f"unsafe Zagr selector: {selector}")
            continue
        selected = root.joinpath(*relative.parts)
        if not planner._is_relative_to(selected.resolve(strict=False), root.resolve(strict=False)):
            errors.append(f"Zagr selector escapes root: {selector}")
        elif planner._has_existing_symlink_component(selected) or selected.is_symlink() or not selected.is_file():
            errors.append(f"Zagr selector must resolve to a non-symlink regular file: {selector}")
        else:
            records.append({"path": selector, "sha256": planner.sha256_file(selected), "size_bytes": selected.stat().st_size})
    if errors:
        return None, records, sorted(set(errors))
    return planner.sha256_bytes(planner.canonical_bytes(records)), records, []


def _semantic_checks(contract: dict[str, Any], planner: Any) -> tuple[dict[str, list[str]], list[dict[str, Any]], dict[str, Any]]:
    categories: dict[str, list[str]] = {
        "identity-and-authority": [],
        "evidence-bindings": [],
        "runtime-and-input-bindings": [],
        "isolation-boundaries": [],
        "zagr-snapshot": [],
        "no-write-stability": [],
        "external-effect-denial": [],
        "proof-ceiling": [],
    }
    bindings: list[dict[str, Any]] = []
    observations: dict[str, Any] = {
        "allowed_root": contract["isolation"]["allowed_root"],
        "evidence_set_after_sha256": None,
        "evidence_set_before_sha256": None,
        "journal_exists_after": None,
        "journal_exists_before": None,
        "journal_root": contract["isolation"]["journal_root"],
        "journal_sha256_after": None,
        "journal_sha256_before": None,
        "protected_paths": sorted(contract["isolation"]["protected_paths"]),
        "target_exists_after": None,
        "target_exists_before": None,
        "target_path": contract["isolation"]["target_path"],
        "visibility": contract["isolation"]["visibility"],
        "zagr_before_sha256": None,
        "zagr_after_sha256": None,
        "zagr_root": contract["isolation"]["zagr_root"],
        "zagr_selector_count": len(contract["zagr_snapshot"]["selectors"]),
    }

    identity = categories["identity-and-authority"]
    selection = contract["domain"]["owner_selection"]
    _regular_binding(selection["evidence_ref"], selection["evidence_sha256"], "owner-selection", planner, identity, bindings)
    authority = contract["authority"]
    _regular_binding(authority["triage_receipt_ref"], authority["triage_receipt_sha256"], "authority-triage", planner, identity, bindings)
    owner_routes = {source["owner_route"] for source in contract["sources"]}
    owner_routes.add(selection["owner_route"])
    if authority["authority_owner_route"] in owner_routes:
        identity.append("authority owner route must be independent from selection and source owner routes")
    if sum(source["precedence_disposition"] == "primary" for source in contract["sources"]) != 1:
        identity.append("sources must contain exactly one primary precedence disposition")

    evidence = categories["evidence-bindings"]
    source_paths: list[Path] = []
    for index, source in enumerate(contract["sources"]):
        bound = _regular_binding(source["path"], source["sha256"], f"source[{index}]", planner, evidence, bindings)
        if bound is not None:
            source_paths.append(bound.resolve(strict=False))

    runtime_errors = categories["runtime-and-input-bindings"]
    inputs = contract["inputs"]
    input_specs = (
        ("manifest_ref", "manifest_sha256", "manifest"),
        ("render_input_ref", "render_input_sha256", "render-input"),
        ("joined_closeout_ref", "joined_closeout_sha256", "joined-closeout"),
        ("runtime_ref", "runtime_sha256", "runtime"),
        ("ir_ref", "ir_sha256", "stage2-ir"),
    )
    input_paths: dict[str, Path | None] = {}
    for ref_key, digest_key, kind in input_specs:
        input_paths[kind] = _regular_binding(inputs[ref_key], inputs[digest_key], kind, planner, runtime_errors, bindings)
    exact_runtime = (planner.RUNTIME_DIR / "mint.py").resolve()
    if input_paths["runtime"] is not None and input_paths["runtime"].resolve() != exact_runtime:
        runtime_errors.append("inputs.runtime_ref must identify the active Mint CLI runtime")
    exact_ir = (planner.RUNTIME_DIR / "ir" / "stage2.v0.1.json").resolve()
    if input_paths["stage2-ir"] is not None and input_paths["stage2-ir"].resolve() != exact_ir:
        runtime_errors.append("inputs.ir_ref must identify the active Stage-2 IR")
    template_root = _path(inputs["template_root"], "inputs.template_root", planner, runtime_errors)
    if template_root is not None:
        if template_root.resolve(strict=False) != planner.TEMPLATE_ROOT.resolve():
            runtime_errors.append("inputs.template_root must identify the active private Mint template set")
        else:
            try:
                actual_template_digest, records = planner.template_set_digest(template_root)
                if actual_template_digest != inputs["template_set_sha256"]:
                    runtime_errors.append("template-set digest mismatch")
                for record in records:
                    bindings.append({"kind": "template", "path": str(template_root / record["path"]), "sha256": record["sha256"], "size_bytes": record["size_bytes"]})
            except ValueError as exc:
                runtime_errors.append(str(exc))

    documents: dict[str, Any] = {}
    for kind in ("manifest", "render-input", "joined-closeout"):
        path = input_paths[kind]
        if path is None or not path.is_file():
            continue
        try:
            documents[kind] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            runtime_errors.append(f"{kind} must be valid JSON: {type(exc).__name__}")
    manifest = documents.get("manifest")
    if not isinstance(manifest, dict) or manifest.get("schema_version") != "mint.manifest.v0.1":
        runtime_errors.append("manifest binding must contain mint.manifest.v0.1")
    else:
        manifest_shape_errors = planner._validate_manifest_shape(manifest)
        if manifest_shape_errors:
            runtime_errors.extend(f"bound manifest: {error}" for error in manifest_shape_errors)
        else:
            manifest_path_errors, _, _, _ = planner._validate_paths_and_sources(manifest)
            runtime_errors.extend(f"bound manifest: {error}" for error in manifest_path_errors)
        target = manifest.get("target", {})
        domain = manifest.get("domain", {})
        if manifest.get("request_id") != contract["request_id"]:
            runtime_errors.append("manifest request_id must match pilot request_id")
        if domain.get("governed_subject") != contract["domain"]["governed_subject"]:
            runtime_errors.append("manifest governed_subject must match pilot governed_subject")
        expected_target = {
            "allowed_root": contract["isolation"]["allowed_root"],
            "must_be_absent": True,
            "path": contract["isolation"]["target_path"],
            "visibility": "private",
        }
        if target != expected_target:
            runtime_errors.append("manifest target must exactly match pilot isolation target")
        manifest_kinds = manifest.get("authority", {}).get("domain_kinds", [])
        if not any(
            kind.get("triage_receipt_ref") == authority["triage_receipt_ref"]
            and kind.get("triage_receipt_sha256") == authority["triage_receipt_sha256"]
            and kind.get("triage_verdict") == authority["triage_verdict"]
            and kind.get("owner_route") == authority["authority_owner_route"]
            for kind in manifest_kinds
            if isinstance(kind, dict)
        ):
            runtime_errors.append("manifest authority kind must bind the pilot triage evidence and independent owner route")
    render_input = documents.get("render-input")
    if not isinstance(render_input, dict) or render_input.get("schema_version") != "mint.render-input.v0.1":
        runtime_errors.append("render-input binding must contain mint.render-input.v0.1")
    closeout = documents.get("joined-closeout")
    if not isinstance(closeout, dict) or closeout.get("status") not in ("closed", "complete", "pass", "ready"):
        runtime_errors.append("joined closeout must be JSON with a passing terminal status")

    isolation_errors = categories["isolation-boundaries"]
    isolation = contract["isolation"]
    target = _path(isolation["target_path"], "isolation.target_path", planner, isolation_errors)
    allowed = _path(isolation["allowed_root"], "isolation.allowed_root", planner, isolation_errors)
    journal = _path(isolation["journal_root"], "isolation.journal_root", planner, isolation_errors)
    workspace = _path(isolation["workspace_root"], "isolation.workspace_root", planner, isolation_errors)
    zagr = _path(isolation["zagr_root"], "isolation.zagr_root", planner, isolation_errors)
    if workspace is not None and workspace.resolve(strict=False) != planner.WORKSPACE_ROOT.resolve():
        isolation_errors.append("isolation.workspace_root must identify the active domainspec-core workspace")
    expected_zagr = (planner.WORKSPACE_ROOT / "projects" / "zagr").resolve()
    if zagr is not None and zagr.resolve(strict=False) != expected_zagr:
        isolation_errors.append("isolation.zagr_root must identify projects/zagr")
    if allowed is not None and not allowed.is_dir():
        isolation_errors.append("isolation.allowed_root must be an existing directory")
    if journal is not None and not journal.is_dir():
        isolation_errors.append("isolation.journal_root must be an existing directory")
    if target is not None:
        observations["target_exists_before"] = os.path.lexists(target)
        if os.path.lexists(target):
            isolation_errors.append("isolation.target_path must be absent")
    if journal is not None:
        observations["journal_exists_before"] = journal.is_dir()
        if journal.is_dir():
            try:
                observations["journal_sha256_before"] = planner.tree_sha256(journal)
            except ValueError as exc:
                isolation_errors.append(f"journal snapshot failed: {exc}")
    broad_roots = {Path("/"), Path("/tmp"), Path("/var/tmp"), Path.home().resolve(), planner.WORKSPACE_ROOT.resolve(), expected_zagr}
    if allowed is not None and (allowed.resolve(strict=False) in broad_roots or len(allowed.resolve(strict=False).parts) < 3):
        isolation_errors.append("isolation.allowed_root is too broad or protected")
    if journal is not None and (journal.resolve(strict=False) in broad_roots or len(journal.resolve(strict=False).parts) < 3):
        isolation_errors.append("isolation.journal_root is too broad or protected")
    if target is not None and allowed is not None and target.resolve(strict=False).parent != allowed.resolve(strict=False):
        isolation_errors.append("isolation.target_path must be a direct child of isolation.allowed_root")
    if target is not None and journal is not None and (
        planner._is_relative_to(target.resolve(strict=False), journal.resolve(strict=False))
        or planner._is_relative_to(journal.resolve(strict=False), target.resolve(strict=False))
    ):
        isolation_errors.append("target and journal roots must be disjoint")
    if allowed is not None and journal is not None and (
        planner._is_relative_to(allowed.resolve(strict=False), journal.resolve(strict=False))
        or planner._is_relative_to(journal.resolve(strict=False), allowed.resolve(strict=False))
    ):
        isolation_errors.append("allowed and journal roots must be disjoint")

    protected_paths: list[Path] = []
    for index, raw in enumerate(isolation["protected_paths"]):
        protected = _path(raw, f"isolation.protected_paths[{index}]", planner, isolation_errors)
        if protected is not None:
            protected_paths.append(protected.resolve(strict=False))
            if target is not None and (
                planner._is_relative_to(target.resolve(strict=False), protected.resolve(strict=False))
                or planner._is_relative_to(protected.resolve(strict=False), target.resolve(strict=False))
            ):
                isolation_errors.append(f"target overlaps protected path: {raw}")
            if allowed is not None and (
                planner._is_relative_to(allowed.resolve(strict=False), protected.resolve(strict=False))
                or planner._is_relative_to(protected.resolve(strict=False), allowed.resolve(strict=False))
            ):
                isolation_errors.append(f"allowed root overlaps protected path: {raw}")
            if journal is not None and (
                planner._is_relative_to(journal.resolve(strict=False), protected.resolve(strict=False))
                or planner._is_relative_to(protected.resolve(strict=False), journal.resolve(strict=False))
            ):
                isolation_errors.append(f"journal overlaps protected path: {raw}")
    required_protected = {
        planner.WORKSPACE_ROOT.resolve(),
        expected_zagr,
        *source_paths,
        *[path.resolve(strict=False) for path in input_paths.values() if path is not None],
    }
    if template_root is not None:
        required_protected.add(template_root.resolve(strict=False))
    selection_path = Path(selection["evidence_ref"])
    triage_path = Path(authority["triage_receipt_ref"])
    required_protected.update((selection_path.resolve(strict=False), triage_path.resolve(strict=False)))
    for required in sorted(required_protected, key=lambda item: item.as_posix()):
        if required not in protected_paths:
            isolation_errors.append(f"protected paths missing required binding: {required}")

    snapshot_errors = categories["zagr-snapshot"]
    snapshot = contract["zagr_snapshot"]
    if snapshot["root"] != isolation["zagr_root"]:
        snapshot_errors.append("zagr_snapshot.root must match isolation.zagr_root")
    if zagr is None or not zagr.is_dir():
        snapshot_errors.append("Zagr root must be an existing directory")
    else:
        current, records, selector_errors = selector_set_digest(zagr, snapshot["selectors"], planner)
        snapshot_errors.extend(selector_errors)
        observations["zagr_before_sha256"] = current
        if current is not None and current != snapshot["before_sha256"]:
            snapshot_errors.append("Zagr before-snapshot digest mismatch")
        for record in records:
            bindings.append({"kind": "zagr-selector", "path": str(zagr / record["path"]), "sha256": record["sha256"], "size_bytes": record["size_bytes"]})

    no_write_errors = categories["no-write-stability"]
    bindings.sort(key=lambda item: (item["kind"], item["path"]))
    observations["evidence_set_before_sha256"] = planner.sha256_bytes(planner.canonical_bytes(bindings))
    after_bindings: list[dict[str, Any]] = []
    for binding in bindings:
        bound_path = Path(binding["path"])
        if bound_path.is_symlink() or not bound_path.is_file():
            no_write_errors.append(f"bound evidence changed during validation: {binding['path']}")
            continue
        after_bindings.append({
            "kind": binding["kind"],
            "path": binding["path"],
            "sha256": planner.sha256_file(bound_path),
            "size_bytes": bound_path.stat().st_size,
        })
    after_bindings.sort(key=lambda item: (item["kind"], item["path"]))
    observations["evidence_set_after_sha256"] = planner.sha256_bytes(planner.canonical_bytes(after_bindings))
    if after_bindings != bindings:
        no_write_errors.append("bound evidence set changed during validation")
    if target is not None:
        observations["target_exists_after"] = os.path.lexists(target)
        if observations["target_exists_after"] != observations["target_exists_before"]:
            no_write_errors.append("target existence changed during validation")
    if journal is not None:
        observations["journal_exists_after"] = journal.is_dir()
        if journal.is_dir():
            try:
                observations["journal_sha256_after"] = planner.tree_sha256(journal)
            except ValueError as exc:
                no_write_errors.append(f"journal after-snapshot failed: {exc}")
        if (
            observations["journal_exists_after"] != observations["journal_exists_before"]
            or observations["journal_sha256_after"] != observations["journal_sha256_before"]
        ):
            no_write_errors.append("journal changed during validation")
    if zagr is not None and zagr.is_dir():
        zagr_after, _, zagr_after_errors = selector_set_digest(zagr, snapshot["selectors"], planner)
        no_write_errors.extend(zagr_after_errors)
        observations["zagr_after_sha256"] = zagr_after
        if zagr_after != observations["zagr_before_sha256"]:
            no_write_errors.append("Zagr selector set changed during validation")

    if any(value is not False for value in contract["effects"].values()):
        categories["external-effect-denial"].append("all effect permissions must remain false")
    if contract["proof_ceiling"] != PROOF_CEILING:
        categories["proof-ceiling"].append("proof ceiling must remain pilot input admission only")
    return categories, sorted(bindings, key=lambda item: (item["kind"], item["path"])), observations


def pilot_output(contract: Any, planner: Any) -> dict[str, Any]:
    contract_sha256 = planner.sha256_bytes(planner.canonical_bytes(contract))
    shape = _shape_errors(contract, planner)
    check_order = (
        "strict-contract-shape", "identity-and-authority", "evidence-bindings",
        "runtime-and-input-bindings", "isolation-boundaries", "zagr-snapshot", "no-write-stability",
        "external-effect-denial", "proof-ceiling",
    )
    categories: dict[str, list[str]] = {name: ["not evaluated because strict contract shape failed"] for name in check_order[1:]}
    bindings: list[dict[str, Any]] = []
    observations: dict[str, Any] = {
        "allowed_root": None, "evidence_set_after_sha256": None,
        "evidence_set_before_sha256": None, "journal_exists_after": None,
        "journal_exists_before": None, "journal_root": None, "journal_sha256_after": None,
        "journal_sha256_before": None, "protected_paths": [], "target_exists_after": None,
        "target_exists_before": None, "target_path": None, "visibility": None,
        "zagr_after_sha256": None, "zagr_before_sha256": None, "zagr_root": None,
        "zagr_selector_count": 0,
    }
    if not shape:
        categories, bindings, observations = _semantic_checks(contract, planner)
    for kind, schema_name in (
        ("pilot-contract-schema", "mint-pilot-contract.v0.1.schema.json"),
        ("pilot-receipt-schema", "mint-pilot-validation-receipt.v0.1.schema.json"),
    ):
        schema_path = Path(__file__).resolve().parent / "contracts" / schema_name
        bindings.append({"kind": kind, "path": str(schema_path), "sha256": planner.sha256_file(schema_path), "size_bytes": schema_path.stat().st_size})
    bindings.sort(key=lambda item: (item["kind"], item["path"]))
    errors = list(shape)
    for name in check_order[1:]:
        errors.extend(categories[name])
    blockers = sorted(set(errors))
    status = "admission-ready" if not blockers else "blocked"
    checks = [{"check": "strict-contract-shape", "status": "pass" if not shape else "block"}]
    checks.extend({"check": name, "status": "pass" if not categories[name] else "block"} for name in check_order[1:])
    validator_path = Path(__file__).resolve()
    receipt: dict[str, Any] = {
        "blockers": blockers,
        "contract_sha256": contract_sha256,
        "effects_applied": 0,
        "effects_planned": 0,
        "evidence_bindings": bindings,
        "external_commands_executed": 0,
        "git_operations": 0,
        "network_calls": 0,
        "observations": observations,
        "pilot_id": contract.get("pilot_id", "unknown") if isinstance(contract, dict) and isinstance(contract.get("pilot_id"), str) else "unknown",
        "proof_ceiling": PROOF_CEILING,
        "receipt_id": "",
        "request_id": contract.get("request_id", "unknown") if isinstance(contract, dict) and isinstance(contract.get("request_id"), str) else "unknown",
        "run_date": contract.get("run_date", "unknown") if isinstance(contract, dict) and isinstance(contract.get("run_date"), str) else "unknown",
        "schema_version": RECEIPT_VERSION,
        "status": status,
        "validation_checks": checks,
        "validator_sha256": planner.sha256_file(validator_path),
        "validator_version": VALIDATOR_VERSION,
        "writes_attempted": 0,
        "writes_performed": 0,
    }
    identity = dict(receipt)
    identity.pop("receipt_id")
    receipt["receipt_id"] = planner.sha256_bytes(planner.canonical_bytes(identity))
    return {"receipt": receipt, "schema_version": "mint.pilot-validation-output.v0.1"}
