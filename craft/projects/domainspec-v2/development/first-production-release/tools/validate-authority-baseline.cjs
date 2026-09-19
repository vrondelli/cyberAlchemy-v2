#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const FPR_ROOT = path.resolve(__dirname, "..");
const PROJECT_ROOT = path.resolve(FPR_ROOT, "../..");
const ALLOWED_DISPOSITIONS = new Set([
  "authoritative",
  "generated-projection",
  "historical",
  "superseded",
  "deferred",
  "repair-required",
]);
const EXPECTED_DISAGREEMENTS = Array.from(
  { length: 12 },
  (_, index) => `FPR01-D${String(index + 1).padStart(3, "0")}`,
);
const ERROR_EXIT = {
  E_PARSE: 2,
  E_SCHEMA: 3,
  E_INPUT_DIGEST: 4,
  E_PACKET: 5,
  E_COUNT: 21,
  E_SOURCE_PATH: 22,
  E_STATUS: 23,
  E_OWNER: 24,
  E_DIRECTION: 25,
  E_AUTHORITY: 26,
  E_LIVE_COUNT: 30,
  E_LIVE_STATUS: 31,
  E_LIVE_SOURCE_PATH: 32,
  E_FIXTURE: 40,
};

main();

function main() {
  try {
    const args = process.argv.slice(2);
    const baselinePath = path.resolve(
      process.cwd(),
      argValue(args, "--baseline") || path.join(FPR_ROOT, "authority-baseline.yml"),
    );
    const baseline = readJsonSyntax(baselinePath, "baseline");
    const fixtureArg = argValue(args, "--fixture");
    const mutantsArg = argValue(args, "--mutants");

    if (fixtureArg && mutantsArg) {
      failTop("E_FIXTURE", "--fixture and --mutants are mutually exclusive");
    }

    if (fixtureArg) {
      const fixturePath = path.resolve(process.cwd(), fixtureArg);
      const fixture = readJsonSyntax(fixturePath, "fixture");
      const candidate = applyPatches(structuredClone(baseline), fixture.patches, fixture.fixture_id);
      const validation = validateCandidate(candidate, baselinePath);
      const observedCodes = unique(validation.errors.map((error) => error.code));
      const killed = observedCodes.includes(fixture.expected_code);
      const report = finalizeReport({
        schema_version: "authority-baseline-validation/v1",
        mode: "fixture",
        baseline: relativeToCwd(baselinePath),
        fixture: relativeToCwd(fixturePath),
        fixture_id: fixture.fixture_id,
        expected_code: fixture.expected_code,
        observed_codes: observedCodes,
        errors: validation.errors,
        result: killed ? "REJECTED" : "SURVIVED",
      });
      process.stdout.write(`${stableStringify(report)}\n`);
      process.exit(killed ? (ERROR_EXIT[fixture.expected_code] || 1) : ERROR_EXIT.E_FIXTURE);
    }

    if (mutantsArg) {
      const mutantsDir = path.resolve(process.cwd(), mutantsArg);
      const positive = validateCandidate(baseline, baselinePath);
      const fixturePaths = fs
        .readdirSync(mutantsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => path.join(mutantsDir, entry.name))
        .sort();
      if (fixturePaths.length === 0) failTop("E_FIXTURE", `no JSON fixtures under ${relativeToCwd(mutantsDir)}`);
      const mutants = fixturePaths.map((fixturePath) => {
        const fixture = readJsonSyntax(fixturePath, "fixture");
        const candidate = applyPatches(structuredClone(baseline), fixture.patches, fixture.fixture_id);
        const validation = validateCandidate(candidate, baselinePath);
        const observedCodes = unique(validation.errors.map((error) => error.code));
        return {
          fixture_id: fixture.fixture_id,
          expected_code: fixture.expected_code,
          observed_codes: observedCodes,
          killed: observedCodes.includes(fixture.expected_code),
        };
      });
      const allKilled = mutants.every((mutant) => mutant.killed);
      const report = finalizeReport({
        schema_version: "authority-baseline-validation/v1",
        mode: "suite",
        baseline: relativeToCwd(baselinePath),
        positive: {
          result: positive.errors.length === 0 ? "PASS" : "FAIL",
          errors: positive.errors,
          observed: positive.observed,
        },
        mutants,
        result: positive.errors.length === 0 && allKilled ? "PASS" : "FAIL",
      });
      process.stdout.write(`${stableStringify(report)}\n`);
      process.exit(report.result === "PASS" ? 0 : 1);
    }

    const validation = validateCandidate(baseline, baselinePath);
    const report = finalizeReport({
      schema_version: "authority-baseline-validation/v1",
      mode: "positive",
      baseline: relativeToCwd(baselinePath),
      errors: validation.errors,
      observed: validation.observed,
      result: validation.errors.length === 0 ? "PASS" : "FAIL",
    });
    process.stdout.write(`${stableStringify(report)}\n`);
    const firstCode = validation.errors[0]?.code;
    process.exit(firstCode ? (ERROR_EXIT[firstCode] || 1) : 0);
  } catch (error) {
    const code = error && typeof error.code === "string" ? error.code : "E_PARSE";
    const report = finalizeReport({
      schema_version: "authority-baseline-validation/v1",
      mode: "fatal",
      errors: [{ code, path: "$", message: error instanceof Error ? error.message : String(error) }],
      result: "FAIL",
    });
    process.stdout.write(`${stableStringify(report)}\n`);
    process.exit(ERROR_EXIT[code] || 2);
  }
}

