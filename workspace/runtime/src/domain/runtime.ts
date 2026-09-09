import { GENERATED_WORKSPACE_SNAPSHOT } from "./workspace.generated";
import type { WorkspaceSnapshot } from "./workspace";

export interface CyberAlchemyWorkspaceInterface {
  inspectWorkspace(): WorkspaceSnapshot;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export class WorkspaceRuntime implements CyberAlchemyWorkspaceInterface {
  readonly #snapshot = deepFreeze(GENERATED_WORKSPACE_SNAPSHOT as WorkspaceSnapshot);

  inspectWorkspace(): WorkspaceSnapshot {
    return this.#snapshot;
  }
}
