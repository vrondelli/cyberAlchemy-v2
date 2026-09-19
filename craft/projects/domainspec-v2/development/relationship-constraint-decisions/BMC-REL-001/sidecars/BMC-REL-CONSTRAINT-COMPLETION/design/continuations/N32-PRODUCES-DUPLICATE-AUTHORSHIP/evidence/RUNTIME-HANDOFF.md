# N32 Runtime Handoff

Status: `blocked-at-owner-decision`

- Decision: `BMC-REL-NONNUMERIC-32-PRODUCES-DUPLICATE-AUTHORSHIP`
- Sequenced verb: `produces`
- A: reject exact duplicate authored canonical `produces`
- B: conditionally coalesce only with separately closed deterministic provenance
- C: defer
- D: stop
- Recommendation: A
- Selection: `null`
- Execution allowed: `false`
- Authority effect: `none`

The duplicate key is exact verb, Operation concept ID, Event concept ID, and admitted
authority/feature context. Preserve every source handle. Do not infer payload or
runtime occurrence equality, decide `emits`, create a cross-row rule, silently merge,
select adjacent facets, mutate packet or canonical sources, implement, promote, or
publish.
