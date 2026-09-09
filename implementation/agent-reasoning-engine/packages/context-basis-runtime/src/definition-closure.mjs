import {
  canonicalizeJson,
  deepFreeze,
  digestValue,
  fail,
  isRecord,
  nonEmptyString,
  uniqueStrings,
} from "./canonical.mjs";

const SCHEMA_VERSION = "are.definition-closure/v1";

function identityOf(definition) {
  return {
    definition_id: definition.definition_id.trim(),
    version_or_revision: definition.version_or_revision.trim(),
    digest: definition.digest.trim(),
    authority_posture: definition.authority_posture.trim(),
  };
}

function identityKey(definition) {
  const identity = identityOf(definition);
  return [identity.definition_id, identity.version_or_revision, identity.digest, identity.authority_posture].join("\u0000");
}

export function resolveDefinitionClosure(input) {
  if (!isRecord(input) || !isRecord(input.catalog)) {
    return fail("definition-closure", ["definition.catalog-required"]);
  }
  const {catalog} = input;
  const reasons = [];
  if (!nonEmptyString(catalog.catalog_id)) reasons.push("definition.catalog-id-required");
  if (!nonEmptyString(catalog.source_identity)) reasons.push("definition.catalog-source-identity-required");
  if (!nonEmptyString(catalog.source_digest)) reasons.push("definition.catalog-source-digest-required");
  if (!Array.isArray(catalog.definitions)) reasons.push("definition.catalog-definitions-required");
  const seeds = uniqueStrings(input.seed_definition_ids);
  if (reasons.length > 0) return fail("definition-closure", reasons);

  const supportedRelations = new Set(uniqueStrings(catalog.normative_relation_classes));
  const activeRelations = new Set([
    ...uniqueStrings(input.universal_relation_classes),
    ...uniqueStrings(input.route_relation_classes),
  ]);
  for (const relationClass of activeRelations) {
    if (!supportedRelations.has(relationClass)) reasons.push("definition.unknown-active-relation-class");
  }

  const byId = new Map();
  const aliases = new Map();
  for (const definition of catalog.definitions) {
    if (!isRecord(definition)
      || !nonEmptyString(definition.definition_id)
      || !nonEmptyString(definition.version_or_revision)
      || !nonEmptyString(definition.digest)
      || !nonEmptyString(definition.authority_posture)) {
      reasons.push("definition.identity-incomplete");
      continue;
    }
    const id = definition.definition_id.trim();
    if (byId.has(id) && identityKey(byId.get(id)) !== identityKey(definition)) {
      reasons.push("definition.conflicting-current-identity");
    } else if (byId.has(id)) {
      reasons.push("definition.duplicate-canonical-identity");
    } else {
      byId.set(id, definition);
    }
    for (const alias of uniqueStrings(definition.aliases)) {
      if (!aliases.has(alias)) aliases.set(alias, new Set());
      aliases.get(alias).add(id);
    }
  }
  if (reasons.length > 0) return fail("definition-closure", reasons);

  function resolveReference(reference) {
    if (byId.has(reference)) return {ok: true, id: reference};
    const targets = aliases.get(reference);
    if (!targets || targets.size === 0) return {ok: false, reason: "definition.required-target-missing"};
    if (targets.size !== 1) return {ok: false, reason: "definition.ambiguous-canonical-identity"};
    return {ok: true, id: [...targets][0]};
  }

  const queue = [];
  for (const seed of seeds) {
    const resolved = resolveReference(seed);
    if (!resolved.ok) reasons.push(resolved.reason);
    else queue.push(resolved.id);
  }
  if (reasons.length > 0) return fail("definition-closure", reasons, seeds.map((seed) => ({kind: "unresolved-seed", ref: seed})));

  const visitedKeys = new Set();
  const selected = [];
  const traversed = [];
  while (queue.length > 0) {
    queue.sort();
    const id = queue.shift();
    const definition = byId.get(id);
    if (!definition) {
      reasons.push("definition.required-target-missing");
      continue;
    }
    const key = identityKey(definition);
    if (visitedKeys.has(key)) continue;
    visitedKeys.add(key);
    selected.push({
      ...identityOf(definition),
      source_ref: nonEmptyString(definition.source_ref) ? definition.source_ref.trim() : null,
      definition_text: nonEmptyString(definition.definition_text) ? definition.definition_text.trim() : null,
    });
    const relations = Array.isArray(definition.relations) ? definition.relations : [];
    for (const relation of relations) {
      if (!isRecord(relation)
        || !nonEmptyString(relation.relation_class)
        || !nonEmptyString(relation.target_definition_id)) {
        reasons.push("definition.relation-invalid");
        continue;
      }
      const relationClass = relation.relation_class.trim();
      if (!supportedRelations.has(relationClass)) {
        reasons.push("definition.unknown-normative-relation-class");
        continue;
      }
      if (!activeRelations.has(relationClass)) continue;
      const reference = relation.target_definition_id.trim();
      const resolved = resolveReference(reference);
      if (!resolved.ok) {
        if (relation.required !== false) reasons.push(resolved.reason);
        continue;
      }
      traversed.push({
        from_definition_id: id,
        relation_class: relationClass,
        target_definition_id: resolved.id,
        required: relation.required !== false,
      });
      queue.push(resolved.id);
    }
  }
  if (reasons.length > 0) {
    return fail("definition-closure", reasons, [{kind: "partial-closure", selected_definition_ids: selected.map((item) => item.definition_id).sort()}]);
  }

  selected.sort((a, b) => identityKey(a).localeCompare(identityKey(b)));
  traversed.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const value = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    catalog: {
      catalog_id: catalog.catalog_id.trim(),
      source_identity: catalog.source_identity.trim(),
      source_digest: catalog.source_digest.trim(),
    },
    seed_definition_ids: seeds,
    universal_relation_classes: uniqueStrings(input.universal_relation_classes),
    route_relation_classes: uniqueStrings(input.route_relation_classes),
    definitions: selected,
    traversed_relations: traversed,
    gaps: [],
    authority_effect: "none",
  });
  return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest: digestValue(value), authority_effect: "none"});
}
