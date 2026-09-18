"""Disposable installation proof; registry access requires --allow-network."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from stage_runtime import ROOT, stage

parser = argparse.ArgumentParser()
parser.add_argument("--allow-network", action="store_true")
args = parser.parse_args()
subprocess.run([sys.executable, str(ROOT / "scripts/test_stage_runtime.py")], check=True)

with tempfile.TemporaryDirectory(prefix="keld-portable-") as temp:
    target = Path(temp) / "runtime"
    manifest = stage(target)
    for name, expected in manifest["files"].items():
        assert hashlib.sha256((target / name).read_bytes()).hexdigest() == expected["sha256"]
    assert not any("domainspec-core" in (target / "integrations" / name).read_text()
                   for name in ("package.json", "package-lock.json"))
    try:
        stage(target)
        raise AssertionError("existing output accepted")
    except ValueError:
        pass
    app = target / "integrations"
    subprocess.run(["npm", "ci", *(["--prefer-offline"] if args.allow_network else ["--offline"]),
                    "--ignore-scripts", "--install-links",
                    "--no-audit", "--no-fund"], cwd=app, check=True)
    installed = app / "node_modules/@auth-foundation/session-core"
    assert not installed.is_symlink()
    for source in (app / "vendor/session-core/src").iterdir():
        assert source.read_bytes() == (installed / "src" / source.name).read_bytes()
    # Tests are separate verification inputs, not shipped runtime contents.
    shutil.copytree(ROOT / "test", app / "test",
                    ignore=shutil.ignore_patterns("__pycache__"))
    tests = sorted(str(p.relative_to(app)) for p in (app / "test").glob("*.test.mjs"))
    subprocess.run(["node", "--test", "--test-timeout=30000", *tests], cwd=app, check=True)
    subprocess.run(["npm", "prune", "--omit=dev", "--offline", "--ignore-scripts",
                    "--no-audit", "--no-fund"], cwd=app, check=True)
    assert not (app / "node_modules/nock").exists()
    subprocess.run(["node", "--input-type=module", "-e",
                    "await import('./src/index.mjs'); await import('./src/runtime.mjs');"
                    "await import('@auth-foundation/session-core');"], cwd=app, check=True)
    print(json.dumps({"portableInstall": "passed", "manifestFiles": len(manifest["files"]),
                      "siblingCheckoutRequiredAtRuntime": False}))
