#!/usr/bin/env python3
"""Check Claude/Codex reader drift and GitHub deletion candidates.

The checker is intentionally read-only unless --output is supplied. It trusts
the canonical map for owner decisions, then performs conservative filesystem
checks: path existence and exact-content hashes before labeling runtime rewrites.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


READER_KEYS = ("claude_reader", "codex_reader")


def sha256_12(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()[:12]


def load_map(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data.get("records"), list):
        raise SystemExit(f"map has no records array: {path}")
    return data


def resolve_reader_status(record: dict[str, Any], reader_key: str) -> dict[str, Any]:
    reader = record.get(reader_key)
    if not isinstance(reader, dict) or not reader.get("path"):
        status = "missing" if isinstance(reader, dict) and reader.get("status") == "missing" else "orphan"
        return {
            "path": None,
            "declared_status": reader.get("status") if isinstance(reader, dict) else None,
            "status": status,
            "note": reader.get("note", "") if isinstance(reader, dict) else "No reader declared.",
        }

    reader_path = Path(reader["path"])
    canonical_path = Path(record["canonical_path"]) if record.get("canonical_path") else None
    reader_hash = sha256_12(reader_path)
    canonical_hash = sha256_12(canonical_path) if canonical_path else None

    if not reader_path.exists():
        status = "missing"
    elif record.get("blocked_owner") and reader_path.as_posix().startswith(("implementation/domainspec/", "domainspec-lean-formalization/")):
        status = "blocked-owner"
    elif canonical_path is None or not canonical_path.exists():
        status = "orphan"
    elif reader_hash == canonical_hash:
        status = "in-sync"
    elif reader_path.suffix == ".toml" or ".claude/" in reader_path.as_posix():
        status = "runtime-rewrite"
    else:
        status = "drift"

    return {
        "path": reader["path"],
        "declared_status": reader.get("status"),
        "status": status,
        "reader_sha256_12": reader_hash,
        "canonical_sha256_12": canonical_hash,
        "note": reader.get("note", ""),
    }


def replacement_evidence(record: dict[str, Any]) -> dict[str, bool]:
    claude = record.get("claude_reader") if isinstance(record.get("claude_reader"), dict) else {}
    codex = record.get("codex_reader") if isinstance(record.get("codex_reader"), dict) else {}
    facade = record.get("shared_skill_facade") if isinstance(record.get("shared_skill_facade"), dict) else {}
    canonical = bool(record.get("canonical_path") and Path(record["canonical_path"]).exists())
    return {
        "canonical": canonical,
        "claude": bool(claude.get("path") and Path(claude["path"]).exists()),
        "codex": bool(codex.get("path") and Path(codex["path"]).exists()),
        "facade": bool(facade.get("path") and Path(facade["path"]).exists()),
    }


def resolve_github_status(record: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    path = candidate["path"]
    declared = candidate.get("status", "needs-parity-check")
    evidence = replacement_evidence(record)
    kind = record.get("artifact_kind")

    if path.startswith("implementation/domainspec/"):
        status = "owner-scoped"
    elif declared in {"blocked-active-use", "needs-claude-replacement", "needs-codex-replacement", "owner-scoped"}:
        status = declared
    elif kind == "agent" and not evidence["claude"]:
        status = "needs-claude-replacement"
    elif kind == "agent" and not evidence["codex"]:
        status = "needs-codex-replacement"
    elif kind == "skill" and not (evidence["facade"] or evidence["canonical"]):
        status = "blocked-active-use"
    elif not Path(path).exists():
        status = "blocked-active-use"
    else:
        status = "safe-delete"

    return {
        "path": path,
        "declared_status": declared,
        "status": status,
        "reason": candidate.get("reason", ""),
        "replacement_evidence": evidence,
    }


def analyze(data: dict[str, Any]) -> dict[str, Any]:
    records = []
    github_candidates = []
    for record in data["records"]:
        reader_results = {key: resolve_reader_status(record, key) for key in READER_KEYS}
        gh_results = [resolve_github_status(record, c) for c in record.get("github_delete_candidate", [])]
        records.append(
            {
                "logical_id": record["logical_id"],
                "artifact_kind": record["artifact_kind"],
                "owner_family": record["owner_family"],
                "canonical_path": record.get("canonical_path"),
                "canonical_status": record["canonical_status"],
                "readers": reader_results,
                "blocked_owner": record.get("blocked_owner"),
                "validation_notes": record.get("validation_notes", []),
            }
        )
        for candidate in gh_results:
            github_candidates.append(
                {
                    "logical_id": record["logical_id"],
                    "artifact_kind": record["artifact_kind"],
                    "owner_family": record["owner_family"],
                    **candidate,
                }
            )

    summary = {
        "record_count": len(records),
        "owner_family": dict(Counter(r["owner_family"] for r in records)),
        "canonical_status": dict(Counter(r["canonical_status"] for r in records)),
        "claude_reader_status": dict(Counter(r["readers"]["claude_reader"]["status"] for r in records)),
        "codex_reader_status": dict(Counter(r["readers"]["codex_reader"]["status"] for r in records)),
        "github_delete_status": dict(Counter(c["status"] for c in github_candidates)),
        "github_candidate_count": len(github_candidates),
    }
    return {"summary": summary, "records": records, "github_candidates": github_candidates}


def markdown_table(rows: list[list[Any]], headers: list[str]) -> str:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(str(cell).replace("|", "\\|") for cell in row) + " |")
    return "\n".join(lines)


def render_markdown(result: dict[str, Any], deletion_only: bool = False) -> str:
    summary = result["summary"]
    lines = []
    title = "GitHub Surface Deletion Candidates" if deletion_only else "Claude/Codex Surface Drift Report"
    lines.extend([f"# {title}", "", "Generated by `tools/check_skill_agent_surface_drift.py`.", ""])

    lines.extend(["## Summary", ""])
    for key in ["record_count", "github_candidate_count"]:
        if key in summary:
            lines.append(f"- `{key}`: {summary[key]}")
    for key in ["owner_family", "canonical_status", "claude_reader_status", "codex_reader_status", "github_delete_status"]:
        lines.append(f"- `{key}`: {json.dumps(summary.get(key, {}), sort_keys=True)}")
    lines.append("")

    if not deletion_only:
        lines.extend(["## Reader Status", ""])
        reader_rows = []
        for record in result["records"]:
            reader_rows.append(
                [
                    record["logical_id"],
                    record["artifact_kind"],
                    record["owner_family"],
                    record["canonical_status"],
                    record["readers"]["claude_reader"]["status"],
                    record["readers"]["codex_reader"]["status"],
                    "yes" if record.get("blocked_owner") else "no",
                ]
            )
        lines.append(markdown_table(reader_rows, ["logical_id", "kind", "owner", "canonical", "claude", "codex", "blocked_owner"]))
        lines.append("")

    lines.extend(["## GitHub Candidates", ""])
    gh_rows = []
    for candidate in result["github_candidates"]:
        evidence = candidate["replacement_evidence"]
        gh_rows.append(
            [
                candidate["logical_id"],
                candidate["artifact_kind"],
                candidate["owner_family"],
                candidate["status"],
                candidate["path"],
                ",".join(k for k, v in evidence.items() if v) or "none",
            ]
        )
    lines.append(markdown_table(gh_rows, ["logical_id", "kind", "owner", "status", "path", "replacement_evidence"]))
    lines.append("")

    return "\n".join(lines)


def maybe_write(text: str, output: str | None) -> None:
    if output:
        Path(output).write_text(text, encoding="utf-8")
    else:
        print(text)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--map", required=True, dest="map_path")
    parser.add_argument("--format", choices=["json", "markdown"], default="json")
    parser.add_argument("--output")
    parser.add_argument("--deletion-output", help="Optional Markdown path for GitHub deletion candidates.")
    args = parser.parse_args()

    result = analyze(load_map(Path(args.map_path)))
    if args.format == "json":
        body = json.dumps(result, indent=2) + "\n"
    else:
        body = render_markdown(result)
    maybe_write(body, args.output)

    if args.deletion_output:
        Path(args.deletion_output).write_text(render_markdown(result, deletion_only=True), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
