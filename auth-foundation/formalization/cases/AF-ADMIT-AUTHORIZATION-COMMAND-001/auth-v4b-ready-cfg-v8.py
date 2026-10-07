#!/usr/bin/env python3
"""Bounded normal-path MIR graph for the current READY authority function.

This verifies a local callback-site property, not transitive Auth endpoint or
implicit effect closure. Rustc MIR syntax is pinned by fail-closed parsing.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


CASE = Path(__file__).resolve().parent
ROOT = CASE.parents[3]
IMPL = ROOT / "auth-foundation/implementation"
SOURCE = IMPL / "authorization-ready-authority/src/lib.rs"
MANIFEST = IMPL / "authorization-ready-authority/Cargo.toml"
GATE_SOURCE = IMPL / "command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs"
GATE_MANIFEST = IMPL / "command-boundary-runtime-v2/Cargo.toml"
TOOLCHAIN = ROOT / "tools/toolchain/run"
V5 = CASE / "auth-v4b-typed-target-census-v5.py"
SPEC = importlib.util.spec_from_file_location("auth_v4b_typed_target_census_v5", V5)
assert SPEC and SPEC.loader
v5 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v5)


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def active_rust_source(source: str) -> str:
    """Mask comments and strings so an expected declaration cannot be spoofed.

    This is deliberately a small fail-closed lexical guard, not a Rust parser.
    The selected gate source is also compiled by Cargo before the MIR check.
    """
    chars = list(source)
    position = 0

    def mask(start: int, end: int) -> None:
        for index in range(start, end):
            if chars[index] != "\n":
                chars[index] = " "

    while position < len(source):
        if source.startswith("//", position):
            end = source.find("\n", position)
            end = len(source) if end < 0 else end
            mask(position, end)
            position = end
        elif source.startswith("/*", position):
            start, depth = position, 1
            position += 2
            while position < len(source) and depth:
                if source.startswith("/*", position):
                    depth += 1
                    position += 2
                elif source.startswith("*/", position):
                    depth -= 1
                    position += 2
                else:
                    position += 1
            require(depth == 0, "unclosed gate source block comment")
            mask(start, position)
        elif source[position] == "r" and (raw := re.match(r'r(#{0,255})"', source[position:])):
            start = position
            terminator = '"' + raw.group(1)
            end = source.find(terminator, position + len(raw.group(0)))
            require(end >= 0, "unclosed gate source raw string")
            position = end + len(terminator)
            mask(start, position)
        elif source[position] == '"':
            start = position
            position += 1
            closed = False
            while position < len(source):
                if source[position] == "\\":
                    position += 2
                elif source[position] == '"':
                    position += 1
                    closed = True
                    break
                else:
                    position += 1
            require(closed, "unclosed gate source string")
            mask(start, position)
        else:
            position += 1
    return "".join(chars)


def normal_successors(body: str, blocks: dict[str, str]) -> dict[str, list[str]]:
    """Read only each block's terminator; unwind/cleanup is outside this graph."""
    graph = {}
    for node, content in blocks.items():
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        require(lines, f"empty MIR block:{node}")
        term = lines[-1]
        if term in ("return;", "unreachable;", "resume;", "abort;"):
            successors = []
        elif match := re.fullmatch(r"goto -> (bb\d+);", term):
            successors = [match.group(1)]
        elif term.startswith("switchInt(") and " -> [" in term and term.endswith("];"):
            successors = re.findall(r"(?:\d+|otherwise): (bb\d+)", term)
            require(successors and len(successors) == len(re.findall(r"\bbb\d+\b", term)),
                    f"unparsed switch terminator:{node}")
        elif " -> [" in term and term.endswith("];"):
            labels = re.findall(r"(return|success|unwind): (bb\d+|continue|unreachable)", term)
            require(labels and len(labels) == len(re.findall(r"\bbb\d+\b", term)),
                    f"unparsed call/drop terminator:{node}")
            successors = [target for label, target in labels
                          if label in ("return", "success") and target.startswith("bb")]
            require(successors, f"normal continuation absent:{node}")
        else:
            raise ValueError(f"unknown MIR terminator:{node}:{term[:120]}")
        require(all(target in blocks for target in successors),
                f"normal successor outside selected function:{node}")
        graph[node] = successors
    return graph


def reachable(graph: dict[str, list[str]], start: str, target: str,
              excluded: str | None = None) -> bool:
    pending, seen = [start], set()
    while pending:
        node = pending.pop()
        if node == excluded or node in seen:
            continue
        if node == target:
            return True
        seen.add(node)
        pending.extend(graph[node])
    return False


