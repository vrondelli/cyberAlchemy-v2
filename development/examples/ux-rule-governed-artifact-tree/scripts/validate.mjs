import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const errors = [];
const flags = [];

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
}

function check(condition, message) {
  if (!condition) errors.push(message);
}

function checkFile(relativePath, label = "file") {
  const cleanPath = relativePath.split("#", 1)[0];
  const present = existsSync(resolve(root, cleanPath));
  check(present, `${label} is missing: ${relativePath}`);
  return present;
}

function parseFrontmatter(relativePath) {
  const text = readFileSync(resolve(root, relativePath), "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  check(Boolean(match), `frontmatter is missing: ${relativePath}`);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf(":");
        check(separator > 0, `invalid frontmatter line in ${relativePath}: ${line}`);
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}

const tree = readJson("tree.json");
const nodeDocument = readJson(tree.ontology.nodes);
const relationDocument = readJson(tree.ontology.relations);

const requiredTreeFields = [
  "tree_id",
  "scope",
  "owner_route",
  "canonical_source",
  "view_roles",
  "evidence_inputs",
  "promotion_path",
  "validation_surface",
  "challenge_contract",
  "drift_route",
  "allowed_use",
  "blocked_use"
];

for (const field of requiredTreeFields) {
  check(tree[field] !== undefined && tree[field] !== null, `tree field is missing: ${field}`);
}

check(tree.example_only === true, "tree must remain example_only");
check(tree.tree_status === "candidate", "tree status must remain candidate");
checkFile(tree.canonical_source, "canonical source");

for (const path of [...tree.evidence_inputs, ...tree.validation_surface]) {
  checkFile(path, "tree reference");
}

for (const source of tree.model_sources) {
  checkFile(source.path, "model source");
}

const canonicalRollupSnapshot = new Map([
  ["discovery", "Evidence"],
  ["research", "Evidence"],
  ["decision", "Decision"],
  ["spec", "Spec"],
  ["runtime contract", "Runtime contract"],
  ["review", "Evidence"],
  ["residue", "Residue"],
  ["projection", "Projection"]
]);

const artifactIds = new Set();
const artifactPaths = new Set();

for (const artifact of tree.artifacts) {
  check(!artifactIds.has(artifact.artifact_id), `duplicate artifact id: ${artifact.artifact_id}`);
  artifactIds.add(artifact.artifact_id);
  artifactPaths.add(artifact.path);
  if (!checkFile(artifact.path, "artifact")) continue;

  const frontmatter = parseFrontmatter(artifact.path);
  for (const field of [
    "artifact_id",
    "canonical_kind",
    "authority_kind",
    "process_origin",
    "durability",
    "authority_state",
    "example_status"
  ]) {
    check(Boolean(frontmatter[field]), `${artifact.path} is missing frontmatter field: ${field}`);
  }

  check(
    frontmatter.artifact_id === artifact.artifact_id,
    `${artifact.path} artifact_id does not match tree.json`
  );
  check(
    canonicalRollupSnapshot.has(frontmatter.canonical_kind),
    `${artifact.path} uses a canonical kind outside the example snapshot: ${frontmatter.canonical_kind}`
  );
  check(
    canonicalRollupSnapshot.get(frontmatter.canonical_kind) === frontmatter.authority_kind,
    `${artifact.path} has an invalid canonical-kind rollup`
  );
  check(
    ["ephemeral", "perennial"].includes(frontmatter.durability),
    `${artifact.path} has an invalid durability: ${frontmatter.durability}`
  );
  check(
    ["none", "candidate", "promoted", "demoted"].includes(frontmatter.authority_state),
    `${artifact.path} has an invalid authority_state: ${frontmatter.authority_state}`
  );
  check(frontmatter.example_status === "illustrative", `${artifact.path} must remain illustrative`);
  check(frontmatter.authority_state !== "promoted", `${artifact.path} must not claim promoted authority`);
}

const allowedArtifactPredicates = new Set([
  "derives-from",
  "implements",
  "validates",
  "depends-on",
  "rollup",
  "consumed-by",
  "supersedes",
  "updates",
  "deprecates",
  "contradicts",
  "alternative-to",
  "questions",
  "refines",
  "exemplifies",
  "contextualizes",
  "flags"
]);

for (const edge of tree.artifact_edges) {
  check(artifactIds.has(edge.source), `artifact edge source is unknown: ${edge.source}`);
  check(artifactIds.has(edge.target), `artifact edge target is unknown: ${edge.target}`);
  check(allowedArtifactPredicates.has(edge.predicate), `artifact edge predicate is unknown: ${edge.predicate}`);
}

const requiredNodeFields = [
  "concept_id",
  "label",
  "concept_role",
  "source_refs",
  "owner_route",
  "candidate_status",
  "confidence",
  "challenge_contract",
  "forbidden_collapse"
];
const allowedNodeRoles = new Set([
  "authority object",
  "evidence object",
  "workflow object",
  "projection object",
  "residue object"
]);
const allowedCandidateStatuses = new Set([
  "candidate",
  "reviewed-candidate",
  "deferred",
  "blocked",
  "projected"
]);
const requiredChallengeFields = [
  "challenge_response",
  "valid_challenge_modes",
  "contradiction_edges",
  "validation_edges",
  "owner_route",
  "resolution_gate",
  "blocking_questions",
  "challenge_residue_route"
];

const nodeIds = new Set();
const nodeSourcePaths = new Set();

for (const node of nodeDocument.nodes) {
  check(!nodeIds.has(node.concept_id), `duplicate node id: ${node.concept_id}`);
  nodeIds.add(node.concept_id);

  for (const field of requiredNodeFields) {
    check(node[field] !== undefined && node[field] !== null, `${node.concept_id} is missing: ${field}`);
  }
  check(allowedNodeRoles.has(node.concept_role), `${node.concept_id} has an invalid concept_role`);
  check(
    allowedCandidateStatuses.has(node.candidate_status),
    `${node.concept_id} has an invalid candidate_status`
  );
  check(
    Boolean(node.confidence?.evidence_confidence) && Boolean(node.confidence?.commitment_confidence),
    `${node.concept_id} must separate evidence and commitment confidence`
  );
  check(
    Array.isArray(node.forbidden_collapse) && node.forbidden_collapse.length > 0,
    `${node.concept_id} must declare forbidden_collapse`
  );

  for (const field of requiredChallengeFields) {
    check(
      node.challenge_contract?.[field] !== undefined && node.challenge_contract?.[field] !== null,
      `${node.concept_id} challenge_contract is missing: ${field}`
    );
  }

  for (const ref of node.source_refs) {
    const cleanRef = ref.split("#", 1)[0];
    nodeSourcePaths.add(cleanRef);
    checkFile(ref, `${node.concept_id} source_ref`);
  }
}

const unmappedArtifactIds = new Set();
for (const gap of nodeDocument.unmapped_artifacts ?? []) {
  check(artifactIds.has(gap.artifact_id), `unmapped artifact is unknown: ${gap.artifact_id}`);
  check(Boolean(gap.reason), `unmapped artifact lacks reason: ${gap.artifact_id}`);
  check(Boolean(gap.owner_route), `unmapped artifact lacks owner route: ${gap.artifact_id}`);
  check(gap.status === "residue", `unmapped artifact must remain residue: ${gap.artifact_id}`);
  unmappedArtifactIds.add(gap.artifact_id);
  flags.push(`unmapped artifact preserved as residue: ${gap.artifact_id}`);
}

for (const artifact of tree.artifacts) {
  check(
    nodeSourcePaths.has(artifact.path) || unmappedArtifactIds.has(artifact.artifact_id),
    `artifact is neither source-linked nor explicitly unmapped: ${artifact.artifact_id}`
  );
}

const externalEndpointIds = new Set(
  relationDocument.external_endpoints.map((endpoint) => endpoint.endpoint_id)
);
const relationEndpointIds = new Set([...nodeIds, ...externalEndpointIds]);
const allowedRelationEffects = new Map([
  ["classifies_authority_kind", "staging"],
  ["declares_source_posture", "staging"],
  ["uses_owner_profile", "staging"],
  ["requests_promotion_gate", "staging"],
  ["uses_lifecycle_axis", "projection"],
  ["decides_transition", "owner-decision"],
  ["emits_projection_when_allowed", "projection"],
  ["supports_candidate", "staging"],
  ["records_residue", "staging"],
  ["routes_drift_to", "staging"]
]);
const relationIds = new Set();

for (const relation of relationDocument.relations) {
  check(!relationIds.has(relation.relation_id), `duplicate relation id: ${relation.relation_id}`);
  relationIds.add(relation.relation_id);
  check(
    allowedRelationEffects.has(relation.relation_id),
    `relation is outside the candidate relation model: ${relation.relation_id}`
  );
  check(
    relationEndpointIds.has(relation.source_concept),
    `${relation.relation_id} has an unknown source endpoint: ${relation.source_concept}`
  );
  check(
    relationEndpointIds.has(relation.target_concept),
    `${relation.relation_id} has an unknown target endpoint: ${relation.target_concept}`
  );
  check(
    allowedRelationEffects.get(relation.relation_id) === relation.authority_effect,
    `${relation.relation_id} has an invalid authority_effect`
  );
  check(Boolean(relation.owner_route), `${relation.relation_id} lacks owner_route`);
  check(Boolean(relation.forbidden_collapse), `${relation.relation_id} lacks forbidden_collapse`);
  check(relation.record_status === "proposed", `${relation.relation_id} must remain proposed`);
  for (const ref of relation.evidence_refs ?? []) {
    checkFile(ref, `${relation.relation_id} evidence_ref`);
  }
}

for (const fixture of tree.fixtures) {
  checkFile(fixture.path, "fixture");
  check(["pass", "block"].includes(fixture.expected), `${fixture.path} has an invalid expected result`);
}

flags.push(...tree.known_gaps);

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} package integrity error(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("PASS: example package link integrity");
  console.log(`- artifacts: ${tree.artifacts.length}`);
  console.log(`- artifact edges: ${tree.artifact_edges.length}`);
  console.log(`- ontology nodes: ${nodeDocument.nodes.length}`);
  console.log(`- ontology relations: ${relationDocument.relations.length}`);
  console.log(`- fixtures: ${tree.fixtures.length}`);
  console.log(`FLAG: ${flags.length} intentionally unresolved item(s)`);
  for (const flag of flags) console.log(`- ${flag}`);
}

