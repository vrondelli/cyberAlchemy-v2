#!/usr/bin/env python3
"""Run deterministic W1 structural probes from a frozen lane manifest."""

from __future__ import annotations

import argparse
import copy
import hashlib
import sys
from pathlib import Path
from typing import Any

import yaml


HERE = Path(__file__).resolve().parent
PROTOCOL_PATH = HERE / "protocol.yml"
RESULT_SCHEMA_PATH = HERE / "result.schema.yml"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected YAML object: {path}")
    return value


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_fields(value: dict[str, Any], fields: list[str], label: str) -> None:
    missing = [field for field in fields if field not in value]
    if missing:
        raise ValueError(f"{label} missing fields: {', '.join(missing)}")


def table_failures(structures: dict[str, Any], criterion: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    required_tables = criterion.get("required_tables", {})
    minimum_rows = criterion.get("minimum_rows", {})
    required_attributes = criterion.get("required_attributes", {})

    for table, columns in required_tables.items():
        rows = structures.get(table)
        if not isinstance(rows, list):
            failures.append(f"missing-table:{table}")
            continue
        available = set().union(*(row.keys() for row in rows if isinstance(row, dict))) if rows else set()
        for column in columns:
            if column not in available:
                failures.append(f"missing-column:{table}:{column}")

    for table, minimum in minimum_rows.items():
        rows = structures.get(table)
        if not isinstance(rows, list) or len(rows) < minimum:
            failures.append(f"minimum-rows:{table}:{minimum}")

    for table, attributes in required_attributes.items():
        rows = structures.get(table)
        values = {
            str(row.get("Attribute"))
            for row in rows or []
            if isinstance(row, dict) and row.get("Value") not in (None, "")
        }
        for attribute in attributes:
            if attribute not in values:
                failures.append(f"missing-attribute:{table}:{attribute}")

    return sorted(set(failures))


def validate_graph(graph: dict[str, Any]) -> tuple[str, list[str]]:
    failures: list[str] = []
    for edge in graph.get("exercised_edges", []):
        require_fields(edge, ["relationship", "source", "target", "authority_ref", "observed"], "exercised edge")
        if edge["observed"] != "pass":
            failures.append(f"edge-failed:{edge['relationship']}:{edge['source']}:{edge['target']}")
    for edge in graph.get("seeded_endpoint_violations", []):
        require_fields(edge, ["relationship", "source", "target", "authority_ref", "observed"], "seeded violation")
        if edge["observed"] != "reject":
            failures.append(f"violation-not-rejected:{edge['relationship']}:{edge['source']}:{edge['target']}")
    if not graph.get("exercised_edges"):
        return "not-applicable", ["no-exercised-edge"]
    return ("fail", failures) if failures else ("pass", [])


def validate_lane(lane: dict[str, Any], protocol: dict[str, Any]) -> None:
    contract = protocol["lane_manifest_contract"]
    require_fields(lane, contract["required_fields"], "lane manifest")
    if lane["status"] != contract["status_before_execution"]:
        raise ValueError("lane manifest was not frozen before execution")
    if lane["protocol_version"] != protocol["method_protocol_version"]:
        raise ValueError("lane method protocol version mismatch")
    if lane["result_contract_version"] != protocol["result_contract_version"]:
        raise ValueError("lane result contract version mismatch")
    lane_contract = protocol["lanes"].get(lane["lane_id"])
    if not lane_contract:
        raise ValueError(f"unknown lane: {lane['lane_id']}")
    if lane["swu"] != lane_contract["swu"]:
        raise ValueError("lane SWU mismatch")
    actual = [candidate["candidate"] for candidate in lane["candidates"]]
    if actual != lane_contract["candidates"]:
        raise ValueError(f"lane candidate order/coverage mismatch: {actual}")
    for candidate in lane["candidates"]:
        require_fields(candidate, contract["candidate_required_fields"], f"candidate {candidate.get('candidate', '?')}")


def validate_result(result: dict[str, Any], schema: dict[str, Any]) -> None:
    require_fields(result, schema["required_fields"], "result")
    contracts = schema["field_contracts"]
    for field, contract in contracts.items():
        value = result[field]
        expected_type = contract["type"]
        if expected_type == "string" and not isinstance(value, str):
            raise ValueError(f"result field {field} must be a string")
        if expected_type == "list" and not isinstance(value, list):
            raise ValueError(f"result field {field} must be a list")
        if expected_type == "object" and not isinstance(value, dict):
            raise ValueError(f"result field {field} must be an object")
        if expected_type == "boolean" and not isinstance(value, bool):
            raise ValueError(f"result field {field} must be a boolean")
        if "allowed" in contract and value not in contract["allowed"]:
            raise ValueError(f"result field {field} has disallowed value: {value}")
        if "minimum_items" in contract and len(value) < contract["minimum_items"]:
            raise ValueError(f"result field {field} has too few items")
        if expected_type == "object" and "required" in contract:
            require_fields(value, contract["required"], f"result field {field}")
    for run_name in contracts["runs"]["required"]:
        observed = result["runs"][run_name]["observed"]
        if observed not in contracts["runs"]["observations"][run_name]:
            raise ValueError(f"invalid {run_name} observation: {observed}")


def evaluate_candidate(
    lane_path: Path,
    lane: dict[str, Any],
    candidate: dict[str, Any],
    protocol: dict[str, Any],
    schema: dict[str, Any],
) -> dict[str, Any]:
    fixture_path = (lane_path.parent / candidate["fixture_ref"]).resolve()
    fixture = load_yaml(fixture_path)
    require_fields(
        fixture,
        ["fixture_id", "candidate_id", "candidate", "provenance", "positive", "malformed_negative", "neighbor_probe", "graph_coherence"],
        f"fixture {fixture_path}",
    )
    if fixture["candidate_id"] != candidate["candidate_id"] or fixture["candidate"] != candidate["candidate"]:
        raise ValueError(f"fixture candidate mismatch: {fixture_path}")

    criterion = candidate["criterion_probe"]
    styles = fixture["positive"].get("styles", {})
    style_failures = {style: table_failures(structures, criterion) for style, structures in styles.items()}
    positive_failures = sorted({failure for failures in style_failures.values() for failure in failures})
    positive_observed = "accept" if len(styles) >= 2 and not positive_failures else "reject"

    malformed_failures = table_failures(fixture["malformed_negative"].get("structures", {}), criterion)
    malformed_observed = "reject" if malformed_failures else "accept"

    neighbor_failures = table_failures(fixture["neighbor_probe"].get("structures", {}), criterion)
    neighbor_observed = "reroute" if neighbor_failures else "accept"

    graph_observed, graph_failures = validate_graph(fixture["graph_coherence"])
    portability_observed = "pass" if len(styles) >= 2 and not positive_failures else "incomplete"

    if positive_observed == "accept" and malformed_observed == "reject" and neighbor_observed == "reroute":
        method_outcome = "structural-separation-survives"
    elif positive_observed == "accept" and malformed_observed == "reject" and neighbor_observed == "accept":
        method_outcome = "structural-collapse-observed"
    else:
        method_outcome = "inconclusive"

    expected = candidate["expected"]
    observations = {
        "positive": positive_observed,
        "malformed_negative": malformed_observed,
        "neighbor_probe": neighbor_observed,
        "graph_coherence": graph_observed,
        "portability": portability_observed,
        "method_outcome": method_outcome,
    }
    mismatches = [f"{field}:expected={expected[field]}:observed={observed}" for field, observed in observations.items() if expected[field] != observed]
    if mismatches:
        raise ValueError(f"{candidate['candidate']} expectation mismatch: {'; '.join(mismatches)}")

    evidence = [str(Path(candidate["fixture_ref"])), str(lane_path.name)]
    result = {
        "experiment_id": f"UIF-W1-{candidate['candidate_id'].replace('.', '-')}",
        "lane_id": lane["lane_id"],
        "result_contract_version": lane["result_contract_version"],
        "protocol_version": lane["protocol_version"],
        "protocol_sha256": digest(PROTOCOL_PATH),
        "result_schema_sha256": digest(RESULT_SCHEMA_PATH),
        "lane_manifest_sha256": digest(lane_path),
        "fixture_sha256": digest(fixture_path),
        "candidate_id": candidate["candidate_id"],
        "candidate": candidate["candidate"],
        "hypothesis_ref": candidate["hypothesis_ref"],
        "corpus_refs": [str(Path(candidate["fixture_ref"]))],
        "criterion_probe_ref": f"{lane_path.name}#{candidate['candidate_id']}",
        "runs": {
            "positive": {"expected": expected["positive"], "observed": positive_observed, "failures": positive_failures, "styles": sorted(styles)},
            "malformed_negative": {"expected": expected["malformed_negative"], "observed": malformed_observed, "failures": malformed_failures},
            "neighbor_probe": {"expected": expected["neighbor_probe"], "observed": neighbor_observed, "neighbor": fixture["neighbor_probe"].get("candidate"), "failures": neighbor_failures},
            "graph_coherence": {"expected": expected["graph_coherence"], "observed": graph_observed, "failures": graph_failures, "evidence_role": "supporting-only"},
            "portability": {"expected": expected["portability"], "observed": portability_observed, "styles": sorted(styles)},
            "round_trip": {"expected": "not-run-before-candidate-schema", "observed": "not-run"},
        },
        "repeatability": "deterministic",
        "method_outcome": method_outcome,
        "provisional_outcome": expected["provisional_outcome"],
        "reason_codes": candidate["reason_codes"],
        "evidence": evidence,
        "correction_route": candidate["correction_route"],
        "residue": candidate["residue"],
        "promotion_eligible": False,
    }
    validate_result(result, schema)
    return result


def run_lane(lane_path: Path, output: Path) -> None:
    protocol = load_yaml(PROTOCOL_PATH)
    schema = load_yaml(RESULT_SCHEMA_PATH)
    lane = load_yaml(lane_path)
    validate_lane(lane, protocol)
    output.mkdir(parents=True, exist_ok=True)
    results = []
    for candidate in lane["candidates"]:
        result = evaluate_candidate(lane_path, lane, candidate, protocol, schema)
        result_path = output / f"{candidate['candidate_id'].lower().replace('.', '-')}.result.yml"
        result_path.write_text(yaml.safe_dump(result, sort_keys=False), encoding="utf-8")
        results.append(result_path.name)
    manifest = {
        "lane_id": lane["lane_id"],
        "swu": lane["swu"],
        "status": "pass",
        "protocol_sha256": digest(PROTOCOL_PATH),
        "result_schema_sha256": digest(RESULT_SCHEMA_PATH),
        "lane_manifest_sha256": digest(lane_path),
        "results": results,
    }
    (output / "run-manifest.yml").write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")
    print(f"PASS: {lane['lane_id']} emitted {len(results)} results to {output}")


def compare_runs(left: Path, right: Path, output: Path) -> None:
    protocol = load_yaml(PROTOCOL_PATH)
    schema = load_yaml(RESULT_SCHEMA_PATH)
    compare_fields = protocol["run_policy"]["compare_fields"]
    left_files = sorted(left.glob("*.result.yml"))
    right_files = sorted(right.glob("*.result.yml"))
    if [path.name for path in left_files] != [path.name for path in right_files]:
        raise ValueError("run result file sets differ")
    output.mkdir(parents=True, exist_ok=True)
    comparisons = []
    for left_path, right_path in zip(left_files, right_files):
        left_result = load_yaml(left_path)
        right_result = load_yaml(right_path)
        validate_result(left_result, schema)
        validate_result(right_result, schema)
        mismatches = [field for field in compare_fields if left_result[field] != right_result[field]]
        hash_fields = ["protocol_sha256", "result_schema_sha256", "lane_manifest_sha256", "fixture_sha256"]
        mismatches.extend(field for field in hash_fields if left_result.get(field) != right_result.get(field))
        if mismatches:
            raise ValueError(f"non-deterministic result {left_path.name}: {sorted(set(mismatches))}")
        final = copy.deepcopy(left_result)
        final["repeatability"] = "deterministic"
        (output / left_path.name).write_text(yaml.safe_dump(final, sort_keys=False), encoding="utf-8")
        comparisons.append({"result": left_path.name, "status": "identical", "compared_fields": compare_fields + hash_fields})
    summary = {
        "status": "pass",
        "left": str(left),
        "right": str(right),
        "results": comparisons,
    }
    (output / "comparison.yml").write_text(yaml.safe_dump(summary, sort_keys=False), encoding="utf-8")
    lines = ["# W1 Lane Result Summary", "", f"- Status: PASS", f"- Results: {len(comparisons)}", "- Repeatability: deterministic", "- Promotion eligible: false", "", "| Result | Comparison |", "| --- | --- |"]
    lines.extend(f"| `{row['result']}` | {row['status']} |" for row in comparisons)
    lines.extend(["", "All outcomes are provisional experiment evidence. Canonical DS-D1 and DS-D8 authority remain unchanged.", ""])
    (output / "SUMMARY.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"PASS: compared {len(comparisons)} W1 results into {output}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    run_parser = subparsers.add_parser("run")
    run_parser.add_argument("--lane", required=True, type=Path)
    run_parser.add_argument("--output", required=True, type=Path)
    compare_parser = subparsers.add_parser("compare")
    compare_parser.add_argument("--left", required=True, type=Path)
    compare_parser.add_argument("--right", required=True, type=Path)
    compare_parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.command == "run":
            run_lane(args.lane.resolve(), args.output.resolve())
        else:
            compare_runs(args.left.resolve(), args.right.resolve(), args.output.resolve())
    except (OSError, ValueError, KeyError, TypeError, yaml.YAMLError) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
