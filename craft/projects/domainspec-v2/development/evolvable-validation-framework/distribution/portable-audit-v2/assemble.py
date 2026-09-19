#!/usr/bin/env python3
"""Layer a new candidate onto the immutable tested 0.1.0 archive; no original-source edits."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import runpy
import tarfile
import sys

HERE = Path(__file__).resolve().parent
KIT = HERE / "kit"
BASE = HERE.parent / "portable-audit-v1/artifacts/evf-audit-kit-0.1.0-linux-x86_64.tar.gz"
BASE_SHA = "e13b7436bdca93ff9028bce90453f6f61f5994aef1f72bcef80db3600cfeeb5e"
FILES = ["evf", "formal.py", "TOOLCHAINS.json", "README.md", "adapters/common.py", "adapters/driver.py", "adapters/graph.py",
         "adapters/cbmc.py", "adapters/lean_adapter.py", "tests/test_formal.py", "formal-example/Pair.lean", "formal-example/BadPair.lean",
         "formal-example/pair.c", "formal-example/bad-pair.c", "formal-example/graph.json", "formal-example/bad-graph.json",
         "formal-example/audit.json", "formal-example/obligation.md", "formal-example/souffle-positive.json", "formal-example/souffle-negative.json",
         "formal-example/alloy-positive.json", "formal-example/alloy-negative.json", "formal-example/cbmc-positive.json", "formal-example/cbmc-negative.json",
         "formal-example/lean-positive.json", "formal-example/lean-negative.json", "tests/test_formal_live.py", "check_examples.py", "FORMAL-CLAIM.md"]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def prepare():
    if KIT.exists():
        raise RuntimeError("New candidate requires an absent kit directory; preserve existing work")
    if sha(BASE) != BASE_SHA:
        raise RuntimeError("Original archive changed")
    for name in FILES:
        if not (HERE / "template" / name).is_file():
            raise RuntimeError("Missing template: " + name)
    KIT.mkdir()
    with tarfile.open(BASE) as archive:
        for member in archive.getmembers():
            parts = Path(member.name).parts
            if not member.isfile() or parts[0] != "evf-audit-kit-0.1.0" or ".." in parts:
                raise RuntimeError("Unsafe original archive member")
            target = KIT.joinpath(*parts[1:])
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open("xb") as stream:
                stream.write(archive.extractfile(member).read())
            target.chmod(member.mode)
    core = (KIT / "evf").read_text()
    core = core.replace("def freeze(root, spec_name):", 'def freeze(root, spec_name, route="executable"):')
    core = core.replace('"subject": spec["subject"], "route": "executable",', '"subject": spec["subject"], "route": route,')
    with (KIT / "evf_core.py").open("x") as stream:
        stream.write(core)
    (KIT / "README.md").rename(KIT / "CORE-README.md")
    for name in FILES:
        target = KIT / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((HERE / "template" / name).read_bytes())
    (KIT / "evf").chmod(0o755)
    build = KIT / "build.py"
    build.write_text(build.read_text().replace('"0.1.0-candidate"', '"0.2.0-candidate"'))
    provenance = json.loads((KIT / "SOURCE-PROVENANCE.json").read_text())
    provenance.update(version="0.2.0-candidate", portable_base_archive_sha256=BASE_SHA,
                      portable_extension="Four adapters, type/axiom-aware Lean route, and raw-evidence-bound formal claims; Rust binaries and sources unchanged")
    (KIT / "SOURCE-PROVENANCE.json").write_text(json.dumps(provenance, indent=2) + "\n")
    runpy.run_path(str(build))["manifest"]()
    print("Prepared 0.2.0 candidate; validate before archiving")

def archive():
    import subprocess
    subprocess.run([sys.executable, "-B", str(KIT / "check_examples.py")], cwd=KIT, check=True)
    manifest = json.loads((KIT / "KIT-MANIFEST.json").read_text())
    if manifest["version"] != "0.2.0-candidate":
        raise RuntimeError("Manifest version mismatch")
    entries = manifest["files"] + [{"path": "KIT-MANIFEST.json", "sha256": sha(KIT / "KIT-MANIFEST.json"), "size_bytes": (KIT / "KIT-MANIFEST.json").stat().st_size}]
    forbidden = [b"/home/vrondelli", b"/mnt/c/Users/vlad_", b"domainspec-core", b"projects/domainspec-v2", b"cyberAlchemy-v2"]
    for item in entries:
        path = KIT / item["path"]
        if path.is_symlink() or not path.resolve().is_relative_to(KIT) or sha(path) != item["sha256"] or path.stat().st_size != item["size_bytes"]:
            raise RuntimeError("Artifact drift or unsafe archive entry: " + item["path"])
        if any(marker in path.read_bytes() for marker in forbidden):
            raise RuntimeError("Private locator found: " + item["path"])
    output_dir = HERE / "artifacts"
    output_dir.mkdir(exist_ok=True)
    output = output_dir / "evf-audit-kit-0.2.0-linux-x86_64.tar.gz"
    with output.open("xb") as stream:
        with gzip.GzipFile(filename="", mode="wb", fileobj=stream, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode="w") as tar:
                for item in sorted(entries, key=lambda i: i["path"]):
                    path = KIT / item["path"]
                    info = tar.gettarinfo(str(path), arcname="evf-audit-kit-0.2.0/" + item["path"])
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ""
                    info.mode = 0o755 if item["path"] == "evf" or item["path"].startswith("bin/") else 0o644
                    with path.open("rb") as source:
                        tar.addfile(info, source)
    checksum = sha(output)
    with (output_dir / "SHA256SUMS").open("x") as stream:
        stream.write(checksum + "  " + output.name + "\n")
    print(json.dumps({"archive": str(output), "sha256": checksum, "size_bytes": output.stat().st_size, "published": False}, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "archive"])
    args = parser.parse_args()
    try:
        prepare() if args.action == "prepare" else archive()
    except (OSError, RuntimeError, ValueError, KeyError) as error:
        print("Packaging failed: " + str(error), file=sys.stderr)
        sys.exit(2)
