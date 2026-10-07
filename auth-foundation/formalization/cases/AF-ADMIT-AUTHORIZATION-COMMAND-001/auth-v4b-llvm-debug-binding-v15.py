#!/usr/bin/env python3
"""Bind two selected Auth policy definitions to exact LLVM symbols.

The binding uses a definition's attached debug metadata, current source bytes,
and the selected Cargo module. Referencing a symbol is still a linker candidate,
not a MIR-site join or an all-path effect proof.
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
    "auth_v4b_llvm_direct_target_v13", CASE / "auth-v4b-llvm-direct-target-v13.py")
assert SPEC and SPEC.loader
v13 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v13)
IMPL = v13.v7.IMPL

ENDPOINTS = {
    "ready-decision": (
        "authorization-ready-decision/Cargo.toml",
        "authorization-ready-decision/src/lib.rs"),
    "generated-policy": (
        "standard-runtime/Cargo.toml",
        "standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs"),
}
DI_FILE = re.compile(
    r'^!(\d+) = !DIFile\(filename: "([^"\\]+)", directory: "([^"\\]+)", '
    r'checksumkind: CSK_MD5, checksum: "([0-9a-f]{32})"(?:, .*)?\)$')
DI_SUBPROGRAM = re.compile(
    r'^!(\d+) = distinct !DISubprogram\(name: "([^"\\]+)", '
    r'linkageName: "([^"\\]+)", scope: !\d+, file: !(\d+), line: (\d+),')
DEBUG_ATTACHMENT = re.compile(r'\s!dbg !(\d+)\s*\{$')


def require(condition: bool, reason: str) -> None:
    if not condition:
        raise ValueError(reason)


def definitions(llvm: dict[str, str]) -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}
    for manifest, source in sorted(llvm.items()):
        for line_number, line in enumerate(source.splitlines(), 1):
            header = v13.HEADER.match(line)
            if not header or header.group(1) != "define":
                continue
            attachment = DEBUG_ATTACHMENT.search(line)
            symbol = v13.symbol_hex(header.group("symbol"))
            result.setdefault(symbol, []).append({
                "manifest": manifest, "line": line_number,
                "debug_id": attachment.group(1) if attachment else None,
                "linkage": ("internal" if "internal" in header.group("prefix").split() else
                            "private" if "private" in header.group("prefix").split() else
                            "other"),
            })
    return result


def bind_public_function(endpoint_id: str, function_name: str, manifest: str,
                         relative_source: str, llvm: dict[str, str],
                         all_definitions: dict) -> dict:
    require(manifest in llvm, f"{endpoint_id}: selected LLVM module missing")
    expected_source = (IMPL / relative_source).resolve()
    raw = expected_source.read_bytes()
    source_lines = raw.decode("utf-8").splitlines()
    public_declaration = re.compile(r'^\s*pub fn ' + re.escape(function_name) + r'\s*\(')
    source_lines_matching = [index for index, line in enumerate(source_lines, 1)
                             if public_declaration.match(line)]
    require(len(source_lines_matching) == 1,
            f"{endpoint_id}: current public {function_name} declaration ambiguous")
    expected_line = source_lines_matching[0]
    files: dict[str, dict] = {}
    subprograms = []
    for line in llvm[manifest].splitlines():
        if match := DI_FILE.match(line):
            identifier, filename, directory, checksum = match.groups()
            require(identifier not in files, f"{endpoint_id}: duplicate DIFile id")
            files[identifier] = {"path": (Path(directory) / filename).resolve(),
                                 "checksum": checksum}
        if match := DI_SUBPROGRAM.match(line):
            identifier, name, linkage_name, file_id, source_line = match.groups()
            if name == function_name and int(source_line) == expected_line:
                subprograms.append({"id": identifier, "name": name,
                                    "linkage_name": linkage_name,
                                    "file_id": file_id, "source_line": int(source_line)})
    bound = [row for row in subprograms if row["file_id"] in files and
             files[row["file_id"]]["path"] == expected_source]
    require(len(bound) == 1, f"{endpoint_id}: endpoint debug subprogram ambiguous")
    row = bound[0]
    file = files[row["file_id"]]
    require(file["checksum"] == hashlib.md5(raw).hexdigest(),
            f"{endpoint_id}: DIFile checksum does not bind current source")
    require(re.fullmatch(r"[A-Za-z0-9_.$-]+", row["linkage_name"]) is not None,
            f"{endpoint_id}: unparsed linkage name")
    symbol = v13.symbol_hex("@" + row["linkage_name"])
    definitions_for_symbol = all_definitions.get(symbol, [])
    require(len(definitions_for_symbol) == 1 and
            definitions_for_symbol[0]["manifest"] == manifest and
            definitions_for_symbol[0]["debug_id"] == row["id"],
            f"{endpoint_id}: attached unique LLVM definition not established")
    return {"endpoint_id": endpoint_id, "manifest": manifest,
            "function_name": function_name,
            "source": relative_source, "source_sha256": hashlib.sha256(raw).hexdigest(),
            "source_line": expected_line, "definition_line": definitions_for_symbol[0]["line"],
            "definition_linkage": definitions_for_symbol[0]["linkage"],
            "symbol_hex": symbol, "debug_id": row["id"],
            "debug_file_id": row["file_id"],
            "binding": "attached-debug-source-definition-candidate"}


def bind_endpoint(endpoint_id: str, llvm: dict[str, str], all_definitions: dict) -> dict:
    manifest, relative_source = ENDPOINTS[endpoint_id]
    return bind_public_function(endpoint_id, "authorize", manifest,
                                relative_source, llvm, all_definitions)


def inspect(root_id: str, mir: dict[str, str], llvm: dict[str, str],
            identities: dict[str, dict]) -> dict:
    base = v13.inspect(root_id, mir, llvm, identities)
    all_definitions = definitions(llvm)
    bindings = {endpoint_id: bind_endpoint(endpoint_id, llvm, all_definitions)
                for endpoint_id in ENDPOINTS}
    calls = {endpoint_id: [{"manifest": site["manifest"],
                            "function_symbol_hex": site["function_symbol_hex"],
                            "line": site["line"], "opcode": site["opcode"],
                            "target_symbol_hex": site["target_symbol_hex"],
                            "classification": site["classification"]}
                           for site in base["sites"] if
                           site["target_symbol_hex"] == binding["symbol_hex"]]
             for endpoint_id, binding in bindings.items()}
    return {"root_id": root_id, "selected_endpoint_bindings": bindings,
            "exact_symbol_call_candidates": calls,
            "exact_symbol_candidate_counts": {key: len(value) for key, value in calls.items()},
            "llvm_site_classification_counts": base["classification_counts"],
            "llvm_call_like_site_count": base["call_like_site_count"],
            "mir_llvm_site_join": "not_attempted",
            "linker_target_resolution": "not_established",
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False}


def evaluate() -> dict:
    base = v13.v7.evaluate(llvm_inspector=inspect)
    return {"schema_version": "auth-foundation.v4b-llvm-debug-binding/v15-candidate",
            "status": "indeterminate", "root_context": base,
            "endpoint_set_closed": False, "all_path_ready_dominance": False,
            "runtime_guarantees_observed": False,
            "claim_limit": "Two selected source definitions are bound to unique attached LLVM debug symbols in each root build. Exact-symbol direct call references remain candidates; linker choice, MIR-site join, other endpoints/effects, READY dominance, and runtime guarantees remain open."}


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2), file=sys.stderr)
        raise SystemExit(1)
