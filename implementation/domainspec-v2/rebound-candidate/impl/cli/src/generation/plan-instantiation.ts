import path from "node:path";

import { canonicalJson, sha256 } from "../input/source-manifest.js";
import { validateSelectedNodeRelationships, type DecodedProjectNode } from "../input/project-model.js";
import { FROZEN_META_TYPE_CATALOG, selectRealization } from "../meta-types/catalog.js";
import type { SupportedLanguage } from "../meta-types/types.js";
import type { InstantiationPlanV1 } from "./contracts.js";
import { renderImplementation } from "./generators.js";
import { validateSystemIntegrationManifest } from "../system-integration/compiler.js";
import type { SystemIntegrationSelectionV1 } from "../system-integration/types.js";

function assertContainedRelative(relativePath: string): void {
  if (path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`planned path is not normalized and contained:${relativePath}`);
  }
}

export function planInstantiation(node: DecodedProjectNode, language: SupportedLanguage, systemIntegration: SystemIntegrationSelectionV1 | null = null): InstantiationPlanV1 {
  validateSelectedNodeRelationships(node);
  const realization = selectRealization(node.meta_type_id, language);
  const rendered = renderImplementation({
    project_id: node.project_id,
    feature_id: node.feature_id,
    node_id: node.node_id,
    kind: node.kind,
    meta_type_id: node.meta_type_id,
    body: node.body,
    relationships: node.relationships,
    realization,
  });
  const relativePath = `src/domainspec/${language}/${node.feature_id}/${node.node_id}.${rendered.extension}`;
  assertContainedRelative(relativePath);
  const artifacts = [Object.freeze({
    relative_path: relativePath,
    content: rendered.content,
    size_bytes: Buffer.byteLength(rendered.content),
    sha256: sha256(rendered.content),
  })];
  if (systemIntegration !== null) {
    const manifest = validateSystemIntegrationManifest(systemIntegration.manifest, language);
    if (manifest.subject_ref !== `${node.feature_id}:${node.node_id}`) throw new Error("system-integration subject does not match selected node");
    assertContainedRelative(systemIntegration.binding_source.relative_path);
    assertContainedRelative(systemIntegration.generated_relative_path);
    if (systemIntegration.generated_relative_path === relativePath) throw new Error("system-integration artifact collides with selected realization");
    artifacts.push(Object.freeze({
      relative_path: systemIntegration.generated_relative_path,
      content: systemIntegration.generated_content,
      size_bytes: Buffer.byteLength(systemIntegration.generated_content),
      sha256: sha256(systemIntegration.generated_content),
    }));
  }
  const body = {
    schema_version: "domainspec.instantiation-plan/v1" as const,
    baseline: Object.freeze({
      id: FROZEN_META_TYPE_CATALOG.baseline_id,
      digest: FROZEN_META_TYPE_CATALOG.baseline_digest,
      manifest_sha256: FROZEN_META_TYPE_CATALOG.manifest_sha256,
    }),
    input: Object.freeze({
      project_id: node.project_id,
      feature_id: node.feature_id,
      node_id: node.node_id,
      kind: node.kind,
      meta_type_id: node.meta_type_id,
      body: node.body,
      relationships: node.relationships,
      source_manifest: node.source_manifest,
    }),
    language,
    selected_realization: realization,
    generator_id: rendered.generator_id,
    system_integration: systemIntegration,
    artifacts: Object.freeze(artifacts),
    authority_effect: "none" as const,
  };
  return Object.freeze({ ...body, plan_sha256: sha256(canonicalJson(body)) });
}
