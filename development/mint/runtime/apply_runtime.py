#!/usr/bin/env python3
"""Create-only Mint Stage-2 apply engine with append-only journal and exact recovery."""

from __future__ import annotations

import base64
import errno
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath
from typing import Any


RUNTIME_DIR = Path(__file__).resolve().parent
ATTEMPT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
DIGEST_RE = re.compile(r"^[a-f0-9]{64}$")


class InjectedFault(RuntimeError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def digest_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _overlap(left: Path, right: Path) -> bool:
    return _is_relative_to(left, right) or _is_relative_to(right, left)


def _validate_request(request: Any, manifest: dict[str, Any], planner: Any) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version", "attempt_id", "plan_id", "render_id", "target_path", "allowed_root",
        "journal_root", "auto_recover", "fault_after_ordinal",
    }
    if not _exact(request, required, "apply_request", errors):
        return errors
    if request["schema_version"] != "mint.apply-request.v0.1":
        errors.append("apply_request.schema_version must be mint.apply-request.v0.1")
    if not isinstance(request["attempt_id"], str) or not ATTEMPT_RE.fullmatch(request["attempt_id"]):
        errors.append("apply_request.attempt_id must be a safe 1-64 character identifier")
    for field in ("plan_id", "render_id"):
        if not isinstance(request[field], str) or not DIGEST_RE.fullmatch(request[field]):
            errors.append(f"apply_request.{field} must be a lowercase SHA-256")
    if not isinstance(request["auto_recover"], bool):
        errors.append("apply_request.auto_recover must be boolean")
    fault = request["fault_after_ordinal"]
    if fault is not None and (not isinstance(fault, int) or isinstance(fault, bool) or fault < 2 or fault > 19):
        errors.append("apply_request.fault_after_ordinal must be null or an integer from 2 through 19")
    if request["target_path"] != manifest.get("target", {}).get("path"):
        errors.append("apply_request.target_path must equal manifest target.path")
    if request["allowed_root"] != manifest.get("target", {}).get("allowed_root"):
        errors.append("apply_request.allowed_root must equal manifest target.allowed_root")
    journal_raw = request["journal_root"]
    if not isinstance(journal_raw, str) or not journal_raw:
        errors.append("apply_request.journal_root must be a non-empty absolute path")
        return sorted(set(errors))
    journal = Path(journal_raw)
    if not journal.is_absolute() or ".." in journal.parts:
        errors.append("apply_request.journal_root must be absolute and normalized")
        return sorted(set(errors))
    if planner._has_existing_symlink_component(journal):
        errors.append("apply_request.journal_root contains an existing symlink component")
    if journal.is_symlink() or not journal.is_dir():
        errors.append("apply_request.journal_root must be an existing non-symlink directory")
    journal_resolved = journal.resolve(strict=False)
    broad = {Path("/"), Path.home().resolve(), planner.WORKSPACE_ROOT.resolve()}
    if journal_resolved in broad:
        errors.append("apply_request.journal_root is too broad or is the workspace root")
    protected = [Path(manifest["target"]["path"]), Path(manifest["target"]["allowed_root"]), Path(manifest["framework"]["source_path"]), planner.TEMPLATE_ROOT, planner.WORKSPACE_ROOT]
    protected.extend(Path(item) for item in manifest.get("protected_paths", []))
    for path in protected:
        if path.is_absolute() and _overlap(journal_resolved, path.resolve(strict=False)):
            errors.append(f"apply_request.journal_root overlaps protected path: {path}")
    return sorted(set(errors))


def _decode_files(render_package: dict[str, Any], planner: Any) -> tuple[list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    decoded: list[dict[str, Any]] = []
    files = render_package.get("files")
    if not isinstance(files, list) or len(files) != 18:
        return [], ["render package must contain exactly 18 files"]
    paths: list[str] = []
    for index, item in enumerate(files):
        label = f"render package file[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{label} must be an object")
            continue
        try:
            payload = base64.b64decode(item["content_b64"], validate=True)
        except (KeyError, ValueError, TypeError) as exc:
            errors.append(f"{label} base64 invalid: {exc}")
            continue
        if item.get("encoding") != "base64":
            errors.append(f"{label} encoding must be base64")
        if item.get("size_bytes") != len(payload) or item.get("sha256") != digest_bytes(payload):
            errors.append(f"{label} byte size or digest mismatch")
        path = item.get("path")
        if not isinstance(path, str):
            errors.append(f"{label} path must be a string")
            continue
        paths.append(path)
        decoded.append({"effect_ordinal": item.get("effect_ordinal"), "path": path, "payload": payload, "sha256": item.get("sha256"), "size_bytes": item.get("size_bytes")})
    errors.extend(planner._validate_relative_paths(paths))
    ordinals = [item["effect_ordinal"] for item in decoded]
    if ordinals != list(range(2, 20)):
        errors.append("render package effect ordinals must be exactly 2 through 19")
    return decoded, sorted(set(errors))


