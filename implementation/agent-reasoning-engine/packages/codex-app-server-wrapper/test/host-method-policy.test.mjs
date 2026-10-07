import assert from "node:assert/strict";
import test from "node:test";

import catalog from "../src/host-client-method-catalog.v1.json" with {type: "json"};
import {codexGatewayGeneratedParameterPosture, codexGatewayLifecycleParameterPosture, codexServerNotificationRequiresAcceptedTurn, codexServerRequestCriticalShapePosture, codexServerRequestTurnPosture, gatewayClientMethodPosture, gatewayServerMethodPosture, hostMethodCatalogBindingCheck, HOSTED_EFFECT_DYNAMIC_TOOL, hostedEffectToolCallPosture, sharedWrapperServerRequestPosture} from "../src/host-method-policy.mjs";

test("installed-host catalog classifies every observed client request and fails closed on drift", () => {
  assert.equal(catalog.schema_version, "are.codex-host-client-method-catalog/v1");
  assert.equal(catalog.client_request_methods.length, 164);
  assert.equal(new Set(catalog.client_request_methods).size, 164);
  assert.equal(hostMethodCatalogBindingCheck("codex-cli 0.155.0-alpha.16.4"), true);
  assert.equal(hostMethodCatalogBindingCheck("codex-cli 0.155.0-alpha.16.5"), false);
  for (const method of catalog.client_request_methods) {
    const posture = gatewayClientMethodPosture({jsonrpc: "2.0", id: 1, method, params: {}});
    assert.equal(["admitted-host", "rejected"].includes(posture.kind), true, method);
    assert.notEqual(posture.reason_code, "host.method-unknown", method);
  }
  assert.equal(gatewayClientMethodPosture({jsonrpc: "2.0", method: "initialized", params: {}}).kind, "admitted-host");
  assert.deepEqual(gatewayClientMethodPosture({jsonrpc: "2.0", id: 1, result: {}}), {kind: "response"});
  assert.deepEqual(gatewayClientMethodPosture({jsonrpc: "2.0", id: 2, method: "future/effect"}),
    {kind: "rejected", reason_code: "host.method-unknown"});
});

test("gateway catalog rejects ungoverned effects but retains reviewed lifecycle and ARE-local methods", () => {
  for (const method of ["fs/writeFile", "fs/remove", "config/value/write", "plugin/install", "mcpServer/tool/call",
    "remoteControl/enable", "thread/inject_items", "thread/archive", "thread/delete", "thread/shellCommand",
    "command/exec/write", "process/writeStdin", "review/start"]) {
    assert.deepEqual(gatewayClientMethodPosture({jsonrpc: "2.0", id: 1, method}),
      {kind: "rejected", reason_code: "host.method-ungoverned"}, method);
  }
  for (const method of ["initialize", "model/list", "hooks/list", "thread/start", "thread/resume", "thread/compact/start", "thread/fork", "thread/name/set",
    "thread/read", "thread/turns/list", "mcpServerStatus/list", "turn/start", "turn/steer", "turn/interrupt"]) {
    assert.equal(gatewayClientMethodPosture({jsonrpc: "2.0", id: 1, method}).kind, "admitted-host", method);
  }
  assert.equal(gatewayClientMethodPosture({jsonrpc: "2.0", id: 1,
    method: "cyberalchemy/continuation/registerPlan"}).kind, "admitted-local");
  assert.equal(gatewayClientMethodPosture({jsonrpc: "2.0", id: 1,
    method: "cyberalchemy/hostedEffect/assess"}).kind, "admitted-local");
});

