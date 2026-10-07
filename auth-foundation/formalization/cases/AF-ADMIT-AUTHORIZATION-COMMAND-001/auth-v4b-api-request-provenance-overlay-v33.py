#!/usr/bin/env python3
"""Compiled selected-API-root request corruption control for V32.

Only a temporary copy of the selected Cargo closure is changed. The hostile
worker clones route_id into request_id before calling with_ready. A compiled
MIR witness establishes that mutation independently of V32's rejection.
This is detection evidence, not a no-call or cross-crate execution proof.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
import tempfile
from pathlib import Path

CASE = Path(__file__).resolve().parent
SOURCE = "authorization-api/src/lib.rs"
MARKER = "match engine.with_ready(request, authorize_ready_decision) {"
MUTATION = ("let mut request = request;\n"
            "                request.request_id = request.route_id.clone();\n"
            "                " + MARKER)


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v29 = load("auth_v29_for_v33", "auth-v4b-selected-root-overlay-v29.py")
v32 = load("auth_v32_for_v33", "auth-v4b-same-request-handoff-v32.py")
v9 = v32.v9


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def mutate(implementation: Path) -> str:
    path = implementation / SOURCE
    source = path.read_text()
    require(source.count(MARKER) == 1, "selected API worker source changed")
    path.write_text(source.replace(MARKER, MUTATION, 1))
    return v29.sha(path.read_bytes())


def wrong_request_witness(body: str, call_block: str) -> dict:
    """Fail closed on the observed route-ID clone/write/call normal-MIR chain."""
    blocks = v9.v5.blocks(body)
    graph = v9.v8.normal_successors(body, blocks)
    required = (
        ("bb0", r"_2 = move \(_1\.0: auth_foundation_authorization_state_model::InboundAuthorizationRequest\);"),
        ("bb0", r"_4 = &\(_2\.2: std::string::String\);"),
        ("bb0", r"_3 = <std::string::String as Clone>::clone\(move _4\) -> \[return: bb1,"),
        ("bb1", r"drop\(\(_2\.0: std::string::String\)\) -> \[return: bb2,"),
        ("bb2", r"\(_2\.0: std::string::String\) = move _3;"),
        ("bb2", r"_6 = move _2;"),
        ("bb2", r"_7 = auth_foundation_authorization_ready_decision::authorize as "),
        ("bb2", r"_5 = SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>\(copy _11, move _6, move _7\) ->"),
    )
    for block, pattern in required:
        require(block in blocks and len(re.findall(pattern, blocks[block])) == 1 and
                sum(len(re.findall(pattern, content)) for content in blocks.values()) == 1,
                f"compiled wrong-request chain changed: {block}:{pattern[:35]}")
    require(call_block == "bb2" and
            v9.v8.reachable(graph, "bb0", call_block) and
            not v9.v8.reachable(graph, "bb0", call_block, excluded="bb1"),
            "compiled wrong-request chain not on selected normal call path")
    return {"route_id_cloned_into_request_id": True,
            "mutated_request_passed_to_with_ready": True,
            "normal_path_through_clone_and_write": True}


def evaluate() -> dict:
    root_id = "api"
    manifest = v9.v6.ROOT_MANIFESTS[root_id]
    inventory, _ = v29.v7.current_inventory()
    metadata, _ = v29.v7.root_metadata(root_id, manifest)
    manifests = v29.package_manifests(root_id, metadata)
    files = v29.selected_files(manifests)
    before = v29.snapshot(files)
    require(SOURCE in before and manifest in before,
            "selected API source or manifest absent from closure")
    relative_manifests = sorted(inventory["selected_root_package_manifests"][root_id])
    require(set(relative_manifests) <= {str(path.relative_to(v29.ORIGINAL_IMPL))
                                      for path in manifests},
            "selected compiled package missing from mirror plan")
    try:
        with tempfile.TemporaryDirectory(prefix="auth-v33-api-provenance-") as temporary:
            directory = Path(temporary)
            implementation = directory / "implementation"
            v29.mirror(implementation, manifests, files)
            require({relative: v29.sha((implementation / relative).read_bytes())
                     for relative in before} == before,
                    "clean selected-root mirror differs from original")
            observed = {}

            def clean_inspector(root: str, mir: dict[str, str], identities: dict) -> dict:
                result = v32.inspect(root, mir, identities)
                require(result["normal_mir_argument_join"] and
                        result["cross_body_execution_proven"] is False,
                        "clean V32 selected-root baseline changed")
                observed["clean_root_mir_sha256"] = identities[manifest]["mir_sha256"]
                return result

            def hostile_inspector(root: str, mir: dict[str, str], identities: dict) -> dict:
                require(root == root_id and manifest in mir and manifest in identities,
                        "hostile selected API MIR absent")
                handoff = v9.root_handoff(root, mir[manifest])
                observed.update(wrong_request_witness(
                    handoff["parsed_functions"][handoff["function"]], handoff["block"]))
                observed["hostile_root_mir_sha256"] = identities[manifest]["mir_sha256"]
                require(observed["hostile_root_mir_sha256"] !=
                        observed["clean_root_mir_sha256"],
                        "hostile selected-root MIR did not change")
                prior = v9.inspect(root, mir, identities)
                require(prior["bounded_property"]["status"] == "pass",
                        "hostile predecessor graph failed before V32")
                try:
                    v32.inspect(root, mir, identities)
                except ValueError as error:
                    require(str(error) == "api: captured inbound request source changed",
                            f"hostile selected-root V32 rejection changed: {error}")
                    observed["v32_rejection"] = str(error)
                else:
                    raise ValueError("compiled request corruption passed V32")
                return {"status": "indeterminate", "request_corruption_rejected": True}

            with v29.overlay_modules(implementation):
                v29.v7.capture_root(root_id, manifest, relative_manifests,
                                    directory / "clean-target", inventory,
                                    mir_inspector=clean_inspector)
                mutant_sha = mutate(implementation)
                v29.v7.capture_root(root_id, manifest, relative_manifests,
                                    directory / "hostile-target", inventory,
                                    mir_inspector=hostile_inspector)
            require(observed.get("v32_rejection"), "hostile selected-root check not executed")
            return {"schema_version": "auth-foundation.v4b-api-request-provenance-overlay/v33-candidate",
                    "status": "indeterminate", "root_id": root_id,
                    "clean_selected_root_compiled": True,
                    "hostile_selected_root_compiled": True,
                    "mutant_source_sha256": mutant_sha, **observed,
                    "endpoint_set_closed": False, "all_path_ready_dominance": False,
                    "runtime_guarantees_observed": False,
                    "claim_limit": "Selected API-root compiled upstream request-corruption detection only; V32 rejects a changed MIR topology, not semantic request equality or owner-wide no-call."}
    finally:
        after_files = v29.selected_files(manifests)
        require(after_files == files and v29.snapshot(after_files) == before,
                "original selected source/Cargo/lock/SQL path or byte drift")


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
