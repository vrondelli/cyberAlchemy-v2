# Production client binding for the comparison

Status: implemented with four passing offline test groups; independent review pending. No external provider calls or real credentials were used.

[comparison-live-client.mjs](comparison-live-client.mjs) wraps the existing production liveClientFactory. It binds one active AbortSignal to the underlying GLM adapter and index tokenizer, then rejects client creation with a different signal. Every model/request-tokenizer/index-tokenizer dispatch requires an explicit true response from the shared guard and checks cancellation before and after it. Unknown arms, different total/window/call ceilings and tokenizer retry policies other than one attempt are rejected.

The supported arm names are minimal-history, independent-investigations and current-are. A factory is created with the shared campaign signal and guarded persistence; each prepared runner must pass that exact signal during client creation. Credential configuration and secret resolution remain in the existing provider implementation.

## Verification

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-live-client.test.mjs
```

Three tests exercise the actual production factory and secret-provider bridge with a fixture executable returning a fake credential. HTTPS requests are redirected to an actual local HTTP server, whose held response triggers shared cancellation. Request-tokenizer, model and index-tokenizer attempts close their connections and retain their failed receipts without retry. The native writer lock is removed after settlement. The fourth test verifies mismatched signal, unknown arm, retry-policy rejection and denied dispatch before HTTP.

This verifies production signal consumption, rather than merely argument forwarding. It does not prove a remote server stopped its own computation after client cancellation. Requests, replies and credentials are local fixtures; no latency, reliability, quality or token-efficiency measurement follows.

## Product frontier and open questions

Coordinator owns three-arm dispatch and campaign integration using this wrapper. Shared supervision must preserve failed costs and stop peer scheduling, while reconciling complete raw receipts and index events. Real request qualification, exact source/configuration freeze and D:/WSL admission remain prerequisites for live generation. C: is excluded. Release/deployment remain deferred. Perfect quality, 15% savings against both comparators and untouched confirmation remain unproved.
