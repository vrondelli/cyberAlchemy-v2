import { measureAsync, recordPerformanceSample } from "../../performance";

export interface AreReasoningReceipt {
  schemaVersion: "are.reasoning-receipt-view/v1-candidate";
  receiptId: string;
  sequence: number;
  observedAt: string;
  kind: string;
  status: string;
  route: string | null;
  decisionDigest: string | null;
  evidenceDigest: string;
  profileDigest: string | null;
  requestId: string | null;
  threadId: string | null;
  turnId: string | null;
  reasonCodes: string[];
  authorityEffect: "none";
  claimCeiling: string;
}

export interface AreChatEvent {
  type: string;
  emittedAtMs: number;
  requestId?: string | null;
  promptId?: string;
  text?: string;
  threadId?: string;
  protocol?: string;
  decision?: Record<string, unknown>;
  request?: Record<string, unknown>;
  permissionDecision?: Record<string, unknown>;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  receipt?: AreReasoningReceipt;
  approvalDecision?: "accept" | "acceptForSession" | "decline";
  resolutionMode?: "manual" | "automatic";
  error?: { message?: string; code?: string | number | null; data?: unknown };
  [key: string]: unknown;
}

export type AreChatCommand =
  | { type: "turn.start"; requestId: string; text: string; requestContext?: Record<string, unknown>; continuation?: Record<string, unknown> }
  | { type: "approval.resolve"; requestId: string; promptId: string; decision: "accept" | "acceptForSession" | "decline"; resolutionMode?: "manual" | "automatic" }
  | { type: "user-input.resolve"; requestId: string; promptId: string; answers: Record<string, { answers: string[] }> }
  | { type: "continuation.resolve"; requestId: string; decisionDigest: string; optionId: string; proposalDigest: string; decision: "accept" | "decline" }
  | { type: "session.close"; requestId: string };

export interface AreChatConnection {
  connectionId: number;
  transport: "tauri-channel-to-are-jsonl-stdio";
  authorityEffect: "none";
  send(command: AreChatCommand): Promise<void>;
  disconnect(): Promise<void>;
}

