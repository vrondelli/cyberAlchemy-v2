# L3 target selection

Decision: select Auth Foundation as the replacement L3 transfer target.
Status: recorded. Authority effect: planning selection only.

On 2026-09-12 the CyberAlchemy v2 product owner answered `yes select it` after
reviewing the Auth Foundation transfer assessment. This completes node K and
opens node L for a separately routed fresh freeze and replay.

The selected property is exact fail-closed authorization: return `ALLOW` only
when the request and trusted inputs are admissible, the session and
authentication evidence are current, the resolved roles are complete and
active, and an exact role grant matches the required permission and trusted
scope. Otherwise return `DENY`.

Financial settlement remains deferred evidence because its real Poker Team
consumer is unavailable. No specification-derived surrogate may replace it.

This decision does not authorize changes to `../domainspec-core`, replay the
historical candidate, admit the product, publish, release or deploy anything.

## Open Questions

- Can T5-02 recover a real pre-repair Auth candidate without synthesizing
  history, or must the first transfer report remain mutation-calibration only?