function validateCandidate(candidate, baselinePath) {
  const errors = [];
  const observed = {};
  const add = (code, fieldPath, message) => errors.push({ code, path: fieldPath, message });

  validatePortableSchema(candidate, baselinePath, add);
  validateFixedContract(candidate, add);

  const packet = loadBoundPacket(candidate, add);
  if (packet) validatePacketAlignment(candidate, packet, add);

  validateLiveSources(candidate, add, observed);
  errors.sort(compareErrors);
  return { errors, observed };
}

function validatePortableSchema(candidate, baselinePath, add) {
  const schemaRef = candidate && typeof candidate.$schema === "string" ? candidate.$schema : "";
  if (schemaRef !== "schemas/authority-baseline.schema.json") {
    add("E_SCHEMA", "/$schema", "baseline must reference schemas/authority-baseline.schema.json");
    return;
  }
  const schemaPath = path.resolve(path.dirname(baselinePath), schemaRef);
  let schema;
  try {
    schema = readJsonSyntax(schemaPath, "schema");
  } catch (error) {
    add("E_SCHEMA", "/$schema", error.message);
    return;
  }
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    add("E_SCHEMA", "/$schema", "portable schema must declare JSON Schema 2020-12");
  }
  if (!Array.isArray(schema.required) || !schema.required.includes("authority_boundary")) {
    add("E_SCHEMA", "/$schema", "portable schema does not require the authority boundary");
  }

  const requiredObjects = [
    "inputs",
    "meta_types",
    "relationships",
    "source_homes",
    "direction_dependency",
    "authority_boundary",
  ];
  for (const key of requiredObjects) {
    if (!candidate || !isObject(candidate[key])) add("E_SCHEMA", `/${key}`, `${key} must be an object`);
  }
  if (!Array.isArray(candidate?.disagreement_resolutions)) {
    add("E_SCHEMA", "/disagreement_resolutions", "disagreement_resolutions must be an array");
  }
  if (!Array.isArray(candidate?.repair_requirements)) {
    add("E_SCHEMA", "/repair_requirements", "repair_requirements must be an array");
  }
}