export function nativeConnectTimingDetail(value: unknown): Record<string, unknown> {
  const keys = ["processAcquireMs", "processLockMs", "channelBindMs", "totalMs"] as const;
  if (!value || typeof value !== "object") return { nativeTimingStatus: "unavailable" };
  const timing = value as Record<string, unknown>;
  if (keys.some((key) => typeof timing[key] !== "number" || !Number.isFinite(timing[key]) || (timing[key] as number) < 0)) {
    return { nativeTimingStatus: "invalid" };
  }
  const phases = keys.slice(0, 3).reduce((sum, key) => sum + (timing[key] as number), 0);
  if (Math.abs(phases - (timing.totalMs as number)) > 0.001) return { nativeTimingStatus: "invalid" };
  const wall: Record<string, unknown> = {};
  if ("enteredUnixMs" in timing || "boundUnixMs" in timing) {
    if (![timing.enteredUnixMs, timing.boundUnixMs].every(value => typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
      || (timing.boundUnixMs as number) < (timing.enteredUnixMs as number)) return { nativeTimingStatus: "invalid" };
    wall.nativeEnteredUnixMs = timing.enteredUnixMs;
    wall.nativeBoundUnixMs = timing.boundUnixMs;
  }
  return {
    ...wall,
    nativeTimingStatus: "observed",
    nativeTiming: Object.fromEntries(keys.map((key) => [key, timing[key]])),
    nativeTimingBoundary: "command-entry-to-channel-bound; excludes IPC and response delivery",
  };
}

export type AreChatBridgeDetection =
  | { status: "available"; connect(onEvent: (event: AreChatEvent) => void): Promise<AreChatConnection> }
  | { status: "unavailable"; reason: "web-mode" | "tauri-invoke-unavailable" | "tauri-channel-unavailable" };

type TauriInvoke = <Result>(command: string, arguments_: Record<string, unknown>) => Promise<Result>;
interface TauriChannel<Message> { onmessage: (message: Message) => void }
interface TauriChannelConstructor { new <Message>(): TauriChannel<Message> }

const controlPlaneListeners = new Set<(event: AreChatEvent) => void>();
const bufferedControlPlaneEvents: AreChatEvent[] = [];
let controlPlaneConnection: Promise<AreChatConnection> | null = null;

function coreFrom(candidate: unknown): { invoke: TauriInvoke; Channel: TauriChannelConstructor | null } | null {
  if (!candidate || typeof candidate !== "object") return null;
  const tauri = (candidate as { __TAURI__?: unknown }).__TAURI__;
  if (!tauri || typeof tauri !== "object") return null;
  const core = (tauri as { core?: unknown }).core;
  if (!core || typeof core !== "object") return null;
  const invoke = (core as { invoke?: unknown }).invoke;
  const Channel = (core as { Channel?: unknown }).Channel;
  return typeof invoke === "function"
    ? { invoke: invoke as TauriInvoke, Channel: typeof Channel === "function" ? Channel as TauriChannelConstructor : null }
    : null;
}

export function chatRequestId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function detectAreChatBridge(
  candidate: unknown = typeof window === "undefined" ? undefined : window,
): AreChatBridgeDetection {
  if (candidate === undefined || candidate === null) return { status: "unavailable", reason: "web-mode" };
  const core = coreFrom(candidate);
  if (!core) {
    return { status: "unavailable", reason: "__TAURI__" in Object(candidate) ? "tauri-invoke-unavailable" : "web-mode" };
  }
  if (!core.Channel) return { status: "unavailable", reason: "tauri-channel-unavailable" };
  const { invoke, Channel } = core;
  return {
    status: "available",
    async connect(onEvent) {
      const channel = new Channel<AreChatEvent>();
      channel.onmessage = onEvent;
      await measureAsync(
        "workspace.tauri.chat-cold-ipc-handshake",
        // Connecting the control plane must not depend on renderer frame delivery.
        () => invoke<boolean>("chat_control_plane_status", {}),
      );
      const connectDetail: Record<string, unknown> = { nativeTimingStatus: "unavailable" };
      const info = await measureAsync(
        "workspace.tauri.chat-connect-dispatch",
        async () => {
          connectDetail.invokeStartedUnixMs = Date.now();
          const response = await invoke<Omit<AreChatConnection, "send" | "disconnect"> & { nativeTiming?: unknown }>("chat_connect", { onEvent: channel });
          connectDetail.invokeResolvedUnixMs = Date.now();
          Object.assign(connectDetail, nativeConnectTimingDetail(response.nativeTiming));
          return response;
        },
        connectDetail,
      );
      await measureAsync(
        "workspace.tauri.chat-event-replay-dispatch",
        () => invoke<number>("chat_replay", { connectionId: info.connectionId }),
      );
      let disconnected = false;
      return {
        ...info,
        send(command) {
          if (disconnected) return Promise.reject(new Error("ARE_CHAT_DISCONNECTED"));
          return measureAsync(
            "workspace.tauri.chat-command-dispatch",
            () => invoke<void>("chat_send", { connectionId: info.connectionId, command }),
            { command: command.type },
          );
        },
        async disconnect() {
          if (disconnected) return;
          disconnected = true;
          void channel;
          await invoke<boolean>("chat_disconnect", { connectionId: info.connectionId });
        },
      };
    },
  };
}

export function startAreChatControlPlane(
  candidate: unknown = typeof window === "undefined" ? undefined : window,
): Promise<AreChatConnection> {
  if (controlPlaneConnection) return controlPlaneConnection;
  const bridge = detectAreChatBridge(candidate);
  if (bridge.status !== "available") return Promise.reject(new Error(`ARE_CHAT_${bridge.reason.toUpperCase().replaceAll("-", "_")}`));
  const startedAt = Date.now();
  controlPlaneConnection = bridge.connect((event) => {
    if (event.type === "session.ready") {
      const recordedAtUnixMs = Date.now();
      recordPerformanceSample({
        name: "chat.connect-to-ready",
        durationMs: recordedAtUnixMs - startedAt,
        recordedAtUnixMs,
        detail: {completion: "session-ready", ownership: "workspace-control-plane"},
      });
    }
    if (controlPlaneListeners.size === 0) {
      bufferedControlPlaneEvents.push(event);
      if (bufferedControlPlaneEvents.length > 64) bufferedControlPlaneEvents.splice(0, bufferedControlPlaneEvents.length - 64);
      return;
    }
    for (const listener of controlPlaneListeners) listener(event);
  });
  return controlPlaneConnection;
}

export function subscribeAreChatControlPlane(listener: (event: AreChatEvent) => void): () => void {
  controlPlaneListeners.add(listener);
  const buffered = bufferedControlPlaneEvents.splice(0);
  for (const event of buffered) listener(event);
  return () => controlPlaneListeners.delete(listener);
}