test("model picker bootstrap is a bounded read, not a general host-method opening", () => {
  const request = params => ({jsonrpc: "2.0", id: 1, method: "model/list", params});
  assert.equal(gatewayClientMethodPosture(request({limit: 20, includeHidden: false})).kind, "admitted-host");
  for (const params of [{}, {limit: 0, includeHidden: false}, {limit: 101, includeHidden: false},
    {limit: 20, includeHidden: true}, {limit: 20, includeHidden: false, futureFlag: true},
    {limit: 20, includeHidden: false, cursor: "x".repeat(1025)}]) {
    assert.equal(codexGatewayLifecycleParameterPosture(request(params)).kind, "rejected", JSON.stringify(params));
  }
  assert.deepEqual(codexGatewayLifecycleParameterPosture(request({limit: 20, includeHidden: false,
    cursor: "next-page"})), {kind: "admitted"});
  for (const method of ["project/list", "config/read", "account/read"]) {
    assert.equal(gatewayClientMethodPosture({jsonrpc: "2.0", id: 2, method, params: {}}).kind,
      "rejected", method);
  }
});

test("installed-host server catalog classifies scoped events and suppresses unscoped payloads", () => {
  assert.equal(catalog.server_notification_methods.length, 82);
  assert.equal(catalog.server_request_methods.length, 11);
  assert.equal(catalog.server_notification_required_thread_id_methods.length, 58);
  assert.equal(catalog.server_request_required_thread_id_methods.length, 7);
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "turn/completed",
    params: {threadId: "owned-thread", turn: {id: "turn-1", status: "completed"}}}),
  {kind: "scoped", thread_id: "owned-thread"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "turn/completed",
    params: {turn: {id: "private-turn"}}}), {kind: "rejected", reason_code: "host.server-thread-id-required"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "warning", params: {message: "global"}}),
    {kind: "suppress-unscoped-notification"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "warning",
    params: {threadId: "owned-thread", message: "scoped"}}), {kind: "scoped", thread_id: "owned-thread"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "process/outputDelta",
    params: {deltaBase64: "cHJpdmF0ZQ=="}}), {kind: "suppress-unscoped-notification"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 1, method: "execCommandApproval",
    params: {command: ["private"]}}), {kind: "deny-unscoped-request"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 2, method: "item/tool/requestUserInput",
    params: {threadId: "owned-thread"}}), {kind: "scoped", thread_id: "owned-thread"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 6, method: "item/tool/call",
    params: {threadId: "owned-thread"}}), {kind: "deny-unassessed-request"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 4, method: "currentTime/read",
    params: {threadId: "owned-thread"}}), {kind: "scoped", thread_id: "owned-thread"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 5, method: "currentTime/read",
    params: {}}), {kind: "rejected", reason_code: "host.server-thread-id-required"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method: "future/private",
    params: {threadId: "owned-thread"}}), {kind: "rejected", reason_code: "host.server-method-unknown"});
  assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", id: 3, result: {}}), {kind: "response"});
});

test("Codex lifecycle events need a bounded turn identity and a matching phase status", () => {
  for (const [method, status] of [["turn/started", "inProgress"], ["turn/completed", "completed"],
    ["turn/completed", "failed"], ["turn/completed", "interrupted"]]) {
    assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method,
      params: {threadId: "owned-thread", turn: {id: "turn-1", status}}}),
    {kind: "scoped", thread_id: "owned-thread"});
  }
  for (const [method, turn] of [["turn/started", {id: "turn-1", status: "completed"}],
    ["turn/completed", {id: "turn-1", status: "inProgress"}],
    ["turn/completed", {id: " ", status: "completed"}],
    ["turn/completed", {status: "completed"}],
    ["turn/completed", {id: "turn-1", status: "future"}]]) {
    assert.deepEqual(gatewayServerMethodPosture({jsonrpc: "2.0", method,
      params: {threadId: "owned-thread", turn}}),
    {kind: "rejected", reason_code: "host.server-turn-lifecycle-invalid"});
  }
});

