import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
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
  const inspectBinding = dependencies.inspectBinding ?? inspectLiveCodexBinding;
  const binding = inspectBinding({command: options.codexCommand, expected_version: profile.protocol_binding.observed_codex_version});
  if (!binding.ok) return Object.freeze({schema_version: "are.codex-app-server-coding-proposal/v1", status: "BLOCK", reason_codes: binding.reason_codes, codex_binding: binding, authority_effect: "none"});

  const wrapperPath = resolve(options.wrapperPath);
  const createClient = dependencies.createClient ?? ((transport) => createAppServerRpcClient({transport}));
  const spawnTransport = dependencies.spawnTransport ?? ((input) => spawnAppServerRpcTransport(input));
  const client = createClient(spawnTransport({
    command: process.execPath,
    args: [wrapperPath, "--config", profilePath, "--repository-root", resolve(options.authorityRepositoryRoot), "--codex-command", options.codexCommand]
  }));
  options.onClient?.(client);
  let session;
  try {
    session = await (dependencies.runSession ?? runLiveCodingAgentSession)({
      run_id: options.runId,
      client,
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
    });
  } finally {
    options.onClient?.(null);
  }
  if (!session.proposal) return Object.freeze({...session, codex_binding: binding});
  const proposal = bindCodexProposal({proposal: session.proposal, scope_config: scope, codex_profile_bytes: readFileSync(profilePath)});
  return Object.freeze({...proposal, live_session: session, codex_binding: binding});
}