function validateFixedContract(candidate, add) {
  if (candidate.schema_version !== "authority-baseline/v1") add("E_SCHEMA", "/schema_version", "unexpected schema version");
  if (candidate.task_id !== "SWU-FPR01-003") add("E_SCHEMA", "/task_id", "baseline belongs to another task");
  if (candidate.status !== "validation-candidate") add("E_STATUS", "/status", "baseline must remain an unratified validation-candidate");

  const meta = candidate.meta_types || {};
  const backend = meta.backend || {};
  const ui = meta.ui || {};
  const uiCandidate = ui.candidate || {};
  const uiDeferred = Array.isArray(ui.deferred) ? ui.deferred : [];
  const superseded = Array.isArray(meta.superseded) ? meta.superseded : [];
  const rel = candidate.relationships || {};
  const homes = candidate.source_homes || {};

  if (meta.authority_path !== "definitions/meta-types/meta-types.yml") add("E_SOURCE_PATH", "/meta_types/authority_path", "meta-type authority path is stale or unknown");
  if (rel.authority_path !== "definitions/relationships/relationships.yml") add("E_SOURCE_PATH", "/relationships/authority_path", "relationship authority path is stale or unknown");
  if (homes.definitions?.authority_path !== "definitions/") add("E_SOURCE_PATH", "/source_homes/definitions/authority_path", "definitions authority must be the root definitions directory");
  if (homes.definitions?.rejected_path !== "impl/spec/DEFINITIONS.md") add("E_SOURCE_PATH", "/source_homes/definitions/rejected_path", "the superseded implementation definitions path must remain explicit");
  if (homes.legacy_taxonomy?.path !== "impl/spec/TAXONOMY.md") add("E_SOURCE_PATH", "/source_homes/legacy_taxonomy/path", "taxonomy residue path mismatch");

  if (meta.registry_status !== "active") add("E_STATUS", "/meta_types/registry_status", "approved registry status is active");
  if (backend.status !== "active") add("E_STATUS", "/meta_types/backend/status", "approved backend maturity is active");
  if (uiCandidate.status !== "candidate") add("E_STATUS", "/meta_types/ui/candidate/status", "approved UI schema-ready maturity is candidate");
  const adapter = uiDeferred.find((entry) => entry?.id === "DS-D1.24");
  const indicator = uiDeferred.find((entry) => entry?.id === "DS-D1.25");
  if (adapter?.status !== "deferred/merge-candidate") add("E_STATUS", "/meta_types/ui/deferred/DS-D1.24", "Adapter must remain a deferred merge-candidate");
  if (indicator?.status !== "deferred/split-candidate") add("E_STATUS", "/meta_types/ui/deferred/DS-D1.25", "State Indicator must remain a deferred split-candidate");
  if (superseded.length !== 1 || superseded[0]?.id !== "DS-D1.10" || superseded[0]?.status !== "superseded") {
    add("E_STATUS", "/meta_types/superseded", "the DS-D1.10 retired gap must remain explicitly superseded");
  }
  if (rel.registry_status !== "active") add("E_STATUS", "/relationships/registry_status", "relationship registry status must be active");
  if (homes.legacy_taxonomy?.authority !== false || homes.legacy_taxonomy?.disposition !== "retire-after-migration") {
    add("E_AUTHORITY", "/source_homes/legacy_taxonomy", "legacy taxonomy must be non-authority pending conditional retirement");
  }
  if (homes.definitions?.rejected_path_disposition !== "superseded") {
    add("E_AUTHORITY", "/source_homes/definitions/rejected_path_disposition", "the absent implementation definitions destination is superseded");
  }

  const expectedBackend = [
    "DS-D1.1", "DS-D1.2", "DS-D1.3", "DS-D1.4", "DS-D1.5", "DS-D1.6", "DS-D1.7",
    "DS-D1.8", "DS-D1.9", "DS-D1.11", "DS-D1.12", "DS-D1.13", "DS-D1.14",
  ];
  const expectedUi = Array.from({ length: 9 }, (_, index) => `DS-D1.${index + 15}`);
  if (backend.count !== 13 || !sameUniqueSet(backend.ids, expectedBackend)) add("E_COUNT", "/meta_types/backend", "backend IDs must be the exact non-contiguous 13-member set");
  if (uiCandidate.count !== 9 || !sameUniqueSet(uiCandidate.ids, expectedUi)) add("E_COUNT", "/meta_types/ui/candidate", "UI candidate IDs must be DS-D1.15 through DS-D1.23");
  const stagedIds = [...(backend.ids || []), ...(uiCandidate.ids || []), ...uiDeferred.map((entry) => entry.id)];
  if (meta.staged_labels?.count !== 24 || meta.staged_labels?.contiguous !== false || unique(stagedIds).length !== 24 || stagedIds.includes("DS-D1.10")) {
    add("E_COUNT", "/meta_types/staged_labels", "staged labels must be 24 unique non-contiguous IDs excluding DS-D1.10");
  }
  if (rel.declared_count !== 30 || rel.record_count !== 30 || rel.active_count !== 30) add("E_COUNT", "/relationships", "relationship declared, record, and active counts must all equal 30");
  if (rel.category_wording !== "typed composable graph fragment") add("E_STATUS", "/relationships/category_wording", "relationship category wording exceeds or contradicts the bounded owner decision");

  if (candidate.direction_dependency?.target !== "FPR-03" || candidate.direction_dependency?.disposition !== "deferred") {
    add("E_DIRECTION", "/direction_dependency", "business-plane-to-Spec direction must remain deferred to FPR-03");
  }
  if (!nonempty(candidate.direction_dependency?.owner)) add("E_OWNER", "/direction_dependency/owner", "direction dependency requires an owner route");

  const resolutions = Array.isArray(candidate.disagreement_resolutions) ? candidate.disagreement_resolutions : [];
  if (!sameUniqueSet(resolutions.map((row) => row?.id), EXPECTED_DISAGREEMENTS)) add("E_COUNT", "/disagreement_resolutions", "baseline must contain exactly FPR01-D001 through FPR01-D012");
  for (const [index, row] of resolutions.entries()) {
    if (!nonempty(row?.owner)) add("E_OWNER", `/disagreement_resolutions/${index}/owner`, `${row?.id || "resolution"} requires an owner`);
    if (!ALLOWED_DISPOSITIONS.has(row?.disposition)) add("E_STATUS", `/disagreement_resolutions/${index}/disposition`, `${row?.id || "resolution"} has an unknown disposition`);
  }
  for (const [index, row] of (candidate.repair_requirements || []).entries()) {
    if (!nonempty(row?.owner)) add("E_OWNER", `/repair_requirements/${index}/owner`, `${row?.id || "repair"} requires an owner`);
    if (!nonempty(row?.target)) add("E_SCHEMA", `/repair_requirements/${index}/target`, `${row?.id || "repair"} requires a target`);
  }

  const boundary = candidate.authority_boundary || {};
  for (const key of [
    "authority_surfaces_mutated",
    "fpr_01_ratified",
    "fpr_01_complete",
    "fpr01_004_execution_authorized",
    "fpr_02_entry_authorized",
    "production_authorized",
  ]) {
    if (boundary[key] !== false) add("E_AUTHORITY", `/authority_boundary/${key}`, `${key} must remain false`);
  }
}

