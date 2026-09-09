import { describe, expect, it } from "vitest";
import { EssaysRuntime } from "../domain/runtime";
import { LocalStorageWorkspaceRepository } from "./local-storage-repository";

class TestStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("LocalStorageWorkspaceRepository", () => {
  it("round-trips an Essays-owned workspace snapshot", async () => {
    const storage = new TestStorage();
    const repository = new LocalStorageWorkspaceRepository(storage, "test.essays.");
    const runtime = new EssaysRuntime(repository, () => "2026-08-30T12:00:00.000Z");
    const created = await runtime.createEssayWorkspace({
      workspaceId: "saved",
      title: "Saved essay",
      writer: { writerId: "writer", displayName: "Writer" },
    });
    const loaded = await runtime.openEssayWorkspace("saved");
    expect(loaded).toEqual(created);
    expect(JSON.parse(storage.getItem("test.essays.saved")!).schemaVersion).toBe("essays-workspace/v1");
  });
});
