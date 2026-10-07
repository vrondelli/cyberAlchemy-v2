#!/usr/bin/env python3
"""Capture or verify a secret-free manifest of the exact live KELD + ARE release."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from datetime import datetime, timezone


SCHEMA_V2 = "keld-release-manifest/v2"
SCHEMA = "keld-release-manifest/v3"
PROJECTS = {
    "keld": {
        "project": "keld-staging",
        "services": ("edge", "keycloak", "postgres", "web", "worker"),
        "inputs": (
            "Dockerfile",
            "compose.staging-candidate.yaml",
            "Caddy.Dockerfile",
            "Caddy.go.mod",
            "Caddy.go.sum",
            "Caddyfile.staging-candidate",
            "migrate-caddy-storage.sh",
            "Postgres.Dockerfile",
            "keycloak-entrypoint.sh",
            "harden-keycloak-realm.sh",
            "harden-keycloak-crypto-surface.sh",
            "prepare.py",
            "backup-full-state.sh",
            "verify_full_state_backup.py",
            "capture_release_manifest.py",
            "capture_are_source_provenance.py",
            "capture_custom_image_archive.py",
            "capture_paid_delivery_evidence.py",
            "capture_webhook_recovery_evidence.py",
            "verify_custom_image_archive_recovery.py",
            "baseline/current-r21-custom-image-archive-receipt.json",
            "baseline/current-r21-custom-image-recovery.json",
            "baseline/current-provider-paid-delivery.json",
            "monitor_staging.py",
            "send_staging_heartbeat.py",
            "fetch_bcb_ptax.py",
            "quote_config.py",
            "keld-staging-monitor.service",
            "keld-staging-monitor.timer",
            "keld-staging-monitor-heartbeat.conf.example",
            ".runtime/keld.json",
            ".runtime/artifacts/sandbox.bin",
        ),
    },
    "are": {
        "project": "are-keld-presentation",
        "services": ("edge", "inference-broker", "provider-gateway", "public-chat"),
        "inputs": (
            "compose.presentation.yaml",
            "compose.presentation.candidate.yaml",
            "Caddyfile.presentation",
            "seccomp-node.json",
            "source-provenance/edge-server.mjs",
            "source-provenance/inference-broker.declared.json",
            "source-provenance/inference-broker.observed.json",
            "source-provenance/provider-gateway.declared.json",
            "source-provenance/provider-gateway.observed.json",
            "source-provenance/public-chat.declared.json",
            "source-provenance/public-chat.observed.json",
            "source-provenance/receipt.json",
        ),
    },
}


class ManifestError(RuntimeError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def docker_json(docker_bin: str, *arguments: str) -> object:
    result = subprocess.run(
        [docker_bin, *arguments],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise ManifestError("docker returned invalid JSON") from error


def running_container_ids(docker_bin: str, project: str) -> list[str]:
    result = subprocess.run(
        [
            docker_bin,
            "ps",
            "--filter",
            f"label=com.docker.compose.project={project}",
            "--format",
            "{{json .ID}}",
        ],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    ids = []
    for line in result.stdout.splitlines():
        if line.strip():
            try:
                ids.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ManifestError("docker ps returned invalid JSON lines") from error
    return ids


def normalized_ports(ports: dict | None) -> list[dict]:
    published = []
    for container_port, bindings in sorted((ports or {}).items()):
        for binding in bindings or []:
            published.append(
                {
                    "container": container_port,
                    "hostIp": binding.get("HostIp", ""),
                    "hostPort": binding.get("HostPort", ""),
                }
            )
    return published


def inspect_project(docker_bin: str, project: str, expected_services: tuple[str, ...]) -> list[dict]:
    containers = []
    for container_id in running_container_ids(docker_bin, project):
        payload = docker_json(docker_bin, "inspect", container_id)
        if not isinstance(payload, list) or len(payload) != 1:
            raise ManifestError(f"unexpected inspect response for project {project}")
        item = payload[0]
        labels = item.get("Config", {}).get("Labels") or {}
        service = labels.get("com.docker.compose.service")
        if not service:
            raise ManifestError(f"container without Compose service label in {project}")
        state = item.get("State") or {}
        health = (state.get("Health") or {}).get("Status")
        if state.get("Status") != "running":
            raise ManifestError(f"service is not running: {project}/{service}")
        if health not in (None, "healthy"):
            raise ManifestError(f"service is not healthy: {project}/{service}={health}")
        host = item.get("HostConfig") or {}
        config = item.get("Config") or {}
        containers.append(
            {
                "service": service,
                "configuredImage": config.get("Image"),
                "imageId": item.get("Image"),
                "composeConfigHash": labels.get("com.docker.compose.config-hash"),
                "user": config.get("User") or "",
                "readOnlyRoot": bool(host.get("ReadonlyRootfs")),
                "capDrop": sorted(host.get("CapDrop") or []),
                "capAdd": sorted(host.get("CapAdd") or []),
                "securityOpt": sorted(host.get("SecurityOpt") or []),
                "pidsLimit": host.get("PidsLimit"),
                "memoryBytes": host.get("Memory"),
                "restartPolicy": (host.get("RestartPolicy") or {}).get("Name", ""),
                "health": health,
                "networks": sorted((item.get("NetworkSettings", {}).get("Networks") or {}).keys()),
                "publishedPorts": normalized_ports(item.get("NetworkSettings", {}).get("Ports")),
            }
        )
    services = [item["service"] for item in containers]
    if sorted(services) != sorted(expected_services):
        raise ManifestError(
            f"running service set mismatch for {project}: expected={sorted(expected_services)!r} actual={sorted(services)!r}"
        )
    return sorted(containers, key=lambda item: item["service"])


def inspect_inputs(scope: str, root: Path, relative_paths: tuple[str, ...]) -> list[dict]:
    if not root.is_absolute() or not root.is_dir() or root.is_symlink():
        raise ManifestError(f"invalid {scope} deployment directory: {root}")
    records = []
    for relative in relative_paths:
        path = root / relative
        if not path.is_file() or path.is_symlink():
            raise ManifestError(f"required release input is missing or invalid: {scope}/{relative}")
        records.append(
            {
                "scope": scope,
                "path": relative,
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return records


def inspect_application_build_context(root: Path, keld_root: Path) -> dict:
    if not root.is_absolute() or not root.is_dir() or root.is_symlink():
        raise ManifestError(f"invalid application build context: {root}")
    resolved = root.resolve()
    keld_resolved = keld_root.resolve()
    if not resolved.is_relative_to(keld_resolved) or resolved == keld_resolved:
        raise ManifestError("application build context must be a child of the KELD deployment directory")
    if {path.name for path in resolved.iterdir()} != {".dockerignore", "Dockerfile", "runtime"}:
        raise ManifestError("application build context layout is not allowlisted")

    records = []
    total_bytes = 0
    for path in sorted(resolved.rglob("*"), key=lambda item: str(item.relative_to(resolved))):
        relative = path.relative_to(resolved)
        if path.is_symlink():
            raise ManifestError(f"application build context symlink is forbidden: {relative}")
        if path.is_dir():
            if path.name in {".git", ".runtime", "node_modules"}:
                raise ManifestError(f"application build context directory is forbidden: {relative}")
            continue
        if not path.is_file():
            raise ManifestError(f"application build context special file is forbidden: {relative}")
        if path.name == ".env" or path.name.endswith((".key", ".pem", ".p12", ".pfx")):
            raise ManifestError(f"application build context credential-like file is forbidden: {relative}")
        size = path.stat().st_size
        if size > 64 * 1024 * 1024:
            raise ManifestError(f"application build context file is too large: {relative}")
        total_bytes += size
        if total_bytes > 512 * 1024 * 1024 or len(records) >= 10_000:
            raise ManifestError("application build context is outside bounded limits")
        records.append(
            {
                "path": str(relative),
                "bytes": size,
                "mode": oct(path.stat().st_mode & 0o777),
                "sha256": sha256_file(path),
            }
        )
    if not records or not any(item["path"] == "runtime/manifest.json" for item in records):
        raise ManifestError("application build context runtime manifest is required")
    canonical = json.dumps(records, separators=(",", ":"), sort_keys=True).encode()
    return {
        "directory": str(resolved),
        "fileCount": len(records),
        "bytes": total_bytes,
        "treeSha256": hashlib.sha256(canonical).hexdigest(),
        "files": records,
    }


def collect_release(
    keld_dir: Path,
    are_dir: Path,
    docker_bin: str,
    keld_app_context: Path | None = None,
) -> dict:
    roots = {"keld": keld_dir.resolve(), "are": are_dir.resolve()}
    inputs = []
    containers = []
    sources = {}
    for scope, definition in PROJECTS.items():
        root = roots[scope]
        sources[scope] = {"directory": str(root), "project": definition["project"]}
        inputs.extend(inspect_inputs(scope, root, definition["inputs"]))
        for container in inspect_project(docker_bin, definition["project"], definition["services"]):
            containers.append({"scope": scope, **container})
    release = {
        "sources": sources,
        "inputs": sorted(inputs, key=lambda item: (item["scope"], item["path"])),
        "containers": sorted(containers, key=lambda item: (item["scope"], item["service"])),
    }
    if keld_app_context is not None:
        release["buildContexts"] = {
            "keldApplication": inspect_application_build_context(keld_app_context, roots["keld"])
        }
    return release


def write_new_manifest(path: Path, release: dict) -> str:
    if not path.is_absolute():
        raise ManifestError("manifest output path must be absolute")
    if path.exists() or path.is_symlink():
        raise ManifestError(f"refusing to replace existing manifest: {path}")
    if not path.parent.is_dir() or path.parent.is_symlink():
        raise ManifestError(f"manifest parent is missing or invalid: {path.parent}")
    document = {
        "schema": SCHEMA,
        "capturedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "release": release,
    }
    encoded = (json.dumps(document, indent=2, sort_keys=True) + "\n").encode()
    descriptor, partial_name = tempfile.mkstemp(prefix=f".{path.name}.partial.", dir=path.parent)
    partial = Path(partial_name)
    try:
        os.fchmod(descriptor, 0o600)
        with os.fdopen(descriptor, "wb") as target:
            target.write(encoded)
            target.flush()
            os.fsync(target.fileno())
        os.replace(partial, path)
    except BaseException:
        partial.unlink(missing_ok=True)
        raise
    return hashlib.sha256(encoded).hexdigest()


def verify_manifest(path: Path, docker_bin: str) -> str:
    if not path.is_file() or path.is_symlink():
        raise ManifestError(f"manifest is missing or invalid: {path}")
    document = json.loads(path.read_text(encoding="utf-8"))
    schema = document.get("schema")
    if schema not in {SCHEMA_V2, SCHEMA} or not isinstance(document.get("release"), dict):
        raise ManifestError("unsupported release manifest")
    sources = document["release"].get("sources") or {}
    for scope, definition in PROJECTS.items():
        source = sources.get(scope) or {}
        if source.get("project") != definition["project"]:
            raise ManifestError(f"manifest project mismatch: {scope}")
    keld_dir = Path(sources["keld"]["directory"])
    context = None
    if schema == SCHEMA:
        context_record = (document["release"].get("buildContexts") or {}).get("keldApplication") or {}
        directory = context_record.get("directory")
        if not isinstance(directory, str) or not directory:
            raise ManifestError("application build context is missing from v3 manifest")
        context = Path(directory)
    current = collect_release(keld_dir, Path(sources["are"]["directory"]), docker_bin, context)
    if current != document["release"]:
        raise ManifestError("release-manifest-drift")
    return sha256_file(path)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docker-bin", default="docker")
    subparsers = parser.add_subparsers(dest="action", required=True)
    capture = subparsers.add_parser("capture")
    capture.add_argument("output", type=Path)
    capture.add_argument("--keld-dir", type=Path, default=Path(__file__).resolve().parent)
    capture.add_argument("--are-dir", type=Path, default=Path("/opt/are-keld-presentation"))
    capture.add_argument("--keld-app-context", type=Path, required=True)
    verify = subparsers.add_parser("verify")
    verify.add_argument("manifest", type=Path)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.action == "capture":
            release = collect_release(args.keld_dir, args.are_dir, args.docker_bin, args.keld_app_context)
            digest = write_new_manifest(args.output, release)
            receipt = {"ok": True, "action": "capture", "path": str(args.output), "sha256": digest}
        else:
            digest = verify_manifest(args.manifest, args.docker_bin)
            receipt = {"ok": True, "action": "verify", "path": str(args.manifest), "sha256": digest}
        print(json.dumps(receipt, separators=(",", ":")))
        return 0
    except (ManifestError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
