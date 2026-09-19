import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const WORKFLOW_CANDIDATE_ID =
  "candidate.settlement.ordered-workflow.workflow-implementation/v1" as const;
export const WORKFLOW_SEMANTIC_EPOCH =
  "WP-RMT-002/S1/2026-08-16" as const;
export const WORKFLOW_SEMANTIC_CONTRACT_SHA256 =
  "75fd21cd605735b9ca76ed42e46d126850b6c94ea976f55347aa35fd61d530b7" as const;

export const WORKFLOW_PROOF_SWUS = [
  "RMT-WF-006",
  "RMT-WF-007",
  "RMT-WF-008",
  "RMT-WF-009",
] as const;

export interface LockedRepositoryRef {
  path: string;
  sha256: string;
  size_bytes: number;
}

export interface WorkflowPredecessorInput {
  packet_schema: LockedRepositoryRef;
  packet_validator: LockedRepositoryRef;
  packet_closeout: LockedRepositoryRef;
  workflow_candidate: LockedRepositoryRef;
  workflow_projection_receipt: LockedRepositoryRef;
  proof_receipts: readonly (LockedRepositoryRef & { swu_id: string })[];
  required_evidence_lane: "candidate-local-prototype";
  synchronized_task_session_closeout: false;
  operation_type_completion_receipt: null;
  authority_effect: "none";
}

export type WorkflowPredecessorDiagnostic =
  | "AOP_WF_PREDECESSOR_PASS"
  | "AOP_WF_PREDECESSOR_INPUT_INVALID"
  | "AOP_WF_PREDECESSOR_PATH_ESCAPE"
  | "AOP_WF_PREDECESSOR_MISSING"
  | "AOP_WF_PREDECESSOR_STALE"
  | "AOP_WF_PREDECESSOR_PACKET"
  | "AOP_WF_PREDECESSOR_SUBJECT"
  | "AOP_WF_PREDECESSOR_RECEIPT"
  | "AOP_WF_PREDECESSOR_PROOF_CHAIN"
  | "AOP_WF_PREDECESSOR_EVIDENCE_LANE"
  | "AOP_WF_PREDECESSOR_OPERATION_DEPENDENCY"
  | "AOP_WF_PREDECESSOR_AUTHORITY_GROWTH";

export type WorkflowPredecessorResult =
  | {
      result: "pass";
      diagnostic: "AOP_WF_PREDECESSOR_PASS";
      selector: "$";
      subject_id: typeof WORKFLOW_CANDIDATE_ID;
      evidence_lane: "candidate-local-prototype";
      synchronized_task_session_closeout: false;
      candidate: LockedRepositoryRef;
      source: LockedRepositoryRef;
      proof_swu_ids: readonly string[];
      claim_ceiling: string;
      authority_effect: "none";
    }
  | {
      result: "block";
      diagnostic: Exclude<
        WorkflowPredecessorDiagnostic,
        "AOP_WF_PREDECESSOR_PASS"
      >;
      selector: string;
      expected?: string | number;
      actual?: string | number;
      authority_effect: "none";
    };

type JsonRecord = Record<string, unknown>;
const SHA256 = /^[a-f0-9]{64}$/u;

class PredecessorViolation extends Error {
  constructor(
    readonly diagnostic: Exclude<
      WorkflowPredecessorDiagnostic,
      "AOP_WF_PREDECESSOR_PASS"
    >,
    readonly selector: string,
    readonly details: { expected?: string | number; actual?: string | number } = {},
  ) {
    super(`${diagnostic} at ${selector}`);
  }
}

function fail(
  diagnostic: Exclude<
    WorkflowPredecessorDiagnostic,
    "AOP_WF_PREDECESSOR_PASS"
  >,
  selector: string,
  details: { expected?: string | number; actual?: string | number } = {},
): never {
  throw new PredecessorViolation(diagnostic, selector, details);
}

function object(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("AOP_WF_PREDECESSOR_INPUT_INVALID", selector);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], selector: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (
    actual.length !== wanted.length ||
    actual.some((key, index) => key !== wanted[index])
  ) {
    fail("AOP_WF_PREDECESSOR_INPUT_INVALID", selector);
  }
}

export function sha256Bytes(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonRecord)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonical(child)]),
    );
  }
  return value;
}

export function sha256Canonical(value: unknown): string {
  return sha256Bytes(JSON.stringify(canonical(value)));
}

