const MAX_TEXT_BYTES = 256 * 1024;
const REDACTED_TYPE = "are/redacted";

function textBlocks(blocks, {assistant = false} = {}) {
  if (!Array.isArray(blocks) || blocks.length > 64) return null;
  const result = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object" || typeof block.type !== "string") return null;
    if (block.type === "reasoning" && assistant) continue;
    if (block.type !== "text" || typeof block.text !== "string") return null;
    result.push({type: "text", text: block.text});
  }
  if (Buffer.byteLength(JSON.stringify(result)) > MAX_TEXT_BYTES) return null;
  return result;
}

function messageId(value) {
  return typeof value === "string" && value.length > 0
    && Buffer.byteLength(value) <= 256 && !/[\u0000-\u001f\u007f]/u.test(value);
}

function modelLabel(value) {
  return typeof value === "string" && value.length > 0
    && Buffer.byteLength(value) <= 256 && !/[\u0000-\u001f\u007f]/u.test(value);
}

function safeUser(event) {
  const data = event.data;
  if (event.surfaceOp !== "append" || !data || data.role !== "user"
    || data.source?.kind !== "user" || !messageId(data.id)) return null;
  const content = textBlocks(data.content);
  if (!content || content.length === 0) return null;
  return {id: data.id, role: "user", content, source: {kind: "user",
    ...(messageId(data.source.rpcId) ? {rpcId: data.source.rpcId} : {})}};
}

function safeAssistant(event) {
  const data = event.data;
  const message = data?.message;
  if (event.surfaceOp !== "append" || !message || message.role !== "assistant"
    || message.source?.kind !== "model" || !messageId(message.id)
    || !Number.isSafeInteger(data.turn) || data.turn < 0
    || !Number.isSafeInteger(data.step) || data.step < 0
    || !modelLabel(message.source.provider) || !modelLabel(message.source.model)) {
    return null;
  }
  const content = textBlocks(message.content, {assistant: true});
  if (content === null) return null;
  return {turn: data.turn, step: data.step, stream: [],
    message: {id: message.id, role: "assistant", content,
      source: {kind: "model", provider: message.source.provider, model: message.source.model}}};
}

function safeBoundary(event) {
  if (!Number.isSafeInteger(event.data?.turn) || event.data.turn < 0) return null;
  const turn = event.data.turn;
  if (event.type === "turn/start") return {turn};
  if (event.type === "step/start" || event.type === "step/end") {
    return Number.isSafeInteger(event.data.step) && event.data.step >= 0
      ? {turn, step: event.data.step} : null;
  }
  if (event.type !== "turn/end") return null;
  const kind = event.data.reason?.kind;
  if (!["completed", "aborted", "blocked", "error"].includes(kind)) return null;
  if (kind === "error") return {turn, reason: {kind,
    error: {code: "ARE_REDACTED", message: "Failure details redacted"}}};
  if (kind === "aborted") {
    const cause = event.data.reason.reason?.kind;
    return {turn, reason: {kind,
      reason: {kind: ["user", "parent", "hook", "disposed", "legacy"].includes(cause)
        ? cause : "legacy"}}};
  }
  return {turn, reason: {kind}};
}

/** Preserve native sequence positions while exporting only this profile's public text. */
export function projectDshWebHistoryEvent(event) {
  if (!event || !Number.isSafeInteger(event.seq) || event.seq < 0
    || !Number.isSafeInteger(event.time) || event.time < 0) {
    throw new Error("dsh-web.history-event-invalid");
  }
  const boundary = ["turn/start", "turn/end", "step/start", "step/end"].includes(event.type);
  const data = event.type === "user/message" ? safeUser(event)
    : event.type === "assistant/message" ? safeAssistant(event)
      : boundary ? safeBoundary(event) : null;
  if (data === null) return {type: REDACTED_TYPE, seq: event.seq,
    time: event.time, data: {turn: null}, ignorable: true};
  return {type: event.type, seq: event.seq, time: event.time, data,
    ...(boundary ? {} : {surfaceOp: "append"})};
}

export function projectDshWebHistoryRecord(record) {
  if (record?.type !== "event") throw new Error("dsh-web.history-record-invalid");
  return {type: "event", event: projectDshWebHistoryEvent(record.event)};
}

export function projectDshWebHistoryPage(page) {
  if (!page || !Array.isArray(page.records) || typeof page.hasMore !== "boolean") {
    throw new Error("dsh-web.history-page-invalid");
  }
  return {records: page.records.map(projectDshWebHistoryRecord), hasMore: page.hasMore};
}

export function projectDshWebHistorySnapshot(frame, sessionId, {assistantStream = false} = {}) {
  if (frame?.type !== "snapshot" || frame.header?.id !== sessionId
    || !Number.isSafeInteger(frame.header.createdAt)
    || !Number.isSafeInteger(frame.cursor) || frame.cursor < -1
    || !Array.isArray(frame.records) || typeof frame.hasMore !== "boolean") {
    throw new Error("dsh-web.history-snapshot-invalid");
  }
  return {type: "snapshot", header: {version: frame.header.version,
    id: sessionId, createdAt: frame.header.createdAt, isSeeded: false},
  cursor: frame.cursor, records: frame.records.map(projectDshWebHistoryRecord),
  hasMore: frame.hasMore, projections: {asOfSeq: frame.cursor,
    values: {modelSelection: {next: null}}},
  ...(assistantStream ? {assistantStream: {revision: 0}} : {})};
}
