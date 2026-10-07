#!/usr/bin/env python3
"""Bounded tenant selected-vector and selected-JSON-print normal-MIR projection.

Iterator, serde_json, formatting, and stdout effects are trusted summaries,
not compiler-proven call-return semantics or byte-level runtime observation.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path


CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_bridge_projection_v11a", CASE / "auth-v4b-bridge-projection-v11a.py")
assert SPEC and SPEC.loader
v11a = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v11a)
v10, v7, v8, v5, v6 = v11a.v10, v11a.v7, v11a.v8, v11a.v5, v11a.v6
TENANT = "tenant"


def one(blocks: dict[str, str], pattern: str, label: str) -> tuple[str, re.Match[str]]:
    return v10.one_site(blocks, pattern, label)


def exact_normal_uses(blocks: dict[str, str], graph: dict[str, list[str]],
                      local: str, patterns: list[str], label: str) -> None:
    token = re.compile(rf"(?<![A-Za-z0-9_]){re.escape(local)}\b")
    actual = [line.strip() for node, content in blocks.items()
              if v8.reachable(graph, "bb0", node)
              for line in content.splitlines() if token.search(line)]
    remaining = actual.copy()
    for pattern in patterns:
        matched = [line for line in remaining if re.fullmatch(pattern, line)]
        v10.require(len(matched) == 1,
                    f"{label}: {local} selected use missing or duplicated")
        remaining.remove(matched[0])
    v10.require(not remaining,
                f"{label}: {local} has extra normal use: {remaining[:2]}")


def closure_marker(name: str) -> str:
    found = re.search(r"(\{closure@src/main\.rs:[^}]+\})", name)
    v10.require(found is not None, "tenant: compiled closure type missing")
    return found.group(1)


def deny_helper(mir: str) -> tuple[str, dict]:
    functions = v5.functions(mir)
    matches = [name for name in functions if name.startswith("evaluate::{closure#0}(")]
    v10.require(len(matches) == 1, "tenant: deny helper body missing or ambiguous")
    name = matches[0]
    marker = closure_marker(name)
    body, blocks, graph = v10.selected_body(mir, name)
    v10.require(set(blocks) == {"bb0", "bb1", "bb2"} and
                graph["bb0"] == ["bb1"] and graph["bb1"] == ["bb2"],
                "tenant: deny helper CFG changed")
    length, matched = one(blocks,
        r"(?m)^\s*(_\d+) = Vec::<Permission>::len\(copy (_\d+)\) -> \[return: bb1,",
        "tenant deny permission length")
    len_local, permissions = matched.groups()
    v10.single_assignment(blocks, len_local, "tenant deny permission length")
    v10.require(length == "bb0" and
                len(v10.assignment_sites(blocks, permissions)) == 1 and
                v10.assignment_sites(blocks, permissions)[0] ==
                    ("bb0", "no_retag copy ((*_1).0: &std::vec::Vec<Permission>);"),
                "tenant: deny length is not captured permissions")
    value, matched = one(blocks,
        rf"(?m)^\s*_0 = std::vec::from_elem::<bool>\(const (true|false), move {re.escape(len_local)}\) -> \[return: bb2,",
        "tenant deny vector")
    v10.require(value == "bb1" and matched.group(1) == "false" and
                len(v10.return_writes(blocks)) == 1 and
                re.search(r"(?m)^\s*return;$", blocks["bb2"]) is not None,
                "tenant: early deny vector is not all false")
    exact_normal_uses(blocks, graph, len_local,
        [rf"{re.escape(len_local)} = Vec::<Permission>::len\(copy {re.escape(permissions)}\) -> .+",
         rf"_0 = std::vec::from_elem::<bool>\(const false, move {re.escape(len_local)}\) -> .+"],
        "tenant deny permission length")
    return marker, {"function": name, "captured_permission_length": permissions,
                    "element": False, "normal_path_source": "false vector"}


def evaluate_projection(mir: str) -> dict:
    deny_marker, denial = deny_helper(mir)
    functions = v5.functions(mir)
    map_names = [name for name in functions if name.startswith("evaluate::{closure#")
                 and "_2: (usize, &Permission)) -> bool" in name]
    v10.require(len(map_names) == 1 and "::{closure#12}" in map_names[0],
                "tenant: selected per-item closure changed")
    checked_function = v10.root_output_provenance(TENANT, mir)["function"]
    v10.require(map_names[0] == checked_function,
                "tenant: selected map closure is not V10-checked per-item closure")
    map_marker = closure_marker(map_names[0])
    name = "evaluate() -> Result<Vec<bool>, Box<dyn StdError>>"
    body, blocks, graph = v10.selected_body(mir, name)

    collected_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = <std::iter::Map<std::iter::Enumerate<std::slice::Iter<'_, Permission>>, {re.escape(map_marker)}> as std::iter::Iterator>::collect::<Vec<bool>>\(move (_\d+)\) -> \[return: (bb\d+),",
        "tenant selected collect")
    collected, mapped, ok_node = matched.groups()
    collected_writes = v10.assignment_sites(blocks, collected)
    v10.require(ok_node in graph[collected_node] and
                len(collected_writes) == 1 and
                collected_writes[0][0] == collected_node and
                "::collect::<Vec<bool>>" in collected_writes[0][1],
                "tenant: collected vector rebound")
    # The selected Ok must consume exactly the collected vector.
    v10.require((ok_node, f"Result::<Vec<bool>, Box<dyn StdError>>::Ok(move {collected});")
                in v10.return_writes(blocks),
                "tenant: collected vector not returned")
    map_sites = v10.assignment_sites(blocks, mapped)
    v10.require(len(map_sites) == 1, "tenant: map iterator rebound")
    map_node, map_rhs = map_sites[0]
    map_match = re.fullmatch(
        rf"<std::iter::Enumerate<std::slice::Iter<'_, Permission>> as std::iter::Iterator>::map::<bool, {re.escape(map_marker)}>\(move (_\d+), move (_\d+)\) -> \[return: {re.escape(collected_node)},[^\n]+",
        map_rhs)
    v10.require(map_match is not None and collected_node in graph[map_node],
                "tenant: selected map/collect path changed")
    enumerated, closure = map_match.groups()
    closure_writes = v10.assignment_sites(blocks, closure)
    v10.require(len(closure_writes) == 1 and closure_writes[0][0] == map_node and
                re.fullmatch(rf"{re.escape(map_marker)} \{{ service: move (_\d+) \}};",
                             closure_writes[0][1]) is not None,
                "tenant: selected map closure/capture changed")
    enumeration = v10.assignment_sites(blocks, enumerated)
    v10.require(len(enumeration) == 1, "tenant: enumeration rebound")
    enum_node, enum_rhs = enumeration[0]
    enum_match = re.fullmatch(
        rf"<std::slice::Iter<'_, Permission> as std::iter::Iterator>::enumerate\(move (_\d+)\) -> \[return: {re.escape(map_node)},[^\n]+",
        enum_rhs)
    v10.require(enum_match is not None and map_node in graph[enum_node],
                "tenant: selected collection order changed")
    iterator = enum_match.group(1)
    iter_writes = v10.assignment_sites(blocks, iterator)
    v10.require(len(iter_writes) == 1, "tenant: slice iterator rebound")
    iter_node, iter_rhs = iter_writes[0]
    iter_match = re.fullmatch(
        rf"core::slice::<impl \[Permission\]>::iter\(copy (_\d+)\) -> \[return: {re.escape(enum_node)},[^\n]+",
        iter_rhs)
    v10.require(iter_match is not None and enum_node in graph[iter_node],
                "tenant: selected slice iteration changed")
    slice_ref = iter_match.group(1)
    slice_writes = v10.assignment_sites(blocks, slice_ref)
    v10.require(len(slice_writes) == 1, "tenant: selected slice reference rebound")
    deref_node, deref_rhs = slice_writes[0]
    deref = re.fullmatch(
        rf"<Vec<Permission> as Deref>::deref\(move (_\d+)\) -> \[return: {re.escape(iter_node)},[^\n]+",
        deref_rhs)
    v10.require(deref is not None and iter_node in graph[deref_node],
                "tenant: iterator input is not the request permission vector")
    request_refs = re.findall(r"debug r => (_\d+);", body)
    v10.require(len(request_refs) == 1,
                "tenant: source request binding changed")
    request_local = request_refs[0]
    permission_ref = deref.group(1)
    v10.require(v10.assignment_sites(blocks, permission_ref) ==
                [(deref_node,
                  f"&({request_local}.2: std::vec::Vec<Permission>);")],
                "tenant: iterator input is not r.permissions")
    deny_construct, deny_match = one(blocks,
        rf"(?m)^\s*(_\d+) = {re.escape(deny_marker)} \{{ r: move (_\d+) \}};$",
        "tenant early deny closure construction")
    deny_local, deny_capture_ref = deny_match.groups()
    v10.require(len(v10.assignment_sites(blocks, deny_local)) == 1 and
                v10.assignment_sites(blocks, deny_capture_ref) ==
                    [(deny_construct,
                      f"&({request_local}.2: std::vec::Vec<Permission>);")],
                "tenant: deny helper does not capture r.permissions")
    exact_normal_uses(blocks, graph, deny_capture_ref,
        [rf"{re.escape(deny_capture_ref)} = &\({re.escape(request_local)}\.2: std::vec::Vec<Permission>\);",
         rf"{re.escape(deny_local)} = {re.escape(deny_marker)} \{{ r: move {re.escape(deny_capture_ref)} \}};"],
        "tenant deny request capture")
    v10.dominated(graph, collected_node, iter_node, "tenant iterator")
    v10.dominated(graph, collected_node, enum_node, "tenant enumeration")
    v10.dominated(graph, collected_node, map_node, "tenant selected map")
    v10.require(len(v10.sites(blocks, r"::collect::<Vec<bool>>\(")) == 1 and
                len(v10.sites(blocks, r"::map::<bool,")) == 1,
                "tenant: alternate bool collection path")
    exact_normal_uses(blocks, graph, permission_ref,
        [rf"{re.escape(permission_ref)} = &\({re.escape(request_local)}\.2: std::vec::Vec<Permission>\);",
         rf"{re.escape(slice_ref)} = <Vec<Permission> as Deref>::deref\(move {re.escape(permission_ref)}\) -> .+"],
        "tenant request permissions")
    exact_normal_uses(blocks, graph, slice_ref,
        [rf"{re.escape(slice_ref)} = <Vec<Permission> as Deref>::deref\(move {re.escape(permission_ref)}\) -> .+",
         rf"{re.escape(iterator)} = core::slice::<impl \[Permission\]>::iter\(copy {re.escape(slice_ref)}\) -> .+"],
        "tenant selected slice")
    exact_normal_uses(blocks, graph, iterator,
        [rf"{re.escape(iterator)} = core::slice::<impl \[Permission\]>::iter\(copy {re.escape(slice_ref)}\) -> .+",
         rf"{re.escape(enumerated)} = .*::enumerate\(move {re.escape(iterator)}\) -> .+"],
        "tenant selected iterator")
    exact_normal_uses(blocks, graph, enumerated,
        [rf"{re.escape(enumerated)} = .*::enumerate\(move {re.escape(iterator)}\) -> .+",
         rf"{re.escape(mapped)} = .*::map::<bool, .*\(move {re.escape(enumerated)}, move {re.escape(closure)}\) -> .+"],
        "tenant selected enumeration")
    exact_normal_uses(blocks, graph, mapped,
        [rf"{re.escape(mapped)} = .*::map::<bool, .*\(move {re.escape(enumerated)}, move {re.escape(closure)}\) -> .+",
         rf"{re.escape(collected)} = .*::collect::<Vec<bool>>\(move {re.escape(mapped)}\) -> .+"],
        "tenant selected mapped iterator")
    exact_normal_uses(blocks, graph, collected,
        [rf"{re.escape(collected)} = .*::collect::<Vec<bool>>\(move {re.escape(mapped)}\) -> .+",
         rf"_0 = Result::<Vec<bool>, Box<dyn StdError>>::Ok\(move {re.escape(collected)}\);"],
        "tenant collected vector")

    # Classify every normal return-place write. Early positive-looking
    # Vec<bool> results must all come from the checked false-vector helper.
    writes = v10.return_writes(blocks)
    v10.reject_address_escape(blocks, "_0", "tenant evaluate return place")
    ok_pattern = re.compile(r"Result::<Vec<bool>, Box<dyn StdError>>::Ok\(move (_\d+)\);")
    early, errors, deny_refs = [], [], []
    for node, value in writes:
        ok = ok_pattern.fullmatch(value)
        if ok:
            if node == ok_node and ok.group(1) == collected:
                continue
            payload = ok.group(1)
            assignments = v10.assignment_sites(blocks, payload)
            v10.require(len(assignments) == 1,
                        "tenant: early Ok payload rebound")
            source, rhs = assignments[0]
            call = re.fullmatch(
                rf"<{re.escape(deny_marker)} as Fn<\(\)>>::call\(move (_\d+), const \(\)\) -> \[return: {re.escape(node)},[^\n]+",
                rhs)
            v10.require(call is not None and node in graph[source],
                        "tenant: early Ok source changed")
            deny_ref = call.group(1)
            v10.require(v10.assignment_sites(blocks, deny_ref) ==
                        [(source, f"&{deny_local};")],
                        "tenant: early Ok calls a different deny helper")
            deny_refs.append(deny_ref)
            exact_normal_uses(blocks, graph, payload,
                [rf"{re.escape(payload)} = <{re.escape(deny_marker)} as Fn<\(\)>>::call\(move _\d+, const \(\)\) -> .+",
                 rf"_0 = Result::<Vec<bool>, Box<dyn StdError>>::Ok\(move {re.escape(payload)}\);"],
                "tenant early false vector")
            early.append(node)
        elif value.startswith("Result::<Vec<bool>, Box<dyn StdError>>::Err(") or (
            value.startswith("<Result<Vec<bool>, Box<dyn StdError>> as FromResidual<Result<Infallible,")
            and ">::from_residual(" in value):
            errors.append(node)
        else:
            raise ValueError(f"tenant: unclassified evaluate return:{node}:{value[:110]}")
    v10.require(len(early) == 7 and errors and len(writes) == 8 + len(errors),
                "tenant: evaluate return partition changed")
    exact_normal_uses(blocks, graph, deny_local,
        [rf"{re.escape(deny_local)} = {re.escape(deny_marker)} \{{ r: move {re.escape(deny_capture_ref)} \}};"] +
        [rf"{re.escape(ref)} = &{re.escape(deny_local)};" for ref in deny_refs],
        "tenant early deny helper")
    v10.require(all(not v8.reachable(graph, node, ok_node) for node in early),
                "tenant: early deny path reaches collected Ok")
    return {"function": name, "deny_helper": denial,
            "selected_map_closure": map_names[0], "iter_block": iter_node,
            "enumerate_block": enum_node, "map_block": map_node,
            "collect_block": collected_node, "selected_ok_block": ok_node,
            "early_false_vector_count": len(early), "error_return_count": len(errors),
            "selected_vector_normal_mir_provenance": "pass",
            "iterator_execution_and_order_semantics_proven": False}


def main_projection(mir: str) -> dict:
    _, blocks, graph = v10.selected_body(mir, "main() -> ()")
    call, matched = one(blocks,
        r"(?m)^\s*(_\d+) = evaluate\(\) -> \[return: (bb\d+),",
        "tenant main evaluate")
    result, default_node = matched.groups()
    v10.single_assignment(blocks, result, "tenant main evaluate result")
    default, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = Result::<Vec<bool>, Box<dyn StdError>>::unwrap_or_default\(move {re.escape(result)}\) -> \[return: (bb\d+),",
        "tenant main default projection")
    vector, value_node = matched.groups()
    v10.require(default == default_node and value_node in graph[default],
                "tenant: main default projection changed")
    v10.require(len(v10.assignment_sites(blocks, vector)) == 1,
                "tenant: main vector rebound")
    vector_ref, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = &{re.escape(vector)};$",
        "tenant main vector reference")
    vector_reference = matched.group(1)
    v10.require(vector_ref == value_node and
                len(v10.assignment_sites(blocks, vector_reference)) == 1,
                "tenant: main vector reference changed")
    to_value, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = to_value::<&Vec<bool>>\(move {re.escape(vector_reference)}\) -> \[return: (bb\d+),",
        "tenant main JSON value conversion")
    result_value, unwrap_node = matched.groups()
    v10.require(to_value == value_node and unwrap_node in graph[to_value] and
                len(v10.assignment_sites(blocks, result_value)) == 1,
                "tenant: selected vector-to-value path changed")
    unwrap, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = Result::<serde_json::Value, serde_json::Error>::unwrap\(move {re.escape(result_value)}\) -> \[return: (bb\d+),",
        "tenant main JSON value unwrap")
    value, insert_node = matched.groups()
    v10.require(unwrap == unwrap_node and insert_node in graph[unwrap] and
                len(v10.assignment_sites(blocks, value)) == 1,
                "tenant: main JSON value changed")
    key_node, matched = one(blocks,
        r'(?m)^\s*(_\d+) = const "decisions";$', "tenant JSON decisions key")
    key_literal = matched.group(1)
    string_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = <&str as Into<std::string::String>>::into\(move {re.escape(key_literal)}\) -> \[return: (bb\d+),",
        "tenant JSON key string")
    key, key_return = matched.groups()
    v10.require(string_node == key_node and key_return == call and
                len(v10.assignment_sites(blocks, key)) == 1,
                "tenant: selected JSON key changed")
    insert, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = serde_json::Map::<std::string::String, serde_json::Value>::insert\(move (_\d+), move {re.escape(key)}, move {re.escape(value)}\) -> \[return: (bb\d+),",
        "tenant JSON object insertion")
    _, map_ref, after_insert = matched.groups()
    v10.require(insert == insert_node and after_insert in graph[insert] and
                len(v10.sites(blocks, r"serde_json::Map::<std::string::String, serde_json::Value>::insert\(")) == 1,
                "tenant: selected JSON insertion changed")
    map_ref_sites = v10.assignment_sites(blocks, map_ref)
    v10.require(len(map_ref_sites) == 1 and map_ref_sites[0][1].startswith("&mut "),
                "tenant: JSON object map source changed")
    map_local = map_ref_sites[0][1][5:-1]
    map_writes = v10.assignment_sites(blocks, map_local)
    v10.require(len(map_writes) == 1 and
                "serde_json::Map::<std::string::String, serde_json::Value>::new()" in
                    map_writes[0][1],
                "tenant: JSON object map construction changed")
    object_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = Object\(move (_\d+)\);$",
        "tenant JSON object")
    selected_object, moved_map = matched.groups()
    v10.require(len(v10.assignment_sites(blocks, moved_map)) == 1 and
                v10.assignment_sites(blocks, moved_map)[0] ==
                    (object_node, f"move {map_local};") and
                len(v10.assignment_sites(blocks, selected_object)) == 1,
                "tenant: selected JSON object source changed")
    display, matched = one(blocks,
        r"(?m)^\s*(_\d+) = core::fmt::rt::Argument::<'_>::new_display::<serde_json::Value>\(copy (_\d+)\) -> \[return: (bb\d+),",
        "tenant JSON display argument")
    display_arg, display_arg_ref_from_call, format_node = matched.groups()
    v10.require(display == object_node and format_node in graph[display],
                "tenant: JSON object not selected for display")
    display_ref_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = &{re.escape(selected_object)};$",
        "tenant JSON display reference")
    display_ref = matched.group(1)
    v10.require(display_ref_node == object_node and
                len(v10.assignment_sites(blocks, display_ref)) == 1,
                "tenant: selected JSON display reference changed")
    display_tuple_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = \(move {re.escape(display_ref)},\);$",
        "tenant JSON display tuple")
    display_tuple = matched.group(1)
    v10.require(display_tuple_node == object_node and
                len(v10.assignment_sites(blocks, display_tuple)) == 1,
                "tenant: selected JSON display tuple changed")
    display_arg_ref_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = no_retag copy \({re.escape(display_tuple)}\.0: &serde_json::Value\);$",
        "tenant JSON selected display argument")
    display_arg_ref = matched.group(1)
    v10.require(display_arg_ref_node == object_node and
                len(v10.assignment_sites(blocks, display_arg_ref)) == 1 and
                display_arg_ref == display_arg_ref_from_call and
                re.search(rf"new_display::<serde_json::Value>\(copy {re.escape(display_arg_ref)}\)",
                          blocks[display]) is not None,
                "tenant: selected JSON value not used for display")
    v10.require(len(v10.assignment_sites(blocks, display_arg)) == 1,
                "tenant: JSON display argument rebound")
    array_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = \[move {re.escape(display_arg)}\];$",
        "tenant JSON format array")
    format_array = matched.group(1)
    v10.require(array_node == format_node and
                len(v10.assignment_sites(blocks, format_array)) == 1,
                "tenant: JSON format array changed")
    array_ref_node, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = &{re.escape(format_array)};$",
        "tenant JSON format array reference")
    format_array_ref = matched.group(1)
    v10.require(array_ref_node == format_node and
                len(v10.assignment_sites(blocks, format_array_ref)) == 1,
                "tenant: JSON format array reference changed")
    format_construct, matched = one(blocks,
        rf"(?m)^\s*(_\d+) = Arguments::<'_>::new::<4, 1>\(move (_\d+), copy {re.escape(format_array_ref)}\) -> \[return: (bb\d+),",
        "tenant JSON format construction")
    formatted, template, print_return = matched.groups()
    v10.require(format_construct == format_node and print_return in graph[format_construct] and
                v10.assignment_sites(blocks, template) ==
                    [(format_node, 'const b"\\xc0\\x01\\n\\x00";')] and
                len(v10.assignment_sites(blocks, formatted)) == 1,
                "tenant: selected JSON format template/path changed")
    v10.require(len(v10.sites(blocks, r"std::io::_print\(")) == 1 and
                len(v10.sites(blocks, r"(?m)^\s*return;")) == 1,
                "tenant: alternate output site")
    print_node, _ = one(blocks,
        rf"(?m)^\s*_\d+ = std::io::_print\(move {re.escape(formatted)}\) -> \[return: bb\d+",
        "tenant selected print")
    v10.require(print_node == print_return,
                "tenant: selected formatted argument not printed")
    return_sites = v10.sites(blocks, r"(?m)^\s*return;$")
    v10.require(len(return_sites) == 1,
                "tenant: main normal return classification changed")
    v10.dominated(graph, return_sites[0][0], print_node,
                  "tenant selected print-to-return")
    exact_normal_uses(blocks, graph, vector,
        [rf"{re.escape(vector)} = Result::<Vec<bool>, Box<dyn StdError>>::unwrap_or_default\(move {re.escape(result)}\) -> .+",
         rf"{re.escape(vector_reference)} = &{re.escape(vector)};",
         rf"drop\({re.escape(vector)}\) -> .+"],
        "tenant main selected vector")
    exact_normal_uses(blocks, graph, value,
        [rf"{re.escape(value)} = Result::<serde_json::Value, serde_json::Error>::unwrap\(move {re.escape(result_value)}\) -> .+",
         rf"_\d+ = serde_json::Map::<std::string::String, serde_json::Value>::insert\(move {re.escape(map_ref)}, move {re.escape(key)}, move {re.escape(value)}\) -> .+"],
        "tenant main selected JSON value")
    exact_normal_uses(blocks, graph, map_ref,
        [rf"{re.escape(map_ref)} = &mut {re.escape(map_local)};",
         rf"_\d+ = serde_json::Map::<std::string::String, serde_json::Value>::insert\(move {re.escape(map_ref)}, move {re.escape(key)}, move {re.escape(value)}\) -> .+"],
        "tenant main selected map borrow")
    exact_normal_uses(blocks, graph, map_local,
        [rf"{re.escape(map_local)} = serde_json::Map::<std::string::String, serde_json::Value>::new\(\) -> .+",
         rf"{re.escape(map_ref)} = &mut {re.escape(map_local)};",
         rf"{re.escape(moved_map)} = move {re.escape(map_local)};"],
        "tenant main selected JSON map")
    exact_normal_uses(blocks, graph, selected_object,
        [rf"{re.escape(selected_object)} = Object\(move {re.escape(moved_map)}\);",
         rf"{re.escape(display_ref)} = &{re.escape(selected_object)};",
         rf"drop\({re.escape(selected_object)}\) -> .+"],
        "tenant main selected JSON object")
    v10.dominated(graph, print_node, call, "tenant evaluate-to-print")
    v10.dominated(graph, print_node, insert, "tenant JSON insert-to-print")
    return {"function": "main() -> ()", "evaluate_call_block": call,
            "default_block": default, "json_insert_block": insert,
            "object_block": object_node, "selected_print_block": print_node,
            "selected_json_print_argument_provenance": "pass",
            "json_or_stdout_byte_semantics_proven": False}


def inspect(root_id: str, mir: dict[str, str], identities: dict) -> dict:
    predecessor = v11a.inspect(root_id, mir, identities)
    if root_id == TENANT:
        source = mir[v6.ROOT_MANIFESTS[TENANT]]
        predecessor["tenant_evaluate_projection"] = evaluate_projection(source)
        predecessor["tenant_main_projection"] = main_projection(source)
    return predecessor


def evaluate() -> dict:
    current = v7.evaluate(mir_inspector=inspect)
    v10.require(current["status"] == "indeterminate" and
                current["runtime_guarantees_observed"] is False,
                "tenant root-context predecessor posture changed")
    return {"schema_version": "auth-foundation.v4b-tenant-projection/v11b-candidate",
            "status": "indeterminate", "root_context_builds": current["root_context_builds"],
            "bounded_tenant_selected_projection": "pass",
            "public_stdout_byte_semantics_closed": False,
            "allow_output_provenance_closed": False,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "trusted_summaries": ["std Iterator::enumerate/map/collect order and invocation",
                                  "std Result::unwrap_or_default maps Err to empty Vec",
                                  "serde_json::to_value/Map::insert/Object/Display",
                                  "Rust formatting and std::io::_print consume selected argument"],
            "claim_limit": "Normal-MIR selected tenant per-item bool through typed map/collect and selected JSON print argument, conditional on the listed std/serde summaries. No byte-level output, all-native-entrypoint no-call, effect closure, or runtime guarantee."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
