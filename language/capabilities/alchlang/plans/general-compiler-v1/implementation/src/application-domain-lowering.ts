import { CompilationRejected } from "./model.js";
import { digest, json, symbol } from "./domainspec-profile.js";
import { lowerApplicationFormalClaims } from "./formal-claim-lowering.js";
import type { ApplicationType, ApplicationPublicType } from "./application-source.js";
import { lowerApplicationPersistence } from "./application-persistence.js";
import { lowerApplicationMessaging } from "./application-messaging.js";
import { lowerApplicationExternalApi } from "./application-external-api.js";
import { lowerApplicationRuntimeProfiles, type RuntimeProfileCompiler } from "./application-runtime-profile.js";
import type { DomainSpecCompiler } from "./domainspec-cli.js";

export interface ApplicationPersistenceContext {
  readonly binding: unknown;
  readonly compiler: Pick<DomainSpecCompiler, "compilePersistenceComposition">;
}
export interface ApplicationMessagingContext {
  readonly binding: unknown;
  readonly compiler: Pick<DomainSpecCompiler, "compileMessagingComposition">;
}
export interface ApplicationExternalApiContext {
  readonly binding: unknown;
  readonly compiler: Pick<DomainSpecCompiler, "compileExternalApiComposition">;
}
export interface ApplicationRuntimeContext {
  readonly profile: string;
  readonly compiler: RuntimeProfileCompiler;
}