test("pinned Codex notification turn binding covers every schema-required turnId", () => {
  assert.equal(catalog.server_notification_required_turn_id_methods.length, 26);
  assert.deepEqual(catalog.server_notification_optional_turn_id_methods,
    ["thread/goal/updated", "hook/started", "hook/completed"]);
  for (const method of catalog.server_notification_methods) {
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method),
      catalog.server_notification_required_turn_id_methods.includes(method)
        || method === "turn/started" || method === "turn/completed", method);
  }
  for (const method of ["error", "thread/tokenUsage/updated", "thread/compacted", "model/rerouted",
    "autoApprovalReview/strictReviewRequired"]) {
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method), true, method);
  }
  for (const method of catalog.server_notification_optional_turn_id_methods) {
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method), false, method);
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method, {turnId: null}), false, method);
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method, {turnId: "accepted-turn"}), true, method);
    assert.equal(codexServerNotificationRequiresAcceptedTurn(method, {turnId: {invalid: true}}), true, method);
  }
  assert.equal(codexServerNotificationRequiresAcceptedTurn("future/private"), false);
});

test("direct wrapper classifies every installed-host server request without client fallback", () => {
  const assessed = new Set(["item/commandExecution/requestApproval", "item/fileChange/requestApproval",
    "item/permissions/requestApproval"]);
  const interactions = new Set(["item/tool/requestUserInput", "mcpServer/elicitation/request", "currentTime/read"]);
  for (const method of catalog.server_request_methods) {
    const posture = sharedWrapperServerRequestPosture({jsonrpc: "2.0", id: method, method, params: {threadId: "owned-thread"}});
    assert.equal(posture.kind, assessed.has(method) ? "assessed-effect"
      : interactions.has(method) ? "client-interaction" : "unsupported", method);
  }
  assert.deepEqual(sharedWrapperServerRequestPosture({jsonrpc: "2.0", id: 1, method: "future/effect"}),
    {kind: "unsupported", reason_code: "host.server-request-unknown"});
  assert.deepEqual(sharedWrapperServerRequestPosture({jsonrpc: "2.0", method: "turn/completed"}),
    {kind: "not-applicable"});
});

test("hosted effect tool transport requires an exact opt-in and bounded host call", () => {
  const call = {jsonrpc: "2.0", id: "effect-1", method: "item/tool/call", params: {
    threadId: "owned-thread", turnId: "active-turn", callId: "call-1", namespace: null,
    tool: "are_effect_request", arguments: {kind: "command", proposal: {command: ["pwd"]}}}};
  assert.deepEqual(hostedEffectToolCallPosture(call), {kind: "admitted"});
  assert.deepEqual(gatewayServerMethodPosture(call), {kind: "deny-unassessed-request"});
  assert.deepEqual(gatewayServerMethodPosture(call, {allow_hosted_effect_tool: true}),
    {kind: "scoped", thread_id: "owned-thread"});
  assert.equal(sharedWrapperServerRequestPosture(call).kind, "unsupported");
  assert.deepEqual(sharedWrapperServerRequestPosture(call, {allow_hosted_effect_tool: true}),
    {kind: "client-interaction"});
  for (const params of [{...call.params, tool: "other_tool"},
    {...call.params, namespace: "other"}, {...call.params, callId: " "},
    {...call.params, arguments: {kind: "command", proposal: {}}},
    {...call.params, arguments: {kind: "command", proposal: {command: ["pwd"]}, approve: true}},
    {...call.params, arguments: {kind: "unknown", proposal: {command: ["pwd"]}}}]) {
    const invalid = {...call, params};
    assert.deepEqual(hostedEffectToolCallPosture(invalid),
      {kind: "rejected", reason_code: "host.hosted-effect-call-invalid"});
    assert.deepEqual(gatewayServerMethodPosture(invalid, {allow_hosted_effect_tool: true}),
      {kind: "rejected", reason_code: "host.hosted-effect-call-invalid"});
    assert.equal(sharedWrapperServerRequestPosture(invalid, {allow_hosted_effect_tool: true}).kind,
      "unsupported");
  }
});

