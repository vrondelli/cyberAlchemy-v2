#!/usr/bin/env python3
"""Compiled selected-root identity-swap control for the unselected V11 ledger.

The actual API Cargo closure is mirrored into a temporary directory. Only the
mirror's READY authority command projection is changed. This tests detection,
not cross-crate execution or the owner-wide no-call guarantee.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent
IMPL = CASE.parents[2] / "implementation"
AUTHORITY = "authorization-ready-authority/src/lib.rs"
MARKER = "let command = AuthorizationCommand {\n        request_id: request.request_id.clone(),"
MUTANT = "let command = AuthorizationCommand {\n        request_id: request.route_id.clone(),"
AUTHORITY_MANIFEST = "authorization-ready-authority/Cargo.toml"


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v29 = load("auth_v29_for_v31", CASE / "auth-v4b-selected-root-overlay-v29.py")
v11 = load("auth_v11_for_v31", IMPL / "scripts/validate-current-evidence-successor-v11.py")


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def mutate(implementation: Path) -> str:
    path = implementation / AUTHORITY
    source = path.read_text()
    require(source.count(MARKER) == 1, "selected authority command source changed")
    path.write_text(source.replace(MARKER, MUTANT, 1))
    return v29.sha(path.read_bytes())


def wrong_request_projection(mir: str) -> dict:
    """Inspect the compiled command's def-use chain, independently of V11."""
    functions = v11.authority_mir_instrument().v5.functions(mir)
    matches = [(name, body) for name, body in functions.items()
               if name.startswith("with_ready_in_transaction(")]
    require(len(matches) == 1, "compiled authority body ambiguous")
    body = matches[0][1]
    chain = (
        r"_53 = &\(\(\*_2\)\.2: std::string::String\);",
        r"_52 = <String as Clone>::clone\(move _53\) ->",
        r"_51 = auth_foundation_authorization_state_model::AuthorizationCommand \{ request_id: move _52,",
    )
    positions = []
    for pattern in chain:
        found = list(re.finditer(pattern, body))
        require(len(found) == 1, f"compiled wrong-request projection missing: {pattern[:28]}")
        positions.append(found[0].start())
    require(positions == sorted(positions), "compiled wrong-request projection order changed")
    require(not re.search(r"_53 = &\(\(\*_2\)\.0: std::string::String\);", body),
            "compiled command still reads request ID")
    return {"route_id_field_projection_to_command": True,
            "request_id_field_projection_to_command": False,
            "authority_mir_sha256": v29.sha(mir.encode())}


def evaluate() -> dict:
    root_id = "api"
    root_manifest = v29.v6.ROOT_MANIFESTS[root_id]
    inventory, _ = v29.v7.current_inventory()
    metadata, _ = v29.v7.root_metadata(root_id, root_manifest)
    manifests = v29.package_manifests(root_id, metadata)
    files = v29.selected_files(manifests)
    before = v29.snapshot(files)
    require(AUTHORITY in before and AUTHORITY_MANIFEST in before,
            "authority source or manifest absent from selected API closure")
    relative_manifests = sorted(inventory["selected_root_package_manifests"][root_id])
    require(set(relative_manifests) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                                      for path in manifests},
            "selected compiled package missing from mirror plan")
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v31-api-identity-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, files)
            require({relative: v29.sha((implementation / relative).read_bytes())
                     for relative in before} == before,
                    "clean selected-root mirror differs from original")
            observed = {}

            def clean_inspector(root: str, mir: dict[str, str], identities: dict) -> dict:
                require(root == root_id and AUTHORITY_MANIFEST in identities,
                        "clean selected authority artifact absent")
                witness = v11.authority_identity_witness(mir[AUTHORITY_MANIFEST])
                observed["clean_selected_root_authority_mir_sha256"] = witness["mir_sha256"]
                return witness

            def hostile_inspector(root: str, mir: dict[str, str], identities: dict) -> dict:
                require(root == root_id and AUTHORITY_MANIFEST in identities,
                        "hostile selected authority artifact absent")
                authority_mir = mir[AUTHORITY_MANIFEST]
                observed.update(wrong_request_projection(authority_mir))
                require(observed["authority_mir_sha256"] !=
                        observed["clean_selected_root_authority_mir_sha256"],
                        "hostile compiled authority MIR did not change")
                try:
                    v11.authority_identity_witness(authority_mir)
                except ValueError as error:
                    require("authority request/epoch READY transfer changed" in str(error),
                            f"hostile compiled authority rejected at wrong boundary: {error}")
                    observed["v11_rejection"] = "authority request/epoch READY transfer changed"
                else:
                    raise ValueError("compiled identity swap passed V11 authority witness")
                return {"status": "indeterminate", "identity_swap_rejected": True}

            with v29.overlay_modules(implementation):
                v29.v7.capture_root(root_id, root_manifest, relative_manifests,
                                    directory / "clean-target", inventory,
                                    mir_inspector=clean_inspector)
                mutant_sha = mutate(implementation)
                v29.v7.capture_root(root_id, root_manifest, relative_manifests,
                                    directory / "hostile-target", inventory,
                                    mir_inspector=hostile_inspector)
            require(observed.get("v11_rejection"), "hostile selected-root check not executed")
            return {"schema_version": "auth-foundation.v4b-ready-identity-overlay/v31-candidate",
                    "status": "indeterminate", "root_id": root_id,
                    "clean_selected_root_compiled": True,
                    "hostile_selected_root_compiled": True,
                    "mutant_source_sha256": mutant_sha,
                    **observed,
                    "endpoint_set_closed": False, "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False,
                    "claim_limit": "Selected API-root compiled identity-swap detection only; no cross-crate execution proof, every-native-entrypoint no-call observation, or V11 selection."}
    finally:
        after_files = v29.selected_files(manifests)
        require(after_files == files and v29.snapshot(after_files) == before,
                "original selected source/Cargo/lock/SQL path or byte drift")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.parse_args()
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
