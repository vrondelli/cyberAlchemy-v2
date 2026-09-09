import {
  compileUiInventory,
  OEW_UI_DESCRIPTION_CLAIM,
  OEW_UI_INVENTORY_SCHEMA,
} from "./compileInventory.ts";

type JsonRecord = Record<string, unknown>;

export class UiInventoryValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: readonly string[]) {
    const stable = [...new Set(issues)].sort();
    super(`OEW UI inventory invalid: ${stable.join(", ")}`);
    this.name = "UiInventoryValidationError";
    this.issues = Object.freeze(stable);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const EXPECTED_META_COUNTS = Object.freeze({
  Page: 1,
  Layout: 1,
  Component: 13,
  "View Model": 11,
  Hook: 6,
  Form: 1,
  Action: 10,
  Guard: 4,
  Binding: 5,
  Mapping: 6,
});
const EXPECTED_SWU_COUNTS = Object.freeze({
  "UOVARR-005": 19,
  "UOVARR-006": 36,
  "UOVARR-007": 1,
  "UOVARR-009": 2,
});

export async function validateUiInventory(inventory: unknown, profile: unknown) {
  const issues: string[] = [];
  if (!isRecord(inventory)) throw new UiInventoryValidationError(["INVENTORY_INVALID"]);
  if (inventory.schema_version !== OEW_UI_INVENTORY_SCHEMA) issues.push("SCHEMA_VERSION");
  if (
    inventory.status !== "development-only" ||
    inventory.authority_effect !== "none" ||
    inventory.release_admission !== "not-granted" ||
    inventory.runtime_cross_project_dependency !== false
  ) issues.push("AUTHORITY_OR_RUNTIME_BOUNDARY");
  if (inventory.claim_ceiling !== OEW_UI_DESCRIPTION_CLAIM) issues.push("CLAIM_CEILING");
  if (!Array.isArray(inventory.records)) issues.push("RECORDS_INVALID");
  const records = Array.isArray(inventory.records) ? inventory.records : [];
  const ids = records.map((record) => isRecord(record) ? record.contract_id : null);
  if (records.length !== 58) issues.push("TOTAL_COUNT");
  if (new Set(ids).size !== ids.length || ids.some((id) => typeof id !== "string")) {
    issues.push("CONTRACT_ID_UNIQUE");
  }
  const counts = isRecord(inventory.counts) ? inventory.counts : {};
  const meta = isRecord(counts.by_meta_type) ? counts.by_meta_type : {};
  const swus = isRecord(counts.by_realization_swu) ? counts.by_realization_swu : {};
  for (const [name, expected] of Object.entries(EXPECTED_META_COUNTS)) {
    if (meta[name] !== expected) issues.push(`META_COUNT:${name}`);
  }
  for (const [name, expected] of Object.entries(EXPECTED_SWU_COUNTS)) {
    if (swus[name] !== expected) issues.push(`SWU_COUNT:${name}`);
  }
  if (
    counts.ui_instances !== 52 ||
    counts.mapping_specializations !== 6 ||
    counts.adapter_nodes !== 0 ||
    counts.general_state_indicator_nodes !== 0
  ) issues.push("SPECIAL_DISPOSITION_COUNT");

  for (const [index, value] of records.entries()) {
    if (!isRecord(value)) {
      issues.push(`RECORD_INVALID:${index}`);
      continue;
    }
    if (value.authority_effect !== "none" || value.runtime_claim !== "none") {
      issues.push(`RECORD_AUTHORITY_LEAK:${index}`);
    }
    if (String(value.disposition).includes("v1.2")) issues.push(`LEGACY_REFERENCE:${index}`);
    if (value.realization_swu === "UOVARR-005") {
      if (value.realization_state !== "described-and-validated" || value.realization_owner === null) {
        issues.push(`CURRENT_REALIZATION_INVALID:${index}`);
      }
    } else if (value.realization_state !== "planned" || value.realization_owner !== null) {
      issues.push(`FUTURE_REALIZATION_OVERCLAIM:${index}`);
    }
    if (typeof value.formation_digest !== "string" || !/^[a-f0-9]{64}$/.test(value.formation_digest)) {
      issues.push(`FORMATION_DIGEST:${index}`);
    }
  }
  const serialized = JSON.stringify(inventory);
  if (serialized.includes("projects/domainspec-v2/")) issues.push("RUNTIME_FORBIDDEN_PREFIX");
  const expected = await compileUiInventory(profile);
  if (JSON.stringify(expected) !== JSON.stringify(inventory)) issues.push("NON_DETERMINISTIC_OUTPUT");
  if (issues.length > 0) throw new UiInventoryValidationError(issues);
  return Object.freeze({
    result: "pass",
    contracts: records.length,
    current_realizations: swus["UOVARR-005"],
    planned_successors: records.length - Number(swus["UOVARR-005"] ?? 0),
    inventory_digest: inventory.inventory_digest,
    authority_effect: "none",
  });
}
