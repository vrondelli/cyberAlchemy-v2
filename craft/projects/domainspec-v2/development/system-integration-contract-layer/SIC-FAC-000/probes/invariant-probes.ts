import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const main = async (): Promise<void> => {
const repositoryRoot = process.cwd();
const load = async (path: string) => import(pathToFileURL(resolve(repositoryRoot, path)).href);
const { canonicalJson, sha256 } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/shared/canonical.ts",
);
const { bindReplayVerifiedSemanticResult } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/pipeline/execute-factory-run.ts",
);
const { normalizeFactorySemanticReceipt } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/evidence/normalize-semantic-receipt.ts",
);
const { decodeLockedChildOutput, lockedComponentSetSha256 } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/factory/replay/run-locked-child.ts",
);
const { recomputeProofAccounting } = await load(
  "projects/domainspec-v2/impl/architecture-conformance/kernel/evidence/recompute-proof-accounting.ts",
);

const PROVIDER_ID = "sic-fac-fixture-provider-v1";
const WRONG_PROVIDER_ID = "sic-fac-forged-provider-v1";
const LOCKED_CLAIM = "sic-fac locked candidate evidence only";
const EXPANDED_CLAIM = "provider-expanded production claim";
const DENOMINATOR_PATH =
  "projects/domainspec-v2/development/system-integration-contract-layer/SIC-FAC-000/probes/fixture-denominator.json";

const errorCode = (error: unknown): string => {
  const typed = error as { code?: string; message?: string };
  return typed.code ?? typed.message ?? String(error);
};

const semanticResult = (providerId: string, claimCeiling: string) => Object.freeze({
  schema_version: "FactoryNodeSemanticResult/v1" as const,
  result: "pass" as const,
  provider_id: providerId,
  semantic_output: Object.freeze({ fixture: "sic-fac-000" }),
  accounting: Object.freeze({
    positives_declared: 1,
    positives_passed: 1,
    mutants_declared: 1,
    mutants_killed: 1,
  }),
  claim_ceiling: claimCeiling,
  authority_effect: "none" as const,
});

const componentDigest = lockedComponentSetSha256([]);
const envelope = (result: unknown) => ({
  schema_version: "FactoryReplayChildResult/v1",
  result: "pass",
  replay_mode: "same-oracle-deterministic",
  node_id: "sic-fac-probe-node",
  provider_id: PROVIDER_ID,
  provider_version: "1.0.0",
  component_identity: {
    algorithm: "sha256",
    locked_set_sha256: componentDigest,
    pre_load_sha256: componentDigest,
    post_execute_sha256: componentDigest,
  },
  semantic_result: result,
  semantic_result_sha256: sha256(canonicalJson(result)),
  authority_effect: "none",
});
const decode = (result: unknown) => decodeLockedChildOutput({
  rendered: `${JSON.stringify(envelope(result))}\n`,
  nodeId: "sic-fac-probe-node",
  providerId: PROVIDER_ID,
  providerVersion: "1.0.0",
  lockedComponentSetSha256: componentDigest,
});

let providerChildDecode: Record<string, unknown>;
try {
  decode(semanticResult(WRONG_PROVIDER_ID, LOCKED_CLAIM));
  providerChildDecode = { result: "accepted", fail_closed: false };
} catch (error) {
  providerChildDecode = { result: "rejected", fail_closed: true, code: errorCode(error) };
}
const wrongProvider = semanticResult(WRONG_PROVIDER_ID, LOCKED_CLAIM);
const wrongProviderDigest = sha256(canonicalJson(wrongProvider));
const stableWrongProvider = bindReplayVerifiedSemanticResult({
  node_id: "sic-fac-probe-node",
  direct_sha256: wrongProviderDigest,
  replay_result: wrongProvider,
  replay_result_sha256: wrongProviderDigest,
});

const expanded = semanticResult(PROVIDER_ID, EXPANDED_CLAIM);
let decodedExpanded: unknown;
let claimDecode: Record<string, unknown>;
try {
  decodedExpanded = decode(expanded);
  claimDecode = { result: "accepted", fail_closed: false };
} catch (error) {
  claimDecode = { result: "rejected", fail_closed: true, code: errorCode(error) };
}
const expandedDigest = sha256(canonicalJson(expanded));
const stableExpanded = bindReplayVerifiedSemanticResult({
  node_id: "sic-fac-probe-node",
  direct_sha256: expandedDigest,
  replay_result: decodedExpanded ?? expanded,
  replay_result_sha256: expandedDigest,
});

