# Events: OEW Thin Prototype

## BrowserWitnessRecorded

**Produced by:** [RunPokerBrowserWitness](operations.md#runpokerbrowserwitness)  
**Transition:** Serving → Witnessed candidate

Payload:

| Field | Meaning |
| --- | --- |
| run_id | Stable local run identity |
| source/build/receipt digests | Exact input/output binding |
| playwright/chromium identity | Browser toolchain binding |
| assertions | Named positive and negative results |
| outbound_requests | Must be zero |
| teardown | process, port, and temporary-root proof |
| authority_effect | Must be `none` |

Consumer: the read-only Task Session closure audit and human reviewer. A
separately owned L2 verifier may consume the immutable receipt later. No
ontology, promotion, release, or deployment consumer is implied.
