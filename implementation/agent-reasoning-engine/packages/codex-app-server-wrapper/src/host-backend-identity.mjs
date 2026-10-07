const EXPECTED_VERSION = /^codex-cli ([^\s/()]{1,128})$/;
const CODEX_DESKTOP_AGENT = /^Codex Desktop\/([^\s/()]{1,128})(?:\s|$)/;
const CLIENT_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export function validExpectedCodexVersion(value) {
  return typeof value === "string" && EXPECTED_VERSION.test(value);
}

// The installed App Server reports its own version in InitializeResponse.userAgent.
// This binds a live transport to the selected version, not to executable bytes
// or to the generated schema of an independently running daemon/WebSocket peer.
export function verifyCodexBackendInitializeVersion(response, expectedVersion, expectedClientName = null) {
  if (!validExpectedCodexVersion(expectedVersion)) throw new TypeError("A pinned Codex version is required.");
  const expected = EXPECTED_VERSION.exec(expectedVersion)[1];
  const userAgent = response?.result?.userAgent;
  const declaredName = typeof expectedClientName === "string" && CLIENT_NAME.test(expectedClientName)
    ? expectedClientName : null;
  const observed = typeof userAgent === "string" && userAgent.length <= 512
    ? CODEX_DESKTOP_AGENT.exec(userAgent)?.[1]
      ?? (declaredName && userAgent.startsWith(`${declaredName}/`)
        ? /^([^\s/()]{1,128})(?:\s|$)/.exec(userAgent.slice(declaredName.length + 1))?.[1] : null)
    : null;
  const reason = response?.error ? "host.initialize-response-failed"
    : !observed ? "host.initialize-version-unavailable"
      : observed !== expected ? "host.initialize-version-drift" : null;
  return Object.freeze({schema_version: "are.codex-backend-initialize-version/v1",
    ok: reason === null,
    expected_codex_version: expectedVersion,
    observed_codex_version: observed ? `codex-cli ${observed}` : null,
    ...(reason ? {reason} : {}),
    claim_ceiling: "self-reported-live-transport-version",
    authority_effect: "none"});
}
