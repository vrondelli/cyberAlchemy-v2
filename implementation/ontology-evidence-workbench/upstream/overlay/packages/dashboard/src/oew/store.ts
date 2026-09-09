import { OEW_UI_STORE_HANDLE, OewBundleError } from "./types.ts";

type JsonRecord = Record<string, unknown>;
type VerifiedOewBundle = ReturnType<
  typeof import("./types.ts").validateOewBundle
>;
type OewSourceIndexEntry = VerifiedOewBundle["sourceRefIndex"][string];
type OewFilters = {
  text: string;
  kind: string[];
  relation: string[];
  disposition: string[];
  diagnostic: string[];
};
type OewStoreState = {
  handle: typeof OEW_UI_STORE_HANDLE;
  mode: "evidence-only";
  selectedSourceRef: string | null;
  selectedPresentationId: string | null;
  selectedKind: OewSourceIndexEntry["kind"] | null;
  filters: OewFilters;
  authorityEffect: "none";
};
type OewStoreListener = (state: OewStoreState) => void;

export function createOewStore(bundle: VerifiedOewBundle | null = null) {
  if (!bundle?.sourceRefIndex || !Array.isArray(bundle.sourceRefs)) {
    throw new OewBundleError("VERIFIED_BUNDLE_REQUIRED");
  }
  let state: OewStoreState = {
    handle: OEW_UI_STORE_HANDLE,
    mode: "evidence-only",
    selectedSourceRef: null,
    selectedPresentationId: null,
    selectedKind: null,
    filters: {
      text: "",
      kind: [],
      relation: [],
      disposition: [],
      diagnostic: [],
    },
    authorityEffect: "none",
  };
  const listeners = new Set<OewStoreListener>();
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  return Object.freeze({
    handle: OEW_UI_STORE_HANDLE,
    bundle,
    getState: () => state,
    getBySourceRef: (sourceRef = "") =>
      bundle.sourceRefIndex[sourceRef] ?? null,
    selectSourceRef(sourceRef = "") {
      const selected = bundle.sourceRefIndex[sourceRef];
      if (!selected) {
        throw new OewBundleError("SOURCE_REF_UNKNOWN", sourceRef);
      }
      state = {
        ...state,
        selectedSourceRef: sourceRef,
        selectedPresentationId: selected.presentationId,
        selectedKind: selected.kind,
      };
      emit();
      return state;
    },
    clearSelection() {
      state = {
        ...state,
        selectedSourceRef: null,
        selectedPresentationId: null,
        selectedKind: null,
      };
      emit();
      return state;
    },
    subscribe(listener: unknown = null) {
      if (typeof listener !== "function") {
        throw new OewBundleError("LISTENER_INVALID");
      }
      const stateListener = listener as OewStoreListener;
      listeners.add(stateListener);
      return () => listeners.delete(stateListener);
    },
  });
}

type SceneRelationRef = Readonly<{
  source_relation_id: string;
  scene_digest: string;
}>;
type SceneRecord = JsonRecord & {
  scene_digest: string;
};
type SceneResolution = Readonly<{
  status: string;
  ref: SceneRelationRef;
  facet?: Readonly<JsonRecord>;
}>;
type SceneReferenceAdapter = {
  admitKnowledgeSceneV13: (scene: unknown) => Promise<SceneRecord>;
  resolveRelationRef: (
    scene: SceneRecord,
    ref: SceneRelationRef,
  ) => SceneResolution;
};
type SceneFocus = Readonly<{
  kind: string;
  target_id: string;
  reason: string | null;
}>;
type SceneNavigationState = Readonly<{
  mode: "scene-reference";
  sceneDigest: string;
  selectedRelationRef: SceneRelationRef | null;
  focus: SceneFocus | null;
  recoveryReason: string | null;
  authorityEffect: "none";
}>;
type SceneStoreListener = (state: SceneNavigationState) => void;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const focusFallback = (
  scene: SceneRecord,
  reason: string | null = null,
): SceneFocus => {
  const frame = isRecord(scene.navigation_frame) ? scene.navigation_frame : {};
  const selected = isRecord(frame.selected) ? frame.selected : {};
  if (typeof frame.initiating_control_id === "string" && frame.initiating_control_id) {
    return {kind: "initiating-control", target_id: frame.initiating_control_id, reason};
  }
  const selectedEntityId = selected.source_node_id ?? selected.node_id ?? selected.entity_id;
  if (typeof selectedEntityId === "string" && selectedEntityId) {
    return {kind: "selected-entity", target_id: selectedEntityId, reason};
  }
  if (typeof scene.scene_id === "string" && scene.scene_id) {
    return {kind: "scene-heading", target_id: `${scene.scene_id}:heading`, reason};
  }
  return {kind: "workbench-heading", target_id: "ontology-workbench-heading", reason};
};

