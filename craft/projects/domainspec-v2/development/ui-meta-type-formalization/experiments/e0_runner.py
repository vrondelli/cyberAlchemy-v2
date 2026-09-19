#!/usr/bin/env python3
"""Run and compare the frozen UIF E0 structural probes."""

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
CORPUS_PATH = HERE / "corpus.yml"
RESULT_SCHEMA_PATH = HERE / "result.schema.yml"


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"expected YAML object: {path}")
    return value


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_frontmatter(text: str) -> dict[str, Any]:
    if not text.startswith("---\n"):
        raise ValueError("fixture lacks YAML frontmatter")
    parts = text.split("---", 2)
    value = yaml.safe_load(parts[1])
    if not isinstance(value, dict):
        raise ValueError("fixture frontmatter is not an object")
    return value


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def is_separator(cells: list[str]) -> bool:
    return bool(cells) and all(set(cell.replace(":", "")) <= {"-"} and len(cell.replace(":", "")) >= 3 for cell in cells)


def parse_tables(text: str) -> dict[str, dict[str, Any]]:
    lines = text.splitlines()
    tables: dict[str, dict[str, Any]] = {}
    heading = ""
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("## "):
            heading = line[3:].strip()
        if line.startswith("|") and i + 1 < len(lines) and lines[i + 1].startswith("|"):
            header = split_row(line)
            separator = split_row(lines[i + 1])
            if is_separator(separator):
                rows: list[dict[str, str]] = []
                i += 2
                while i < len(lines) and lines[i].startswith("|"):
                    values = split_row(lines[i])
                    if len(values) == len(header):
                        rows.append(dict(zip(header, values)))
                    i += 1
                tables[heading] = {"columns": header, "rows": rows}
                continue
        i += 1
    return tables


def find_table(tables: dict[str, dict[str, Any]], name: str) -> dict[str, Any] | None:
    for heading, table in tables.items():
        if heading == name or heading.endswith(f" {name}"):
            return table
    return None


def evaluate_structure(pair: dict[str, Any], text: str) -> tuple[bool, list[str]]:
    tables = parse_tables(text)
    probe = pair["criterion_probe"]
    failures: list[str] = []

    for name, required_columns in probe.get("required_tables", {}).items():
        table = find_table(tables, name)
        if table is None:
            failures.append(f"missing-table:{name}")
            continue
        missing = [column for column in required_columns if column not in table["columns"]]
        failures.extend(f"missing-column:{name}:{column}" for column in missing)

    for name, minimum in probe.get("minimum_rows", {}).items():
        table = find_table(tables, name)
        if table is None or len(table["rows"]) < int(minimum):
            failures.append(f"minimum-rows:{name}:{minimum}")

    for name, required_attributes in probe.get("required_attributes", {}).items():
        table = find_table(tables, name)
        values = {}
        if table is not None and {"Attribute", "Value"} <= set(table["columns"]):
            values = {row["Attribute"]: row["Value"] for row in table["rows"]}
        for attribute in required_attributes:
            if not values.get(attribute):
                failures.append(f"missing-attribute:{name}:{attribute}")

    return not failures, failures


def evaluate_graph(pair: dict[str, Any], text: str) -> tuple[str, list[str]]:
    required = []
    for item in pair["criterion_probe"].get("supporting_edges", []):
        required.extend(item.keys())
    if not required:
        return "not-applicable", []
    table = find_table(parse_tables(text), "Relationships")
    observed = set()
    if table is not None and "Edge" in table["columns"]:
        observed = {row["Edge"] for row in table["rows"]}
    missing = [edge for edge in required if edge not in observed]
    return ("fail", missing) if missing else ("pass", [])


def observed_for(role: str, structurally_valid: bool, frontmatter: dict[str, Any]) -> str:
    if role == "positive":
        return "accept" if structurally_valid else "reject"
    if role == "malformed-negative":
        return "accept" if structurally_valid else "reject"
    if role == "neighbor":
        if structurally_valid:
            return "accept"
        if frontmatter.get("expected_behavior") == "reroute":
            return "reroute"
        return "reject"
    raise ValueError(f"unknown fixture role: {role}")


def validate_result(result: dict[str, Any], schema: dict[str, Any]) -> None:
    missing = [field for field in schema["required_fields"] if field not in result]
    if missing:
        raise ValueError(f"result missing fields: {missing}")
    contracts = schema["field_contracts"]
    for field in ("pair_id", "protocol_version", "candidate", "repeatability", "method_outcome", "provisional_outcome"):
        allowed = contracts[field].get("allowed", [])
        if allowed and result[field] not in allowed:
            raise ValueError(f"invalid {field}: {result[field]}")
    for run_name in contracts["runs"]["required"]:
        if run_name not in result["runs"]:
            raise ValueError(f"missing run result: {run_name}")
        observed = result["runs"][run_name]["observed"]
        allowed = contracts["runs"]["observations"][run_name]
        if observed not in allowed:
            raise ValueError(f"invalid observation {run_name}: {observed}")


