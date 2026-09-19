import { sha256Canonical } from "../../validators/rmt-workflow-predecessor.ts";

export const WORKFLOW_MODES = ["synchronous", "durable"] as const;
export type WorkflowMode = (typeof WORKFLOW_MODES)[number];

export interface WorkflowModeDeclarationBody {
  schema_version: "ape.workflow-mode-declaration/v1";
  declaration_id: string;
  subject_id: string;
  mode: WorkflowMode;
  basis_ref: string;
  owner: "workflow-profile:mode-owner";
  authority_effect: "none";
}

export interface WorkflowModeDeclaration extends WorkflowModeDeclarationBody {
  declaration_sha256: string;
}

export interface WorkflowModeDiscriminatorInput {
  subject_id: string;
  declarations: readonly unknown[];
  authority_effect: "none";
}

export type WorkflowModeDiagnostic =
  | "AOP_WF_MODE_PASS"
  | "AOP_WF_MODE_INPUT_INVALID"
  | "AOP_WF_MODE_OWNER_BLOCKED"
  | "AOP_WF_MODE_CONFLICT"
  | "AOP_WF_MODE_STALE_DECLARATION"
  | "AOP_WF_MODE_SUBJECT_MISMATCH"
  | "AOP_WF_MODE_HEURISTIC_FORBIDDEN"
  | "AOP_WF_MODE_AUTHORITY_GROWTH";

export interface WorkflowModeResult {
  schema_version: "ape.workflow-mode-discriminator-result/v1";
  result: "pass" | "owner-blocked" | "fail" | "block";
  diagnostic: WorkflowModeDiagnostic;
  selector: string;
  subject_id: string;
  mode: WorkflowMode | null;
  declaration_id: string | null;
  declaration_sha256: string | null;
  owner_route: "workflow-profile:mode-owner";
  provider_heuristic_used: false;
  path_heuristic_used: false;
  runtime_heuristic_used: false;
  authority_effect: "none";
  result_sha256: string;
}

const DECLARATION_KEYS = [
  "schema_version",
  "declaration_id",
  "subject_id",
  "mode",
  "basis_ref",
  "owner",
  "authority_effect",
  "declaration_sha256",
] as const;
const FORBIDDEN_KEYS = new Set([
  "provider",
  "provider_id",
  "provider_name",
  "source_path",
  "file_path",
  "runtime_present",
  "workflow_store_present",
  "scheduler_present",
  "inferred_mode",
]);

function emit(
  input: WorkflowModeDiscriminatorInput,
  result: WorkflowModeResult["result"],
  diagnostic: WorkflowModeDiagnostic,
  selector: string,
  declaration: WorkflowModeDeclaration | null = null,
): WorkflowModeResult {
  const body = {
    schema_version: "ape.workflow-mode-discriminator-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    mode: declaration?.mode ?? null,
    declaration_id: declaration?.declaration_id ?? null,
    declaration_sha256: declaration?.declaration_sha256 ?? null,
    owner_route: "workflow-profile:mode-owner" as const,
    provider_heuristic_used: false as const,
    path_heuristic_used: false as const,
    runtime_heuristic_used: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

function findForbiddenKey(value: unknown, selector = "$" ): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenKey(value[index], `${selector}[${index}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return `${selector}.${key}`;
    const found = findForbiddenKey(child, `${selector}.${key}`);
    if (found !== null) return found;
  }
  return null;
}

export function sealWorkflowModeDeclaration(
  body: WorkflowModeDeclarationBody,
): WorkflowModeDeclaration {
  return { ...body, declaration_sha256: sha256Canonical(body) };
}

function parseDeclaration(value: unknown): WorkflowModeDeclaration | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const declaration = value as Record<string, unknown>;
  const keys = Object.keys(declaration).sort();
  const expected = [...DECLARATION_KEYS].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index]) ||
    declaration.schema_version !== "ape.workflow-mode-declaration/v1" ||
    typeof declaration.declaration_id !== "string" ||
    declaration.declaration_id.length === 0 ||
    typeof declaration.subject_id !== "string" ||
    declaration.subject_id.length === 0 ||
    !WORKFLOW_MODES.includes(declaration.mode as WorkflowMode) ||
    typeof declaration.basis_ref !== "string" ||
    declaration.basis_ref.length === 0 ||
    declaration.owner !== "workflow-profile:mode-owner" ||
    declaration.authority_effect !== "none" ||
    typeof declaration.declaration_sha256 !== "string"
  ) {
    return null;
  }
  return declaration as unknown as WorkflowModeDeclaration;
}

export function discriminateWorkflowMode(
  input: WorkflowModeDiscriminatorInput,
): WorkflowModeResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !Array.isArray(input.declarations)
  ) {
    return emit(input, "block", "AOP_WF_MODE_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(input, "block", "AOP_WF_MODE_AUTHORITY_GROWTH", "$.authority_effect");
  }
  const forbidden = findForbiddenKey(input.declarations, "$.declarations");
  if (forbidden !== null) {
    return emit(input, "fail", "AOP_WF_MODE_HEURISTIC_FORBIDDEN", forbidden);
  }
  if (input.declarations.length === 0) {
    return emit(input, "owner-blocked", "AOP_WF_MODE_OWNER_BLOCKED", "$.declarations");
  }
  if (input.declarations.length !== 1) {
    return emit(input, "owner-blocked", "AOP_WF_MODE_CONFLICT", "$.declarations");
  }
  const declaration = parseDeclaration(input.declarations[0]);
  if (declaration === null) {
    return emit(input, "block", "AOP_WF_MODE_INPUT_INVALID", "$.declarations[0]");
  }
  if (declaration.subject_id !== input.subject_id) {
    return emit(input, "block", "AOP_WF_MODE_SUBJECT_MISMATCH", "$.declarations[0].subject_id");
  }
  const { declaration_sha256: declaredDigest, ...body } = declaration;
  if (declaredDigest !== sha256Canonical(body)) {
    return emit(
      input,
      "block",
      "AOP_WF_MODE_STALE_DECLARATION",
      "$.declarations[0].declaration_sha256",
    );
  }
  return emit(input, "pass", "AOP_WF_MODE_PASS", "$", declaration);
}
