#!/usr/bin/env python3
"""Bounded same-build MIR/LLVM join for the selected READY policy call.

This uses unique call multiplicity and exact enclosing LLVM symbols. It is a
candidate correspondence, not instruction identity, linker resolution, or a
complete native decision/effect proof.
"""

from __future__ import annotations

import importlib.util
import hashlib
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v9 = load("auth_v4b_intercrate_graph_v9", "auth-v4b-intercrate-graph-v9.py")
v15 = load("auth_v4b_llvm_debug_binding_v15", "auth-v4b-llvm-debug-binding-v15.py")
POLICY_SOURCE_CALL = re.compile(r"^\s*let decision = kernel::authorize\(&context\);\s*$")
META = re.compile(r"^!(\d+) = (.+)$")
LOCATION = re.compile(r"^!DILocation\(line: (\d+), column: (\d+), scope: !(\d+)(?:, .*?)?\)$")
LEXICAL_SCOPE = re.compile(r"^(?:distinct )?!DILexicalBlock(?:File)?\(scope: !(\d+),")
LEXICAL_FILE = re.compile(r"\bfile: !(\d+)(?:,|\))")
DEBUG_REF = re.compile(r"!dbg !(\d+)")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def join_selected(root_id: str, mir_graph: dict, llvm_census: dict) -> dict:
    require(mir_graph.get("status") == "pass" and
            mir_graph.get("bounded_property", {}).get("status") == "pass" and
            mir_graph.get("bounded_property", {}).get("normal_path_only") is True,
            f"{root_id}: selected MIR normal graph not established")
    require(llvm_census.get("root_id") == root_id,
            f"{root_id}: LLVM census belongs to another root")
    calls = mir_graph.get("selected_stage_native_calls", [])
    require(len(calls) == 1, f"{root_id}: selected MIR policy site not unique")
    require(calls[0].get("manifest") == v9.DECISION,
            f"{root_id}: selected MIR policy caller package changed")
    require(calls[0].get("target") == v9.v6.POLICY,
            f"{root_id}: selected MIR policy target changed")
    require(str(calls[0].get("function", "")).startswith("authorize(") and
            calls[0].get("function") == mir_graph.get("decision_function") and
            str(calls[0].get("block", "")).startswith("bb"),
            f"{root_id}: selected MIR policy caller function/block changed")
    bindings = llvm_census.get("selected_endpoint_bindings", {})
    decision = bindings.get("ready-decision", {})
    policy = bindings.get("generated-policy", {})
    require(decision.get("manifest") == v9.DECISION and
            policy.get("manifest") == v9.POLICY and
            decision.get("binding") == policy.get("binding") ==
            "attached-debug-source-definition-candidate" and
            decision.get("symbol_hex") and policy.get("symbol_hex") and
            decision["symbol_hex"] != policy["symbol_hex"],
            f"{root_id}: selected LLVM definition bindings changed")
    sites = llvm_census.get("exact_symbol_call_candidates", {})
    policy_sites = sites.get("generated-policy", [])
    require(len(policy_sites) == 1 and
            llvm_census.get("exact_symbol_candidate_counts", {}).get("generated-policy") == 1 and
            len(sites.get("ready-decision", [])) == 0,
            f"{root_id}: selected LLVM call multiplicity changed")
    site = policy_sites[0]
    require(site.get("manifest") == v9.DECISION,
            f"{root_id}: selected LLVM call is outside decision package")
    require(site.get("function_symbol_hex") == decision["symbol_hex"],
            f"{root_id}: selected LLVM call is outside bound decision definition")
    require(site.get("target_symbol_hex") == policy["symbol_hex"],
            f"{root_id}: selected LLVM call target differs from bound policy definition")
    require(site.get("opcode") in {"call", "invoke"},
            f"{root_id}: selected LLVM call has unsupported opcode")
    require(site.get("classification") == "same-symbol-local-definition-candidate" and
            isinstance(site.get("line"), int) and site["line"] > 0,
            f"{root_id}: selected LLVM call classification or position changed")
    return {
        "root_id": root_id,
        "mir_function": calls[0]["function"],
        "mir_block": calls[0]["block"],
        "llvm_caller_symbol_hex": decision["symbol_hex"],
        "llvm_target_symbol_hex": policy["symbol_hex"],
        "llvm_call_line": site["line"],
        "llvm_opcode": site["opcode"],
        "llvm_unwind_edge_closed": False,
        "correspondence": "same-build-unique-function-and-call-candidate",
        "instruction_identity_established": False,
        "linker_target_resolution": "not_established",
        "endpoint_set_closed": False,
        "all_path_ready_dominance": False,
        "runtime_guarantees_observed": False,
    }


