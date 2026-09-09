#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {loadVerifiedDecisionProfile} from "../../agent-reasoning-engine/packages/request-decision-router/index.mjs";
import {createRoutedConversationRuntime, runChatUsabilityBenchmark} from "../../agent-reasoning-engine/packages/conversation-runtime/index.mjs";
import {createConversationClient} from "../src/conversation-client.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const profilePath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json");
const corpusPath = resolve(repositoryRoot, "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/conversation-runtime/benchmark/chat-usability-v1.json");
const loaded = loadVerifiedDecisionProfile(profilePath, repositoryRoot);
if (!loaded.ok) {
  process.stdout.write(`${JSON.stringify(loaded, null, 2)}\n`);
  process.exitCode = 1;
} else {
  const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
  let sequence = 0;
  const nextId = (kind) => `${kind}-${++sequence}`;
  const run = await runChatUsabilityBenchmark({corpus, executeScenario: async (scenario) => {
    if (scenario.scenario_id === "CHAT-003") return {checks: {
      human_comprehension: {status: "NOT_EVALUATED", observed_behavior: "No participant session was run by the deterministic benchmark.", evidence_refs: ["benchmark:deterministic-only"]},
    }};
    const routes = [];
    const service = createRoutedConversationRuntime({
      decisionProfile: loaded.value,
      idFactory: nextId,
      now: () => "2026-09-04T00:00:00.000Z",
      onRouteDecision: (decision) => routes.push(decision.selected?.route_id ?? decision.kind),
      routeHandlers: {
        "CA2-ROUTE-DEFINE": async () => ({assistant_text: "Definition candidate prepared."}),
        "CA2-ROUTE-RESEARCH": async () => ({assistant_text: "Research comparison prepared."}),
      },
    });
    const client = createConversationClient({service});
    const conversationId = `benchmark-${scenario.scenario_id}`;
    client.open(conversationId);
    for (const turn of scenario.turns) await client.submit(turn);
    const snapshot = client.snapshot();
    const engine = service.inspect({conversation_id: conversationId}).value;
    client.close();
    if (scenario.scenario_id === "CHAT-001") return {checks: {
      internal_route_transition: {
        status: routes.join(",") === "CA2-ROUTE-DEFINE,CA2-ROUTE-RESEARCH" ? "PASS" : "FAIL",
        observed_behavior: `Observed routes: ${routes.join(", ") || "none"}.`,
        evidence_refs: engine.events.filter((event) => event.event_type === "turn.intent-bound").map((event) => event.event_digest),
      },
      single_transcript_projection: {
        status: snapshot.conversationId === conversationId && snapshot.transcript.length === 4 ? "PASS" : "FAIL",
        observed_behavior: `Conversation ${snapshot.conversationId}; transcript items ${snapshot.transcript.length}.`,
        evidence_refs: [engine.snapshot_digest],
      },
    }};
    const inline = snapshot.transcript.some((item) => item.role === "agent" && item.text.includes("more than one valid internal route"));
    const diagnostic = snapshot.diagnostics.some((item) => item.kind === "route-ambiguity");
    const authoritySafe = engine.authority_effect === "none" && engine.events.every((event) => event.authority_effect === "none");
    return {checks: {
      inline_route_question: {
        status: inline && diagnostic ? "PASS" : "FAIL",
        observed_behavior: `Inline question ${inline ? "present" : "missing"}; diagnostic ${diagnostic ? "present" : "missing"}.`,
        evidence_refs: engine.events.filter((event) => event.event_type === "question.required" || event.event_type === "diagnostic.available").map((event) => event.event_digest),
      },
      authority_violations: {
        status: authoritySafe ? "PASS" : "FAIL",
        observed_behavior: authoritySafe ? "All conversation records retained authority_effect none." : "An authority-bearing record was observed.",
        evidence_refs: [engine.snapshot_digest],
      },
    }};
  }});
  process.stdout.write(`${JSON.stringify(run, null, 2)}\n`);
  process.exitCode = run.result.status === "FAIL" ? 1 : 0;
}
