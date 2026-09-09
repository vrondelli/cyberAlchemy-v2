import {OEW_UI_STORE_HANDLE, OewBundleError} from "./types.ts";

export function createOewStore(bundle) {
  if (!bundle?.sourceRefIndex || !Array.isArray(bundle.sourceRefs)) {
    throw new OewBundleError("VERIFIED_BUNDLE_REQUIRED");
  }
  let state = {
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
  const listeners = new Set();
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  return Object.freeze({
    handle: OEW_UI_STORE_HANDLE,
    bundle,
    getState: () => state,
    getBySourceRef: (sourceRef) => bundle.sourceRefIndex[sourceRef] ?? null,
    selectSourceRef(sourceRef) {
      const selected = bundle.sourceRefIndex[sourceRef];
      if (!selected) throw new OewBundleError("SOURCE_REF_UNKNOWN", sourceRef);
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
    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new OewBundleError("LISTENER_INVALID");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
