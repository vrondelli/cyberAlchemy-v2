#!/usr/bin/env python3
"""Read-only candidate validator for the first LOEC typed-edge vertical."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "cav2-loec-typed-edge-request/v1"
RESULT_SCHEMA_VERSION = "cav2-loec-typed-edge-result/v1"
FROZEN_COMMIT = "169d4a46aeaafba62c8bad127fc0522c3223e962"
EXPECTED_EDGE = {
    "source_kind": "FormalClaim",
    "predicate": "formalizes",
    "target_kind": "BusinessMeaning",
}
CLAIM_CEILING = (
    "Candidate source-binding and typed-direction evidence only; no semantic fidelity, "
    "acceptance, admission, conformance, publication, release, deployment, or authority."
)

REQUEST_KEYS = {
    "schema_version", "request_id", "source_commit", "candidate_edge",
    "expected_direction", "supporting_bindings", "authority_effect",
}
EDGE_KEYS = {"source_kind", "predicate", "target_kind"}
BINDING_KEYS = {
    "repository", "commit", "path", "blob", "qualified_name",
    "declaration_kind", "line", "declaration_line_sha256",
}
CODE_ORDER = [
    "INVALID_REQUEST_SHAPE", "UNSUPPORTED_SCHEMA_VERSION", "UNKNOWN_FIELD",
    "INVALID_AUTHORITY_EFFECT", "WRONG_SOURCE_COMMIT", "INVALID_EXPECTED_DIRECTION",
    "REVERSED_DIRECTION", "WRONG_DIRECTION", "MISSING_SUPPORTING_BINDING",
    "DUPLICATE_SUPPORTING_BINDING", "UNSUPPORTED_REPOSITORY", "INVALID_BINDING_SHAPE",
    "BINDING_COMMIT_MISMATCH", "SOURCE_OBJECT_MISSING", "BLOB_MISMATCH",
    "SOURCE_LINE_MISSING", "DECLARATION_LINE_DIGEST_MISMATCH",
    "DECLARATION_KIND_MISMATCH", "QUALIFIED_NAME_MISMATCH",
]


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(value: Any) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def _run_git(repo: Path, *args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", "-C", str(repo), *args], capture_output=True, check=False
    )


def _qualified_declaration(lines: list[str], line_number: int) -> tuple[str, str] | None:
    namespaces: list[str] = []
    for number, line in enumerate(lines, start=1):
        namespace_match = re.fullmatch(r"\s*namespace\s+([A-Za-z0-9_'.]+)\s*", line)
        if namespace_match:
            namespaces.append(namespace_match.group(1))
        if number == line_number:
            match = re.match(
                r"\s*(?:private\s+|protected\s+|noncomputable\s+|unsafe\s+)*"
                r"(def|theorem|lemma|abbrev|structure|inductive|class)\s+([A-Za-z0-9_'.]+)\b",
                line,
            )
            if not match:
                return None
            kind, declared_name = match.groups()
            if "." in declared_name:
                local_name = declared_name
            else:
                local_name = declared_name
            prefix = ".".join(namespaces)
            qualified = f"{prefix}.{local_name}" if prefix else local_name
            return kind, qualified
        end_match = re.fullmatch(r"\s*end(?:\s+([A-Za-z0-9_'.]+))?\s*", line)
        if end_match and namespaces:
            namespaces.pop()
    return None


def _unknown_fields(value: dict[str, Any], expected: set[str]) -> bool:
    return set(value) - expected != set()


def validate_request(request: Any, repository_root: Path) -> dict[str, Any]:
    codes: set[str] = set()
    resolved: list[str] = []
    request_digest = digest(request)

    if not isinstance(request, dict):
        codes.add("INVALID_REQUEST_SHAPE")
        return _result(request_digest, codes, resolved)
    if _unknown_fields(request, REQUEST_KEYS):
        codes.add("UNKNOWN_FIELD")
    if set(request) != REQUEST_KEYS:
        codes.add("INVALID_REQUEST_SHAPE")
    if request.get("schema_version") != SCHEMA_VERSION:
        codes.add("UNSUPPORTED_SCHEMA_VERSION")
    if request.get("authority_effect") != "none":
        codes.add("INVALID_AUTHORITY_EFFECT")
    if request.get("source_commit") != FROZEN_COMMIT:
        codes.add("WRONG_SOURCE_COMMIT")

    edge = request.get("candidate_edge")
    expected = request.get("expected_direction")
    for candidate in (edge, expected):
        if not isinstance(candidate, dict) or set(candidate) != EDGE_KEYS:
            codes.add("INVALID_REQUEST_SHAPE")
        elif _unknown_fields(candidate, EDGE_KEYS):
            codes.add("UNKNOWN_FIELD")
    if isinstance(expected, dict) and expected != EXPECTED_EDGE:
        codes.add("INVALID_EXPECTED_DIRECTION")
    if isinstance(edge, dict) and set(edge) == EDGE_KEYS:
        reversed_edge = {
            "source_kind": EXPECTED_EDGE["target_kind"],
            "predicate": EXPECTED_EDGE["predicate"],
            "target_kind": EXPECTED_EDGE["source_kind"],
        }
        if edge == reversed_edge:
            codes.add("REVERSED_DIRECTION")
        elif edge != EXPECTED_EDGE:
            codes.add("WRONG_DIRECTION")

    bindings = request.get("supporting_bindings")
    if not isinstance(bindings, list) or not bindings:
        codes.add("MISSING_SUPPORTING_BINDING")
        bindings = []

    seen: set[str] = set()
    for binding in bindings:
        if not isinstance(binding, dict) or set(binding) != BINDING_KEYS:
            codes.add("INVALID_BINDING_SHAPE")
            if isinstance(binding, dict) and _unknown_fields(binding, BINDING_KEYS):
                codes.add("UNKNOWN_FIELD")
            continue
        binding_identity = digest(binding)
        if binding_identity in seen:
            codes.add("DUPLICATE_SUPPORTING_BINDING")
            continue
        seen.add(binding_identity)
        if binding["repository"] != "domainspec-lean-formalization":
            codes.add("UNSUPPORTED_REPOSITORY")
            continue
        if binding["commit"] != FROZEN_COMMIT or binding["commit"] != request.get("source_commit"):
            codes.add("BINDING_COMMIT_MISMATCH")
            continue
        if not isinstance(binding["line"], int) or isinstance(binding["line"], bool) or binding["line"] < 1:
            codes.add("INVALID_BINDING_SHAPE")
            continue

        repo = repository_root / binding["repository"]
        blob_result = _run_git(repo, "rev-parse", f'{binding["commit"]}:{binding["path"]}')
        if blob_result.returncode != 0:
            codes.add("SOURCE_OBJECT_MISSING")
            continue
        actual_blob = blob_result.stdout.decode("ascii").strip()
        if actual_blob != binding["blob"]:
            codes.add("BLOB_MISMATCH")
            continue
        source_result = _run_git(repo, "show", f'{binding["commit"]}:{binding["path"]}')
        if source_result.returncode != 0:
            codes.add("SOURCE_OBJECT_MISSING")
            continue
        try:
            lines = source_result.stdout.decode("utf-8").splitlines()
        except UnicodeDecodeError:
            codes.add("SOURCE_OBJECT_MISSING")
            continue
        if binding["line"] > len(lines):
            codes.add("SOURCE_LINE_MISSING")
            continue
        declaration_line = lines[binding["line"] - 1]
        actual_line_digest = hashlib.sha256(declaration_line.encode("utf-8")).hexdigest()
        if actual_line_digest != binding["declaration_line_sha256"]:
            codes.add("DECLARATION_LINE_DIGEST_MISMATCH")
            continue
        declaration = _qualified_declaration(lines, binding["line"])
        if declaration is None:
            codes.add("DECLARATION_KIND_MISMATCH")
            continue
        actual_kind, actual_name = declaration
        if actual_kind != binding["declaration_kind"]:
            codes.add("DECLARATION_KIND_MISMATCH")
        if actual_name != binding["qualified_name"]:
            codes.add("QUALIFIED_NAME_MISMATCH")
        if actual_kind == binding["declaration_kind"] and actual_name == binding["qualified_name"]:
            resolved.append(actual_name)

    if not bindings:
        codes.add("MISSING_SUPPORTING_BINDING")
    return _result(request_digest, codes, resolved)


def _result(request_digest: str, codes: set[str], resolved: list[str]) -> dict[str, Any]:
    ordered_codes = [code for code in CODE_ORDER if code in codes]
    return {
        "schema_version": RESULT_SCHEMA_VERSION,
        "status": "rejected" if ordered_codes else "reviewable-candidate-evidence",
        "rejection_codes": ordered_codes,
        "request_digest": request_digest,
        "resolved_selectors": sorted(set(resolved)),
        "claim_ceiling": CLAIM_CEILING,
        "authority_effect": "none",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request", type=Path)
    parser.add_argument(
        "--repository-root", type=Path,
        default=Path(__file__).resolve().parents[4],
        help="Repository root containing domainspec-lean-formalization",
    )
    args = parser.parse_args()
    try:
        request = json.loads(args.request.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        result = _result(hashlib.sha256(b"").hexdigest(), {"INVALID_REQUEST_SHAPE"}, [])
        sys.stdout.buffer.write(canonical_bytes(result) + b"\n")
        return 1
    result = validate_request(request, args.repository_root.resolve())
    sys.stdout.buffer.write(canonical_bytes(result) + b"\n")
    return 0 if result["status"] == "reviewable-candidate-evidence" else 1


if __name__ == "__main__":
    raise SystemExit(main())
