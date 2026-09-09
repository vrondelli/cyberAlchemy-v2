#!/usr/bin/env python3
"""Create one disposable Marketplace multi-view target after complete in-memory validation."""

from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
from typing import Any

from jsonschema import Draft202012Validator

import authority_compiler
import authority_package
import cedar_projection
import fol_projection


RUNTIME_VERSION = "mint.runtime.marketplace-remint.v0.1"
PROOF_CEILING = (
    "candidate-local disposable Marketplace multi-view remint only; no Zagr mint, "
    "authority promotion, official Cedar evaluation, theorem proving, publication, "
    "release, deployment, or production proof"
)
RUNTIME_DIR = Path(__file__).resolve().parent
MINT_DIR = RUNTIME_DIR.parent
WORKSPACE_ROOT = MINT_DIR.parents[2]
EVIDENCE_ROOT = (
    MINT_DIR
    / "development/refinement-runs/20260807T164509Z-executable-remaining-authority-package-frontier"
    / "execution-evidence/SWU-MINT-AUTHORITY-PACKAGE-MARKETPLACE-06"
)
ZAGR_PATH = WORKSPACE_ROOT / "projects/zagr"
ZERO_SHA256 = "0" * 64
REQUEST_CONTRACT = RUNTIME_DIR / "contracts" / "marketplace-remint-request.v0.1.schema.json"
VIEW_CONTRACTS = (
    ("semantic", "receipt", RUNTIME_DIR / "contracts" / "authority-package-validation-receipt.v0.1.schema.json"),
    ("markdown", "package", RUNTIME_DIR / "contracts" / "authority-markdown-package.v0.1.schema.json"),
    ("markdown", "receipt", RUNTIME_DIR / "contracts" / "authority-markdown-receipt.v0.1.schema.json"),
    ("cedar", "projection", RUNTIME_DIR / "contracts" / "authority-cedar-projection.v0.1.schema.json"),
    ("cedar", "receipt", RUNTIME_DIR / "contracts" / "authority-cedar-receipt.v0.1.schema.json"),
    ("fol", "projection", RUNTIME_DIR / "contracts" / "authority-fol-projection.v0.1.schema.json"),
    ("fol", "receipt", RUNTIME_DIR / "contracts" / "authority-fol-receipt.v0.1.schema.json"),
)


def _schema_valid(document: Any, contract: Path) -> bool:
    schema = json.loads(contract.read_text(encoding="utf-8"))
    Draft202012Validator.check_schema(schema)
    return not list(Draft202012Validator(schema).iter_errors(document))


def _has_symlink_component(path: Path) -> bool:
    current = Path(path.anchor)
    for part in path.parts[1:]:
        current = current / part
        if os.path.lexists(current) and current.is_symlink():
            return True
    return False


def _safe_relative(path: str) -> bool:
    value = PurePosixPath(path)
    return bool(path) and not value.is_absolute() and ".." not in value.parts and "." not in value.parts


def _read_package(reference: dict[str, str], blockers: list[str]) -> Any | None:
    path = Path(reference["path"])
    if not path.is_absolute():
        path = Path.cwd() / path
    if path.is_symlink() or not path.is_file():
        blockers.append("REMINT_PACKAGE_MISSING")
        return None
    try:
        payload = path.read_bytes()
    except OSError:
        blockers.append("REMINT_PACKAGE_UNREADABLE")
        return None
    if authority_package.sha256_bytes(payload) != reference["sha256"]:
        blockers.append("REMINT_PACKAGE_DIGEST_MISMATCH")
        return None
    try:
        return json.loads(payload)
    except (UnicodeError, json.JSONDecodeError):
        blockers.append("REMINT_PACKAGE_INVALID_JSON")
        return None


def _view_receipts(outputs: dict[str, Any]) -> list[dict[str, str]]:
    semantic = outputs["semantic"]
    return [
        {"view": "semantic", "receipt_id": semantic["receipt_id"], "package_sha256": semantic["package_sha256"], "status": semantic["status"]},
        {"view": "markdown", "receipt_id": outputs["markdown"]["receipt"]["receipt_id"], "package_sha256": outputs["markdown"]["receipt"]["package_sha256"], "status": outputs["markdown"]["receipt"]["status"]},
        {"view": "cedar", "receipt_id": outputs["cedar"]["receipt"]["receipt_id"], "package_sha256": outputs["cedar"]["receipt"]["package_sha256"], "status": outputs["cedar"]["receipt"]["status"]},
        {"view": "fol", "receipt_id": outputs["fol"]["receipt"]["receipt_id"], "package_sha256": outputs["fol"]["receipt"]["package_sha256"], "status": outputs["fol"]["receipt"]["status"]},
    ]


