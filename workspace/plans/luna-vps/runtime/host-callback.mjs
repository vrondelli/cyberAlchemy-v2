// Open questions: ../HOST-PLAN.md#open-questions
import {readFileSync} from "node:fs";
const connection = JSON.parse(readFileSync(process.argv[2], "utf8"));
const chunks = []; let bytes = 0;
for await (const chunk of process.stdin) {
  bytes += chunk.length;
  if (bytes > 1048576) throw new Error("callback.input-too-large");
  chunks.push(chunk);
}
const response = await fetch(connection.url, {method: "POST",
  headers: {"Content-Type": "application/json", Authorization: `Bearer ${connection.token}`},
  body: Buffer.concat(chunks), signal: AbortSignal.timeout(10000)});
const result = await response.json();
if (!response.ok || !result.ok) throw new Error("callback.binding-failed");
process.stdout.write(JSON.stringify(result.stdout) + "\n");