function pathPart(ref: string): string {
  const hashIndex = ref.indexOf("#");
  return hashIndex === -1 ? ref : ref.slice(0, hashIndex);
}

function repositoryTarget(repoRoot: string, ref: string, selector: string): string {
  const part = pathPart(ref);
  if (
    part.length === 0 ||
    part.includes("\\") ||
    part.includes("\0") ||
    isAbsolute(part)
  ) {
    fail("AOP_WF_PREDECESSOR_PATH_ESCAPE", selector);
  }
  const root = resolve(repoRoot);
  const target = resolve(root, part);
  const lexical = relative(root, target);
  if (
    lexical === "" ||
    lexical === ".." ||
    lexical.startsWith(`..${sep}`) ||
    isAbsolute(lexical)
  ) {
    fail("AOP_WF_PREDECESSOR_PATH_ESCAPE", selector);
  }
  return target;
}

export function readLockedRepositoryFile(
  repoRoot: string,
  lock: LockedRepositoryRef,
  selector = "$.lock",
): Buffer {
  if (
    lock === null ||
    typeof lock !== "object" ||
    typeof lock.path !== "string" ||
    !SHA256.test(lock.sha256) ||
    !Number.isInteger(lock.size_bytes) ||
    lock.size_bytes < 0
  ) {
    fail("AOP_WF_PREDECESSOR_INPUT_INVALID", selector);
  }
  const target = repositoryTarget(repoRoot, lock.path, `${selector}.path`);
  let bytes: Buffer;
  try {
    if (lstatSync(target).isSymbolicLink()) {
      fail("AOP_WF_PREDECESSOR_PATH_ESCAPE", `${selector}.path`);
    }
    if (!statSync(target).isFile()) {
      fail("AOP_WF_PREDECESSOR_MISSING", selector);
    }
    const realRoot = realpathSync(resolve(repoRoot));
    const realTarget = realpathSync(target);
    const physical = relative(realRoot, realTarget);
    if (
      physical === "" ||
      physical === ".." ||
      physical.startsWith(`..${sep}`) ||
      isAbsolute(physical)
    ) {
      fail("AOP_WF_PREDECESSOR_PATH_ESCAPE", `${selector}.path`);
    }
    bytes = readFileSync(realTarget);
  } catch (error) {
    if (error instanceof PredecessorViolation) throw error;
    fail("AOP_WF_PREDECESSOR_MISSING", selector);
  }
  const actualDigest = sha256Bytes(bytes!);
  if (actualDigest !== lock.sha256 || bytes!.length !== lock.size_bytes) {
    fail("AOP_WF_PREDECESSOR_STALE", selector, {
      expected: `${lock.sha256}:${lock.size_bytes}`,
      actual: `${actualDigest}:${bytes!.length}`,
    });
  }
  return bytes!;
}

function parseLockedJson(
  repoRoot: string,
  lock: LockedRepositoryRef,
  selector: string,
): JsonRecord {
  try {
    return object(
      JSON.parse(readLockedRepositoryFile(repoRoot, lock, selector).toString("utf8")),
      selector,
    );
  } catch (error) {
    if (error instanceof PredecessorViolation) throw error;
    fail("AOP_WF_PREDECESSOR_RECEIPT", selector);
  }
}

function containsForbiddenOperationReceipt(value: unknown): boolean {
  if (typeof value === "string") {
    return value.toLowerCase().includes("operation-type-completion-receipt");
  }
  if (Array.isArray(value)) return value.some(containsForbiddenOperationReceipt);
  if (value !== null && typeof value === "object") {
    return Object.values(value as JsonRecord).some(containsForbiddenOperationReceipt);
  }
  return false;
}

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function validatePacketCloseout(value: JsonRecord): void {
  const lifecycle = asRecord(value.lifecycle_result);
  if (
    value.schema_version !== "ape.invoke-refresh-candidate-local-closeout/v1" ||
    value.work_pack_id !== "WP-APE-OP-PROFILE-001" ||
    value.swu_id !== "SWU-AOP-001" ||
    lifecycle.status !== "closed-candidate-local" ||
    lifecycle.implementation_validation !== "pass" ||
    lifecycle.synchronized_task_session_closeout !== false ||
    lifecycle.canonical_closeout !== false ||
    lifecycle.profile_admitted !== false ||
    lifecycle.authority_effect !== "none" ||
    value.authority_effect !== "none"
  ) {
    fail("AOP_WF_PREDECESSOR_PACKET", "$.packet_closeout");
  }
}

