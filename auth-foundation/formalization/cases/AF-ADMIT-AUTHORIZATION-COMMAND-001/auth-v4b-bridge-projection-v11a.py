#!/usr/bin/env python3
"""Bounded normal-MIR bridge evaluate-to-print-argument provenance.

This is not byte-level stdout, effect-closure, or all-native-endpoint proof.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path


CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_output_provenance_v10", CASE / "auth-v4b-output-provenance-v10.py")
assert SPEC and SPEC.loader
v10 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v10)
v5, v7, v8, v6 = v10.v5, v10.v7, v10.v8, v10.v6
BRIDGES = ("prototype", "https")


def unique(blocks: dict[str, str], pattern: str, label: str) -> tuple[str, re.Match[str]]:
    return v10.one_site(blocks, pattern, label)


def literal_site(blocks: dict[str, str], value: str) -> tuple[str, str]:
    literal = json.dumps(json.dumps({"decision": value}, separators=(",", ":")))
    node, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = const {re.escape(literal)};$",
        f"bridge {value} literal")
    return node, matched.group(1)


def inspect_main(root_id: str, mir: str) -> dict:
    v10.require(root_id in BRIDGES, "V11a only selects the two scalar bridges")
    body, blocks, graph = v10.selected_body(mir, "main() -> ()")
    call, matched = unique(blocks,
        r"(?m)^\s*(_\d+) = evaluate\(\) -> \[return: (bb\d+),",
        f"{root_id} main evaluate")
    result, unwrap_node = matched.groups()
    v10.single_assignment(blocks, result, f"{root_id} evaluate result")
    v10.require(unwrap_node in graph[call], f"{root_id}: evaluate return edge changed")

    unwrap, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = Result::<bool, Box<dyn StdError>>::unwrap_or\(move {re.escape(result)}, const (true|false)\) -> \[return: (bb\d+),",
        f"{root_id} main default")
    boolean, default, switch_node = matched.groups()
    v10.require(unwrap == unwrap_node and default == "false",
                f"{root_id}: evaluate error/default must be false")
    v10.single_assignment(blocks, boolean, f"{root_id} projected boolean")
    v10.require(switch_node in graph[unwrap], f"{root_id}: default return edge changed")
    terminator = [line.strip() for line in blocks[switch_node].splitlines()
                  if line.strip()][-1]
    branch = re.fullmatch(
        rf"switchInt\(copy {re.escape(boolean)}\) -> \[0: (bb\d+), otherwise: (bb\d+)\];",
        terminator)
    v10.require(branch is not None, f"{root_id}: boolean switch/polarity changed")
    switch = {"0": branch.group(1), "otherwise": branch.group(2)}
    deny, allow = switch["0"], switch["otherwise"]
    allow_node, literal_local = literal_site(blocks, "ALLOW")
    deny_node, deny_local = literal_site(blocks, "DENY")
    v10.require(allow == allow_node and deny == deny_node and
                literal_local == deny_local and allow != deny,
                f"{root_id}: output literal polarity changed")
    writes = v10.assignment_sites(blocks, literal_local)
    v10.require(len(writes) == 2 and {node for node, _ in writes} == {allow, deny},
                f"{root_id}: selected literal has alternate writes")
    v10.dominated(graph, allow, call, f"{root_id} evaluate call")
    v10.dominated(graph, allow, unwrap, f"{root_id} default projection")
    v10.dominated(graph, allow, switch_node, f"{root_id} boolean branch")
    v10.require(not v8.reachable(graph, deny, allow),
                f"{root_id}: false branch reaches ALLOW literal")

    # The legitimate formatter takes one shared reference to the selected
    # string. Its direct chain is checked; arbitrary addresses or writes are
    # outside this deliberately narrow normal-MIR model.
    refs = [(node, match) for node, content in blocks.items()
            for match in re.finditer(
                rf"(?m)^\s*(_\d+) = &{re.escape(literal_local)};$", content)]
    v10.require(len(refs) == 1, f"{root_id}: selected literal reference changed")
    merge, ref_match = refs[0]
    ref = ref_match.group(1)
    v10.require(graph[allow] == [merge] and graph[deny] == [merge],
                f"{root_id}: literal branches do not merge at formatter")
    v10.single_assignment(blocks, ref, f"{root_id} literal reference")
    v10.require(len(re.findall(rf"&(?:raw\s+(?:mut|const)\s+|mut\s+)?(?:\(\s*)*{re.escape(literal_local)}\b", body)) == 1,
                f"{root_id}: selected literal has another address use")
    nested = [(node, line.strip()) for node, content in blocks.items()
              for line in content.splitlines() if " = " in line and
              (place := line.split(" = ", 1)[0].strip()) != literal_local and
              re.search(rf"\b{re.escape(literal_local)}\b", place)]
    v10.require(not nested, f"{root_id}: selected literal has indirect place write")

    tuple_node, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = \(move {re.escape(ref)},\);$",
        f"{root_id} format tuple")
    tup = matched.group(1)
    v10.require(tuple_node == merge, f"{root_id}: format tuple leaves merge")
    v10.single_assignment(blocks, tup, f"{root_id} format tuple")
    arg_ref_node, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = no_retag copy \({re.escape(tup)}\.0: &&str\);$",
        f"{root_id} format argument reference")
    arg_ref = matched.group(1)
    v10.require(arg_ref_node == merge, f"{root_id}: format argument path changed")
    v10.single_assignment(blocks, arg_ref, f"{root_id} format argument reference")
    display_node, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = core::fmt::rt::Argument::<'_>::new_display::<&str>\(copy {re.escape(arg_ref)}\) -> \[return: (bb\d+),",
        f"{root_id} display argument")
    argument, array_node = matched.groups()
    v10.require(display_node == merge and array_node in graph[display_node],
                f"{root_id}: display argument path changed")
    v10.single_assignment(blocks, argument, f"{root_id} display argument")
    array, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = \[move {re.escape(argument)}\];$",
        f"{root_id} argument array")
    arguments = matched.group(1)
    v10.require(array == array_node, f"{root_id}: argument array path changed")
    v10.require(v10.assignment_sites(blocks, arguments) ==
                [(array_node, f"[move {argument}];")],
                f"{root_id}: argument array rebound")
    array_ref, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = &{re.escape(arguments)};$",
        f"{root_id} argument array reference")
    arguments_ref = matched.group(1)
    v10.require(array_ref == array_node, f"{root_id}: argument array reference path changed")
    v10.single_assignment(blocks, arguments_ref, f"{root_id} argument array reference")
    v10.require(len(re.findall(rf"&(?:raw\s+(?:mut|const)\s+|mut\s+)?(?:\(\s*)*{re.escape(arguments)}\b", body)) == 1,
                f"{root_id}: argument array has another address use")
    format_node, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = Arguments::<'_>::new::<4, 1>\(move (_\d+), copy {re.escape(arguments_ref)}\) -> \[return: (bb\d+),",
        f"{root_id} format construction")
    formatted, template, print_node = matched.groups()
    v10.require(format_node == array_node and print_node in graph[format_node] and
                len(v10.assignment_sites(blocks, template)) == 1 and
                v10.assignment_sites(blocks, template)[0] ==
                    (array_node, 'const b"\\xc0\\x01\\n\\x00";'),
                f"{root_id}: format template/path changed")
    v10.single_assignment(blocks, formatted, f"{root_id} formatted arguments")
    printer, matched = unique(blocks,
        rf"(?m)^\s*(_\d+) = std::io::_print\(move {re.escape(formatted)}\) -> \[return: (bb\d+),",
        f"{root_id} print")
    printed, return_node = matched.groups()
    v10.require(printer == print_node and return_node in graph[printer] and
                len(v10.sites(blocks, r"std::io::_print\(")) == 1,
                f"{root_id}: alternate print path")
    v10.single_assignment(blocks, printed, f"{root_id} print result")
    v10.dominated(graph, printer, call, f"{root_id} print evaluate dominance")
    v10.dominated(graph, printer, switch_node, f"{root_id} print selection dominance")
    v10.require(len(v10.sites(blocks, r"(?m)^\s*return;")) == 1 and
                re.search(r"(?m)^\s*return;$", blocks[return_node]) is not None,
                f"{root_id}: alternate normal return")
    return {"function": "main() -> ()", "evaluate_call_block": call,
            "default": default, "allow_literal_block": allow,
            "deny_literal_block": deny, "print_block": printer,
            "selected_literal_to_print_argument": "pass",
            "stdout_byte_semantics_observed": False}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    predecessor = v10.inspect(root_id, mir, identities)
    if root_id in BRIDGES:
        predecessor["bridge_main_projection"] = inspect_main(
            root_id, mir[v6.ROOT_MANIFESTS[root_id]])
    return predecessor


def evaluate() -> dict:
    current = v7.evaluate(mir_inspector=inspect)
    v10.require(current["status"] == "indeterminate" and
                current["runtime_guarantees_observed"] is False,
                "root-context predecessor posture changed")
    return {"schema_version": "auth-foundation.v4b-bridge-projection/v11a-candidate",
            "status": "indeterminate", "root_context_builds": current["root_context_builds"],
            "bounded_bridge_selected_literal_provenance": "pass",
            "public_stdout_byte_semantics_closed": False,
            "allow_output_provenance_closed": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "trusted_summaries": ["std Result::unwrap_or maps Err to supplied false",
                                  "Rust formatting and std::io::_print consume selected argument"],
            "claim_limit": "Normal-MIR selection of the exact ALLOW/DENY literal and its sole print argument in the prototype and HTTPS bridges, conditional on the stated standard-library summaries. This is not byte-level stdout observation, public API/tenant projection, native endpoint/effect closure, or the all-path no-call property."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