function loadBoundPacket(candidate, add) {
  const inputs = candidate.inputs || {};
  for (const name of ["predecessor_receipt", "census", "dispositions", "decision"]) {
    const ref = inputs[name];
    if (!ref || !nonempty(ref.path) || !/^[a-f0-9]{64}$/.test(ref.sha256 || "")) {
      add("E_SCHEMA", `/inputs/${name}`, `${name} must have a relative path and SHA-256`);
      continue;
    }
    let filePath;
    try {
      filePath = resolveContained(FPR_ROOT, ref.path);
    } catch (error) {
      add("E_SOURCE_PATH", `/inputs/${name}/path`, error.message);
      continue;
    }
    if (!fs.existsSync(filePath)) {
      add("E_SOURCE_PATH", `/inputs/${name}/path`, `${name} path does not exist`);
      continue;
    }
    const actual = sha256(fs.readFileSync(filePath));
    if (actual !== ref.sha256) add("E_INPUT_DIGEST", `/inputs/${name}/sha256`, `${name} digest mismatch`);
  }
  const dispositionRef = inputs.dispositions;
  if (!dispositionRef || !nonempty(dispositionRef.path)) return null;
  try {
    return readJsonSyntax(resolveContained(FPR_ROOT, dispositionRef.path), "disposition packet");
  } catch (error) {
    add("E_PACKET", "/inputs/dispositions", error.message);
    return null;
  }
}

