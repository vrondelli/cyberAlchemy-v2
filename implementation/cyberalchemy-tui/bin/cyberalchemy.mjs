#!/usr/bin/env node
import process from "node:process";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import React from "react";
import {render} from "ink";

import {CyberAlchemyApp} from "../src/app.mjs";
import {runCodingAgentPreflight} from "../../agent-reasoning-engine/packages/coding-agent-runtime/preflight.mjs";
import {parseCodingAgentRunConfig} from "../../agent-reasoning-engine/packages/coding-agent-runtime/runtime-config.mjs";
import {parseCodexScopeConfig} from "../../agent-reasoning-engine/packages/coding-agent-runtime/codex-proposal.mjs";
import {runProductCanary} from "../../agent-reasoning-engine/packages/coding-agent-runtime/scripts/product-canary.mjs";
import {createChatWorkspace, discoverCodingConfig} from "../src/chat-workspace.mjs";
import {createTuiGatewayRecoveryPath, defaultGatewaySocket} from "../src/gateway-recovery.mjs";

const HELP = `CyberAlchemy v2 TUI

Usage:
  cyberalchemy [broad opening]
  cyberalchemy --gateway-socket <path> [broad opening]
  cyberalchemy --chat --repository-root <dir> [request]
  cyberalchemy --control-center-demo
  cyberalchemy --implement --coding-config <file> --repository-root <dir> --session <jsonl> [options] [request]
  cyberalchemy --implement --coding-config <scope.json> --repository-root <dir> [request]

Coding-agent options:
  --chat                    Open the persistent chat-first coding workspace
  --control-center-demo     Preview sessions, queue, and attention without a model
  --doctor                  Check launch dependencies without invoking a model
  --self-test               Run the disposable end-to-end product canary
  --proposal-output <file>  Save the proposal for separate review and approval
  --resume                  Resume the selected persistent session
  --max-steps <n>           Bound iterative model/tool steps
  --cancel-file <path>      Stop when this file appears
  --tool-policy <json>      Override allow/ask/deny tool policy from a JSON file
  --context-config <json>   Override repository-map budgets from a JSON file
  --codex-command <path>    Optional local Codex executable preflight (gateway selects backend)
  --codex-profile <json>    Override the pinned repository wrapper profile
  --model <id>              Optional Codex model override
  --durable-proposal-thread  Opt in to local Codex history for read-only crash reconciliation

Commands inside the TUI:
  /help      Open the command palette
  /context   Inspect definitions and ontology relations
  /define    Open the Define capability
  /implement Open the review-and-apply coding agent
  /self-test Run the disposable coding-agent product canary
  /diagnostics Inspect the current redacted run receipt
  /reconcile Recheck an uncertain host turn without retrying it (Ctrl+R)
  /quit      Exit
`;

export function parseArgs(argv) {
  const options = {opening: []};
  const args = [...argv];
  while (args.length > 0) {
    const value = args.shift();
    if (value === "--help" || value === "-h") options.help = true;
    else if (value === "--gateway-socket") {
      const socket = args.shift();
      if (!socket) throw new Error("cyberalchemy-tui.gateway-socket-required");
      options.gatewaySocket = socket;
    } else if (value === "--implement") options.initialCapability = "implement";
    else if (value === "--chat") { options.chat = true; options.initialCapability = "implement"; }
    else if (value === "--control-center-demo") { options.controlCenterDemo = true; options.initialCapability = "implement"; }
    else if (value === "--doctor") { options.doctor = true; options.initialCapability = "implement"; }
    else if (value === "--self-test") { options.selfTest = true; options.initialCapability = "implement"; }
    else if (["--coding-config", "--repository-root", "--session", "--proposal-output", "--cancel-file", "--max-steps", "--tool-policy", "--context-config", "--codex-command", "--codex-profile", "--model"].includes(value)) {
      const selected = args.shift();
      if (!selected) throw new Error(`cyberalchemy-tui.value-required:${value}`);
      const key = {"--coding-config": "codingConfig", "--repository-root": "repositoryRoot", "--session": "sessionPath", "--proposal-output": "proposalOutput", "--cancel-file": "cancelFile", "--max-steps": "maximumSteps", "--tool-policy": "toolPolicyPath", "--context-config": "contextConfigPath", "--codex-command": "codexCommand", "--codex-profile": "codexProfile", "--model": "model"}[value];
      options[key] = value === "--max-steps" ? Number(selected) : selected;
    } else if (value === "--resume") options.resume = true;
    else if (value === "--durable-proposal-thread") options.durableProposalThread = true;
    else if (value.startsWith("-")) throw new Error(`cyberalchemy-tui.unknown-option:${value}`);
    else options.opening.push(value);
  }
  return {...options, opening: options.opening.join(" ").trim()};
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`${error.message}\n${HELP}`);
  process.exit(2);
}

