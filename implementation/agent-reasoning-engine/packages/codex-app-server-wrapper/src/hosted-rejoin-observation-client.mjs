const REF = /^backend-thread:[0-9a-f]{64}$/;
const STATUSES = new Set(["hosted-owned", "rejoined", "rejoin-ready", "blocked", "unverified"]);

export async function readHostedRejoinObservation({url, token, refs, timeout_ms = 3500}) {
  let target;
  try { target = new URL(url); }
  catch { throw new Error("hosted-rejoin.observation-url-invalid"); }
  if (target.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname)
    || target.pathname !== "/api/observation/rejoin" || target.search || target.hash
    || typeof token !== "string" || Buffer.byteLength(token) < 32
    || !Array.isArray(refs) || refs.length > 32 || refs.some(ref => typeof ref !== "string" || !REF.test(ref))
    || new Set(refs).size !== refs.length) throw new Error("hosted-rejoin.observation-input-invalid");
  target.searchParams.set("refs", refs.join(","));
  let response;
  try {
    response = await fetch(target, {headers: {authorization: `Bearer ${token}`},
      signal: AbortSignal.timeout(timeout_ms), redirect: "error"});
  } catch { throw new Error("hosted-rejoin.observation-unavailable"); }
  if (!response.ok || Number(response.headers.get("content-length")) > 16384) {
    throw new Error("hosted-rejoin.observation-unavailable");
  }
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("hosted-rejoin.observation-incompatible"); }
  const value = payload?.value;
  if (payload?.ok !== true || value?.schema_version !== "are.hosted-rejoin-observation/v1"
    || value.scope !== "managed-hosted-client-only" || value.authority_effect !== "none"
    || !Number.isSafeInteger(value.observed_at_unix_ms) || !Array.isArray(value.rows)
    || value.rows.length > refs.length || value.rows.some(row => !row || !refs.includes(row.thread_ref)
      || !STATUSES.has(row.status) || typeof row.pending_steer_checkpoint !== "boolean"
      || !(row.reason_code === null
        || typeof row.reason_code === "string" && /^windows-client\.[a-z0-9-]+$/.test(row.reason_code)))
    || new Set(value.rows.map(row => row.thread_ref)).size !== value.rows.length) {
    throw new Error("hosted-rejoin.observation-incompatible");
  }
  return value;
}
