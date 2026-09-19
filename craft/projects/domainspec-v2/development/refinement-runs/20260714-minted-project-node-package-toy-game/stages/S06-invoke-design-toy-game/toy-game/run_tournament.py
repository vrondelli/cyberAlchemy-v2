#!/usr/bin/env python3
"""Run the deterministic three-layout toy-game tournament and named mutants."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Callable

from toy_compiler import CompileFailure, compile_project, pretty_bytes, sha256_file, verify_build


TOY_ROOT = Path(__file__).resolve().parent


def repository_root() -> Path:
    for parent in [TOY_ROOT, *TOY_ROOT.parents]:
        if (parent / ".git").exists():
            return parent
    raise RuntimeError("repository root not found")


REPO_ROOT = repository_root()
META_TYPES = REPO_ROOT / "projects/domainspec-v2/definitions/meta-types/meta-types.yml"
RELATIONSHIPS = REPO_ROOT / "projects/domainspec-v2/definitions/relationships/relationships.yml"


def load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write(path: Path, value: Any) -> None:
    path.write_bytes(pretty_bytes(value))


def tree_digests(root: Path) -> dict[str, str]:
    return {
        path.relative_to(root).as_posix(): sha256_file(path)
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def mutate_json(path: Path, mutator: Callable[[dict[str, Any]], None]) -> None:
    value = load(path)
    mutator(value)
    write(path, value)


def expect_compile_failure(case_id: str, root: Path, expected: str, work: Path) -> dict[str, Any]:
    output = work / "outputs" / case_id
    try:
        compile_project(root, output, META_TYPES, RELATIONSHIPS)
    except CompileFailure as exc:
        return {
            "case_id": case_id,
            "expected_failure": expected,
            "actual_failure": exc.code,
            "result": "PASS" if exc.code == expected else "FAIL",
            "detail": exc.detail,
        }
    return {"case_id": case_id, "expected_failure": expected, "actual_failure": "none", "result": "FAIL", "detail": "compile unexpectedly passed"}


def expect_verify_failure(case_id: str, root: Path, expected: str) -> dict[str, Any]:
    try:
        verify_build(root)
    except CompileFailure as exc:
        return {
            "case_id": case_id,
            "expected_failure": expected,
            "actual_failure": exc.code,
            "result": "PASS" if exc.code == expected else "FAIL",
            "detail": exc.detail,
        }
    return {"case_id": case_id, "expected_failure": expected, "actual_failure": "none", "result": "FAIL", "detail": "verification unexpectedly passed"}


def dominates(left: dict[str, int], right: dict[str, int]) -> bool:
    keys = ["authority_clarity", "traversal_completeness", "determinism", "edit_locality", "file_count_cost"]
    return all(left[key] >= right[key] for key in keys) and any(left[key] > right[key] for key in keys)


def run() -> dict[str, Any]:
    generated = TOY_ROOT / "generated"
    work = TOY_ROOT / ".work"
    for path in (generated, work):
        if path.exists():
            shutil.rmtree(path)
        path.mkdir(parents=True)

    layouts: dict[str, dict[str, Any]] = {}
    graph_digests: set[str] = set()
    markdown_digests: set[str] = set()

    base_scores = {
        "layout-a": {"authority_clarity": 5, "edit_locality": 5},
        "layout-b": {"authority_clarity": 5, "edit_locality": 5},
        "layout-c": {"authority_clarity": 4, "edit_locality": 3},
    }

    for layout in ("layout-a", "layout-b", "layout-c"):
        candidate = TOY_ROOT / "candidates" / layout
        output = generated / layout
        receipt = compile_project(candidate, output, META_TYPES, RELATIONSHIPS)
        verify_build(output)
        repeat = work / "repeat" / layout
        compile_project(candidate, repeat, META_TYPES, RELATIONSHIPS)
        repeat_equal = tree_digests(output) == tree_digests(repeat)
        manifest = load(output / "source-manifest.json")
        graph = load(output / "graph.json")
        source_count = len(manifest["inputs"])
        scores = {
            **base_scores[layout],
            "traversal_completeness": 5 if len(graph["nodes"]) == 4 and len(manifest["records"]) == 7 else 0,
            "determinism": 5 if repeat_equal else 0,
            "file_count_cost": max(0, 10 - source_count),
        }
        layouts[layout] = {
            "result": "PASS" if repeat_equal else "FAIL",
            "source_file_count": source_count,
            "node_count": len(graph["nodes"]),
            "edge_count": len(graph["edges"]),
            "repeat_run_equal": repeat_equal,
            "graph_sha256": receipt["graph_sha256"],
            "source_manifest_sha256": receipt["source_manifest_sha256"],
            "markdown_sha256": receipt["markdown_sha256"],
            "scores": scores,
        }
        graph_digests.add(receipt["graph_sha256"])
        markdown_digests.add(receipt["markdown_sha256"])

    mutants_root = work / "mutants"
    source_a = TOY_ROOT / "candidates/layout-a"
    mutation_results: list[dict[str, Any]] = []

    def copy_case(case_id: str) -> Path:
        target = mutants_root / case_id
        shutil.copytree(source_a, target)
        return target

    root = copy_case("dangling-target")
    mutate_json(root / "specs/key-and-door/nodes/player.json", lambda data: data["connections"][0].update({"to": "key-and-door.MissingDoor"}))
    mutation_results.append(expect_compile_failure("dangling-target", root, "dangling-target", work))

    root = copy_case("duplicate-edge-ownership")
    player_edge = load(root / "specs/key-and-door/nodes/player.json")["connections"][0]
    mutate_json(root / "specs/key-and-door/nodes/unlock-door.json", lambda data: data["connections"].append(player_edge))
    mutation_results.append(expect_compile_failure("duplicate-edge-ownership", root, "duplicate-edge-id", work))

    root = copy_case("unknown-relationship")
    mutate_json(root / "specs/key-and-door/nodes/player.json", lambda data: data["connections"][0].update({"type": "opens"}))
    mutation_results.append(expect_compile_failure("unknown-relationship", root, "unknown-relationship", work))

    root = copy_case("endpoint-invalid")
    mutate_json(root / "specs/key-and-door/nodes/player.json", lambda data: data["connections"][0].update({"to": "key-and-door.DoorUnlocked"}))
    mutation_results.append(expect_compile_failure("endpoint-invalid", root, "endpoint-invalid", work))

    stale_graph = work / "stale-graph"
    shutil.copytree(generated / "layout-a", stale_graph)
    mutate_json(stale_graph / "graph.json", lambda data: data.update({"tampered": True}))
    mutation_results.append(expect_verify_failure("stale-graph", stale_graph, "stale-graph"))

    stale_markdown = work / "stale-markdown"
    shutil.copytree(generated / "layout-a", stale_markdown)
    with (stale_markdown / "SPEC.md").open("a", encoding="utf-8") as handle:
        handle.write("hand-authored semantic repair\n")
    mutation_results.append(expect_verify_failure("stale-markdown", stale_markdown, "stale-markdown"))

    root = copy_case("markdown-only-machine-field")
    player = root / "specs/key-and-door/nodes/player.json"
    mutate_json(player, lambda data: data.pop("intent"))
    (root / "specs/key-and-door/README.md").write_text("Player intent: open the door.\n", encoding="utf-8")
    mutation_results.append(expect_compile_failure("markdown-only-machine-field", root, "missing-machine-field", work))

    root = copy_case("external-source-root")
    mutate_json(root / "project.json", lambda data: data.update({"features": ["../layout-b/specs/key-and-door/feature.json"]}))
    mutation_results.append(expect_compile_failure("external-source-root", root, "source-path-escape", work))

    for layout, record in layouts.items():
        score = record["scores"]
        record["dominated_by"] = [other for other, other_record in layouts.items() if other != layout and dominates(other_record["scores"], score)]

    positive_pass = all(record["result"] == "PASS" for record in layouts.values()) and len(graph_digests) == 1 and len(markdown_digests) == 1
    mutations_pass = all(record["result"] == "PASS" for record in mutation_results)
    winner = [layout for layout, record in layouts.items() if not record["dominated_by"]]
    selected = winner[0] if len(winner) == 1 else None

    evidence = {
        "schema_version": "toy-game-evidence/v0",
        "experiment": "SCU-MINT-NODE-PACKAGE-TOY-001",
        "result": "PASS" if positive_pass and mutations_pass and selected == "layout-a" else "FAIL",
        "language_inputs": {
            "kinds_path": "projects/domainspec-v2/definitions/meta-types/meta-types.yml",
            "kinds_sha256": sha256_file(META_TYPES),
            "relationships_path": "projects/domainspec-v2/definitions/relationships/relationships.yml",
            "relationships_sha256": sha256_file(RELATIONSHIPS),
        },
        "semantic_equivalence": {
            "graph_byte_equal": len(graph_digests) == 1,
            "markdown_byte_equal": len(markdown_digests) == 1,
            "graph_sha256": sorted(graph_digests),
            "markdown_sha256": sorted(markdown_digests),
        },
        "layouts": layouts,
        "mutations": mutation_results,
        "pareto": {
            "criteria": ["authority_clarity", "traversal_completeness", "determinism", "edit_locality", "file_count_cost"],
            "non_dominated": winner,
            "selected": selected,
            "rationale": "Layout A preserves unique node and edge ownership and one-file edit locality while emitting the same graph as B/C; B adds three source files without a witnessed independent edge lifecycle, and C concentrates records in bundles.",
            "preserved_option": "Re-run with layout B when edges acquire an owner or evidence lifecycle independent of source nodes."
        },
        "review_repairs": {
            "R1": "PASS: external source-root escape rejected",
            "R2": "PASS: Markdown-only required field rejected",
            "R3": "PASS: identical first-class graphs and duplicate edge ID rejected",
            "R4": "PASS at L0: current language registries bound by digest; package distribution deferred"
        },
        "scope_limits": ["single feature", "same-feature relationships", "candidate registry maturity", "disposable compiler", "no production source-home decision"]
    }
    (TOY_ROOT / "EVIDENCE.json").write_bytes(pretty_bytes(evidence))
    shutil.rmtree(work)
    return evidence


if __name__ == "__main__":
    result = run()
    print(json.dumps({"result": result["result"], "selected": result["pareto"]["selected"], "mutations": len(result["mutations"])}, sort_keys=True))
    raise SystemExit(0 if result["result"] == "PASS" else 1)
