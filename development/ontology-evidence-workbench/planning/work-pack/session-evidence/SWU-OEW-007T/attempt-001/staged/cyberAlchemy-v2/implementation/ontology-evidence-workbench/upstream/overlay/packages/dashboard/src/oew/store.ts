import {OEW_UI_STORE_HANDLE, OewBundleError} from "./types.ts";

/**
 * @typedef {{
 *   kind: "node" | "edge",
 *   presentationId: string,
 *   sourceRef: string,
 *   row: Record<string, unknown>
 * }} OewSourceEntry
 */
/**
 * @typedef {{
 *   sourceRefIndex: Record<string, OewSourceEntry>,
 *   sourceRefs: string[]
 * }} VerifiedBundle
 */
/**
 * @typedef {{
 *   handle: string,
 *   mode: "evidence-only",
 *   selectedSourceRef: string | null,
 *   selectedPresentationId: string | null,
 *   selectedKind: "node" | "edge" | null,
 *   filters: {
 *     text: string,
 *     kind: string[],
 *     relation: string[],
 *     disposition: string[],
 *     diagnostic: string[]
 *   },
 *   authorityEffect: "none"
 * }} OewStoreState
 */

/**
 * @param {VerifiedBundle} bundle
 */
export function createOewStore(bundle) {
  if (!bundle?.sourceRefIndex || !Array.isArray(bundle.sourceRefs)) {
    throw new OewBundleError("VERIFIED_BUNDLE_REQUIRED");
  }
  /** @type {OewStoreState} */
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
  /** @type {Set<(state: OewStoreState) => void>} */
  const listeners = new Set();
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  return Object.freeze({
    handle: OEW_UI_STORE_HANDLE,
    bundle,
    getState: () => state,
    /**
     * @param {string} sourceRef
     */
    getBySourceRef: (sourceRef) => bundle.sourceRefIndex[sourceRef] ?? null,
    /**
     * @param {string} sourceRef
     */
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
    /**
     * @param {(state: OewStoreState) => void} listener
     */
    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new OewBundleError("LISTENER_INVALID");
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