const denominatorFileBytes = await readFile(resolve(repositoryRoot, DENOMINATOR_PATH), "utf8");
const denominator = JSON.parse(denominatorFileBytes) as {
  owner_ref: string;
  obligation_ids: string[];
  mutants: Array<{ mutant_id: string; expected_finding_code: string }>;
};
const denominatorBytes = canonicalJson(denominator);
const denominatorSha256 = sha256(denominatorBytes);
const proof = Object.freeze({
  schema_version: "ProofEvidence/v1" as const,
  denominator_ref: Object.freeze({
    role: "proof-denominator" as const,
    path: DENOMINATOR_PATH,
    sha256: denominatorSha256,
  }),
  denominator_bytes: denominatorBytes,
  producer_ref: PROVIDER_ID,
  obligations: Object.freeze(denominator.obligation_ids.map((obligationId) => Object.freeze({
    obligation_id: obligationId,
    status: "passed" as const,
    observation_sha256: sha256(`observation:${obligationId}`),
  }))),
  mutants: Object.freeze(denominator.mutants.map((mutant) => Object.freeze({
    mutant_id: mutant.mutant_id,
    status: "killed" as const,
    finding_code: mutant.expected_finding_code,
    observation_sha256: sha256(`observation:${mutant.mutant_id}`),
  }))),
  authority_effect: "none" as const,
});

const plan = Object.freeze({
  schema_version: "FactoryRunPlan/v1" as const,
  request: Object.freeze({
    schema_version: "FactoryRunRequest/v1" as const,
    request_id: "sic-fac-probe-request",
    suite_id: "sic-fac-probe-suite",
    purpose: "new-kit-proof" as const,
    nodes: Object.freeze([Object.freeze({
      node_id: "sic-fac-probe-node",
      kind: "direct-proof" as const,
      provider_id: PROVIDER_ID,
      depends_on: Object.freeze([]),
      input_refs: Object.freeze([Object.freeze({
        role: "proof-denominator",
        ref: Object.freeze({ path: DENOMINATOR_PATH, sha256: denominatorSha256 }),
      })]),
      claim_ceiling: LOCKED_CLAIM,
    })]),
    claim_ceiling: LOCKED_CLAIM,
    authority_effect: "none" as const,
  }),
  lock: Object.freeze({
    schema_version: "FactoryRunLock/v1" as const,
    request_id: "sic-fac-probe-request",
    suite_id: "sic-fac-probe-suite",
    purpose: "new-kit-proof" as const,
    request_sha256: "1".repeat(64),
    ordered_node_ids: Object.freeze(["sic-fac-probe-node"]),
    nodes: Object.freeze([Object.freeze({
      node_id: "sic-fac-probe-node",
      kind: "direct-proof" as const,
      provider_id: PROVIDER_ID,
      provider_version: "1.0.0",
      depends_on: Object.freeze([]),
      inputs: Object.freeze([Object.freeze({
        role: "proof-denominator",
        path: DENOMINATOR_PATH,
        sha256: denominatorSha256,
        byte_length: Buffer.byteLength(denominatorBytes),
      })]),
      components: Object.freeze([]),
      tools: Object.freeze([]),
      claim_ceiling: LOCKED_CLAIM,
    })]),
    replay_policy: Object.freeze({
      timeout_ms: 1_000,
      output_limit_bytes: 1_048_576,
      termination_grace_ms: 100,
      environment_keys: Object.freeze([]),
    }),
    claim_ceiling: LOCKED_CLAIM,
    authority_effect: "none" as const,
    lock_sha256: "2".repeat(64),
  }),
  run_id: "sic-fac-probe-run",
  authority_effect: "none" as const,
});
const planWithoutDenominator = Object.freeze({
  ...plan,
  lock: Object.freeze({
    ...plan.lock,
    nodes: Object.freeze([Object.freeze({ ...plan.lock.nodes[0], inputs: Object.freeze([]) })]),
  }),
});