def source_span_candidate(llvm_source: str, site: dict, decision: dict) -> dict:
    """Anchor one emitted call to its current source expression and debug scope."""
    path = v15.IMPL / decision["source"]
    raw = path.read_bytes()
    require(hashlib.sha256(raw).hexdigest() == decision["source_sha256"],
            "selected decision source changed after definition binding")
    expected = [number for number, line in enumerate(raw.decode().splitlines(), 1)
                if POLICY_SOURCE_CALL.match(line)]
    require(len(expected) == 1, "selected source policy call is not unique")
    lines = llvm_source.splitlines()
    index = site["line"] - 1
    require(0 <= index < len(lines), "selected LLVM call line outside module")
    first = lines[index]
    if site["opcode"] == "invoke":
        require(index + 1 < len(lines) and
                re.match(r"^\s+to label %\S+ unwind label %\S+", lines[index + 1]) is not None,
                "selected LLVM invoke continuation changed")
        instruction = first + "\n" + lines[index + 1]
    else:
        instruction = first
    refs = DEBUG_REF.findall("\n".join(
        v15.v13.instruction_without_comment(line) for line in instruction.splitlines()))
    require(len(refs) == 1, "selected LLVM call lacks unique debug location")
    metadata = {}
    for line in lines:
        if match := META.match(line):
            require(match.group(1) not in metadata, "duplicate LLVM debug metadata ID")
            metadata[match.group(1)] = match.group(2)
    location = metadata.get(refs[0], "")
    require("inlinedAt:" not in location, "selected LLVM call has inlined provenance")
    match = LOCATION.match(location)
    require(match is not None and int(match.group(1)) == expected[0] and
            int(match.group(2)) > 0,
            "selected LLVM debug location differs from source policy call")
    scope = match.group(3)
    seen = set()
    while scope != decision["debug_id"]:
        require(scope not in seen, "selected LLVM debug scope cycle")
        seen.add(scope)
        node = metadata.get(scope, "")
        parent = LEXICAL_SCOPE.match(node)
        require(parent is not None,
                "selected LLVM debug scope does not reach decision definition: " +
                repr((scope, node[:180])))
        file = LEXICAL_FILE.search(node)
        require(file is not None and file.group(1) == decision["debug_file_id"],
                "selected LLVM lexical scope file differs from decision source")
        scope = parent.group(1)
    return {"source_call_line": expected[0], "llvm_debug_location_id": refs[0],
            "source_span_binding": "current-source-debug-location-candidate"}


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    graph = v9.inspect(root_id, mir, identities)
    census = v15.inspect(root_id, mir, llvm, identities)
    joined = join_selected(root_id, graph, census)
    site = census["exact_symbol_call_candidates"]["generated-policy"][0]
    decision = census["selected_endpoint_bindings"]["ready-decision"]
    joined.update(source_span_candidate(llvm[v9.DECISION], site, decision))
    return {"selected_graph_inspection": graph,
            "llvm_direct_symbol_inspection": census,
            "selected_join": joined,
            "endpoint_set_closed": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    base = v15.v13.v7.evaluate(llvm_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-selected-mir-llvm-join/v16-candidate",
            "status": "indeterminate", "root_context": base,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "In each same-build selected root, the one MIR policy call in READY-decision authorize has one exact-symbol LLVM call candidate inside the debug-bound READY-decision definition, targeting the debug-bound generated policy symbol. This uniqueness does not prove instruction identity, linker-selected target, all native endpoints/effects, all-path READY dominance, or runtime guarantees."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
