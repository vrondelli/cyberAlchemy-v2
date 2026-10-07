#!/usr/bin/env python3
"""Finite same-build bridge mapping of counterfactual gate DENY to false.

The three bridge bodies are parsed separately. This is MIR/source return
compatibility plus V40 finite replay, not a cross-crate execution proof.
"""

from __future__ import annotations

import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent


def load(label: str, name: str):
    spec = importlib.util.spec_from_file_location(label, CASE / name)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


v41 = load("auth_v41_for_v42", "auth-v4b-deny-return-effect-slice-v41.py")
v40, v5, v26 = v41.v40, v41.v5, v41.v26
ROOTS = ("prototype", "https", "tenant")
STATE_MANIFEST = "authorization-state-model/Cargo.toml"
STATE_SOURCE = "authorization-state-model/src/lib.rs"
ROOT_MATCH = "Ok(AdmissionOutcome::Ready(BinaryAuthorizationDecision::Allow))"


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError(reason)


def parse_enum_tags(authority: str, state: str) -> dict:
    """Derive implicit Rust enum tags from declarations, not assumed numbers."""
    definitions = ((authority, r"pub enum AdmissionOutcome<T> \{([^}]+)\}",
                    ("Denied", "PreparationFailed", "ReadyStateFailed", "Ready")),
                   (state, r"pub enum BinaryAuthorizationDecision \{([^}]+)\}",
                    ("Allow", "Deny")))
    result = {}
    for source, pattern, expected in definitions:
        matches = re.findall(pattern, source, re.S)
        require(len(matches) == 1, "V42 selected enum declaration ambiguous")
        lines = [line.strip() for line in matches[0].splitlines() if line.strip()]
        names = tuple(re.match(r"(\w+)(?:\([^=]*\))?,?$", line).group(1)
                      if re.match(r"(\w+)(?:\([^=]*\))?,?$", line) else ""
                      for line in lines)
        require(names == expected and all("=" not in line for line in lines),
                "V42 implicit enum variant order changed")
        result[expected[0]] = {name: index for index, name in enumerate(names)}
    return {"outcome": result["Denied"], "decision": result["Allow"]}


def enum_tags(variant: str = "clean") -> dict:
    """Bind each variant's compiled authority source and selected state source."""
    baseline = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    authority = v40.mutate_authority(baseline, variant)
    state = (v40.v29.ORIGINAL_IMPL / STATE_SOURCE).read_text()
    return {**parse_enum_tags(authority, state),
            "authority_baseline_source_sha256": v40.v29.sha(baseline.encode()),
            "authority_variant_source_sha256": v40.v29.sha(authority.encode()),
            "state_source_sha256": v40.v29.sha(state.encode())}


def check_variant_source_binding(variant: str, mapping: dict,
                                 variant_row: dict, selected_before: dict) -> None:
    require(STATE_SOURCE in selected_before and v40.AUTHORITY in selected_before,
            "V42 enum sources absent from selected V40 snapshot")
    require(mapping["enum_source_sha256"]["authority_baseline"] ==
            selected_before[v40.AUTHORITY] and
            mapping["enum_source_sha256"]["authority_variant"] ==
            variant_row["source_sha256"][v40.AUTHORITY] and
            mapping["enum_source_sha256"]["state_model"] ==
            selected_before[STATE_SOURCE] and
            variant_row["selected_mir_inspection"]["v42_bridge_mapping"]["variant"] == variant,
            f"V42 {variant} enum source/same-build binding changed")


def branch(block: str, expression: str) -> tuple[str, dict[str, str]]:
    match = re.search(rf"(_\d+) = discriminant\({re.escape(expression)}\);\s*"
                      rf"switchInt\(move \1\) -> \[([^]]+)\];", block)
    require(match is not None, "V42 discriminant/switch def-use changed")
    rows = re.findall(r"(\d+|otherwise): (bb\d+)", match.group(2))
    require(rows and len(rows) == match.group(2).count("bb") and
            len(dict(rows)) == len(rows), "V42 switch arm set ambiguous")
    return match.group(1), dict(rows)