def _materialized_files(outputs: dict[str, Any]) -> dict[str, bytes]:
    files = {
        item["path"]: item["content"].encode("utf-8")
        for item in outputs["markdown"]["package"]["files"]
    }
    policies = outputs["cedar"]["projection"]["policies"]
    files["authority/projections/cedar/policies.cedar"] = (
        "\n".join(item["policy"] for item in policies) + "\n"
    ).encode("utf-8")
    files["authority/projections/fol/structural-constitution.p"] = outputs["fol"]["projection"]["program"].encode("utf-8")
    receipt_files = {
        "receipts/semantic-validation.json": outputs["semantic"],
        "receipts/markdown-projection.json": outputs["markdown"]["receipt"],
        "receipts/cedar-projection.json": outputs["cedar"]["receipt"],
        "receipts/fol-projection.json": outputs["fol"]["receipt"],
    }
    files.update(
        {path: authority_package.canonical_bytes(receipt) for path, receipt in receipt_files.items()}
    )
    return files


def _inventory(files: dict[str, bytes]) -> list[dict[str, Any]]:
    return [
        {"path": path, "sha256": authority_package.sha256_bytes(files[path]), "size_bytes": len(files[path])}
        for path in sorted(files)
    ]


def _write_exclusive(target: Path, files: dict[str, bytes]) -> tuple[int, list[str]]:
    written = 0
    blockers: list[str] = []
    try:
        target.mkdir(mode=0o700, parents=False, exist_ok=False)
        for relative in sorted(files):
            destination = target / relative
            destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            try:
                with os.fdopen(descriptor, "wb", closefd=True) as handle:
                    handle.write(files[relative])
                    handle.flush()
                    os.fsync(handle.fileno())
            except Exception:
                try:
                    os.close(descriptor)
                except OSError:
                    pass
                raise
            written += 1
    except (OSError, ValueError):
        blockers.append("REMINT_TARGET_WRITE_FAILED")
    return written, blockers