test("pinned host requests expose exact required and optional turn attribution", () => {
  assert.deepEqual(catalog.server_request_required_turn_id_methods,
    ["item/commandExecution/requestApproval", "item/fileChange/requestApproval",
      "item/tool/requestUserInput", "item/permissions/requestApproval", "item/tool/call"]);
  assert.deepEqual(catalog.server_request_optional_turn_id_methods, ["mcpServer/elicitation/request"]);
  for (const method of catalog.server_request_required_turn_id_methods) {
    assert.deepEqual(codexServerRequestTurnPosture({id: 1, method, params: {turnId: "active-turn"}}),
      {kind: "scoped", turn_id: "active-turn"}, method);
    assert.deepEqual(codexServerRequestTurnPosture({id: 1, method, params: {}}), {kind: "invalid"}, method);
  }
  for (const turnId of [undefined, null]) {
    assert.deepEqual(codexServerRequestTurnPosture({id: 1, method: "mcpServer/elicitation/request",
      params: {turnId}}), {kind: "unsupported-unattributed"});
  }
  assert.deepEqual(codexServerRequestTurnPosture({id: 1, method: "mcpServer/elicitation/request",
    params: {turnId: "active-turn"}}), {kind: "scoped", turn_id: "active-turn"});
  for (const turnId of [" ", 3, {}, "x".repeat(257)]) {
    assert.deepEqual(codexServerRequestTurnPosture({id: 1, method: "mcpServer/elicitation/request",
      params: {turnId}}), {kind: "invalid"});
  }
  assert.deepEqual(codexServerRequestTurnPosture({id: 1, method: "currentTime/read",
    params: {threadId: "owned-thread"}}), {kind: "not-applicable"});
});

test("admitted host requests require bounded presentation and effect identity fields", () => {
  const check = (method, params) => codexServerRequestCriticalShapePosture({id: 1, method, params});
  const invalid = {kind: "rejected", reason_code: "host.server-request-required-field-invalid"};
  const approval = {threadId: "owned-thread", turnId: "active-turn", itemId: "item-1", startedAtMs: 123};
  for (const method of ["item/commandExecution/requestApproval", "item/fileChange/requestApproval"]) {
    assert.deepEqual(check(method, approval), {kind: "admitted"});
    assert.deepEqual(check(method, {...approval, itemId: " "}), invalid);
    assert.deepEqual(check(method, {...approval, startedAtMs: "123"}), invalid);
  }
  assert.deepEqual(check("item/permissions/requestApproval", {...approval, cwd: "/work", permissions: {network: null}}),
    {kind: "admitted"});
  assert.deepEqual(check("item/permissions/requestApproval", {...approval, cwd: "/work"}), invalid);
  assert.deepEqual(check("item/tool/requestUserInput", {...approval, isBlocking: true, questions: [{}]}),
    {kind: "admitted"});
  assert.deepEqual(check("item/tool/requestUserInput", {...approval, questions: [{}]}), invalid);
  assert.deepEqual(check("item/tool/requestUserInput", {...approval, isBlocking: true, questions: []}), invalid);
  assert.deepEqual(check("mcpServer/elicitation/request", {threadId: "owned-thread", turnId: "active-turn",
    serverName: "fixture", mode: "form", message: "Question", requestedSchema: {type: "object"}}),
  {kind: "admitted"});
  assert.deepEqual(check("mcpServer/elicitation/request", {serverName: " "}), invalid);
  assert.deepEqual(check("currentTime/read", {threadId: "owned-thread"}), {kind: "not-applicable"});
});