def unique_def(body: str, local: str, expected: int = 1) -> None:
    require(len(re.findall(rf"(?m)^\s*{re.escape(local)} =", body)) == expected,
            f"V42 local rebound:{local}")


def root_mapping(root: str, root_mir: str, tags: dict) -> dict:
    require(root in ROOTS, "V42 root outside bridge set")
    items = v5.functions(root_mir)
    identity = v5.root_callback(root, root_mir, items)
    body = items[identity["function"]]
    blocks = v26.compiled_blocks(body)
    normal, full = v41.successors(blocks)
    call = identity["block"]
    result = identity["call_result_local"]
    unique_def(body, result)
    call_match = re.search(rf"{re.escape(result)} = SqliteAdmissionService::with_ready::<"
                           r"BinaryAuthorizationDecision>\([^\n]+\) -> \[return: (bb\d+),",
                           blocks[call])
    require(call_match is not None, "V42 service-result local/call changed")
    first = call_match.group(1)
    result_disc, result_arms = branch(blocks[first], result)
    unique_def(body, result_disc)
    require(set(result_arms) == {"0", "1", "otherwise"},
            "V42 Result arms changed")
    require(blocks[result_arms["otherwise"]].strip() == "unreachable;",
            "V42 Result otherwise arm not unreachable")
    ok_candidates = [node for key, node in result_arms.items() if key != "otherwise" and
                     f"({result} as Ok)" in blocks[node]]
    require(len(ok_candidates) == 1, "V42 Result Ok downcast arm ambiguous")
    ok_arm = ok_candidates[0]
    error_arm = next(node for key, node in result_arms.items()
                     if key != "otherwise" and node != ok_arm)
    outcome_expr = (f"(({result} as Ok).0: auth_foundation_authorization_admission_service::"
                    "AdmissionOutcome<auth_foundation_authorization_state_model::"
                    "BinaryAuthorizationDecision>)")
    outcome_disc, outcome_arms = branch(blocks[ok_arm], outcome_expr)
    unique_def(body, outcome_disc)
    ready_tag = str(tags["outcome"]["Ready"])
    deny_tag = str(tags["outcome"]["Denied"])
    require(set(outcome_arms) == {ready_tag, "otherwise"} and
            deny_tag != ready_tag, "V42 AdmissionOutcome Ready/DENY arms changed")
    ready_arm, nonready_arm = outcome_arms[ready_tag], outcome_arms["otherwise"]
    decision_expr = (f"(({outcome_expr} as Ready).0: "
                     "auth_foundation_authorization_state_model::BinaryAuthorizationDecision)")
    decision_disc, decision_arms = branch(blocks[ready_arm], decision_expr)
    unique_def(body, decision_disc)
    allow_tag = str(tags["decision"]["Allow"])
    deny_decision_tag = str(tags["decision"]["Deny"])
    require(set(decision_arms) == {allow_tag, deny_decision_tag, "otherwise"},
            "V42 binary decision arms changed")
    require(blocks[decision_arms["otherwise"]].strip() == "unreachable;",
            "V42 binary decision otherwise arm not unreachable")
    true_arm = decision_arms[allow_tag]
    false_arm = nonready_arm
    require(error_arm == false_arm and decision_arms[deny_decision_tag] == false_arm,
            "V42 all non-ALLOW arms must converge on false")
    false_match = re.search(r"(?m)^\s*(_\d+) = const false;\s*goto -> (bb\d+);",
                            blocks[false_arm])
    true_match = re.search(r"(?m)^\s*(_\d+) = const true;\s*goto -> (bb\d+);",
                           blocks[true_arm])
    if root == "tenant":
        false_match = re.search(r"(?m)^\s*(_0) = const false;\s*goto -> (bb\d+);",
                                blocks[false_arm])
        true_match = re.search(r"(?m)^\s*(_0) = const true;\s*goto -> (bb\d+);",
                               blocks[true_arm])
    require(false_match is not None and true_match is not None and
            false_match.group(1) == true_match.group(1) and
            false_match.group(2) == true_match.group(2),
            "V42 true/false merge changed")
    boolean, merge = false_match.groups()
    unique_def(body, boolean, 2)
    require(true_arm not in v41.reach(normal, false_arm) and
            merge in v41.reach(normal, false_arm) and
            not any(re.search(rf"(?m)^\s*{re.escape(boolean)} =", blocks[node])
                    for node in v41.reach(normal, false_arm) - {false_arm}),
            "V42 false path reaches true or rebinds boolean")
    if root == "tenant":
        require(boolean == "_0" and blocks[merge].strip() == "return;",
                "V42 tenant closure false return changed")
        output = tenant_collect(items, identity["function"])
    else:
        require(re.search(rf"_0 = Result::<bool, Box<dyn StdError>>::Ok\(move {re.escape(boolean)}\);",
                          blocks[merge]) is not None,
                "V42 bridge false to Ok(false) changed")
        v41.preserved_return_local(
            blocks, normal, merge,
            f"_0 = Result::<bool, Box<dyn StdError>>::Ok(move {boolean});",
            f"{root} Ok(false)")
        output = single_main(items)
    return {"function": identity["function"], "service_call_block": call,
            "service_result_local": result, "result_discriminant": result_disc,
            "result_ok_arm": ok_arm, "result_error_arm": error_arm,
            "outcome_discriminant": outcome_disc, "ready_arm": ready_arm,
            "gate_denied_takes_nonready_arm": nonready_arm,
            "decision_discriminant": decision_disc, "true_arm": true_arm,
            "false_arm": false_arm, "boolean_local": boolean,
            "false_merge": merge, "output": output,
            "selected_local_mir_gate_deny_maps_false": True,
            "cross_body_gate_deny_to_root_proven": False,
            "root_effects": v41.effect_rows(blocks, normal, full, first)}


