#!/usr/bin/env python3
"""Deterministically validate the private Lean corpus ontology candidate."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parents[4]
LEAN_REPO = REPO_ROOT / "domainspec-lean-formalization"
ONTOLOGY_ID = "CA2-ONTOLOGY-CANDIDATE-DOMAINSPEC-LEAN-CORPUS-2026-09-01"
COMMIT = "169d4a46aeaafba62c8bad127fc0522c3223e962"
HEX40 = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
DECLARATION = re.compile(r"^\s*(def|theorem)\s+([A-Za-z0-9_'.]+)(?:\s|:|$)")
RECEIPT_FILENAME = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-validation\.json$")

VERSIONS = {
    "profile.json": "lean-corpus-ontology-candidate-profile/v2",
    "materialization.json": "ontology-vault-materialization-decision/v2",
    "sources.json": "lean-corpus-ontology-candidate-sources/v2",
    "nodes.json": "lean-corpus-ontology-candidate-nodes/v2",
    "relations.json": "lean-corpus-ontology-candidate-relations/v2",
    "invariants.json": "lean-corpus-ontology-candidate-invariants/v2",
    "residue.json": "lean-corpus-ontology-candidate-residue/v2",
}
RECEIPT_V1 = "lean-corpus-ontology-candidate-validation-receipt/v1"
RECEIPT_V2 = "lean-corpus-ontology-candidate-validation-receipt/v2"
PROPOSAL_KINDS = {"relation", "predicate", "invariant", "mapping", "schema"}
DISPOSITIONS = {
    "SRC-FINDINGS": "support",
    "SRC-EVIDENCE-CLOSURE": "context-only",
    "SRC-SYNTHESIS-REVISED": "context-only",
    "SRC-SPEC-ONTOLOGY-KERNEL": "support-candidate",
    "SRC-SPEC-ONTOLOGY-INDEPENDENCE": "support-candidate",
    "SRC-AGENT-PERMISSION-KERNEL": "excluded-with-reason",
    "SRC-SECOND-LAW-DISCRETE": "excluded-with-reason",
    "SRC-M6-COUNTER": "excluded-with-reason",
    "SRC-AUTHORITY-LIFECYCLE-RESIDUE": "support-candidate",
    "SRC-EDGE-GRAMMAR-FIXTURE": "support-candidate",
    "SRC-EDGE-GRAMMAR-COMPOSITION": "support-candidate",
    "SRC-EVIDENCE-ENVELOPE-BOUNDARY": "support-bounded",
}

CONTENT_FILES = (
    "README.md",
    "profile.json",
    "materialization.json",
    "sources.json",
    "nodes.json",
    "relations.json",
    "invariants.json",
    "residue.json",
    "schema/package.schema.json",
    "scripts/validate.py",
)


class ValidationError(Exception):
    pass


def load_json(relative: str) -> dict[str, Any]:
    path = ROOT / relative
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f"cannot load {relative}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValidationError(f"{relative}: expected object")
    return value


def exact_keys(value: dict[str, Any], expected: set[str], where: str) -> None:
    actual = set(value)
    if actual != expected:
        raise ValidationError(
            f"{where}: closed shape mismatch; missing={sorted(expected - actual)} "
            f"unexpected={sorted(actual - expected)}"
        )


def require_version(value: dict[str, Any], expected: str, where: str) -> None:
    if value.get("schema_version") != expected:
        raise ValidationError(f"{where}: unsupported schema_version {value.get('schema_version')!r}; expected {expected!r}")


def unique_ids(records: list[dict[str, Any]], key: str, where: str) -> set[str]:
    ids = [record.get(key) for record in records]
    if any(not isinstance(item, str) or not item for item in ids):
        raise ValidationError(f"{where}: every {key} must be a non-empty string")
    if len(ids) != len(set(ids)):
        raise ValidationError(f"{where}: duplicate {key}")
    return set(ids)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def git(*args: str) -> str:
    completed = subprocess.run(
        ["git", "-C", str(LEAN_REPO), *args],
        check=False,
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise ValidationError(f"git {' '.join(args)} failed: {completed.stderr.strip()}")
    return completed.stdout


def qualified_declarations(lines: list[str]) -> dict[int, tuple[str, str, str]]:
    namespaces: list[str] = []
    declarations: dict[int, tuple[str, str, str]] = {}
    in_block_comment = False
    for line_number, line in enumerate(lines, start=1):
        stripped = line.strip()
        if in_block_comment:
            if "-/" in stripped:
                in_block_comment = False
            continue
        if stripped.startswith("/-"):
            if "-/" not in stripped[2:]:
                in_block_comment = True
            continue
        namespace = re.match(r"^namespace\s+([A-Za-z0-9_'.]+)\s*$", stripped)
        if namespace:
            namespaces.extend(namespace.group(1).split("."))
            continue
        if re.match(r"^end(?:\s+[A-Za-z0-9_'.]+)?\s*$", stripped):
            if namespaces:
                namespaces.pop()
            continue
        declaration = DECLARATION.match(line)
        if declaration:
            kind, raw_name = declaration.groups()
            qualified = ".".join([*namespaces, raw_name]) if namespaces else raw_name
            declarations[line_number] = (kind, raw_name, qualified)
    return declarations


def validate_profile() -> dict[str, Any]:
    profile = load_json("profile.json")
    require_version(profile, VERSIONS["profile.json"], "profile.json")
    exact_keys(
        profile,
        {
            "schema_version", "ontology_id", "label", "ontology_type", "status",
            "visibility", "operational_owner_route", "semantic_owner_status",
            "source_commit", "authority_effect", "runtime_enforcement",
            "admission_claim", "implementation_binding_claim", "conformance_claim",
        },
        "profile.json",
    )
    expected = {
        "ontology_id": ONTOLOGY_ID,
        "ontology_type": "authority-governance",
        "status": "research-candidate",
        "visibility": "private",
        "operational_owner_route": "CA2-ROUTE-IMPLEMENT",
        "semantic_owner_status": "unselected",
        "source_commit": COMMIT,
        "authority_effect": "none",
        "runtime_enforcement": False,
        "admission_claim": False,
        "implementation_binding_claim": False,
        "conformance_claim": False,
    }
    for key, wanted in expected.items():
        if profile.get(key) != wanted:
            raise ValidationError(f"profile.json: {key} must equal {wanted!r}")
    return profile


def validate_materialization() -> None:
    value = load_json("materialization.json")
    require_version(value, VERSIONS["materialization.json"], "materialization.json")
    exact_keys(
        value,
        {
            "schema_version", "result", "detected_triggers", "blockers", "owner_route",
            "package_root", "visibility", "ontology_state_write_allowed",
            "write_authorization_evidence", "append_to_prior_run_artifact_allowed",
            "authority_effect",
        },
        "materialization.json",
    )
    if value["result"] != "package-required" or value["blockers"] != []:
        raise ValidationError("materialization.json: package-required with no shape blockers is required")
    if value["owner_route"] != "CA2-ROUTE-IMPLEMENT" or value["authority_effect"] != "none":
        raise ValidationError("materialization.json: route or authority ceiling drift")
    if value["ontology_state_write_allowed"] is not False or not value["write_authorization_evidence"].startswith("none-recorded"):
        raise ValidationError("materialization.json: historical decision must not authorize a write")
    if value["append_to_prior_run_artifact_allowed"] is not False:
        raise ValidationError("materialization.json: prior run artifacts are append-protected")


def validate_sources() -> tuple[set[str], dict[tuple[str, str], dict[str, Any]]]:
    value = load_json("sources.json")
    require_version(value, VERSIONS["sources.json"], "sources.json")
    exact_keys(value, {"schema_version", "ontology_id", "sources"}, "sources.json")
    if value["ontology_id"] != ONTOLOGY_ID or not isinstance(value["sources"], list):
        raise ValidationError("sources.json: identity or sources shape mismatch")
    source_ids = unique_ids(value["sources"], "source_id", "sources.json")
    if source_ids != set(DISPOSITIONS):
        raise ValidationError("sources.json: all and only the 12 reviewed sources must receive a disposition")
    selector_index: dict[tuple[str, str], dict[str, Any]] = {}
    for source in value["sources"]:
        source_id = source["source_id"]
        if source.get("disposition") != DISPOSITIONS[source_id]:
            raise ValidationError(f"{source_id}: disposition drift")
        if not isinstance(source.get("disposition_reason"), str) or not source["disposition_reason"]:
            raise ValidationError(f"{source_id}: disposition_reason is required")
        kind = source.get("kind")
        if kind == "research-artifact":
            exact_keys(
                source,
                {"source_id", "kind", "path", "sha256", "disposition", "disposition_reason"},
                source_id,
            )
            if not HEX64.fullmatch(source["sha256"]):
                raise ValidationError(f"{source_id}: invalid sha256")
            path = (ROOT / source["path"]).resolve()
            if not path.is_relative_to(ROOT.parent):
                raise ValidationError(f"{source_id}: source escapes research package")
            if sha256(path) != source["sha256"]:
                raise ValidationError(f"{source_id}: research artifact digest drift")
        elif kind == "lean-declaration-source":
            exact_keys(
                source,
                {
                    "source_id", "kind", "repository", "commit", "path", "blob",
                    "selectors", "disposition", "disposition_reason",
                },
                source_id,
            )
            if source["repository"] != "domainspec-lean-formalization" or source["commit"] != COMMIT:
                raise ValidationError(f"{source_id}: Lean repository binding drift")
            if not HEX40.fullmatch(source["blob"]):
                raise ValidationError(f"{source_id}: invalid blob id")
            tree = git("ls-tree", COMMIT, "--", source["path"]).strip().split()
            if len(tree) < 4 or tree[1] != "blob" or tree[2] != source["blob"]:
                raise ValidationError(f"{source_id}: commit/path/blob binding drift")
            lines = git("show", f"{COMMIT}:{source['path']}").splitlines()
            declarations = qualified_declarations(lines)
            selectors = source["selectors"]
            if not isinstance(selectors, list) or not selectors:
                raise ValidationError(f"{source_id}: selectors must be non-empty")
            seen_names: set[str] = set()
            for selector in selectors:
                exact_keys(
                    selector,
                    {"research_selector", "qualified_name", "declaration_kind", "line", "declaration_line_sha256"},
                    f"{source_id} selector",
                )
                qualified_name = selector["qualified_name"]
                if qualified_name in seen_names:
                    raise ValidationError(f"{source_id}: duplicate qualified selector {qualified_name}")
                seen_names.add(qualified_name)
                line_number = selector["line"]
                if not isinstance(line_number, int) or line_number < 1 or line_number > len(lines):
                    raise ValidationError(f"{source_id}: selector line out of range")
                if not HEX64.fullmatch(selector["declaration_line_sha256"]):
                    raise ValidationError(f"{source_id}: invalid declaration line digest")
                actual_digest = sha256_bytes(lines[line_number - 1].encode("utf-8"))
                if actual_digest != selector["declaration_line_sha256"]:
                    raise ValidationError(f"{source_id}: exact declaration line digest drift at {line_number}")
                declaration = declarations.get(line_number)
                if declaration is None:
                    raise ValidationError(f"{source_id}: exact selector does not point to a declaration")
                kind_found, raw_name, qualified_found = declaration
                if (kind_found, raw_name, qualified_found) != (
                    selector["declaration_kind"], selector["research_selector"], qualified_name
                ):
                    raise ValidationError(f"{source_id}: exact declaration selector mismatch for {qualified_name}")
                selector_index[(source_id, qualified_name)] = selector
        else:
            raise ValidationError(f"{source_id}: unsupported source kind {kind!r}")
    return source_ids, selector_index


def validate_residue() -> set[str]:
    value = load_json("residue.json")
    require_version(value, VERSIONS["residue.json"], "residue.json")
    exact_keys(
        value,
        {"schema_version", "ontology_id", "research_ceiling", "corpus_observations", "prerequisite_gaps", "forbidden_inferences"},
        "residue.json",
    )
    if value["ontology_id"] != ONTOLOGY_ID:
        raise ValidationError("residue.json: ontology identity drift")
    observations = value["corpus_observations"]
    expected_observations = {
        "lean_path_occurrences": 3600, "unique_blobs": 887, "duplicate_groups": 96,
        "duplicated_occurrences": 2809, "excess_occurrences": 2713,
        "complete_ledger_present": False, "live_build_present": False,
        "ontology_utility_demonstrated": False,
    }
    exact_keys(observations, set(expected_observations), "residue.json corpus_observations")
    if observations != expected_observations:
        raise ValidationError("residue.json: accepted corpus observations drift")
    gaps = value["prerequisite_gaps"]
    if not isinstance(gaps, list):
        raise ValidationError("residue.json: prerequisite_gaps must be an array")
    for gap in gaps:
        exact_keys(gap, {"gap_id", "scope", "d65_stage", "status", "required_resolution"}, gap.get("gap_id", "gap"))
        if gap["scope"] != "global-package-prerequisite":
            raise ValidationError(f"{gap['gap_id']}: gap must remain separate from finding-local prerequisites")
        if gap["status"] not in {"missing", "unselected"}:
            raise ValidationError(f"{gap['gap_id']}: invalid unresolved status")
    return unique_ids(gaps, "gap_id", "residue.json")


def validate_nodes(source_ids: set[str], selector_index: dict[tuple[str, str], dict[str, Any]], gap_ids: set[str]) -> set[str]:
    value = load_json("nodes.json")
    require_version(value, VERSIONS["nodes.json"], "nodes.json")
    exact_keys(value, {"schema_version", "ontology_id", "nodes"}, "nodes.json")
    if value["ontology_id"] != ONTOLOGY_ID or not isinstance(value["nodes"], list):
        raise ValidationError("nodes.json: identity or nodes shape mismatch")
    nodes = value["nodes"]
    node_ids = unique_ids(nodes, "node_id", "nodes.json")
    if len(nodes) != 8:
        raise ValidationError("nodes.json: expected the eight accepted research findings")
    expected_keys = {
        "node_id", "record_kind", "label", "definition", "proposed_record_kinds",
        "source_refs", "supporting_selectors", "method", "uncertainty", "claim_ceiling",
        "proposed_review_responsibilities", "promotion_prerequisite_gap",
        "global_prerequisite_gap_ids", "status", "semantic_owner_status", "authority_effect",
    }
    for node in nodes:
        exact_keys(node, expected_keys, node["node_id"])
        if node["record_kind"] != "research-finding":
            raise ValidationError(f"{node['node_id']}: record_kind must remain research-finding")
        kinds = node["proposed_record_kinds"]
        if not isinstance(kinds, list) or not kinds or len(kinds) != len(set(kinds)) or not set(kinds).issubset(PROPOSAL_KINDS):
            raise ValidationError(f"{node['node_id']}: proposal kind must use the closed research grammar")
        if not node["source_refs"] or not set(node["source_refs"]).issubset(source_ids):
            raise ValidationError(f"{node['node_id']}: unresolved or empty source refs")
        selectors = node["supporting_selectors"]
        if not isinstance(selectors, list) or not selectors:
            raise ValidationError(f"{node['node_id']}: exact supporting selectors are required")
        for selector_ref in selectors:
            exact_keys(selector_ref, {"source_id", "qualified_name"}, f"{node['node_id']} selector ref")
            key = (selector_ref["source_id"], selector_ref["qualified_name"])
            if key not in selector_index or selector_ref["source_id"] not in node["source_refs"]:
                raise ValidationError(f"{node['node_id']}: unresolved exact selector {key}")
        for field in ("method", "claim_ceiling", "promotion_prerequisite_gap"):
            if not isinstance(node[field], str) or not node[field]:
                raise ValidationError(f"{node['node_id']}: {field} is required")
        if not isinstance(node["uncertainty"], list) or not node["uncertainty"] or not all(isinstance(item, str) and item for item in node["uncertainty"]):
            raise ValidationError(f"{node['node_id']}: explicit uncertainty is required")
        responsibilities = node["proposed_review_responsibilities"]
        if not isinstance(responsibilities, list) or not responsibilities:
            raise ValidationError(f"{node['node_id']}: proposed review responsibilities are required")
        for responsibility in responsibilities:
            exact_keys(responsibility, {"responsibility_type", "subject"}, f"{node['node_id']} review responsibility")
            if responsibility["responsibility_type"] != "proposed-non-executable-review" or not responsibility["subject"]:
                raise ValidationError(f"{node['node_id']}: review labels cannot select an owner or executable route")
        if not set(node["global_prerequisite_gap_ids"]).issubset(gap_ids):
            raise ValidationError(f"{node['node_id']}: unresolved global prerequisite refs")
        if node["status"] not in {"candidate-review-only", "deferred"}:
            raise ValidationError(f"{node['node_id']}: invalid candidate status")
        if node["semantic_owner_status"] != "unselected" or node["authority_effect"] != "none":
            raise ValidationError(f"{node['node_id']}: authority ceiling drift")
    return node_ids


def validate_relations() -> None:
    value = load_json("relations.json")
    require_version(value, VERSIONS["relations.json"], "relations.json")
    exact_keys(value, {"schema_version", "ontology_id", "relations", "empty_reason"}, "relations.json")
    if value["ontology_id"] != ONTOLOGY_ID or value["relations"] != []:
        raise ValidationError("relations.json: relations must remain exactly empty while semantic ownership is unselected")
    if not isinstance(value["empty_reason"], str) or not value["empty_reason"]:
        raise ValidationError("relations.json: empty_reason is required")


def validate_invariants(node_ids: set[str]) -> None:
    value = load_json("invariants.json")
    require_version(value, VERSIONS["invariants.json"], "invariants.json")
    exact_keys(value, {"schema_version", "ontology_id", "invariants"}, "invariants.json")
    if value["ontology_id"] != ONTOLOGY_ID or not isinstance(value["invariants"], list):
        raise ValidationError("invariants.json: identity or invariants shape mismatch")
    invariants = value["invariants"]
    unique_ids(invariants, "invariant_id", "invariants.json")
    for invariant in invariants:
        exact_keys(invariant, {"invariant_id", "applies_to", "statement", "authority_effect"}, invariant["invariant_id"])
        if not invariant["applies_to"] or not set(invariant["applies_to"]).issubset(node_ids):
            raise ValidationError(f"{invariant['invariant_id']}: unresolved applies_to refs")
        if invariant["authority_effect"] != "none":
            raise ValidationError(f"{invariant['invariant_id']}: authority ceiling drift")


def content_digests() -> dict[str, str]:
    return {relative: sha256(ROOT / relative) for relative in CONTENT_FILES}


def package_digest(digests: dict[str, str]) -> str:
    encoded = json.dumps(digests, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def parse_timestamp(value: str, where: str) -> datetime:
    try:
        parsed = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{where}: invalid UTC timestamp") from exc
    return parsed


def validate_receipts() -> int:
    receipt_dir = ROOT / "receipts"
    if not receipt_dir.exists():
        return 0
    paths = list(receipt_dir.glob("*.json"))
    records: list[tuple[datetime, Path, dict[str, Any]]] = []
    receipt_ids: set[str] = set()
    for path in paths:
        try:
            receipt = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ValidationError(f"{path.name}: cannot parse receipt: {exc}") from exc
        version = receipt.get("schema_version")
        common_keys = {
            "schema_version", "receipt_id", "ontology_id", "validation_result",
            "validated_at", "validator", "content_digests", "package_digest",
            "source_commit", "authority_effect",
        }
        if version == RECEIPT_V1:
            exact_keys(receipt, common_keys, path.name)
        elif version == RECEIPT_V2:
            exact_keys(receipt, common_keys | {"supersedes_receipt_id", "currentness_claim"}, path.name)
            if receipt["currentness_claim"] != "historical-validation-only":
                raise ValidationError(f"{path.name}: receipt must not claim currentness")
        else:
            raise ValidationError(f"{path.name}: unsupported receipt schema_version {version!r}")
        receipt_id = receipt["receipt_id"]
        if not isinstance(receipt_id, str) or not receipt_id or receipt_id in receipt_ids:
            raise ValidationError(f"{path.name}: invalid or duplicate receipt_id")
        receipt_ids.add(receipt_id)
        if receipt["ontology_id"] != ONTOLOGY_ID or receipt["validation_result"] != "pass":
            raise ValidationError(f"{path.name}: invalid receipt identity or result")
        if receipt["validator"] != "scripts/validate.py" or receipt["source_commit"] != COMMIT or receipt["authority_effect"] != "none":
            raise ValidationError(f"{path.name}: receipt binding or authority drift")
        timestamp = parse_timestamp(receipt["validated_at"], path.name)
        filename = RECEIPT_FILENAME.fullmatch(path.name)
        if not filename:
            raise ValidationError(f"{path.name}: receipt filename is not timestamp-bound")
        filename_timestamp = datetime.strptime(filename.group(1), "%Y-%m-%dT%H-%M-%SZ")
        if filename_timestamp != timestamp:
            raise ValidationError(f"{path.name}: filename and validated_at disagree")
        digests = receipt["content_digests"]
        if not isinstance(digests, dict) or set(digests) != set(CONTENT_FILES):
            raise ValidationError(f"{path.name}: content digest key closure failure")
        if any(not isinstance(digest, str) or not HEX64.fullmatch(digest) for digest in digests.values()):
            raise ValidationError(f"{path.name}: invalid content digest")
        if receipt["package_digest"] != package_digest(digests):
            raise ValidationError(f"{path.name}: internal package digest mismatch")
        records.append((timestamp, path, receipt))
    records.sort(key=lambda item: item[0])
    timestamps = [record[0] for record in records]
    if len(timestamps) != len(set(timestamps)):
        raise ValidationError("receipts: validated_at values must be unique")
    for index, (_, path, receipt) in enumerate(records):
        if receipt["schema_version"] == RECEIPT_V2:
            if index == 0 or receipt["supersedes_receipt_id"] != records[index - 1][2]["receipt_id"]:
                raise ValidationError(f"{path.name}: explicit supersession must bind the immediately prior receipt")
    return len(records)


def head_relation() -> str:
    return "matches-frozen-commit" if git("rev-parse", "HEAD").strip() == COMMIT else "different-from-frozen-commit"


def self_test() -> int:
    checks: list[str] = []
    try:
        require_version({"schema_version": "unknown/v9"}, VERSIONS["profile.json"], "self-test")
    except ValidationError:
        checks.append("unknown-schema-version-rejected")
    if qualified_declarations(["-- theorem hidden : True := by trivial"]):
        raise ValidationError("self-test: comment was accepted as declaration")
    checks.append("comment-selector-rejected")
    declarations = qualified_declarations(["namespace Exact", "theorem bound : True := by trivial", "end Exact"])
    if declarations.get(2) != ("theorem", "bound", "Exact.bound"):
        raise ValidationError("self-test: exact qualified declaration resolution failed")
    checks.append("qualified-declaration-resolved")
    fake = {relative: "0" * 64 for relative in CONTENT_FILES}
    if not HEX64.fullmatch(package_digest(fake)):
        raise ValidationError("self-test: package digest construction failed")
    checks.append("package-digest-deterministic")
    print(json.dumps({"checks": checks, "result": "pass"}, sort_keys=True))
    return 0


def main() -> int:
    if sys.argv[1:] == ["--self-test"]:
        try:
            return self_test()
        except ValidationError as exc:
            print(json.dumps({"result": "fail", "error": str(exc)}, sort_keys=True))
            return 1
    if sys.argv[1:]:
        print(json.dumps({"result": "fail", "error": "unsupported arguments"}, sort_keys=True))
        return 1
    try:
        for relative in CONTENT_FILES:
            if not (ROOT / relative).is_file():
                raise ValidationError(f"missing required content file: {relative}")
        validate_profile()
        validate_materialization()
        source_ids, selector_index = validate_sources()
        gap_ids = validate_residue()
        node_ids = validate_nodes(source_ids, selector_index, gap_ids)
        validate_relations()
        validate_invariants(node_ids)
        digests = content_digests()
        digest = package_digest(digests)
        receipt_count = validate_receipts()
        checkout_relation = head_relation()
    except (ValidationError, OSError, ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"result": "fail", "error": str(exc)}, sort_keys=True))
        return 1
    print(json.dumps({
        "authority_effect": "none",
        "checkout_head_relation": checkout_relation,
        "content_file_count": len(CONTENT_FILES),
        "ontology_id": ONTOLOGY_ID,
        "package_digest": digest,
        "receipt_count": receipt_count,
        "receipt_currentness_evaluated": False,
        "result": "pass",
        "source_commit": COMMIT,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