def _static_render_id(render_input: Any, package: dict[str, Any], renderer: Any) -> str:
    identity = {
        "blockers": package.get("blockers", []),
        "files": [
            {
                "effect_ordinal": item["effect_ordinal"],
                "path": item["path"],
                "sha256": item["sha256"],
                "size_bytes": item["size_bytes"],
                "source_sha256": item["source_sha256"],
            }
            for item in package.get("files", [])
        ],
        "ir_sha256": package.get("ir_sha256"),
        "manifest_sha256": package.get("manifest_sha256"),
        "plan_id": package.get("plan_id"),
        "render_input": render_input,
        "renderer_sha256": package.get("renderer_sha256"),
        "template_set_sha256": package.get("template_set_sha256"),
        "version": renderer.RENDER_VERSION,
    }
    return digest_bytes(canonical_bytes(identity))


def _validate_static_bindings(manifest: dict[str, Any], supplied_p0: Any, render_input: Any, supplied_render: Any, request: Any, planner: Any, renderer: Any, require_absent_target: bool) -> tuple[list[dict[str, Any]], list[str]]:
    errors = _validate_request(request, manifest, planner)
    if require_absent_target:
        expected_p0 = planner.plan_manifest(manifest)
        if supplied_p0 != expected_p0:
            errors.append("P0 output does not match a fresh pre-apply recomputation")
    if not isinstance(supplied_p0, dict) or supplied_p0.get("plan", {}).get("status") != "ready" or supplied_p0.get("receipt", {}).get("status") != "ready":
        errors.append("supplied P0 plan and receipt must be ready")
        return [], sorted(set(errors))
    plan = supplied_p0["plan"]
    if plan.get("manifest_sha256") != planner.sha256_bytes(planner.canonical_bytes(manifest)):
        errors.append("manifest digest does not match P0 plan")
    if request.get("plan_id") != plan.get("plan_id"):
        errors.append("apply request plan_id mismatch")
    try:
        current_template_digest, template_records = planner.template_set_digest()
    except ValueError as exc:
        errors.append(str(exc))
        current_template_digest, template_records = None, []
    expected_plan_id = planner.sha256_bytes(
        planner.canonical_bytes(
            {"manifest": manifest, "planner_version": planner.PLANNER_VERSION, "template_records": template_records}
        )
    )
    if plan.get("plan_id") != expected_plan_id:
        errors.append("P0 plan_id does not match current manifest and template records")
    if plan.get("template_set_sha256") != current_template_digest:
        errors.append("P0 template-set digest mismatch")
    if template_records and plan.get("effects") != planner._build_effects(manifest, template_records):
        errors.append("P0 effect inventory mismatch")
    p0_receipt = supplied_p0.get("receipt", {})
    if p0_receipt.get("plan_id") != plan.get("plan_id") or p0_receipt.get("stdout_sha256") != planner.sha256_bytes(planner.canonical_bytes(plan)):
        errors.append("P0 receipt does not bind the supplied plan")
    if isinstance(p0_receipt, dict) and "receipt_id" in p0_receipt:
        receipt_material = dict(p0_receipt)
        observed_receipt_id = receipt_material.pop("receipt_id")
        if observed_receipt_id != planner.sha256_bytes(planner.canonical_bytes(receipt_material)):
            errors.append("P0 receipt_id mismatch")
    render_shape_errors = renderer._validate_render_input(render_input, manifest)
    errors.extend(render_shape_errors)
    if not isinstance(supplied_render, dict) or set(supplied_render) != {"schema_version", "package", "receipt"}:
        errors.append("render output must be the exact package/receipt envelope")
        return [], sorted(set(errors))
    package = supplied_render["package"]
    receipt = supplied_render["receipt"]
    if package.get("status") != "ready" or receipt.get("status") != "ready":
        errors.append("render package and receipt must be ready")
    if request.get("render_id") != package.get("render_id") or receipt.get("render_id") != package.get("render_id"):
        errors.append("apply request or receipt render_id mismatch")
    if package.get("plan_id") != plan.get("plan_id") or package.get("manifest_sha256") != plan.get("manifest_sha256") or package.get("template_set_sha256") != plan.get("template_set_sha256"):
        errors.append("render package P0 bindings mismatch")
    if package.get("render_input_sha256") != digest_bytes(canonical_bytes(render_input)):
        errors.append("render input digest mismatch")
    current_renderer_digest = digest_file(Path(renderer.__file__))
    if package.get("renderer_sha256") != current_renderer_digest:
        errors.append("renderer digest mismatch")
    try:
        current_ir_digest = digest_file(renderer.IR_PATH)
    except OSError as exc:
        errors.append(f"render IR unavailable: {exc}")
        current_ir_digest = None
    if package.get("ir_sha256") != current_ir_digest:
        errors.append("render IR digest mismatch")
    if package.get("template_set_sha256") != current_template_digest:
        errors.append("template-set digest mismatch before apply/recovery")
    if package.get("render_id") != _static_render_id(render_input, package, renderer):
        errors.append("render_id does not bind the supplied files and inputs")
    if receipt.get("stdout_sha256") != digest_bytes(renderer.canonical_bytes(package)):
        errors.append("render receipt does not bind the supplied package")
    if isinstance(receipt, dict) and "receipt_id" in receipt:
        render_receipt_material = dict(receipt)
        observed_render_receipt_id = render_receipt_material.pop("receipt_id")
        if observed_render_receipt_id != digest_bytes(renderer.canonical_bytes(render_receipt_material)):
            errors.append("render receipt_id mismatch")
    decoded, file_errors = _decode_files(package, planner)
    errors.extend(file_errors)
    stage2 = [effect for effect in plan.get("effects", []) if effect.get("stage") == "stage-2" and effect.get("disposition") == "planned" and effect.get("operation") == "create_file"]
    by_ordinal = {effect["ordinal"]: effect for effect in stage2}
    for item, encoded in zip(decoded, package.get("files", [])):
        effect = by_ordinal.get(item["effect_ordinal"])
        if effect is None or effect.get("target_relative_path") != item["path"] or effect.get("source_sha256") != encoded.get("source_sha256"):
            errors.append(f"render file does not match P0 effect ordinal {item['effect_ordinal']}")
        for key in ("plan_id", "manifest_sha256", "template_set_sha256"):
            if encoded.get(key) != package.get(key):
                errors.append(f"render file {item['effect_ordinal']} {key} mismatch")
        if encoded.get("render_version") != renderer.RENDER_VERSION:
            errors.append(f"render file {item['effect_ordinal']} render version mismatch")
    return decoded, sorted(set(errors))


