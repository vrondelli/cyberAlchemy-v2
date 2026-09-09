import { expect, it } from "vitest";
import type { SceneDescriptor } from "./workbenchState";
import { boundedSceneHistory } from "./sceneHistory";
it("caps scene history deterministically", () => { const scene = (focusId: string): SceneDescriptor => ({ focusId, mode: "focus", selection: { kind: "node", id: focusId } }); expect(boundedSceneHistory([scene("a"), scene("b")], scene("c"), 2).map((item) => item.focusId)).toEqual(["b", "c"]); });
