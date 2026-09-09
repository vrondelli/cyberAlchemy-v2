import {canonicalizeJson, digestValue, fail, freezeResult, isRecord, nonEmptyString, uniqueStrings} from "./canonical.mjs";

function sourceIdentity(source, index) {
  return nonEmptyString(source.source_identity) ? source.source_identity.trim() : `source:${index}`;
}

function addDefinition(target, definition) {
  if (target.has(definition.definition_id)) return false;
  target.set(definition.definition_id, definition);
  return true;
}

function lookupTerms(values) {
  const terms = [];
  for (const value of values) {
    const tokens = String(value ?? "").replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().match(/[a-z0-9]+/g) ?? [];
    if (tokens.length === 0) continue;
    terms.push(tokens.join(" "), ...tokens.filter((token) => token.length >= 4));
  }
  return uniqueStrings(terms);
}

function markdownField(section, name) {
  return section.match(new RegExp(`^${name}:\\s*(.+)$`, "mi"))?.[1]?.trim() ?? null;
}

function markdownSubsection(section, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return section.match(new RegExp(`^### ${escaped}\\s*$([\\s\\S]*?)(?=^### |^## |(?![\\s\\S]))`, "mi"))?.[1]?.trim() ?? null;
}

function canonicalMarkdownConcepts(text) {
  const headings = [...text.matchAll(/^## (CAV2-D\d+):\s*(.+)$/gm)];
  return headings.map((heading, index) => {
    const start = heading.index;
    const end = headings[index + 1]?.index ?? text.length;
    const section = text.slice(start, end).trim();
    const term = markdownField(section, "Term") ?? heading[2].trim();
    const aliases = (markdownField(section, "Aliases") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    const selectedSections = [
      ["Normative Definition", markdownSubsection(section, "Normative Definition")],
      ["Plain-Language Intuition", markdownSubsection(section, "Plain-Language Intuition")],
      ["Domain-Context Voice", markdownSubsection(section, "Domain-Context Voice")],
      ["Boundary", markdownSubsection(section, "Boundary")],
    ].filter(([, value]) => value);
    return {
      concept_id: heading[1],
      term,
      aliases,
      current_disposition: "propose",
      propose: {normative_voice: selectedSections.map(([label, value]) => `${label}:\n${value}`).join("\n\n")},
      section_digest: digestValue(section),
      status: markdownField(section, "Status") ?? "unknown",
    };
  });
}

export function materializeDefinitionCatalog(input) {
  if (!isRecord(input)) return fail("definition-source-adapter", ["adapter.input-required"]);
  const sources = Array.isArray(input.sources) ? input.sources : [];
  if (sources.length === 0) return fail("definition-source-adapter", ["adapter.definition-sources-required"]);
  const definitions = new Map();
  const relations = [];
  const relationClasses = new Set();
  const reasons = [];

  for (const [index, source] of sources.entries()) {
    const markdownSource = isRecord(source) && source.format === "canonical-definitions-markdown/v1" && typeof source.text === "string";
    if (!isRecord(source) || (!isRecord(source.document) && !markdownSource) || !nonEmptyString(source.source_digest)) {
      reasons.push("adapter.definition-source-invalid");
      continue;
    }
    const document = markdownSource
      ? {schema_version: "cav2.canonical-definitions-markdown/v1", status: "mixed-section-status", concepts: canonicalMarkdownConcepts(source.text)}
      : source.document;
    const identity = sourceIdentity(source, index);
    if (Array.isArray(document.concepts)) {
      for (const concept of document.concepts) {
        if (!isRecord(concept) || !nonEmptyString(concept.concept_id) || !nonEmptyString(concept.term)) {
          reasons.push("adapter.definition-concept-invalid");
          continue;
        }
        const disposition = concept.current_disposition;
        const body = isRecord(concept[disposition]) ? concept[disposition] : {};
        const definition = {
          definition_id: concept.concept_id.trim(),
          version_or_revision: String(concept.section_digest ?? document.pack_revision ?? document.schema_version ?? "unknown"),
          digest: concept.section_digest ?? digestValue(concept),
          authority_posture: String(concept.status ?? document.status ?? "candidate"),
          source_ref: `${identity}#concept:${concept.concept_id.trim()}`,
          primary_term: concept.term.trim(),
          aliases: uniqueStrings([concept.term.trim(), ...(concept.aliases ?? [])]),
          lookup_terms: lookupTerms([concept.term, ...(concept.aliases ?? [])]),
          relations: [],
          definition_text: body.normative_voice ?? body.formal_voice ?? null,
        };
        if (!addDefinition(definitions, definition)) reasons.push("adapter.duplicate-definition-id");
      }
      for (const relation of Array.isArray(document.relationships) ? document.relationships : []) {
        if (!isRecord(relation) || !nonEmptyString(relation.source_concept_id) || !nonEmptyString(relation.target_concept_id) || !nonEmptyString(relation.relation)) {
          reasons.push("adapter.definition-relation-invalid");
          continue;
        }
        relationClasses.add(relation.relation.trim());
        relations.push({source: relation.source_concept_id.trim(), target: relation.target_concept_id.trim(), relation_class: relation.relation.trim()});
      }
    }
    if (Array.isArray(document.nodes)) {
      for (const node of document.nodes) {
        if (!isRecord(node) || !nonEmptyString(node.id)) {
          reasons.push("adapter.business-node-invalid");
          continue;
        }
        const definition = {
          definition_id: node.id.trim(),
          version_or_revision: String(document.schema_version ?? "unknown"),
          digest: digestValue(node),
          authority_posture: String(document.authority_effect ?? "none"),
          source_ref: `${identity}#node:${node.id.trim()}`,
          primary_term: node.term ?? node.name ?? node.title ?? null,
          aliases: [],
          lookup_terms: [],
          relations: [],
          definition_text: node.meaning ?? null,
        };
        if (!addDefinition(definitions, definition)) reasons.push("adapter.duplicate-definition-id");
      }
      for (const relation of Array.isArray(document.relations) ? document.relations : []) {
        if (!isRecord(relation) || !nonEmptyString(relation.source) || !nonEmptyString(relation.target) || !nonEmptyString(relation.type)) {
          reasons.push("adapter.business-relation-invalid");
          continue;
        }
        relationClasses.add(relation.type.trim());
        if (relation.external_target !== true) relations.push({source: relation.source.trim(), target: relation.target.trim(), relation_class: relation.type.trim()});
      }
    }
  }
  for (const relation of relations) {
    const source = definitions.get(relation.source);
    if (!source || !definitions.has(relation.target)) {
      reasons.push("adapter.definition-relation-target-missing");
      continue;
    }
    source.relations.push({relation_class: relation.relation_class, target_definition_id: relation.target, required: true});
  }
  if (reasons.length > 0) return fail("definition-source-adapter", reasons);

  const sourceMaterial = sources.map((source, index) => ({source_identity: sourceIdentity(source, index), source_digest: source.source_digest})).sort((a, b) => a.source_identity.localeCompare(b.source_identity));
  const catalog = canonicalizeJson({
    schema_version: "are.definition-catalog/v1",
    catalog_id: input.catalog_id ?? "cav2.are.codex-runtime-definitions",
    source_identity: `definition-sources:${digestValue(sourceMaterial)}`,
    source_digest: digestValue(sourceMaterial),
    normative_relation_classes: [...relationClasses].sort(),
    definitions: [...definitions.values()].map((definition) => ({...definition, relations: [...definition.relations].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))})).sort((a, b) => a.definition_id.localeCompare(b.definition_id)),
  });
  return freezeResult({ok: true, value: catalog, digest: digestValue(catalog), authority_effect: "none"});
}

export function materializeOntologySnapshot(input) {
  if (!isRecord(input) || !isRecord(input.document) || !nonEmptyString(input.source_digest)) {
    return fail("ontology-source-adapter", ["adapter.ontology-source-invalid"]);
  }
  const document = input.document;
  if (!nonEmptyString(document.ontology_id) || !Array.isArray(document.nodes) || !Array.isArray(document.edges)) {
    return fail("ontology-source-adapter", ["adapter.ontology-document-invalid"]);
  }
  const requiredByNode = isRecord(input.required_edge_ids_by_node) ? input.required_edge_ids_by_node : {};
  const nodes = document.nodes.map((node) => ({
    node_id: node.node_id,
    node_type: node.kind ?? null,
    source_digest: digestValue(node),
    source_ref: `${input.source_identity ?? `system-ontology:${document.ontology_id}`}#node:${node.node_id}`,
    content: {intent: node.intent ?? null},
    search_terms: uniqueStrings([node.node_id, node.title, node.name, node.term]),
    lookup_terms: lookupTerms([node.node_id, node.title, node.name, node.term]),
    required_edge_ids: uniqueStrings(requiredByNode[node.node_id]),
  })).sort((a, b) => a.node_id.localeCompare(b.node_id));
  const edges = document.edges.map((edge) => ({
    edge_id: edge.edge_id,
    edge_type: edge.type,
    from_node_id: edge.from,
    to_node_id: edge.to,
    source_digest: digestValue(edge),
    source_ref: `${input.source_identity ?? `system-ontology:${document.ontology_id}`}#edge:${edge.edge_id}`,
    content: {type: edge.type, from: edge.from, to: edge.to},
  })).sort((a, b) => a.edge_id.localeCompare(b.edge_id));
  if (nodes.some((node) => !nonEmptyString(node.node_id)) || edges.some((edge) => !nonEmptyString(edge.edge_id) || !nonEmptyString(edge.from_node_id) || !nonEmptyString(edge.to_node_id))) {
    return fail("ontology-source-adapter", ["adapter.ontology-selector-invalid"]);
  }
  const snapshot = canonicalizeJson({
    schema_version: "are.ontology-snapshot/v1",
    ontology_id: document.ontology_id,
    source_identity: input.source_identity ?? `system-ontology:${document.ontology_id}`,
    snapshot_digest: input.source_digest,
    nodes,
    edges,
  });
  return freezeResult({ok: true, value: snapshot, digest: digestValue(snapshot), authority_effect: "none"});
}
