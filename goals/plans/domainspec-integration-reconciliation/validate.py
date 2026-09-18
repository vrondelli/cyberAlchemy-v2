#!/usr/bin/env python3
"""Validate the candidate DomainSpec integration reconciliation matrix."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
PROJECTS = HERE.parents[3]
MATRIX_PATH = HERE / "RECONCILIATION-MATRIX.v1-candidate.json"


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    matrix = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
    definition_ref = matrix["definition_pack_ref"]
    definition_path = PROJECTS / definition_ref["path"]
    if not definition_path.is_file() or sha256(definition_path) != definition_ref["sha256"]:
        fail("definition pack is missing or drifted")
    definitions = json.loads(definition_path.read_text(encoding="utf-8"))
    expected_ids = set(definitions["required_concept_ids"])

    rows = matrix.get("rows", [])
    row_ids = [row.get("definition_id") for row in rows]
    if len(row_ids) != len(set(row_ids)):
        fail("duplicate reconciliation row")
    if set(row_ids) != expected_ids:
        fail(f"definition coverage mismatch: missing={sorted(expected_ids - set(row_ids))}, extra={sorted(set(row_ids) - expected_ids)}")
    statuses = set(matrix.get("status_vocabulary", {}))
    if statuses != {"bounded", "partial", "absent", "conflict"}:
        fail("status vocabulary drift")
    source_ids = {source["source_id"] for source in matrix.get("source_refs", [])}
    if len(source_ids) != len(matrix.get("source_refs", [])):
        fail("duplicate source identity")
    for source in matrix.get("source_refs", []):
        path = PROJECTS / source["path"]
        if not path.is_file() or sha256(path) != source["sha256"]:
            fail(f"source is missing or drifted: {source['path']}")
    for row in rows:
        if row.get("status") not in statuses:
            fail(f"invalid status: {row}")
        if not row.get("finding") or not row.get("evidence_refs"):
            fail(f"unsubstantiated row: {row.get('definition_id')}")
        if set(row["evidence_refs"]) - source_ids:
            fail(f"unresolved evidence source: {row.get('definition_id')}")

    computed = {status: sum(row["status"] == status for row in rows) for status in sorted(statuses)}
    computed["total"] = len(rows)
    if matrix.get("summary") != computed:
        fail(f"summary mismatch: expected {computed}")

    work = matrix.get("work_packages", [])
    work_ids = [item.get("id") for item in work]
    if len(work_ids) != len(set(work_ids)):
        fail("duplicate work-package identity")
    known_work = set(work_ids)
    for item in work:
        if item.get("lane") not in {"product-construction", "operational-support"}:
            fail(f"invalid work lane: {item.get('id')}")
        if set(item.get("depends_on", [])) - known_work:
            fail(f"unresolved work dependency: {item.get('id')}")
    row_waves = {row["remediation_wave"] for row in rows}
    if row_waves - known_work:
        fail(f"row references unknown work package: {sorted(row_waves - known_work)}")
    if matrix.get("language_denominator") != ["typescript", "python", "rust"]:
        fail("language denominator drift")
    if matrix.get("authority_effect") != "none" or matrix.get("implementation_effect") != "none":
        fail("plan effect ceiling inflated")

    print(f"PASS: {matrix['matrix_id']} ({len(rows)} definitions; {computed})")


if __name__ == "__main__":
    main()
