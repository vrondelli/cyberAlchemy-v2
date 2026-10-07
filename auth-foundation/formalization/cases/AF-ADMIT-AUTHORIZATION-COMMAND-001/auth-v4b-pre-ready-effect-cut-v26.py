#!/usr/bin/env python3
"""Candidate root-context local-MIR effect cut before the selected READY arm.

This enumerates effects in the four selected function bodies, not their
transitive callees. Every unexpanded call, drop, unwind, or opaque target is an
open obligation; a small named handoff graph must not be mistaken for closure.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_intercrate_graph_v9_for_v26", CASE / "auth-v4b-intercrate-graph-v9.py")
assert SPEC and SPEC.loader
v9 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v9)
v5, v6, v7, v8 = v9.v5, v9.v6, v9.v7, v9.v8

KNOWN_HANDOFFS = {
    "root": "SqliteAdmissionService::with_ready::<BinaryAuthorizationDecision>",
    "admission": "with_ready_in_transaction::",
}
POLICY_CAPABLE = {"generated-policy", "decision-endpoint-candidate"}
BLOCK_HEADER = re.compile(r"(?m)^    (bb\d+)(?: \(cleanup\))?: \{\n")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def cut_nodes(graph: dict[str, list[str]], *, handoff: str | None = None,
              exclude: str | None = None) -> list[str]:
    """Conservative normal reachability, including handoff return paths."""
    require("bb0" in graph and (handoff is None or handoff in graph) and
            (exclude is None or exclude in graph), "effect cut anchor missing")
    pending, seen = ["bb0"], set()
    while pending:
        node = pending.pop()
        if node in seen or node == exclude:
            continue
        require(node in graph, "effect cut successor missing")
        seen.add(node)
        pending.extend(graph[node])
    require(handoff is None or handoff in seen, "effect cut handoff unreachable")
    return sorted(seen, key=lambda node: int(node[2:]))


def compiled_blocks(body: str) -> dict[str, str]:
    """Parse both ordinary and rustc `(cleanup)` MIR blocks."""
    found = list(BLOCK_HEADER.finditer(body))
    declared = re.findall(r"(?m)^    bb\d+.*: \{\n", body)
    require(found and len(found) == len(declared), "unclassified MIR block header")
    blocks = {}
    for match in found:
        ending = re.search(r"(?m)^    }\n", body[match.end():])
        require(ending is not None and match.group(1) not in blocks,
                "unclosed or duplicate MIR block")
        blocks[match.group(1)] = body[match.end():match.end() + ending.start()]
    require("bb0" in blocks, "MIR entry block missing")
    return blocks


def local_unwind_successors(blocks: dict[str, str], normal: dict[str, list[str]]) -> dict[str, list[str]]:
    """Retain compiler-emitted cleanup targets alongside normal successors."""
    require(set(blocks) == set(normal), "local unwind graph block coverage changed")
    graph = {}
    for node, content in blocks.items():
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        term = lines[-1]
        targets = re.findall(r"\bunwind: (bb\d+)\b", term)
        require(all(target in blocks for target in targets),
                f"local unwind target ambiguous:{node}")
        graph[node] = list(dict.fromkeys([*normal[node], *targets]))
    return graph


def effect_cut_nodes(normal: dict[str, list[str]],
                     full: dict[str, list[str]], blocks: dict[str, str],
                     *, handoff: str | None, exclude: str | None) -> tuple[list[str], set[str]]:
    """Exclude only the normal READY edge, never an unwind into that block."""
    normal_nodes = set(cut_nodes(normal, handoff=handoff, exclude=exclude))
    cleanup_seeds = []
    for node in normal_nodes:
        term = [line.strip() for line in blocks[node].splitlines() if line.strip()][-1]
        cleanup_seeds.extend(re.findall(r"\bunwind: (bb\d+)\b", term))
    cleanup_seen: set[str] = set()
    pending = list(cleanup_seeds)
    while pending:
        node = pending.pop()
        if node in cleanup_seen:
            continue
        require(node in full, "unwind cleanup successor missing")
        cleanup_seen.add(node)
        pending.extend(full[node])
    nodes = normal_nodes | cleanup_seen
    require(handoff is None or handoff in nodes, "effect cut handoff unreachable")
    return sorted(nodes, key=lambda node: int(node[2:])), normal_nodes


def inspect_terminator(stage: str, function: str, block: str,
                       content: str, handoff: str | None) -> dict:
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    require(lines, "empty effect-cut block")
    term = lines[-1]
    match = v6.CALL_TERMINATOR.match("    " + term)
    if match:
        target = match.group(2)
        kind = v6.effect_class(target)
        if kind in POLICY_CAPABLE:
            raise ValueError(f"pre-READY native decision effect:{stage}:{block}:{target}")
        if handoff is not None and handoff in target:
            classification = "selected-handoff"
        else:
            classification = "open-" + kind
        unwind = match.group(5)
        return {"stage": stage, "function": function, "block": block,
                "target": target, "classification": classification,
                "unwind": unwind,
                "unwind_open": unwind != "unwind unreachable"}
    if term.startswith("assert(") and " -> [success:" in term:
        return {"stage": stage, "function": function, "block": block,
                "target": term[:240], "classification": "open-assert-panic",
                "unwind": "unknown", "unwind_open": True}
    if term.startswith("yield("):
        return {"stage": stage, "function": function, "block": block,
                "target": term[:240], "classification": "open-yield",
                "unwind": "unknown", "unwind_open": True}
    if term in {"resume;", "abort;"}:
        return {"stage": stage, "function": function, "block": block,
                "target": term, "classification": "open-unwind-or-abort",
                "unwind": "unknown", "unwind_open": True}
    if " -> [" in term and not term.startswith("switchInt("):
        # A compiler terminator whose call/drop target was not parsed is not
        # silently converted into a harmless CFG edge.
        return {"stage": stage, "function": function, "block": block,
                "target": term[:240], "classification": "open-unparsed-terminator",
                "unwind": "unknown", "unwind_open": True}
    require(term in {"return;", "unreachable;"} or
            term.startswith("goto -> ") or term.startswith("switchInt("),
            f"unclassified effect-cut terminator:{stage}:{block}:{term[:120]}")
    return {"stage": stage, "function": function, "block": block,
            "target": term[:240], "classification": "control-only",
            "unwind": "none", "unwind_open": False}


def function_cut(stage: str, function: str, body: str, *,
                 handoff: str | None = None, exclude: str | None = None) -> dict:
    blocks = compiled_blocks(body)
    normal = v8.normal_successors(body, blocks)
    graph = local_unwind_successors(blocks, normal)
    nodes, normal_nodes = effect_cut_nodes(normal, graph, blocks,
                                          handoff=handoff, exclude=exclude)
    rows = [inspect_terminator(stage, function, node, blocks[node],
                               KNOWN_HANDOFFS.get(stage) if node == handoff else None)
            for node in nodes]
    if handoff is not None:
        require(rows[nodes.index(handoff)]["classification"] == "selected-handoff",
                f"{stage}: selected handoff effect changed")
    open_sites = sum(row["classification"].startswith("open-") for row in rows)
    handoff_sites = sum(row["classification"] == "selected-handoff" for row in rows)
    return {"function": function, "reachable_block_count": len(nodes),
            "reachable_blocks": nodes, "effect_sites": rows,
            "local_cleanup_only_blocks": sorted(set(nodes) - normal_nodes,
                                                key=lambda node: int(node[2:])),
            "open_nonhandoff_site_count": open_sites,
            "selected_handoff_site_count": handoff_sites,
            "unresolved_site_count": open_sites + handoff_sites,
            "open_unwind_count": sum(row["unwind_open"] for row in rows)}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    # V9 binds exact normal-MIR handoffs and known direct policy ingress first.
    stitched = v9.stitched_graph(root_id, mir, identities)
    require(v9.check_stitched_property(stitched)["status"] == "pass",
            f"{root_id}: named normal path changed")
    root_manifest = v6.ROOT_MANIFESTS[root_id]
    root = v9.root_handoff(root_id, mir[root_manifest])
    admission = v5.admission_handoff(mir[v9.ADMISSION], v5.functions(mir[v9.ADMISSION]))
    authority = v8.extract_graph(mir[v9.AUTHORITY])
    authority_name, authority_body = v5.selected(
        v5.functions(mir[v9.AUTHORITY]), "with_ready_in_transaction(")
    sections = {
        "root": function_cut("root", root["function"],
                             root["parsed_functions"][root["function"]],
                             handoff=root["block"]),
        "admission": function_cut("admission", admission["function"],
                                  v5.functions(mir[v9.ADMISSION])[admission["function"]],
                                  handoff=admission["block"]),
        "authority": function_cut("authority", authority_name, authority_body,
                                  exclude=authority["ready_arm"]),
    }
    require(not set(sections["authority"]["reachable_blocks"]) &
            set(authority["callback_blocks"]),
            f"{root_id}: READY callback reachable in pre-READY/DENY cut")
    return {"status": "indeterminate", "stages": sections,
            "local_effect_site_count": sum(len(row["effect_sites"])
                                           for row in sections.values()),
            "open_nonhandoff_site_count": sum(row["open_nonhandoff_site_count"]
                                             for row in sections.values()),
            "selected_handoff_site_count": sum(row["selected_handoff_site_count"]
                                               for row in sections.values()),
            "unresolved_local_site_count": sum(row["unresolved_site_count"]
                                               for row in sections.values()),
            "open_unwind_count": sum(row["open_unwind_count"]
                                     for row in sections.values()),
            "local_unwind_cleanup_blocks_enumerated": True,
            "local_cleanup_only_block_count": sum(
                len(row["local_cleanup_only_blocks"]) for row in sections.values()),
            "source_mir_sha256": {manifest: identities[manifest]["mir_sha256"]
                                  for manifest in (root_manifest, v9.ADMISSION, v9.AUTHORITY)},
            "claim_limit": "Normal- and local-unwind-reachable terminators in three selected local function bodies are inventoried, including handoff returns that may represent DENY. Authority's READY arm is excluded; normal-return paths after it are conservatively included in root/admission. Selected handoffs and other effects remain unresolved until cross-body/return and transitive targets are proved. Unwind-continue, external effects, and request/epoch flow remain open."}


def evaluate() -> dict:
    build = v7.evaluate(mir_inspector=inspect)
    require(build["status"] == "indeterminate" and
            build["endpoint_set_closed"] is False and
            build["all_path_ready_dominance"] is False and
            build["runtime_guarantees_observed"] is False,
            "root-context predecessor claim changed")
    return {"schema_version": "auth-foundation.v4b-pre-ready-effect-cut/v26-candidate",
            "status": "indeterminate", "root_context": build,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "open_effects": ["transitive callees and cross-body returns",
                             "cleanup and unwind reachability",
                             "dynamic, callback, Drop, SQL, FFI, and external effects",
                             "same-request and epoch def-use across stages",
                             "all-native-entrypoint and actual runtime observation"],
            "claim_limit": "A source-bound root-context local pre-READY/DENY effect-site inventory including compiler-emitted local unwind targets, not a complete effect cut or all-path no-call proof. Handoffs, open sites, unwind-continue, and transitive effects remain obligations; no runtime guarantee is promoted."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)},
                         sort_keys=True), file=sys.stderr)
        raise SystemExit(1)
