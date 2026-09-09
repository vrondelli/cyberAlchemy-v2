export type RelationProjectionAdapter = Readonly<{
  resolveRelationRef: (scene: unknown, ref: RelationRef) => RelationResolution;
  computeRelationDigest: (facet: Readonly<Record<string, unknown>>) => Promise<string>;
}>;

export type RelationRef = Readonly<{
  source_relation_id: string;
  scene_digest: string;
}>;

type RelationResolution = Readonly<{
  status: string;
  ref: RelationRef;
  facet?: Readonly<Record<string, unknown>>;
}>;

type JsonRecord = Record<string, unknown>;

export class RelationViewModelError extends Error {
  readonly code = "OEW_RELATION_VIEW_MODEL_REJECTED";
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    const stable = [...new Set(issues)].sort();
    super(`${stable.join(", ")}`);
    this.name = "RelationViewModelError";
    this.issues = Object.freeze(stable);
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

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
  throw new RelationViewModelError(["COPIED_FIELD_NOT_JSON"]);
};

const semanticFields = (facet: Readonly<JsonRecord>) => Object.freeze({
  predicate: facet.exact_predicate ?? null,
  endpoints: Object.freeze({
    source_node_id: facet.source_node_id ?? null,
    target_node_id: facet.target_node_id ?? null,
  }),
  source_direction: facet.source_direction ?? null,
  traversal_phrase: facet.direction_label ?? facet.visible_label ?? facet.exact_predicate ?? null,
  evidence_refs: Object.freeze([...(Array.isArray(facet.evidence_refs) ? facet.evidence_refs : [])]),
  mapping_loss: facet.mapping_loss ?? null,
  authority_effect: facet.authority_effect ?? "none",
  display_cues: Object.freeze({
    presentation_family: facet.presentation_family ?? null,
    color_token: facet.color_token ?? null,
    pattern_token: facet.pattern_token ?? null,
    visible_label: facet.visible_label ?? facet.exact_predicate ?? null,
  }),
});

const assertCopiedFields = (
  copied: unknown,
  derived: Readonly<JsonRecord>,
) => {
  if (copied === undefined) return;
  if (!isRecord(copied)) throw new RelationViewModelError(["COPIED_FIELDS_INVALID"]);
  for (const [key, value] of Object.entries(copied)) {
    if (!hasOwn(derived, key) || canonical(derived[key]) !== canonical(value)) {
      throw new RelationViewModelError([`COPIED_FIELD_DRIFT:${key}`]);
    }
  }
};

export async function deriveRelationViewModel(
  scene: unknown,
  ref: RelationRef,
  adapter: RelationProjectionAdapter,
  copiedFields?: unknown,
) {
  const resolution = adapter.resolveRelationRef(scene, ref);
  if (resolution.status !== "resolved" || !resolution.facet) {
    throw new RelationViewModelError([`RELATION_REFERENCE_${resolution.status.toUpperCase()}`]);
  }
  const fields = semanticFields(resolution.facet);
  assertCopiedFields(copiedFields, fields);
  return Object.freeze({
    ref: Object.freeze({...resolution.ref}),
    relation_digest: await adapter.computeRelationDigest(resolution.facet),
    ...fields,
  });
}

export async function derivePortalViewModel(
  scene: unknown,
  portal: Readonly<JsonRecord>,
  adapter: RelationProjectionAdapter,
) {
  const constituents = Array.isArray(portal.constituents) ? portal.constituents : [];
  return Object.freeze({
    portal_id: portal.portal_id ?? null,
    destination_cluster_id: portal.destination_cluster_id ?? null,
    constituents: Object.freeze(await Promise.all(constituents.map(async (value) => {
      if (!isRecord(value) || !isRecord(value.relation_ref)) {
        throw new RelationViewModelError(["PORTAL_RELATION_REFERENCE_INVALID"]);
      }
      return Object.freeze({
        traversal_direction: value.traversal_direction ?? null,
        relation: await deriveRelationViewModel(
          scene,
          value.relation_ref as RelationRef,
          adapter,
          value.relation_projection,
        ),
      });
    }))),
  });
}

export async function derivePathViewModel(
  scene: unknown,
  path: Readonly<JsonRecord>,
  adapter: RelationProjectionAdapter,
) {
  const hops = Array.isArray(path.hops) ? path.hops : [];
  return Object.freeze({
    path_id: path.path_id ?? null,
    hops: Object.freeze(await Promise.all(hops.map(async (value, index) => {
      if (!isRecord(value) || !isRecord(value.relation_ref)) {
        throw new RelationViewModelError([`PATH_RELATION_REFERENCE_INVALID:${index}`]);
      }
      return Object.freeze({
        hop_index: index,
        traversal_direction: value.traversal_direction ?? null,
        relation: await deriveRelationViewModel(
          scene,
          value.relation_ref as RelationRef,
          adapter,
          value.relation_projection,
        ),
      });
    }))),
  });
}

export const deriveInspectorViewModel = deriveRelationViewModel;
export const deriveIndexRelationRow = deriveRelationViewModel;

export function assertRelationConsumersSynchronized(
  consumers: readonly Readonly<JsonRecord>[],
) {
  if (consumers.length === 0) return true;
  const first = consumers[0];
  if (!isRecord(first?.ref)) {
    throw new RelationViewModelError(["CONSUMER_REFERENCE_MISSING"]);
  }
  const binding = canonical({ref: first.ref, relation_digest: first.relation_digest});
  for (const [index, consumer] of consumers.entries()) {
    if (!isRecord(consumer?.ref)) {
      throw new RelationViewModelError([`CONSUMER_REFERENCE_MISSING:${index}`]);
    }
    if (canonical({ref: consumer.ref, relation_digest: consumer.relation_digest}) !== binding) {
      throw new RelationViewModelError([`CONSUMER_BINDING_DRIFT:${index}`]);
    }
  }
  return true;
}
