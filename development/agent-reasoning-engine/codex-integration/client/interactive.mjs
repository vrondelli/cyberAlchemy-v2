#!/usr/bin/env node
import {resolve} from "node:path";
import {createInterface} from "node:readline";

import {CodexProxySession} from "./session.mjs";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const upstream = argument("--upstream", process.env.CODEX_BINARY);
if (typeof upstream !== "string" || !upstream.trim() || upstream.startsWith("--")) throw new Error("Provide --upstream <supported-codex-binary> or set CODEX_BINARY");
const cwd = resolve(argument("--cwd", process.cwd()));
const model = argument("--model", null);
const receipt = argument("--receipt", null);
const allowProtocolDrift = process.argv.includes("--allow-protocol-drift");
const rl = createInterface({input: process.stdin, output: process.stdout});

function ask(prompt) {
  return new Promise((resolvePromise) => rl.question(prompt, resolvePromise));
}

function compact(value) {
  return JSON.stringify(value, null, 2);
}

let writingAssistant = false;
const session = new CodexProxySession({
  upstream,
  ...(receipt ? {receiptPath: resolve(receipt)} : {}),
  allowProtocolDrift,
  handlers: {
    onPreflight(decision) {
      process.stdout.write(`\n[route] ${decision.kind}${decision.selected?.route_id ? ` -> ${decision.selected.route_id}` : ""} (${decision.decision_digest})\n`);
    },
    onTextDelta(delta) {
      if (!writingAssistant) {
        process.stdout.write("\nassistant> ");
        writingAssistant = true;
      }
      process.stdout.write(delta);
    },
    async onApproval({request, decision}) {
      if (writingAssistant) process.stdout.write("\n");
      writingAssistant = false;
      process.stdout.write(`\n[approval] ${request.method}\n`);
      process.stdout.write(`[effect digest] ${decision?.effect_digest ?? "missing - approval will fail closed"}\n`);
      const effect = request.params?.command ?? request.params?.changes ?? request.params?.permissions ?? request.params;
      process.stdout.write(`${compact(effect)}\n`);
      const answer = (await ask("Approve this exact effect? [y/N/session] ")).trim().toLowerCase();
      if (answer === "session") return "acceptForSession";
      return answer === "y" || answer === "yes" ? "accept" : "decline";
    },
    async onUserInput(params) {
      if (writingAssistant) process.stdout.write("\n");
      writingAssistant = false;
      const answers = {};
      for (const question of params.questions ?? []) {
        process.stdout.write(`\n[${question.header}] ${question.question}\n`);
        if (question.isSecret) {
          process.stdout.write("Secret input is refused by this terminal client because echo suppression is not implemented.\n");
          answers[question.id] = {answers: []};
          continue;
        }
        (question.options ?? []).forEach((option, index) => process.stdout.write(`  ${index + 1}. ${option.label} - ${option.description}\n`));
        const answer = (await ask("answer> ")).trim();
        const selected = Number(answer);
        const value = Number.isInteger(selected) && selected > 0 && selected <= (question.options?.length ?? 0)
          ? question.options[selected - 1].label
          : answer;
        answers[question.id] = {answers: value ? [value] : []};
      }
      return {answers};
    },
    onContinuation(decision) {
      if (writingAssistant) process.stdout.write("\n");
      writingAssistant = false;
      process.stdout.write(`[continuation] ${decision.kind} (${decision.decision_digest})\n`);
    },
    onUnboundApproval(request) {
      process.stdout.write(`\n[approval blocked] ${request.method} had no matching ARE effect decision.\n`);
    },
    onStderr(text) {
      process.stderr.write(text);
    },
  },
});

async function resolveGate(outcome) {
  const bindings = outcome.proposal_bindings ?? [];
  if (outcome.kind !== "gate" || bindings.length === 0) return;
  process.stdout.write("\nBound proposals:\n");
  bindings.forEach((binding, index) => {
    process.stdout.write(`  ${index + 1}. ${binding.option_id} [${binding.lane}] digest=${binding.proposal_digest}${binding.has_next_turn ? "" : " (no executable next turn)"}\n`);
  });
  const answer = (await ask("Select an exact proposal to accept, or press Enter to leave the gate unresolved: ")).trim();
  const selected = bindings[Number(answer) - 1];
  if (!selected) return;
  try {
    const result = await session.resolveContinuation({
      decisionDigest: outcome.decision_digest,
      optionId: selected.option_id,
      proposalDigest: selected.proposal_digest,
      decision: "accept",
    });
    process.stdout.write(`[human binding] ${result.binding.bindingDigest}\n`);
    await resolveGate(result.outcome);
  } catch (error) {
    process.stdout.write(`[binding rejected] ${error.message}${error.data ? ` ${compact(error.data)}` : ""}\n`);
  }
}

function parseTurn(line) {
  if (!line.startsWith("/json ")) return {text: line};
  const value = JSON.parse(line.slice(6));
  if (!value.text && !value.input) throw new Error("/json requires text or input");
  return value;
}

try {
  const started = await session.start({cwd, model});
  process.stdout.write(`ARE Codex interactive client\nthread=${started.thread.id}\nreceipt=${started.receiptPath}\n`);
  process.stdout.write("Use ordinary text, /json {\"text\":...,\"requestContext\":...,\"continuation\":...}, or /quit.\n");
  while (true) {
    const line = (await ask("\nyou> ")).trim();
    if (!line) continue;
    if (line === "/quit" || line === "/exit") break;
    try {
      const result = await session.turn(parseTurn(line));
      await resolveGate(result.outcome);
    } catch (error) {
      process.stdout.write(`[turn failed] ${error.message}${error.data ? ` ${compact(error.data)}` : ""}\n`);
    }
  }
} finally {
  rl.close();
  await session.close();
}
