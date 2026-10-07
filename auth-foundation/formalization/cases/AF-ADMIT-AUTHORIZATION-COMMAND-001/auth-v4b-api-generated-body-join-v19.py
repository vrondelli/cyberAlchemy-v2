#!/usr/bin/env python3
"""Same-build candidate join of API MIR async/worker bodies to LLVM definitions.

Attached debug source lines identify generated bodies. V11c checks the normal
MIR chain, but Rust async lowering, Axum dispatch, Tokio scheduling, and
cross-body execution are not inferred from an LLVM source-span match.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def module(label: str, filename: str):
    spec = importlib.util.spec_from_file_location(label, CASE / filename)
    assert spec and spec.loader
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


v18 = module("auth_v4b_llvm_function_graph_v18", "auth-v4b-llvm-function-graph-v18.py")
v11c = module("auth_v4b_api_projection_v11c", "auth-v4b-api-projection-v11c.py")
v15, v13, v7 = v18.v15, v18.v13, v18.v13.v7
API_MANIFEST = v7.v6.ROOT_MANIFESTS["api"]
API_SOURCE = "authorization-api/src/lib.rs"
GENERATED = (
    ("handler-poll", "{async_fn#0}",
     "async fn authorize(State(state): State<ApiState>, request: Request<Body>) -> Response {"),
    ("runtime-poll", "{async_fn#0}",
     ") -> Result<BinaryAuthorizationDecision, AuthorizationRuntimeError> {"),
    ("blocking-worker", "{closure#0}",
     "let worker = tokio::task::spawn_blocking(move || {"),
    ("ready-callback-worker", "{closure#0}",
     "let outcome = catch_unwind(AssertUnwindSafe(|| {"),
)
HANDOFFS = (
    ("handler-poll", "runtime-poll", "Rust Future::poll and Axum handler dispatch"),
    ("runtime-poll", "blocking-worker", "Tokio spawn_blocking scheduling"),
    ("blocking-worker", "ready-callback-worker", "Rust closure call and catch_unwind"),
)


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def source_anchors(source: bytes) -> dict[str, int]:
    lines = source.decode().splitlines()
    anchors = {}
    for role, _, marker in GENERATED:
        matches = [number for number, line in enumerate(lines, 1)
                   if line.strip() == marker]
        require(len(matches) == 1, f"api: generated {role} source anchor ambiguous")
        anchors[role] = matches[0]
    require(anchors["runtime-poll"] < anchors["blocking-worker"] <
            anchors["ready-callback-worker"] < anchors["handler-poll"],
            "api: generated body source order changed")
    return anchors


def bind_generated(llvm: str, definitions: dict[str, list[dict]],
                   source: bytes, source_path: Path) -> dict[str, dict]:
    """Bind all four generated definitions, fail closed on ambiguous metadata."""
    anchors = source_anchors(source)
    actual = source_path.resolve()
    checksum = hashlib.md5(source).hexdigest()
    files = {}
    subprograms = []
    for line in llvm.splitlines():
        if match := v15.DI_FILE.match(line):
            identifier, filename, directory, observed_checksum = match.groups()
            require(identifier not in files, "api: duplicate DIFile id")
            files[identifier] = {"path": (Path(directory) / filename).resolve(),
                                 "checksum": observed_checksum}
        if match := v15.DI_SUBPROGRAM.match(line):
            identifier, name, linkage, file_id, source_line = match.groups()
            subprograms.append({"debug_id": identifier, "name": name,
                                "linkage": linkage, "file_id": file_id,
                                "source_line": int(source_line)})
    bound = {}
    for role, expected_name, _ in GENERATED:
        matches = [row for row in subprograms if row["name"] == expected_name and
                   row["source_line"] == anchors[role] and
                   row["file_id"] in files and
                   files[row["file_id"]]["path"] == actual]
        require(len(matches) == 1, f"api: generated {role} debug subprogram ambiguous")
        row = matches[0]
        require(files[row["file_id"]]["checksum"] == checksum,
                f"api: generated {role} source checksum changed")
        require(re.fullmatch(r"[A-Za-z0-9_.$-]+", row["linkage"]) is not None,
                f"api: generated {role} linkage unparsed")
        symbol = v13.symbol_hex("@" + row["linkage"])
        candidates = definitions.get(symbol, [])
        require(len(candidates) == 1 and candidates[0]["manifest"] == API_MANIFEST and
                candidates[0]["debug_id"] == row["debug_id"],
                f"api: generated {role} attached unique definition missing")
        bound[role] = {"role": role, "manifest": API_MANIFEST,
                       "source": API_SOURCE, "source_line": anchors[role],
                       "source_sha256": hashlib.sha256(source).hexdigest(),
                       "debug_id": row["debug_id"], "symbol_hex": symbol}
    require(len({row["symbol_hex"] for row in bound.values()}) == len(GENERATED),
            "api: generated body symbols not distinct")
    return bound


def marker_line(source: str, marker: str) -> int:
    spans = {(int(start), int(end)) for start, end in re.findall(
        rf"\{{{marker}@src/lib\.rs:(\d+):\d+: (\d+):\d+(?: \(#\d+\))?\}}", source)}
    require(len(spans) == 1, f"api: {marker} MIR source marker ambiguous")
    start, end = next(iter(spans))
    require(start <= end, f"api: {marker} MIR source marker malformed")
    return start


def checked_mir_join(parts: dict, bound: dict[str, dict], api_mir: str) -> dict:
    composition = parts["api_composition_projection"]
    handler = parts["api_handler_poll_projection"]
    runtime = parts["api_runtime_poll_projection"]
    worker = parts["api_worker_projection"]
    require(composition["bounded_normal_mir_function_chain"] == "pass" and
            handler["function"].startswith("authorize::{closure#0}(") and
            runtime["function"].startswith(
                "<impl at src/lib.rs:247:1: 247:26>::authorize::{closure#0}(") and
            worker["normal_mir_result_provenance"] == "pass" and
            set(bound) == {role for role, _, _ in GENERATED},
            "api: checked MIR/generated-body identity join changed")
    for role, function in (("blocking-worker", worker["function"]),
                           ("ready-callback-worker", worker["v10_checked_function"])):
        require(marker_line(function, "closure") == bound[role]["source_line"],
                f"api: {role} MIR/LLVM source line changed")
    for role, part in (("handler-poll", "api_handler_constructor_projection"),
                       ("runtime-poll", "api_runtime_constructor_projection")):
        _, blocks, _ = v11c.v10.selected_body(api_mir, parts[part]["function"])
        require(marker_line(blocks["bb0"], "coroutine") == bound[role]["source_line"],
                f"api: {role} MIR/LLVM source line changed")
    return {"selected_mir_functions": {
                "handler-poll": handler["function"],
                "runtime-poll": runtime["function"],
                "blocking-worker": worker["function"],
                "ready-callback-worker": worker["v10_checked_function"]},
            "source_span_join": "candidate",
            "mir_to_llvm_instruction_bijection": False,
            "execution_handoffs_proven": False}


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    if root_id != "api":
        return v18.inspect(root_id, mir, llvm, identities)
    parts = v11c.inspect(root_id, mir, identities)
    base = v13.inspect(root_id, mir, llvm, identities)
    parsed = v15.definitions(llvm)
    definitions = {symbol: [{**row, "symbol_hex": symbol} for row in rows]
                   for symbol, rows in parsed.items()}
    require(sum(map(len, definitions.values())) == base["definition_count"],
            "api: LLVM definition parsers diverged")
    source_path = v7.IMPL / API_SOURCE
    bound = bind_generated(llvm[API_MANIFEST], definitions,
                           source_path.read_bytes(), source_path)
    mir_join = checked_mir_join(parts, bound, mir[API_MANIFEST])
    roots = [v18.bind_root(*spec, llvm, definitions) for spec in v18.ROOTS["api"]]
    all_seeds = roots + list(bound.values())
    graph = v18.graph(root_id, definitions, base["sites"], all_seeds)
    handoffs = [{"from_role": source, "to_role": target,
                 "semantic_dependency": reason, "classification": "candidate-not-direct"}
                for source, target, reason in HANDOFFS]
    require(not any(edge["classification"] == "same-module-noninterposable-direct"
                    for edge in handoffs), "api: semantic handoff misclassified as direct")
    return {"root_id": root_id, "source_root_bindings": roots,
            "generated_body_bindings": bound, "checked_mir_join": mir_join,
            "candidate_semantic_handoffs": handoffs,
            "multi_seed_compiled_graph": graph,
            "llvm_site_classification_counts": base["classification_counts"],
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Four generated API bodies are bound to current source and unique same-build LLVM definitions alongside V11c normal-MIR identities. Their cross-body execution handoffs remain candidates; the multi-seed graph is not root reachability, and opaque effects/READY dominance remain open."}


def evaluate() -> dict:
    base = v7.evaluate(llvm_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-api-generated-body-join/v19-candidate",
            "status": "indeterminate", "root_context": base,
            "api_generated_body_join": "bounded-source-span-candidate",
            "api_cross_body_execution_handoffs_proven": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "The API async handler/runtime poll and worker/inner closure LLVM definitions are bound to the same four-root build and V11c MIR checks. Cross-body execution, linker/opaque effects, all-native endpoint roles, same-request READY dominance, and runtime behavior are not proved."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