if (options.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (options.repositoryRoot && !options.initialCapability) {
  options.chat = true;
  options.initialCapability = "implement";
}
options.codingConfig = discoverCodingConfig(options.repositoryRoot, options.codingConfig);

let chatWorkspace = null;
if (options.initialCapability === "implement" && !options.controlCenterDemo && (!options.codingConfig || !options.repositoryRoot)) {
  process.stderr.write(`cyberalchemy-tui.coding-options-required\n${HELP}`);
  process.exit(2);
}
if (options.chat === true && (!options.sessionPath || !options.proposalOutput)) {
  chatWorkspace = createChatWorkspace({repositoryRoot: options.repositoryRoot});
  options.sessionPath ??= chatWorkspace.sessionPath;
}

if (options.initialCapability === "implement" && !options.controlCenterDemo) {
  if (options.maximumSteps !== undefined && (!Number.isSafeInteger(options.maximumSteps) || options.maximumSteps < 1)) {
    process.stderr.write(`cyberalchemy-tui.max-steps-invalid\n${HELP}`);
    process.exit(2);
  }
}

const authorityRepositoryRoot = resolve(import.meta.dirname, "../../../..");
const codexProfile = resolve(options.codexProfile ?? resolve(authorityRepositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json"));
const wrapperPath = resolve(authorityRepositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/bin/are-codex-app-server.mjs");

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), "utf8"));
  } catch {
    throw new Error("cyberalchemy-tui.json-config-invalid");
  }
}

let codingConfig;
let toolPolicy;
let contextConfig;
try {
  if (options.codingConfig) codingConfig = loadJson(options.codingConfig);
  if (options.toolPolicyPath) toolPolicy = loadJson(options.toolPolicyPath);
  if (options.contextConfigPath) contextConfig = loadJson(options.contextConfigPath);
} catch (error) {
  process.stderr.write(`${error.message}\n${HELP}`);
  process.exit(2);
}

const codexMode = codingConfig?.schema_version === "are.codex-coding-agent-scope/v1";
if (options.durableProposalThread && !codexMode) {
  process.stderr.write(`cyberalchemy-tui.durable-proposal-thread-requires-codex\n${HELP}`);
  process.exit(2);
}
if (options.initialCapability === "implement" && !options.controlCenterDemo && !codexMode && !options.sessionPath) {
  process.stderr.write(`cyberalchemy-tui.coding-options-required\n${HELP}`);
  process.exit(2);
}

let preflightResult = null;
if (codingConfig) {
  preflightResult = runCodingAgentPreflight({
    provider: codexMode ? "codex-app-server" : "openai-compatible",
    config: codingConfig,
    repository_root: options.repositoryRoot,
    session_path: options.sessionPath,
    resume: options.resume === true,
    proposal_output: options.proposalOutput,
    codex_command: options.codexCommand,
    codex_profile: codexProfile,
    transport_mode: codexMode ? "gateway" : null,
    probe_container: options.doctor === true || options.selfTest === true,
  });
  if (options.doctor || preflightResult.status === "BLOCK") {
    process.stdout.write(`${JSON.stringify(preflightResult, null, 2)}\n`);
    if (options.doctor || preflightResult.status === "BLOCK") process.exit(preflightResult.status === "PASS" ? 0 : 1);
  }
}

async function productSelfTest() {
  const parsed = codexMode ? parseCodexScopeConfig(codingConfig) : parseCodingAgentRunConfig(codingConfig);
  if (!parsed.sandbox) return {schema_version: "are.coding-agent-product-canary/v1", status: "BLOCK", reason_codes: ["sandbox.required"], authority_effect: "none"};
  return runProductCanary({engine: parsed.sandbox.engine, image: parsed.sandbox.image});
}

if (options.selfTest) {
  const result = await productSelfTest();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.status === "PASS_BOUNDED" ? 0 : 1);
}

const selectedGatewaySocket = options.gatewaySocket ?? defaultGatewaySocket();
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  process.stderr.write(`cyberalchemy-tui.terminal-required\n${HELP}`);
  process.exit(2);
}
let gatewayRecoveryPath = null;
try {
  if (codexMode) gatewayRecoveryPath = createTuiGatewayRecoveryPath({socket_path: selectedGatewaySocket});
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}

process.stdout.write("\u001b[?1049h\u001b[2J\u001b[H\u001b[?25l");
const instance = render(React.createElement(CyberAlchemyApp, {
  initialOpening: options.opening,
  initialCapability: options.initialCapability,
  gatewaySocket: selectedGatewaySocket,
  codingAgent: codingConfig ? {
    provider: codexMode ? "codex-app-server" : "openai-compatible",
    config: codingConfig,
    repositoryRoot: options.repositoryRoot,
    sessionPath: options.sessionPath,
    proposalOutput: options.proposalOutput,
    proposalDirectory: options.proposalOutput ? null : chatWorkspace?.proposalDirectory,
    cancelFile: options.cancelFile,
    maximumSteps: options.maximumSteps,
    resume: options.resume,
    toolPolicy,
    contextConfig,
    codexCommand: options.codexCommand,
    codexProfile,
    wrapperPath,
    gatewaySocket: selectedGatewaySocket,
    durableProposalThread: options.durableProposalThread === true,
    gatewayRecoveryPath,
    transportMode: "gateway",
    authorityRepositoryRoot,
    model: options.model,
    preflightResult,
    runSelfTest: productSelfTest,
    chatMode: options.chat === true,
  } : undefined,
  controlCenterDemo: options.controlCenterDemo === true,
}), {
  exitOnCtrlC: false,
  patchConsole: false,
  incrementalRendering: true,
  maxFps: 12,
});

try {
  await instance.waitUntilExit();
} finally {
  process.stdout.write("\u001b[?25h\u001b[?1049l");
}
