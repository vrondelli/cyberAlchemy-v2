# Try representation preferences

This candidate extends the persistent interaction review host. It is available
through createInteractionReview and the existing interaction CLI JSON request
path. It does not enable learning in the default repository or gateway profile.

Run a demonstration with a scripted provider:

```sh
node development/agent-reasoning-engine/planning/representation-preferences/demo.mjs
```

Send three distinct completed requests such as `Plan a picnic in a DAG` in the
same thread. The third result includes `preference_offers`. The host UI should
render the prompt and provide accept/decline controls. Merely showing the offer
never saves a preference. Pending offers also appear in `inspect()`.

To accept, submit the exact returned `confirmation_text` as `text`, plus:

```json
{"preference_decision":{"offer_id":"<returned offer_id>","action":"accept","retention_scope":"current-product"}}
```

Use `current-interaction` to limit reuse to the conversation. A bare `yes` does
not confirm. Decline uses the same decision field with `action: "decline"` and
no retention scope. Requests still require unique request_id and thread_id; a
new objective needs the host's existing explicit requirements seed.

After acceptance, `Plan a picnic` selects the saved DAG lesson. `Compare options`
does not. `Plan a picnic in plain text` overrides it for that request. Existing
`disable-reuse` with the lesson_id revokes reuse. Revocation permits learning a
different format; ARE does not offer the revoked format again automatically.
Restart restores offers, lessons and revocations from the same file ledger.

The bounded English grammar supports plan/compare and DAG/table/checklist/plain
text, with a few imperative prefixes. Quotes, reference content, compound requests,
negations and unknown wording abstain. This is not general language understanding.
Observations require completed host responses, not proven task quality. Off and
observe modes produce no offers. Three completions within the last twenty host
requests trigger one offer; expired offers cannot be accepted. Failed and unknown
requests consume the window too.

## Open Questions

See [RESEARCH.md](RESEARCH.md) for live quality, detector coverage, and token-cost
questions. No external benchmark result is established by the scripted demo.
