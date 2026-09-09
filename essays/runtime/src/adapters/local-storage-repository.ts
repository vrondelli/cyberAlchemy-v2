import { EssaysProblem, type EssayWorkspace } from "../domain/model";
import type { WorkspaceRepository } from "../ports/workspace-repository";

export class LocalStorageWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly storage: Storage,
    private readonly keyPrefix = "cyberalchemy.essays.workspace.",
  ) {}

  async load(workspaceId: string): Promise<EssayWorkspace | null> {
    const serialized = this.storage.getItem(this.key(workspaceId));
    if (!serialized) return null;
    const value = JSON.parse(serialized) as EssayWorkspace;
    if (value.schemaVersion !== "essays-workspace/v1" || value.workspaceId !== workspaceId) {
      throw new EssaysProblem("INVALID_INPUT", "Stored workspace is not a compatible Essays workspace", { workspaceId });
    }
    return structuredClone(value);
  }

  async save(workspace: EssayWorkspace, expectedStoredRevision: number | null): Promise<void> {
    const current = await this.load(workspace.workspaceId);
    const actualRevision = current?.currentRevision ?? null;
    if (actualRevision !== expectedStoredRevision) {
      throw new Error(`repository revision conflict: expected ${expectedStoredRevision}, found ${actualRevision}`);
    }
    this.storage.setItem(this.key(workspace.workspaceId), JSON.stringify(workspace));
  }

  private key(workspaceId: string): string {
    return `${this.keyPrefix}${workspaceId}`;
  }
}
