#!/usr/bin/env python3
"""Rebuild this source distribution offline, without modifying original EVF sources."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def files():
    for path in sorted(ROOT.rglob("*")):
        relative = path.relative_to(ROOT)
        if relative.parts[:2] == ("runtime", "target") or "__pycache__" in relative.parts:
            continue
        if path.is_symlink():
            raise RuntimeError("Symlink is not permitted in the distribution: " + str(relative))
        if path.is_file() and relative.as_posix() != "KIT-MANIFEST.json":
            yield path


def manifest():
    result = {"schema_version": "evf.portable-kit-manifest/v1", "version": "0.1.0-candidate",
              "platform": platform.system() + "-" + platform.machine(),
              "source_provenance": "SOURCE-PROVENANCE.json", "product_approval": "not-inherited",
              "files": []}
    for path in files():
        data = path.read_bytes()
        result["files"].append({"path": path.relative_to(ROOT).as_posix(),
                                "sha256": hashlib.sha256(data).hexdigest(), "size_bytes": len(data)})
    temporary = ROOT / "KIT-MANIFEST.json.new"
    with temporary.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, ROOT / "KIT-MANIFEST.json")


def main():
    if platform.system() != "Linux":
        raise RuntimeError("The current EVF runner requires Linux")
    cargo = shutil.which("cargo")
    rustc = shutil.which("rustc")
    if not cargo or not rustc:
        raise RuntimeError("Install Rust/Cargo before rebuilding. The supplied binaries do not require Rust.")
    environment = dict(os.environ)
    # Build-time path remapping avoids embedding this workspace's original path.
    environment["RUSTFLAGS"] = "--remap-path-prefix=" + str(ROOT) + "=/evf-kit"
    cargo_directory = Path(os.environ.get("CARGO_HOME", str(Path.home() / ".cargo"))).resolve()
    environment["RUSTFLAGS"] += " --remap-path-prefix=" + str(cargo_directory) + "=/cargo-home"
    environment.pop("CARGO_ENCODED_RUSTFLAGS", None)
    environment.pop("CARGO_TARGET_DIR", None)
    environment.pop("RUSTC_WRAPPER", None)
    environment.pop("RUSTC_WORKSPACE_WRAPPER", None)
    subprocess.run([cargo, "test", "--locked", "--offline", "--workspace"], cwd=ROOT / "runtime", env=environment, check=True)
    subprocess.run([cargo, "build", "--locked", "--offline", "--release", "--workspace", "--bins"],
                   cwd=ROOT / "runtime", env=environment, check=True)
    (ROOT / "bin").mkdir(exist_ok=True)
    for name in ("evf-run", "evf-independent-verifier"):
        source = ROOT / "runtime/target/release" / name
        temporary = ROOT / "bin" / (name + ".new")
        if temporary.exists() or temporary.is_symlink():
            raise RuntimeError("Incomplete prior build exists: " + str(temporary))
        shutil.copyfile(source, temporary)
        temporary.chmod(0o755)
        os.replace(temporary, ROOT / "bin" / name)
    (ROOT / "evf").chmod(0o755)
    versions = {"schema_version": "evf.portable-build/v1", "platform": platform.system() + "-" + platform.machine(),
                "rustc": subprocess.check_output([rustc, "--version"], text=True).strip(),
                "cargo": subprocess.check_output([cargo, "--version"], text=True).strip(),
                "dependency_mode": "locked-offline-vendored", "product_approval": "not-inherited"}
    (ROOT / "BUILD.json").write_text(json.dumps(versions, indent=2) + "\n", encoding="utf-8")
    manifest()
    print("Offline build and Rust tests completed. Run ./evf doctor and python3 tests/test_cli.py.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        print("Build failed: " + str(error), file=sys.stderr)
        sys.exit(2)
