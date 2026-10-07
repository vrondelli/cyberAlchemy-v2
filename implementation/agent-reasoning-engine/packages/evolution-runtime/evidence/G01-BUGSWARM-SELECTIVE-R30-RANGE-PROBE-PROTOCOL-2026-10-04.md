# G01 BugSwarm selective-GLM r30 — byte-range support probe

Status: fixed before the probe request. R29 row 10
(`google/python-fire`, failed-job log length 192,878 bytes) passed exact source
and BugSwarm page identity but its one raw-log GET ended with curl exit 56
after 32,572 bytes.

Bind the r29 result at SHA-256
`f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017`.
Make exactly one new HTTPS request to the same raw failed-job log with header
`Range: bytes=0-16383`. Use no automatic retries. Preserve the response status,
final URL, headers, and at most 16,385 body bytes in private WSL storage.

The range-support gate passes only if:

- the final URL remains beneath the expected HTTPS BugSwarm artifact-log path;
- the response status is 206;
- `Content-Range` is exactly `bytes 0-16383/192878`;
- the body contains exactly 16,384 bytes;
- no retry occurs.

If the server ignores or rejects the range, stop without attempting the other
six logs. If it passes, a separately frozen reconstruction protocol may fetch
all seven interrupted logs in fixed non-overlapping chunks, require exact
per-chunk `Content-Range`, concatenate in byte order, and verify final length
and strict UTF-8 before admission. No label, passing source, patch, ranking,
provider, or model access is permitted.

## Open Questions

- Does the BugSwarm log endpoint honor exact byte ranges?
- If it does, what chunk size gives a safe request count while remaining below
  the observed transport cutoff?
- Does reconstructed whole-log identity require an additional independent
  transport checksum beyond length and strict UTF-8?
