import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {connectGatewayRpcTransport, createAppServerRpcClient, spawnAppServerRpcTransport} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {defaultGatewaySocket} from "./gateway-recovery.mjs";
import {inspectLiveCodexBinding, runLiveCodingAgentSession} from "../../agent-reasoning-engine/packages/coding-agent-runtime/live-session.mjs";
import {bindCodexProposal, parseCodexScopeConfig} from "../../agent-reasoning-engine/packages/coding-agent-runtime/codex-proposal.mjs";
import {createReadOnlyToolRuntime} from "../../agent-reasoning-engine/packages/coding-agent-runtime/read-only-tools.mjs";
import {buildRepositoryMap} from "../../agent-reasoning-engine/packages/coding-agent-runtime/repository-map.mjs";
import {createContainerSandbox} from "../../agent-reasoning-engine/packages/coding-agent-runtime/sandbox.mjs";
export {parseCodexScopeConfig};

export async function runCodexAppServerProposal(options, dependencies = {}) {
  const scope = parseCodexScopeConfig(options.config);
  const repositoryRoot = resolve(options.repositoryRoot);
  const repositoryMap = buildRepositoryMap({repository_root: repositoryRoot, paths: scope.observation_allowlist, ...scope.repository_map});
  const sandbox = scope.sandbox ? createContainerSandbox({config: scope.sandbox, repository_root: repositoryRoot}) : null;
  const toolRuntime = createReadOnlyToolRuntime({repository_root: repositoryRoot, observation_allowlist: scope.observation_allowlist, maximum_result_bytes: scope.max_context_bytes, repository_map: repositoryMap, sandbox});
  const profilePath = resolve(options.codexProfile);
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  const transportMode = options.transportMode ?? "gateway";
  if (transportMode !== "gateway" && transportMode !== "direct") throw new Error("coding-agent.unsupported-transport");
  const inspectBinding = dependencies.inspectBinding ?? inspectLiveCodexBinding;
  const binding = transportMode === "direct"
    ? inspectBinding({command: options.codexCommand, expected_version: profile.protocol_binding.observed_codex_version})
    : Object.freeze({ok: true, source: "gateway-handshake", expected_backend_adapter_id: "codex-app-server/v1", expected_version: profile.protocol_binding.observed_codex_version, observed_version: null, authority_effect: "none"});
  if (!binding.ok) return Object.freeze({schema_version: "are.codex-app-server-coding-proposal/v1", status: "BLOCK", reason_codes: binding.reason_codes, codex_binding: binding, authority_effect: "none"});

  const createClient = dependencies.createClient ?? ((transport) => createAppServerRpcClient({transport}));
  const connectGateway = dependencies.connectGateway ?? connectGatewayRpcTransport;
  const spawnTransport = dependencies.spawnTransport ?? spawnAppServerRpcTransport;
  const transport = transportMode === "gateway"
    ? connectGateway({socket_path: resolve(options.gatewaySocket ?? defaultGatewaySocket()), consumer_id: "codex:coding-proposal", lane: "interaction-bound", expected_backend_adapter_id: "codex-app-server/v1", connection_token: options.connectionToken ?? process.env.ARE_GATEWAY_CONNECTION_TOKEN, ...(options.gatewayResumeToken ? {resume_token: options.gatewayResumeToken} : {})})
    : spawnTransport({command: process.execPath, args: [resolve(options.wrapperPath), "--config", profilePath, "--repository-root", resolve(options.authorityRepositoryRoot), "--codex-command", options.codexCommand]});
  const client = createClient(transport);
  options.onClient?.(client);
  let session;
  try {
    session = await (dependencies.runSession ?? runLiveCodingAgentSession)({
      run_id: options.runId,
      entrypoint_selected: true,
      client,
      ...(transportMode === "gateway" ? {on_gateway_connected: options.onGatewayConnected,
        on_gateway_thread_started: options.onGatewayThreadStarted,
        on_gateway_turn_starting: options.onGatewayTurnStarting,
        on_gateway_turn_completed: options.onGatewayTurnCompleted} : {}),
      model: options.model,
      request: options.request,
      fixture_root: repositoryRoot,
      observation_allowlist: scope.observation_allowlist,
      mutation_allowlist: scope.mutation_allowlist,
      verification_command: scope.verification_command,
      max_context_bytes: scope.max_context_bytes,
      iterative_options: {tool_runtime: toolRuntime, tool_policy: scope.tool_policy, maximum_steps: scope.maximum_steps, repository_map: repositoryMap},
      approve: false,
      capture_proposal: true,
      durable_thread: options.durableProposalThread === true,
    });
  } finally {
    if (transportMode === "gateway" && !options.onGatewayConnected) {
      const resumeToken = transport.inspect?.().resume_token;
      if (typeof resumeToken === "string" && resumeToken) options.onGatewayContinuity?.(resumeToken);
    }
    options.onClient?.(null);
  }
  if (!session.proposal) return Object.freeze({...session, codex_binding: binding});
  const proposal = bindCodexProposal({proposal: session.proposal, scope_config: scope, codex_profile_bytes: readFileSync(profilePath)});
  return Object.freeze({...proposal, live_session: session, codex_binding: binding});
}