def remint(
    request: Any,
    mint_module: Any,
    *,
    evidence_root: Path = EVIDENCE_ROOT,
    zagr_path: Path = ZAGR_PATH,
) -> dict[str, Any]:
    runtime_sha256 = authority_package.sha256_file(Path(__file__).resolve())
    blockers: list[str] = []
    if not _schema_valid(request, REQUEST_CONTRACT):
        blockers.append("REMINT_REQUEST_SCHEMA_INVALID")
    package: Any = None
    outputs: dict[str, Any] = {}
    package_id: str | None = None
    package_sha256 = ZERO_SHA256
    semantic_sha256 = ZERO_SHA256
    package_maturity: str | None = None
    target: Path | None = None
    zagr_before = ZERO_SHA256
    zagr_after = ZERO_SHA256
    files: dict[str, bytes] = {}
    view_receipts: list[dict[str, str]] = []
    written = 0

    if not blockers:
        target = Path(request["target"]["path"])
        requested_root = Path(request["target"]["allowed_root"])
        try:
            exact_root = evidence_root.resolve(strict=True)
            exact_zagr = zagr_path.resolve(strict=True)
        except (OSError, RuntimeError):
            blockers.append("REMINT_SCOPE_ROOT_MISSING")
        else:
            if (
                requested_root != evidence_root
                or requested_root.resolve(strict=True) != exact_root
                or _has_symlink_component(requested_root)
            ):
                blockers.append("REMINT_ALLOWED_ROOT_INVALID")
            try:
                target_parent = target.parent.resolve(strict=True)
            except (OSError, RuntimeError):
                target_parent = None
            if (
                not target.is_absolute()
                or target_parent != exact_root
                or target.name in ("", ".", "..")
                or _has_symlink_component(target.parent)
            ):
                blockers.append("REMINT_TARGET_SCOPE_INVALID")
            if os.path.lexists(target):
                blockers.append("REMINT_TARGET_EXISTS")
            if Path(request["zagr_ref"]["path"]) != zagr_path or _has_symlink_component(zagr_path):
                blockers.append("REMINT_ZAGR_SCOPE_INVALID")
            else:
                try:
                    zagr_before = mint_module.tree_sha256(exact_zagr)
                except (OSError, ValueError):
                    blockers.append("REMINT_ZAGR_UNREADABLE")
                if zagr_before != request["zagr_ref"]["expected_tree_sha256"]:
                    blockers.append("REMINT_ZAGR_DIGEST_MISMATCH")

    if not blockers:
        package = _read_package(request["package_ref"], blockers)
    if package is not None:
        outputs["semantic"] = authority_package.validate_authority_package(package)
        package_id = outputs["semantic"]["package_id"]
        package_sha256 = outputs["semantic"]["package_sha256"]
        semantic_sha256 = outputs["semantic"]["semantic_sha256"]
        package_maturity = package.get("package_maturity") if isinstance(package, dict) else None
        if outputs["semantic"]["status"] != "valid":
            blockers.append("REMINT_PACKAGE_INVALID")
        if package_maturity != "candidate":
            blockers.append("REMINT_PACKAGE_NOT_CANDIDATE")

    if package is not None and not blockers:
        outputs["markdown"] = authority_compiler.compile_markdown(package, mint_module)
        outputs["cedar"] = cedar_projection.compile_cedar(package)
        outputs["fol"] = fol_projection.compile_fol(package)
        if outputs["markdown"]["receipt"]["status"] != "ready":
            blockers.append("REMINT_MARKDOWN_NOT_READY")
        if outputs["cedar"]["receipt"]["status"] != "ready":
            blockers.append("REMINT_CEDAR_NOT_READY")
        if outputs["fol"]["receipt"]["status"] != "ready":
            blockers.append("REMINT_FOL_NOT_READY")
        documents = {
            ("semantic", "receipt"): outputs["semantic"],
            ("markdown", "package"): outputs["markdown"]["package"],
            ("markdown", "receipt"): outputs["markdown"]["receipt"],
            ("cedar", "projection"): outputs["cedar"]["projection"],
            ("cedar", "receipt"): outputs["cedar"]["receipt"],
            ("fol", "projection"): outputs["fol"]["projection"],
            ("fol", "receipt"): outputs["fol"]["receipt"],
        }
        if any(not _schema_valid(documents[(view, kind)], contract) for view, kind, contract in VIEW_CONTRACTS):
            blockers.append("REMINT_VIEW_SCHEMA_INVALID")
        view_receipts = _view_receipts(outputs)
        if any(item["package_sha256"] != package_sha256 for item in view_receipts):
            blockers.append("REMINT_VIEW_DIGEST_MISMATCH")

    if not blockers:
        files = _materialized_files(outputs)
        if len(files) != 24 or len(set(files)) != 24 or any(not _safe_relative(path) for path in files):
            blockers.append("REMINT_FILE_INVENTORY_INVALID")
        if any(len(payload) == 0 for payload in files.values()):
            blockers.append("REMINT_EMPTY_OUTPUT")

    if not blockers and target is not None:
        written, write_blockers = _write_exclusive(target, files)
        blockers.extend(write_blockers)
        if not blockers:
            observed: dict[str, bytes] = {}
            for path in sorted(target.rglob("*")):
                if path.is_file() and not path.is_symlink():
                    observed[path.relative_to(target).as_posix()] = path.read_bytes()
                elif path.is_symlink():
                    blockers.append("REMINT_TARGET_INVENTORY_MISMATCH")
            if _inventory(observed) != _inventory(files):
                blockers.append("REMINT_TARGET_INVENTORY_MISMATCH")
        try:
            zagr_after = mint_module.tree_sha256(zagr_path.resolve(strict=True))
        except (OSError, ValueError):
            blockers.append("REMINT_ZAGR_UNREADABLE")
        if zagr_after != zagr_before:
            blockers.append("REMINT_ZAGR_CHANGED")

    blockers = sorted(set(blockers))
    status = "blocked" if blockers else "reminted"
    if status == "blocked" and written == 0:
        files = {}
        view_receipts = [] if package is None else view_receipts
    file_inventory = _inventory(files) if files else []
    identity = {
        "runtime_version": RUNTIME_VERSION,
        "runtime_sha256": runtime_sha256,
        "request_id": request.get("request_id") if isinstance(request, dict) else None,
        "status": status,
        "package_id": package_id,
        "package_sha256": package_sha256,
        "semantic_sha256": semantic_sha256,
        "package_maturity": package_maturity,
        "target_path": str(target) if target is not None else None,
        "view_receipts": view_receipts,
        "file_inventory": file_inventory,
        "blockers": blockers,
        "zagr_before_sha256": zagr_before,
        "zagr_after_sha256": zagr_after,
        "writes_performed": written,
        "authority_effect": "none",
    }
    return {
        "schema_version": "mint.marketplace-remint-receipt.v0.1",
        "receipt_id": authority_package.sha256_bytes(authority_package.canonical_bytes(identity)),
        "runtime_version": RUNTIME_VERSION,
        "runtime_sha256": runtime_sha256,
        "request_id": identity["request_id"],
        "status": status,
        "package_id": package_id,
        "package_sha256": package_sha256,
        "semantic_sha256": semantic_sha256,
        "package_maturity": package_maturity,
        "target_path": identity["target_path"],
        "view_receipts": view_receipts,
        "file_inventory": file_inventory,
        "blockers": blockers,
        "zagr_before_sha256": zagr_before,
        "zagr_after_sha256": zagr_after,
        "zagr_unchanged": zagr_before == zagr_after and zagr_before != ZERO_SHA256,
        "writes_performed": written,
        "external_commands_executed": 0,
        "network_calls": 0,
        "git_operations": 0,
        "authority_effect": "none",
        "proof_ceiling": PROOF_CEILING,
    }


def load_and_remint(
    path: Path,
    mint_module: Any,
    *,
    evidence_root: Path = EVIDENCE_ROOT,
    zagr_path: Path = ZAGR_PATH,
) -> dict[str, Any]:
    try:
        request = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        request = {"load_error": f"{type(exc).__name__}: {exc}"}
    return remint(request, mint_module, evidence_root=evidence_root, zagr_path=zagr_path)
