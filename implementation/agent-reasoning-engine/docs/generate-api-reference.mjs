#!/usr/bin/env node
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const docsRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(docsRoot, "../../..");
const manifestPath = resolve(docsRoot, "reference/api-surface.json");
const outputPath = resolve(docsRoot, "reference/API-FIELDS.md");

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const escapeCell = value => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const sourceLink = source => `../../../../${source}`;

function need(condition, code) {
  if (!condition) throw new Error(code);
}

export function validateManifest(manifest) {
  need(manifest?.schema_version === "are.documentation-api-surface/v1", "api-surface.schema-version-invalid");
  need(manifest.lifecycle_status === "candidate-internal", "api-surface.lifecycle-invalid");
  need(manifest.authority_effect === "none", "api-surface.authority-effect-invalid");
  need(manifest.classification_model?.selected_entrypoint_class === "candidate-internal", "api-surface.entrypoint-class-invalid");
  need(manifest.classification_model?.selected_schema_class === "candidate-internal", "api-surface.schema-class-invalid");
  need(typeof manifest.classification_model?.export_inheritance_rule === "string" && manifest.classification_model.export_inheritance_rule.length > 0, "api-surface.export-inheritance-rule-missing");
  need(Array.isArray(manifest.classification_model?.public_supported_identities) && manifest.classification_model.public_supported_identities.length === 0, "api-surface.public-support-requires-dr04");
  need(Array.isArray(manifest.classification_model?.experimental_identities), "api-surface.experimental-identities-invalid");
  need(Array.isArray(manifest.classification_model?.generated_identities) && manifest.classification_model.generated_identities.includes("implementation/agent-reasoning-engine/docs/reference/API-FIELDS.md"), "api-surface.generated-reference-unclassified");
  need(manifest.classification_model?.promotion_gate === "DR-04", "api-surface.promotion-gate-invalid");
  need(Array.isArray(manifest.packages) && manifest.packages.length > 0, "api-surface.packages-empty");
  need(Array.isArray(manifest.schemas) && manifest.schemas.length > 0, "api-surface.schemas-empty");
  need(typeof manifest.annotation_source === "string" && manifest.annotation_source.length > 0, "api-surface.annotation-source-missing");
  need(existsSync(resolve(repositoryRoot, manifest.annotation_source)), "api-surface.annotation-source-unavailable");
  const identities = [...manifest.packages.map(item => `package:${item.package_id}`), ...manifest.schemas.map(item => `schema:${item.schema_id}`)];
  need(new Set(identities).size === identities.length, "api-surface.identity-duplicate");
  for (const item of [...manifest.packages, ...manifest.schemas]) {
    need(item.stability === "candidate-internal", "api-surface.stability-unclassified");
    need(typeof item.source === "string" && item.source.length > 0, "api-surface.source-missing");
    need(existsSync(resolve(repositoryRoot, item.source)), `api-surface.source-unavailable:${item.source}`);
  }
  need(Array.isArray(manifest.exclusions) && manifest.exclusions.length > 0 && manifest.exclusions.every(item => typeof item === "string" && item.length > 0), "api-surface.exclusions-invalid");
}

