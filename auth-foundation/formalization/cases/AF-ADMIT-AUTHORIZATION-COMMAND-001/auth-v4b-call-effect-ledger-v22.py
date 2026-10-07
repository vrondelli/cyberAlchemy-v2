#!/usr/bin/env python3
"""Same-build MIR/LLVM call-effect ledger for the four selected Auth roots.

This joins two conservative inspections inside one V7 root build. It is an
actionable unresolved frontier, not whole-program reachability or a guarantee.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
IMPL = CASE.parents[2] / "implementation"
ROOT_IDS = {"api", "tenant", "prototype", "https"}


def load_module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, CASE / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v18 = load_module("auth_v4b_llvm_function_graph_v18", "auth-v4b-llvm-function-graph-v18.py")
v12 = load_module("auth_v4b_compiled_effect_frontier_v12", "auth-v4b-compiled-effect-frontier-v12.py")

SOURCE_CONTRACT = {
    "authorization-api/src/lib.rs": (
        "c5a8f845e6ebb388f0599be559b46379ec281ff5c5960d4708e9393b2c2652ca",
        ("#[cfg(not(test))]\n            let outcome = catch_unwind(AssertUnwindSafe(|| {\n"
         "                match engine.with_ready(request, authorize_ready_decision) {",),
    ),
    "tenant-bridge/src/main.rs": (
        "e59053cb582fd77b98c1da157376b08dbce37c210cb7d498af4492b25a47b847",
        ("let outcome = service.with_ready(request, authorize_ready_decision);",),
    ),
    "authentication-prototype/bridge/src/main.rs": (
        "4f4ea0a30a810c7451bab5667ca5ed998806711c4ef7b95b2a52901e069ec725",
        ("let outcome = service.with_ready(request, authorize_ready_decision);",),
    ),
    "authentication-https/bridge/src/main.rs": (
        "8418f97ccdc4404ffd170cd5080d1bfd0bd427e733a32fabc590c4d96a57772b",
        ("let outcome = service.with_ready(request, authorize_ready_decision);",),
    ),
    "authorization-admission-service/src/lib.rs": (
        "9c171dd1837b500973bc86135aeb80639276a422671afa68916d86bec3963fee",
        ("continuation: for<'transaction, 'connection> fn(\n"
         "            ReadyAuthorization<'transaction, 'connection>,\n        ) -> R,",
         "let outcome = with_ready_in_transaction(\n            &epoch.transaction,"),
    ),
    "authorization-ready-authority/src/lib.rs": (
        "0e474a09387742d06e2879fbb9a64089b49522b65afd06fe35aee81ddd8869ab",
        ("continuation: fn(ReadyAuthorization<'transaction, 'connection>) -> R,",
         "AdmissionOutcome::Ready(continuation(ready))"),
    ),
    "authorization-ready-decision/src/lib.rs": (
        "5fc42188c7b07013bae83c552d5a534c9bfede377007c11c6d283596bbb62b7d",
        ("pub fn authorize(ready: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision {",
         "let decision = kernel::authorize(&context);"),
    ),
    "standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs": (
        "13c696a8f17b4d6bff1529b2cb75d1780aca38f45277f8c454cf7ec024b7efe9",
        ("pub fn authorize(context: &EvaluationContext) -> AuthorizationDecision {",),
    ),
}


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def digest(value: object) -> str:
    return v18.digest(value)


def bind_sources(sources: dict[str, bytes], contract=SOURCE_CONTRACT) -> list[dict]:
    require(set(sources) == set(contract), "selected source set changed")
    anchors = []
    for relative, (expected_hash, snippets) in sorted(contract.items()):
        raw = sources[relative]
        require(sha(raw) == expected_hash, f"selected source drift: {relative}")
        source = raw.decode("utf8")
        for snippet in snippets:
            require(source.count(snippet) == 1,
                    f"selected call/handoff anchor missing or duplicate: {relative}")
            anchors.append({"source": relative, "source_sha256": expected_hash,
                            "line": source[:source.index(snippet)].count("\n") + 1,
                            "anchor_sha256": sha(snippet.encode())})
    return anchors


def current_sources() -> dict[str, bytes]:
    result = {}
    for relative in SOURCE_CONTRACT:
        path = IMPL / relative
        require(path.is_file() and not path.is_symlink(), f"selected source unavailable: {relative}")
        result[relative] = path.read_bytes()
    return result


def site_identity(root_id: str, kind: str, row: dict) -> str:
    if kind == "llvm":
        key = [root_id, kind, row["manifest"], row["function_symbol_hex"],
               row["line"], row["opcode"]]
    else:
        key = [root_id, kind, row["site_id"]]
    return sha(json.dumps(key, separators=(",", ":")).encode())


def class_ledger(rows: list[dict], root_id: str, kind: str, field: str) -> dict:
    ids = [site_identity(root_id, kind, row) for row in rows]
    require(len(ids) == len(set(ids)), f"{root_id}: duplicate {kind} site identity")
    by_class: dict[str, list[str]] = {}
    for row, site_id in zip(rows, ids):
        classification = row[field]
        require(isinstance(classification, str) and classification,
                f"{root_id}: missing {kind} class")
        by_class.setdefault(classification, []).append(site_id)
    return {name: {"count": len(values), "site_ids_sha256": digest(sorted(values)),
                   "sample_site_ids": sorted(values)[:3]}
            for name, values in sorted(by_class.items())}


def summarize(root_id: str, llvm: dict, mir: dict) -> dict:
    require(root_id in ROOT_IDS and llvm.get("graph", {}).get("root_id") == root_id and
            mir.get("root_id") == root_id, f"{root_id}: inspection root mismatch")
    graph = llvm["graph"]
    sites = graph["all_local_llvm_call_like_sites"]
    frontier = graph["traversed_llvm_frontier"]
    effects = mir["blocking_frontier"]
    require(len(sites) == graph["all_local_llvm_call_like_site_count"] and
            digest(sites) == graph["all_local_llvm_call_like_sites_sha256"],
            f"{root_id}: LLVM full-site coverage/digest mismatch")
    require(len(frontier) == graph["traversed_llvm_frontier_count"] and
            len(effects) == mir["blocking_frontier_count"] == mir["compiled_effect_site_count"],
            f"{root_id}: frontier count mismatch")
    effect_keys = ("manifest", "function", "block", "line", "target", "class", "unwind")
    effect_rows = [{key: row[key] for key in effect_keys} for row in effects]
    require(digest(effect_rows) == mir["compiled_effect_sites_sha256"],
            f"{root_id}: MIR effect digest mismatch")
    for row in effects:
        expected_id = f"{root_id}:{row['manifest']}:{row['function']}:{row['block']}:{row['line']}"
        require(row["site_id"] == expected_id and
                type(row["unwind_remains_open"]) is bool and
                row["unwind_remains_open"] == (row["unwind"] != "unwind unreachable"),
                f"{root_id}: MIR effect identity/unwind mismatch")
    full_sites = {(row["manifest"], row["function_symbol_hex"], row["line"], row["opcode"]): row
                  for row in sites}
    require(len(full_sites) == len(sites), f"{root_id}: duplicate LLVM full-site key")
    frontier_keys = set()
    for row in frontier:
        key = (row["caller_manifest"], row["caller_symbol_hex"], row["site_line"], row["opcode"])
        full = full_sites.get(key)
        require(full is not None and row["target_symbol_hex"] == full["target_symbol_hex"] and
                (row["classification"] == full["classification"] or
                 (row["classification"] == "unwind-edge-unresolved" and
                  row["opcode"] == "invoke")),
                f"{root_id}: traversed LLVM frontier not in full-site census")
        tagged = (key, row["classification"])
        require(tagged not in frontier_keys, f"{root_id}: duplicate LLVM frontier site")
        frontier_keys.add(tagged)
    require(graph["untraversed_local_call_like_site_count"] >= 0 and
            graph["untraversed_local_call_like_site_count"] <= len(sites),
            f"{root_id}: untraversed-site count invalid")
    llvm_classes = class_ledger(sites, root_id, "llvm", "classification")
    effect_classes = class_ledger(effects, root_id, "mir", "blocking_reason")
    require(sum(row["count"] for row in llvm_classes.values()) == len(sites) and
            sum(row["count"] for row in effect_classes.values()) == len(effects),
            f"{root_id}: ledger class coverage mismatch")
    return {"root_id": root_id,
            "compiled_local_definition_count": graph["compiled_local_definition_count"],
            "llvm_site_count": len(sites),
            "llvm_sites_sha256": graph["all_local_llvm_call_like_sites_sha256"],
            "llvm_classes": llvm_classes,
            "traversed_llvm_frontier_count": len(frontier),
            "untraversed_local_llvm_site_count": graph["untraversed_local_call_like_site_count"],
            "mir_effect_site_count": len(effects),
            "mir_effect_sites_sha256": mir["compiled_effect_sites_sha256"],
            "mir_effect_classes": effect_classes,
            "mir_unwind_open_count": sum(1 for row in effects if row["unwind_remains_open"]),
            "known_callback_handoff": "source-pinned-bare-fn-pointer-candidate",
            "call_effect_closure": False}


def assemble(build: dict, anchors: list[dict]) -> dict:
    roots = build.get("root_context_builds", {})
    require(set(roots) == ROOT_IDS, "selected root set changed")
    require(build.get("instrumentation") == "RUSTFLAGS=--emit=mir,llvm-ir,link -Ccodegen-units=1",
            "same-build MIR/LLVM instrumentation missing")
    summaries = {}
    for root_id, row in sorted(roots.items()):
        summaries[root_id] = summarize(root_id, row["llvm_direct_symbol_inspection"],
                                       row["selected_graph_inspection"])
    return {"schema_version": "auth-foundation.v4b-call-effect-ledger/v22-candidate",
            "status": "indeterminate", "root_context_build_sha256": digest(build),
            "source_set_sha256": build["source_set_sha256"],
            "rustc_version_sha256": build["rustc_version_sha256"],
            "selected_source_anchors": anchors, "roots": summaries,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "MIR/LLVM paired within each of four independently built roots, with source-pinned READY handoff. LLVM direct cross-module edges remain candidates; indirect, external, drop, unwind, untraversed, async, linker, and semantic endpoint closure remain unresolved."}


def inspect_same_build(root_id: str, mir: dict, llvm: dict, identities: dict) -> dict:
    return {"llvm_direct_symbol_inspection": v18.inspect(root_id, mir, llvm, identities),
            "selected_graph_inspection": v12.inspect(root_id, mir, identities)}


def evaluate() -> dict:
    before = current_sources()
    anchors = bind_sources(before)
    # Both inspectors receive the same in-memory MIR/LLVM pair for each root.
    def llvm_inspector(root_id, mir, llvm, identities):
        return inspect_same_build(root_id, mir, llvm, identities)
    build = v18.v13.v7.evaluate(llvm_inspector=llvm_inspector)
    require(current_sources() == before, "selected source drift during same-build capture")
    # V7 stores the combined inspector under its LLVM field; do not label it
    # as the independently invoked V12 or V18 result.
    for row in build["root_context_builds"].values():
        joined = row.pop("llvm_direct_symbol_inspection")
        row.update(joined)
    return assemble(build, anchors)


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