def single_main(items: dict[str, str]) -> dict:
    _, body = v5.selected(items, "main(")
    blocks = v26.compiled_blocks(body)
    normal, _ = v41.successors(blocks)
    calls = [(node, match) for node, content in blocks.items()
             if (match := re.search(r"(_\d+) = evaluate\(\) -> \[return: (bb\d+),", content))]
    require(len(calls) == 1, "V42 bridge main evaluate call changed")
    call, match = calls[0]
    outcome, continuation = match.groups()
    unique_def(body, outcome)
    unwrap = re.search(rf"(_\d+) = Result::<bool, Box<dyn StdError>>::unwrap_or\(move "
                       rf"{re.escape(outcome)}, const false\) -> \[return: (bb\d+),",
                       blocks[continuation])
    require(unwrap is not None, "V42 bridge main false fallback changed")
    boolean, switch = unwrap.groups()
    unique_def(body, boolean)
    arms = re.search(rf"switchInt\(copy {re.escape(boolean)}\) -> "
                     r"\[0: (bb\d+), otherwise: (bb\d+)\]", blocks[switch])
    require(arms is not None, "V42 bridge main boolean output branch changed")
    deny, allow = arms.groups()
    deny_const = re.search(r"(?m)^\s*(_\d+) = const ", blocks[deny])
    allow_const = re.search(r"(?m)^\s*(_\d+) = const ", blocks[allow])
    require(deny_const is not None and allow_const is not None and
            deny_const.group(1) == allow_const.group(1) and
            'const "{\\"decision\\":\\"DENY\\"}";' in blocks[deny] and
            'const "{\\"decision\\":\\"ALLOW\\"}";' in blocks[allow] and
            allow not in v41.reach(normal, deny) and
            any(f"= &{deny_const.group(1)};" in blocks[node]
                for node in v41.reach(normal, deny)) and
            any("std::io::_print(" in blocks[node]
                for node in v41.reach(normal, deny)),
            "V42 bridge main terminal JSON branch changed")
    unique_def(body, deny_const.group(1), 2)
    return {"evaluate_call_block": call, "unwrap_or_false_block": continuation,
            "false_json_block": deny, "true_json_block": allow,
            "source_error_fallback_is_false": True,
            "terminal_json_print_value_def_use_proven": False,
            "cross_body_false_transfer_proven": False}


