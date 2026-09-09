// Private single-pilot control client. Open questions: ../HOST-PLAN.md#open-questions
import {connect} from "node:net";
const [path, op = "status", requestId] = process.argv.slice(2);
if (!path?.startsWith("/") || !["status", "smoke"].includes(op)) throw new Error("usage: pilot-control.mjs /absolute/control.sock status|smoke [request-id]");
const socket = connect(path); let output = "";
socket.setTimeout(100000, () => socket.destroy(new Error("control.timeout")));
socket.on("connect", () => socket.write(JSON.stringify({op, ...(requestId ? {request_id: requestId} : {})}) + "\n"));
socket.on("data", chunk => { output += chunk; if (output.length > 65536) socket.destroy(new Error("control.output-limit")); });
socket.on("error", error => { process.stderr.write(error.message + "\n"); process.exitCode = 1; });
socket.on("end", () => { const result = JSON.parse(output); process.stdout.write(JSON.stringify(result, null, 2) + "\n"); if (!result.ok) process.exitCode = 1; });