function validateExample(value, schema, root = schema, path = "$") {
  if (schema.$ref) {
    need(schema.$ref.startsWith("#/$defs/"), `api-example.external-ref-unsupported:${path}:${schema.$ref}`);
    return validateExample(value, root.$defs[schema.$ref.split("/").at(-1)], root, path);
  }
  for (const keyword of ["allOf"]) for (const child of schema[keyword] ?? []) validateExample(value, child, root, path);
  if (schema.oneOf) {
    const matches = schema.oneOf.filter(child => { try { validateExample(value, child, root, path); return true; } catch { return false; } });
    need(matches.length === 1, `api-example.oneOf:${path}`);
    return;
  }
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (schema.type !== undefined) need([schema.type].flat().includes(type), `api-example.type:${path}`);
  if (schema.const !== undefined) need(value === schema.const, `api-example.const:${path}`);
  if (schema.enum !== undefined) need(schema.enum.includes(value), `api-example.enum:${path}`);
  if (type === "string") {
    if (schema.minLength !== undefined) need(value.length >= schema.minLength, `api-example.minLength:${path}`);
    if (schema.maxLength !== undefined) need(value.length <= schema.maxLength, `api-example.maxLength:${path}`);
    if (schema.pattern !== undefined) need(new RegExp(schema.pattern, "u").test(value), `api-example.pattern:${path}`);
  }
  if (type === "array") {
    if (schema.minItems !== undefined) need(value.length >= schema.minItems, `api-example.minItems:${path}`);
    if (schema.maxItems !== undefined) need(value.length <= schema.maxItems, `api-example.maxItems:${path}`);
    if (schema.items) value.forEach((item, index) => validateExample(item, schema.items, root, `${path}/${index}`));
  }
  if (type === "object") {
    for (const name of schema.required ?? []) need(Object.hasOwn(value, name), `api-example.required:${path}/${name}`);
    for (const [name, item] of Object.entries(value)) {
      if (schema.properties && Object.hasOwn(schema.properties, name)) validateExample(item, schema.properties[name], root, `${path}/${name}`);
      else need(schema.additionalProperties !== false, `api-example.additionalProperties:${path}/${name}`);
    }
  }
}

export function validateAnnotationCoverage(schemaId, annotation, fields) {
  need(annotation && typeof annotation === "object", `api-annotations.schema-missing:${schemaId}`);
  need(Array.isArray(annotation.fields), `api-annotations.fields-invalid:${schemaId}`);
  const byPointer = new Map(annotation.fields.map(field => [field.pointer, field]));
  need(byPointer.size === annotation.fields.length, `api-annotations.pointer-duplicate:${schemaId}`);
  need(byPointer.size === fields.length, `api-annotations.coverage-count:${schemaId}`);
  const allowedAccess = new Set(["input", "output", "read-write"]);
  const allowedSensitivity = new Set(["ordinary", "potentially-sensitive"]);
  for (const field of fields) {
    const item = byPointer.get(field.pointer);
    need(item, `api-annotations.field-missing:${schemaId}:${field.pointer}`);
    need(typeof item.description === "string" && item.description.length > 0, `api-annotations.description-missing:${schemaId}:${field.pointer}`);
    need(item.required === field.required, `api-annotations.required-drift:${schemaId}:${field.pointer}`);
    need(item.default_status === "declared" || item.default_status === "none-declared", `api-annotations.default-status-invalid:${schemaId}:${field.pointer}`);
    need(typeof item.deprecated === "boolean", `api-annotations.deprecated-invalid:${schemaId}:${field.pointer}`);
    need(allowedAccess.has(item.access), `api-annotations.access-invalid:${schemaId}:${field.pointer}`);
    need(allowedSensitivity.has(item.sensitivity), `api-annotations.sensitivity-invalid:${schemaId}:${field.pointer}`);
    need(typeof item.notes === "string" && item.notes.length > 0, `api-annotations.notes-missing:${schemaId}:${field.pointer}`);
  }
  for (const pointer of byPointer.keys()) need(fields.some(field => field.pointer === pointer), `api-annotations.field-extra:${schemaId}:${pointer}`);
  return byPointer;
}

function schemaIdentity(schema) {
  return schema.$id ?? schema.schema_version ?? schema.title ?? "unidentified-schema";
}

function typeSummary(node) {
  const parts = [];
  if (node.type !== undefined) parts.push(`type=${Array.isArray(node.type) ? node.type.join("|") : node.type}`);
  if (node.const !== undefined) parts.push(`const=${JSON.stringify(node.const)}`);
  if (node.enum !== undefined) parts.push(`enum=${node.enum.map(value => JSON.stringify(value)).join("|")}`);
  if (node.$ref !== undefined) parts.push(`ref=${node.$ref}`);
  if (node.format !== undefined) parts.push(`format=${node.format}`);
  if (node.pattern !== undefined) parts.push(`pattern=${node.pattern}`);
  if (node.minimum !== undefined) parts.push(`minimum=${node.minimum}`);
  if (node.maximum !== undefined) parts.push(`maximum=${node.maximum}`);
  if (node.minLength !== undefined) parts.push(`minLength=${node.minLength}`);
  if (node.maxLength !== undefined) parts.push(`maxLength=${node.maxLength}`);
  if (node.minItems !== undefined) parts.push(`minItems=${node.minItems}`);
  if (node.maxItems !== undefined) parts.push(`maxItems=${node.maxItems}`);
  return parts.join("; ") || "composite or unconstrained here";
}