def tenant_collect(items: dict[str, str], closure_name: str) -> dict:
    _, body = v5.selected(items, "evaluate(")
    blocks = v26.compiled_blocks(body)
    closure_anchor = re.search(r"\{closure@src/main.rs:(\d+):\d+: \1:\d+\}", closure_name)
    require(closure_anchor is not None, "V42 tenant selected map closure identity changed")
    closure_id = closure_anchor.group(0)
    map_calls = [(node, re.search(r"(_\d+) = <std::iter::Enumerate<.* as "
                                  r"std::iter::Iterator>::map::<bool, " + re.escape(closure_id) +
                                  r">\([^\n]+\) -> \[return: (bb\d+),", content))
                 for node, content in blocks.items() if "Iterator>::map::<bool" in content]
    require(len(map_calls) == 1 and map_calls[0][1] is not None,
            "V42 tenant bool map call changed")
    map_block, map_match = map_calls[0]
    mapped, collect_block = map_match.groups()
    collected = re.search(rf"(_\d+) = <std::iter::Map<.*{re.escape(closure_id)}.*"
                          rf"Iterator>::collect::<Vec<bool>>\(move {re.escape(mapped)}\)"
                          r" -> \[return: (bb\d+),", blocks[collect_block])
    require(collected is not None, "V42 tenant selected Vec<bool> collect changed")
    vector, ok_block = collected.groups()
    require(f"_0 = Result::<Vec<bool>, Box<dyn StdError>>::Ok(move {vector});" in
            blocks[ok_block], "V42 tenant collected bool vector to Ok changed")
    main_name, main_body = v5.selected(items, "main(")
    main_blocks = v26.compiled_blocks(main_body)
    calls = [(node, re.search(r"(_\d+) = evaluate\(\) -> \[return: (bb\d+),", content))
             for node, content in main_blocks.items() if "= evaluate() ->" in content]
    require(len(calls) == 1 and calls[0][1] is not None,
            "V42 tenant main evaluate call changed")
    eval_result, unwrap_block = calls[0][1].groups()
    unwrapped = re.search(rf"(_\d+) = Result::<Vec<bool>, Box<dyn StdError>>::"
                          rf"unwrap_or_default\(move {re.escape(eval_result)}\)"
                          r" -> \[return: (bb\d+),", main_blocks[unwrap_block])
    require(unwrapped is not None, "V42 tenant whole-error empty-vector fallback changed")
    vector_main, json_block = unwrapped.groups()
    unique_def(main_body, vector_main)
    require(re.search(rf"(_\d+) = &{re.escape(vector_main)};\s*"
                      rf"_\d+ = to_value::<&Vec<bool>>\(move \1\) ->",
                      main_blocks[json_block])
            is not None and any("std::io::_print(" in content for content in main_blocks.values()),
            "V42 tenant JSON vector output changed")
    return {"map_block": map_block, "collect_block": collect_block,
            "collect_ok_block": ok_block, "main_evaluate_block": calls[0][0],
            "main_unwrap_or_default_block": unwrap_block,
            "main_json_block": json_block,
            "whole_evaluation_error_yields_empty_vec_by_std_semantics": True,
            "terminal_json_print_value_def_use_proven": False,
            "cross_body_closure_to_collect_proven": False}


