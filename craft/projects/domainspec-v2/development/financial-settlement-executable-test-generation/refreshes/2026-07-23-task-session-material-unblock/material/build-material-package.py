#!/usr/bin/env python3
"""Build exact staged post-images for SWU-FSTG-001 and its Invoke material package."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


PACKAGE_ID = "dsv2-fstg-swu-001-20260723T174139Z"
LIFECYCLE_OWNER = "projects/domainspec-v2"


def find_repo_root() -> Path:
    for candidate in Path(__file__).resolve().parents:
        if (candidate / ".git").exists():
            return candidate
    raise RuntimeError("repository root not found")


REPO_ROOT = find_repo_root()
MATERIAL_ROOT = Path(__file__).resolve().parent
STAGED_PREFIX = MATERIAL_ROOT.relative_to(REPO_ROOT) / "staged"
OUTPUT = MATERIAL_ROOT / "MATERIAL-PACKAGE.json"

WORK_PACK = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/WORK-PACK.md"
)
CONTEXT_PACK = (
    "projects/domainspec-v2/development/"
    "financial-settlement-executable-test-generation/session-evidence/"
    "SWU-FSTG-001/20260723T174139Z-declared-subset-mode/context-pack.json"
)
ENGINE = (
    "projects/domainspec-v2/impl/test-derivation-engine/"
    "src/bte/development-engine.ts"
)
ENGINE_TEST = (
    "projects/domainspec-v2/impl/test-derivation-engine/"
    "src/bte/development-engine.test.ts"
)
PACKAGE_JSON = "projects/domainspec-v2/impl/package.json"
TARGETS = [PACKAGE_JSON, ENGINE_TEST, ENGINE]

VALIDATION_COMMANDS = [
    "npm --prefix projects/domainspec-v2/impl run verify:bte",
    (
        "npx vitest run projects/domainspec-v2/impl/"
        "test-derivation-engine/src/bte/development-engine.test.ts"
    ),
]


def sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def exact_ref(path: str) -> dict[str, object]:
    content = (REPO_ROOT / path).read_bytes()
    return {
        "path": path,
        "sha256": sha256(content),
        "size_bytes": len(content),
    }


def replace_once(text: str, before: str, after: str, label: str) -> str:
    count = text.count(before)
    if count != 1:
        raise RuntimeError(f"{label}: expected one anchor, found {count}")
    return text.replace(before, after, 1)


def render_engine(source: str) -> str:
    source = replace_once(
        source,
        "export type BackendRelationship = (typeof BACKEND_RELATIONSHIPS)[number];\n",
        (
            "export type BackendRelationship = (typeof BACKEND_RELATIONSHIPS)[number];\n"
            "\n"
            "export type DevelopmentCoverageMode =\n"
            '  | "complete-profile"\n'
            '  | "declared-subset";\n'
        ),
        "coverage mode type",
    )
    source = replace_once(
        source,
        (
            '  schema_version: "bte-development-project/v1";\n'
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  nodes: DevelopmentNode[];\n"
        ),
        (
            '  schema_version: "bte-development-project/v1";\n'
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  coverage_mode?: DevelopmentCoverageMode;\n"
            "  nodes: DevelopmentNode[];\n"
        ),
        "project coverage mode",
    )
    source = replace_once(
        source,
        (
            '  schema_version: "bte-development-graph/v1";\n'
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  nodes: DevelopmentNode[];\n"
        ),
        (
            '  schema_version: "bte-development-graph/v1";\n'
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  coverage_mode: DevelopmentCoverageMode;\n"
            "  nodes: DevelopmentNode[];\n"
        ),
        "graph coverage mode",
    )
    source = replace_once(
        source,
        (
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  profile_digest: string;\n"
            "  source_set_digest: string;\n"
        ),
        (
            "  project_id: string;\n"
            "  profile_id: typeof DEVELOPMENT_PROFILE_ID;\n"
            "  profile_digest: string;\n"
            "  coverage_mode: DevelopmentCoverageMode;\n"
            "  coverage_set_digest: string;\n"
            "  source_set_digest: string;\n"
        ),
        "receipt coverage identity",
    )
    source = replace_once(
        source,
        (
            "function canonicalBytes(value: unknown): string {\n"
            "  return `${canonicalize(value)}\\n`;\n"
            "}\n"
        ),
        (
            "function coverageSetDigest(\n"
            "  coverageMode: DevelopmentCoverageMode,\n"
            "  kinds: readonly BackendKind[],\n"
            "  relationships: readonly BackendRelationship[],\n"
            "): string {\n"
            "  return sha256(\n"
            "    canonicalize({\n"
            "      coverage_mode: coverageMode,\n"
            "      kinds: sortedUnique(kinds),\n"
            "      relationships: sortedUnique(relationships),\n"
            "    }),\n"
            "  );\n"
            "}\n"
            "\n"
            "function canonicalBytes(value: unknown): string {\n"
            "  return `${canonicalize(value)}\\n`;\n"
            "}\n"
        ),
        "coverage digest helper",
    )
    source = replace_once(
        source,
        (
            "export function compileDevelopmentProject(\n"
            "  project: DevelopmentProject,\n"
            "): DevelopmentBuild {\n"
            "  if (\n"
        ),
        (
            "export function compileDevelopmentProject(\n"
            "  project: DevelopmentProject,\n"
            "): DevelopmentBuild {\n"
            '  const coverageMode = project.coverage_mode ?? "complete-profile";\n'
            "  if (\n"
        ),
        "coverage mode resolution",
    )
    source = replace_once(
        source,
        (
            '    project.schema_version !== "bte-development-project/v1" ||\n'
            "    project.profile_id !== DEVELOPMENT_PROFILE_ID ||\n"
            "    !nonemptyString(project.project_id)\n"
        ),
        (
            '    project.schema_version !== "bte-development-project/v1" ||\n'
            "    project.profile_id !== DEVELOPMENT_PROFILE_ID ||\n"
            "    !nonemptyString(project.project_id) ||\n"
            "    (coverageMode !== \"complete-profile\" &&\n"
            "      coverageMode !== \"declared-subset\")\n"
        ),
        "coverage envelope validation",
    )
    source = replace_once(
        source,
        (
            "  const actualKinds = project.nodes.map(({ kind }) => kind);\n"
            "  if (!exactMembers(BACKEND_KINDS, actualKinds)) {\n"
        ),
        (
            "  const actualKinds = project.nodes.map(({ kind }) => kind);\n"
            "  if (\n"
            "    actualKinds.length === 0 ||\n"
            "    (coverageMode === \"complete-profile\" &&\n"
            "      !exactMembers(BACKEND_KINDS, actualKinds))\n"
            "  ) {\n"
        ),
        "kind coverage validation",
    )
    source = replace_once(
        source,
        (
            "    const source = nodeById.get(edge.from);\n"
            "    const target = nodeById.get(edge.to);\n"
            "    if (!source || !target) {\n"
        ),
        (
            "    if (!BACKEND_RELATIONSHIPS.includes(edge.family)) {\n"
            "      throw new DevelopmentEngineError(\n"
            '        "BTE_DEV_PROFILE_INVALID",\n'
            "        edge.edge_id,\n"
            '        "edge relationship family is outside the development profile",\n'
            "      );\n"
            "    }\n"
            "    const source = nodeById.get(edge.from);\n"
            "    const target = nodeById.get(edge.to);\n"
            "    if (!source || !target) {\n"
        ),
        "relationship membership validation",
    )
    source = replace_once(
        source,
        (
            "  const actualRelationships = project.edges.map(({ family }) => family);\n"
            "  if (!exactMembers(BACKEND_RELATIONSHIPS, actualRelationships)) {\n"
        ),
        (
            "  const actualRelationships = project.edges.map(({ family }) => family);\n"
            "  if (\n"
            "    actualRelationships.length === 0 ||\n"
            "    (coverageMode === \"complete-profile\" &&\n"
            "      !exactMembers(BACKEND_RELATIONSHIPS, actualRelationships))\n"
            "  ) {\n"
        ),
        "relationship coverage validation",
    )
    source = replace_once(
        source,
        (
            '    schema_version: "bte-development-graph/v1",\n'
            "    project_id: project.project_id,\n"
            "    profile_id: DEVELOPMENT_PROFILE_ID,\n"
            "    nodes,\n"
        ),
        (
            '    schema_version: "bte-development-graph/v1",\n'
            "    project_id: project.project_id,\n"
            "    profile_id: DEVELOPMENT_PROFILE_ID,\n"
            "    coverage_mode: coverageMode,\n"
            "    nodes,\n"
        ),
        "graph coverage value",
    )
    source = replace_once(
        source,
        (
            "    profile_id: DEVELOPMENT_PROFILE_ID,\n"
            "    profile_digest: profileDigest(),\n"
            "    source_set_digest: sourceSetDigest,\n"
        ),
        (
            "    profile_id: DEVELOPMENT_PROFILE_ID,\n"
            "    profile_digest: profileDigest(),\n"
            "    coverage_mode: coverageMode,\n"
            "    coverage_set_digest: coverageSetDigest(\n"
            "      coverageMode,\n"
            "      actualKinds,\n"
            "      actualRelationships,\n"
            "    ),\n"
            "    source_set_digest: sourceSetDigest,\n"
        ),
        "receipt coverage value",
    )
    return source


def render_test(source: str) -> str:
    source = replace_once(
        source,
        (
            "  replayDevelopmentBuild,\n"
            "  type DevelopmentEngineErrorCode,\n"
        ),
        (
            "  replayDevelopmentBuild,\n"
            "  type DevelopmentEngineErrorCode,\n"
            "  type DevelopmentProject,\n"
        ),
        "test project type import",
    )
    source = replace_once(
        source,
        (
            "function expectCode(\n"
            "  action: () => unknown,\n"
            "  code: DevelopmentEngineErrorCode,\n"
            "): void {\n"
            "  expect(action).toThrowError(\n"
            "    expect.objectContaining<Partial<DevelopmentEngineError>>({ code }),\n"
            "  );\n"
            "}\n"
        ),
        (
            "function expectCode(\n"
            "  action: () => unknown,\n"
            "  code: DevelopmentEngineErrorCode,\n"
            "): void {\n"
            "  expect(action).toThrowError(\n"
            "    expect.objectContaining<Partial<DevelopmentEngineError>>({ code }),\n"
            "  );\n"
            "}\n"
            "\n"
            "function createDeclaredSubsetProject(): DevelopmentProject {\n"
            "  const project = createCompleteDevelopmentProject();\n"
            '  project.project_id = "bte-development-declared-subset";\n'
            '  project.coverage_mode = "declared-subset";\n'
            "  project.nodes = project.nodes.filter(({ node_id }) =>\n"
            '    ["core.Account", "core.ChangeAccount"].includes(node_id),\n'
            "  );\n"
            "  project.edges = project.edges.filter(\n"
            '    ({ edge_id }) => edge_id === "edge-performs",\n'
            "  );\n"
            "  return project;\n"
            "}\n"
        ),
        "subset fixture",
    )
    source = replace_once(
        source,
        (
            "    expect(first.receipt.admission).toBe(\"development-only\");\n"
            "    expect(replayDevelopmentBuild(project, first)).toEqual({\n"
        ),
        (
            "    expect(first.receipt.admission).toBe(\"development-only\");\n"
            '    expect(first.receipt.coverage_mode).toBe("complete-profile");\n'
            "    expect(replayDevelopmentBuild(project, first)).toEqual({\n"
        ),
        "complete profile regression assertion",
    )
    source = replace_once(
        source,
        (
            "  it(\"rejects the concrete Entity false green at formation rather than digest replay\", () => {\n"
        ),
        (
            "  it(\"compiles and replays an exact declared subset\", () => {\n"
            "    const project = createDeclaredSubsetProject();\n"
            "    const build = compileDevelopmentProject(project);\n"
            '    expect(build.graph.coverage_mode).toBe("declared-subset");\n'
            '    expect(build.receipt.coverage_mode).toBe("declared-subset");\n'
            '    expect(build.receipt.kind_set).toEqual(["Entity", "Operation"]);\n'
            '    expect(build.receipt.relationship_set).toEqual(["performs"]);\n'
            "    expect(build.receipt.coverage_set_digest).toMatch(/^[a-f0-9]{64}$/);\n"
            "    expect(replayDevelopmentBuild(project, build)).toEqual({\n"
            '      result: "pass",\n'
            "      codes: [],\n"
            "    });\n"
            "  });\n"
            "\n"
            "  it(\"rejects empty or non-profile declared subset members\", () => {\n"
            "    const emptyNodes = createDeclaredSubsetProject();\n"
            "    emptyNodes.nodes = [];\n"
            "    expectCode(\n"
            "      () => compileDevelopmentProject(emptyNodes),\n"
            '      "BTE_DEV_PROFILE_INCOMPLETE",\n'
            "    );\n"
            "\n"
            "    const emptyEdges = createDeclaredSubsetProject();\n"
            "    emptyEdges.edges = [];\n"
            "    expectCode(\n"
            "      () => compileDevelopmentProject(emptyEdges),\n"
            '      "BTE_DEV_PROFILE_INCOMPLETE",\n'
            "    );\n"
            "\n"
            "    const unknownKind = createDeclaredSubsetProject();\n"
            "    (unknownKind.nodes[0] as { kind: string }).kind = \"Unknown\";\n"
            "    expectCode(\n"
            "      () => compileDevelopmentProject(unknownKind),\n"
            '      "BTE_DEV_PROFILE_INVALID",\n'
            "    );\n"
            "\n"
            "    const unknownRelationship = createDeclaredSubsetProject();\n"
            "    (unknownRelationship.edges[0] as { family: string }).family = \"unknown\";\n"
            "    expectCode(\n"
            "      () => compileDevelopmentProject(unknownRelationship),\n"
            '      "BTE_DEV_PROFILE_INVALID",\n'
            "    );\n"
            "  });\n"
            "\n"
            "  it(\"binds declared coverage mode and sets into replay identity\", () => {\n"
            "    const project = createDeclaredSubsetProject();\n"
            "    const build = compileDevelopmentProject(project);\n"
            "    const tamperedMode = structuredClone(build);\n"
            '    tamperedMode.receipt.coverage_mode = "complete-profile";\n'
            "    expect(replayDevelopmentBuild(project, tamperedMode)).toEqual({\n"
            '      result: "fail",\n'
            '      codes: ["BTE_DEV_BUILD_REPLAY_MISMATCH"],\n'
            "    });\n"
            "\n"
            "    const tamperedSet = structuredClone(build);\n"
            '    tamperedSet.receipt.kind_set = ["Entity"];\n'
            "    expect(replayDevelopmentBuild(project, tamperedSet)).toEqual({\n"
            '      result: "fail",\n'
            '      codes: ["BTE_DEV_BUILD_REPLAY_MISMATCH"],\n'
            "    });\n"
            "\n"
            '    project.coverage_mode = "complete-profile";\n'
            "    expect(replayDevelopmentBuild(project, build)).toEqual({\n"
            '      result: "fail",\n'
            '      codes: ["BTE_DEV_PROFILE_INCOMPLETE"],\n'
            "    });\n"
            "  });\n"
            "\n"
            "  it(\"rejects the concrete Entity false green at formation rather than digest replay\", () => {\n"
        ),
        "subset tests",
    )
    return source


def write_staged(target: str, content: bytes) -> str:
    staged_relative = (STAGED_PREFIX / target).as_posix()
    staged_path = REPO_ROOT / staged_relative
    staged_path.parent.mkdir(parents=True, exist_ok=True)
    staged_path.write_bytes(content)
    return staged_relative


def main() -> None:
    engine = (REPO_ROOT / ENGINE).read_text(encoding="utf-8")
    engine_test = (REPO_ROOT / ENGINE_TEST).read_text(encoding="utf-8")
    package_json = (REPO_ROOT / PACKAGE_JSON).read_bytes()

    staged_paths = {
        ENGINE: write_staged(ENGINE, render_engine(engine).encode("utf-8")),
        ENGINE_TEST: write_staged(
            ENGINE_TEST,
            render_test(engine_test).encode("utf-8"),
        ),
        PACKAGE_JSON: write_staged(PACKAGE_JSON, package_json),
    }

    document = {
        "schema_version": "1.0.0",
        "package_id": PACKAGE_ID,
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": LIFECYCLE_OWNER,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {**exact_ref(WORK_PACK), "authority_class": "private"},
            {**exact_ref(CONTEXT_PACK), "authority_class": "private"},
        ],
        "changes": [
            {
                "target_path": target,
                "operation": "update",
                "output_ref": exact_ref(staged_paths[target]),
            }
            for target in TARGETS
        ],
        "target_inventory": [
            {
                "target_path": target,
                "lifecycle_owner": LIFECYCLE_OWNER,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": [],
            }
            for target in TARGETS
        ],
        "dependencies": [],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": LIFECYCLE_OWNER,
            "scope_paths": TARGETS,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": VALIDATION_COMMANDS,
    }
    OUTPUT.write_text(
        json.dumps(document, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
