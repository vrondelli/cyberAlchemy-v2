import {createConnection} from "node:net";

// The TCP form is only for an explicitly enabled, read-only development observer.
// Never resolve arbitrary hosts or forward gateway session-control traffic here.
export function observationConnection(endpoint) {
  if (typeof endpoint !== "string" || !endpoint) throw new TypeError("An observation endpoint is required.");
  if (!endpoint.startsWith("tcp://")) return createConnection(endpoint);
  if (!/^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(endpoint)) {
    throw new TypeError("Observation TCP endpoints must use numeric IPv4 loopback and a port.");
  }
  const port = Number(endpoint.slice("tcp://127.0.0.1:".length));
  if (port > 65535) throw new TypeError("Observation TCP port is invalid.");
  return createConnection({host: "127.0.0.1", port});
}