function validatePacketAlignment(candidate, packet, add) {
  if (packet.task_id !== "SWU-FPR01-002" || packet.status !== "approved") add("E_PACKET", "/inputs/dispositions", "bound packet is not the approved FPR01-002 packet");
  const packetRows = new Map((packet.disagreements || []).map((row) => [row.disagreement_id, row]));
  const resolutions = new Map((candidate.disagreement_resolutions || []).map((row) => [row.id, row]));
  for (const id of EXPECTED_DISAGREEMENTS) {
    const packetRow = packetRows.get(id);
    const resolution = resolutions.get(id);
    if (!packetRow || !resolution) continue;
    if (resolution.disposition !== packetRow.disposition) add("E_PACKET", `/disagreement_resolutions/${id}/disposition`, `${id} disposition differs from the approved packet`);
    if (resolution.owner !== packetRow.owner) add("E_OWNER", `/disagreement_resolutions/${id}/owner`, `${id} owner differs from the approved packet`);
  }

  const d001 = packetRows.get("FPR01-D001")?.selected_value || {};
  const d002 = packetRows.get("FPR01-D002")?.selected_value || {};
  const d003 = packetRows.get("FPR01-D003")?.selected_value || {};
  const d004 = packetRows.get("FPR01-D004")?.selected_value || {};
  const d007 = packetRows.get("FPR01-D007")?.selected_value || {};
  const d012 = String(packetRows.get("FPR01-D012")?.selected_value || "");
  const packetBackendIds = expandIdRanges(d001.active_ids || "");
  if (candidate.meta_types?.backend?.count !== d001.active_backend_count || !sameUniqueSet(candidate.meta_types?.backend?.ids, packetBackendIds)) add("E_PACKET", "/meta_types/backend", "backend baseline differs from FPR01-D001");
  if (candidate.meta_types?.staged_labels?.count !== d002.staged_label_count || candidate.meta_types?.staged_labels?.contiguous !== d002.contiguous_range) add("E_PACKET", "/meta_types/staged_labels", "staged-label baseline differs from FPR01-D002");
  if (candidate.meta_types?.backend?.status !== d003.backend || candidate.meta_types?.ui?.candidate?.status !== d003.ui_DS_D1_15_through_23) add("E_PACKET", "/meta_types", "maturity baseline differs from FPR01-D003");
  if (candidate.relationships?.declared_count !== d004.declared_signature_count || candidate.relationships?.record_count !== d004.record_count || candidate.relationships?.active_count !== d004.active_signature_count) add("E_PACKET", "/relationships", "relationship baseline differs from FPR01-D004");
  if (candidate.source_homes?.consumer_project_manifest !== d007.project_manifest || candidate.source_homes?.feature_manifest_pattern !== d007.feature_manifest || candidate.source_homes?.node_source_pattern !== d007.node_sources || candidate.source_homes?.connection_ownership !== d007.connection_ownership) add("E_PACKET", "/source_homes", "source-home baseline differs from FPR01-D007");
  if (!d012.includes(candidate.relationships?.category_wording || "") || !d012.includes("thirty")) add("E_PACKET", "/relationships/category_wording", "composability wording differs from FPR01-D012");

  const boundary = packet.authority_boundary || {};
  if (boundary.authority_surfaces_mutated !== false || boundary.production_authorized !== false || boundary.fpr_01_complete !== false || boundary.next_swu_execution_authorized !== false || packet.handoff?.production_authorized !== false) {
    add("E_AUTHORITY", "/inputs/dispositions/authority_boundary", "approved packet authority boundary is not closed");
  }
  if (packet.direction_dependency?.disposition !== "deferred" || packet.direction_dependency?.target !== "FPR-03") add("E_DIRECTION", "/inputs/dispositions/direction_dependency", "packet direction dependency is not deferred to FPR-03");
}

