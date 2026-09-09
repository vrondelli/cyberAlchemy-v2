# Define Transport

- Observed capability: Invoke
- Mode: Define
- Target artifact: private ontology-runtime module
- Target lifecycle owner: absent; selection required
- Outputs: `SPEC.md`, `GLOSSARY.md`, `STATES.md`, `OPERATIONS.md`,
  `QUERIES.md`, `INTERFACES.md`, `EVENTS.md`, `MAPPINGS.md`
- Template: DomainSpec spec family
- Discovery: accepted `../findings.md`
- Glossary: feature-local; no candidate promotion
- Implementation layering: explicit downstream Plan obligation
- Distill: skipped for Define because the accepted finding already fixes one
  narrow module boundary; Design performs the required unit check.
- Gap ownership: Invoke owns authoring consistency; the target owner-selection
  gate owns runtime/transition decisions.
- Necronomicon transport: not emitted; no matching target section was selected.
- Authority effect: none
- Next mode: Design

