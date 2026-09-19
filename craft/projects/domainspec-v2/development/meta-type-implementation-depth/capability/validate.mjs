#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../../../..");
const requireReceipt = process.argv.includes("--require-receipt");
const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
let checks = 0;
function assert(value, message) { checks += 1; if (!value) throw new Error(message); }
function selectorBytes(path, selector) {
  const bytes = readFileSync(path);
  if (selector === "$") return bytes;
  const text = bytes.toString("utf8");
  const start = text.indexOf(selector);
  assert(start >= 0, `missing selector:${selector}`);
  const next = text.indexOf("\n## ", start + selector.length);
  return Buffer.from(text.slice(start, next < 0 ? text.length : next));
}

const profile = load(resolve(here, "profile.json"));
const capability = load(resolve(here, "product-capability.json"));
const ontology = load(resolve(here, "business-ontology.json"));
const schema = load(resolve(here, "schema.json"));
const decisionPath = resolve(here, profile.adoption_decision_ref);
assert(existsSync(decisionPath), "missing owner adoption decision");
const decision = load(decisionPath);

for (const [name, def, value] of [["profile","profile",profile],["product-capability","productCapability",capability],["business-ontology","businessOntology",ontology],["owner-decision","ownerDecision",decision]]) {
  const run = spawnSync("python3", ["-c", "import json,sys; from jsonschema import Draft202012Validator; s=json.load(open(sys.argv[1])); v=json.load(open(sys.argv[2])); w={'$schema':'https://json-schema.org/draft/2020-12/schema','$defs':s['$defs'],'$ref':'#/$defs/'+sys.argv[3]}; Draft202012Validator.check_schema(w); Draft202012Validator(w).validate(v)", resolve(here,"schema.json"), name === "owner-decision" ? decisionPath : resolve(here, name === "product-capability" ? "product-capability.json" : name === "business-ontology" ? "business-ontology.json" : "profile.json"), def], {encoding:"utf8"});
  assert(run.status === 0, `${name} schema validation failed:${(run.stderr || run.stdout).trim()}`);
}

assert(profile.product_capability_ref === "domainspec.meta-type-semantic-enforcement", "profile capability identity drift");
assert(profile.business_ontology_ref === "domainspec.meta-type-semantic-enforcement-ontology@1", "profile ontology identity drift");
assert(profile.status === "owner-adopted", "profile adoption drift");
assert(capability.capability_id === profile.product_capability_ref, "capability closure drift");
assert(capability.business_ontology_ref === profile.business_ontology_ref, "capability ontology ref drift");
assert(capability.definition_ref === "CAV2-D67", "Product Capability definition drift");
assert(capability.lifecycle_posture.status === "owner-adopted", "capability not owner adopted");
assert(ontology.ontology_id === profile.business_ontology_ref, "ontology identity drift");
assert(ontology.product_capability_ref === profile.product_capability_ref, "ontology capability closure drift");
assert(ontology.status === "owner-adopted", "ontology not owner adopted");
assert(profile.predecessor_baseline.baseline_id === "domainspec-meta-types-current-implemented@10", "predecessor identity drift");
assert(profile.predecessor_baseline.baseline_digest === "bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda", "predecessor digest drift");
assert(profile.predecessor_baseline.effect === "immutable-predecessor-not-rewritten", "predecessor mutation policy drift");

const definitionBytes = selectorBytes(resolve(repo, capability.definition_source.path), capability.definition_source.selector);
assert(sha(definitionBytes) === capability.definition_source.sha256, "CAV2-D67 selected bytes drift");
for (const source of ontology.source_bindings) {
  const path = resolve(repo, source.path);
  assert(existsSync(path), `missing ontology source:${source.source_id}`);
  assert(sha(selectorBytes(path, source.selector)) === source.sha256, `ontology source drift:${source.source_id}`);
}

const nodeIds = ontology.nodes.map(({node_id}) => node_id);
assert(new Set(nodeIds).size === nodeIds.length, "duplicate ontology node");
for (const relation of ontology.relations) {
  assert(nodeIds.includes(relation.from), `dangling relation source:${relation.relation_id}`);
  assert(nodeIds.includes(relation.to), `dangling relation target:${relation.relation_id}`);
}
assert(capability.owner_routes.length === 5, "Product Capability requires five owner routes");
assert(capability.obligations.length === 5, "capability obligation denominator drift");
assert(capability.obligations.every(({status}) => status === "not-assessed"), "adoption inflated obligation evidence");
assert(capability.predecessor.mutation_policy === "immutable", "baseline predecessor not immutable");
assert(decision.selected.product_capability_id === profile.product_capability_ref, "decision capability selection drift");
assert(decision.selected.business_ontology_id === profile.business_ontology_ref, "decision ontology selection drift");
assert(decision.selected.cli_successor_version === "0.0.0-candidate.3", "decision CLI successor drift");
assert(decision.selected.predecessor_baseline_id === profile.predecessor_baseline.baseline_id, "decision predecessor drift");

const material = [...profile.material_files].sort();
const digest = createHash("sha256");
for (const relative of material) {
  const path = resolve(here, relative);
  assert(existsSync(path), `missing material file:${relative}`);
  digest.update(relative); digest.update("\0"); digest.update(readFileSync(path)); digest.update("\0");
}
const packageDigest = digest.digest("hex");
assert(decision.candidate_package_digest === packageDigest, "owner decision does not bind current package digest");

if (requireReceipt) {
  const root = resolve(here, profile.receipt_root);
  const names = readdirSync(root).filter((name) => name.endsWith(".json")).sort();
  assert(names.length > 0, "validation receipt required");
  const receipt = load(resolve(root, names.at(-1)));
  assert(receipt.package_digest === packageDigest, "latest receipt package digest stale");
  assert(receipt.result === "pass" && receipt.authority_effect === "none", "receipt claim ceiling widened");
}

process.stdout.write(`${JSON.stringify({status:"pass",package_id:profile.package_id,product_capability_ref:profile.product_capability_ref,business_ontology_ref:profile.business_ontology_ref,predecessor_baseline_id:profile.predecessor_baseline.baseline_id,package_digest:packageDigest,checks,authority_effect:profile.authority_effect,claim_ceiling:"owner-adopted capability and business ontology; implementation conformance and external effects remain unproven"}, null, 2)}\n`);
