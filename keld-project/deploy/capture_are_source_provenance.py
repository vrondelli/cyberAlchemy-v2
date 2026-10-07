#!/usr/bin/env python3
"""Extract and verify secret-free source manifests from exact local ARE images."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile


SCHEMA = "are-image-source-provenance/v1"
IMAGE_ID = re.compile(r"^sha256:[0-9a-f]{64}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
PACKAGES = {
    "publicChat": ("are.public-chat-package-manifest/v1", "public-chat"),
    "inferenceBroker": ("are.inference-broker-package-manifest/v1", "inference-broker"),
    "providerGateway": ("are.provider-gateway-package-manifest/v1", "provider-gateway"),
}


class ProvenanceError(RuntimeError):
    pass


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(docker_bin: str, *arguments: str) -> str:
    result = subprocess.run(
        [docker_bin, *arguments],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return result.stdout.strip()


def exact_image_id(docker_bin: str, reference: str) -> str:
    if not IMAGE_ID.fullmatch(reference):
        raise ProvenanceError(f"exact-image-id-required:{reference}")
    try:
        payload = json.loads(run(docker_bin, "image", "inspect", reference))
    except (json.JSONDecodeError, subprocess.CalledProcessError) as error:
        raise ProvenanceError(f"image-inspect-failed:{reference}") from error
    if not isinstance(payload, list) or len(payload) != 1 or payload[0].get("Id") != reference:
        raise ProvenanceError(f"image-id-mismatch:{reference}")
    return reference


def extract_srv(docker_bin: str, image: str, destination: Path) -> None:
    container = ""
    try:
        container = run(docker_bin, "create", image)
        if not container:
            raise ProvenanceError(f"container-create-invalid:{image}")
        destination.mkdir()
        run(docker_bin, "cp", f"{container}:/srv/.", str(destination))
    except subprocess.CalledProcessError as error:
        raise ProvenanceError(f"image-extract-failed:{image}") from error
    finally:
        if container:
            subprocess.run(
                [docker_bin, "rm", "-f", container],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
                text=True,
            )


def validate_tree(root: Path) -> None:
    count = 0
    total = 0
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ProvenanceError("image-source-symlink-forbidden")
        if path.is_dir():
            continue
        if not path.is_file():
            raise ProvenanceError("image-source-special-file-forbidden")
        count += 1
        total += path.stat().st_size
        if count > 10_000 or total > 512 * 1024 * 1024:
            raise ProvenanceError("image-source-tree-unbounded")


def observed_tree(root: Path) -> list[dict]:
    files = []
    for path in sorted(root.rglob("*")):
        if path.is_dir():
            continue
        files.append(
            {
                "path": path.relative_to(root).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return files


def validate_package(root: Path, expected_schema: str, output_stem: str) -> dict:
    manifest_path = root / "manifest.json"
    declared_name = f"{output_stem}.declared.json"
    observed_name = f"{output_stem}.observed.json"
    try:
        raw = manifest_path.read_bytes()
        manifest = json.loads(raw)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ProvenanceError(f"package-manifest-invalid:{declared_name}") from error
    if manifest.get("schema_version") != expected_schema:
        raise ProvenanceError(f"package-schema-mismatch:{declared_name}")
    aggregate = manifest.get("aggregate_sha256")
    material = dict(manifest)
    material.pop("aggregate_sha256", None)
    calculated = sha256_bytes(
        json.dumps(material, separators=(",", ":"), ensure_ascii=False).encode()
    )
    if not isinstance(aggregate, str) or aggregate != calculated:
        raise ProvenanceError(f"package-aggregate-mismatch:{declared_name}")
    files = manifest.get("files")
    if not isinstance(files, list) or not files or len(files) > 10_000:
        raise ProvenanceError(f"package-file-list-invalid:{declared_name}")
    seen = set()
    declared = {}
    for record in files:
        relative = record.get("path") if isinstance(record, dict) else None
        pure = PurePosixPath(relative) if isinstance(relative, str) else None
        if (
            pure is None
            or pure.is_absolute()
            or not pure.parts
            or any(part in {"", ".", ".."} for part in pure.parts)
            or relative in seen
        ):
            raise ProvenanceError(f"package-path-invalid:{declared_name}")
        seen.add(relative)
        size = record.get("bytes")
        digest = record.get("sha256")
        if (
            type(size) is not int
            or size < 0
            or not isinstance(digest, str)
            or not SHA256.fullmatch(digest)
        ):
            raise ProvenanceError(f"package-record-invalid:{declared_name}:{relative}")
        declared[relative] = {"bytes": size, "sha256": digest}

    observed_files = observed_tree(root)
    observed = {record["path"]: record for record in observed_files}
    observed_payload = {
        path: record for path, record in observed.items() if path != "manifest.json"
    }
    missing = sorted(set(declared) - set(observed_payload))
    extra = sorted(set(observed_payload) - set(declared))
    changed = []
    for relative in sorted(set(declared) & set(observed_payload)):
        actual = observed_payload[relative]
        expected = declared[relative]
        if actual["bytes"] != expected["bytes"] or actual["sha256"] != expected["sha256"]:
            changed.append(
                {
                    "path": relative,
                    "declared": expected,
                    "observed": {
                        "bytes": actual["bytes"],
                        "sha256": actual["sha256"],
                    },
                }
            )
    observed_manifest = {
        "schema": "are-observed-image-tree/v1",
        "root": "/srv",
        "files": observed_files,
    }
    observed_data = (json.dumps(observed_manifest, indent=2, sort_keys=True) + "\n").encode()
    return {
        "schema": expected_schema,
        "declaredManifestFile": declared_name,
        "declaredManifestSha256": sha256_bytes(raw),
        "aggregateSha256": aggregate,
        "observedManifestFile": observed_name,
        "observedManifestSha256": sha256_bytes(observed_data),
        "observedFiles": len(observed_files),
        "observedBytes": sum(record["bytes"] for record in observed_files),
        "declaredTreeMatchesObserved": not (missing or extra or changed),
        "differences": {"missing": missing, "extra": extra, "changed": changed},
        "declaredRaw": raw,
        "observedRaw": observed_data,
    }


def capture(args: argparse.Namespace) -> dict:
    output = args.output
    if not output.is_absolute() or output.exists() or output.is_symlink():
        raise ProvenanceError("new-absolute-output-directory-required")
    if not output.parent.is_dir() or output.parent.is_symlink():
        raise ProvenanceError("output-parent-invalid")
    images = {
        "edge": exact_image_id(args.docker_bin, args.edge_image),
        "publicChat": exact_image_id(args.docker_bin, args.public_chat_image),
        "inferenceBroker": exact_image_id(args.docker_bin, args.inference_broker_image),
        "providerGateway": exact_image_id(args.docker_bin, args.provider_gateway_image),
    }
    staging = Path(tempfile.mkdtemp(prefix=f".{output.name}.partial.", dir=output.parent))
    try:
        extracted = {}
        for role, image in images.items():
            root = staging / f".{role}-root"
            extract_srv(args.docker_bin, image, root)
            validate_tree(root)
            extracted[role] = root

        packages = {}
        for role, (schema, stem) in PACKAGES.items():
            packages[role] = validate_package(extracted[role], schema, stem)
            declared_name = packages[role]["declaredManifestFile"]
            observed_name = packages[role]["observedManifestFile"]
            (staging / declared_name).write_bytes(packages[role].pop("declaredRaw"))
            (staging / observed_name).write_bytes(packages[role].pop("observedRaw"))

        edge_source = extracted["edge"] / "server" / "edge-server.mjs"
        if not edge_source.is_file() or edge_source.is_symlink():
            raise ProvenanceError("edge-source-missing")
        edge_name = "edge-server.mjs"
        shutil.copyfile(edge_source, staging / edge_name)
        receipt = {
            "schema": SCHEMA,
            "ok": True,
            "images": images,
            "edge": {
                "sourceFile": edge_name,
                "bytes": edge_source.stat().st_size,
                "sha256": sha256_file(edge_source),
            },
            "packages": packages,
            "claimBoundary": (
                "This records declared package metadata and independently observed /srv "
                "trees for exact local images. Declared/observed differences are retained; "
                "this does not prove a clean-room rebuild or approve production policy."
            ),
        }
        receipt_data = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
        (staging / "receipt.json").write_bytes(receipt_data)
        for path in staging.iterdir():
            if path.is_file():
                path.chmod(0o600)
        for root in extracted.values():
            shutil.rmtree(root)
        staging.chmod(0o700)
        os.replace(staging, output)
        return {
            "ok": True,
            "output": str(output),
            "receiptSha256": sha256_bytes(receipt_data),
            "observedFiles": sum(item["observedFiles"] for item in packages.values()) + 1,
        }
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--docker-bin", default="docker")
    parser.add_argument("--edge-image", required=True)
    parser.add_argument("--public-chat-image", required=True)
    parser.add_argument("--inference-broker-image", required=True)
    parser.add_argument("--provider-gateway-image", required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        print(json.dumps(capture(args), separators=(",", ":")))
        return 0
    except (ProvenanceError, OSError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
