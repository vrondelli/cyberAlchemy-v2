"""Stage an allowlisted private KELD runtime; never copy operator state."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
AUTH = ROOT.parents[2] / "domainspec-core/projects/auth-foundation/implementation/session-core"


def stage(destination):
    destination = Path(destination).absolute()
    if destination.exists() or destination.is_symlink():
        raise ValueError("destination must not exist")
    files = {}
    def add(source, target):
        source = Path(source)
        if source.is_symlink() or not source.is_file():
            raise ValueError("only regular source files may be staged")
        files[target] = source.read_bytes()
    def tree(source, target, extensions):
        if source.is_symlink():
            raise ValueError("source directory must not be a symlink")
        for child in sorted(source.rglob("*")):
            if child.is_symlink():
                raise ValueError("source tree contains a symlink")
            if child.is_file() and child.suffix in extensions:
                add(child, str(Path(target) / child.relative_to(source)))
    for folder, extensions in [("src", {".mjs"}), ("bin", {".mjs"}),
                               ("public", {".mjs", ".html", ".css"})]:
        tree(ROOT / folder, "integrations/" + folder, extensions)
    add(ROOT / "config.example.json", "integrations/config.example.json")
    for name in ("sdk_bridge.py", "ledger.py", "delivery.py"):
        add(ROOT.parent / "commerce" / name, "commerce/" + name)
    for name in ("package.json", "README.md", "contract.json"):
        add(AUTH / name, "integrations/vendor/session-core/" + name)
    tree(AUTH / "src", "integrations/vendor/session-core/src", {".mjs", ".ts"})
    # Preserve any source-owned notices without inventing a commercial license.
    for source, target in [(ROOT, "integrations"), (AUTH, "integrations/vendor/session-core")]:
        for child in source.iterdir():
            if child.name.upper().startswith(("LICENSE", "NOTICE", "COPYING")):
                add(child, target + "/" + child.name)
    package = json.loads((ROOT / "package.json").read_text())
    lock = json.loads((ROOT / "package-lock.json").read_text())
    name = "@auth-foundation/session-core"
    reference = "file:vendor/session-core"
    package["dependencies"][name] = reference
    # Test/build tooling remains in the checkout, not the deployment candidate.
    package["scripts"] = {k: v for k, v in package["scripts"].items()
                          if not k.startswith("test") and k != "stage-runtime"}
    lock["packages"][""]["dependencies"][name] = reference
    lock["packages"]["node_modules/" + name]["resolved"] = reference
    for name, value in [("package.json", package), ("package-lock.json", lock)]:
        files["integrations/" + name] = (json.dumps(value, indent=2) + "\n").encode()
    files["README.md"] = (
        "# Private KELD sandbox runtime candidate\n\n"
        "Install from integrations with npm ci --omit=dev --ignore-scripts --install-links.\n"
        "Then run npm run check-config -- /private/config.json before npm start.\n"
        "Node 26.8.1 and Python 3.14 were used for local verification.\n"
        "No credentials, database, TLS key or ARE release is included.\n"
        "This is not a production or redistribution approval.\n\n"
        "## Open Questions\n\n"
        "License/release approval, merchant/issuer proof and operations remain owned\n"
        "by the source checkout's keld-project/docs/SDK-INTEGRATION.md.\n"
    ).encode()
    manifest = {"schema": "keld-private-runtime/v1", "status": "sandbox-candidate",
                "files": {name: {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                          for name, data in sorted(files.items())}}
    destination.mkdir(mode=0o700)
    try:
        for name, data in files.items():
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        (destination / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    except BaseException:
        shutil.rmtree(destination)
        raise
    return manifest


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: stage_runtime.py NEW_DESTINATION")
    manifest = stage(sys.argv[1])
    print(json.dumps({"status": manifest["status"], "files": len(manifest["files"])}))
