import {describe, expect, it, vi} from "vitest";
import {scheduleSurfaceWarmup} from "./surface-warmup";

const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

describe("optional surface warmup", () => {
  it("waits for attachment and loads only one surface at a time", async () => {
    let attach!: () => void;
    let loaded!: () => void;
    const tasks: Array<() => void> = [];
    const first = vi.fn(() => new Promise<void>(resolve => { loaded = resolve; }));
    const second = vi.fn(async () => undefined);
    scheduleSurfaceWarmup(new Promise<void>(resolve => { attach = resolve; }), [first, second], task => { tasks.push(task); return () => undefined; });
    await flush(); expect(tasks).toHaveLength(0);
    attach(); await flush(); expect(tasks).toHaveLength(1);
    tasks.shift()!(); await flush(); expect(first).toHaveBeenCalledOnce(); expect(tasks).toHaveLength(0);
    loaded(); await flush(); expect(tasks).toHaveLength(1);
    tasks.shift()!(); await flush(); expect(second).toHaveBeenCalledOnce();
  });

  it("continues after attachment and preload failures", async () => {
    const tasks: Array<() => void> = [];
    const second = vi.fn(async () => undefined);
    scheduleSurfaceWarmup(Promise.reject(new Error("offline")), [() => { throw Error("load failed"); }, second], task => { tasks.push(task); return () => undefined; });
    await flush(); tasks.shift()!(); await flush(); tasks.shift()!(); await flush();
    expect(second).toHaveBeenCalledOnce();
  });

  it("cancels queued work on unmount", async () => {
    const loader = vi.fn(async () => undefined), cancel = vi.fn();
    let task!: () => void;
    const stop = scheduleSurfaceWarmup(Promise.resolve(), [loader], next => { task = next; return cancel; });
    await flush(); stop(); task(); await flush();
    expect(cancel).toHaveBeenCalledOnce(); expect(loader).not.toHaveBeenCalled();
  });
});
