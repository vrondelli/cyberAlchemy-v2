import { describe, expect, it, vi } from "vitest";

import {
  chatRequestId,
  detectAreChatBridge,
  nativeConnectTimingDetail,
  startAreChatControlPlane,
  subscribeAreChatControlPlane,
  type AreChatEvent,
} from "./are-chat-bridge";

describe("ARE chat Tauri bridge", () => {
  it("validates native phase diagnostics without substituting for round-trip latency", () => {
    const timing = {processAcquireMs: 2, processLockMs: 3, channelBindMs: 4, totalMs: 9};
    expect(nativeConnectTimingDetail(timing)).toMatchObject({nativeTimingStatus: "observed", nativeTiming: timing});
    expect(nativeConnectTimingDetail(undefined)).toEqual({nativeTimingStatus: "unavailable"});
    expect(nativeConnectTimingDetail({...timing, enteredUnixMs: 1000, boundUnixMs: 1009})).toMatchObject({nativeEnteredUnixMs: 1000, nativeBoundUnixMs: 1009});
    expect(nativeConnectTimingDetail({...timing, enteredUnixMs: 1000, boundUnixMs: 999})).toEqual({nativeTimingStatus: "invalid"});
    for (const invalid of [{}, {...timing, totalMs: 8}, {...timing, processLockMs: -1}, {...timing, totalMs: NaN}, {...timing, totalMs: Infinity}]) {
      expect(nativeConnectTimingDetail(invalid)).toEqual({nativeTimingStatus: "invalid"});
    }
  });
  it("connects without waiting for the renderer to produce a frame", async () => {
    const frame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", frame);
    try {
      class MockChannel<Message> { onmessage: (message: Message) => void = () => undefined }
      const invoke = vi.fn(async (command: string) => command === "chat_connect"
        ? {connectionId: 17, transport: "tauri-channel-to-are-jsonl-stdio", authorityEffect: "none"}
        : true);
      const bridge = detectAreChatBridge({__TAURI__: {core: {invoke, Channel: MockChannel}}});
      if (bridge.status !== "available") throw new Error("missing test bridge");
      const connected = bridge.connect(() => undefined);
      // The mocked renderer never runs callbacks: IPC must still make progress.
      for (let i = 0; i < 20; i++) await Promise.resolve();
      expect(frame).not.toHaveBeenCalled();
      expect(invoke).toHaveBeenCalledWith("chat_replay", {connectionId: 17});
      await connected;
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("attaches native phases to the full round-trip sample", async () => {
    const samples: Array<{name: string; durationMs: number; detail?: Record<string, unknown>}> = [];
    vi.stubGlobal("window", {__CA2_PERFORMANCE_SAMPLES__: samples});
    const nativeTiming = {processAcquireMs: 0, processLockMs: 0, channelBindMs: 0, totalMs: 0};
    try {
      class MockChannel<Message> { onmessage: (message: Message) => void = () => undefined }
      const invoke = vi.fn(async (command: string) => {
        if (command !== "chat_connect") return true;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {connectionId: 19, transport: "tauri-channel-to-are-jsonl-stdio", authorityEffect: "none", nativeTiming};
      });
      const bridge = detectAreChatBridge({__TAURI__: {core: {invoke, Channel: MockChannel}}});
      if (bridge.status !== "available") throw new Error("missing test bridge");
      await bridge.connect(() => undefined);
      const sample = samples.find((item) => item.name === "workspace.tauri.chat-connect-dispatch");
      expect(sample?.detail).toMatchObject({nativeTimingStatus: "observed", nativeTiming});
      expect(sample?.durationMs).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("is explicitly unavailable on the web", () => {
    expect(detectAreChatBridge(undefined)).toEqual({status: "unavailable", reason: "web-mode"});
  });

  it("connects one typed channel and binds commands to its connection", async () => {
    class MockChannel<Message> { onmessage: (message: Message) => void = () => undefined }
    const invoke = vi.fn(async (command: string, _arguments: Record<string, unknown>) => command === "chat_connect"
      ? {connectionId: 7, transport: "tauri-channel-to-are-jsonl-stdio", authorityEffect: "none"}
      : command === "chat_disconnect");
    const detection = detectAreChatBridge({__TAURI__: {core: {invoke, Channel: MockChannel}}});
    if (detection.status !== "available") throw new Error("chat bridge unavailable in fixture");
    const events: AreChatEvent[] = [];
    const connection = await detection.connect((event) => events.push(event));
    const channel = invoke.mock.calls[1]?.[1]?.onEvent as MockChannel<AreChatEvent>;
    channel.onmessage({type: "session.ready", emittedAtMs: 1, threadId: "thread-1"});
    expect(events[0]?.threadId).toBe("thread-1");

    await connection.send({type: "turn.start", requestId: "turn-1", text: "Inspect."});
    expect(invoke).toHaveBeenNthCalledWith(1, "chat_control_plane_status", {});
    expect(invoke).toHaveBeenNthCalledWith(3, "chat_replay", {connectionId: 7});
    expect(invoke).toHaveBeenNthCalledWith(4, "chat_send", {
      connectionId: 7,
      command: {type: "turn.start", requestId: "turn-1", text: "Inspect."},
    });
    await connection.disconnect();
    expect(invoke).toHaveBeenNthCalledWith(5, "chat_disconnect", {connectionId: 7});
    await connection.disconnect();
    expect(invoke).toHaveBeenCalledTimes(5);
  });

  it("produces non-empty request identities", () => {
    expect(chatRequestId("turn")).toMatch(/\S+/);
  });

  it("starts one app-owned control plane and replays events emitted before the surface subscribes", async () => {
    class MockChannel<Message> { onmessage: (message: Message) => void = () => undefined }
    const invoke = vi.fn(async (command: string, _arguments: Record<string, unknown>) => command === "chat_connect"
      ? {connectionId: 11, transport: "tauri-channel-to-are-jsonl-stdio", authorityEffect: "none"}
      : undefined);
    const candidate = {__TAURI__: {core: {invoke, Channel: MockChannel}}};

    const first = startAreChatControlPlane(candidate);
    const second = startAreChatControlPlane(candidate);
    expect(second).toBe(first);
    await first;
    const channel = invoke.mock.calls[1]?.[1]?.onEvent as MockChannel<AreChatEvent>;
    channel.onmessage({type: "session.ready", emittedAtMs: Date.now(), threadId: "thread-buffered"});

    const observed: AreChatEvent[] = [];
    const unsubscribe = subscribeAreChatControlPlane((event) => observed.push(event));
    expect(observed).toMatchObject([{type: "session.ready", threadId: "thread-buffered"}]);
    expect(invoke).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});
