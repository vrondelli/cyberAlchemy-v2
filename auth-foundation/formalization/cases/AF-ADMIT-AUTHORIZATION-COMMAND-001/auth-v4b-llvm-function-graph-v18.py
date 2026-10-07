#!/usr/bin/env python3
"""Name-independent compiled-local function and conservative call graph census.

Only same-module noninterposable direct edges are treated as definite. A
cross-module same-symbol edge is a candidate; opaque calls may re-enter any
local body. This is discovery evidence, never an endpoint closure certificate.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_llvm_debug_binding_v15", CASE / "auth-v4b-llvm-debug-binding-v15.py")
assert SPEC and SPEC.loader
v15 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v15)
v13 = v15.v13
IMPL = v15.IMPL

ROOTS = {
    "api": (("api-http-authorize", "authorization-api/Cargo.toml",
             "authorization-api/src/lib.rs", "async fn authorize"),
            ("api-runtime-authorize", "authorization-api/Cargo.toml",
             "authorization-api/src/lib.rs", "pub async fn authorize")),
    "tenant": (("tenant-bridge-evaluate", "tenant-bridge/Cargo.toml",
                "tenant-bridge/src/main.rs", "fn evaluate"),),
    "prototype": (("prototype-bridge-evaluate", "authentication-prototype/bridge/Cargo.toml",
                   "authentication-prototype/bridge/src/main.rs", "fn evaluate"),),
    "https": (("https-bridge-evaluate", "authentication-https/bridge/Cargo.toml",
               "authentication-https/bridge/src/main.rs", "fn evaluate"),),
}
OPAQUE = {"alias-unresolved", "duplicate-definition-unresolved",
          "declaration-or-external-unresolved", "indirect", "unparsed-or-callbr"}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def bind_root(endpoint_id: str, manifest: str, relative_source: str,
              declaration: str, llvm: dict[str, str], definitions: dict) -> dict:
    """Bind an exact current declaration to attached compiler debug metadata."""
    require(manifest in llvm, f"{endpoint_id}: selected LLVM module missing")
    source = (IMPL / relative_source).resolve()
    raw = source.read_bytes()
    lines = raw.decode().splitlines()
    pattern = re.compile(r"^\s*" + re.escape(declaration) + r"\s*\(")
    matching = [number for number, line in enumerate(lines, 1) if pattern.match(line)]
    require(len(matching) == 1, f"{endpoint_id}: source declaration ambiguous")
    name = declaration.split()[-1]
    files = {}
    subprograms = []
    for line in llvm[manifest].splitlines():
        if match := v15.DI_FILE.match(line):
            identifier, filename, directory, checksum = match.groups()
            require(identifier not in files, f"{endpoint_id}: duplicate DIFile id")
            files[identifier] = ((Path(directory) / filename).resolve(), checksum)
        if match := v15.DI_SUBPROGRAM.match(line):
            identifier, observed_name, linkage, file_id, source_line = match.groups()
            if observed_name == name and int(source_line) == matching[0]:
                subprograms.append((identifier, linkage, file_id))
    bound = [(identifier, linkage, file_id) for identifier, linkage, file_id in subprograms
             if file_id in files and files[file_id][0] == source and
             files[file_id][1] == hashlib.md5(raw).hexdigest()]
    require(len(bound) == 1, f"{endpoint_id}: attached current-source debug binding ambiguous")
    identifier, linkage, file_id = bound[0]
    require(re.fullmatch(r"[A-Za-z0-9_.$-]+", linkage) is not None,
            f"{endpoint_id}: unparsed linkage name")
    symbol = v13.symbol_hex("@" + linkage)
    candidates = definitions.get(symbol, [])
    require(len(candidates) == 1 and candidates[0]["manifest"] == manifest and
            candidates[0]["debug_id"] == identifier,
            f"{endpoint_id}: attached unique definition missing")
    return {"endpoint_id": endpoint_id, "manifest": manifest,
            "source": relative_source, "source_line": matching[0],
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "debug_id": identifier, "debug_file_id": file_id,
            "symbol_hex": symbol}


def graph(root_id: str, definitions: dict[str, list[dict]], sites: list[dict],
          seeds: list[dict]) -> dict:
    """Retain all local definitions; traverse only conservative direct edges."""
    all_rows = [dict(row) for rows in definitions.values() for row in rows]
    require(len(all_rows) == len({(row["manifest"], row["symbol_hex"])
                                  for row in all_rows}),
            f"{root_id}: duplicate local definition identity")
    by_key = {(row["manifest"], row["symbol_hex"]): row for row in all_rows}
    for seed in seeds:
        require((seed["manifest"], seed["symbol_hex"]) in by_key,
                f"{root_id}: root seed is not a compiled local definition")
    by_caller = {}
    for site in sites:
        key = (site["manifest"], site["function_symbol_hex"])
        require(key in by_key, f"{root_id}: call site has no compiled local caller")
        require(site["classification"] in OPAQUE | {
                    "same-module-noninterposable-direct", "same-symbol-local-definition-candidate"},
                f"{root_id}: unhandled LLVM call class")
        by_caller.setdefault(key, []).append(site)
    syntactic_direct = {(seed["manifest"], seed["symbol_hex"]) for seed in seeds}
    possible = set(syntactic_direct)
    pending = sorted(possible)
    direct_edges = []
    candidate_edges = []
    frontier = []
    while pending:
        caller = pending.pop()
        for site in by_caller.get(caller, []):
            classification = site["classification"]
            target = site.get("target_symbol_hex")
            candidates = [row for row in definitions.get(target, [])]
            common = {"caller_manifest": caller[0], "caller_symbol_hex": caller[1],
                      "site_line": site["line"], "opcode": site["opcode"],
                      "classification": classification, "target_symbol_hex": target}
            if classification == "same-module-noninterposable-direct":
                require(len(candidates) == 1 and candidates[0]["manifest"] == caller[0],
                        f"{root_id}: definite edge lacks unique local target")
                edge = {**common, "target_manifest": caller[0]}
                direct_edges.append(edge)
                next_key = (caller[0], target)
                if next_key not in possible:
                    possible.add(next_key)
                    pending.append(next_key)
            elif classification == "same-symbol-local-definition-candidate":
                require(len(candidates) == 1, f"{root_id}: candidate edge lacks unique local symbol")
                edge = {**common, "target_manifest": candidates[0]["manifest"]}
                candidate_edges.append(edge)
                next_key = (candidates[0]["manifest"], target)
                if next_key not in possible:
                    possible.add(next_key)
                    pending.append(next_key)
            else:
                require(classification in OPAQUE, f"{root_id}: unhandled LLVM call class")
                frontier.append(common)
            if site["opcode"] == "invoke":
                frontier.append({**common, "classification": "unwind-edge-unresolved"})
    # A candidate cross-module edge cannot extend the same-module syntactic
    # set. Even membership here does not establish runtime path reachability.
    pending = sorted(syntactic_direct)
    while pending:
        caller = pending.pop()
        for site in by_caller.get(caller, []):
            if site["classification"] != "same-module-noninterposable-direct":
                continue
            next_key = (caller[0], site["target_symbol_hex"])
            if next_key not in syntactic_direct:
                syntactic_direct.add(next_key)
                pending.append(next_key)
    local = sorted(all_rows, key=lambda row: (row["manifest"], row["symbol_hex"]))
    # Traversal may discover the same graph in a hash-seed-dependent order.
    # Stable serialization keeps evidence digests about content, not set order.
    edge_key = lambda row: json.dumps(row, sort_keys=True, separators=(",", ":"))
    direct_edges.sort(key=edge_key)
    candidate_edges.sort(key=edge_key)
    frontier.sort(key=edge_key)
    untraversed_sites = [site for key, rows in by_caller.items()
                         if key not in possible for site in rows]
    return {"root_id": root_id, "compiled_local_definition_count": len(local),
            "compiled_local_definitions": local,
            "compiled_local_definitions_sha256": digest(local),
            "all_local_llvm_call_like_site_count": len(sites),
            "all_local_llvm_call_like_sites_sha256": digest(sites),
            "all_local_llvm_call_like_sites": sites,
            "untraversed_local_call_like_site_count": len(untraversed_sites),
            "syntactic_same_module_function_count": len(syntactic_direct),
            "syntactic_candidate_function_count": len(possible),
            "syntactic_same_module_functions": sorted([{"manifest": m, "symbol_hex": s}
                                                       for m, s in syntactic_direct], key=lambda x: (x["manifest"], x["symbol_hex"])),
            "syntactic_candidate_functions": sorted([{"manifest": m, "symbol_hex": s}
                                                     for m, s in possible], key=lambda x: (x["manifest"], x["symbol_hex"])),
            "direct_edge_count": len(direct_edges), "candidate_edge_count": len(candidate_edges),
            "direct_edges": direct_edges, "candidate_edges": candidate_edges,
            "traversed_llvm_frontier_count": len(frontier),
            "traversed_llvm_frontier": frontier,
            "mir_non_call_effects_included": False,
            "untraversed_definitions_are_unreachable": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    base = v13.inspect(root_id, mir, llvm, identities)
    parsed = v15.definitions(llvm)
    definitions = {symbol: [{**row, "symbol_hex": symbol} for row in rows]
                   for symbol, rows in parsed.items()}
    require(sum(map(len, definitions.values())) == base["definition_count"],
            f"{root_id}: definition parsers diverged")
    seeds = [bind_root(*spec, llvm, definitions) for spec in ROOTS[root_id]]
    result = graph(root_id, definitions, base["sites"], seeds)
    return {"root_bindings": seeds, "graph": result,
            "llvm_site_classification_counts": base["classification_counts"],
            "claim_limit": "All local LLVM definitions are inventoried name-independently. Only same-module noninterposable direct edges are definite; cross-module edges are candidates and opaque effects may re-enter any local body."}


def evaluate() -> dict:
    base = v13.v7.evaluate(llvm_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-llvm-function-graph/v18-candidate",
            "status": "indeterminate", "root_context": base,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four same-build local LLVM function universes and conservative direct-call graphs are inventoried. Absence from the direct graph is not non-reachability; downstream semantic roles, linker and opaque effects, READY dominance, and runtime evidence remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
