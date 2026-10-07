#!/usr/bin/env python3
"""Run the historical W5 workflow in an isolated old-layout copy with a new identity."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys

from verify_source_bridge import BINDING, REPOSITORY, W5, expected_binding


HERE = Path(__file__).resolve().parent
OLD_W5_PATH = Path("projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001")
REQUIRED_ENV = ("AUTH_EVF_BIN", "AUTH_ZIG_BINARY", "CARGO_TARGET_DIR", "ELAN_HOME", "TMPDIR")


def patch_profiles(w5: Path, lean_home: str, scratch: str) -> None:
    for name in ("profile.json", "theorem-profile.json"):
        path = w5 / "evf" / name
        profile = json.loads(path.read_text(encoding="utf-8"))
        for check in profile["checks"]:
            environment = check["runtime"]["environment"]
            environment["ELAN_HOME"] = lean_home
            environment["TMPDIR"] = scratch
        path.write_text(json.dumps(profile, sort_keys=True, indent=2) + "\n", encoding="utf-8")


def add_adapter_refs(complete, candidate: dict) -> dict:
    payload = {key: value for key, value in candidate.items() if key != "candidate_digest"}
    payload["refs"] = sorted(
        [*payload["refs"], complete.ref(HERE / "run_replay.py"), complete.ref(HERE / "binding.json")],
        key=lambda item: (item["location"], item["path"]),
    )
    payload["scope"] += " Versioned standalone replay adapter and exact source bridge are bound."
    return {**payload, "candidate_digest": hashlib.sha256(complete.canonical(payload)).hexdigest()}


def load_complete(w5: Path):
    sys.path.insert(0, str(w5))
    spec = importlib.util.spec_from_file_location("auth_w5_standalone_complete", w5 / "complete.py")
    if spec is None or spec.loader is None:
        raise ValueError("cannot load isolated W5 completion script")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", required=True, help="existing isolated copy with projects/auth-foundation and projects/domainspec-v2")
    args = parser.parse_args()
    workspace = Path(args.workspace).resolve()
    if workspace == REPOSITORY or workspace.is_relative_to(REPOSITORY):
        raise ValueError("standalone replay workspace must be outside the source checkout")
    w5 = workspace / OLD_W5_PATH
    copied_script = w5 / "complete.py"
    if not (workspace / ".git").exists() or not (w5 / "compiler-snapshot/node_modules/tsx/dist/loader.mjs").is_file():
        raise ValueError("isolated old-layout copy lacks the repository marker or tsx loader")
    if copied_script.read_bytes() != (W5 / "complete.py").read_bytes():
        raise ValueError("isolated historical completion script differs from source")
    if json.loads(BINDING.read_text(encoding="utf-8")) != expected_binding():
        raise ValueError("standalone source bridge is not current")
    for name in REQUIRED_ENV:
        if not os.environ.get(name):
            raise ValueError(f"missing isolated replay environment: {name}")
    if not Path(os.environ["TMPDIR"]).is_dir() or not Path(os.environ["ELAN_HOME"]).is_dir():
        raise ValueError("isolated temporary or Lean home directory is absent")
    if not Path(os.environ["AUTH_ZIG_BINARY"]).is_file():
        raise ValueError("isolated Zig binary is absent")
    if any(not (Path(os.environ["AUTH_EVF_BIN"]) / name).is_file()
           for name in ("evf-run", "evf-independent-verifier", "evf-provider-lean")):
        raise ValueError("isolated EVF binary set is incomplete")
    complete = load_complete(w5)
    original_construct = complete.construct
    original_candidate = complete.frozen_candidate

    def construct_with_environment():
        original_construct()
        patch_profiles(w5, os.environ["ELAN_HOME"], os.environ["TMPDIR"])

    complete.construct = construct_with_environment
    complete.frozen_candidate = lambda: add_adapter_refs(complete, original_candidate())
    complete.main()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "non-pass", "reason": str(error), "authority_effect": "none"}))
        raise SystemExit(1)
