import { CompilationRejected } from "./model.js";
import { digest, json, symbol } from "./domainspec-profile.js";
import { lowerApplicationDomain, type ApplicationPersistenceContext, type ApplicationMessagingContext, type ApplicationExternalApiContext, type ApplicationRuntimeContext } from "./application-domain-lowering.js";
import type { FormalProposition, FormalTerm } from "./formal-claim.js";
import { projectApplicationQueries } from "./application-query-projection.js";

type Obj = Record<string, unknown>;
const fail = (code: string, path: string, message: string): never => { throw new CompilationRejected([{ code, path, message }]); };
function object(value: unknown, path: string): Obj {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("RULE_PROJECTION_SCHEMA", path, "expected object");
  return value as Obj;
}
function exact(value: unknown, keys: string[], path: string): Obj {
  const row = object(value, path);
  if (json(Object.keys(row).sort()) !== json([...keys].sort())) fail("RULE_PROJECTION_SCHEMA", path, "unexpected or missing binding");
  return row;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) return fail("RULE_PROJECTION_SCHEMA", path, "explicit text required");
  return value;
}

/** Ground property/scalar interpretation only. No quantifier narrowing or proof. */
export function lowerApplicationRuleProjections(source: string, bindings: unknown, sources: ReadonlyMap<string, Buffer>, interpretation: unknown, persistenceContext?: ApplicationPersistenceContext, messagingContext?: ApplicationMessagingContext, externalApiContext?: ApplicationExternalApiContext, runtimeContext?: ApplicationRuntimeContext) {
  const formation = lowerApplicationDomain(source, bindings, sources, persistenceContext, messagingContext, externalApiContext, runtimeContext);
  const root = exact(interpretation, ["schema_version", "formation_sha256", "rules"], "$interpretation");
  if (root.schema_version !== "alchlang.ground-rule-interpretation/v1-candidate" || root.formation_sha256 !== digest(json(formation))) {
    fail("RULE_PROJECTION_STALE", "$interpretation", "interpretation must bind the exact current formation");
  }
  const selected = exact(root.rules, formation.model.rules.map(r => r.id), "$interpretation/rules");
  const projectFiles = { ...formation.projectFiles };
  const projections: Obj[] = [];
  for (const rule of formation.model.rules) {
    const at = `$interpretation/rules/${rule.id}`;
    const row = exact(selected[rule.id], ["claim_identity_inputs_digest", "context_id", "ceiling", "sorts", "constants", "predicates"], at);
    const claim = formation.model.formal_claims.find(c => c.id === rule.claim_ref)!;
    const claimTrace = formation.trace.declarations.find(t => t.source_id === claim.id)!;
    if (row.claim_identity_inputs_digest !== claimTrace.identity_inputs_digest) fail("RULE_PROJECTION_STALE", at, "claim identity differs");
    const contextId = text(row.context_id, at); const ceiling = text(row.ceiling, at);
    if (claim.signature.functions.length) fail("RULE_PROJECTION_UNSUPPORTED", at, "function interpretations are not implemented by this ground property projection");
    const sorts = exact(row.sorts, claim.signature.sorts.map(s => s.name), at);
    const constants = exact(row.constants, claim.signature.constants.map(c => c.name), at);
    const predicates = exact(row.predicates, claim.signature.predicates.map(p => p.name), at);
    const sortEntities = new Map<string, string>();
    const sortTypes = new Map<string, Obj>();
    for (const sort of claim.signature.sorts) {
      const id = text(sorts[sort.name], at);
      if (["String", "Bool", "UInt64"].includes(id)) { sortTypes.set(sort.name, { kind: "scalar", name: id }); continue; }
      if (!formation.model.declarations.some(d => d.kind === "entity" && d.id === id)) fail("RULE_PROJECTION_SORT", at, "sort must explicitly select a declared Entity");
      sortEntities.set(sort.name, id);
      sortTypes.set(sort.name, { kind: "named", selector: `${formation.feature}:${formation.symbols[id]}` });
    }
    const parameters = claim.signature.constants.map(c => {
      const name = text(constants[c.name], at);
      if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(name)) fail("RULE_PROJECTION_PARAMETER", at, "expected portable parameter name");
      return { name, type: sortTypes.get(c.sort)! };
    });
    if (new Set(parameters.map(p => p.name)).size !== parameters.length) fail("RULE_PROJECTION_PARAMETER", at, "constant parameters must be distinct");
    const properties = new Map<string, string>();
    for (const predicate of claim.signature.predicates) {
      if (predicate.parameter_sorts.length !== 1) fail("RULE_PROJECTION_UNSUPPORTED", at, "property interpretation requires a unary predicate");
      const field = text(predicates[predicate.name], at);
      const entityId = sortEntities.get(predicate.parameter_sorts[0]!)!;
      if (!entityId) fail("RULE_PROJECTION_PREDICATE", at, "property predicates require an Entity sort");
      const entity = formation.model.declarations.find(d => d.id === entityId)!;
      if (entity.kind !== "entity") return fail("RULE_PROJECTION_SORT", at, "expected Entity");
      const property = entity.fields.find(f => f.name === field);
      if (property?.type.kind !== "scalar" || property.type.name !== "Bool") fail("RULE_PROJECTION_PREDICATE", at, "predicate interpretation must select an explicit Bool property");
      const node = JSON.parse(projectFiles[`specs/${formation.feature}/nodes/${formation.symbols[entityId]}.json`]!);
      properties.set(predicate.name, node.body.typed_contract.properties.find((p: { name: string }) => p.name === symbol(field, "_")).ontology_property);
    }
    let projectedNodes = 0;
    const scalarTerm = (term: FormalTerm): Obj => {
      if (term.kind !== "constant" || sortTypes.get(term.sort)?.kind !== "scalar") return fail("RULE_PROJECTION_UNSUPPORTED", at, "equality requires explicitly interpreted scalar constants");
      return { op: "path", root: constants[term.name], properties: [] };
    };
    const lower = (p: FormalProposition): Obj => {
      if (++projectedNodes > 1024) return fail("RULE_PROJECTION_LIMIT", at, "expanded Boolean projection exceeds 1024 nodes");
      switch (p.kind) {
        case "equal": return { op: "eq", left: scalarTerm(p.left), right: scalarTerm(p.right) };
        case "predicate": {
          const arg = p.arguments[0];
          if (p.arguments.length !== 1 || arg?.kind !== "constant") return fail("RULE_PROJECTION_UNSUPPORTED", at, "ground predicate requires an explicitly bound constant");
          return { op: "eq", left: { op: "path", root: constants[arg.name], properties: [properties.get(p.name)] }, right: { op: "literal", type: "Bool", value: true } };
        }
        case "not": return { op: "not", term: lower(p.operand) };
        case "and": case "or": return { op: p.kind === "and" ? "all" : "any", terms: [lower(p.left), lower(p.right)] };
        case "implies": return { op: "any", terms: [{ op: "not", term: lower(p.left) }, lower(p.right)] };
        case "iff": return { op: "all", terms: [
          { op: "any", terms: [{ op: "not", term: lower(p.left) }, lower(p.right)] },
          { op: "any", terms: [{ op: "not", term: lower(p.right) }, lower(p.left)] },
        ] };
        default: return fail("RULE_PROJECTION_UNSUPPORTED", at, `${p.kind} requires a separately supported interpretation; no implicit narrowing`);
      }
    };
    const targetPath = `specs/${formation.feature}/nodes/${formation.symbols[rule.id]}.json`;
    const node = JSON.parse(projectFiles[targetPath]!);
    const metadata = object(object(bindings, "$bindings").declarations, "$bindings/declarations");
    const ontology = object(metadata[rule.id], at).ontology;
    node.body.predicate = "structured:domainspec.typed-rule/v2";
    node.body.typed_contract = { schema_version: "domainspec.typed-rule/v2", ontology_rule: ontology, parameters, expression: lower(claim.proposition) };
    projectFiles[targetPath] = json(node);
    projections.push({ rule_ref: `${formation.feature}:${formation.symbols[rule.id]}`, claim_ref: claimTrace,
      context_id: contextId, ceiling, interpretation_sha256: digest(json(row)), target_path: targetPath,
      target_sha256: digest(projectFiles[targetPath]!), scope: "ground-proposition-under-explicit-property-and-scalar-interpretation",
      preservation: { direction: "equivalent-under-selected-interpretation", domain: "well-typed-ground-parameters",
        expanded_node_limit: 1024, known_losses: [], result_semantics: "boolean", unsupported_constructs: ["quantifiers", "functions", "non-unary-predicates", "non-scalar-equality"] }, proof: false });
  }
  const queries = projectApplicationQueries(formation, projectFiles);
  const trace = { schema_version: "alchlang.rule-projection-trace/v1-candidate", formation_sha256: digest(json(formation)),
    interpretation_sha256: digest(json(interpretation)), projections,
    query_projections: queries,
    project_files: Object.fromEntries(Object.entries(projectFiles).map(([p, bytes]) => [p, digest(bytes)])),
    operation_realization: "required", authority_effect: "none" };
  return { formation, projectFiles, trace };
}

/** Exact currentness only, never a proof of the source proposition. */
export function assertApplicationRuleProjectionCurrent(source: string, bindings: unknown, sources: ReadonlyMap<string, Buffer>, interpretation: unknown, candidate: unknown, persistenceContext?: ApplicationPersistenceContext, messagingContext?: ApplicationMessagingContext, externalApiContext?: ApplicationExternalApiContext, runtimeContext?: ApplicationRuntimeContext): void {
  if (json(candidate) !== json(lowerApplicationRuleProjections(source, bindings, sources, interpretation, persistenceContext, messagingContext, externalApiContext, runtimeContext))) {
    fail("RULE_PROJECTION_STALE", "$projection", "projected source or trace differs from exact current inputs");
  }
}
