#!/usr/bin/env python3
"""Deterministic Mint plan/render/apply/recover and no-write admission CLI."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


PLANNER_VERSION = "mint.runtime.plan.v0.1"
RUNTIME_DIR = Path(__file__).resolve().parent
MINT_DIR = RUNTIME_DIR.parent
TEMPLATE_ROOT = MINT_DIR / "templates"
WORKSPACE_ROOT = MINT_DIR.parents[2]
SHA256_RE = re.compile(r"^[a-f0-9]{64}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
KIND_ID_RE = re.compile(r"^[A-Z][A-Z0-9_-]*$")

# P0 derives effects from this private, code-owned catalog. Callers cannot add paths.
STAGE_2_EFFECTS: tuple[tuple[str, str], ...] = (
    ("authority-model.md", "authority/AUTHORITY-MODEL.md"),
    ("source-spine.md", "authority/source-spine.md"),
    ("promotion-policy.md", "authority/promotion-policy.md"),
    ("constitution.md", "authority/constitutions/{domain_slug}-CONSTITUTION.md"),
    ("definitions.md", "definitions/DEFINITIONS.md"),
    ("definitions-index.md", "definitions/DEFINITIONS-INDEX.md"),
    ("definition-drift-audit.md", "definitions/DEFINITION-DRIFT-AUDIT.md"),
    ("methods-catalogue.md", "authority/METHODS-CATALOGUE.md"),
    ("definition-localization-route.md", "definitions/DEFINITION-LOCALIZATION-ROUTE.md"),
    ("authority-postures.md", "authority/AUTHORITY-POSTURES.md"),
    ("boundaries.md", "authority/boundaries.md"),
    ("imports-README.md", "authority/imports/README.md"),
    ("constitution-import-pack.md", "authority/constitutions/CONSTITUTION-IMPORT-PACK.md"),
    ("nav-and-decisions.md", "authority/README.md"),
    ("nav-and-decisions.md", "authority/decisions/README.md"),
    ("baseline-constitution.md", "authority/constitutions/{domain_slug}-BASELINE-CONSTITUTION.md"),
    ("baseline-primitives.md", "authority/BASELINE-PRIMITIVES.md"),
    ("project-space-roles.md", "authority/PROJECT-SPACE-ROLES.md"),
)
DEFERRED_EFFECTS: tuple[tuple[str, str, str | None], ...] = (
    ("stage-3", "authority/decisions/{run_date}-mint.md", None),
    ("stage-3", "authority/decisions/{run_date}-ratify-mint.md", "decision-mint-ratify.md"),
    ("stage-4", "RELATED-FRAMEWORK-CROSSWALK.md", "crosswalk.md"),
)
TEMPLATE_FILES = tuple(
    sorted(
        {source for source, _ in STAGE_2_EFFECTS}
        | {source for _, _, source in DEFERRED_EFFECTS if source is not None}
    )
)


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_sha256(root: Path) -> str:
    """Hash ordered source bytes and relative paths, excluding Git metadata."""
    if root.is_file():
        if root.is_symlink():
            raise ValueError("framework source must not be a symlink")
        return sha256_file(root)
    if not root.is_dir():
        raise ValueError("framework source must be a regular file or directory")
    records: list[dict[str, Any]] = []
    for path in sorted(root.rglob("*"), key=lambda item: item.as_posix()):
        relative = path.relative_to(root)
        if ".git" in relative.parts:
            continue
        if path.is_symlink():
            raise ValueError(f"framework source contains symlink: {relative.as_posix()}")
        if path.is_file():
            records.append(
                {
                    "path": relative.as_posix(),
                    "sha256": sha256_file(path),
                    "size_bytes": path.stat().st_size,
                }
            )
    return sha256_bytes(canonical_bytes(records))


def _template_records(root: Path = TEMPLATE_ROOT) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for name in TEMPLATE_FILES:
        path = root / name
        if not path.exists():
            raise ValueError(f"missing allowlisted template: {name}")
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"template must be a non-symlink regular file: {name}")
        records.append({"path": name, "sha256": sha256_file(path), "size_bytes": path.stat().st_size})
    return records


def template_set_digest(root: Path = TEMPLATE_ROOT) -> tuple[str, list[dict[str, Any]]]:
    records = _template_records(root)
    return sha256_bytes(canonical_bytes(records)), records


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _contains_dotdot(raw: str) -> bool:
    return ".." in Path(raw).parts


def _has_existing_symlink_component(path: Path) -> bool:
    current = Path(path.anchor)
    for part in path.parts[1:]:
        current = current / part
        if os.path.lexists(current) and current.is_symlink():
            return True
    return False


def _require_exact_keys(value: Any, required: set[str], label: str, errors: list[str]) -> bool:
    if not isinstance(value, dict):
        errors.append(f"{label} must be an object")
        return False
    actual = set(value)
    missing = sorted(required - actual)
    unknown = sorted(actual - required)
    if missing:
        errors.append(f"{label} missing fields: {', '.join(missing)}")
    if unknown:
        errors.append(f"{label} unknown fields: {', '.join(unknown)}")
    return not missing and not unknown


def _nonempty(value: Any, label: str, errors: list[str]) -> bool:
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label} must be a non-empty string")
        return False
    return True


def _validate_manifest_shape(manifest: Any) -> list[str]:
    errors: list[str] = []
    top = {
        "schema_version", "request_id", "mode", "run_date", "domain", "target",
        "framework", "authority", "template_set", "protected_paths",
    }
    if not _require_exact_keys(manifest, top, "manifest", errors):
        return errors
    if manifest["schema_version"] != "mint.manifest.v0.1":
        errors.append("schema_version must be mint.manifest.v0.1")
    _nonempty(manifest["request_id"], "request_id", errors)
    if manifest["mode"] != "plan":
        errors.append("mode must be plan")
    if _nonempty(manifest["run_date"], "run_date", errors):
        try:
            parsed_date = dt.date.fromisoformat(manifest["run_date"])
            if parsed_date.isoformat() != manifest["run_date"]:
                raise ValueError
        except ValueError:
            errors.append("run_date must be an exact YYYY-MM-DD date")

    domain = manifest["domain"]
    if _require_exact_keys(domain, {"name", "slug", "objective", "governed_subject", "proposal_unit"}, "domain", errors):
        for field in ("name", "objective", "governed_subject", "proposal_unit"):
            _nonempty(domain[field], f"domain.{field}", errors)
        if not isinstance(domain["slug"], str) or not SLUG_RE.fullmatch(domain["slug"]):
            errors.append("domain.slug must be lowercase kebab-case")

    target = manifest["target"]
    if _require_exact_keys(target, {"path", "allowed_root", "visibility", "must_be_absent"}, "target", errors):
        _nonempty(target["path"], "target.path", errors)
        _nonempty(target["allowed_root"], "target.allowed_root", errors)
        if target["visibility"] != "private":
            errors.append("target.visibility must be private")
        if target["must_be_absent"] is not True:
            errors.append("target.must_be_absent must be true")

    framework = manifest["framework"]
    if _require_exact_keys(framework, {"source_path", "expected_sha256", "attach_mode"}, "framework", errors):
        _nonempty(framework["source_path"], "framework.source_path", errors)
        if not isinstance(framework["expected_sha256"], str) or not SHA256_RE.fullmatch(framework["expected_sha256"]):
            errors.append("framework.expected_sha256 must be a lowercase SHA-256")
        if framework["attach_mode"] != "submodule":
            errors.append("framework.attach_mode must be submodule in P0")

    template_set = manifest["template_set"]
    if _require_exact_keys(template_set, {"root", "expected_sha256"}, "template_set", errors):
        _nonempty(template_set["root"], "template_set.root", errors)
        if not isinstance(template_set["expected_sha256"], str) or not SHA256_RE.fullmatch(template_set["expected_sha256"]):
            errors.append("template_set.expected_sha256 must be a lowercase SHA-256")

    authority = manifest["authority"]
    if _require_exact_keys(authority, {"primary_source", "domain_kinds", "ratification_status"}, "authority", errors):
        primary = authority["primary_source"]
        if _require_exact_keys(primary, {"name", "uri", "owner_route"}, "authority.primary_source", errors):
            for field in ("name", "uri", "owner_route"):
                _nonempty(primary[field], f"authority.primary_source.{field}", errors)
        if authority["ratification_status"] != "pending":
            errors.append("authority.ratification_status must be pending in P0")
        kinds = authority["domain_kinds"]
        if not isinstance(kinds, list) or not kinds:
            errors.append("authority.domain_kinds must contain at least one domain-local kind")
        else:
            required_kind = {
                "id", "name", "counts_as", "owner_route", "blocked_use", "triage_receipt_ref",
                "triage_receipt_sha256", "triage_verdict",
            }
            for index, kind in enumerate(kinds):
                label = f"authority.domain_kinds[{index}]"
                if not _require_exact_keys(kind, required_kind, label, errors):
                    continue
                for field in ("name", "counts_as", "owner_route", "blocked_use", "triage_receipt_ref"):
                    _nonempty(kind[field], f"{label}.{field}", errors)
                if not isinstance(kind["id"], str) or not KIND_ID_RE.fullmatch(kind["id"]):
                    errors.append(f"{label}.id must be an uppercase stable identifier")
                if not isinstance(kind["triage_receipt_sha256"], str) or not SHA256_RE.fullmatch(kind["triage_receipt_sha256"]):
                    errors.append(f"{label}.triage_receipt_sha256 must be a lowercase SHA-256")
                if kind["triage_verdict"] != "new-authority (domain-local)":
                    errors.append(f"{label}.triage_verdict must be new-authority (domain-local)")
                if isinstance(primary, dict) and kind["owner_route"] == primary.get("owner_route"):
                    errors.append(f"{label}.owner_route must be separate from the primary-source owner route")

    protected = manifest["protected_paths"]
    if not isinstance(protected, list) or any(not isinstance(item, str) or not item for item in protected):
        errors.append("protected_paths must be an array of non-empty absolute paths")
    return errors


def _validate_relative_paths(paths: Iterable[str]) -> list[str]:
    errors: list[str] = []
    normalized: list[str] = []
    for raw in paths:
        path = PurePosixPath(raw)
        if path.is_absolute() or not raw or ".." in path.parts or "." in path.parts:
            errors.append(f"unsafe effect path: {raw}")
            continue
        value = path.as_posix()
        normalized.append(value)
    folded: dict[str, str] = {}
    for value in normalized:
        key = value.casefold()
        if key in folded:
            errors.append(f"duplicate or case-colliding effect paths: {folded[key]} and {value}")
        folded[key] = value
    for left in normalized:
        left_parts = PurePosixPath(left).parts
        for right in normalized:
            if left == right:
                continue
            right_parts = PurePosixPath(right).parts
            if len(left_parts) < len(right_parts) and right_parts[: len(left_parts)] == left_parts:
                errors.append(f"file/directory prefix collision: {left} and {right}")
    return sorted(set(errors))


def _validate_paths_and_sources(manifest: dict[str, Any]) -> tuple[list[str], dict[str, Any], str | None, list[dict[str, Any]]]:
    errors: list[str] = []
    target_raw = manifest["target"]["path"]
    allowed_raw = manifest["target"]["allowed_root"]
    source_raw = manifest["framework"]["source_path"]
    target = Path(target_raw)
    allowed = Path(allowed_raw)
    source = Path(source_raw)
    for label, raw, path in (("target.path", target_raw, target), ("target.allowed_root", allowed_raw, allowed), ("framework.source_path", source_raw, source)):
        if not path.is_absolute():
            errors.append(f"{label} must be absolute")
        if _contains_dotdot(raw):
            errors.append(f"{label} must not contain ..")
        if path.is_absolute() and _has_existing_symlink_component(path):
            errors.append(f"{label} contains an existing symlink component")
    if not allowed.is_dir():
        errors.append("target.allowed_root must be an existing directory")
    if allowed.is_absolute():
        allowed_resolved = allowed.resolve(strict=False)
        broad_roots = {Path("/"), Path.home().resolve(), WORKSPACE_ROOT.resolve()}
        if allowed_resolved in broad_roots:
            errors.append("target.allowed_root is too broad or is the workspace root")
    else:
        allowed_resolved = allowed
    target_resolved = target.resolve(strict=False) if target.is_absolute() else target
    source_resolved = source.resolve(strict=False) if source.is_absolute() else source
    if target.is_absolute() and allowed.is_absolute():
        if target_resolved.parent != allowed_resolved:
            errors.append("target.path must be a direct child of target.allowed_root")
        if target_resolved == allowed_resolved:
            errors.append("target.path must differ from target.allowed_root")
    if os.path.lexists(target):
        errors.append("target.path must be absent")
    if source.is_absolute() and not source.exists():
        errors.append("framework.source_path must exist")
    if target.is_absolute() and source.is_absolute() and (
        _is_relative_to(target_resolved, source_resolved) or _is_relative_to(source_resolved, target_resolved)
    ):
        errors.append("target.path and framework.source_path must be disjoint")
    if target.is_absolute() and _is_relative_to(target_resolved, WORKSPACE_ROOT.resolve()):
        errors.append("target.path must be outside the domainspec-core workspace")
    for raw in manifest["protected_paths"]:
        protected = Path(raw)
        if not protected.is_absolute() or _contains_dotdot(raw):
            errors.append(f"protected path must be absolute and normalized: {raw}")
            continue
        protected_resolved = protected.resolve(strict=False)
        if target.is_absolute() and (
            _is_relative_to(target_resolved, protected_resolved) or _is_relative_to(protected_resolved, target_resolved)
        ):
            errors.append(f"target.path overlaps protected path: {raw}")

    for index, kind in enumerate(manifest["authority"]["domain_kinds"]):
        receipt = Path(kind["triage_receipt_ref"])
        if not receipt.is_absolute() or _contains_dotdot(kind["triage_receipt_ref"]):
            errors.append(f"authority.domain_kinds[{index}].triage_receipt_ref must be absolute and normalized")
        elif receipt.is_symlink() or not receipt.is_file():
            errors.append(f"authority.domain_kinds[{index}] triage receipt must be a non-symlink regular file")
        elif sha256_file(receipt) != kind["triage_receipt_sha256"]:
            errors.append(f"authority.domain_kinds[{index}] triage receipt digest mismatch")

    framework_digest: str | None = None
    if source.exists() and not _has_existing_symlink_component(source):
        try:
            framework_digest = tree_sha256(source)
            if framework_digest != manifest["framework"]["expected_sha256"]:
                errors.append("framework source digest mismatch")
        except ValueError as exc:
            errors.append(str(exc))

    template_records: list[dict[str, Any]] = []
    template_root = Path(manifest["template_set"]["root"])
    if not template_root.is_absolute() or template_root.resolve(strict=False) != TEMPLATE_ROOT.resolve():
        errors.append("template_set.root must be the exact private Mint templates directory")
        template_digest = None
    else:
        try:
            template_digest, template_records = template_set_digest(template_root)
            if template_digest != manifest["template_set"]["expected_sha256"]:
                errors.append("template-set digest mismatch")
        except ValueError as exc:
            errors.append(str(exc))
            template_digest = None

    observation = {
        "allowed_root": allowed_raw,
        "exists": os.path.lexists(target),
        "path": target_raw,
        "visibility": manifest["target"]["visibility"],
    }
    return sorted(set(errors)), observation, template_digest, template_records


def _effect_paths(domain_slug: str, run_date: str) -> list[str]:
    values = [relative.format(domain_slug=domain_slug) for _, relative in STAGE_2_EFFECTS]
    values.extend(relative.format(run_date=run_date) for _, relative, _ in DEFERRED_EFFECTS)
    return values


def _build_effects(manifest: dict[str, Any], template_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_name = {record["path"]: record for record in template_records}
    target = manifest["target"]["path"]
    source = manifest["framework"]["source_path"]
    effects: list[dict[str, Any]] = [
        {
            "argv": ["domainspec-new-repo", target, "--source", source, "--attach", "submodule", "--mode", "plan"],
            "disposition": "planned",
            "operation": "external_action",
            "ordinal": 1,
            "owner": "domainspec-new-repo",
            "preconditions": ["operator separately admits the scaffolder plan", "P0 does not execute this argv"],
            "source_sha256": None,
            "source_template": None,
            "stage": "L0",
            "target_relative_path": None,
        }
    ]
    ordinal = 2
    for template, relative in STAGE_2_EFFECTS:
        record = by_name[template]
        effects.append(
            {
                "argv": None,
                "disposition": "planned",
                "operation": "create_file",
                "ordinal": ordinal,
                "owner": "mint",
                "preconditions": ["typed render IR admitted", "target remains absent", "apply runtime rechecks all digests"],
                "source_sha256": record["sha256"],
                "source_template": template,
                "stage": "stage-2",
                "target_relative_path": relative.format(domain_slug=manifest["domain"]["slug"]),
            }
        )
        ordinal += 1
    for stage, relative, template in DEFERRED_EFFECTS:
        record = by_name.get(template) if template else None
        effects.append(
            {
                "argv": None,
                "disposition": "deferred",
                "operation": "create_file",
                "ordinal": ordinal,
                "owner": "domain-authority-owner" if stage == "stage-3" else "mint",
                "preconditions": ["separate downstream admission", "owner gate satisfied"],
                "source_sha256": record["sha256"] if record else None,
                "source_template": template,
                "stage": stage,
                "target_relative_path": relative.format(run_date=manifest["run_date"]),
            }
        )
        ordinal += 1
    return effects


def _make_receipt(plan: dict[str, Any], checks: list[dict[str, str]]) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "blockers": plan["blockers"],
        "effects_applied": 0,
        "effects_planned": sum(1 for effect in plan["effects"] if effect["disposition"] == "planned"),
        "external_commands_executed": 0,
        "plan_id": plan["plan_id"],
        "proof_ceiling": "P0 admission/effect planning only; no render, apply, L0/L1, ratification, mint, or promotion proof",
        "receipt_id": "",
        "schema_version": "mint.receipt.v0.1",
        "status": plan["status"],
        "stdout_sha256": sha256_bytes(canonical_bytes(plan)),
        "validation_checks": checks,
        "writes_attempted": 0,
        "writes_performed": 0,
    }
    material = dict(receipt)
    material.pop("receipt_id")
    receipt["receipt_id"] = sha256_bytes(canonical_bytes(material))
    return receipt


def plan_manifest(manifest: Any) -> dict[str, Any]:
    manifest_digest = sha256_bytes(canonical_bytes(manifest))
    shape_errors = _validate_manifest_shape(manifest)
    checks: list[dict[str, str]] = [
        {"check": "strict-manifest-shape", "status": "pass" if not shape_errors else "block"}
    ]
    request_id = manifest.get("request_id", "unknown") if isinstance(manifest, dict) else "unknown"
    observation = {"allowed_root": None, "exists": None, "path": None, "visibility": None}
    template_digest: str | None = None
    template_records: list[dict[str, Any]] = []
    errors = list(shape_errors)
    if not shape_errors:
        path_errors, observation, template_digest, template_records = _validate_paths_and_sources(manifest)
        errors.extend(path_errors)
        checks.extend(
            [
                {"check": "path-and-target-admission", "status": "block" if any("target" in error or "protected" in error or "symlink component" in error for error in path_errors) else "pass"},
                {"check": "framework-source-binding", "status": "block" if any("framework" in error for error in path_errors) else "pass"},
                {"check": "authority-triage-binding", "status": "block" if any("triage" in error for error in path_errors) else "pass"},
                {"check": "template-set-binding", "status": "block" if any("template" in error for error in path_errors) else "pass"},
            ]
        )
        relative_errors = _validate_relative_paths(_effect_paths(manifest["domain"]["slug"], manifest["run_date"]))
        errors.extend(relative_errors)
        checks.append({"check": "effect-path-collision", "status": "block" if relative_errors else "pass"})
    blockers = sorted(set(errors))
    effects = _build_effects(manifest, template_records) if not blockers else []
    status = "ready" if not blockers else "blocked"
    plan_identity = {
        "manifest": manifest,
        "planner_version": PLANNER_VERSION,
        "template_records": template_records,
    }
    plan: dict[str, Any] = {
        "blockers": blockers,
        "effects": effects,
        "gates": [
            {"gate": "render-ir", "status": "deferred"},
            {"gate": "apply-and-recovery", "status": "deferred"},
            {"gate": "domain-ratification", "status": "deferred"},
            {"gate": "public-attached-mint", "status": "blocked"},
        ],
        "manifest_sha256": manifest_digest,
        "plan_id": sha256_bytes(canonical_bytes(plan_identity)),
        "request_id": request_id,
        "schema_version": "mint.plan.v0.1",
        "stages": [
            {"owner": "domainspec-new-repo", "stage": "L0", "status": "unexecuted"},
            {"owner": "mint", "stage": "stage-2", "status": "planned" if status == "ready" else "blocked"},
            {"owner": "domain-authority-owner", "stage": "stage-3", "status": "deferred"},
            {"owner": "mint", "stage": "stage-4", "status": "deferred"},
            {"owner": "adopt-back-owner", "stage": "stage-5", "status": "deferred"},
        ],
        "status": status,
        "target_observation": observation,
        "template_set_sha256": template_digest,
    }
    receipt = _make_receipt(plan, checks)
    return {"plan": plan, "receipt": receipt, "schema_version": "mint.output.v0.1"}


def load_and_plan(path: Path) -> dict[str, Any]:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        manifest = {"load_error": f"{type(exc).__name__}: {exc}"}
    return plan_manifest(manifest)


def load_json_document(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return {"load_error": f"{type(exc).__name__}: {exc}"}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    plan_parser = subparsers.add_parser("plan", help="emit a canonical no-write plan and receipt")
    plan_parser.add_argument("--manifest", required=True, type=Path)
    render_parser = subparsers.add_parser("render", help="emit a canonical no-write Stage-2 render package")
    render_parser.add_argument("--manifest", required=True, type=Path)
    render_parser.add_argument("--plan", required=True, type=Path)
    render_parser.add_argument("--bindings", required=True, type=Path)
    pilot_parser = subparsers.add_parser("pilot-check", help="validate one pilot contract without writes or external effects")
    pilot_parser.add_argument("--contract", required=True, type=Path)
    package_parser = subparsers.add_parser(
        "package-check",
        help="validate one typed authority package without writes or external effects",
    )
    package_parser.add_argument("--input", required=True, type=Path)
    package_render_parser = subparsers.add_parser(
        "package-render",
        help="compile one valid typed authority package into 18 in-memory Markdown views",
    )
    package_render_parser.add_argument("--input", required=True, type=Path)
    transition_parser = subparsers.add_parser(
        "transition-check",
        help="admit an owner-evidenced transition without consuming or applying it",
    )
    transition_parser.add_argument("--request", required=True, type=Path)
    cedar_parser = subparsers.add_parser(
        "package-cedar",
        help="project method-to-kind relations into a strict internal Cedar subset",
    )
    cedar_parser.add_argument("--input", required=True, type=Path)
    fol_parser = subparsers.add_parser(
        "package-fol",
        help="project rule and method relations into a strict internal TPTP FOF subset",
    )
    fol_parser.add_argument("--input", required=True, type=Path)
    remint_parser = subparsers.add_parser(
        "marketplace-remint",
        help="materialize one validated multi-view Marketplace package in the fixed disposable evidence root",
    )
    remint_parser.add_argument("--request", required=True, type=Path)
    for command, help_text in (
        ("apply", "materialize exactly the 18 rendered Stage-2 files with a create-only journal"),
        ("recover", "recover one interrupted apply attempt from its append-only journal"),
    ):
        action_parser = subparsers.add_parser(command, help=help_text)
        action_parser.add_argument("--manifest", required=True, type=Path)
        action_parser.add_argument("--plan", required=True, type=Path)
        action_parser.add_argument("--bindings", required=True, type=Path)
        action_parser.add_argument("--render", required=True, type=Path)
        action_parser.add_argument("--request", required=True, type=Path)
    subparsers.add_parser("template-set-digest", help="print the current allowlisted template-set digest")
    args = parser.parse_args(argv)
    if args.command == "template-set-digest":
        digest, _ = template_set_digest()
        sys.stdout.write(digest + "\n")
        return 0
    if args.command == "package-check":
        from authority_package import load_and_validate

        receipt = load_and_validate(args.input)
        sys.stdout.buffer.write(canonical_bytes(receipt))
        return 0 if receipt["status"] == "valid" else 2
    if args.command == "package-render":
        from authority_compiler import load_and_compile

        output = load_and_compile(args.input, sys.modules[__name__])
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["receipt"]["status"] == "ready" else 2
    if args.command == "transition-check":
        from authority_lifecycle import load_and_validate

        receipt = load_and_validate(args.request)
        sys.stdout.buffer.write(canonical_bytes(receipt))
        return 0 if receipt["status"] == "transition-ready" else 2
    if args.command == "package-cedar":
        from cedar_projection import load_and_compile

        output = load_and_compile(args.input)
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["receipt"]["status"] in ("ready", "partial") else 2
    if args.command == "package-fol":
        from fol_projection import load_and_compile

        output = load_and_compile(args.input)
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["receipt"]["status"] == "ready" else 2
    if args.command == "marketplace-remint":
        from marketplace_remint import load_and_remint

        receipt = load_and_remint(args.request, sys.modules[__name__])
        sys.stdout.buffer.write(canonical_bytes(receipt))
        return 0 if receipt["status"] == "reminted" else 2
    if args.command == "pilot-check":
        from pilot_runtime import pilot_output

        output = pilot_output(load_json_document(args.contract), sys.modules[__name__])
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["receipt"]["status"] == "admission-ready" else 2
    if args.command == "render":
        from render_runtime import render_output

        output = render_output(
            load_json_document(args.manifest),
            load_json_document(args.plan),
            load_json_document(args.bindings),
            sys.modules[__name__],
        )
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["package"]["status"] == "ready" else 2
    if args.command in ("apply", "recover"):
        import render_runtime
        from apply_runtime import apply_output, recover_output

        action = apply_output if args.command == "apply" else recover_output
        output = action(
            load_json_document(args.manifest),
            load_json_document(args.plan),
            load_json_document(args.bindings),
            load_json_document(args.render),
            load_json_document(args.request),
            sys.modules[__name__],
            render_runtime,
        )
        sys.stdout.buffer.write(canonical_bytes(output))
        return 0 if output["receipt"]["status"] in ("applied", "recovered") else 2
    output = load_and_plan(args.manifest)
    sys.stdout.buffer.write(canonical_bytes(output))
    return 0 if output["plan"]["status"] == "ready" else 2


if __name__ == "__main__":
    raise SystemExit(main())