def inspect_same_build(root: str, mir: dict[str, str], identities: dict,
                       variant: str) -> dict:
    require(root in ROOTS and STATE_MANIFEST in mir,
            "V42 selected bridge or state-model MIR absent")
    prior = v41.inspect_same_build(root, mir, identities, variant)
    tags = enum_tags(variant)
    root_manifest = v40.v29.v6.ROOT_MANIFESTS[root]
    source = (v40.v29.ORIGINAL_IMPL / v40.v29.ROOT_SOURCE[root]).read_text()
    require(source.count(ROOT_MATCH) == 1,
            "V42 selected bridge source match anchor changed")
    mapping = root_mapping(root, mir[root_manifest], tags)
    return {**prior, "v42_bridge_mapping": {
        "root_id": root, "variant": variant, "enum_tags_derived_from_selected_source":
            {"outcome": tags["outcome"], "decision": tags["decision"]},
        "enum_source_sha256": {"authority_baseline":
                               tags["authority_baseline_source_sha256"],
                               "authority_variant":
                               tags["authority_variant_source_sha256"],
                               "state_model": tags["state_source_sha256"]},
        "state_model_mir_sha256": identities[STATE_MANIFEST]["mir_sha256"],
        "root_mir_sha256": identities[root_manifest]["mir_sha256"],
        **mapping}}


def evaluate_root(root: str, inventory: dict, model: dict) -> dict:
    require(root in ROOTS, "V42 non-bridge root")
    manifest = v40.v29.v6.ROOT_MANIFESTS[root]
    metadata, _ = v40.v29.v7.root_metadata(root, manifest)
    manifests = v40.v29.package_manifests(root, metadata)
    paths = v40.v29.selected_files(manifests)
    selected_before = v40.v29.snapshot(paths)
    require(STATE_SOURCE in selected_before and v40.AUTHORITY in selected_before,
            "V42 selected V40 source snapshot lacks enum declarations")
    previous = v40.inspect_mir
    try:
        v40.inspect_mir = inspect_same_build
        result = v40.evaluate_root(root, inventory, model)
    finally:
        v40.inspect_mir = previous
    require(result["source_bytes_preserved"], "V42 V40 exact-mirror preservation absent")
    for variant, row in result["variants"].items():
        check_variant_source_binding(
            variant, row["selected_mir_inspection"]["v42_bridge_mapping"],
            row, selected_before)
    counterfactual = result["variants"]["cardinality-gate-deny"]
    mapping = counterfactual["selected_mir_inspection"]["v42_bridge_mapping"]
    require(mapping["selected_local_mir_gate_deny_maps_false"] and
            counterfactual["observations"]["duplicate"]["normal_exit"],
            f"V42 {root} counterfactual map/run incomplete")
    return result


def evaluate() -> dict:
    authority = (v40.v29.ORIGINAL_IMPL / v40.AUTHORITY).read_text()
    gate = (v40.v29.ORIGINAL_IMPL / v40.GATE).read_text()
    model = v40.check_named_v30_rejection(authority, gate)
    inventory, predecessor_sha = v40.v29.v7.current_inventory()
    roots = {root: evaluate_root(root, inventory, model) for root in ROOTS}
    return {"schema_version": "auth-foundation.v4b-bridge-deny-mapping/v42-candidate",
            "status": "indeterminate", "predecessor_sha256": predecessor_sha,
            "roots": roots, "root_mapping_flip_compiled_control": "pending",
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Same-build selected bridge MIR maps service Ok(AdmissionOutcome::Denied) to a local false arm, with separate prototype/HTTPS main JSON and tenant map/collect/JSON compatibility. V40 finite counterfactual replay corroborates terminal DENY. Cross-body return execution, a compiled root-mapping-flip control, API worker/timeout, external effects and owner-wide no-call remain unproved."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), sort_keys=True, separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, sort_keys=True),
              file=sys.stderr)
        raise SystemExit(1)