function validateCandidate(value: JsonRecord): LockedRepositoryRef {
  const metaType = asRecord(value.meta_type);
  const semanticPlan = asRecord(value.semantic_plan);
  const architecture = asRecord(value.architecture_implementation);
  const lifecycle = asRecord(value.lifecycle);
  const projection = asRecord(value.projection_source);
  const targets = Array.isArray(value.targets) ? value.targets : [];
  if (
    value.schema_version !== "domainspec.meta-type-implementation-candidate/v1" ||
    value.candidate_id !== WORKFLOW_CANDIDATE_ID ||
    value.work_pack_id !== "WP-RMT-002" ||
    value.task_id !== "TASK-RMT-WF" ||
    value.projection_swu_id !== "RMT-WF-010" ||
    metaType.id !== "DS-D1.9" ||
    metaType.label !== "Workflow" ||
    semanticPlan.epoch_id !== WORKFLOW_SEMANTIC_EPOCH ||
    semanticPlan.contract_digest !== WORKFLOW_SEMANTIC_CONTRACT_SHA256 ||
    architecture.architecture_type_id !== "architecture.WorkflowImplementation" ||
    architecture.provider_registration_status !== "unregistered" ||
    lifecycle.task_session_admitted !== false ||
    lifecycle.admission_status !== "not-admitted" ||
    lifecycle.promotion_status !== "not-promoted" ||
    lifecycle.authority_effect !== "none" ||
    !Array.isArray(projection.receipt_order) ||
    JSON.stringify(projection.receipt_order) !== JSON.stringify(WORKFLOW_PROOF_SWUS)
  ) {
    fail("AOP_WF_PREDECESSOR_SUBJECT", "$.workflow_candidate");
  }
  const typescript = targets.find(
    (target) => asRecord(target).language === "typescript",
  );
  const source = asRecord(asRecord(typescript).source);
  if (
    typeof source.path !== "string" ||
    typeof source.sha256 !== "string" ||
    typeof source.size_bytes !== "number"
  ) {
    fail("AOP_WF_PREDECESSOR_SUBJECT", "$.workflow_candidate.targets");
  }
  return source as unknown as LockedRepositoryRef;
}

function validateProjectionReceipt(
  value: JsonRecord,
  candidateLock: LockedRepositoryRef,
): string {
  const candidate = asRecord(value.candidate);
  const lifecycle = asRecord(value.lifecycle);
  if (
    value.schema_version !== "domainspec.wp-rmt-002-proof-receipt/v1" ||
    value.work_pack_id !== "WP-RMT-002" ||
    value.task_id !== "TASK-RMT-WF" ||
    value.swu_id !== "RMT-WF-010" ||
    value.stage !== "candidate-projection" ||
    value.execution_mode !== "candidate-local-fast-lane" ||
    value.result !== "pass" ||
    value.semantic_plan_epoch_id !== WORKFLOW_SEMANTIC_EPOCH ||
    value.semantic_contract_digest !== WORKFLOW_SEMANTIC_CONTRACT_SHA256 ||
    candidate.path !== candidateLock.path ||
    candidate.sha256 !== candidateLock.sha256 ||
    candidate.size_bytes !== candidateLock.size_bytes ||
    candidate.candidate_id !== WORKFLOW_CANDIDATE_ID ||
    lifecycle.task_session_admitted !== false ||
    lifecycle.admission_status !== "not-admitted" ||
    lifecycle.provider_registration_status !== "unregistered" ||
    lifecycle.promotion_status !== "not-promoted" ||
    lifecycle.authority_effect !== "none" ||
    value.authority_effect !== "none" ||
    typeof value.claim_ceiling !== "string" ||
    value.claim_ceiling.length === 0
  ) {
    fail("AOP_WF_PREDECESSOR_RECEIPT", "$.workflow_projection_receipt");
  }
  return value.claim_ceiling;
}

