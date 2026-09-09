import {canonicalJson, digest, deepFreeze} from "../../request-intent-runtime/src/canonical.mjs";
import {verifyBenchmarkRegistration} from "./benchmark-registration.mjs";

function check(condition, code) {if (!condition) throw Error(code);}

// Edges point from prerequisite material to its dependent, not in ontology
// relation direction. This is logical research order, not a timestamp claim.
export function materializeResearchDag({registrations = [], lineage = [], verify_registration = verifyBenchmarkRegistration} = {}) {
  check(typeof verify_registration === "function", "research-dag.verifier-required");
  check(Array.isArray(registrations) && Array.isArray(lineage), "research-dag.invalid-input");
  check(registrations.length <= 10000 && lineage.length <= 10000, "research-dag.capacity-exceeded");
  const nodes = new Map(), edges = new Map(), sources = new Set();
  function node(record, kind, label, registration) {
    const value = {node_id: record.record_id, kind, label, source_digest: digest(record),
      state: kind === "question" ? "open" : "recorded", lane: "product-construction",
      ...(kind === "observation" ? {outcome: record.observation_kind} : {}),
      ...(kind === "decision" ? {disposition: record.disposition} : {})};
    const existing = nodes.get(value.node_id);
    check(!existing || canonicalJson(existing.material) === canonicalJson(value), "research-dag.node-conflict");
    if (!existing) nodes.set(value.node_id, {material: value, registrations: new Set()});
    nodes.get(value.node_id).registrations.add(registration);
  }
  function edge(from, to, kind, provenance) {
    check(nodes.has(from) && nodes.has(to), "research-dag.missing-reference");
    check(from !== to, "research-dag.self-cycle");
    const value = {from, to, kind, provenance};
    edges.set(digest(value), value);
  }
  for (const r of registrations) {
    check(verify_registration(r) === true, "research-dag.invalid-registration");
    if (sources.has(r.registration_digest)) continue;
    sources.add(r.registration_digest);
    const bySchema = schema => r.records.find(x => x.schema_version === schema);
    const h = bySchema("are.research-hypothesis/v1"), e = bySchema("are.research-experiment/v1"),
      o = bySchema("are.hypothesis-observation/v1"), d = bySchema("are.learning-decision/v1");
    node(h, "hypothesis", h.statement, r.registration_digest);
    node(r.implementation, "implementation", "Exact historical implementation evidence", r.registration_digest);
    node(e, "experiment", r.experiment_id, r.registration_digest);
    node(o, "observation", o.claim, r.registration_digest);
    node(d, "decision", d.disposition, r.registration_digest);
    node(r.question, "question", r.question.question, r.registration_digest);
    for (const [from,to,kind] of [[h.record_id,e.record_id,"tests"], [r.implementation.record_id,e.record_id,"evaluates"],
      [e.record_id,o.record_id,"produces"], [o.record_id,d.record_id,"assesses"], [d.record_id,r.question.record_id,"opens-question"]]) {
      edge(from,to,kind,`registration:${r.registration_digest}`);
    }
  }
  const declarations = new Map();
  for (const link of lineage) {
    check(link && Object.keys(link).every(k => ["question_ref", "hypothesis_ref", "source_ref"].includes(k))
      && [link.question_ref,link.hypothesis_ref,link.source_ref].every(x => typeof x === "string" && x.trim()), "research-dag.invalid-lineage");
    check(nodes.get(link.question_ref)?.material.kind === "question" && nodes.get(link.hypothesis_ref)?.material.kind === "hypothesis", "research-dag.lineage-types-invalid");
    const declaration = {...link};
    declarations.set(digest(declaration), declaration);
    edge(link.question_ref,link.hypothesis_ref,"informs-successor",link.source_ref);
  }
  const orderedNodes = [...nodes.values()].map(n => ({...n.material, registration_refs: [...n.registrations].sort()})).sort((a,b) => a.node_id < b.node_id ? -1 : 1);
  const orderedEdges = [...edges.entries()].sort(([a],[b]) => a < b ? -1 : 1).map(([edge_id,e]) => ({edge_id,...e}));
  const incoming = new Map(orderedNodes.map(n => [n.node_id,0])), outgoing = new Map(orderedNodes.map(n => [n.node_id,[]]));
  for (const e of orderedEdges) {incoming.set(e.to,incoming.get(e.to)+1);outgoing.get(e.from).push(e.to);}
  let ready = [...incoming.keys()].filter(id => incoming.get(id) === 0).sort();
  const layers = [], order = [];
  while (ready.length) {
    layers.push(ready);order.push(...ready);
    const next = [];
    for (const id of ready) for (const to of outgoing.get(id)) {incoming.set(to,incoming.get(to)-1);if(incoming.get(to)===0)next.push(to);}
    ready = next.sort();
  }
  check(order.length === nodes.size, "research-dag.cycle-detected");
  const material = {schema_version: "are.research-dag/v1", ontology_id: "are.research-learning",
    registration_digests: [...sources].sort(), lineage: [...declarations.entries()].sort(([a],[b]) => a < b ? -1 : 1).map(([,v]) => v),
    nodes: orderedNodes, edges: orderedEdges, topological_order: order, dependency_layers: layers,
    research_frontier: orderedNodes.filter(n => n.kind === "question" && outgoing.get(n.node_id).length === 0).map(n => n.node_id),
    claim_ceiling: "Logical research dependency projection; not historical preregistration, causal proof, scheduling readiness or effect authority.",
    authority_effect: "none"};
  return deepFreeze({...material, dag_digest: digest(material)});
}

export function verifyResearchDag(record, registrations, verify_registration = verifyBenchmarkRegistration) {
  try {return canonicalJson(record) === canonicalJson(materializeResearchDag({registrations, lineage: record.lineage, verify_registration}));}
  catch {return false;}
}
