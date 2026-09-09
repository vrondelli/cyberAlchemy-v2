import type { SceneDescriptor } from "./workbenchState";
export function boundedSceneHistory(history: readonly SceneDescriptor[], next: SceneDescriptor, limit = 40): readonly SceneDescriptor[] { return [...history, next].slice(-limit); }
