import {receipts} from "wlc-startup-probe";
declare const __WLC_BUILD_ID__: string;
declare const __WLC_ARM__: string;
Object.defineProperty(globalThis, "__WLC_PHASE_EVIDENCE__", {
  configurable: false,
  get: () => ({
    schema_version: "workspace.phase-export/v1",
    build_id: __WLC_BUILD_ID__, arm: __WLC_ARM__,
    receipts: receipts.map(row => ({...row})), authority_effect: "none",
  }),
});
