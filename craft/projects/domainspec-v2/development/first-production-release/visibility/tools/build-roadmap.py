#!/usr/bin/env python3
"""Build the DomainSpec-v2 FPR roadmap read models.

The manifest owns the graph projection. Craft owns continuation state. This tool joins
them read-only and writes deterministic JSON and HTML projections.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from typing import Any

import yaml


TOOL_PATH = Path(__file__).resolve()
VISIBILITY_DIR = TOOL_PATH.parents[1]
REPO_ROOT = TOOL_PATH.parents[6]
DOMAINSPEC_V2 = REPO_ROOT / "projects" / "domainspec-v2"
MANIFEST_PATH = (
    DOMAINSPEC_V2
    / "development"
    / "first-production-release"
    / "craft"
    / "expected-node-edge-manifest.yml"
)
CRAFT_PATH = DOMAINSPEC_V2 / ".craft" / "ledger.yml"
TEMPLATE_PATH = VISIBILITY_DIR / "roadmap.template.html"
COPY_PATH = VISIBILITY_DIR / "roadmap-copy.json"
DATA_OUTPUT_PATH = VISIBILITY_DIR / "roadmap-data.json"
HTML_OUTPUT_PATH = VISIBILITY_DIR / "roadmap.html"
FPR_CONTEXT_ID = "CTX-DSV2-FIRST-PRODUCTION-RELEASE"
VISIBILITY_CONTEXT_ID = "CTX-DSV2-FPR-VISIBILITY"
DATA_MARKER = "/*__ROADMAP_DATA__*/"
BUILD_INPUT_MANIFEST_VERSION = "roadmap-build-inputs.v1"
COPY_FIELD_KEYS = {"field_id", "target", "role", "text"}
COPY_TARGET_KEYS = {"kind", "id"}
PAGE_TARGETS = {"roadmap", "orientation", "release-boundary", "source-guidance"}


class ContractError(RuntimeError):
    """Raised when source data cannot safely produce a roadmap projection."""


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ContractError(f"required source is missing: {_display_path(path)}") from exc
    except yaml.YAMLError as exc:
        raise ContractError(f"invalid YAML in {_display_path(path)}: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError(f"expected a YAML mapping in {_display_path(path)}")
    return value


def _load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ContractError(f"required source is missing: {_display_path(path)}") from exc
    except json.JSONDecodeError as exc:
        raise ContractError(f"invalid JSON in {_display_path(path)}: {exc}") from exc
    if not isinstance(value, dict):
        raise ContractError(f"expected a JSON object in {_display_path(path)}")
    return value


def _display_path(path: Path) -> str:
    try:
        return path.resolve().relative_to(REPO_ROOT).as_posix()
    except ValueError:
        return path.name


def _href_from_visibility(path: Path) -> str:
    return Path(os.path.relpath(path.resolve(), VISIBILITY_DIR.resolve())).as_posix()


def _require_list(source: dict[str, Any], key: str) -> list[Any]:
    value = source.get(key)
    if not isinstance(value, list):
        raise ContractError(f"source field {key!r} must be a list")
    return value


def _unique_map(rows: list[Any], key: str, label: str) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ContractError(f"{label}[{index}] must be a mapping")
        identity = row.get(key)
        if not isinstance(identity, str) or not identity:
            raise ContractError(f"{label}[{index}] has no non-empty {key}")
        if identity in result:
            raise ContractError(f"duplicate {label} identifier: {identity}")
        result[identity] = row
    return result


def _file_digest(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return f"sha256:{digest.hexdigest()}"


def _normalized_json_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _manifest_fingerprint(input_manifest: dict[str, Any]) -> str:
    digest = hashlib.sha256()
    digest.update(_normalized_json_bytes(input_manifest))
    return f"sha256:{digest.hexdigest()}"


def _visual_group(state: str) -> str:
    if state.startswith("closed-"):
        return "closed"
    if state.startswith("partial-") or state.startswith("research-only-") or state == "seeded-not-closed":
        return "active"
    return "blocked"


def _source_link(role: str, path: Path) -> dict[str, str]:
    return {
        "role": role,
        "path": _display_path(path),
        "href": _href_from_visibility(path),
    }


def _source_ref(role: str, path: Path) -> dict[str, str]:
    return {
        "role": role,
        "path": _display_path(path),
        "sha256": _file_digest(path),
    }


def _copy_field_id(kind: str, identity: str, role: str) -> str:
    return f"copy.{kind}.{identity}.{role}"


def _expected_copy_fields(
    nodes: list[Any],
    frontiers: list[Any],
    critical_steps: list[Any],
) -> dict[str, tuple[str, str, str]]:
    required: dict[str, tuple[str, str, str]] = {}

    def add(kind: str, identity: str, role: str) -> None:
        required[_copy_field_id(kind, identity, role)] = (kind, identity, role)

    for node in nodes:
        identity = str(node["id"])
        add("node", identity, "title")
        add("node", identity, "summary")
    for state in sorted({str(node.get("state")) for node in nodes if isinstance(node.get("state"), str)}):
        add("status", state, "status-label")
    for frontier in frontiers:
        identity = str(frontier["id"])
        add("frontier", identity, "title")
        add("frontier", identity, "summary")
    for step in critical_steps:
        add("critical-step", str(step), "label")
    return required


def _load_copy_model(
    copy_path: Path,
    nodes: list[Any],
    frontiers: list[Any],
    critical_steps: list[Any],
) -> dict[str, Any]:
    document = _load_json(copy_path)
    if document.get("schema_version") != "1.0.0":
        raise ContractError("roadmap-copy.json schema_version must be exactly 1.0.0")
    if document.get("copy_kind") != "presentation-only":
        raise ContractError("roadmap-copy.json copy_kind must be exactly presentation-only")
    fields = document.get("fields")
    if not isinstance(fields, list):
        raise ContractError("roadmap-copy.json field 'fields' must be a list")

    target_ids = {
        "node": {str(node["id"]) for node in nodes},
        "frontier": {str(frontier["id"]) for frontier in frontiers},
        "critical-step": {str(step) for step in critical_steps},
        "status": {str(node["state"]) for node in nodes if isinstance(node.get("state"), str)},
        "page": PAGE_TARGETS,
    }
    required = _expected_copy_fields(nodes, frontiers, critical_steps)
    seen: set[str] = set()
    normalized_fields: list[dict[str, Any]] = []
    copy_model: dict[str, Any] = {
        "schema_version": document["schema_version"],
        "copy_kind": document["copy_kind"],
        "coverage": {
            "required_fields": len(required),
            "provided_fields": len(fields),
            "missing_fields": 0,
            "unused_fields": 0,
        },
        "fields": normalized_fields,
        "nodes": {},
        "frontiers": {},
        "critical_steps": {},
        "status": {},
    }

    for index, field in enumerate(fields):
        if not isinstance(field, dict):
            raise ContractError(f"copy fields[{index}] must be a mapping")
        extra = set(field) - COPY_FIELD_KEYS
        missing = COPY_FIELD_KEYS - set(field)
        if extra:
            raise ContractError(f"copy field {index} has unsupported keys: {', '.join(sorted(extra))}")
        if missing:
            raise ContractError(f"copy field {index} is missing keys: {', '.join(sorted(missing))}")

        field_id = field["field_id"]
        target = field["target"]
        role = field["role"]
        text = field["text"]
        if not isinstance(field_id, str) or not field_id:
            raise ContractError(f"copy field {index} has no non-empty field_id")
        if field_id in seen:
            raise ContractError(f"duplicate copy field: {field_id}")
        if not isinstance(target, dict):
            raise ContractError(f"copy field {field_id} target must be a mapping")
        extra_target = set(target) - COPY_TARGET_KEYS
        missing_target = COPY_TARGET_KEYS - set(target)
        if extra_target:
            raise ContractError(f"copy field {field_id} target has unsupported keys: {', '.join(sorted(extra_target))}")
        if missing_target:
            raise ContractError(f"copy field {field_id} target is missing keys: {', '.join(sorted(missing_target))}")
        kind = target["kind"]
        identity = target["id"]
        if kind not in target_ids:
            raise ContractError(f"copy field {field_id} has unsupported target kind: {kind}")
        if identity not in target_ids[kind]:
            raise ContractError(f"copy field {field_id} references unknown {kind}: {identity}")
        if not isinstance(role, str) or not role:
            raise ContractError(f"copy field {field_id} has no non-empty role")
        expected_id = _copy_field_id(str(kind), str(identity), role)
        if field_id != expected_id:
            raise ContractError(f"copy field_id mismatch: expected {expected_id}, got {field_id}")
        if not isinstance(text, str) or not text.strip():
            raise ContractError(f"copy field {field_id} has no non-empty text")

        seen.add(field_id)
        normalized_fields.append(
            {
                "field_id": field_id,
                "target": {"kind": kind, "id": identity},
                "role": role,
                "text": text,
            }
        )
        if kind == "node":
            copy_model["nodes"].setdefault(identity, {})[role] = text
        elif kind == "frontier":
            copy_model["frontiers"].setdefault(identity, {})[role] = text
        elif kind == "critical-step":
            copy_model["critical_steps"][identity] = text
        elif kind == "status":
            copy_model["status"][identity] = text

    missing_required = sorted(set(required) - seen)
    unused = sorted(seen - set(required))
    copy_model["coverage"]["missing_fields"] = len(missing_required)
    copy_model["coverage"]["unused_fields"] = len(unused)
    if missing_required:
        raise ContractError(f"missing required copy field: {missing_required[0]}")
    if unused:
        raise ContractError(f"unused copy field: {unused[0]}")
    return copy_model


def _build_input_manifest(
    manifest_path: Path,
    craft_path: Path,
    copy_path: Path,
    source_paths: list[tuple[str, Path]],
    manifest: dict[str, Any],
    copy_model: dict[str, Any],
    normalized_nodes: list[dict[str, Any]],
    joined_frontiers: list[dict[str, Any]],
    critical_steps: list[Any],
) -> dict[str, Any]:
    copy_field_ids = sorted(field["field_id"] for field in copy_model["fields"])
    return {
        "manifest_version": BUILD_INPUT_MANIFEST_VERSION,
        "schema_versions": {
            "manifest": manifest.get("schema_version"),
            "copy": copy_model["schema_version"],
            "builder_contract": "1.0.0",
        },
        "inputs": {
            "graph_manifest": _source_ref("roadmap projection", manifest_path),
            "craft_ledger": _source_ref("Craft continuation authority", craft_path),
            "presentation_copy": _source_ref("presentation copy", copy_path),
            "declared_sources": [_source_ref(role, path) for role, path in source_paths],
        },
        "rendered_targets": {
            "node_ids": sorted(str(node["id"]) for node in normalized_nodes),
            "frontier_ids": sorted(str(frontier["id"]) for frontier in joined_frontiers),
            "critical_step_ids": sorted(str(step) for step in critical_steps),
            "status_ids": sorted(copy_model["status"]),
            "copy_field_ids": copy_field_ids,
            "fpr_01_field_ids": [field_id for field_id in copy_field_ids if field_id.startswith("copy.node.FPR-01.")],
        },
        "coverage": copy_model["coverage"],
    }


def build_payload(
    manifest_path: Path = MANIFEST_PATH,
    craft_path: Path = CRAFT_PATH,
    copy_path: Path = COPY_PATH,
) -> dict[str, Any]:
    manifest = _load_yaml(manifest_path)
    craft = _load_yaml(craft_path)

    if manifest.get("production_authorized") is not False:
        raise ContractError("production_authorized must be exactly false for this roadmap route")

    nodes = _require_list(manifest, "nodes")
    edges = _require_list(manifest, "edges")
    frontiers = _require_list(manifest, "frontiers")
    critical_steps = _require_list(manifest, "critical_steps")
    node_by_id = _unique_map(nodes, "id", "nodes")
    _unique_map(frontiers, "id", "frontiers")

    contexts = _require_list(craft, "contexts")
    gaps = _require_list(craft, "gaps")
    artifacts = _require_list(craft, "artifacts")
    context_by_id = _unique_map(contexts, "context_id", "Craft contexts")
    gap_by_id = _unique_map(gaps, "gap_id", "Craft gaps")
    artifact_by_id = _unique_map(artifacts, "artifact_id", "Craft artifacts")

    seen_edges: set[tuple[str, str, str]] = set()
    evidence_contexts: dict[str, list[str]] = {node_id: [] for node_id in node_by_id}
    for index, edge in enumerate(edges):
        if not isinstance(edge, dict):
            raise ContractError(f"edges[{index}] must be a mapping")
        source = edge.get("from")
        target = edge.get("to")
        kind = edge.get("kind")
        if source not in node_by_id:
            raise ContractError(f"edge {index} references unknown source node: {source}")
        if target not in node_by_id:
            if kind != "uses-evidence-from" or target not in context_by_id:
                raise ContractError(f"edge {index} references unknown target node or Craft context: {target}")
            evidence_contexts[str(source)].append(str(target))
        identity = (str(source), str(target), str(kind))
        if identity in seen_edges:
            raise ContractError(f"duplicate edge: {source} -> {target} ({kind})")
        seen_edges.add(identity)

    for node in nodes:
        dependencies = node.get("dependencies", [])
        if not isinstance(dependencies, list):
            raise ContractError(f"node {node['id']} dependencies must be a list")
        unknown = [item for item in dependencies if item not in node_by_id]
        if unknown:
            raise ContractError(f"node {node['id']} has unknown dependencies: {', '.join(map(str, unknown))}")

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node_id: str) -> None:
        if node_id in visited:
            return
        if node_id in visiting:
            raise ContractError(f"node dependency cycle detected at: {node_id}")
        visiting.add(node_id)
        for dependency in node_by_id[node_id].get("dependencies", []):
            visit(dependency)
        visiting.remove(node_id)
        visited.add(node_id)

    for node_id in node_by_id:
        visit(node_id)

    for frontier in frontiers:
        blocks = frontier.get("blocks", [])
        if not isinstance(blocks, list):
            raise ContractError(f"frontier {frontier['id']} blocks must be a list")
        unknown = [item for item in blocks if item not in node_by_id]
        if unknown:
            raise ContractError(f"frontier {frontier['id']} blocks unknown nodes: {', '.join(map(str, unknown))}")

    if not all(isinstance(step, str) and step for step in critical_steps):
        raise ContractError("critical_steps must contain only non-empty strings")
    if len(set(critical_steps)) != len(critical_steps):
        raise ContractError("critical_steps contains duplicate identifiers")

    fpr_context = context_by_id.get(FPR_CONTEXT_ID)
    if fpr_context is None:
        raise ContractError(f"Craft context is missing: {FPR_CONTEXT_ID}")
    if fpr_context.get("stage") != "plan" or fpr_context.get("gate") != "block":
        raise ContractError(
            f"unexpected parent FPR state: stage={fpr_context.get('stage')!r}, gate={fpr_context.get('gate')!r}"
        )

    joined_frontiers: list[dict[str, Any]] = []
    for frontier in frontiers:
        gap = gap_by_id.get(frontier["id"])
        if gap is None:
            raise ContractError(f"manifest frontier has no matching Craft gap: {frontier['id']}")
        if gap.get("context_id") != FPR_CONTEXT_ID:
            raise ContractError(
                f"frontier {frontier['id']} belongs to unexpected Craft context: {gap.get('context_id')}"
            )
        joined_frontiers.append(
            {
                **frontier,
                "projection_state": frontier.get("state"),
                "craft": {
                    "status": gap.get("status"),
                    "severity": gap.get("severity"),
                    "treatment": gap.get("treatment"),
                    "owner_route": gap.get("owner_route"),
                    "summary": gap.get("summary"),
                    "evidence": gap.get("evidence", []),
                },
            }
        )

    def select_artifacts(context: dict[str, Any] | None) -> list[dict[str, Any]]:
        if context is None:
            return []
        selected: list[dict[str, Any]] = []
        for artifact_id in context.get("owned_artifacts", []):
            artifact = artifact_by_id.get(artifact_id)
            if artifact is None:
                raise ContractError(f"context {context['context_id']} owns unknown artifact: {artifact_id}")
            selected.append(artifact)
        return selected

    visibility_context = context_by_id.get(VISIBILITY_CONTEXT_ID)
    source_paths: list[tuple[str, Path]] = [
        ("roadmap projection", manifest_path),
        ("Craft continuation authority", craft_path),
        ("presentation copy", copy_path),
    ]
    seen_source_paths = {path.resolve() for _, path in source_paths}
    for role, value in (manifest.get("sources") or {}).items():
        if not isinstance(value, str):
            raise ContractError(f"manifest source {role!r} must be a repository-relative path")
        source_path = REPO_ROOT / value
        if not source_path.is_file():
            raise ContractError(f"declared manifest source is missing: {value}")
        if source_path.resolve() in seen_source_paths:
            continue
        seen_source_paths.add(source_path.resolve())
        source_paths.append((role.replace("_", " "), source_path))

    normalized_nodes = [
        {
            **node,
            "visual_group": _visual_group(str(node.get("state", ""))),
            "evidence_contexts": evidence_contexts[node["id"]],
        }
        for node in nodes
    ]
    visual_counts = {group: 0 for group in ("closed", "active", "blocked")}
    for node in normalized_nodes:
        visual_counts[node["visual_group"]] += 1
    copy_model = _load_copy_model(copy_path, nodes, frontiers, critical_steps)
    build_manifest = _build_input_manifest(
        manifest_path,
        craft_path,
        copy_path,
        source_paths,
        manifest,
        copy_model,
        normalized_nodes,
        joined_frontiers,
        critical_steps,
    )
    input_fingerprint = _manifest_fingerprint(build_manifest)

    return {
        "schema_version": "1.0.0",
        "read_model": {
            "kind": "generated-disposable-projection",
            "state_authority": _display_path(craft_path),
            "graph_authority": _display_path(manifest_path),
            "production_authorized": False,
            "input_fingerprint": input_fingerprint,
            "input_manifest_version": BUILD_INPUT_MANIFEST_VERSION,
        },
        "build": {
            "input_manifest": build_manifest,
            "input_fingerprint": input_fingerprint,
        },
        "manifest": {
            "schema_version": manifest.get("schema_version"),
            "id": manifest.get("manifest_id"),
            "status": manifest.get("status"),
            "authority": manifest.get("authority"),
            "claim_boundary": manifest.get("claim_boundary"),
            "persistent_protocol": manifest.get("persistent_protocol"),
        },
        "current": {
            "context_id": FPR_CONTEXT_ID,
            "title": fpr_context.get("title"),
            "purpose": fpr_context.get("purpose"),
            "stage": fpr_context.get("stage"),
            "gate": fpr_context.get("gate"),
            "next_move": fpr_context.get("next_move"),
        },
        "visibility_context": (
            {
                "context_id": visibility_context.get("context_id"),
                "stage": visibility_context.get("stage"),
                "gate": visibility_context.get("gate"),
                "next_move": visibility_context.get("next_move"),
            }
            if visibility_context
            else None
        ),
        "counts": {
            "nodes": len(normalized_nodes),
            "edges": len(edges),
            "frontiers": len(joined_frontiers),
            "critical_steps": len(critical_steps),
            "visual_groups": visual_counts,
        },
        "nodes": normalized_nodes,
        "edges": edges,
        "frontiers": joined_frontiers,
        "copy": copy_model,
        "critical_steps": [
            {"order": index + 1, "id": step}
            for index, step in enumerate(critical_steps)
        ],
        "artifacts": {
            "fpr": select_artifacts(fpr_context),
            "visibility": select_artifacts(visibility_context),
        },
        "sources": [_source_link(role, path) for role, path in source_paths],
    }


def serialize_payload(payload: dict[str, Any]) -> str:
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def render_html(template: str, payload: dict[str, Any]) -> str:
    if template.count(DATA_MARKER) != 1:
        raise ContractError(f"HTML template must contain exactly one {DATA_MARKER} marker")
    embedded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    embedded = embedded.replace("<", "\\u003c")
    rendered = template.replace(DATA_MARKER, f"window.ROADMAP_DATA={embedded};")
    return rendered if rendered.endswith("\n") else rendered + "\n"


def generate(
    manifest_path: Path = MANIFEST_PATH,
    craft_path: Path = CRAFT_PATH,
    copy_path: Path = COPY_PATH,
    template_path: Path = TEMPLATE_PATH,
) -> tuple[str, str]:
    payload = build_payload(manifest_path, craft_path, copy_path)
    try:
        template = template_path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ContractError(f"HTML template is missing: {_display_path(template_path)}") from exc
    return serialize_payload(payload), render_html(template, payload)


def _write_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_text(content, encoding="utf-8")
    temporary.replace(path)


def check_outputs(data_path: Path, html_path: Path, data: str, html: str) -> list[str]:
    stale: list[str] = []
    for path, expected in ((data_path, data), (html_path, html)):
        try:
            actual = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            stale.append(f"missing generated output: {_display_path(path)}")
            continue
        if actual != expected:
            stale.append(f"stale generated output: {_display_path(path)}")
    return stale


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if generated outputs differ; do not write files.")
    parser.add_argument("--manifest", type=Path, default=MANIFEST_PATH)
    parser.add_argument("--craft", type=Path, default=CRAFT_PATH)
    parser.add_argument("--copy", type=Path, default=COPY_PATH)
    parser.add_argument("--template", type=Path, default=TEMPLATE_PATH)
    parser.add_argument("--data-output", type=Path, default=DATA_OUTPUT_PATH)
    parser.add_argument("--html-output", type=Path, default=HTML_OUTPUT_PATH)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        data, html = generate(args.manifest, args.craft, args.copy, args.template)
        if args.check:
            stale = check_outputs(args.data_output, args.html_output, data, html)
            if stale:
                for message in stale:
                    print(message, file=sys.stderr)
                print("refresh with: python3 " + _display_path(TOOL_PATH), file=sys.stderr)
                return 1
            print("roadmap read models are synchronized")
            return 0
        _write_atomic(args.data_output, data)
        _write_atomic(args.html_output, html)
        print(f"wrote {_display_path(args.data_output)}")
        print(f"wrote {_display_path(args.html_output)}")
        return 0
    except ContractError as exc:
        print(f"roadmap contract error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
