import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {productRoot, validateProductProfile} from "./product.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function materializeCapabilityMatrix(profilePath = resolve(productRoot, "product.json")) {
  const profileBytes = readFileSync(profilePath);
  const profile = JSON.parse(profileBytes);
  const validation = validateProductProfile(profile);
  if (validation.status !== "PASS") throw new Error(validation.reason_codes.join(","));
  const rows = [
    ...profile.components.map((record) => ({kind: "component", id: record.component_id, path: record.path, layer: record.layer, maturity: record.maturity, default_enabled: record.default_enabled, install_posture: record.install_posture, install: record.install ?? null})),
    ...profile.integrations.map((record) => ({kind: "integration", id: record.integration_id, path: record.path, layer: record.layer, maturity: record.maturity, default_enabled: record.default_enabled, install_posture: record.install_posture})),
  ].sort((left, right) => left.id.localeCompare(right.id));
  const material = {
    schema_version: "are.capability-matrix/v1",
    product_id: profile.product_id,
    product_version: profile.version,
    product_profile_sha256: sha256(profileBytes),
    rows,
    authority_effect: "none",
    claim_limit: "Current product-profile classification only; not release, deployment, or runtime-health evidence."
  };
  return Object.freeze({...material, matrix_digest: sha256(JSON.stringify(material))});
}

export function renderCapabilityMatrixMarkdown(matrix) {
  const lines = [
    "# ARE current capability matrix",
    "",
    `Product profile digest: \`${matrix.product_profile_sha256}\`  `,
    `Matrix digest: \`${matrix.matrix_digest}\``,
    "",
    "| Kind | ID | Layer | Maturity | Default | Install posture |",
    "| --- | --- | --- | --- | --- | --- |",
    ...matrix.rows.map((row) => `| ${row.kind} | \`${row.id}\` | ${row.layer} | ${row.maturity} | ${row.default_enabled ? "enabled" : "disabled"} | ${row.install_posture} |`),
    "",
    `Claim limit: ${matrix.claim_limit}`,
    "",
    "## Open Questions",
    "",
    "- Which optional extensions, if any, should a separately approved successor release enable by default?",
    ""
  ];
  return lines.join("\n");
}