function validateLiveSources(candidate, add, observed) {
  const metaPath = safeProjectPath(candidate.meta_types?.authority_path, "/meta_types/authority_path", add);
  const relationshipPath = safeProjectPath(candidate.relationships?.authority_path, "/relationships/authority_path", add);

  if (metaPath && fs.existsSync(metaPath)) {
    const raw = fs.readFileSync(metaPath, "utf8");
    const live = parseMetaRegistry(raw);
    observed.meta_types = live;
    const expectedIds = candidate.meta_types?.backend?.ids || [];
    if (live.scheme !== candidate.meta_types?.scheme) add("E_LIVE_STATUS", "/live/meta_types/scheme", `live scheme is ${live.scheme || "missing"}`);
    if (live.catalog.total_candidates !== candidate.meta_types?.staged_labels?.count || live.catalog.registered_backend_members !== candidate.meta_types?.backend?.count || live.catalog.deferred_ui_candidates !== 11) add("E_LIVE_COUNT", "/live/meta_types/catalog", "live meta-type catalog counts differ from the approved 13/24 partition");
    if (!sameUniqueSet(live.members.map((member) => member.id), expectedIds)) add("E_LIVE_COUNT", "/live/meta_types/members", "live backend member IDs differ from the approved non-contiguous set");
    if (live.status !== "active") add("E_LIVE_STATUS", "/live/meta_types/status", `live registry status is ${live.status || "missing"}, expected active`);
    if (live.backend_status !== "active") add("E_LIVE_STATUS", "/live/meta_types/maturity/backend/status", `live backend maturity is ${live.backend_status || "missing"}, expected active`);
    const inactive = live.members.filter((member) => member.status !== "active").map((member) => `${member.id}:${member.status || "missing"}`);
    if (inactive.length) add("E_LIVE_STATUS", "/live/meta_types/members/status", `non-active backend members: ${inactive.join(",")}`);
    const differentiatedUi = uiMaturityIsDifferentiated(raw, candidate.meta_types?.ui || {});
    if (!differentiatedUi) add("E_LIVE_STATUS", "/live/meta_types/maturity/ui", `live UI maturity remains ${live.ui_status || "undifferentiated"}; expected nine candidates plus two distinct deferred states`);
    if (!raw.includes("DS-D1.10") || !raw.includes("superseded")) add("E_LIVE_STATUS", "/live/meta_types/superseded", "live machine registry does not encode the superseded DS-D1.10 gap");
  } else if (metaPath) {
    add("E_SOURCE_PATH", "/live/meta_types", "meta-type authority path does not exist");
  }

  if (relationshipPath && fs.existsSync(relationshipPath)) {
    try {
      const live = JSON.parse(fs.readFileSync(relationshipPath, "utf8"));
      const signatures = Array.isArray(live.signatures) ? live.signatures : [];
      const active = signatures.filter((signature) => signature.status === "active");
      const uniqueIds = unique(signatures.map((signature) => signature.id));
      observed.relationships = {
        status: live.status,
        declared_count: live.signature_count,
        record_count: signatures.length,
        active_count: active.length,
        unique_count: uniqueIds.length,
        category_wording: live.category_wording,
      };
      if (live.signature_count !== candidate.relationships?.declared_count || signatures.length !== candidate.relationships?.record_count || active.length !== candidate.relationships?.active_count || uniqueIds.length !== signatures.length) add("E_LIVE_COUNT", "/live/relationships", "live relationship declared, record, active, or unique counts differ from baseline");
      if (live.status !== candidate.relationships?.registry_status || live.category_wording !== candidate.relationships?.category_wording) add("E_LIVE_STATUS", "/live/relationships", "live relationship status or category wording differs from baseline");
    } catch (error) {
      add("E_PARSE", "/live/relationships", `relationship registry is not JSON-compatible YAML: ${error.message}`);
    }
  } else if (relationshipPath) {
    add("E_SOURCE_PATH", "/live/relationships", "relationship authority path does not exist");
  }

  const rejectedDefinitions = safeProjectPath(candidate.source_homes?.definitions?.rejected_path, "/source_homes/definitions/rejected_path", add);
  if (rejectedDefinitions && fs.existsSync(rejectedDefinitions)) add("E_LIVE_SOURCE_PATH", "/live/source_homes/definitions", "superseded impl/spec/DEFINITIONS.md exists and could be mistaken for authority");
}

function parseMetaRegistry(raw) {
  const lines = raw.split(/\r?\n/);
  const members = [];
  let member = null;
  for (const line of lines) {
    const id = line.match(/^  - id:\s*(\S+)\s*$/);
    if (id) {
      if (member) members.push(member);
      member = { id: unquote(id[1]), status: null };
      continue;
    }
    const status = line.match(/^    status:\s*(.+?)\s*$/);
    if (member && status && member.status === null) member.status = unquote(status[1]);
  }
  if (member) members.push(member);
  const backendSection = section(raw, /^  backend:\s*$/m, /^  ui:\s*$/m);
  const uiSection = section(raw, /^  ui:\s*$/m, /^members:\s*$/m);
  return {
    scheme: scalar(raw, /^scheme:\s*(.+?)\s*$/m),
    status: scalar(raw, /^status:\s*(.+?)\s*$/m),
    catalog: {
      total_candidates: integer(raw, /^  total_candidates:\s*(\d+)\s*$/m),
      registered_backend_members: integer(raw, /^  registered_backend_members:\s*(\d+)\s*$/m),
      deferred_ui_candidates: integer(raw, /^  deferred_ui_candidates:\s*(\d+)\s*$/m),
    },
    backend_status: scalar(backendSection, /^    status:\s*(.+?)\s*$/m),
    ui_status: scalar(uiSection, /^    status:\s*(.+?)\s*$/m),
    members,
  };
}