let providerNormalizeResultIdentity: Record<string, unknown>;
try {
  normalizeFactorySemanticReceipt({
    plan: planWithoutDenominator,
    nodes: [Object.freeze({
      node_id: "sic-fac-probe-node",
      provider_id: stableWrongProvider.provider_id,
      depends_on: Object.freeze([]),
      semantic_sha256: wrongProviderDigest,
      replay_sha256: wrongProviderDigest,
      accounting: stableWrongProvider.accounting,
      claim_ceiling: stableWrongProvider.claim_ceiling,
    })],
  });
  providerNormalizeResultIdentity = { result: "accepted", fail_closed: false };
} catch (error) {
  providerNormalizeResultIdentity = {
    result: "rejected",
    fail_closed: true,
    code: errorCode(error),
  };
}
const normalizedExecutorProviderProjection = normalizeFactorySemanticReceipt({
  plan: planWithoutDenominator,
  nodes: [Object.freeze({
    node_id: "sic-fac-probe-node",
    provider_id: PROVIDER_ID,
    depends_on: Object.freeze([]),
    semantic_sha256: wrongProviderDigest,
    replay_sha256: wrongProviderDigest,
    accounting: stableWrongProvider.accounting,
    claim_ceiling: stableWrongProvider.claim_ceiling,
  })],
});

const recomputed = recomputeProofAccounting({
  locked_denominator_ref: Object.freeze({
    role: "proof-denominator" as const,
    path: DENOMINATOR_PATH,
    sha256: denominatorSha256,
  }),
  provider_id: PROVIDER_ID,
  evidence: proof,
});
const normalizedDenominator = normalizeFactorySemanticReceipt({
  plan,
  nodes: [Object.freeze({
    node_id: "sic-fac-probe-node",
    provider_id: PROVIDER_ID,
    depends_on: Object.freeze([]),
    semantic_sha256: "3".repeat(64),
    replay_sha256: "3".repeat(64),
    accounting: Object.freeze({
      positives_declared: 1,
      positives_passed: 1,
      mutants_declared: 1,
      mutants_killed: 1,
      proof,
    }),
    claim_ceiling: LOCKED_CLAIM,
  })],
});
const normalizedClaim = normalizeFactorySemanticReceipt({
  plan: planWithoutDenominator,
  nodes: [Object.freeze({
    node_id: "sic-fac-probe-node",
    provider_id: PROVIDER_ID,
    depends_on: Object.freeze([]),
    semantic_sha256: expandedDigest,
    replay_sha256: expandedDigest,
    accounting: stableExpanded.accounting,
    claim_ceiling: stableExpanded.claim_ceiling,
  })],
});

process.stdout.write(`${JSON.stringify({
  schema_version: "SicFacInvariantProbe/v1",
  provider_id_mismatch: {
    child_decoder: providerChildDecode,
    bind_result_provider_id: stableWrongProvider.provider_id,
    normalize_result_identity: providerNormalizeResultIdentity,
    executor_shaped_outer_provider_id:
      normalizedExecutorProviderProjection.receipt.ordered_nodes[0].provider_id,
    locked_provider_id: PROVIDER_ID,
    result: providerChildDecode.fail_closed === true
      ? "end_to_end_rejected_by_child_decoder"
      : "accepted",
    fail_closed: providerChildDecode.fail_closed === true,
  },
  claim_ceiling_mismatch: {
    child_decoder: claimDecode,
    bind_result_claim_ceiling: stableExpanded.claim_ceiling,
    normalized_outer_claim_ceiling: normalizedClaim.receipt.ordered_nodes[0].claim_ceiling,
    locked_claim_ceiling: LOCKED_CLAIM,
    result: stableExpanded.claim_ceiling === EXPANDED_CLAIM &&
      normalizedClaim.receipt.ordered_nodes[0].claim_ceiling === LOCKED_CLAIM
      ? "accepted_and_masked"
      : "rejected",
    fail_closed: false,
  },
  denominator_accounting: {
    result: recomputed.result,
    denominator_path: DENOMINATOR_PATH,
    denominator_sha256: denominatorSha256,
    owner_ref: denominator.owner_ref,
    provider_id: PROVIDER_ID,
    independent_owner: denominator.owner_ref !== PROVIDER_ID,
    obligation_count: denominator.obligation_ids.length,
    mutant_count: denominator.mutants.length,
    totals: recomputed.totals,
    normalized_proof: normalizedDenominator.receipt.ordered_nodes[0].accounting.proof,
  },
  authority_effect: "none",
})}\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
