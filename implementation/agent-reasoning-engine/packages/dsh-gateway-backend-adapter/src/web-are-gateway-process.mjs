import {createFileGatewaySessionStore}
  from "../../codex-app-server-wrapper/src/gateway-session-store.mjs";
import {prepareAreRepositoryWebPrompt} from "./web-prompt-permit.mjs";
import {createDshOwnedPreparationRuntime} from "./web-owned-preparation.mjs";
import {validModelContextSizeDiagnostic} from './web-model-context-batch.mjs';
import {acquireReasoningStateWriterLock, recoverReasoningStateLedger}
  from "../../reasoning-state-runtime/index.mjs";

export const DSH_WEB_ARE_GATEWAY_PROCESS_SCHEMA = "are.dsh-web-gateway-process/v1";

const STORE_METHODS = new Set(["append", "compact", "getSession", "inspect",
  "hasFaultedSession", "hasIncompleteHistoryAudit"]);

if (process.argv[2] === "--are-dsh-web-gateway-process") {
  const path = process.argv[3];
  const storeId = process.argv[4];
  let store;
  let objectiveLedger;
  let objectiveLock;
  let ownedPreparation;
  let preparations = Promise.resolve();
  let closing = false;
  try {
    if (typeof path !== "string" || !path || typeof storeId !== "string" || !storeId) {
      throw new Error("dsh-web.gateway-process-arguments-invalid");
    }
    store = createFileGatewaySessionStore({path, store_id: storeId});
    const ledgerPath = `${path}.objectives.jsonl`;
    const locked = acquireReasoningStateWriterLock({path: ledgerPath,
      owner_id: `dsh-objectives:${storeId}:${process.pid}`});
    if (!locked.ok) throw new Error(`dsh-web.objective-lock-failed:${locked.reason_codes.join("+")}`);
    objectiveLock = locked.lock;
    const recovered = recoverReasoningStateLedger({path: ledgerPath, ledger_id: `dsh-objectives:${storeId}`});
    if (!recovered.ok) throw new Error(`dsh-web.objective-recovery-failed:${recovered.reason_codes.join("+")}`);
    objectiveLedger = recovered.ledger;
    ownedPreparation = createDshOwnedPreparationRuntime({session_store: store, ledger: objectiveLedger,
      requirement_seed: JSON.parse(process.argv[5] ?? "null"),
      plan_selection: JSON.parse(process.argv[6] ?? "null")});
    process.send?.({schema_version: DSH_WEB_ARE_GATEWAY_PROCESS_SCHEMA,
      kind: "ready", process_id: process.pid});
  } catch (error) {
    objectiveLedger?.close();
    objectiveLock?.release();
    store?.close();
    process.send?.({schema_version: DSH_WEB_ARE_GATEWAY_PROCESS_SCHEMA,
      kind: "startup-failed", reason: error?.message ?? "dsh-web.gateway-process-start-failed"},
    () => process.exit(1));
  }
  if (store) {
    process.on("disconnect", () => {
      try { objectiveLedger.close(); objectiveLock.release(); store.close(); }
      finally { process.exit(0); }
    });
    process.on("message", async (message) => {
      if (closing || message?.schema_version !== DSH_WEB_ARE_GATEWAY_PROCESS_SCHEMA
        || !Number.isSafeInteger(message.id) || message.id < 1
        || typeof message.method !== "string" || !Array.isArray(message.args)) {
        process.exit(1);
      }
      let response;
      try {
        if (message.method === "prepare") {
          if (message.args.length !== 1) throw new Error("dsh-web.gateway-prepare-arguments-invalid");
          const input = message.args[0];
          const work = preparations.then(() => input?.owned_binding === undefined
            ? prepareAreRepositoryWebPrompt(input) : ownedPreparation.prepare(input));
          preparations = work.catch(() => {});
          response = {ok: true, value: await work};
        } else if (message.method === 'readPlan') {
          if (message.args.length !== 1) throw new Error('dsh-web.gateway-read-arguments-invalid');
          response = {ok: true, value: ownedPreparation.readPlan(message.args[0])};
        } else if (message.method === "close") {
          if (message.args.length !== 0) throw new Error("dsh-web.gateway-close-arguments-invalid");
          closing = true;
          await preparations;
          objectiveLedger.close();
          objectiveLock.release();
          store.close();
          response = {ok: true, value: null};
        } else if (STORE_METHODS.has(message.method)) {
          response = {ok: true, value: store[message.method](...message.args)};
        } else throw new Error("dsh-web.gateway-process-method-invalid");
      } catch (error) {
        response = {ok: false, reason: message.method === "prepare"
          ? "dsh-web.gateway-preparation-denied"
          : error?.message ?? "dsh-web.gateway-process-call-failed",
          ...(message.method === 'prepare' && validModelContextSizeDiagnostic(error?.size_diagnostic)
            ? {size_diagnostic: error.size_diagnostic} : {})};
      }
      process.send?.({schema_version: DSH_WEB_ARE_GATEWAY_PROCESS_SCHEMA,
        kind: "response", id: message.id, ...response}, () => {
        if (closing) process.exit(response.ok ? 0 : 1);
      });
    });
  }
}
