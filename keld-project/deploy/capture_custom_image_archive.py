#!/usr/bin/env python3
"""Capture and verify a private recovery archive for exact local image IDs."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile


SCHEMA = "keld-custom-image-archive/v3"
IMAGE_ID = re.compile(r"^sha256:[0-9a-f]{64}$")
SERVICE = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")


class ArchiveError(RuntimeError):
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
        raise ArchiveError("docker-invalid-json") from error


def parse_images(values: list[str]) -> list[tuple[str, str]]:
    parsed = []
    services = set()
    images = set()
    for value in values:
        service, separator, image = value.partition("=")
        if not separator or not SERVICE.fullmatch(service) or not IMAGE_ID.fullmatch(image):
            raise ArchiveError(f"invalid-exact-image:{value}")
        if service in services or image in images:
            raise ArchiveError(f"duplicate-image-or-service:{service}")
        services.add(service)
        images.add(image)
        parsed.append((service, image))
    if not parsed or len(parsed) > 64:
        raise ArchiveError("bounded-image-set-required")
    return sorted(parsed)


def inspect_images(docker_bin: str, images: list[tuple[str, str]]) -> list[dict]:
    records = []
    for service, image in images:
        payload = docker_json(docker_bin, "image", "inspect", image)
        if not isinstance(payload, list) or len(payload) != 1 or payload[0].get("Id") != image:
            raise ArchiveError(f"image-id-mismatch:{service}")
        records.append(
            {
                "service": service,
                "imageId": image,
                "repoTags": sorted(payload[0].get("RepoTags") or []),
                "repoDigests": sorted(payload[0].get("RepoDigests") or []),
            }
        )
    return records


def read_json_member(archive: tarfile.TarFile, name: str) -> object:
    try:
        member = archive.getmember(name)
        stream = archive.extractfile(member)
        if stream is None or member.size > 16 * 1024 * 1024:
            raise ArchiveError(f"archive-metadata-invalid:{name}")
        return json.loads(stream.read())
    except (KeyError, json.JSONDecodeError, UnicodeError) as error:
        raise ArchiveError(f"archive-metadata-invalid:{name}") from error


def validate_archive(path: Path, expected_image_ids: set[str]) -> dict:
    blob_count = 0
    blob_digests = set()
    member_count = 0
    uncompressed_bytes = 0
    with tarfile.open(path, "r:") as archive:
        for member in archive:
            member_count += 1
            pure = PurePosixPath(member.name)
            if (
                pure.is_absolute()
                or not pure.parts
                or any(part in {"", ".", ".."} for part in pure.parts)
                or member.issym()
                or member.islnk()
                or not (member.isfile() or member.isdir())
            ):
                raise ArchiveError(f"archive-member-forbidden:{member.name}")
            if member_count > 100_000:
                raise ArchiveError("archive-member-limit")
            if member.isfile():
                uncompressed_bytes += member.size
                if uncompressed_bytes > 32 * 1024 * 1024 * 1024:
                    raise ArchiveError("archive-size-limit")
                if len(pure.parts) == 3 and pure.parts[:2] == ("blobs", "sha256"):
                    expected = pure.parts[2]
                    if not SHA256.fullmatch(expected):
                        raise ArchiveError(f"archive-blob-name-invalid:{member.name}")
                    stream = archive.extractfile(member)
                    if stream is None:
                        raise ArchiveError(f"archive-blob-unreadable:{member.name}")
                    digest = hashlib.sha256()
                    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                        digest.update(chunk)
                    if digest.hexdigest() != expected:
                        raise ArchiveError(f"archive-blob-digest-mismatch:{member.name}")
                    blob_count += 1
                    blob_digests.add(expected)
        if blob_count == 0:
            raise ArchiveError("archive-has-no-verified-blobs")
        index = read_json_member(archive, "index.json")
        manifest = read_json_member(archive, "manifest.json")
        layout = read_json_member(archive, "oci-layout")
    descriptors = index.get("manifests") if isinstance(index, dict) else None
    if not isinstance(descriptors, list):
        raise ArchiveError("archive-index-invalid")
    requested_digests = {image.removeprefix("sha256:") for image in expected_image_ids}
    found_images = set()
    attestations = 0
    for descriptor in descriptors:
        digest = descriptor.get("digest") if isinstance(descriptor, dict) else None
        if not isinstance(digest, str) or not digest.startswith("sha256:"):
            raise ArchiveError("archive-index-descriptor-invalid")
        normalized = digest.removeprefix("sha256:")
        if normalized not in blob_digests:
            raise ArchiveError(f"archive-index-blob-missing:{digest}")
        if normalized in requested_digests:
            found_images.add(normalized)
        elif descriptor.get("artifactType") == "application/vnd.docker.attestation.manifest.v1+json":
            attestations += 1
        else:
            raise ArchiveError(f"archive-index-unexpected-descriptor:{digest}")
    if found_images != requested_digests:
        raise ArchiveError("archive-index-image-set-mismatch")
    if not isinstance(manifest, list) or len(manifest) != len(expected_image_ids):
        raise ArchiveError("archive-manifest-image-count-mismatch")
    if layout != {"imageLayoutVersion": "1.0.0"}:
        raise ArchiveError("archive-layout-invalid")
    return {
        "memberCount": member_count,
        "blobDigestsVerified": blob_count,
        "uncompressedBytes": uncompressed_bytes,
        "indexImages": len(found_images),
        "indexDescriptors": len(descriptors),
        "attestationDescriptors": attestations,
        "manifestImages": len(manifest),
    }


def compress(source: Path, destination: Path) -> None:
    with source.open("rb") as input_file, destination.open("xb") as output_file:
        with gzip.GzipFile(filename="", mode="wb", fileobj=output_file, mtime=0) as compressed:
            shutil.copyfileobj(input_file, compressed, length=1024 * 1024)


def capture(args: argparse.Namespace) -> dict:
    output = args.output
    if not output.is_absolute() or output.exists() or output.is_symlink():
        raise ArchiveError("new-absolute-output-directory-required")
    if not output.parent.is_dir() or output.parent.is_symlink():
        raise ArchiveError("output-parent-invalid")
    requested = parse_images(args.image)
    inspected = inspect_images(args.docker_bin, requested)
    staging = Path(tempfile.mkdtemp(prefix=f".{output.name}.partial.", dir=output.parent))
    staging.chmod(0o700)
    raw_archive = staging / "images.tar"
    compressed_archive = staging / "images.tar.gz"
    try:
        subprocess.run(
            [args.docker_bin, "image", "save", "--output", str(raw_archive), *[image for _, image in requested]],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
        )
        raw_archive.chmod(0o600)
        verification = validate_archive(raw_archive, {image for _, image in requested})
        raw_sha256 = sha256_file(raw_archive)
        raw_bytes = raw_archive.stat().st_size
        compress(raw_archive, compressed_archive)
        compressed_archive.chmod(0o600)
        raw_archive.unlink()
        receipt = {
            "schema": SCHEMA,
            "ok": True,
            "images": inspected,
            "archive": {
                "file": compressed_archive.name,
                "bytes": compressed_archive.stat().st_size,
                "sha256": sha256_file(compressed_archive),
                "uncompressedBytes": raw_bytes,
                "uncompressedSha256": raw_sha256,
            },
            "verification": verification,
            "recoveryRequirements": {
                "dockerImageStore": "io.containerd.snapshotter.v1",
                "reason": (
                    "The OCI index binds the pinned manifest IDs. A classic graphdriver docker load "
                    "imports config-image IDs instead and does not preserve those deployment pins."
                ),
            },
            "claimBoundary": (
                "This verifies exact local image IDs and every OCI blob in the saved archive; "
                "a separate empty containerd-snapshotter engine load, retag, service restore, and "
                "traffic drill remain required."
            ),
        }
        receipt_path = staging / "receipt.json"
        receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        receipt_path.chmod(0o600)
        os.replace(staging, output)
        return {
            "ok": True,
            "output": str(output),
            "images": len(inspected),
            "archiveSha256": receipt["archive"]["sha256"],
            "receiptSha256": sha256_file(output / "receipt.json"),
            "blobDigestsVerified": verification["blobDigestsVerified"],
        }
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--docker-bin", default="docker")
    parser.add_argument("--image", action="append", required=True, metavar="SERVICE=SHA256_ID")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        print(json.dumps(capture(args), separators=(",", ":")))
        return 0
    except (ArchiveError, OSError, subprocess.CalledProcessError, tarfile.TarError) as error:
        print(str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
