#!/usr/bin/env python3
"""Owner-directed allowlisted export; outputs remain local and unapproved."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tarfile

HERE = Path(__file__).resolve().parent
EVF = HERE.parents[1]
REPO = EVF.parents[3]
KIT = HERE / "kit"
ROOT_NAME = "evf-audit-kit-0.1.0"
SOURCE = EVF / "production/rust"
EXPORT = ["Cargo.toml", "Cargo.lock", "kernel/Cargo.toml", "kernel/src/lib.rs", "kernel/src/model.rs",
          "kernel/src/identity.rs", "kernel/src/store.rs", "kernel/src/execute.rs",
          "kernel/src/bin/evf_run.rs", "kernel/tests/contracts.rs", "verifier/Cargo.toml", "verifier/src/main.rs"]
SCHEMAS = ["evf-enforcement-profile.v1.schema.json", "evf-stage-receipt.v1.schema.json",
           "evf-verification-receipt.v1.schema.json", "evolvable-validation-receipt.v1.schema.json"]
TEMPLATES = ["evf", "build.py", "README.md", "NOTICE.md", "tests/test_cli.py",
             "example/provider.c", "example/audit.json", "example/positive.txt", "example/negative.txt", "example/obligation.md"]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def references(value):
    if isinstance(value, dict):
        if {"path", "sha256", "size_bytes"} <= value.keys():
            yield value
        for child in value.values():
            yield from references(child)
    elif isinstance(value, list):
        for child in value:
            yield from references(child)


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("xb") as stream:
        stream.write(data)


def assemble():
    if KIT.exists() or KIT.is_symlink():
        raise RuntimeError("kit/ already exists; preserve it, do not overwrite the packaging candidate")
    manifest = json.loads((EVF / "production/CANDIDATE-MANIFEST.v3-candidate.json").read_text())
    known = {ref["path"]: ref for ref in references(manifest)}
    selected = [(SOURCE / name, "runtime/" + name) for name in EXPORT]
    selected += [(EVF / "contracts" / name, "schemas/" + name) for name in SCHEMAS]
    for source, target in selected:
        expected = known.get(source.relative_to(REPO).as_posix())
        if not expected or digest(source) != expected["sha256"] or source.stat().st_size != expected["size_bytes"]:
            raise RuntimeError("Frozen source binding mismatch: " + str(source))
    for name in TEMPLATES:
        if not (HERE / "template" / name).is_file():
            raise RuntimeError("Missing authored template: " + name)
    KIT.mkdir()
    provenance = {"schema_version": "evf.portable-source-provenance/v1", "version": "0.1.0-candidate",
                  "upstream_candidate_payload_digest": manifest["candidate_payload_digest"],
                  "upstream_approval_inherited": False, "files": []}
    for source, target in selected:
        data = source.read_bytes()
        transform = "none"
        if target == "runtime/Cargo.toml":
            data = data.replace(b'members = ["kernel", "providers", "verifier"]', b'members = ["kernel", "verifier"]')
            data += b'\n[profile.release]\nstrip = true\n'
            transform = "Omit private reference providers from workspace; strip release binaries"
        elif target == "runtime/kernel/Cargo.toml":
            marker = b'\n[[bin]]\nname = "evf-build-reference-profiles"'
            if marker not in data:
                raise RuntimeError("Reference-generator declaration not found")
            data = data.split(marker)[0] + b'\n'
            transform = "Omit private reference-profile generator binary"
        elif target == "runtime/kernel/src/identity.rs":
            start, end = data.index(b'pub fn repository_root('), data.index(b'fn safe_repository_path(')
            data = data[:start] + data[end:]
            transform = "Remove unused private repository-auto-discovery helper; explicit-root identity verification unchanged"
        elif target == "runtime/kernel/src/lib.rs":
            data = data.replace(b"exact_ref, repository_root, verify_exact_ref", b"exact_ref, verify_exact_ref")
            transform = "Remove re-export of unused repository-auto-discovery helper"
        write(KIT / target, data)
        provenance["files"].append({"path": target, "upstream_sha256": digest(source),
                                    "export_sha256": hashlib.sha256(data).hexdigest(), "transformation": transform})
    for name in TEMPLATES:
        write(KIT / name, (HERE / "template" / name).read_bytes())
    # Normal Cargo-generated lockfile normalization after removing workspace members.
    subprocess.run(["cargo", "generate-lockfile", "--offline"], cwd=KIT / "runtime", check=True)
    # Removing an internal crate must not silently upgrade registry dependencies.
    def registry_packages(data):
        return {block.split('name = ', 1)[1].splitlines()[0]: block.strip()
                for block in data.split('[[package]]')[1:] if 'source = "registry+' in block}
    original = registry_packages((SOURCE / "Cargo.lock").read_text())
    exported = registry_packages((KIT / "runtime/Cargo.lock").read_text())
    if any(original.get(name) != block for name, block in exported.items()):
        raise RuntimeError("Offline lock normalization changed registry dependencies; review before packaging")
    for item in provenance["files"]:
        if item["path"] == "runtime/Cargo.lock":
            item["export_sha256"] = digest(KIT / item["path"])
            item["transformation"] = "Cargo offline lockfile normalization for selected workspace members"
    write(KIT / "SOURCE-PROVENANCE.json", (json.dumps(provenance, indent=2) + "\n").encode())
    # Vendor only this new directory; never delete or alter the original Cargo cache.
    subprocess.run(["cargo", "vendor", "--offline", "--locked", "--versioned-dirs", str(KIT / "vendor")],
                   cwd=KIT / "runtime", check=True)
    write(KIT / ".cargo/config.toml", b'[source.crates-io]\nreplace-with = "vendored-sources"\n\n[source.vendored-sources]\ndirectory = "vendor"\n\n[net]\noffline = true\n')
    subprocess.run([sys.executable, "build.py"], cwd=KIT, check=True)


def archive():
    manifest = json.loads((KIT / "KIT-MANIFEST.json").read_text())
    if platform.system() != "Linux" or platform.machine() != "x86_64" or manifest["platform"] != "Linux-x86_64":
        raise RuntimeError("This archive target requires Linux x86_64")
    files = [KIT / entry["path"] for entry in manifest["files"]] + [KIT / "KIT-MANIFEST.json"]
    forbidden = [b"/home/vrondelli", b"/mnt/c/Users/vlad_", b"domainspec-core", b"projects/domainspec-v2", b"cyberAlchemy-v2"]
    for path in files:
        if path.is_symlink() or not path.resolve().is_relative_to(KIT.resolve()):
            raise RuntimeError("Unsafe archive member: " + str(path))
        if any(marker in path.read_bytes() for marker in forbidden):
            raise RuntimeError("Original private locator in archive: " + str(path.relative_to(KIT)))
    for entry in manifest["files"]:
        path = KIT / entry["path"]
        if digest(path) != entry["sha256"] or path.stat().st_size != entry["size_bytes"]:
            raise RuntimeError("Kit drift before archive: " + entry["path"])
    artifacts = HERE / "artifacts"
    artifacts.mkdir(exist_ok=True)
    output = artifacts / "evf-audit-kit-0.1.0-linux-x86_64.tar.gz"
    with output.open("xb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode="w") as tar:
                for path in sorted(files):
                    info = tar.gettarinfo(str(path), arcname=ROOT_NAME + "/" + path.relative_to(KIT).as_posix())
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ""
                    info.mode = 0o755 if path.name == "evf" or path.parent.name == "bin" else 0o644
                    with path.open("rb") as stream:
                        tar.addfile(info, stream)
    checksum = digest(output)
    write(artifacts / "SHA256SUMS", (checksum + "  " + output.name + "\n").encode())
    print(json.dumps({"archive": str(output), "sha256": checksum, "size_bytes": output.stat().st_size,
                      "published": False, "product_approval": "not-inherited"}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["assemble", "archive"])
    args = parser.parse_args()
    try:
        assemble() if args.action == "assemble" else archive()
    except (OSError, RuntimeError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        print("Packaging failed: " + str(error), file=sys.stderr)
        sys.exit(2)