def extract_graph(mir: str) -> dict:
    items = v5.functions(mir)
    name, body = v5.selected(items, "with_ready_in_transaction(")
    require("_5: fn(ReadyAuthorization<'_, '_>) -> R" in name,
            "authority callback signature changed")
    blocks = v5.blocks(body)
    graph = normal_successors(body, blocks)
    gate_sites = [(node, re.search(
        r"(_\d+) = admit_authorization_command\(copy _\d+\) -> \[return: (bb\d+),",
        content)) for node, content in blocks.items()
        if "= admit_authorization_command(" in content]
    require(len(gate_sites) == 1 and gate_sites[0][1] is not None and
            mir.count("= admit_authorization_command(") == 1, "gate event ambiguous")
    gate, gate_match = gate_sites[0]
    result_local, compare = gate_match.groups()
    require(len(re.findall(rf"(?m)^\s*{re.escape(result_local)} =", body)) == 1,
            "gate result rebound")
    comparison = re.search(
        rf"(_\d+) = &{re.escape(result_local)};\s*"
        r"(_\d+) = const with_ready_in_transaction::[^;]+::promoted\[0\];\s*"
        r"(_\d+) = <CommandBoundaryDecision as PartialEq>::ne\(move \1, move \2\)"
        r" -> \[return: (bb\d+),", blocks[compare])
    require(comparison is not None, "gate result to READY comparison changed")
    branch = comparison.group(4)
    arms = re.search(rf"switchInt\(move {re.escape(comparison.group(3))}\)"
                     r" -> \[0: (bb\d+), otherwise: (bb\d+)\]", blocks[branch])
    require(arms is not None, "gate branch changed")
    ready_arm, deny_arm = arms.groups()
    promoted = re.findall(
        r"(?ms)^const with_ready_in_transaction::promoted\[0\]: &CommandBoundaryDecision = \{(.*?)^}\n",
        mir)
    require(len(promoted) == 1 and promoted[0].count("CommandBoundaryDecision::Ready") == 1 and
            "AdmissionOutcome::<R>::Denied" in blocks[deny_arm],
            "gate compared constant or DENY branch changed")
    callback_pattern = re.compile(r"= copy _5\(copy _\d+\) -> \[return: bb\d+, unwind: bb\d+\];")
    callbacks = sorted(node for node, content in blocks.items() if "= copy _5(" in content)
    executable_body = "\n".join(line for line in body.splitlines()
                                if not line.lstrip().startswith("debug "))
    require(callbacks and all(callback_pattern.search(blocks[node]) for node in callbacks) and
            len(re.findall(r"\b_5\b", executable_body)) == len(callbacks),
            "callback parameter use not closed")
    ready_outputs = [node for node, content in blocks.items()
                     if re.search(r"_0 = AdmissionOutcome::<R>::Ready\(", content)]
    require(len(ready_outputs) == 1, "successful READY outcome ambiguous")
    ready_output = ready_outputs[0]
    require(reachable(graph, "bb0", gate) and reachable(graph, ready_arm, ready_output),
            "gate or successful READY path unreachable")
    return {"function": name, "gate_block": gate, "gate_result_local": result_local,
            "comparison_block": compare, "branch_block": branch,
            "ready_arm": ready_arm, "deny_arm": deny_arm,
            "callback_blocks": callbacks, "ready_output": ready_output,
            "normal_graph": graph}


def check_property(extracted: dict) -> dict:
    graph = extracted["normal_graph"]
    callbacks = set(extracted["callback_blocks"])
    gate = extracted["gate_block"]
    ready_arm, deny_arm = extracted["ready_arm"], extracted["deny_arm"]
    violations = []
    for node in callbacks:
        if reachable(graph, "bb0", node, gate) or reachable(graph, "bb0", node, ready_arm):
            violations.append(f"callback-not-dominated-by-same-gate-ready:{node}")
        if reachable(graph, deny_arm, node):
            violations.append(f"callback-reachable-from-deny:{node}")

    # Count callback entries on every finite normal path that reaches the
    # successful READY outcome. Saturation at two is enough to reject duplicates.
    pending = [(ready_arm, 0)]
    seen = set()
    successful_counts = set()
    while pending:
        node, before = pending.pop()
        state = (node, before)
        if state in seen:
            continue
        seen.add(state)
        count = min(2, before + (node in callbacks))
        if node == extracted["ready_output"]:
            successful_counts.add(count)
        pending.extend((next_node, count) for next_node in graph[node])
    if successful_counts != {1}:
        violations.append(f"successful-ready-callback-counts:{sorted(successful_counts)}")
    return {"status": "pass" if not violations else "fail",
            "violations": violations,
            "successful_ready_callback_counts": sorted(successful_counts),
            "normal_path_only": True,
            "unwind_and_implicit_effects_closed": False}


def require_bounded_pass(extracted: dict) -> dict:
    verdict = check_property(extracted)
    require(verdict["status"] == "pass",
            "bounded normal-path graph property failed:" + ",".join(verdict["violations"]))
    return verdict


