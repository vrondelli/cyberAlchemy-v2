import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, "../../../../../../..");
const readJson = (relative) => JSON.parse(readFileSync(path.join(here, relative), "utf8"));
const digest = (absolute) => createHash("sha256").update(readFileSync(absolute)).digest("hex");
const fail = (message) => { throw new Error(`DS_INTEGRATION_ONTOLOGY_SCAFFOLD: ${message}`); };
const unique = (values, label) => { if (new Set(values).size !== values.length) fail(`duplicate ${label}`); };

const profile = readJson("profile.json");
const conceptsDoc = readJson("concepts.json");
const relationsDoc = readJson("relations.json");
const invariantsDoc = readJson("invariants.json");
const sourcesDoc = readJson("sources.json");
readJson("schema/integration-ontology-scaffold.schema.json");

for (const document of [profile, conceptsDoc, relationsDoc, invariantsDoc, sourcesDoc]) {
  if (document.ontology_id !== "domainspec.integration-scaffold@1") fail("ontology identity drift");
  if (document.authority_effect !== "none") fail("authority effect inflated");
}
if (profile.status !== "candidate" || profile.implementation_effect !== "none" || profile.runtime.ontology_runtime_required !== false) fail("profile claim ceiling inflated");
if (JSON.stringify(profile.language_denominator) !== JSON.stringify(["typescript", "python", "rust"])) fail("language denominator drift");

const sources = new Map(sourcesDoc.sources.map((source) => [source.source_id, source]));
unique([...sources.keys()], "source identity");
for (const source of sources.values()) {
  const absolute = path.join(workspace, source.path);
  if (digest(absolute) !== source.sha256) fail(`source drift:${source.path}`);
}

const definitionSource = sources.get("definition-pack");
if (!definitionSource) fail("definition source missing");
const definitions = JSON.parse(readFileSync(path.join(workspace, definitionSource.path), "utf8"));
if (definitions.pack_id !== profile.definition_pack_id || definitionSource.sha256 !== profile.definition_pack_sha256) fail("definition pack binding drift");
const definitionsById = new Map(definitions.concepts.map((concept) => [concept.concept_id, concept]));
const concepts = new Map(conceptsDoc.concepts.map((concept) => [concept.concept_id, concept]));
unique([...concepts.keys()], "concept identity");
if (concepts.size !== 36 || concepts.size !== definitionsById.size || [...definitionsById.keys()].some((id) => !concepts.has(id))) fail("36-definition closure mismatch");
for (const concept of concepts.values()) {
  const definition = definitionsById.get(concept.concept_id);
  if (!definition || concept.label !== definition.term || concept.definition_disposition !== definition.current_disposition) fail(`definition projection drift:${concept.concept_id}`);
  if (concept.definition_ref !== `${definitions.pack_id}#${concept.concept_id}` || concept.status !== "candidate-projection" || concept.authority_effect !== "none") fail(`concept claim drift:${concept.concept_id}`);
  const active = concept.definition_disposition === "reuse";
  if (active !== (concept.evidence_confidence === "canonical-source-backed" && concept.commitment_confidence === "active-domain-definition")) fail(`confidence posture drift:${concept.concept_id}`);
}

unique(relationsDoc.relations.map((relation) => relation.relation_id), "relation identity");
for (const relation of relationsDoc.relations) {
  if (!concepts.has(relation.from) || !concepts.has(relation.to)) fail(`unresolved relation:${relation.relation_id}`);
  for (const sourceRef of relation.evidence_refs) if (!sources.has(sourceRef)) fail(`unresolved relation evidence:${relation.relation_id}`);
}
const expectedSpecializations = definitions.concepts.filter((concept) => concept.current_disposition === "specialize").map((concept) => `${concept.concept_id}->${concept.parent_definition_ref}`).sort();
const actualSpecializations = relationsDoc.relations.filter((relation) => relation.type === "specializes").map((relation) => `${relation.from}->${relation.to}`).sort();
if (JSON.stringify(expectedSpecializations) !== JSON.stringify(actualSpecializations)) fail("specialization edge closure mismatch");

unique(invariantsDoc.invariants.map((invariant) => invariant.invariant_id), "invariant identity");
const expectedAxioms = [...definitions.non_collapse_axioms].sort();
const actualAxioms = invariantsDoc.invariants.map((invariant) => invariant.expression).sort();
if (JSON.stringify(expectedAxioms) !== JSON.stringify(actualAxioms)) fail("non-collapse invariant closure mismatch");
for (const invariant of invariantsDoc.invariants) if (invariant.kind !== "non-collapse" || invariant.status !== "candidate" || invariant.authority_effect !== "none") fail(`invariant posture drift:${invariant.invariant_id}`);

console.log(JSON.stringify({
  schema_version: "domainspec.integration-ontology-scaffold-validation/v1",
  result: "pass",
  ontology_id: profile.ontology_id,
  definition_pack_sha256: profile.definition_pack_sha256,
  concept_count: concepts.size,
  relation_count: relationsDoc.relations.length,
  invariant_count: invariantsDoc.invariants.length,
  ontology_runtime_used: false,
  authority_effect: "none"
}, null, 2));