function collectFields(node, pointer = "", rows = []) {
  if (!node || typeof node !== "object" || Array.isArray(node)) return rows;
  if (node.properties && typeof node.properties === "object") {
    const required = new Set(Array.isArray(node.required) ? node.required : []);
    for (const name of Object.keys(node.properties).sort()) {
      const child = node.properties[name];
      const childPointer = `${pointer}/properties/${name}`;
      rows.push({
        pointer: childPointer,
        required: required.has(name),
        constraint: typeSummary(child),
        description: typeof child.description === "string" ? child.description : "No description annotation in the source schema.",
      });
      collectFields(child, childPointer, rows);
    }
  }
  for (const keyword of ["$defs", "definitions"]) {
    if (!node[keyword] || typeof node[keyword] !== "object") continue;
    for (const name of Object.keys(node[keyword]).sort()) collectFields(node[keyword][name], `${pointer}/${keyword}/${name}`, rows);
  }
  for (const keyword of ["oneOf", "anyOf", "allOf", "prefixItems"]) {
    if (!Array.isArray(node[keyword])) continue;
    node[keyword].forEach((child, index) => collectFields(child, `${pointer}/${keyword}/${index}`, rows));
  }
  if (node.items && typeof node.items === "object") collectFields(node.items, `${pointer}/items`, rows);
  return rows;
}

