#!/usr/bin/env python3
"""Additive source-use check for V4b's three approved SQL dependencies.

This wraps the v7 root-context build without modifying its historical source.
The lexical check is deliberately fail-closed on unsupported inclusion syntax;
it is not a Rust macro-expansion or whole-program effect proof.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shlex
import sys
from pathlib import Path

CASE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location(
    "auth_v4b_root_context_census_v7", CASE / "auth-v4b-root-context-census-v7.py")
assert SPEC and SPEC.loader
v7 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v7)

ORIGINAL = v7.compiled_source_dependencies


def rust_tokens(body: str) -> list[tuple[str, str]]:
    """Tokenize enough Rust to distinguish inclusion syntax from comments/text.

    Unknown or unterminated string/comment syntax rejects the candidate rather
    than silently supplying a source-use witness.
    """
    result: list[tuple[str, str]] = []
    index = 0
    while index < len(body):
        if body[index].isspace():
            index += 1
        elif body.startswith("//", index):
            end = body.find("\n", index + 2)
            index = len(body) if end < 0 else end + 1
        elif body.startswith("/*", index):
            depth = 1
            index += 2
            while depth and index < len(body):
                if body.startswith("/*", index):
                    depth += 1
                    index += 2
                elif body.startswith("*/", index):
                    depth -= 1
                    index += 2
                else:
                    index += 1
            v7.require(depth == 0, "unterminated Rust block comment")
        elif body[index] == "'":
            # A character containing a double quote must not start a string
            # that swallows later macro tokens. Leave lifetimes as punctuation.
            if (index + 2 < len(body) and body[index + 1] not in "\\\n'" and
                    body[index + 2] == "'"):
                result.append(("char", body[index + 1]))
                index += 3
            elif index + 3 < len(body) and body[index + 1] == "\\" and body[index + 3] == "'":
                result.append(("char", body[index + 1:index + 3]))
                index += 4
            else:
                result.append(("punct", "'"))
                index += 1
        elif body[index] == '"':
            index += 1
            start = index
            while index < len(body):
                if body[index] == "\\":
                    index += 2
                elif body[index] == '"':
                    break
                else:
                    index += 1
            v7.require(index < len(body), "unterminated Rust string")
            result.append(("string", body[start:index]))
            index += 1
        elif body[index] == "r" and index + 1 < len(body) and body[index + 1] in '#"':
            cursor = index + 1
            while cursor < len(body) and body[cursor] == "#":
                cursor += 1
            if cursor < len(body) and body[cursor] == '"':
                marker = '"' + "#" * (cursor - index - 1)
                end = body.find(marker, cursor + 1)
                v7.require(end >= 0, "unterminated Rust raw string")
                result.append(("string", body[cursor + 1:end]))
                index = end + len(marker)
            else:
                result.append(("punct", body[index]))
                index += 1
        elif body[index].isalpha() or body[index] == "_":
            end = index + 1
            while end < len(body) and (body[end].isalnum() or body[end] == "_"):
                end += 1
            result.append(("ident", body[index:end]))
            index = end
        else:
            result.append(("punct", body[index]))
            index += 1
    return result


def source_dependencies(dep_path: Path, package_root: Path) -> list[Path]:
    lines = dep_path.read_text(encoding="utf-8").splitlines()
    first, position = "", 0
    while position < len(lines):
        line = lines[position]
        first += line[:-1] + " " if line.endswith("\\") else line
        position += 1
        if not line.endswith("\\"):
            break
    _, separator, sources = first.partition(":")
    v7.require(bool(separator), "compiler dep-info dependencies absent")
    return [Path(os.path.abspath(path if Path(path).is_absolute() else
                                 package_root / path)).resolve()
            for path in shlex.split(sources)]


def classified_source_dependencies(dep_path: Path, target_source: Path,
                                   package_root: Path, target_dir: Path) -> dict:
    base = ORIGINAL(dep_path, target_source, package_root, target_dir)
    approved = {v7.IMPL / path for path in
                base["approved_external_data_dependencies"]}
    uses: dict[Path, list[str]] = {path: [] for path in approved}
    for source in source_dependencies(dep_path, package_root):
        if source.suffix != ".rs":
            continue
        tokens = rust_tokens(source.read_text(encoding="utf-8"))
        for position, token in enumerate(tokens):
            if token == ("ident", "include") or token == ("ident", "include_bytes"):
                v7.require(False, f"executable or byte inclusion needs review: {source}")
            if token == ("ident", "include_str"):
                rest = tokens[position + 1:position + 5]
                v7.require(len(rest) == 4 and rest[0] == ("punct", "!") and
                           rest[1] == ("punct", "(") and rest[2][0] == "string" and
                           rest[3] == ("punct", ")") and "\\" not in rest[2][1],
                           f"nonliteral include_str needs review: {source}")
                included = (source.parent / rest[2][1]).resolve()
                if included in uses:
                    uses[included].append(str(source))
            if tokens[position:position + 4] == [
                    ("punct", "#"), ("punct", "["),
                    ("ident", "path"), ("punct", "=")]:
                rest = tokens[position + 4:position + 6]
                v7.require(len(rest) == 2 and rest[0][0] == "string" and
                           rest[1] == ("punct", "]") and
                           (source.parent / rest[0][1]).resolve() not in approved,
                           f"approved SQL used as Rust module source: {source}")
    v7.require(all(uses.values()),
               "approved external SQL dependency lacks literal include_str source use")
    return {**base, "approved_external_data_source_uses": {
        str(path.relative_to(v7.IMPL)): sorted(paths)
        for path, paths in sorted(uses.items())}}


def evaluate() -> dict:
    v7.compiled_source_dependencies = classified_source_dependencies
    try:
        predecessor = v7.evaluate()
    finally:
        v7.compiled_source_dependencies = ORIGINAL
    v7.require(predecessor["status"] == "indeterminate" and
               predecessor["endpoint_set_closed"] is False and
               predecessor["runtime_guarantees_observed"] is False,
               "v7 claim ceiling changed")
    return {
        "schema_version": "auth-foundation.v4b-sql-source-use/v14-candidate",
        "status": "indeterminate",
        "predecessor_source_sha256": hashlib.sha256(
            (CASE / "auth-v4b-root-context-census-v7.py").read_bytes()).hexdigest(),
        "root_context": predecessor,
        "endpoint_set_closed": False,
        "all_path_ready_dominance": False,
        "runtime_guarantees_observed": False,
        "claim_limit": "Compiler-listed external SQL files have literal include_str source uses in selected Rust files; unsupported inclusion forms fail closed. This lexical/source-use check does not prove macro expansion, exhaustive endpoint reachability, all-path READY dominance, or runtime guarantees.",
    }


if __name__ == "__main__":
    try:
        print(json.dumps(evaluate(), indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(json.dumps({"status": "fail", "blocker": str(error)}, indent=2),
              file=sys.stderr)
        raise SystemExit(1)