def run_pair(pair: dict[str, Any], corpus: dict[str, Any], schema: dict[str, Any]) -> dict[str, Any]:
    entries = [entry for entry in corpus["entries"] if entry["pair_id"] == pair["pair_id"]]
    by_role = {entry["role"]: entry for entry in entries}
    observations: dict[str, str] = {}
    failures: dict[str, list[str]] = {}
    fixture_refs: list[str] = []

    for role in ("positive", "malformed-negative", "neighbor"):
        entry = by_role[role]
        fixture_path = HERE / entry["path"]
        text = fixture_path.read_text(encoding="utf-8")
        frontmatter = parse_frontmatter(text)
        valid, reasons = evaluate_structure(pair, text)
        observations[role] = observed_for(role, valid, frontmatter)
        failures[role] = reasons
        fixture_refs.append(entry["path"])

    positive_text = (HERE / by_role["positive"]["path"]).read_text(encoding="utf-8")
    graph_observed, graph_missing = evaluate_graph(pair, positive_text)
    expected = pair["expected"]
    separation = (
        observations["positive"] == expected["positive"]
        and observations["malformed-negative"] == expected["malformed_negative"]
        and observations["neighbor"] == "reroute"
        and pair["method_expectation"] == "structural-separation-survives"
    )
    collapse = (
        observations["positive"] == expected["positive"]
        and observations["malformed-negative"] == expected["malformed_negative"]
        and observations["neighbor"] == "accept"
        and pair["method_expectation"] == "structural-collapse-observed"
    )
    method_outcome = pair["method_expectation"] if separation or collapse else "inconclusive"

    result = {
        "experiment_id": f"{pair['pair_id']}-RUN",
        "pair_id": pair["pair_id"],
        "protocol_version": load_yaml(PROTOCOL_PATH)["protocol_version"],
        "protocol_sha256": digest(PROTOCOL_PATH),
        "corpus_sha256": digest(CORPUS_PATH),
        "candidate": pair["candidate"]["label"],
        "hypothesis_ref": f"../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md#{pair['candidate']['id']}",
        "corpus_refs": fixture_refs,
        "criterion_probe_ref": f"protocol.yml#{pair['pair_id']}",
        "runs": {
            "positive": {"expected": expected["positive"], "observed": observations["positive"], "failures": failures["positive"]},
            "malformed_negative": {"expected": expected["malformed_negative"], "observed": observations["malformed-negative"], "failures": failures["malformed-negative"]},
            "neighbor_probe": {"expected": expected["neighbor_probe"], "observed": observations["neighbor"], "failures": failures["neighbor"]},
            "graph_coherence": {"expected": "pass", "observed": graph_observed, "missing_edges": graph_missing, "evidence_role": "supporting-only"},
            "portability": {"expected": "incomplete-at-e0", "observed": "incomplete"},
            "round_trip": {"expected": "not-run-at-e0", "observed": "not-run"},
        },
        "repeatability": "not-run",
        "method_outcome": method_outcome,
        "provisional_outcome": "not-adjudicated",
        "reason_codes": expected["reason_codes"] if method_outcome == pair["method_expectation"] else ["e0-expectation-mismatch"],
        "evidence": fixture_refs,
        "residue": [
            "synthetic-only-corpus",
            "portability-incomplete-at-e0",
            "round-trip-not-run-at-e0",
            "ds-d8-evidence-supporting-only",
        ],
        "promotion_eligible": False,
    }
    validate_result(result, schema)
    return result


def write_yaml(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(value, sort_keys=False, allow_unicode=False), encoding="utf-8")


