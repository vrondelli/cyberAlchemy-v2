#!/usr/bin/env python3
"""Opt-in exact LLVM-symbol candidate census for four Auth root builds.

An exact symbol match is not a linker-resolved target. This deliberately does
not join LLVM instructions to MIR sites or classify downstream endpoints.
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

SYMBOL = r'@(?:"(?:[^"\\]|\\[0-9A-Fa-f]{2})*"|[A-Za-z0-9$._-]+)'
LOCAL = r'%(?:"(?:[^"\\]|\\[0-9A-Fa-f]{2})*"|[A-Za-z0-9$._-]+)'
HEADER = re.compile(rf"^(define|declare)\b(?P<prefix>.*?)\s(?P<symbol>{SYMBOL})\(")
ALIAS = re.compile(rf"^(?P<symbol>{SYMBOL})\s*=.*\balias\b")
OPCODE = re.compile(
    rf"^(?:{LOCAL}\s*=\s*)?(?:(?:musttail|tail|notail)\s+)?"
    r"(?P<opcode>callbr|call|invoke)\s+")
OPCODE_WORD = re.compile(r"\b(?:callbr|call|invoke)\b")
CALLEE = re.compile(rf"(?P<callee>{SYMBOL}|{LOCAL})\s*\(")
HEX_ESCAPE = re.compile(r"\\([0-9A-Fa-f]{2})")
QUOTED = re.compile(r'"(?:[^"\\]|\\.)*"')
COMPLEX_CALLEE_PREFIX = re.compile(
    r"\b(?:asm|bitcast|inttoptr|addrspacecast|getelementptr|blockaddress|select)\b")


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def symbol_hex(lexeme: str) -> str:
    require(lexeme.startswith("@"), "LLVM symbol is not global")
    spelling = lexeme[1:]
    if spelling.startswith('"'):
        require(spelling.endswith('"'), "unterminated LLVM quoted symbol")
        body = spelling[1:-1]
        output = bytearray()
        index = 0
        while index < len(body):
            if body[index] == "\\":
                match = HEX_ESCAPE.match(body, index)
                require(match is not None, "malformed LLVM symbol escape")
                output.append(int(match.group(1), 16))
                index = match.end()
            else:
                output.extend(body[index].encode("utf-8"))
                index += 1
        return output.hex()
    return spelling.encode("ascii").hex()


def instruction_without_comment(line: str) -> str:
    quoted = False
    escaped = False
    for index, char in enumerate(line):
        if quoted and escaped:
            escaped = False
        elif quoted and char == "\\":
            escaped = True
        elif char == '"':
            quoted = not quoted
        elif char == ";" and not quoted:
            return line[:index].strip()
    return line.strip()


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    require(set(mir) == set(llvm) == set(identities),
            f"{root_id}: LLVM/MIR/package identity coverage changed")
    definitions: dict[str, list[dict]] = {}
    declarations: dict[str, list[dict]] = {}
    aliases: dict[str, list[dict]] = {}
    sites: list[dict] = []
    module_counts = {}
    for manifest, source in sorted(llvm.items()):
        require(hashlib.sha256(source.encode()).hexdigest() ==
                identities[manifest]["llvm_sha256"],
                f"{root_id}: LLVM sidecar hash mismatch: {manifest}")
        function = None
        counts = {"definitions": 0, "declarations": 0, "aliases": 0,
                  "call_like_sites": 0}
        for line_number, line in enumerate(source.splitlines(), 1):
            stripped = instruction_without_comment(line)
            if not stripped or stripped.startswith(";"):
                continue
            if stripped.startswith(("define ", "declare ")):
                require(function is None, f"{root_id}: nested LLVM function: {manifest}:{line_number}")
                match = HEADER.match(stripped)
                require(match is not None, f"{root_id}: unparsed LLVM header: {manifest}:{line_number}")
                symbol = symbol_hex(match.group("symbol"))
                row = {"manifest": manifest, "line": line_number,
                       "symbol_hex": symbol, "symbol_spelling": match.group("symbol"),
                       "linkage": ("internal" if "internal" in match.group("prefix").split() else
                                   "private" if "private" in match.group("prefix").split() else
                                   "other")}
                if match.group(1) == "define":
                    definitions.setdefault(symbol, []).append(row)
                    function = symbol
                    counts["definitions"] += 1
                else:
                    declarations.setdefault(symbol, []).append(row)
                    counts["declarations"] += 1
                continue
            if function is None:
                alias = ALIAS.match(stripped)
                if alias:
                    symbol = symbol_hex(alias.group("symbol"))
                    aliases.setdefault(symbol, []).append(
                        {"manifest": manifest, "line": line_number})
                    counts["aliases"] += 1
                continue
            if stripped == "}":
                function = None
                continue
            opcode = OPCODE.match(stripped)
            if opcode is None and OPCODE_WORD.search(QUOTED.sub('""', stripped)) is None:
                continue
            counts["call_like_sites"] += 1
            tail = stripped[opcode.end():] if opcode else ""
            callee = CALLEE.search(tail) if opcode and opcode.group("opcode") != "callbr" else None
            prefix = tail[:callee.start()] if callee else ""
            syntactically_direct = (callee is not None and not any(char in prefix for char in "@%()")
                                    and COMPLEX_CALLEE_PREFIX.search(prefix) is None)
            if not syntactically_direct:
                target, classification = None, "unparsed-or-callbr"
            elif callee.group("callee").startswith("%"):
                target, classification = None, "indirect"
            else:
                target = symbol_hex(callee.group("callee"))
                classification = "pending-direct"
            sites.append({"manifest": manifest, "function_symbol_hex": function,
                          "line": line_number,
                          "opcode": opcode.group("opcode") if opcode else "unparsed",
                          "target_symbol_hex": target,
                          "target_spelling": (callee.group("callee")
                                              if syntactically_direct else None),
                          "classification": classification})
        require(function is None and counts["definitions"] > 0,
                f"{root_id}: empty or unterminated LLVM module: {manifest}")
        module_counts[manifest] = counts
    for site in sites:
        if site["classification"] != "pending-direct":
            continue
        target = site["target_symbol_hex"]
        defs = definitions.get(target, [])
        site["candidate_definitions"] = defs
        site["declaration_count"] = len(declarations.get(target, []))
        if aliases.get(target):
            site["classification"] = "alias-unresolved"
        elif len(defs) > 1:
            site["classification"] = "duplicate-definition-unresolved"
        elif not defs:
            site["classification"] = "declaration-or-external-unresolved"
        elif defs[0]["manifest"] == site["manifest"] and defs[0]["linkage"] in {
                "private", "internal"}:
            site["classification"] = "same-module-noninterposable-direct"
        else:
            site["classification"] = "same-symbol-local-definition-candidate"
    counts = {kind: sum(site["classification"] == kind for site in sites)
              for kind in sorted({site["classification"] for site in sites})}
    return {"root_id": root_id, "module_counts": module_counts,
            "definition_count": sum(len(rows) for rows in definitions.values()),
            "call_like_site_count": len(sites), "classification_counts": counts,
            "sites": sites, "endpoint_role_classification": "unresolved",
            "mir_llvm_site_join": "not_attempted",
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    base = v7.evaluate(llvm_inspector=inspect)
    require(base["instrumentation"] ==
            "RUSTFLAGS=--emit=mir,llvm-ir,link -Ccodegen-units=1",
            "LLVM opt-in instrumentation changed")
    return {"schema_version": "auth-foundation.v4b-llvm-direct-target/v13-candidate",
            "status": "indeterminate", "root_context": base,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Exact direct LLVM symbol matches in four separately instrumented root builds are candidates, except same-module private/internal definitions. Linker selection, aliases, duplicate/weak/available-externally definitions, indirect/external/unparsed calls, non-call effects, MIR-site identity, endpoint roles, READY dominance, and runtime guarantees remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
