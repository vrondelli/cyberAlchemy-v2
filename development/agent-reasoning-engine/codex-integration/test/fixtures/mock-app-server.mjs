#!/usr/bin/env node
import {createInterface} from "node:readline";

const state = {threadId: "00000000-0000-7000-8000-000000000001", turnSequence: 0, turns: new Map(), questions: new Map()};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function requestApproval(turnId, method = "item/commandExecution/requestApproval") {
  const approvalId = `approval-${turnId}`;
  state.turns.set(approvalId, turnId);
  const params = {threadId: state.threadId, turnId, itemId: `item-${turnId}`, cwd: "/tmp", startedAtMs: 1};
  if (method === "item/commandExecution/requestApproval") params.command = "/usr/bin/printf ARE_PROXY_TEST";
  if (method === "item/fileChange/requestApproval") params.changes = [{path: "/tmp/mock", kind: "update"}];
  if (method === "item/permissions/requestApproval") params.permissions = {network: {enabled: true}};
  send({method, id: approvalId, params});
}

function completeTurn(turnId) {
  const itemId = `item-${turnId}`;
  send({method: "item/started", params: {threadId: state.threadId, turnId, item: {id: itemId, type: "commandExecution"}, startedAtMs: 2}});
  send({method: "item/agentMessage/delta", params: {threadId: state.threadId, turnId, itemId: `message-${turnId}`, delta: "Mock turn completed."}});
  send({method: "item/completed", params: {threadId: state.threadId, turnId, item: {id: itemId, type: "commandExecution", status: "completed"}, completedAtMs: 3}});
  send({method: "turn/completed", params: {threadId: state.threadId, turn: {id: turnId, status: "completed", items: []}}});
}

createInterface({input: process.stdin, crlfDelay: Infinity}).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    send({id: message.id, result: {userAgent: "mock", codexHome: "/tmp/mock"}});
    return;
  }
  if (message.method === "thread/start") {
    send({id: message.id, result: {thread: {id: state.threadId, ephemeral: true}}});
    return;
  }
  if (message.method === "turn/start") {
    const turnId = `00000000-0000-7000-8000-${String(++state.turnSequence).padStart(12, "0")}`;
    const text = (message.params?.input ?? []).map((item) => item?.text ?? "").join("\n");
    send({id: message.id, result: {turn: {id: turnId, status: "inProgress", items: []}}});
    send({method: "turn/started", params: {threadId: state.threadId, turn: {id: turnId, status: "inProgress", items: []}}});
    if (text.includes("ASK_HUMAN")) {
      const questionId = `question-${turnId}`;
      state.questions.set(questionId, turnId);
      send({method: "item/tool/requestUserInput", id: questionId, params: {threadId: state.threadId, turnId, itemId: `question-item-${turnId}`, isBlocking: true, questions: [{header: "Choice", id: "choice", question: "Choose a route", options: [{label: "Validate", description: "Use validation"}], isOther: false, isSecret: false}]}});
    } else {
      const method = text.includes("UNBOUND_APPROVAL")
        ? "legacy/requestApproval"
        : text.includes("FILE_APPROVAL")
          ? "item/fileChange/requestApproval"
          : text.includes("PERMISSION_APPROVAL")
            ? "item/permissions/requestApproval"
            : "item/commandExecution/requestApproval";
      requestApproval(turnId, method);
    }
    return;
  }
  if (state.questions.has(message.id)) {
    const turnId = state.questions.get(message.id);
    state.questions.delete(message.id);
    const answer = message.result?.answers?.choice?.answers?.join(",") ?? "";
    send({method: "item/agentMessage/delta", params: {threadId: state.threadId, turnId, itemId: `message-${turnId}`, delta: `Human answered: ${answer}. `}});
    requestApproval(turnId);
    return;
  }
  if (state.turns.has(message.id)) {
    const turnId = state.turns.get(message.id);
    state.turns.delete(message.id);
    completeTurn(turnId);
  }
});
