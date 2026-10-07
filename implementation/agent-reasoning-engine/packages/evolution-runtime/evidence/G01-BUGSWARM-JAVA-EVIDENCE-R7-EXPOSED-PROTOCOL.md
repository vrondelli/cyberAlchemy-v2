# G01 BugSwarm Java evidence r7 — exposed development protocol

Status: fixed before r7 provider dispatch. This is an exposed-development
test of presentation on the same 24 BugSwarm cases, not fresh confirmation,
ContextBench, official RepoMap, live ARE, or a product superiority claim.
Original HTTP failure logs and diffs remain transport-provisional.

## Exact treatment and budget

- Source-only r7 packet SHA-256:
  `23e85916c8d4c214babd93239049882b2fed9543f8eef788db2551552953f37f`.
  Packet seal SHA-256:
  `05672eab88f5116bf0e2ad85bb4e30830c6dcfef8354393292e5bbb0bfdace06`.
- Candidate identities and order are identical to sealed r6. The first
  twelve Python prompts are byte-identical to r6; their r6 tokenizer and
  generation receipts are carried over without new provider calls. Only
  Java ordinals 13–24 receive r7 failure-log summaries and behavior-bearing
  excerpts. They alone receive new provider calls.
- Same GLM-5.3-flash account and pinned transport as r6. Admit all twelve
  Java prompts through the provider tokenizer. Each must have at most 7,680
  prompt tokens, reserving 512 output tokens within 8,192. Carried Python
  prompt tokens plus new Java prompt tokens must not exceed **84,615**
  (1.5 times original r1's 56,410). No generation if any tokenizer call or
  aggregate budget fails.
- If admitted, one low-reasoning generation call per Java case, maximum 12
  calls, 512 output tokens each, zero automatic retries. Invalid responses
  count invalid; transport failure stops. Combine the twelve new sealed
  Java selections with the twelve unchanged r6 Python selections only
  after exact prompt, tokenizer, response, and path verification. Preserve
  raw private receipts and checksum-identical VPS/WSL copies.

## Exposed advancement gate

On the unchanged 24-case denominator: 24/24 valid combined selections and
labels; MRR@8 at least **+0.10** above both original r1 GLM and standalone
ARE; at least **16/24** wins against ARE; a positive lower end of the same
repository-unit 20,000-draw paired bootstrap 95% interval; at least **two**
positive MRR outcomes among Java ordinals 16, 17, and 20; and the token
budget above. A failed component fails advancement. Report r7-minus-r6
descriptively, including Java-only changes, but do not treat repeated
stochastic model calls on exposed cases as independent confirmation.

## Open Questions

- Will the r7 Java prompts meet 8K and aggregate cost admission?
- Does behavior-bearing presentation improve selection of newly reachable
  files while preserving r6's existing case-level wins?
- Which fresh BugSwarm population can independently test a qualified rule
  with authenticated or reproducible failure artifacts?
