import { CompilationRejected } from "./model.js";
import { digest, json } from "./domainspec-profile.js";
import { lowerApplicationRuleProjections } from "./application-rule-projection.js";
import { deriveApplicationRealizationActions, deriveApplicationRealizationCompositions } from "./application-realization-actions.js";
import type { DomainSpecCompiler, DomainSpecGraph } from "./domainspec-cli.js";
import type { ApplicationPersistenceContext, ApplicationMessagingContext, ApplicationExternalApiContext, ApplicationRuntimeContext } from "./application-domain-lowering.js";

const fail = (code: string, message: string): never => { throw new CompilationRejected([{ code, path: "$execution", message }]); };
const equal = (a: unknown, b: unknown) => json(a) === json(b);
function sameSet(a: string[], b: string[], role: string): void {
  if (new Set(a).size !== a.length || !equal([...a].sort(), [...b].sort())) fail("APPLICATION_EXECUTION_COVERAGE", `${role} differs from authored source`);
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const prepared = new WeakSet<object>();

/** Validate authored realization choices; no files, providers or operations execute. */
export function prepareApplicationExecutable(source: string, bindings: unknown, sources: ReadonlyMap<string, Buffer>, interpretation: unknown, execution: unknown, compiler: DomainSpecCompiler, persistenceContext?: ApplicationPersistenceContext, messagingContext?: ApplicationMessagingContext, externalApiContext?: ApplicationExternalApiContext, runtimeContext?: ApplicationRuntimeContext) {
  const projection = lowerApplicationRuleProjections(source, bindings, sources, interpretation, persistenceContext, messagingContext, externalApiContext, runtimeContext);
  if (!execution || typeof execution !== "object" || Array.isArray(execution)) fail("APPLICATION_EXECUTION_SCHEMA", "expected execution binding");
  const input = execution as Record<string, unknown>;
  const authored = !!projection.formation.model.realizations?.length;
  const version = authored ? "alchlang.application-execution/v2-candidate" : "alchlang.application-execution/v1-candidate";
  if (!equal(Object.keys(input).sort(), ["projection_sha256", "schema_version", "selection"]) || input.schema_version !== version) fail("APPLICATION_EXECUTION_SCHEMA", "closed execution binding required; authored realizations require v2 without operation overrides");
  if (input.projection_sha256 !== digest(json(projection))) fail("APPLICATION_EXECUTION_STALE", "execution must bind exact current Rule projection");
  let selected = input.selection;
  if (authored) {
    if (!selected || typeof selected !== "object" || Array.isArray(selected) || Object.hasOwn(selected, "operations") || Object.hasOwn(selected,"value_compositions")) fail("APPLICATION_REALIZATION_OVERRIDE", "authored selection must omit operations and value_compositions; bindings are derived exclusively from realizations");
    const descriptors=Object.getOwnPropertyDescriptors(selected);
    if(![Object.prototype,null].includes(Object.getPrototypeOf(selected))||Reflect.ownKeys(descriptors).some(k=>typeof k!=='string')||Object.values(descriptors).some(d=>!Object.hasOwn(d,'value')||!d.enumerable))fail('APPLICATION_EXECUTION_SCHEMA','inert selection required');
    if(descriptors.schema_version?.value==='domainspec.reconciled-compilation/v2-candidate'){
      const derived=deriveApplicationRealizationCompositions(projection);
      selected={...(selected as Record<string,unknown>),operations:derived.map(row=>row.action),value_compositions:derived.map(({composition,absence_failures})=>({composition,absence_failures}))};
    }else selected = { ...(selected as Record<string, unknown>), operations: deriveApplicationRealizationActions(projection) };
  }
  const selection = compiler.decodeReconciledCompilationSelection(selected);
  const formation = projection.formation;
  if (formation.runtime && selection.language !== formation.runtime.selected.selection.language) fail("APPLICATION_RUNTIME_TARGET", "selected runtime and executable target differ");
  const shapes = formation.operationShapes.operations;
  sameSet(selection.operations.map((o: any) => o.selector), shapes.map(o => String(o.operation_ref)), "operation coverage");
  const projectFiles = { ...projection.projectFiles };
  const featurePath = `specs/${formation.feature}/feature.json`;
  const feature = JSON.parse(projectFiles[featurePath]!);
  const addEdge = (from: string, relationship: string, to: string) => {
    const sourceId = from.split(":")[1]!; const targetId = to.split(":")[1]!;
    const id = `${sourceId}-${relationship}-${targetId}`;
    const relative = `specs/${formation.feature}/edges/${id}.json`;
    const bytes = json({ schema_version: "domainspec.edge/v1", feature_id: formation.feature, edge_id: id,
      relationship, source_node_id: sourceId, target_node_id: targetId, scope: "feature" });
    if (projectFiles[relative] && projectFiles[relative] !== bytes) fail("APPLICATION_EXECUTION_COLLISION", relative);
    projectFiles[relative] = bytes;
    if (!feature.edges.includes(id)) feature.edges.push(id);
  };
  for (const operation of selection.operations) {
    const shape = shapes.find(o => o.operation_ref === operation.selector)!;
    if (operation.inputs.length !== 1 || !equal(operation.inputs[0].type, shape.input) || !equal(operation.result.type, shape.output)) {
      fail("APPLICATION_EXECUTION_SHAPE", "action input/output differs from authored operation");
    }
    sameSet(operation.guards.map((g: any) => g.selector), shape.guard_rule_refs as string[], "guards");
    const nodePath = `specs/${formation.feature}/nodes/${operation.selector.split(":")[1]}.json`;
    const body = JSON.parse(projectFiles[nodePath]!).body;
    const valueComposition=selection.value_compositions?.find((row:any)=>row.composition.operation_ref===operation.selector)?.composition;
    const queryReads=(valueComposition?.bindings??[]).filter((row:any)=>row.kind==='query').map((row:any)=>{
      const [feature,id]=row.selector.split(':');
      const source=JSON.parse(projectFiles[`specs/${feature}/nodes/${id}.json`]!).body.typed_contract.source;
      if(row.source_slot!==source)fail('APPLICATION_EXECUTION_SLOT','Query collection slots must retain the authored qualified source Entity');
      return source as string;
    });
    for (const lane of ["reads", "writes"] as const) {
      const targets=operation[lane].map((r:any)=>r.target);
      sameSet(lane==='reads'&&valueComposition?[...new Set([...targets,...queryReads])] as string[]:targets, body[lane], lane);
      for (const row of operation[lane]) if (row.slot !== row.target) fail("APPLICATION_EXECUTION_SLOT", "L0 slots must retain their authored qualified Entity reference");
    }
    sameSet(operation.events.map((event: any) => event.target), body.effects, "events");
    for (const event of operation.events) if (event.slot !== event.target) fail("APPLICATION_EXECUTION_SLOT", "Event slots must retain their authored qualified Event reference");
    operation.reads.forEach((r: any) => addEdge(operation.selector, "reads", r.target));
    [...new Set(queryReads)].forEach(target=>addEdge(operation.selector,'reads',target as string));
    operation.writes.filter((w: any) => w.mode === "create").forEach((w: any) => addEdge(operation.selector, "creates", w.target));
  }
  feature.edges.sort(); projectFiles[featurePath] = json(feature);
  const trace = { schema_version: "alchlang.application-executable-trace/v1-candidate", projection_sha256: digest(json(projection)),
    execution_sha256: digest(json(execution)), selection_sha256: digest(json(selection)),
    project_files: Object.fromEntries(Object.entries(projectFiles).map(([p, bytes]) => [p, { sha256: digest(bytes), size_bytes: Buffer.byteLength(bytes) }])),
    execution: "not-performed", authority_effect: "none" };
  const result = freeze({ projection, projectFiles, selection, trace }); prepared.add(result); return result;
}

/** Join the exact generated source graph through existing public DomainSpec APIs. */
export function compileApplicationExecutable(candidate: ReturnType<typeof prepareApplicationExecutable>, graph: DomainSpecGraph, compiler: DomainSpecCompiler) {
  if (!prepared.has(candidate)) fail("APPLICATION_EXECUTION_UNVALIDATED", "use the current prepared candidate");
  const rows = graph.source_manifest.sources;
  if (!rows) return fail("APPLICATION_EXECUTION_GRAPH", "graph source manifest is unavailable");
  if (!equal(rows.map(r => r.relative_path).sort(), Object.keys(candidate.projectFiles).sort())) fail("APPLICATION_EXECUTION_GRAPH", "graph source coverage differs");
  for (const row of rows) {
    const expected = candidate.trace.project_files[row.relative_path];
    if (!expected || expected.sha256 !== row.sha256 || expected.size_bytes !== row.size_bytes) fail("APPLICATION_EXECUTION_GRAPH", "graph source bytes differ");
  }
  const formation = candidate.projection.formation;
  if (formation.persistence) {
    for (const reference of formation.persistence.trace.references) {
      for (const query of reference.queries) {
        const body = graph.nodes.find(n => n.selector === query.selector && n.kind === "Query")?.body as any;
        const contract = body?.typed_contract;
        const cardinality = contract?.schema_version === "domainspec.typed-query/v1" ? "list" : contract?.result_cardinality;
        if (contract?.source !== reference.entity || cardinality !== query.result_cardinality) fail("APPLICATION_PERSISTENCE_QUERY_JOIN", "compiled Query differs from the authored persistence consumer");
      }
      for (const operation of reference.operations) {
        const selected = candidate.selection.operations.find((o: any) => o.selector === operation.selector);
        if (!selected?.writes.some((w: any) => w.target === reference.entity && w.slot === reference.entity)) fail("APPLICATION_PERSISTENCE_WRITE_JOIN", "executable Operation lacks the authored persistence write slot");
      }
    }
  }
  const messagingJoin = formation.messaging ? compiler.compileMessagingRuntimeBindings(graph, formation.messaging.sourceComposition, candidate.selection) : undefined;
  const externalApiJoin = formation.externalApi ? compiler.compileExternalApiRuntimeBindings(graph, formation.externalApi.sourceComposition, candidate.selection) : undefined;
  const join = compiler.compileFormalConditionBindings(graph, formation.conditions, new Map(Object.entries(formation.files).map(([p, bytes]) => [p, Buffer.from(bytes)])));
  const generated = compiler.planApplicationRealization(graph, candidate.selection);
  return { ...generated, join, ...(formation.persistence ? { persistence: formation.persistence } : {}), ...(formation.messaging ? { messaging: formation.messaging, messagingJoin } : {}), ...(formation.externalApi ? { externalApi: formation.externalApi, externalApiJoin } : {}), ...(formation.runtime ? { runtime: formation.runtime } : {}), trace: { ...candidate.trace, domain_manifest_sha256: graph.source_manifest.manifest_sha256,
    ...(externalApiJoin ? { external_api_composition_sha256: formation.externalApi!.trace.composition_sha256, external_api_join_sha256: digest(json(externalApiJoin)) } : {}),
    ...(messagingJoin ? { messaging_composition_sha256: formation.messaging!.trace.composition_sha256, messaging_join_sha256: digest(json(messagingJoin)) } : {}),
    ...(formation.persistence ? { persistence_composition_sha256: formation.persistence.trace.composition_sha256 } : {}),
    generated_files: Object.fromEntries(generated.view.artifacts.map(a => [a.relative_path, { sha256: a.sha256, size_bytes: a.size_bytes }])) } };
}