class JournalWriter:
    def __init__(self, root: Path, attempt_id: str, create: bool):
        self.root = root
        self.path = root / f"{attempt_id}.journal.jsonl"
        root_flags = os.O_RDONLY | os.O_DIRECTORY
        if hasattr(os, "O_NOFOLLOW"):
            root_flags |= os.O_NOFOLLOW
        self.root_fd = os.open(root, root_flags)
        flags = os.O_WRONLY | os.O_APPEND
        if create:
            flags |= os.O_CREAT | os.O_EXCL
        if hasattr(os, "O_NOFOLLOW"):
            flags |= os.O_NOFOLLOW
        self.fd = os.open(self.path.name, flags, 0o600, dir_fd=self.root_fd)
        self.sequence = 0
        if not create:
            records = read_journal(self.path)
            self.sequence = max((record["sequence"] for record in records), default=0)

    def append(self, event: str, request: dict[str, Any], path: str | None = None, sha256: str | None = None, size_bytes: int | None = None, detail: str = "") -> None:
        self.sequence += 1
        record = {
            "attempt_id": request["attempt_id"],
            "detail": detail,
            "event": event,
            "path": path,
            "plan_id": request["plan_id"],
            "render_id": request["render_id"],
            "schema_version": "mint.journal-record.v0.1",
            "sequence": self.sequence,
            "sha256": sha256,
            "size_bytes": size_bytes,
            "target_path": request["target_path"],
        }
        payload = canonical_bytes(record)
        view = memoryview(payload)
        while view:
            written = os.write(self.fd, view)
            view = view[written:]
        os.fsync(self.fd)

    def close(self) -> None:
        if getattr(self, "fd", None) is not None:
            os.close(self.fd)
            self.fd = None
        if getattr(self, "root_fd", None) is not None:
            os.fsync(self.root_fd)
            os.close(self.root_fd)
            self.root_fd = None