type Obj = Record<string, unknown>;
function reject(code: string, path: string, message: string): never { throw new CompilationRejected([{ code, path, message }]); }
function object(value: unknown, path: string): Obj {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject("APPLICATION_BINDING", path, "expected object");
  return value as Obj;
}
function exact(value: unknown, keys: string[], path: string): Obj {
  const result = object(value, path);
  if (JSON.stringify(Object.keys(result).sort()) !== JSON.stringify([...keys].sort())) reject("APPLICATION_BINDING", path, "unexpected or missing member");
  return result;
}
function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) reject("APPLICATION_BINDING", path, "expected explicit nonempty text");
  return value as string;
}
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Effect-free domain/formal source formation. No executable projection is inferred here. */
export function lowerApplicationDomain(source: string, input: unknown, sources: ReadonlyMap<string, Buffer>, persistenceContext?: ApplicationPersistenceContext, messagingContext?: ApplicationMessagingContext, externalApiContext?: ApplicationExternalApiContext, runtimeContext?: ApplicationRuntimeContext) {
  const root = exact(input, ["schema_version", "source_sha256", "owner", "formal", "declarations"], "$bindings");
  if (root.schema_version !== "alchlang.application-bindings/v1" || root.source_sha256 !== digest(source)) reject("APPLICATION_BINDING_SOURCE", "$bindings", "source bytes or binding version differ");
  const formal = lowerApplicationFormalClaims(source, root.formal, sources);
  const model = formal.model;
  if (model.runtime_profiles?.length && !runtimeContext) reject("APPLICATION_RUNTIME_LOWERING_REQUIRED", "$runtime", "runtime profiles require explicit compiler validation and profile selection");
  const runtime = runtimeContext ? lowerApplicationRuntimeProfiles(source, runtimeContext.profile, runtimeContext.compiler) : undefined;
  if (model.integrations.some(d => d.kind === "persistence" ? !persistenceContext : d.kind === "publication" || d.kind === "subscription" ? !messagingContext : !externalApiContext)) reject("APPLICATION_INTEGRATION_LOWERING_REQUIRED", "$integrations", "each integration requires its explicit complete lowerer; domain-only formation cannot omit it");
  const persistence = persistenceContext ? lowerApplicationPersistence(source, persistenceContext.binding, persistenceContext.compiler) : undefined;
  const messaging = messagingContext ? lowerApplicationMessaging(source, messagingContext.binding, messagingContext.compiler) : undefined;
  const externalApi = externalApiContext ? lowerApplicationExternalApi(source, externalApiContext.binding, externalApiContext.compiler) : undefined;
  if (root.owner !== model.owner) reject("APPLICATION_BINDING_OWNER", "$bindings", "owner differs");
  const metadata = object(root.declarations, "$bindings/declarations");
  const declarations = [...model.declarations, ...model.rules.map(r => ({ ...r, kind: "rule" as const }))];
  const allIds = declarations.map(d => d.id);
  if (JSON.stringify(Object.keys(metadata).sort()) !== JSON.stringify([...allIds].sort())) reject("APPLICATION_BINDING_COVERAGE", "$bindings/declarations", "every domain declaration requires exactly one binding");
  const feature = symbol(model.domain_id);
  const symbols = Object.fromEntries(allIds.map(id => [id, symbol(id)]));
  if (new Set(Object.values(symbols)).size !== allIds.length) reject("APPLICATION_SYMBOL_COLLISION", "$", "declarations collide after DomainSpec normalization");
  const selector = (id: string): string => {
    if (!Object.hasOwn(symbols, id)) return reject("APPLICATION_REFERENCE", id, "missing declaration");
    return `${feature}:${symbols[id]}`;
  };
  const projectFiles: Record<string, string> = {};
  const nodes: string[] = []; const edges: string[] = [];
  const trace: Obj[] = []; const operationShapes: Obj[] = []; const queryShapes: Obj[] = [];
  const add = (id: string, kind: string, body: unknown, sourceLine: number) => {
    const nodeId = symbols[id]!; const path = `specs/${feature}/nodes/${nodeId}.json`;
    nodes.push(nodeId); projectFiles[path] = json({ schema_version: "domainspec.node/v1", feature_id: feature, node_id: nodeId, kind, body });
    trace.push({ source_id: id, source_line: sourceLine, target: selector(id), target_path: path, target_sha256: digest(projectFiles[path]!) });
  };
  const edge = (from: string, relationship: string, to: string) => {
    const id = `${symbols[from]}-${relationship}-${symbols[to]}`;
    if (edges.includes(id)) return;
    edges.push(id); projectFiles[`specs/${feature}/edges/${id}.json`] = json({ schema_version: "domainspec.edge/v1", feature_id: feature, edge_id: id,
      relationship, source_node_id: symbols[from], target_node_id: symbols[to], scope: "feature" });
  };
  const type = (value: ApplicationType): unknown => {
    if (value.kind === "scalar") return value;
    if (value.kind === "declaration") return { kind: "named", selector: selector(value.ref) };
    if (value.kind === "public-contract") return { kind: "contract", interface_selector: selector(value.interface), contract_id: symbol(value.contract) };
    if (value.kind === "reference") return { kind: "reference", selector: selector(value.entity), projection: [symbol(value.field, "_")] };
    return { kind: value.kind, element: type(value.element) };
  };
  const qualifyPublic = (value: ApplicationPublicType, owner: string): ApplicationType => {
    if (value.kind === "contract") return { kind: "public-contract", interface: owner, contract: value.ref };
    if (value.kind === "scalar" || value.kind === "declaration" || value.kind === "reference") return value;
    return { kind: value.kind, element: qualifyPublic(value.element, owner) };
  };
  const mappingData = (value: ApplicationType, at: string) => {
    if (value.kind === "reference") {
      const entity = model.declarations.find(d => d.id === value.entity);
      if (entity?.kind !== "entity" || entity.identity !== value.field) return reject("APPLICATION_MAPPING_PATH", at, "reference must select the declared Entity identity");
      return { fields: entity.fields.filter(f => f.name === value.field), properties: object(object(metadata[entity.id], at).properties, at) };
    }
    if (value.kind === "public-contract") {
      const owner = model.declarations.find(d => d.id === value.interface);
      if (owner?.kind !== "interface") return reject("APPLICATION_MAPPING_PATH", at, "unknown public Interface");
      const contract = owner.contracts.find(c => c.id === value.contract);
      if (!contract) return reject("APPLICATION_MAPPING_PATH", at, "unknown public contract");
      const contracts = object(object(metadata[owner.id], at).contracts, at);
      return { fields: contract.fields.map(f => ({ ...f, type: qualifyPublic(f.type, owner.id) })), properties: object(object(contracts[contract.id], at).properties, at) };
    }
    if (value.kind === "declaration") {
      const data = model.declarations.find(d => d.id === value.ref);
      if (data?.kind === "entity" || data?.kind === "value-object") return { fields: data.fields, properties: object(object(metadata[data.id], at).properties, at) };
    }
    return reject("APPLICATION_MAPPING_PATH", at, "path requires a declared data value; no implicit unwrap or lookup");
  };
  const conditionBindings: Obj[] = [];
  for (const declaration of declarations) {
    const at = `$bindings/declarations/${declaration.id}`;
    const keys = declaration.kind === "entity" ? ["ontology", "meaning", "properties"]
      : declaration.kind === "value-object" ? ["ontology", "meaning", "properties", "invariants"]
      : declaration.kind === "enum" ? ["ontology", "meaning", "variants"]
      : declaration.kind === "operation" ? ["ontology", "meaning", "failure_continuation"]
      : declaration.kind === "interface" ? ["ontology", "meaning", "contracts"]
      : ["ontology", "meaning"];
    const binding = exact(metadata[declaration.id], keys, at);
    const ontology = text(binding.ontology, at); const meaning = text(binding.meaning, at);
    if (!/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(ontology)) reject("APPLICATION_ONTOLOGY", at, "expected explicit ontology node identifier");
    if (declaration.ontology !== null && declaration.ontology !== ontology || declaration.meaning !== null && declaration.meaning !== meaning) reject("APPLICATION_BINDING_DRIFT", at, "source and companion meanings differ");
    if (declaration.kind === "entity" || declaration.kind === "value-object") {
      if (declaration.kind === "entity" && declaration.identity === null) reject("APPLICATION_IDENTITY", at, "Entity identity must be explicit");
      const properties = object(binding.properties, at);
      if (JSON.stringify(Object.keys(properties).sort()) !== JSON.stringify(declaration.fields.map(f => f.name).sort())) reject("APPLICATION_BINDING_COVERAGE", at, "property bindings differ from declared fields");
      const fieldNames = declaration.fields.map(f => symbol(f.name, "_"));
      if (new Set(fieldNames).size !== fieldNames.length) reject("APPLICATION_SYMBOL_COLLISION", at, "field names collide after normalization");
      const typedProperties = declaration.fields.map(field => {
        const property = exact(properties[field.name], ["ontology", "meaning"], `${at}/${field.name}`);
        const propertyOntology = text(property.ontology, at);
        if (propertyOntology !== `${ontology}#${symbol(field.name, "_")}`) reject("APPLICATION_ONTOLOGY", at, "property ontology must match its explicit owner and normalized field");
        return { name: symbol(field.name, "_"), type: type(field.type), ontology_property: propertyOntology, meaning: text(property.meaning, at),
          identity: declaration.kind === "entity" && declaration.identity === field.name,
          cardinality: field.type.kind === "optional" ? "optional" : field.type.kind === "list" ? "many" : field.type.kind === "set" ? "many-unique" : "one" };
      });
      let invariants: string[] = [];
      if (declaration.kind === "value-object") {
        if (!Array.isArray(binding.invariants) || !binding.invariants.length) reject("APPLICATION_INVARIANT", at, "Value Object requires declared Rule invariants");
        invariants = (binding.invariants as unknown[]).map(ref => {
          const id = text(ref, at); if (!model.rules.some(rule => rule.id === id)) reject("APPLICATION_INVARIANT", at, "invariant must select a declared Rule"); return selector(id);
        });
        if (new Set(invariants).size !== invariants.length) reject("APPLICATION_INVARIANT", at, "duplicate invariant");
      }
      add(declaration.id, declaration.kind === "entity" ? "Entity" : "Value Object", { description: meaning, fields: fieldNames,
        ...(declaration.kind === "value-object" ? { invariant_refs: invariants } : {}), typed_contract: { schema_version: "domainspec.typed-record/v1", ontology_node: ontology, properties: typedProperties } }, declaration.source_line);
      const fieldTrace = declaration.fields.map(f => ({ source: f.name, source_line: f.source_line, target: symbol(f.name, "_"), type: type(f.type) }));
      Object.assign(trace.at(-1)!, { properties: fieldTrace });
    } else if (declaration.kind === "interface") {
      const contracts = object(binding.contracts, at);
      if (json(Object.keys(contracts).sort()) !== json(declaration.contracts.map(c => c.id).sort())) reject("APPLICATION_BINDING_COVERAGE", at, "public contract bindings must cover the exact authored contracts");
      const contractNames = declaration.contracts.map(c => symbol(c.id));
      if (new Set(contractNames).size !== contractNames.length) reject("APPLICATION_SYMBOL_COLLISION", at, "public contracts collide after normalization");
      const publicType = (value: ApplicationPublicType): unknown => {
        if (value.kind === "contract") return { kind: "contract", contract_id: symbol(value.ref) };
        if (value.kind === "scalar") return value;
        if (value.kind === "declaration") return { kind: "named", selector: selector(value.ref) };
        if (value.kind === "reference") return reject("APPLICATION_INTERFACE_TYPE", at, "public identity references require an explicit supported representation");
        return { kind: value.kind, element: publicType(value.element) };
      };
      const publicContracts = declaration.contracts.map(contract => {
        const bound = exact(contracts[contract.id], ["ontology", "properties"], `${at}/${contract.id}`);
        const contractOntology = text(bound.ontology, at);
        if (!/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/.test(contractOntology)) reject("APPLICATION_ONTOLOGY", at, "explicit public contract ontology identifier required");
        const properties = object(bound.properties, at);
        if (json(Object.keys(properties).sort()) !== json(contract.fields.map(f => f.name).sort())) reject("APPLICATION_BINDING_COVERAGE", at, "public field bindings differ");
        const names = contract.fields.map(f => symbol(f.name, "_"));
        if (new Set(names).size !== names.length) reject("APPLICATION_SYMBOL_COLLISION", at, "public fields collide after normalization");
        return { contract_id: symbol(contract.id), ontology_contract: contractOntology, fields: contract.fields.map(field => {
          const property = exact(properties[field.name], ["ontology", "meaning"], `${at}/${contract.id}/${field.name}`);
          if (property.ontology !== `${contractOntology}#${symbol(field.name, "_")}`) reject("APPLICATION_ONTOLOGY", at, "public field ontology differs from its owner and normalized field");
          return { name: symbol(field.name, "_"), type: publicType(field.type), ontology_field: property.ontology, meaning: text(property.meaning, at) };
        }) };
      });
      if (new Set(publicContracts.map(c => c.ontology_contract)).size !== publicContracts.length) reject("APPLICATION_ONTOLOGY", at, "distinct public contracts require distinct ontology identities");
      const members = declaration.members.map(member => ({ operation_id: symbol(member.operation), operation_ref: selector(member.operation), request: publicType(member.request), result: publicType(member.result) }));
      add(declaration.id, "Interface", { description: meaning, typed_contract: {
        schema_version: "domainspec.typed-interface/v1", ontology_interface: ontology, boundary_kind: declaration.boundary_kind,
        version_policy: { schema_version: "domainspec.interface-version-policy/v1", mode: declaration.compatibility, direction: "consumer-to-provider", provider_version: declaration.version },
        contracts: publicContracts, operations: members,
      } }, declaration.source_line);
      declaration.members.forEach(member => edge(declaration.id, "exposes", member.operation));
      Object.assign(trace.at(-1)!, { public_contracts: declaration.contracts, members: declaration.members, public_boundary_execution: "not-performed" });
    } else if (declaration.kind === "query") {
      const names = [...declaration.inputs.map(p => p.name), declaration.source.name].map(name => symbol(name, "_"));
      if (new Set(names).size !== names.length) reject("APPLICATION_SYMBOL_COLLISION", at, "Query input and source names collide after normalization");
      const parameters = declaration.bindings.map(b => symbol(b.parameter, "_"));
      if (new Set(parameters).size !== parameters.length) reject("APPLICATION_SYMBOL_COLLISION", at, "Query Rule parameter names collide after normalization");
      const bindings = declaration.bindings.map(binding => {
        const root = binding.path[0]!;
        let current: ApplicationType = root === declaration.source.name ? { kind: "declaration", ref: declaration.source.entity } : declaration.inputs.find(p => p.name === root)!.type;
        const properties: string[] = [];
        for (const name of binding.path.slice(1)) {
          if (current.kind !== "declaration") return reject("APPLICATION_QUERY_BINDING", `$line:${binding.source_line}`, "no implicit optional traversal or reference lookup");
          const ownerRef = current.ref; const data = model.declarations.find(d => d.id === ownerRef)!;
          if (data.kind !== "entity" && data.kind !== "value-object") return reject("APPLICATION_QUERY_BINDING", `$line:${binding.source_line}`, "binding owner has no typed data fields");
          const property = data.fields.find(p => p.name === name);
          if (!property) return reject("APPLICATION_QUERY_BINDING", `$line:${binding.source_line}`, "unknown bound property");
          const owner = object(metadata[data.id], at);
          properties.push(text(object(object(owner.properties, at)[name], at).ontology, at)); current = property.type;
        }
        return { parameter: symbol(binding.parameter, "_"), value: { op: "path", root: symbol(root, "_"), properties }, type: type(current), source_line: binding.source_line };
      });
      add(declaration.id, "Query", { description: meaning, reads: [selector(declaration.source.entity)] }, declaration.source_line);
      edge(declaration.id, "reads", declaration.source.entity);
      queryShapes.push({ query_ref: selector(declaration.id), ontology_query: ontology,
        inputs: declaration.inputs.map(p => ({ name: symbol(p.name, "_"), type: type(p.type) })),
        source: { parameter: symbol(declaration.source.name, "_"), selector: selector(declaration.source.entity) }, output: type(declaration.output),
        rule_ref: selector(declaration.rule), bindings, source_line: declaration.source_line, executable_realization: "required" });
      Object.assign(trace.at(-1)!, { query_shape: selector(declaration.id), condition_rule: selector(declaration.rule), executable_projection: "required" });
    } else if (declaration.kind === "mapping") {
      const inputNames = declaration.inputs.map(p => symbol(p.name, "_"));
      if (new Set(inputNames).size !== inputNames.length) reject("APPLICATION_SYMBOL_COLLISION", at, "Mapping inputs collide after normalization");
      const [targetOwner, targetContract] = declaration.target.split(".");
      const targetType: ApplicationType = targetContract ? { kind: "public-contract", interface: targetOwner!, contract: targetContract } : { kind: "declaration", ref: targetOwner! };
      const target = mappingData(targetType, at);
      const hasPublic = (value: ApplicationType): boolean => value.kind === "public-contract" || ("element" in value && hasPublic(value.element));
      const publicMapping = hasPublic(targetType) || declaration.inputs.some(p => hasPublic(p.type));
      if (publicMapping && targetType.kind === "declaration" && !["entity", "value-object"].includes(model.declarations.find(d => d.id === targetType.ref)?.kind ?? "")) return reject("APPLICATION_MAPPING_TARGET", at, "public Mapping target must be an Entity, Value Object or public contract");
      const fields = declaration.fields.map(field => {
        const input = declaration.inputs.find(p => p.name === field.path[0])!;
        let current = input.type; const properties: string[] = [];
        for (const name of field.path.slice(1)) {
          const data = mappingData(current, `$line:${field.source_line}`);
          const property = data.fields.find(p => p.name === name);
          if (!property) return reject("APPLICATION_MAPPING_PATH", `$line:${field.source_line}`, "unknown source field");
          const propertyBinding = object(data.properties[name], at);
          properties.push(text(propertyBinding.ontology, at)); current = property.type;
        }
        const targetType = target.fields.find(p => p.name === field.target)!.type;
        if (json(type(current)) !== json(type(targetType)) && !(targetType.kind === "optional" && json(type(current)) === json(type(targetType.element)))) {
          return reject("APPLICATION_MAPPING_TYPE", `$line:${field.source_line}`, "Mapping value and target field types differ");
        }
        return { target: symbol(field.target, "_"), value: { op: "path", root: symbol(input.name, "_"), properties }, default: null };
      });
      const contract = { schema_version: publicMapping ? "domainspec.typed-mapping/v3" : "domainspec.typed-mapping/v2", ontology_mapping: ontology,
        inputs: declaration.inputs.map(p => ({ name: symbol(p.name, "_"), type: type(p.type), ...(publicMapping ? { use: null } : {}) })),
        target: publicMapping ? type(targetType) : selector(targetOwner!), ...(publicMapping ? { target_use: null } : {}), fields, total: declaration.total };
      add(declaration.id, "Mapping", { description: meaning, target: selector(targetOwner!), typed_contract: contract }, declaration.source_line);
      edge(declaration.id, "maps", targetOwner!);
      Object.assign(trace.at(-1)!, { fields: declaration.fields, return_semantics: "field-projection-not-construction", dependency_contract: "declared-inputs-only" });
    } else if (declaration.kind === "event") {
      if (!declaration.event_type || !declaration.version || !declaration.occurrence_id || !declaration.occurred_at_policy) {
        reject("APPLICATION_EVENT_REALIZATION", at, "Event requires explicit event-type, version, occurrence-id and occurred-at clauses");
      }
      const field = (value: import("./application-source.js").ApplicationField, occurrence = false) => {
        const selected = value.type.kind === "optional" ? value.type.element : value.type;
        let typeRef: unknown;
        if (selected.kind === "scalar" && ["String", "Bool"].includes(selected.name)) {
          typeRef = { kind: "primitive", name: selected.name === "String" ? "string" : "boolean" };
        } else if (selected.kind === "reference") {
          typeRef = { kind: "reference", selector: selector(selected.entity) };
        } else return reject("APPLICATION_EVENT_FIELD_UNSUPPORTED", `$line:${value.source_line}`, "Event field has no exact current representation; unsigned integers cannot become signed integers and embedded values cannot become identity references");
        if (occurrence && value.type.kind === "optional") reject("APPLICATION_EVENT_REALIZATION", at, "occurrence identity must be required");
        return { field_id: symbol(value.name), type_ref: typeRef, required: value.type.kind !== "optional" };
      };
      const payload = declaration.fields.map(value => field(value));
      if (new Set(payload.map(value => value.field_id)).size !== payload.length) reject("APPLICATION_SYMBOL_COLLISION", at, "Event payload fields collide after normalization");
      add(declaration.id, "Event", { description: meaning, event_type: declaration.event_type, version: declaration.version,
        occurrence_id: field(declaration.occurrence_id!, true), occurred_at_policy: declaration.occurred_at_policy, payload }, declaration.source_line);
      Object.assign(trace.at(-1)!, { ontology_event: ontology, occurrence_source_line: declaration.occurrence_id!.source_line,
        properties: declaration.fields.map(value => ({ source: value.name, source_line: value.source_line, target: symbol(value.name), type: type(value.type) })),
        occurrence_registration: false, publication: false });
    } else if (declaration.kind === "enum") {
      const variants = object(binding.variants, at);
      if (JSON.stringify(Object.keys(variants).sort()) !== JSON.stringify(declaration.values.map(v => v.name).sort())) reject("APPLICATION_BINDING_COVERAGE", at, "enum binding coverage differs");
      const values = declaration.values.map(value => {
        const ontologyVariant = text(variants[value.name], at);
        if (ontologyVariant !== `${ontology}#${value.name}`) reject("APPLICATION_ONTOLOGY", at, "variant ontology differs");
        return { name: value.name, payload: null, ontology_variant: ontologyVariant };
      });
      add(declaration.id, "Enum", { description: meaning, values: values.map(v => v.name), typed_contract: { schema_version: "domainspec.typed-sum/v1", ontology_node: ontology, variants: values } }, declaration.source_line);
      // The backend sum contract does not own explanatory variant prose.
      // Preserve it in the source trace, without inventing an executable field.
      Object.assign(trace.at(-1)!, { variants: declaration.values.map(value => ({
        source: value.name, source_line: value.source_line, meaning: value.meaning,
        target: value.name, ontology_variant: variants[value.name],
      })) });
    } else if (declaration.kind === "rule") {
      const formalTrace = formal.trace.declarations.find(t => t.source_id === declaration.claim_ref)!;
      const claim = formal.claims.find(c => c.claim.claim_id === formalTrace.claim_id)!;
      const claimPath = String(formalTrace.target); const bytes = formal.files[claimPath]!;
      const bindingId = `${symbols[declaration.id]}-condition`;
      conditionBindings.push({ binding_id: bindingId, relationship: "condition-bound-to", rule_ref: selector(declaration.id),
        claim_ref: { path: claimPath, sha256: digest(bytes), size_bytes: Buffer.byteLength(bytes), claim_id: claim.claim.claim_id,
          claim_version: claim.claim.claim_version, identity_inputs_digest: claim.claim.identity_inputs_digest }, source_pointer: `source.alch:${declaration.source_line}` });
      add(declaration.id, "Rule", { description: meaning, predicate: `formal-condition-binding:${bindingId}` }, declaration.source_line);
      Object.assign(trace.at(-1)!, { claim_ref: declaration.claim_ref, condition_binding: bindingId, executable_projection: "required" });
    } else if (declaration.kind === "operation") {
      const guards = [...new Set([...declaration.requires, ...model.rules.filter(rule => rule.enforces.includes(declaration.id)).map(rule => rule.id)])];
      if (guards.length !== 1) reject("APPLICATION_GUARD_REALIZATION", at, "L0 lowering requires one explicit guard Rule; compound guard realization remains C03 work");
      add(declaration.id, "Operation", { description: meaning, reads: declaration.reads.map(selector), writes: declaration.writes.map(selector), effects: declaration.produces.map(selector),
        guard: selector(guards[0]!), failure_continuation: text(binding.failure_continuation, at) }, declaration.source_line);
      guards.forEach(rule => edge(rule, "enforces", declaration.id));
      declaration.produces.forEach(event => edge(declaration.id, "produces", event));
      const shape = { operation_ref: selector(declaration.id), ontology_operation: ontology, input: type(declaration.input), output: type(declaration.output),
        guard_rule_refs: guards.map(selector), source_line: declaration.source_line, executable_realization: "required" };
      operationShapes.push(shape); Object.assign(trace.at(-1)!, { operation_shape: selector(declaration.id) });
    }
  }
  projectFiles["project.json"] = json({ schema_version: "domainspec.project/v1", project_id: feature, features: [feature], cross_feature_edges: [] });
  projectFiles[`specs/${feature}/feature.json`] = json({ schema_version: "domainspec.feature/v1", feature_id: feature, nodes: nodes.sort(order), edges: edges.sort(order) });
  const conditions = { schema_version: "domainspec.formal-condition-bindings/v1-candidate", rules: model.rules.map(r => selector(r.id)).sort(order), bindings: conditionBindings, authority_effect: "none" };
  const shapes = { schema_version: "alchlang.operation-shapes/v1-candidate", operations: operationShapes, authority_effect: "none", executable: false };
  const queries = { schema_version: "alchlang.query-shapes/v1-candidate", queries: queryShapes, authority_effect: "none", executable: false };
  const files = { ...formal.files, ...(persistence?.files ?? {}), ...(messaging?.files ?? {}), ...(externalApi?.files ?? {}), ...(runtime?.files ?? {}), "condition-bindings.json": json(conditions), "operation-shapes.json": json(shapes), "query-shapes.json": json(queries) };
  const fullTrace = { schema_version: "alchlang.application-source-trace/v1", source_sha256: digest(source), bindings_sha256: digest(json(input)),
    declarations: [...trace, ...formal.trace.declarations], project_files: Object.fromEntries(Object.entries(projectFiles).map(([path, bytes]) => [path, digest(bytes)])),
    formed_files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => order(a, b)).map(([path, bytes]) => [path, { sha256: digest(bytes), size_bytes: Buffer.byteLength(bytes) }])),
    formation_only: true, executable_realization: "required", authority_effect: "none" };
  return { model, feature, symbols, projectFiles, files, conditions, operationShapes: shapes, queryShapes: queries, trace: fullTrace, ...(persistence ? { persistence } : {}), ...(messaging ? { messaging } : {}), ...(externalApi ? { externalApi } : {}), ...(runtime ? { runtime } : {}) };
}

/** Re-form against exact inputs, rather than trusting a possibly edited trace. */
export function assertApplicationDomainCurrent(source: string, input: unknown, sources: ReadonlyMap<string, Buffer>, candidate: unknown, persistenceContext?: ApplicationPersistenceContext, messagingContext?: ApplicationMessagingContext, externalApiContext?: ApplicationExternalApiContext, runtimeContext?: ApplicationRuntimeContext): void {
  const expected = lowerApplicationDomain(source, input, sources, persistenceContext, messagingContext, externalApiContext, runtimeContext);
  if (json(candidate) !== json(expected)) reject("APPLICATION_FORMATION_STALE", "$formation", "formed source, metadata or trace differs from exact current inputs");
}
