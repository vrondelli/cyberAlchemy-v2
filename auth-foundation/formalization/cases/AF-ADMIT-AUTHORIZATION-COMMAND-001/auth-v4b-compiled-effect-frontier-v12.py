#!/usr/bin/env python3
"""Candidate R2 MIR effect frontier over the four v7 root-context builds.

This is a compiler-output inventory, not a whole-program call graph. In
particular, a syntactically static call is not an effect-closed call: even
unique textual name matches remain unverified candidates on the blocking
frontier. Rust MIR's human-readable format is not stable.
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
    "auth_v4b_root_context_census_v7", CASE / "auth-v4b-root-context-census-v7.py")
assert SPEC and SPEC.loader
v7 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v7)
v6 = v7.v6
NAME = re.compile(r"^fn (.+?)\(")
CALL_TARGET = re.compile(r"^([A-Za-z_][A-Za-z_0-9:]*)$")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def inspect(root_id: str, mir: dict[str, str], identities: dict[str, dict]) -> dict:
    """Retain every compiled effect site, including unverified name candidates."""
    require(set(mir) == set(identities), f"{root_id}: MIR identity coverage changed")
    functions: dict[str, dict] = {}
    names: dict[str, list[str]] = {}
    rows: list[dict] = []
    for manifest, source in sorted(mir.items()):
        function = None
        block = None
        for line_number, line in enumerate(source.splitlines(), 1):
            opened = v6.FUNCTION_START.match(line)
            if opened:
                function = opened.group(1)
                block = None
                matched = NAME.match(line)
                require(matched is not None, f"{root_id}: unparsed function signature at {manifest}:{line_number}")
                # Human-readable MIR can emit distinct bodies under an identical
                # displayed signature (for example enum variant constructors).
                key = f"{manifest}::{function}:{line_number}"
                functions[key] = {"manifest": manifest, "signature": function, "line": line_number}
                names.setdefault(matched.group(1), []).append(key)
                crate = identities[manifest]["target_name"].replace("-", "_")
                names.setdefault(f"{crate}::{matched.group(1)}", []).append(key)
                continue
            if line == "}":
                function = None
                block = None
                continue
            entered = v6.BLOCK_START.match(line)
            if entered:
                block = entered.group(1)
                continue
            stripped = line.strip()
            if stripped in {"resume;", "abort;"} or stripped.startswith("yield("):
                kind = "unwind-resume" if stripped == "resume;" else (
                    "abort" if stripped == "abort;" else "yield")
                target, unwind = stripped, "unknown"
            elif v6.ASSERT_TERMINATOR.match(line):
                kind, target, unwind = "assert-panic", stripped[:240], "assert-success-and-unwind"
            elif "-> [return:" in line:
                matched = v6.CALL_TERMINATOR.match(line)
                if matched is None:
                    kind, target, unwind = "unparsed-terminator", stripped[:240], "unknown"
                else:
                    target, unwind = matched.group(2), matched.group(5)
                    kind = v6.effect_class(target)
            elif "-> unwind" in stripped:
                # Diverging call terminators need their own parser; silently
                # omitting one would make the v6 digest agreement vacuous.
                raise ValueError(f"{root_id}: unparsed divergent terminator at {manifest}:{line_number}")
            else:
                continue
            require(function is not None and block is not None,
                    f"{root_id}: effect outside compiled function/block at {manifest}:{line_number}")
            rows.append({"manifest": manifest, "function": function, "block": block,
                         "line": line_number, "target": target, "class": kind,
                         "unwind": unwind})
    baseline = v6.compiled_effect_edges(mir)
    require(len(rows) == baseline["terminator_count"] and digest(rows) == baseline["edges_sha256"],
            f"{root_id}: effect parser diverged from v6")
    require(sum(baseline["function_counts"].values()) == len(functions),
            f"{root_id}: compiled function census diverged from v6")
    candidates_only = []
    frontier = []
    for row in rows:
        target = row["target"]
        candidates = sorted(set(names.get(target, []))) if CALL_TARGET.fullmatch(target) else []
        # A text match is not a compiler def-id. Even a unique candidate may
        # be in another package or be an impl/module function of that name.
        unique_candidate = row["class"] == "direct-static" and len(candidates) == 1
        site = {**row, "site_id": f"{root_id}:{row['manifest']}:{row['function']}:{row['block']}:{row['line']}"}
        if unique_candidate:
            candidates_only.append({**site, "unverified_local_candidate": candidates[0]})
        reason = ("unverified-textual-target" if unique_candidate else
                  "ambiguous-textual-target" if len(candidates) > 1 else
                  "unresolved-local-or-external-target" if row["class"] == "direct-static" else
                  row["class"])
        frontier.append({**site, "blocking_reason": reason,
                         "local_candidates": candidates,
                         "unwind_remains_open": row["unwind"] != "unwind unreachable"})
    return {"root_id": root_id, "compiled_function_count": len(functions),
            "compiled_effect_site_count": len(rows), "compiled_effect_sites_sha256": digest(rows),
            "unique_textual_candidate_count": len(candidates_only),
            "unique_textual_candidates": candidates_only,
            "blocking_frontier_count": len(frontier), "blocking_frontier": frontier,
            "endpoint_role_classification": {
                "api-http-authorize": "unresolved-public-ingress-versus-downstream",
                "api-runtime-authorize": "unresolved-pre-ready-decision-producing-entry",
                "admission-service-with-ready": "unresolved-admission-carrier-versus-decision-entry",
                "lower-ready-authority": "unresolved-admission-carrier-versus-decision-entry"},
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    base = v7.evaluate(mir_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-compiled-effect-frontier/v12-candidate",
            "status": "indeterminate", "root_context": base,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Every v7-selected local MIR call/effect site recognized by the v6 grammar is inventoried. Textual-name candidates do not prove targets; dynamic dispatch, external effects, compiler semantics, role classification, and READY dominance remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