def read_journal(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.endswith("\n"):
                raise ValueError(f"journal line {line_number} is not newline terminated")
            record = json.loads(line)
            if not isinstance(record, dict):
                raise ValueError(f"journal line {line_number} is not an object")
            records.append(record)
    if [record.get("sequence") for record in records] != list(range(1, len(records) + 1)):
        raise ValueError("journal sequence is not contiguous")
    return records


def _open_dir_at(root_fd: int, parts: tuple[str, ...]) -> int:
    current = os.dup(root_fd)
    flags = os.O_RDONLY | os.O_DIRECTORY
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    try:
        for part in parts:
            next_fd = os.open(part, flags, dir_fd=current)
            os.close(current)
            current = next_fd
        return current
    except Exception:
        os.close(current)
        raise


def _target_directories(files: list[dict[str, Any]]) -> list[PurePosixPath]:
    directories: set[PurePosixPath] = set()
    for item in files:
        parent = PurePosixPath(item["path"]).parent
        while parent != PurePosixPath("."):
            directories.add(parent)
            parent = parent.parent
    return sorted(directories, key=lambda value: (len(value.parts), value.as_posix()))


def _validate_journal_records(
    records: list[dict[str, Any]],
    request: dict[str, Any],
    admitted_files: list[dict[str, Any]],
    planner: Any,
) -> list[str]:
    errors: list[str] = []
    required = {
        "schema_version", "sequence", "attempt_id", "plan_id", "render_id",
        "target_path", "event", "path", "sha256", "size_bytes", "detail",
    }
    events = {
        "begin", "dir-intent", "dir-created", "file-intent", "file-created",
        "complete", "failed", "file-removed", "dir-removed", "recovered",
        "recovery-blocked",
    }
    pathless = {"begin", "complete", "failed", "recovered", "recovery-blocked"}
    directory_events = {"dir-intent", "dir-created", "dir-removed"}
    file_events = {"file-intent", "file-created", "file-removed"}
    expected_files = {
        item["path"]: (item["sha256"], item["size_bytes"])
        for item in admitted_files
    }
    expected_directories = {"."} | {
        item.as_posix() for item in _target_directories(admitted_files)
    }
    seen: dict[str, set[str]] = {
        "dir-intent": set(), "dir-created": set(), "dir-removed": set(),
        "file-intent": set(), "file-created": set(), "file-removed": set(),
    }
    begin_count = 0
    for index, record in enumerate(records):
        label = f"journal record {index + 1}"
        if set(record) != required:
            errors.append(f"{label} fields do not match the journal contract")
            continue
        if record["schema_version"] != "mint.journal-record.v0.1":
            errors.append(f"{label} schema_version mismatch")
        if record["sequence"] != index + 1:
            errors.append(f"{label} sequence mismatch")
        for field in ("attempt_id", "plan_id", "render_id", "target_path"):
            if record[field] != request[field]:
                errors.append(f"{label} {field} binding mismatch")
        if not isinstance(record["detail"], str):
            errors.append(f"{label} detail must be a string")
        event = record["event"]
        if event not in events:
            errors.append(f"{label} event is not allowed")
            continue
        if event == "begin":
            begin_count += 1
            if index != 0:
                errors.append("journal begin must be the first record")
        if event in pathless:
            if record["path"] is not None or record["sha256"] is not None or record["size_bytes"] is not None:
                errors.append(f"{label} pathless event carries path or byte metadata")
            continue
        path = record["path"]
        if not isinstance(path, str):
            errors.append(f"{label} path must be a string")
            continue
        if event in directory_events:
            if path not in expected_directories:
                errors.append(f"{label} directory is not admitted by the render package")
            if record["sha256"] is not None or record["size_bytes"] is not None:
                errors.append(f"{label} directory event carries byte metadata")
        elif event in file_events:
            if path not in expected_files:
                errors.append(f"{label} file is not admitted by the render package")
            elif (record["sha256"], record["size_bytes"]) != expected_files[path]:
                errors.append(f"{label} file digest or size is not bound to the render package")
            if planner._validate_relative_paths([path]):
                errors.append(f"{label} file path is unsafe")
        if event in seen:
            if path in seen[event]:
                errors.append(f"{label} duplicates {event} for {path}")
            seen[event].add(path)
        if event == "dir-created" and path not in seen["dir-intent"]:
            errors.append(f"{label} has no preceding directory intent")
        if event == "file-created" and path not in seen["file-intent"]:
            errors.append(f"{label} has no preceding file intent")
        if event == "file-removed" and path not in seen["file-created"]:
            errors.append(f"{label} removes a file not created by this attempt")
        if event == "dir-removed" and path not in seen["dir-created"]:
            errors.append(f"{label} removes a directory not created by this attempt")
    if begin_count != 1:
        errors.append("journal must contain exactly one begin record")
    if any(record.get("event") in ("complete", "recovered") for record in records):
        errors.append("completed or recovered attempt is not eligible for recovery")
    return sorted(set(errors))


def _target_observation(request: dict[str, Any]) -> dict[str, Any]:
    raw = request.get("target_path")
    if not isinstance(raw, str):
        return {"exists": None, "path": None, "regular_file_count": None}
    target = Path(raw)
    exists = os.path.lexists(target)
    count: int | None = None
    if exists and target.is_dir() and not target.is_symlink():
        count = sum(1 for item in target.rglob("*") if item.is_file() and not item.is_symlink())
    elif not exists:
        count = 0
    return {"exists": exists, "path": raw, "regular_file_count": count}


def _make_receipt(request: dict[str, Any], status: str, journal_path: Path | None, journal_sha256: str | None, journal_records: int, effects_applied: int, target_file_writes: int, files_removed: int, directories_removed: int, blockers: list[str], residue: list[str]) -> dict[str, Any]:
    receipt: dict[str, Any] = {
        "apply_runtime_sha256": digest_file(Path(__file__)),
        "attempt_id": request.get("attempt_id", "unknown"),
        "blockers": sorted(set(blockers)),
        "directories_removed": directories_removed,
        "effects_applied": effects_applied,
        "effects_total": 18,
        "files_removed": files_removed,
        "journal_path": str(journal_path) if journal_path else None,
        "journal_records": journal_records,
        "journal_sha256": journal_sha256,
        "plan_id": request.get("plan_id"),
        "proof_ceiling": "create-only Stage-2 application on a private target; no L0/L1 acceptance, ratification, promotion, or Zagr proof",
        "receipt_id": "",
        "render_id": request.get("render_id"),
        "request_sha256": digest_bytes(canonical_bytes(request)),
        "residue": sorted(set(residue)),
        "schema_version": "mint.apply-receipt.v0.1",
        "status": status,
        "target_observation": _target_observation(request),
        "target_file_writes": target_file_writes,
    }
    material = dict(receipt)
    material.pop("receipt_id")
    receipt["receipt_id"] = digest_bytes(canonical_bytes(material))
    return receipt


def _recover_from_journal(
    request: dict[str, Any],
    journal_path: Path,
    admitted_files: list[dict[str, Any]],
    planner: Any,
    append_terminal: bool = True,
) -> dict[str, Any]:
    blockers: list[str] = []
    residue: list[str] = []
    files_removed = 0
    directories_removed = 0
    writer: JournalWriter | None = None
    try:
        records = read_journal(journal_path)
    except (OSError, UnicodeError, json.JSONDecodeError, ValueError) as exc:
        return _make_receipt(request, "recovery-blocked", journal_path, digest_file(journal_path) if journal_path.is_file() else None, 0, 0, 0, 0, 0, [f"journal invalid: {exc}"], [str(request.get("target_path", "unknown"))])
    blockers.extend(_validate_journal_records(records, request, admitted_files, planner))
    target = Path(request["target_path"])
    created_files: dict[str, dict[str, Any]] = {}
    created_dirs: set[str] = set()
    for record in records:
        if record.get("event") == "file-created" and isinstance(record.get("path"), str):
            created_files[record["path"]] = record
        if record.get("event") == "dir-created" and isinstance(record.get("path"), str):
            created_dirs.add(record["path"])
    if not blockers:
        # Preflight every owned file before deleting any byte. A single mismatch
        # blocks the whole recovery and leaves all target bytes untouched.
        for relative, record in sorted(created_files.items(), key=lambda item: item[0], reverse=True):
            path = target / PurePosixPath(relative)
            if not os.path.lexists(path):
                continue
            if planner._has_existing_symlink_component(path) or path.is_symlink() or not path.is_file():
                blockers.append(f"recovery refuses non-regular or symlinked path: {relative}")
                residue.append(relative)
                continue
            if digest_file(path) != record.get("sha256") or path.stat().st_size != record.get("size_bytes"):
                blockers.append(f"recovery digest mismatch: {relative}")
                residue.append(relative)
        writer = JournalWriter(Path(request["journal_root"]), request["attempt_id"], create=False)
        if not blockers:
            for relative, record in sorted(created_files.items(), key=lambda item: item[0], reverse=True):
                path = target / PurePosixPath(relative)
                if not os.path.lexists(path):
                    continue
                path.unlink()
                files_removed += 1
                writer.append("file-removed", request, relative, record.get("sha256"), record.get("size_bytes"), "exact recovery")
        if not blockers:
            ordered_dirs = sorted(created_dirs, key=lambda value: (len(PurePosixPath(value).parts) if value != "." else 0, value), reverse=True)
            for relative in ordered_dirs:
                path = target if relative == "." else target / PurePosixPath(relative)
                if not os.path.lexists(path):
                    continue
                if planner._has_existing_symlink_component(path) or path.is_symlink() or not path.is_dir():
                    blockers.append(f"recovery refuses non-directory or symlinked path: {relative}")
                    residue.append(relative)
                    break
                try:
                    path.rmdir()
                    directories_removed += 1
                    writer.append("dir-removed", request, relative, detail="exact empty-directory recovery")
                except OSError as exc:
                    if exc.errno in (errno.ENOTEMPTY, errno.EEXIST):
                        blockers.append(f"recovery directory is not empty: {relative}")
                        residue.append(relative)
                        break
                    raise
        if append_terminal:
            writer.append("recovery-blocked" if blockers else "recovered", request, detail="; ".join(blockers) if blockers else "target restored to absent")
        writer.close()
        writer = None
    if writer is not None:
        writer.close()
    final_records = read_journal(journal_path)
    status = "recovery-blocked" if blockers else "recovered"
    if os.path.lexists(target) and not residue:
        residue.append(".")
    return _make_receipt(request, status, journal_path, digest_file(journal_path), len(final_records), 0, 0, files_removed, directories_removed, blockers, residue)


def apply_output(manifest: Any, supplied_p0: Any, render_input: Any, supplied_render: Any, request: Any, planner: Any, renderer: Any) -> dict[str, Any]:
    if not isinstance(manifest, dict) or not isinstance(request, dict):
        fallback = request if isinstance(request, dict) else {}
        receipt = _make_receipt(fallback, "blocked", None, None, 0, 0, 0, 0, 0, ["manifest and apply request must be objects"], [])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}
    files, errors = _validate_static_bindings(manifest, supplied_p0, render_input, supplied_render, request, planner, renderer, True)
    journal_path = Path(request["journal_root"]) / f"{request['attempt_id']}.journal.jsonl" if not errors else None
    if journal_path is not None and os.path.lexists(journal_path):
        errors.append("attempt journal already exists; attempt_id reuse is forbidden")
    if errors:
        receipt = _make_receipt(request, "blocked", journal_path, None, 0, 0, 0, 0, 0, errors, [])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}

    writer: JournalWriter | None = None
    allowed_fd: int | None = None
    target_fd: int | None = None
    target_file_writes = 0
    try:
        writer = JournalWriter(Path(request["journal_root"]), request["attempt_id"], create=True)
        writer.append("begin", request, detail="18 Stage-2 create-only effects admitted")
        allowed_flags = os.O_RDONLY | os.O_DIRECTORY
        if hasattr(os, "O_NOFOLLOW"):
            allowed_flags |= os.O_NOFOLLOW
        allowed_fd = os.open(request["allowed_root"], allowed_flags)
        target_name = Path(request["target_path"]).name
        writer.append("dir-intent", request, ".", detail="create target root")
        os.mkdir(target_name, 0o700, dir_fd=allowed_fd)
        os.fsync(allowed_fd)
        target_fd = os.open(target_name, allowed_flags, dir_fd=allowed_fd)
        writer.append("dir-created", request, ".")

        for directory in _target_directories(files):
            parent_parts = directory.parts[:-1]
            parent_fd = _open_dir_at(target_fd, parent_parts)
            try:
                relative = directory.as_posix()
                writer.append("dir-intent", request, relative, detail="create owned directory")
                os.mkdir(directory.name, 0o700, dir_fd=parent_fd)
                os.fsync(parent_fd)
                writer.append("dir-created", request, relative)
            finally:
                os.close(parent_fd)

        for item in files:
            relative = PurePosixPath(item["path"])
            parent_fd = _open_dir_at(target_fd, relative.parts[:-1])
            file_fd: int | None = None
            try:
                writer.append("file-intent", request, relative.as_posix(), item["sha256"], item["size_bytes"], "create-only write")
                flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
                if hasattr(os, "O_NOFOLLOW"):
                    flags |= os.O_NOFOLLOW
                file_fd = os.open(relative.name, flags, 0o600, dir_fd=parent_fd)
                view = memoryview(item["payload"])
                while view:
                    written = os.write(file_fd, view)
                    view = view[written:]
                os.fsync(file_fd)
                os.close(file_fd)
                file_fd = None
                os.fsync(parent_fd)
                target_file_writes += 1
                writer.append("file-created", request, relative.as_posix(), item["sha256"], item["size_bytes"])
                if request["fault_after_ordinal"] == item["effect_ordinal"]:
                    raise InjectedFault(f"injected fault after effect ordinal {item['effect_ordinal']}")
            finally:
                if file_fd is not None:
                    os.close(file_fd)
                os.close(parent_fd)
        writer.append("complete", request, detail="all 18 Stage-2 files created")
        writer.close()
        writer = None
        if target_fd is not None:
            os.fsync(target_fd)
            os.close(target_fd)
            target_fd = None
        if allowed_fd is not None:
            os.fsync(allowed_fd)
            os.close(allowed_fd)
            allowed_fd = None
        records = read_journal(journal_path)
        receipt = _make_receipt(request, "applied", journal_path, digest_file(journal_path), len(records), 18, target_file_writes, 0, 0, [], [])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}
    except Exception as exc:
        if target_fd is not None:
            os.close(target_fd)
        if allowed_fd is not None:
            os.close(allowed_fd)
        if writer is not None:
            try:
                writer.append("failed", request, detail=f"{type(exc).__name__}: {exc}")
            finally:
                writer.close()
        if request["auto_recover"]:
            receipt = _recover_from_journal(request, journal_path, files, planner)
            receipt["target_file_writes"] = target_file_writes
            material = dict(receipt)
            material.pop("receipt_id")
            receipt["receipt_id"] = digest_bytes(canonical_bytes(material))
        else:
            records = read_journal(journal_path)
            receipt = _make_receipt(request, "failed", journal_path, digest_file(journal_path), len(records), target_file_writes, target_file_writes, 0, 0, [f"{type(exc).__name__}: {exc}"], ["."])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}


def recover_output(manifest: Any, supplied_p0: Any, render_input: Any, supplied_render: Any, request: Any, planner: Any, renderer: Any) -> dict[str, Any]:
    if not isinstance(manifest, dict) or not isinstance(request, dict):
        receipt = _make_receipt(request if isinstance(request, dict) else {}, "recovery-blocked", None, None, 0, 0, 0, 0, 0, ["manifest and apply request must be objects"], [])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}
    files, errors = _validate_static_bindings(manifest, supplied_p0, render_input, supplied_render, request, planner, renderer, False)
    journal_path = Path(request["journal_root"]) / f"{request['attempt_id']}.journal.jsonl"
    if not journal_path.is_file() or journal_path.is_symlink():
        errors.append("attempt journal must be an existing non-symlink regular file")
    if errors:
        receipt = _make_receipt(request, "recovery-blocked", journal_path, digest_file(journal_path) if journal_path.is_file() else None, 0, 0, 0, 0, 0, errors, ["."] if os.path.lexists(request["target_path"]) else [])
        return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}
    receipt = _recover_from_journal(request, journal_path, files, planner)
    return {"receipt": receipt, "schema_version": "mint.apply-output.v0.1"}
