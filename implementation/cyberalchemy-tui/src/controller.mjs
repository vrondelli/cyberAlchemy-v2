import {resolve} from "node:path";

import {createAppServerDefineAgent} from "../../define-cli/src/app-server-agent.mjs";
import {runDefineConversation} from "../../define-cli/src/conversation-runtime.mjs";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");

function immutableSnapshot(state) {
  return Object.freeze({...state, transcript: Object.freeze([...state.transcript])});
}

export function createDefineController(options = {}) {
  const listeners = new Set();
  const createAgent = options.agentFactory ?? createAppServerDefineAgent;
  const runConversation = options.runConversation ?? runDefineConversation;
  let agent = null;
  let answer = null;
  let state = immutableSnapshot({
    phase: "idle",
    prompt: "What are you working on? Start with a domain, subject, context, or project.",
    transcript: [],
    result: null,
    error: null,
  });

  function publish(patch) {
    state = immutableSnapshot({...state, ...patch});
    for (const listener of listeners) listener(state);
  }

  function append(role, text) {
    const clean = String(text ?? "").trim();
    if (!clean) return;
    publish({transcript: [...state.transcript, Object.freeze({role, text: clean})]});
  }

  function ask(prompt) {
    if (answer) throw new Error("cyberalchemy-tui.concurrent-question");
    return new Promise((resolveValue) => {
      answer = resolveValue;
      publish({phase: "waiting", prompt: String(prompt ?? "Your response").trim() || "Your response"});
    });
  }

  async function start(opening) {
    const text = String(opening ?? "").trim();
    if (!text || state.phase !== "idle") return false;
    append("human", text);
    publish({phase: "working", prompt: "Define is considering that…", error: null});
    try {
      agent = options.agent ?? createAgent({
        repository_root: options.repositoryRoot ?? repositoryRoot,
        gateway_socket: options.gatewaySocket,
        consumer_id: options.consumerId ?? "codex:human-chat",
        transport_mode: "gateway",
      });
      const result = await runConversation({
        agent,
        opening: text,
        ask,
        write: (value) => append("agent", value),
        consumer: "human:cyberalchemy-tui",
        repository_root: options.repositoryRoot ?? repositoryRoot,
      });
      publish({
        phase: result.ok ? "completed" : "stopped",
        prompt: result.ok ? "Definition Pack ready. Type /context to inspect meaning, or /quit." : "Define stopped. Type /quit to exit.",
        result,
      });
    } catch (error) {
      append("error", error.message);
      publish({phase: "error", prompt: "The capability stopped. Type /quit to exit.", error: error.message});
    } finally {
      await agent?.close?.();
    }
    return true;
  }

  function submit(value) {
    const text = String(value ?? "").trim();
    if (!text) return false;
    if (state.phase === "idle") {
      void start(text);
      return true;
    }
    if (state.phase !== "waiting" || !answer) return false;
    append("human", text);
    const resolveAnswer = answer;
    answer = null;
    publish({phase: "working", prompt: "Define is considering that…"});
    resolveAnswer(text);
    return true;
  }

  async function close() {
    if (answer) {
      const resolveAnswer = answer;
      answer = null;
      resolveAnswer("/quit");
    }
    await agent?.close?.();
  }

  return Object.freeze({
    start,
    submit,
    close,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    snapshot: () => state,
  });
}