const selectedRef = (scene: SceneRecord): SceneRelationRef | null => {
  const frame = isRecord(scene.navigation_frame) ? scene.navigation_frame : {};
  const selected = isRecord(frame.selected) ? frame.selected : {};
  if (
    (selected?.kind === "relation" || selected?.kind === "path-hop") &&
    isRecord(selected.relation_ref)
  ) {
    return selected.relation_ref as SceneRelationRef;
  }
  return null;
};

/**
 * Scene navigation is isolated behind an injected adapter so the legacy evidence
 * store remains independently loadable. Admission completes before any state swap.
 */
export async function createSceneNavigationStore(
  adapter: SceneReferenceAdapter,
  sceneInput: unknown,
) {
  if (
    typeof adapter?.admitKnowledgeSceneV13 !== "function" ||
    typeof adapter?.resolveRelationRef !== "function"
  ) {
    throw new OewBundleError("SCENE_REFERENCE_ADAPTER_REQUIRED");
  }
  let scene = await adapter.admitKnowledgeSceneV13(sceneInput);
  const listeners = new Set<SceneStoreListener>();

  const deriveState = (
    candidate: SceneRecord,
    ref: SceneRelationRef | null = selectedRef(candidate),
    recoveryReason: string | null = null,
  ): SceneNavigationState => {
    if (ref !== null) {
      const resolution = adapter.resolveRelationRef(candidate, ref);
      if (resolution.status === "resolved") {
        return Object.freeze({
          mode: "scene-reference",
          sceneDigest: candidate.scene_digest,
          selectedRelationRef: resolution.ref,
          focus: null,
          recoveryReason: null,
          authorityEffect: "none",
        });
      }
      recoveryReason = `relation-${resolution.status}`;
    }
    return Object.freeze({
      mode: "scene-reference",
      sceneDigest: candidate.scene_digest,
      selectedRelationRef: null,
      focus: Object.freeze(focusFallback(candidate, recoveryReason)),
      recoveryReason,
      authorityEffect: "none",
    });
  };

  let state = deriveState(scene);
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  const choose = (ref: SceneRelationRef | null | undefined) => {
    state = deriveState(scene, ref, "relation-invalid");
    emit();
    return state;
  };

  return Object.freeze({
    getScene: () => scene,
    getState: () => state,
    getSelectedRelation() {
      if (state.selectedRelationRef === null) return null;
      const resolution = adapter.resolveRelationRef(scene, state.selectedRelationRef);
      return resolution.status === "resolved" ? resolution.facet : null;
    },
    selectRelationRef: choose,
    selectPathHop(hop: unknown) {
      const relationRef = isRecord(hop) && isRecord(hop.relation_ref)
        ? hop.relation_ref as SceneRelationRef
        : undefined;
      return choose(relationRef);
    },
    async restoreScene(nextSceneInput: unknown) {
      const admitted = await adapter.admitKnowledgeSceneV13(nextSceneInput);
      const nextState = deriveState(admitted);
      scene = admitted;
      state = nextState;
      emit();
      return state;
    },
    clearSelection() {
      state = deriveState(scene, null, "selection-cleared");
      emit();
      return state;
    },
    subscribe(listener: unknown) {
      if (typeof listener !== "function") {
        throw new OewBundleError("LISTENER_INVALID");
      }
      const stateListener = listener as SceneStoreListener;
      listeners.add(stateListener);
      return () => listeners.delete(stateListener);
    },
  });
}
