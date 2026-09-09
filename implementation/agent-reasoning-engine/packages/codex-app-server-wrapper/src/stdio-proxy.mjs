import {spawn} from "node:child_process";
import {createInterface} from "node:readline";
import {jsonLine, jsonRpcError, parseJsonLine} from "./protocol.mjs";

function writeMessages(stream, messages) {
  for (const message of messages) stream.write(jsonLine(message));
}

export function runStdioProxy({wrapper, command = "codex", args = ["app-server"], spawn_impl = spawn, client_input = process.stdin, client_output = process.stdout, client_error = process.stderr} = {}) {
  if (!wrapper || typeof wrapper.processClientMessage !== "function" || typeof wrapper.processServerMessage !== "function") {
    throw new TypeError("A Codex app-server wrapper is required.");
  }
  const child = spawn_impl(command, args, {stdio: ["pipe", "pipe", "pipe"]});
  const clientLines = createInterface({input: client_input, crlfDelay: Infinity});
  const serverLines = createInterface({input: child.stdout, crlfDelay: Infinity});
  let clientChain = Promise.resolve();
  let serverChain = Promise.resolve();
  let clientEnded = false;
  const pendingClientRequestIds = new Set();

  function closeChildInputWhenDrained() {
    if (clientEnded && pendingClientRequestIds.size === 0 && !child.stdin.destroyed) child.stdin.end();
  }

  clientLines.on("line", (line) => {
    clientChain = clientChain.then(async () => {
      const parsed = parseJsonLine(line);
      if (!parsed.ok) {
        writeMessages(client_output, [jsonRpcError(null, -32700, "Parse error", parsed)]);
        return;
      }
      const actions = await wrapper.processClientMessage(parsed.value);
      for (const forwarded of actions.to_server) {
        if (forwarded && forwarded.method && Object.hasOwn(forwarded, "id")) pendingClientRequestIds.add(String(forwarded.id));
      }
      writeMessages(child.stdin, actions.to_server);
      writeMessages(client_output, actions.to_client);
      closeChildInputWhenDrained();
    }).catch((error) => writeMessages(client_output, [jsonRpcError(null, -32603, "Wrapper client-path failure", {message: error.message})]));
  });

  serverLines.on("line", (line) => {
    serverChain = serverChain.then(async () => {
      const parsed = parseJsonLine(line);
      if (!parsed.ok) {
        writeMessages(client_output, [jsonRpcError(null, -32700, "App-server parse error", parsed)]);
        return;
      }
      const actions = await wrapper.processServerMessage(parsed.value);
      writeMessages(child.stdin, actions.to_server);
      writeMessages(client_output, actions.to_client);
      if (parsed.kind === "response") pendingClientRequestIds.delete(String(parsed.value.id));
      closeChildInputWhenDrained();
    }).catch((error) => writeMessages(client_output, [jsonRpcError(null, -32603, "Wrapper server-path failure", {message: error.message})]));
  });

  child.stderr.on("data", (chunk) => client_error.write(chunk));
  child.on("exit", (code, signal) => {
    clientLines.close();
    serverLines.close();
    if (signal) client_error.write(`codex app-server exited via ${signal}\n`);
    else if (code !== 0) client_error.write(`codex app-server exited with ${code}\n`);
  });
  client_input.on("end", () => {
    clientEnded = true;
    clientChain.finally(closeChildInputWhenDrained);
  });
  return child;
}
