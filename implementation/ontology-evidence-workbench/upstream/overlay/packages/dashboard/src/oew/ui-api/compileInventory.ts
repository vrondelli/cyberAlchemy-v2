type JsonRecord = Record<string, unknown>;

export const OEW_UI_INVENTORY_SCHEMA = "oew.ui-api-inventory.v0.1";
export const OEW_UI_DESCRIPTION_CLAIM =
  "development-description-only-no-runtime-browser-release-or-ontology-proof";

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const canonical = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  throw new TypeError("OEW_UI_DESCRIPTION_NOT_JSON");
};

const sha256 = async (domain: string, value: unknown) => {
  if (!globalThis.crypto?.subtle) throw new TypeError("SHA256_UNAVAILABLE");
  const bytes = new TextEncoder().encode(`${domain}\0${canonical(value)}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizedDisposition = (value: unknown) =>
  String(value ?? "described-against-relation-reference-v1.3")
    .split("v1.2").join("v1.3")
    .replace("revalidate-against", "described-against");

export async function compileUiInventory(profileInput: unknown) {
  if (!isRecord(profileInput) || profileInput.schema_version !== "oew.ui-profile-snapshot.v0.1") {
    throw new TypeError("OEW_UI_PROFILE_SNAPSHOT_REQUIRED");
  }
  if (
    profileInput.status !== "development-only" ||
    profileInput.authority_effect !== "none" ||
    profileInput.release_admission !== "not-granted"
  ) {
    throw new TypeError("OEW_UI_PROFILE_AUTHORITY_LEAK");
  }
  if (!Array.isArray(profileInput.contract_seed)) {
    throw new TypeError("OEW_UI_CONTRACT_SEED_REQUIRED");
  }
  const formations = isRecord(profileInput.formation_digests)
    ? profileInput.formation_digests
    : {};
  const owners = isRecord(profileInput.realization_owners)
    ? profileInput.realization_owners
    : {};
  const records = profileInput.contract_seed.map((candidate) => {
    if (!isRecord(candidate)) throw new TypeError("OEW_UI_CONTRACT_INVALID");
    const contractId = String(candidate.contract_id ?? "");
    const metaType = String(candidate.meta_type ?? "");
    const ownerSwu = String(candidate.realization_swu ?? "");
    if (!contractId || !metaType || !ownerSwu) {
      throw new TypeError("OEW_UI_CONTRACT_IDENTITY_MISSING");
    }
    const realized = ownerSwu === "UOVARR-005";
    return Object.freeze({
      contract_id: contractId,
      meta_type: metaType,
      formation_digest: formations[metaType] ?? null,
      realization_swu: ownerSwu,
      realization_state: realized ? "described-and-validated" : "planned",
      runtime_claim: "none",
      realization_owner: realized ? owners[contractId] ?? null : null,
      disposition: normalizedDisposition(candidate.disposition),
      authority_effect: "none",
    });
  }).sort((left, right) => left.contract_id.localeCompare(right.contract_id));

  const byMetaType: Record<string, number> = {};
  const bySwu: Record<string, number> = {};
  for (const record of records) {
    byMetaType[record.meta_type] = (byMetaType[record.meta_type] ?? 0) + 1;
    bySwu[record.realization_swu] = (bySwu[record.realization_swu] ?? 0) + 1;
  }
  const basis = {
    schema_version: OEW_UI_INVENTORY_SCHEMA,
    inventory_id: "oew.unified-view.ui-description.v0.1",
    status: "development-only",
    authority_effect: "none",
    release_admission: "not-granted",
    runtime_cross_project_dependency: false,
    source_profile_digest: profileInput.source_profile_digest,
    profile_snapshot_digest: profileInput.snapshot_semantic_digest,
    relation_reference_contract: "oew.knowledge-scene.v1.3",
    counts: {
      total_contracts: records.length,
      ui_instances: records.filter((record) => record.meta_type !== "Mapping").length,
      mapping_specializations: records.filter((record) => record.meta_type === "Mapping").length,
      adapter_nodes: 0,
      general_state_indicator_nodes: 0,
      by_meta_type: byMetaType,
      by_realization_swu: bySwu,
    },
    relation_projection_contract: {
      binding_fields: ["ref", "relation_digest"],
      derived_fields: [
        "predicate",
        "endpoints",
        "source_direction",
        "traversal_phrase",
        "evidence_refs",
        "mapping_loss",
        "authority_effect",
        "display_cues"
      ],
      failure_policy: "reject-missing-stale-or-drifted-without-tuple-fallback"
    },
    records,
    claim_ceiling: OEW_UI_DESCRIPTION_CLAIM,
  };
  return Object.freeze({
    ...basis,
    inventory_digest: await sha256("oew/ui-api-inventory/v0.1", basis),
  });
}

export const serializeUiInventory = (inventory: unknown) =>
  `${JSON.stringify(inventory, null, 2)}\n`;
