#!/usr/bin/env python3
"""Extract only pinned ARB trace2code source corpus, never benchmark labels."""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import tarfile


ARCHIVE_SHA256 = "19b252e8cfff42107fedc74005dbb6972f2970af33651ce0c1571546819e41c4"
RELEASE = "v2_trace2code"
MAX_MEMBER_BYTES = 100_000_000
MAX_TOTAL_BYTES = 400_000_000
MAX_MEMBERS = 500


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_name(member: tarfile.TarInfo) -> str:
    name = member.name.removeprefix("./")
    parts = pathlib.PurePosixPath(name).parts
    if not name or name.startswith("/") or ".." in parts or "\\" in name:
        raise ValueError("unsafe archive member path")
    if not (member.isfile() or member.isdir()):
        raise ValueError("archive contains a link or special member")
    return name


def selected_target(name: str) -> str | None:
    if name == f"reports/{RELEASE}/release_manifest.json":
        return "release_manifest.json"
    if name == f"corpus/{RELEASE}/corpus_manifest.jsonl":
        return name
    if name.startswith(f"corpus/{RELEASE}/") and name.endswith(".chunks.jsonl"):
        return name
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=pathlib.Path, required=True)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    archive = args.archive.resolve(strict=True)
    output = args.output.absolute()
    if output.exists():
        raise SystemExit(f"refusing existing output: {output}")
    if sha256_file(archive) != ARCHIVE_SHA256:
        raise SystemExit("archive SHA-256 does not match pinned release")

    selected: dict[str, tuple[str, int]] = {}
    seen: set[str] = set()
    total = 0
    count = 0
    with tarfile.open(archive, "r|zst") as tar:
        for member in tar:
            name = canonical_name(member)
            count += 1
            if count > MAX_MEMBERS or name in seen:
                raise SystemExit("member limit or duplicate archive path")
            seen.add(name)
            if not member.isfile():
                continue
            if member.size > MAX_MEMBER_BYTES:
                raise SystemExit("member size limit exceeded")
            total += member.size
            if total > MAX_TOTAL_BYTES:
                raise SystemExit("archive expansion limit exceeded")
            target = selected_target(name)
            if target is not None:
                selected[name] = (target, member.size)
    if count != 120 or len(selected) != 100:
        raise SystemExit(f"unexpected archive shape: {count} members, {len(selected)} source files")

    output.mkdir(parents=True, exist_ok=False)
    files = []
    with tarfile.open(archive, "r|zst") as tar:
        for member in tar:
            name = canonical_name(member)
            if name not in selected:
                continue
            relative, expected_size = selected[name]
            if not member.isfile() or member.size != expected_size:
                raise SystemExit("archive changed between passes")
            dest = output / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            digest = hashlib.sha256()
            copied = 0
            source = tar.extractfile(member)
            if source is None:
                raise SystemExit("selected member could not be read")
            with source, dest.open("xb") as sink:
                while chunk := source.read(1024 * 1024):
                    copied += len(chunk)
                    digest.update(chunk)
                    sink.write(chunk)
            if copied != expected_size:
                raise SystemExit("selected member size mismatch")
            files.append({"path": relative, "bytes": copied, "sha256": digest.hexdigest()})

    manifest = json.loads((output / "release_manifest.json").read_text())
    if (manifest.get("name"), manifest.get("sample_count"), manifest.get("corpus_rows")) != (RELEASE, 101, 98):
        raise SystemExit("release manifest identity mismatch")
    if len(files) != 100 or sum(f["path"].endswith(".chunks.jsonl") for f in files) != 98:
        raise SystemExit("source corpus file count mismatch")
    receipt = {
        "schema": "are.arb-trace2code-source-isolation/v1",
        "archive_sha256": ARCHIVE_SHA256,
        "archive_members": count,
        "selected_files": len(files),
        "selected_bytes": sum(f["bytes"] for f in files),
        "release_manifest_sha256": sha256_file(output / "release_manifest.json"),
        "corpus_rows_declared": manifest["corpus_rows"],
        "excluded_prefixes": ["benchmark/", "eval/", "reports/ (except release manifest)"],
        "files": sorted(files, key=lambda item: item["path"]),
    }
    (output / "SOURCE-ISOLATION-RECEIPT.json").write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps({key: value for key, value in receipt.items() if key != "files"}, sort_keys=True))


if __name__ == "__main__":
    main()
