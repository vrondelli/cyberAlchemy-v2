#!/usr/bin/env python3
"""Load a custom-image archive into an empty engine and verify exact image IDs."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time


SCHEMA = "keld-custom-image-recovery/v1"
CAPTURE_SCHEMAS = {"keld-custom-image-archive/v2", "keld-custom-image-archive/v3"}
IMAGE_ID = re.compile(r"^sha256:[0-9a-f]{64}$")


class RecoveryError(RuntimeError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def docker_command(args: argparse.Namespace, *arguments: str) -> list[str]:
    return [args.docker_bin, "--host", args.docker_host, *arguments]


def docker_run(args: argparse.Namespace, *arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        docker_command(args, *arguments),
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def docker_json(args: argparse.Namespace, *arguments: str) -> object:
    result = docker_run(args, *arguments)
    if result.returncode != 0:
        raise RecoveryError(f"docker-command-failed:{arguments[0]}")
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise RecoveryError("docker-invalid-json") from error


def docker_lines(args: argparse.Namespace, *arguments: str) -> list[str]:
    result = docker_run(args, *arguments)
    if result.returncode != 0:
        raise RecoveryError(f"docker-command-failed:{arguments[0]}")
    return sorted({line.strip() for line in result.stdout.splitlines() if line.strip()})


def load_capture_receipt(path: Path) -> tuple[dict, list[str]]:
    if not path.is_absolute() or not path.is_file() or path.is_symlink():
        raise RecoveryError("capture-receipt-invalid")
    try:
        receipt = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeError, OSError) as error:
        raise RecoveryError("capture-receipt-invalid") from error
    if receipt.get("schema") not in CAPTURE_SCHEMAS or receipt.get("ok") is not True:
        raise RecoveryError("capture-receipt-not-admitted")
    images = receipt.get("images")
    if not isinstance(images, list) or not images or len(images) > 64:
        raise RecoveryError("capture-image-set-invalid")
    image_ids = [item.get("imageId") if isinstance(item, dict) else None for item in images]
    if any(not isinstance(image, str) or not IMAGE_ID.fullmatch(image) for image in image_ids):
        raise RecoveryError("capture-image-id-invalid")
    if len(set(image_ids)) != len(image_ids):
        raise RecoveryError("capture-image-id-duplicate")
    return receipt, sorted(image_ids)


def validate_paths(args: argparse.Namespace, capture_receipt: dict) -> str:
    if not args.archive.is_absolute() or not args.archive.is_file() or args.archive.is_symlink():
        raise RecoveryError("archive-invalid")
    if not args.output.is_absolute() or args.output.exists() or args.output.is_symlink():
        raise RecoveryError("new-absolute-output-file-required")
    if not args.output.parent.is_dir() or args.output.parent.is_symlink():
        raise RecoveryError("output-parent-invalid")
    expected_sha256 = capture_receipt.get("archive", {}).get("sha256")
    if not isinstance(expected_sha256, str) or not re.fullmatch(r"[0-9a-f]{64}", expected_sha256):
        raise RecoveryError("capture-archive-digest-invalid")
    actual_sha256 = sha256_file(args.archive)
    if actual_sha256 != expected_sha256:
        raise RecoveryError("archive-digest-mismatch")
    return actual_sha256


def verify(args: argparse.Namespace) -> dict:
    capture_receipt, expected_ids = load_capture_receipt(args.capture_receipt)
    archive_sha256 = validate_paths(args, capture_receipt)
    info = docker_json(args, "info", "--format", "{{json .}}")
    if not isinstance(info, dict):
        raise RecoveryError("docker-info-invalid")
    driver_status = info.get("DriverStatus") or []
    status_values = {
        value
        for row in driver_status
        if isinstance(row, list)
        for value in row
        if isinstance(value, str)
    }
    if "io.containerd.snapshotter.v1" not in status_values:
        raise RecoveryError("containerd-snapshotter-required-for-exact-id-recovery")
    initial_images = docker_lines(args, "image", "ls", "--all", "--no-trunc", "--format", "{{.ID}}")
    initial_containers = docker_lines(args, "ps", "--all", "--quiet")
    if initial_images or initial_containers:
        raise RecoveryError("empty-engine-required")

    started = time.monotonic()
    load = docker_run(args, "image", "load", "--input", str(args.archive))
    duration_seconds = round(time.monotonic() - started, 3)
    load_output = (load.stdout + load.stderr).strip()
    if len(load_output.encode("utf-8")) > 64 * 1024:
        raise RecoveryError("docker-load-output-limit")
    if load.returncode != 0:
        raise RecoveryError(f"docker-load-failed:{load.returncode}")

    actual_ids = docker_lines(args, "image", "ls", "--all", "--no-trunc", "--format", "{{.ID}}")
    if actual_ids != expected_ids:
        raise RecoveryError("recovered-image-set-mismatch")
    if docker_lines(args, "ps", "--all", "--quiet"):
        raise RecoveryError("recovery-created-containers")
    for image_id in expected_ids:
        payload = docker_json(args, "image", "inspect", image_id)
        if not isinstance(payload, list) or len(payload) != 1 or payload[0].get("Id") != image_id:
            raise RecoveryError(f"recovered-image-inspect-mismatch:{image_id}")

    receipt = {
        "schema": SCHEMA,
        "ok": True,
        "engine": {
            "serverVersion": info.get("ServerVersion"),
            "driver": info.get("Driver"),
            "driverStatus": driver_status,
            "dockerHost": args.docker_host,
            "initialImages": 0,
            "initialContainers": 0,
            "finalImages": len(actual_ids),
            "finalContainers": 0,
        },
        "archive": {
            "file": args.archive.name,
            "sha256": archive_sha256,
            "captureReceiptSha256": sha256_file(args.capture_receipt),
        },
        "load": {
            "exitCode": load.returncode,
            "durationSeconds": duration_seconds,
            "output": load_output,
        },
        "expectedImageIds": expected_ids,
        "actualImageIds": actual_ids,
        "claimBoundary": (
            "This proves an empty containerd-snapshotter Docker engine can load the archive and recover "
            "the exact pinned image IDs. Retagging, service restore, state/configuration restore, and "
            "public traffic cutover remain separate drills."
        ),
    }
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{args.output.name}.", dir=args.output.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as output:
            json.dump(receipt, output, indent=2, sort_keys=True)
            output.write("\n")
            output.flush()
            os.fsync(output.fileno())
        temporary.chmod(0o600)
        os.replace(temporary, args.output)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    return {
        "ok": True,
        "output": str(args.output),
        "images": len(actual_ids),
        "archiveSha256": archive_sha256,
        "receiptSha256": sha256_file(args.output),
        "durationSeconds": duration_seconds,
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--docker-bin", default="docker")
    parser.add_argument("--docker-host", required=True)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--capture-receipt", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        print(json.dumps(verify(args), separators=(",", ":")))
        return 0
    except (RecoveryError, OSError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
