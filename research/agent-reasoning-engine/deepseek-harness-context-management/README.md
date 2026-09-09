# DeepSeek Harness context-management research

This tower evaluates which context-management techniques from DeepSeek Harness
can be reused in the Agent Reasoning Engine (ARE). It is source-bound to
DeepSeek Harness commit `49a606bc5b5934603f22a26957a07dc799ab0291` and to
the local ARE files named in `sources/source-register.json`.

The central result is narrower than “use an append-only log to get caching”:

> Use a canonical append-only context event stream so old facts never move,
> derive the current Context Envelope and the Codex request from an exact
> prefix, and separately measure whether the provider reused that byte-stable
> request prefix.

Append-only persistence makes deterministic reconstruction possible. Provider
KV-cache reuse additionally requires identical bytes and ordering before the
append point, the same provider/model route, stable system prompt and tool
schemas, and a cache entry that the provider still retains.

This is research evidence only. It does not adopt a design, change ARE, prove a
provider cache hit, or grant implementation, admission, publication, or runtime
authority.

## Reading order

1. [TOWER.md](TOWER.md)
2. [levels/L0-corpus.md](levels/L0-corpus.md)
3. [levels/L1-residue-map.md](levels/L1-residue-map.md)
4. [distill.md](distill.md)
5. [patterns/additional-gems.md](patterns/additional-gems.md)
6. [worked-examples.md](worked-examples.md)
7. [related-work.md](related-work.md)
8. [bridge-decisions.md](bridge-decisions.md)
9. [levels/L2-closure-plan.md](levels/L2-closure-plan.md)
10. [gates/closure-gates.md](gates/closure-gates.md)
11. [learning-pack.md](learning-pack.md)
