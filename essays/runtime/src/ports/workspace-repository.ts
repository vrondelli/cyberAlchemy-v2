import type { EssayWorkspace } from "../domain/model";

export interface WorkspaceRepository {
  load(workspaceId: string): Promise<EssayWorkspace | null>;
  save(workspace: EssayWorkspace, expectedStoredRevision: number | null): Promise<void>;
}

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly records = new Map<string, EssayWorkspace>();

  async load(workspaceId: string): Promise<EssayWorkspace | null> {
    const value = this.records.get(workspaceId);
    return value ? structuredClone(value) : null;
  }

  async save(workspace: EssayWorkspace, expectedStoredRevision: number | null): Promise<void> {
    const current = this.records.get(workspace.workspaceId);
    const currentRevision = current?.currentRevision ?? null;
    if (currentRevision !== expectedStoredRevision) {
      throw new Error(`repository revision conflict: expected ${expectedStoredRevision}, found ${currentRevision}`);
    }
    this.records.set(workspace.workspaceId, structuredClone(workspace));
  }
}