test("Codex lifecycle parameter contract rejects policy downgrade and undeclared sticky overrides", () => {
  const check = (method, params) => codexGatewayLifecycleParameterPosture({method, params});
  const safeThread = {cwd: "/work", approvalPolicy: "on-request", sandbox: "read-only"};
  const safeTurn = {threadId: "owned-thread", input: [{type: "text", text: "hello"}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}};
  assert.deepEqual(check("thread/start", safeThread), {kind: "admitted"});
  assert.deepEqual(check("thread/start", {...safeThread, dynamicTools: [HOSTED_EFFECT_DYNAMIC_TOOL]}),
    {kind: "rejected", reason_code: "host.params-unknown-field"});
  assert.deepEqual(codexGatewayLifecycleParameterPosture({method: "thread/start",
    params: {...safeThread, dynamicTools: [HOSTED_EFFECT_DYNAMIC_TOOL]}},
  {allow_hosted_effect_tool: true}), {kind: "admitted"});
  for (const dynamicTools of [[], [{...HOSTED_EFFECT_DYNAMIC_TOOL, name: "other"}],
    [HOSTED_EFFECT_DYNAMIC_TOOL, HOSTED_EFFECT_DYNAMIC_TOOL], null]) {
    assert.deepEqual(codexGatewayLifecycleParameterPosture({method: "thread/start",
      params: {...safeThread, dynamicTools}}, {allow_hosted_effect_tool: true}),
    {kind: "rejected", reason_code: "host.dynamic-tools-unsafe"});
  }
  assert.deepEqual(check("thread/resume", {threadId: "owned-thread", approvalPolicy: "on-request", sandbox: "read-only"}), {kind: "admitted"});
  assert.deepEqual(check("thread/compact/start", {threadId: "owned-thread"}), {kind: "admitted"});
  for (const params of [{}, {threadId: " "}, {threadId: " owned-thread"},
    {threadId: "owned-thread", sandbox: "danger-full-access"}]) {
    assert.equal(check("thread/compact/start", params).kind, "rejected");
  }
  assert.deepEqual(check("thread/fork", {threadId: "owned-thread", approvalPolicy: "on-request", sandbox: "read-only", deferGoalContinuation: true}), {kind: "admitted"});
  assert.deepEqual(check("turn/start", safeTurn), {kind: "admitted"});
  const boundedOutputSchema = {type: "object", properties: {answer: {type: "string"}},
    required: ["answer"], additionalProperties: false};
  assert.deepEqual(check("turn/start", {...safeTurn, outputSchema: boundedOutputSchema}), {kind: "admitted"});
  for (const outputSchema of [[], {type: "array"}, {type: "object", additionalProperties: true},
    {type: "object", additionalProperties: false, description: "x".repeat(16384)}]) {
    assert.deepEqual(check("turn/start", {...safeTurn, outputSchema}),
      {kind: "rejected", reason_code: "host.output-schema-unsafe"});
  }
  for (const params of [{...safeThread, approvalPolicy: "never"}, {...safeThread, approvalPolicy: "onRequest"},
    {...safeThread, sandbox: "danger-full-access"},
    {...safeThread, config: {sandbox_mode: "danger-full-access"}}, {...safeThread, dynamicTools: []}]) {
    assert.equal(check("thread/start", params).kind, "rejected");
  }
  for (const params of [{...safeTurn, approvalPolicy: "never"}, {...safeTurn, sandboxPolicy: {type: "workspaceWrite"}},
    {...safeTurn, permissions: "full"}, {...safeTurn, toolOutput: {}}]) {
    assert.equal(check("turn/start", params).kind, "rejected");
  }
  assert.deepEqual(check("thread/fork", {threadId: "owned-thread", approvalPolicy: "on-request", sandbox: "read-only"}),
    {kind: "rejected", reason_code: "host.fork-continuation-unsafe"});
  assert.deepEqual(check("thread/read", {threadId: "owned-thread"}), {kind: "not-applicable"});
  const catalog = {threadId: "owned-thread", detail: "toolsAndAuthOnly", limit: 100};
  assert.deepEqual(check("mcpServerStatus/list", catalog), {kind: "admitted"});
  for (const params of [{...catalog, detail: "full"}, {...catalog, limit: 1000},
    {...catalog, cursor: "next"}, {...catalog, threadId: " "}]) {
    assert.equal(check("mcpServerStatus/list", params).kind, "rejected");
  }
  assert.deepEqual(check("cyberalchemy/continuation/registerPlan", {proposal: {next_turn: {params: safeTurn}}}), {kind: "admitted"});
  assert.equal(check("cyberalchemy/continuation/registerPlan", {proposal: {next_turn: {params: {...safeTurn,
    sandboxPolicy: {type: "dangerFullAccess"}}}}}).kind, "rejected");
  assert.deepEqual(codexGatewayGeneratedParameterPosture({method: "turn/start", params: {...safeTurn,
    additionalContext: {"cyberalchemy.are.context-basis": {kind: "application", value: "bounded"}}}}), {kind: "admitted"});
  const objectiveGenerated = {method: "turn/start", params: {...safeTurn,
    additionalContext: {"cyberalchemy.are.objective": {kind: "application", value: "bounded"}}}};
  assert.deepEqual(codexGatewayGeneratedParameterPosture(objectiveGenerated),
    {kind: "rejected", reason_code: "host.generated-context-unsafe"});
  assert.deepEqual(codexGatewayGeneratedParameterPosture(objectiveGenerated,
    {allow_objective_context: true}), {kind: "admitted"});
  assert.equal(codexGatewayGeneratedParameterPosture({method: "turn/start", params: {...safeTurn,
    additionalContext: {"untrusted.context": {kind: "application", value: "bypass"}}}}).kind, "rejected");
});