function uiMaturityIsDifferentiated(raw, ui) {
  const candidateIds = ui.candidate?.ids || [];
  const deferred = ui.deferred || [];
  const hasCandidateRange = raw.includes("DS-D1.15..23") || candidateIds.every((id) => raw.includes(id));
  const hasCandidateStatus = raw.includes("candidate");
  const hasDeferred = deferred.every((entry) => raw.includes(entry.id) && raw.includes(entry.status));
  return hasCandidateRange && hasCandidateStatus && hasDeferred;
}

function safeProjectPath(relativePath, fieldPath, add) {
  if (!nonempty(relativePath)) return null;
  try {
    return resolveContained(PROJECT_ROOT, relativePath);
  } catch (error) {
    add("E_SOURCE_PATH", fieldPath, error.message);
    return null;
  }
}

function resolveContained(root, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error("absolute paths are forbidden");
  const resolved = path.resolve(root, relativePath);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("path escapes its governed root");
  return resolved;
}

function applyPatches(target, patches, fixtureId) {
  if (!Array.isArray(patches) || patches.length === 0) failTop("E_FIXTURE", `${fixtureId || "fixture"} has no patches`);
  for (const patchEntry of patches) {
    if (patchEntry?.op !== "replace" || typeof patchEntry.path !== "string" || !patchEntry.path.startsWith("/")) {
      failTop("E_FIXTURE", `${fixtureId || "fixture"} has an unsupported patch`);
    }
    const segments = patchEntry.path
      .slice(1)
      .split("/")
      .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
    let cursor = target;
    for (const segment of segments.slice(0, -1)) {
      if (cursor === null || typeof cursor !== "object" || !(segment in cursor)) failTop("E_FIXTURE", `${fixtureId || "fixture"} patch path does not exist: ${patchEntry.path}`);
      cursor = cursor[segment];
    }
    const finalSegment = segments.at(-1);
    if (cursor === null || typeof cursor !== "object" || !(finalSegment in cursor)) failTop("E_FIXTURE", `${fixtureId || "fixture"} patch path does not exist: ${patchEntry.path}`);
    cursor[finalSegment] = patchEntry.value;
  }
  return target;
}

function expandIdRanges(expression) {
  const ids = [];
  for (const token of String(expression).split(",").map((part) => part.trim()).filter(Boolean)) {
    const range = token.match(/^(DS-D1\.)(\d+)\.\.(\d+)$/);
    if (range) {
      for (let value = Number(range[2]); value <= Number(range[3]); value += 1) ids.push(`${range[1]}${value}`);
    } else {
      ids.push(token);
    }
  }
  return ids;
}

function readJsonSyntax(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const wrapped = new Error(`${label} is not valid JSON-compatible YAML at ${relativeToCwd(filePath)}: ${error.message}`);
    wrapped.code = "E_PARSE";
    throw wrapped;
  }
}

function argValue(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) failTop("E_PARSE", `${name} requires a value`);
  return value;
}

function failTop(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function finalizeReport(report) {
  return { ...report, normalized_sha256: sha256(Buffer.from(stableStringify(report))) };
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function relativeToCwd(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/") || ".";
}

function compareErrors(left, right) {
  return left.code.localeCompare(right.code) || left.path.localeCompare(right.path) || left.message.localeCompare(right.message);
}

function sameUniqueSet(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length || unique(actual).length !== actual.length) return false;
  const set = new Set(actual);
  return expected.every((value) => set.has(value));
}

function unique(values) {
  return [...new Set(values)];
}

function nonempty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function scalar(raw, expression) {
  const match = String(raw).match(expression);
  return match ? unquote(match[1].trim()) : null;
}

function integer(raw, expression) {
  const value = scalar(raw, expression);
  return value === null ? null : Number(value);
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1);
  return value;
}

function section(raw, startExpression, endExpression) {
  const start = raw.search(startExpression);
  if (start < 0) return "";
  const tail = raw.slice(start);
  const end = tail.slice(1).search(endExpression);
  return end < 0 ? tail : tail.slice(0, end + 1);
}
