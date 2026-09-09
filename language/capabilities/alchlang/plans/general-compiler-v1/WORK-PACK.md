# General Compiler v1 Work Pack

Status: candidate pending execution acceptance  
Work Pack: `CA2-WP-ALCHLANG-GENERAL-COMPILER-V1-001`  
Stop condition: first blocker or frontier complete  
Execution model: five independently validated SWUs

This work pack turns the accepted general-compiler predecessor into one finite D65 execution frontier. `work-pack.json` is the machine source; this Markdown file is its human view.

| Order | SWU | Outcome | Depends on | Next |
| --- | --- | --- | --- | --- |
| 1 | `GC-SWU-01` | DomainSpec v2 authored source | accepted predecessor | `GC-SWU-02` |
| 2 | `GC-SWU-02` | deterministic graph, system ontology, and traceability | `GC-SWU-01` | `GC-SWU-03` |
| 3 | `GC-SWU-03` | generic compiler core and tests | `GC-SWU-02` | `GC-SWU-04` |
| 4 | `GC-SWU-04` | exact implementation binding authored by one required helper | `GC-SWU-03` | `GC-SWU-05` |
| 5 | `GC-SWU-05` | independent source-local conformance and results | `GC-SWU-04` | complete |

Each SWU has exact material targets, validation commands, and done criteria. Every declared target must be absent at that SWU's admission; pre-existing bytes or drift block execution.

The compiler is complete for this work pack only when all five SWUs validate in order. Completion still does not mean canonical admission, publication, release, deployment, production readiness, product-value proof, or external-effect authority.

Validate the candidate plan without writing:

```bash
python3 validate-work-pack.py
```
