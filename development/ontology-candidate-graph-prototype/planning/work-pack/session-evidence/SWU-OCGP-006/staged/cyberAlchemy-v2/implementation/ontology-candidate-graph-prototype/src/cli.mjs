import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { validateCandidateCarrier } from "./contracts/candidate-v1.mjs";
import { evaluateEdgeGrammar } from "./evaluator/edge-grammar.mjs";
import { evaluateGrounding } from "./evaluator/grounding.mjs";
import { evaluatePolicy, POLICY_DIGEST } from "./evaluator/policy-disposition.mjs";
import { writeRunBundle } from "./evidence/run-writer.mjs";
import { projectResearchLineage } from "./projection/research-lineage.mjs";

const CASES = new URL("../fixtures/cases/", import.meta.url);
const FIXTURES = new URL("../fixtures/", import.meta.url);
const readJson = async (url) => JSON.parse(await readFile(url, "utf8"));

export async function evaluatePokerTeamO13({
  outDir,
  runMetadata = {},
  isolationAttestation = null,
  failBeforeReceipt = false,
  receiptContext = {},
} = {}) {
  const descriptor = await readJson(new URL("poker-team-o13.v1.json", CASES));
  const graph = await readJson(new URL(descriptor.base_case, CASES));
  graph.edges.push(...descriptor.added_edges);
  const policy = await readJson(new URL("policy.v1.json", FIXTURES));
  const carrierResult = validateCandidateCarrier(graph);
  const edgeResult = evaluateEdgeGrammar(graph);
  const groundingResult = evaluateGrounding(graph);
  const graphPolicy = evaluatePolicy({
    policy,
    policyDigest: POLICY_DIGEST,
    carrierResult,
    edgeResult,
    groundingResult,
  });
  const candidateDispositions = graph.relation_candidates
    .map((candidate) => {
      const disposition = evaluatePolicy({
        policy,
        policyDigest: POLICY_DIGEST,
        carrierResult,
        edgeResult,
        groundingResult,
        relationCandidate: candidate,
      });
      return {
        candidate_id: candidate.candidate_id,
        disposition: disposition.disposition,
        reason: disposition.codes[0],
        authority_effect: "none",
      };
    })
    .sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));
  const projection = projectResearchLineage({
    graph,
    policyResult: graphPolicy,
    groundingResult,
  });
  const result = {
    graph_disposition: {
      disposition: graphPolicy.disposition,
      reason: graphPolicy.codes[0],
      authority_effect: "none",
    },
    candidate_dispositions: candidateDispositions,
    grounding_closure: {
      nodes: projection.grounding_path.slice().reverse(),
      edges: graph.edges
        .filter(({ predicate }) => predicate === "derives-from")
        .map(({ edge_id }) => edge_id)
        .sort(),
    },
    non_composing_conflicts: graph.edges
      .filter(({ predicate }) => predicate === "contradicts")
      .map(({ edge_id }) => edge_id)
      .sort(),
  };
  return writeRunBundle({
    outDir,
    result,
    projection,
    isolationAttestation,
    runMetadata,
    receiptContext,
    failBeforeReceipt,
    inputDigests: {
      "fixtures/cases/carrier-minimal.v1.json":
        "8eaef57147ec4b443bb0049d2d0e0bfcaca7d61399ec10bd9a1a43827a26223c",
      "fixtures/cases/poker-team-o13.v1.json":
        "e9595cc8956b6263559b1aae0db9fbc3a83d51d67e305dcb68f60b198db80376",
      "fixtures/policy.v1.json":
        "16f9b212721e888b4caefb84c71e4a1d441a707d798ac19eb86418a1f61aeb97",
    },
    evaluatorDigests: {
      "src/contracts/candidate-v1.mjs":
        "3cc40d3fdd62aded29982b24486924b5bdd5efa4ce566e98bc1329c072e13fa0",
      "src/evaluator/edge-grammar.mjs":
        "49127c855f56334cc72050a3256d8848ba915a65e9067fd1a877987356005760",
      "src/evaluator/grounding.mjs":
        "bd3c690cf06dbd40df868d8b35a483cf1de3f52a92d0c2c9ef795e2b5976d333",
      "src/evaluator/policy-disposition.mjs":
        "673fd3d781dc3609e599b0fc2d2af1e69684dcb65328cf67100decafb2e5f680",
      "src/projection/research-lineage.mjs":
        "15eb4991f6aabc262276cd589ff72b13bd7acd606178ec6fbce52016ad7ede73",
    },
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outIndex = process.argv.indexOf("--out");
  if (outIndex < 0 || !process.argv[outIndex + 1]) throw new Error("--out is required");
  const response = await evaluatePokerTeamO13({ outDir: process.argv[outIndex + 1] });
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