export function validateWorkflowPredecessor(
  input: unknown,
  options: { repoRoot: string },
): WorkflowPredecessorResult {
  try {
    const candidateInput = object(input, "$" );
    exactKeys(
      candidateInput,
      [
        "packet_schema",
        "packet_validator",
        "packet_closeout",
        "workflow_candidate",
        "workflow_projection_receipt",
        "proof_receipts",
        "required_evidence_lane",
        "synchronized_task_session_closeout",
        "operation_type_completion_receipt",
        "authority_effect",
      ],
      "$",
    );
    const parsed = candidateInput as unknown as WorkflowPredecessorInput;
    if (
      parsed.required_evidence_lane !== "candidate-local-prototype" ||
      parsed.synchronized_task_session_closeout !== false
    ) {
      fail("AOP_WF_PREDECESSOR_EVIDENCE_LANE", "$.required_evidence_lane");
    }
    if (parsed.operation_type_completion_receipt !== null) {
      fail(
        "AOP_WF_PREDECESSOR_OPERATION_DEPENDENCY",
        "$.operation_type_completion_receipt",
      );
    }
    if (parsed.authority_effect !== "none") {
      fail("AOP_WF_PREDECESSOR_AUTHORITY_GROWTH", "$.authority_effect");
    }

    readLockedRepositoryFile(options.repoRoot, parsed.packet_schema, "$.packet_schema");
    readLockedRepositoryFile(
      options.repoRoot,
      parsed.packet_validator,
      "$.packet_validator",
    );
    validatePacketCloseout(
      parseLockedJson(options.repoRoot, parsed.packet_closeout, "$.packet_closeout"),
    );
    const candidateValue = parseLockedJson(
      options.repoRoot,
      parsed.workflow_candidate,
      "$.workflow_candidate",
    );
    if (containsForbiddenOperationReceipt(candidateValue)) {
      fail(
        "AOP_WF_PREDECESSOR_OPERATION_DEPENDENCY",
        "$.workflow_candidate",
      );
    }
    const sourceLock = validateCandidate(candidateValue);
    readLockedRepositoryFile(options.repoRoot, sourceLock, "$.workflow_candidate.source");
    const claimCeiling = validateProjectionReceipt(
      parseLockedJson(
        options.repoRoot,
        parsed.workflow_projection_receipt,
        "$.workflow_projection_receipt",
      ),
      parsed.workflow_candidate,
    );

    if (
      !Array.isArray(parsed.proof_receipts) ||
      parsed.proof_receipts.length !== WORKFLOW_PROOF_SWUS.length ||
      parsed.proof_receipts.some(
        (entry, index) => entry.swu_id !== WORKFLOW_PROOF_SWUS[index],
      )
    ) {
      fail("AOP_WF_PREDECESSOR_PROOF_CHAIN", "$.proof_receipts");
    }
    for (let index = 0; index < parsed.proof_receipts.length; index += 1) {
      const lock = parsed.proof_receipts[index];
      const receipt = parseLockedJson(
        options.repoRoot,
        lock,
        `$.proof_receipts[${index}]`,
      );
      if (
        receipt.swu_id !== WORKFLOW_PROOF_SWUS[index] ||
        receipt.task_id !== "TASK-RMT-WF" ||
        receipt.result !== "pass" ||
        receipt.execution_mode !== "candidate-local-fast-lane" ||
        receipt.semantic_plan_epoch_id !== WORKFLOW_SEMANTIC_EPOCH ||
        receipt.semantic_contract_digest !== WORKFLOW_SEMANTIC_CONTRACT_SHA256 ||
        receipt.authority_effect !== "none"
      ) {
        fail(
          "AOP_WF_PREDECESSOR_PROOF_CHAIN",
          `$.proof_receipts[${index}]`,
        );
      }
    }

    return {
      result: "pass",
      diagnostic: "AOP_WF_PREDECESSOR_PASS",
      selector: "$",
      subject_id: WORKFLOW_CANDIDATE_ID,
      evidence_lane: "candidate-local-prototype",
      synchronized_task_session_closeout: false,
      candidate: { ...parsed.workflow_candidate },
      source: { ...sourceLock },
      proof_swu_ids: [...WORKFLOW_PROOF_SWUS],
      claim_ceiling: claimCeiling,
      authority_effect: "none",
    };
  } catch (error) {
    if (error instanceof PredecessorViolation) {
      return {
        result: "block",
        diagnostic: error.diagnostic,
        selector: error.selector,
        ...error.details,
        authority_effect: "none",
      };
    }
    return {
      result: "block",
      diagnostic: "AOP_WF_PREDECESSOR_INPUT_INVALID",
      selector: "$",
      authority_effect: "none",
    };
  }
}
