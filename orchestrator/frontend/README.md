# Control Center

Status: implementation candidate  
Authority effect: none

This dependency-free browser client consumes the canonical `/api/v1` surface.
It lists runs, explains structural state, shows recovery facts, creates direct or
saved-template proposals, and keeps admission as a separate operator action.
It also exposes the general Lab, visual run DAG, runtime ontology, and Operations
surfaces required for migration parity with the predecessor console.
Completed runs show digest-verified result summaries, exact accepted events, and
the worker, lease, fence, receipt, and effect record behind every command.

Run `node --test orchestrator/frontend/test/*.test.mjs` for the presentation
contract. The API serves these files directly in the local edition.

## Open Questions

Authentication, collaborative editing, template publication, domain extension
records for Lab and ontology, and remote edition navigation remain future
product decisions.
