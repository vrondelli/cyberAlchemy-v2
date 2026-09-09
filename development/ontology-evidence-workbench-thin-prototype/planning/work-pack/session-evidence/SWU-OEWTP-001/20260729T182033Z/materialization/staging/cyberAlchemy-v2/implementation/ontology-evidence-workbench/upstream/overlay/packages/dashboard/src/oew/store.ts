import { OEW_UI_STORE_HANDLE, OewBundleError } from "./types.ts";

/**
 * @typedef {import("./types.ts").OewSourceIndexEntry} OewSourceIndexEntry
 * @typedef {import("./types.ts").VerifiedOewBundle} VerifiedOewBundle
 * @typedef {object} OewFilters
 * @property {string} text
 * @property {string[]} kind
 * @property {string[]} relation
 * @property {string[]} disposition
 * @property {string[]} diagnostic
 * @typedef {object} OewStoreState
 * @property {typeof OEW_UI_STORE_HANDLE} handle
 * @property {"evidence-only"} mode
 * @property {string | null} selectedSourceRef
 * @property {string | null} selectedPresentationId
 * @property {OewSourceIndexEntry["kind"] | null} selectedKind
 * @property {OewFilters} filters
 * @property {"none"} authorityEffect
 * @typedef {(state: OewStoreState) => void} OewStoreListener
 * @typedef {object} OewStore
 * @property {typeof OEW_UI_STORE_HANDLE} handle
 * @property {VerifiedOewBundle} bundle
 * @property {() => OewStoreState} getState
 * @property {(sourceRef: string) => OewSourceIndexEntry | null} getBySourceRef
 * @property {(sourceRef: string) => OewStoreState} selectSourceRef
 * @property {() => OewStoreState} clearSelection
 * @property {(listener: unknown) => () => boolean} subscribe
 */

/**
 * @param {VerifiedOewBundle} bundle
 * @returns {OewStore}
 */
export function createOewStore(bundle = JSON.parse("null")) {
  if (!bundle?.sourceRefIndex || !Array.isArray(bundle.sourceRefs)) {
    throw new OewBundleError("VERIFIED_BUNDLE_REQUIRED");
  }
  /** @type {OewStoreState} */
  let state = JSON.parse(JSON.stringify({
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
  }));
  /** @type {Set<OewStoreListener>} */
  const listeners = new Set([Function.prototype]);
  listeners.delete(Function.prototype);
  const emit = () => {
    for (const listener of listeners) listener(state);
  };
  return Object.freeze({
    handle: OEW_UI_STORE_HANDLE,
    bundle,
    getState: () => state,
    /** @param {string} sourceRef */
    getBySourceRef: (sourceRef = "") =>
      bundle.sourceRefIndex[sourceRef] ?? null,
    /** @param {string} sourceRef */
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
    /** @param {unknown} listener */
    subscribe(listener = JSON.parse("null")) {
      if (typeof listener !== "function") {
        throw new OewBundleError("LISTENER_INVALID");
      }
      const stateListener = /** @type {OewStoreListener} */ (listener);
      listeners.add(stateListener);
      return () => listeners.delete(stateListener);
    },
  });
}
