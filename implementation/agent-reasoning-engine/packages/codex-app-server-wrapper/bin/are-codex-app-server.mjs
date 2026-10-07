#!/usr/bin/env node
import {execFileSync} from "node:child_process";
import {resolve} from "node:path";
import {createCodexAppServerWrapper, loadRepositoryProfile, protocolBindingCheck, recoverReasoningStateLedger, resolveEntrypointContinuity, runStdioProxy} from "../index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const configArg = argument("--config");
const repositoryRootArg = argument("--repository-root");
const reasoningStateLogArg = argument("--reasoning-state-log");
const continuityStateArg = argument("--continuity-state");
const continuityActivationArg = argument("--continuity-activation");
const codexCommandArg = argument("--codex-command") ?? "codex";
const codexArgs = process.argv.flatMap((value, index, values) => value === "--codex-arg" && values[index + 1] != null ? [values[index + 1]] : []);
const missingCodexArg = process.argv.some((value, index, values) => value === "--codex-arg" && values[index + 1] == null);
if (!configArg || !repositoryRootArg || missingCodexArg) {
  process.stderr.write("Usage: are-codex-app-server --config <profile.json> --repository-root <repository> [--codex-command <path>] [--codex-arg <arg>]... [--reasoning-state-log <events.jsonl>] [--continuity-state <snapshot.json> | --continuity-activation <manifest.json>]\n");
  process.exitCode = 2;
} else {
  const repositoryRoot = resolve(repositoryRootArg);
  const modulePort = createNativeSemanticModulePort();
  const loaded = loadRepositoryProfile(resolve(configArg), repositoryRoot);
  if (!loaded.ok) {
    process.stderr.write(`${JSON.stringify(loaded)}\n`);
    process.exitCode = 3;
  } else {
    let version = "unavailable";
    try {
      version = execFileSync(codexCommandArg, ["--version"], {encoding: "utf8"}).trim();
    } catch {
      version = "unavailable";
    }
    const protocol = protocolBindingCheck(loaded.value.protocol_binding, version);
    if (!protocol.ok) {
      process.stderr.write(`${JSON.stringify(protocol)}\n`);
      process.exitCode = 4;
    } else {
      const continuity = resolveEntrypointContinuity({loaded_profile: loaded.value, repository_root: repositoryRoot, activation_manifest_path: continuityActivationArg, state_path: continuityStateArg});
      if (!continuity.ok) {
        process.stderr.write(`${JSON.stringify(continuity)}\n`);
        process.exitCode = 6;
      }
      const recovered = continuity.ok && reasoningStateLogArg
        ? recoverReasoningStateLedger({path: resolve(reasoningStateLogArg), ledger_id: continuity.loaded_profile.reasoning_state.ledger_id})
        : null;
      if (!continuity.ok) {
        // Diagnostic already emitted above.
      } else if (recovered && !recovered.ok) {
        process.stderr.write(`${JSON.stringify(recovered)}\n`);
        process.exitCode = 5;
      } else {
        const wrapper = createCodexAppServerWrapper({
          loaded_profile: continuity.loaded_profile,
          decision_profile: loaded.decision_profile,
          definition_catalog: loaded.definition_catalog,
          ontology_snapshot: loaded.ontology_snapshot,
          source_snapshot: loaded.source_snapshot,
          context_source_provider: loaded.context_source_provider,
          semantic_profile: loaded.semantic_profile,
          module_port: modulePort,
          reasoning_ledger: recovered?.ledger,
          continuity_binding_provider: continuity.provider,
        });
        const backend = runStdioProxy({wrapper, command: codexCommandArg, args: codexArgs.length > 0 ? codexArgs : ["app-server"]});
        for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
          backend.kill(signal);
          process.exitCode = signal === "SIGINT" ? 130 : 143;
        });
        backend.once("exit", (code, signal) => {
          if (process.exitCode == null && (code !== 0 || signal != null)) {
            process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 4);
          }
        });
      }
    }
  }
}