test("Codex active-turn methods admit only their documented bounded parameter shapes", () => {
  const check = (method, params) => codexGatewayLifecycleParameterPosture({method, params});
  const steer = {threadId: "owned-thread", input: [{type: "text", text: "focus on tests"}], expectedTurnId: "active-turn"};
  const interrupt = {threadId: "owned-thread", turnId: "active-turn"};
  assert.deepEqual(check("turn/steer", steer), {kind: "admitted"});
  assert.deepEqual(check("turn/interrupt", interrupt), {kind: "admitted"});
  for (const params of [null, [], {...steer, model: "override"}, {...steer, sandboxPolicy: {type: "dangerFullAccess"}},
    {...steer, outputSchema: {}}, {...steer, input: []}, {...steer, expectedTurnId: " "}]) {
    assert.equal(check("turn/steer", params).kind, "rejected");
  }
  for (const params of [null, [], {...interrupt, approvalPolicy: "never"}, {...interrupt, unexpected: true},
    {...interrupt, turnId: " "}, {...interrupt, threadId: null}]) {
    assert.equal(check("turn/interrupt", params).kind, "rejected");
  }
});

test("Codex initialization cannot suppress notifications needed for ARE turn continuity", () => {
  const check = (params) => codexGatewayLifecycleParameterPosture({method: "initialize", params});
  const clientInfo = {name: "are_test", version: "0.1.0"};
  assert.deepEqual(check({clientInfo}), {kind: "admitted"});
  assert.deepEqual(check({clientInfo, capabilities: {experimentalApi: true,
    mcpServerOpenaiFormElicitation: true, optOutNotificationMethods: []}}), {kind: "admitted"});
  for (const params of [null, [], {clientInfo, capabilities: "none"},
    {clientInfo, capabilities: null},
    {clientInfo, capabilities: {futureCapability: true}},
    {clientInfo, capabilities: {experimentalApi: "true"}},
    {clientInfo, capabilities: {mcpServerOpenaiFormElicitation: 1}},
    {clientInfo, capabilities: {optOutNotificationMethods: "turn/completed"}}]) {
    assert.deepEqual(check(params), {kind: "rejected", reason_code: "host.params-invalid"});
  }
  assert.deepEqual(check({clientInfo, capabilities: {requestAttestation: true}}),
    {kind: "rejected", reason_code: "host.attestation-unsupported"});
  assert.deepEqual(check({clientInfo, capabilities: {requestAttestation: false}}), {kind: "admitted"});
  for (const method of ["turn/completed", "thread/started", "item/completed", "future/notification"]) {
    assert.deepEqual(check({clientInfo, capabilities: {optOutNotificationMethods: [method]}}),
      {kind: "rejected", reason_code: "host.required-notification-opt-out"});
  }
});
