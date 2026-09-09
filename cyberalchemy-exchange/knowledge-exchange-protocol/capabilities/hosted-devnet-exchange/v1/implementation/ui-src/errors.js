import registryDocument from "../error-registry/v1.json" with { type: "json" };

export const ERROR_REGISTRY = registryDocument;
const byCode = new Map(registryDocument.entries.map((entry) => [entry.canonical_code, entry]));
const byCustomCode = new Map(
  registryDocument.entries
    .filter((entry) => Number.isInteger(entry.custom_program_code))
    .map((entry) => [entry.custom_program_code, entry]),
);

export class ProtocolClientError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "ProtocolClientError";
    this.code = code;
    this.stage = options.stage || "client_validation";
    this.effectStatus = "none";
    this.retryDisposition = options.retryDisposition || null;
    this.technicalDetail = options.technicalDetail || message;
  }
}

function detailOf(error) {
  if (typeof error === "string") return error;
  if (error?.technicalDetail) return String(error.technicalDetail);
  if (error?.message) return String(error.message);
  try { return JSON.stringify(error); } catch { return "unavailable error detail"; }
}

function nested(error, key) {
  return error?.[key] ?? error?.cause?.[key] ?? null;
}

export function decodeTransactionError(value) {
  if (!value) return null;
  if (typeof value === "string") {
    return { transactionError: value, instructionIndex: null, instructionError: null, customProgramCode: null };
  }
  const instruction = value.InstructionError || value.instructionError;
  if (!Array.isArray(instruction) || instruction.length < 2) {
    return { transactionError: JSON.stringify(value), instructionIndex: null, instructionError: null, customProgramCode: null };
  }
  const [instructionIndex, instructionFailure] = instruction;
  if (typeof instructionFailure === "object" && Number.isInteger(instructionFailure?.Custom)) {
    return {
      transactionError: "InstructionError",
      instructionIndex,
      instructionError: "Custom",
      customProgramCode: instructionFailure.Custom,
    };
  }
  return {
    transactionError: "InstructionError",
    instructionIndex,
    instructionError: typeof instructionFailure === "string" ? instructionFailure : JSON.stringify(instructionFailure),
    customProgramCode: null,
  };
}

function fallbackEntry(code = "unknown_failure") {
  return byCode.get(code) || byCode.get("unknown_failure");
}

export function normalizeFailure(error, context = {}) {
  const detail = detailOf(error).slice(0, 4096);
  const data = nested(error, "data");
  const rpcCode = nested(error, "rpcCode") ?? (typeof nested(error, "code") === "number" ? nested(error, "code") : null);
  const rpcRequestId = nested(error, "rpcRequestId") ?? nested(error, "id");
  const httpStatus = nested(error, "httpStatus");
  const correlationId = nested(error, "correlationId");
  const transactionSignature = nested(error, "transactionSignature") ?? context.transactionSignature ?? null;
  const transaction = decodeTransactionError(
    nested(error, "transactionError") ?? data?.err ?? data?.value?.err,
  );
  const stage = context.stage || error?.stage || "client_operation";
  let entry;

  if (transaction?.customProgramCode != null) {
    entry = byCustomCode.get(transaction.customProgramCode) || fallbackEntry("instruction_error");
  } else if (transaction?.transactionError === "BlockhashNotFound" || /BlockhashNotFound|Blockhash not found/i.test(detail)) {
    entry = fallbackEntry("blockhash_not_found");
  } else if (transaction?.transactionError === "InstructionError") {
    entry = fallbackEntry("instruction_error");
  } else if (/Phantom-compatible|wallet.*not (found|available)/i.test(detail)) {
    entry = fallbackEntry("wallet_unavailable");
  } else if (/User rejected|rejected the request|cancelled|canceled/i.test(detail)) {
    entry = fallbackEntry("wallet_request_rejected");
  } else if (error?.serverCode && byCode.has(error.serverCode)) {
    entry = fallbackEntry(error.serverCode);
  } else if (httpStatus === 429) {
    entry = fallbackEntry("http_rate_limited");
  } else if (httpStatus != null || error?.serverCode) {
    entry = fallbackEntry("hosted_api_error");
  } else if (rpcCode != null) {
    entry = fallbackEntry("json_rpc_rejected");
  } else if (/timeout|timed out|abort/i.test(detail)) {
    entry = fallbackEntry("transport_timeout");
  } else if (/fetch|network|offline|connection|unavailable/i.test(detail)) {
    entry = fallbackEntry("transport_unavailable");
  } else if (error?.code && byCode.has(error.code)) {
    entry = fallbackEntry(error.code);
  } else {
    entry = fallbackEntry();
  }

  let effectStatus = error?.effectStatus || entry.effect_status;
  let retryDisposition = error?.retryDisposition || entry.retry_disposition;
  if (stage === "devnet_finalization" && transactionSignature) {
    if (transaction || error?.code === "devnet_finalized_failure") {
      effectStatus = "finalized_failure";
      retryDisposition = "inspect_before_retry";
    } else {
      effectStatus = "submitted_finality_unknown";
      retryDisposition = "inspect_before_retry";
    }
  } else if (stage === "devnet_preflight" && !transaction && entry.canonical_code === "unknown_failure") {
    effectStatus = "submission_attempted_unknown";
    retryDisposition = "inspect_before_retry";
  } else if (context.mayHaveEffect && effectStatus === "none") {
    effectStatus = "unknown";
    retryDisposition = "inspect_before_retry";
  }

  return {
    registryVersion: registryDocument.registry_version,
    canonicalCode: entry.canonical_code,
    sourceLayer: entry.source_layer,
    effectStatus,
    retryDisposition,
    title: error?.userTitle || entry.title,
    safeMessage: error?.safeMessage || entry.safe_message,
    guidance: error?.guidance || entry.guidance,
    stage,
    detail,
    rpcCode,
    rpcRequestId: rpcRequestId == null ? null : String(rpcRequestId),
    httpStatus,
    correlationId,
    transactionSignature,
    transactionError: transaction?.transactionError || null,
    instructionIndex: transaction?.instructionIndex ?? null,
    instructionError: transaction?.instructionError || null,
    customProgramCode: transaction?.customProgramCode ?? null,
    programId: context.programId || null,
    sourceCode: error?.serverCode || (typeof error?.code === "string" ? error.code : null),
  };
}