def run_command(output: Path) -> int:
    protocol = load_yaml(PROTOCOL_PATH)
    corpus = load_yaml(CORPUS_PATH)
    schema = load_yaml(RESULT_SCHEMA_PATH)
    if protocol["status"] != "frozen-before-execution" or corpus["status"] != "frozen-before-execution":
        raise ValueError("protocol and corpus must be frozen before execution")

    results = []
    for pair in protocol["pairs"]:
        result = run_pair(pair, corpus, schema)
        results.append(result)
        slug = pair["pair_id"].lower().replace("uif-e0-", "")
        write_yaml(output / f"{slug}.result.yml", result)

    manifest = {
        "schema_version": "ui-formalization.run-manifest.v0.1",
        "protocol_version": protocol["protocol_version"],
        "protocol_sha256": digest(PROTOCOL_PATH),
        "corpus_sha256": digest(CORPUS_PATH),
        "result_files": [f"{pair['pair_id'].lower().replace('uif-e0-', '')}.result.yml" for pair in protocol["pairs"]],
        "method_outcomes": {result["pair_id"]: result["method_outcome"] for result in results},
        "promotion_eligible": False,
    }
    write_yaml(output / "run-manifest.yml", manifest)
    mismatches = [result for result, pair in zip(results, protocol["pairs"]) if result["method_outcome"] != pair["method_expectation"]]
    print(f"E0 run {'PASS' if not mismatches else 'FAIL'}: {manifest['method_outcomes']}")
    return 1 if mismatches else 0


def compare_command(left: Path, right: Path, output: Path) -> int:
    protocol = load_yaml(PROTOCOL_PATH)
    schema = load_yaml(RESULT_SCHEMA_PATH)
    comparisons = []
    failed = False
    for pair in protocol["pairs"]:
        slug = pair["pair_id"].lower().replace("uif-e0-", "")
        left_result = load_yaml(left / f"{slug}.result.yml")
        right_result = load_yaml(right / f"{slug}.result.yml")
        fields = list(protocol["run_policy"]["compare_fields"]) + ["runs", "protocol_sha256", "corpus_sha256"]
        differences = [field for field in fields if left_result.get(field) != right_result.get(field)]
        identical = not differences
        failed = failed or not identical
        final = copy.deepcopy(left_result)
        final["repeatability"] = "deterministic" if identical else "non-deterministic"
        if not identical:
            final["method_outcome"] = "protocol-failure"
            final["reason_codes"] = ["repeatability-mismatch"]
            final["residue"] = list(final["residue"]) + [f"different-fields:{','.join(differences)}"]
        validate_result(final, schema)
        write_yaml(output / f"{slug}.result.yml", final)
        comparisons.append({
            "pair_id": pair["pair_id"],
            "identical": identical,
            "different_fields": differences,
            "method_outcome": final["method_outcome"],
            "expected_method_outcome": pair["method_expectation"],
        })
        if final["method_outcome"] != pair["method_expectation"]:
            failed = True

    comparison = {
        "schema_version": "ui-formalization.comparison.v0.1",
        "status": "pass" if not failed else "fail",
        "protocol_version": protocol["protocol_version"],
        "protocol_sha256": digest(PROTOCOL_PATH),
        "corpus_sha256": digest(CORPUS_PATH),
        "compared_fields": list(protocol["run_policy"]["compare_fields"]) + ["runs", "protocol_sha256", "corpus_sha256"],
        "pairs": comparisons,
        "provisional_outcome": "not-adjudicated",
        "promotion_eligible": False,
        "residue": ["synthetic-only-corpus", "real-corpus-required-before-promotion"],
    }
    write_yaml(output / "comparison.yml", comparison)
    summary_lines = [
        "# E0 Comparison Summary",
        "",
        f"Status: **{comparison['status'].upper()}**.",
        "",
        "Both runs consumed identical protocol and corpus hashes. Experimental",
        "method outcomes do not select final UI meta-type outcomes or promotion.",
        "",
        "| Pair | Repeatable | Method outcome | Expected |",
        "| --- | --- | --- | --- |",
    ]
    for item in comparisons:
        summary_lines.append(
            f"| {item['pair_id']} | {'yes' if item['identical'] else 'no'} | {item['method_outcome']} | {item['expected_method_outcome']} |"
        )
    summary_lines.extend([
        "",
        "Residue: corpus is synthetic-only; portability and instance round-trip",
        "remain untested; every provisional outcome remains `not-adjudicated`.",
        "",
    ])
    (output / "SUMMARY.md").write_text("\n".join(summary_lines), encoding="utf-8")
    print(f"E0 comparison {'PASS' if not failed else 'FAIL'}: {comparisons}")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    run_parser = sub.add_parser("run")
    run_parser.add_argument("--output", type=Path, required=True)
    compare_parser = sub.add_parser("compare")
    compare_parser.add_argument("--left", type=Path, required=True)
    compare_parser.add_argument("--right", type=Path, required=True)
    compare_parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "run":
        return run_command(args.output.resolve())
    return compare_command(args.left.resolve(), args.right.resolve(), args.output.resolve())


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (KeyError, TypeError, ValueError, OSError, yaml.YAMLError) as error:
        print(f"E0 runner ERROR: {error}", file=sys.stderr)
        raise SystemExit(2)