export async function generateApiReference() {
  const manifestBytes = readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes);
  validateManifest(manifest);
  const annotationPath = resolve(repositoryRoot, manifest.annotation_source);
  const annotationBytes = readFileSync(annotationPath);
  const annotations = JSON.parse(annotationBytes);
  need(annotations.schema_version === "are.documentation-api-field-annotations/v1", "api-annotations.schema-version-invalid");
  need(annotations.surface_id === manifest.surface_id, "api-annotations.surface-id-drift");
  need(annotations.product_version === manifest.product_version, "api-annotations.product-version-drift");
  need(annotations.lifecycle_status === "candidate-internal", "api-annotations.lifecycle-invalid");
  need(annotations.authority_effect === "none", "api-annotations.authority-effect-invalid");

  const packages = [];
  for (const selected of [...manifest.packages].sort((a, b) => a.package_id.localeCompare(b.package_id))) {
    const absolute = resolve(repositoryRoot, selected.source);
    const module = await import(`${pathToFileURL(absolute).href}?docs=${digest(readFileSync(absolute))}`);
    packages.push({...selected, sha256: digest(readFileSync(absolute)), exports: Object.keys(module).sort().map(name => ({name, kind: typeof module[name]}))});
  }

  const schemas = [...manifest.schemas].sort((a, b) => a.schema_id.localeCompare(b.schema_id)).map(selected => {
    const absolute = resolve(repositoryRoot, selected.source);
    const bytes = readFileSync(absolute);
    const schema = JSON.parse(bytes);
    need(schemaIdentity(schema) === selected.schema_id, `api-surface.schema-id-mismatch:${selected.schema_id}`);
    const fields = collectFields(schema);
    const annotation = annotations.schemas?.[selected.schema_id];
    need(annotation?.source === selected.source, `api-annotations.source-drift:${selected.schema_id}`);
    need(annotation?.stability === selected.stability, `api-annotations.stability-drift:${selected.schema_id}`);
    const byPointer = validateAnnotationCoverage(selected.schema_id, annotation, fields);
    validateExample(annotation.example, schema);
    return {...selected, sha256: digest(bytes), title: schema.title ?? selected.schema_id,
      fields: fields.map(field => ({...field, annotation: byPointer.get(field.pointer)})), example: annotation.example};
  });

  const exportCount = packages.reduce((sum, item) => sum + item.exports.length, 0);
  const fieldCount = schemas.reduce((sum, item) => sum + item.fields.length, 0);
  const annotatedFieldCount = schemas.reduce((sum, item) => sum + item.fields.length, 0);
  const lines = [
    "# Generated API field reference",
    "",
    "**Lifecycle status:** CANDIDATE_INTERNAL",
    "",
    "**Audience:** ARE integrators and contract authors.",
    "",
    "**Owner:** ARE runtime and documentation owners.",
    "",
    "**Last reviewed:** 2026-09-17.",
    "",
    `**Applies to:** Private product version \`${manifest.product_version}\`.`,
    "",
    "**Claim ceiling:** Closed candidate API inventory. No public SDK or semantic-versioning promise.",
    "",
    "This file is generated by `node docs/generate-api-reference.mjs --write` from",
    "[`api-surface.json`](api-surface.json) and",
    "[`api-field-annotations.json`](api-field-annotations.json). Do not edit it by hand. Source package",
    "entrypoints and JSON Schemas retain exact contract ownership.",
    "",
    "## Generation identity",
    "",
    `- Surface: \`${manifest.surface_id}\``,
    `- Manifest SHA-256: \`${digest(manifestBytes)}\``,
    `- Annotation registry SHA-256: \`${digest(annotationBytes)}\``,
    `- Selected packages: ${packages.length}`,
    `- Runtime-visible named exports: ${exportCount}`,
    `- Selected schemas: ${schemas.length}`,
    `- Schema field occurrences: ${fieldCount}`,
    `- Fields with complete annotations: ${annotatedFieldCount}/${fieldCount}`,
    "",
    "Generation fails if an annotation is missing, extra, incomplete, or disagrees",
    "with source-schema requiredness. Examples are validated against their selected",
    "schemas. Annotations explain the candidate contract but do not change validation.",
    "",
    "## Package exports",
    "",
  ];

  for (const pkg of packages) {
    lines.push(`### ${pkg.package_id}`, "", `Source: [\`${pkg.source}\`](${sourceLink(pkg.source)})`, "", `Stability: \`${pkg.stability}\`. Source SHA-256: \`${pkg.sha256}\`.`, "", "| Export | Runtime kind |", "| --- | --- |");
    for (const item of pkg.exports) lines.push(`| \`${escapeCell(item.name)}\` | ${escapeCell(item.kind)} |`);
    lines.push("");
  }

  lines.push("## Record fields", "");
  for (const schema of schemas) {
    lines.push(`### ${schema.schema_id}`, "", `Source: [\`${schema.source}\`](${sourceLink(schema.source)})`, "", `Stability: \`${schema.stability}\`. Source SHA-256: \`${schema.sha256}\`.`, "", "Validated example:", "", "```json", JSON.stringify(schema.example, null, 2), "```", "", "| JSON pointer | Required | Default | Deprecated | Access | Sensitivity | Constraint | Description and notes |", "| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const field of schema.fields) {
      const item = field.annotation;
      const defaultValue = item.default_status === "declared" ? JSON.stringify(item.default) : "none declared";
      lines.push(`| \`${escapeCell(field.pointer)}\` | ${field.required ? "yes" : "no"} | ${escapeCell(defaultValue)} | ${item.deprecated ? "yes" : "no"} | ${item.access} | ${item.sensitivity} | ${escapeCell(field.constraint)} | ${escapeCell(`${item.description} ${item.notes}`)} |`);
    }
    lines.push("");
  }

  lines.push("## Exclusions", "", ...manifest.exclusions.map(item => `- ${item}.`), "", "## Open Questions", "", "- Which candidate-internal exports will become the first supported public SDK?", "- Should descriptions live in validation schemas or a separately owned annotation registry?", "");
  return `${lines.join("\n")}\n`;
}

async function main() {
  const [mode = "--check"] = process.argv.slice(2);
  need(["--check", "--write"].includes(mode), "usage:generate-api-reference [--check|--write]");
  const generated = await generateApiReference();
  if (mode === "--write") {
    writeFileSync(outputPath, generated);
    process.stdout.write(`${JSON.stringify({status: "WROTE", path: outputPath, sha256: digest(generated), authority_effect: "none"})}\n`);
    return;
  }
  need(existsSync(outputPath), "api-reference.output-missing");
  need(readFileSync(outputPath, "utf8") === generated, "api-reference.output-drift");
  process.stdout.write(`${JSON.stringify({status: "PASS", path: outputPath, sha256: digest(generated), authority_effect: "none"})}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