def compile_authority(manifest: Path = MANIFEST) -> str:
    with tempfile.TemporaryDirectory(prefix="auth-v4b-ready-cfg-v8-") as temporary:
        target = Path(temporary)
        run = subprocess.run([str(TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                              "--target-dir", str(target), "--manifest-path", str(manifest),
                              "--lib", "--", "--emit=mir"], cwd=ROOT,
                             capture_output=True, text=True, timeout=600, check=False)
        require(run.returncode == 0, f"authority MIR compile failed:{run.stderr[-1600:]}")
        candidates = list((target / "debug/deps").glob(
            "auth_foundation_authorization_ready_authority-*.mir"))
        require(len(candidates) == 1 and not candidates[0].is_symlink(),
                "authority MIR artifact ambiguous")
        return candidates[0].read_text()


def compile_gate_mir() -> str:
    with tempfile.TemporaryDirectory(prefix="auth-v4b-ready-gate-mir-") as temporary:
        target = Path(temporary)
        run = subprocess.run([str(TOOLCHAIN), "cargo", "rustc", "--offline", "--locked",
                              "--target-dir", str(target), "--manifest-path", str(GATE_MANIFEST),
                              "--lib", "--", "--emit=mir"], cwd=ROOT,
                             capture_output=True, text=True, timeout=600, check=False)
        require(run.returncode == 0, f"gate MIR compile failed:{run.stderr[-1600:]}")
        candidates = list((target / "debug/deps").glob(
            "auth_foundation_command_boundary_v2_auth_command_boundary_admit_authorization_command-*.mir"))
        require(len(candidates) == 1 and not candidates[0].is_symlink(),
                "gate MIR artifact ambiguous")
        return candidates[0].read_text()


def check_gate_equality_mir(mir: str) -> str:
    """Check the compiled enum equality, not an inactive cfg/source lookalike."""
    items = v5.functions(mir)
    equality = [(name, body) for name, body in items.items()
                if ">::eq(_1: &CommandBoundaryDecision, _2: &CommandBoundaryDecision) -> bool" in name]
    inequality = [name for name in items
                  if ">::ne(_1: &CommandBoundaryDecision, _2: &CommandBoundaryDecision) -> bool" in name]
    require(len(equality) == 1 and not inequality, "compiled gate equality implementation changed")
    name, body = equality[0]
    blocks = v5.blocks(body)
    expected = ("_3 = discriminant((*_1));\n"
                "_4 = discriminant((*_2));\n"
                "_0 = Eq(copy _3, copy _4);\n"
                "return;")
    require(len(blocks) == 1 and "\n".join(line.strip() for line in blocks["bb0"].splitlines()
                                            if line.strip()) == expected,
            "compiled gate equality is not discriminant equality")
    return name


def evaluate_current() -> dict:
    before = {str(path.relative_to(ROOT)): digest(path.read_bytes())
              for path in (SOURCE, MANIFEST, GATE_SOURCE, GATE_MANIFEST, V5)}
    gate_source = active_rust_source(GATE_SOURCE.read_text())
    require("#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]\n"
            "pub enum CommandBoundaryDecision {\n    Ready,\n    Deny,\n}" in gate_source,
            "gate READY/DENY equality source changed")
    mir = compile_authority()
    gate_mir = compile_gate_mir()
    gate_equality_function = check_gate_equality_mir(gate_mir)
    require(before == {str(path.relative_to(ROOT)): digest(path.read_bytes())
                       for path in (SOURCE, MANIFEST, GATE_SOURCE, GATE_MANIFEST, V5)},
            "selected source changed during compile")
    extracted = extract_graph(mir)
    result = require_bounded_pass(extracted)
    graph_bytes = json.dumps(extracted, sort_keys=True, separators=(",", ":")).encode()
    return {"schema_version": "auth-v4b-ready-cfg/v8-candidate",
            "status": "indeterminate", "bounded_graph_property": result,
            "selected_source_sha256": before,
            "authority_mir_sha256": digest(mir.encode()),
            "gate_mir_sha256": digest(gate_mir.encode()),
            "gate_equality_function": gate_equality_function,
            "extracted_graph_sha256": digest(graph_bytes),
            "gate_result_local": extracted["gate_result_local"],
            "ready_arm": extracted["ready_arm"], "deny_arm": extracted["deny_arm"],
            "callback_blocks": extracted["callback_blocks"],
            "ready_output": extracted["ready_output"],
            "endpoint_set_closed": False,
            "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Normal-path MIR CFG of the current authority function only. No intercrate dynamic dispatch, unwinding, Drop, macro, SQL, or complete native endpoint/effect closure."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate_current(), indent=2))
    except (ValueError, subprocess.TimeoutExpired, OSError) as error:
        print(f"AUTH_V4B_READY_CFG_V8:{error}", file=sys.stderr)
        sys.exit(2)
