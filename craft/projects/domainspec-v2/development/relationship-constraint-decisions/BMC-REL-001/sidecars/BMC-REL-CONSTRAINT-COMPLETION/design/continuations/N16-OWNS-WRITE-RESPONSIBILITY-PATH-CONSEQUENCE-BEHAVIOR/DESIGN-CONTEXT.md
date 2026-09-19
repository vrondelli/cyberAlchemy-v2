# N16 Design Context

## Objective

Use the exact D29 active set, N13's per-dimension governance, and the completed
lifecycle and custody decisions to identify `write-responsibility` as the sole
remaining current dimension without inventing a sequencing choice. Then isolate
whether write-responsibility consequences stop at each direct canonical `owns` fact
or include non-authoritative reachability over an acyclic same-dimension path.

## Evidence Boundary

N13 B requires an independent decision for each admitted D29 dimension. N14 A keeps
lifecycle direct-only, and N15 A keeps custody direct-only; neither answer supplies
consent for write-responsibility. The registry's exact three-member active set leaves
`write-responsibility` as the sole current unselected dimension by set difference,
not by the registry's serialization-only order.

D29 describes write-responsibility as direct semantic responsibility and authority
for changing an Entity's business state under its admitted invariants. It explicitly
withholds inferred transitivity and closure, and says runtime writers, Operations,
permissions, and calls do not become canonical `owns` edges merely by performing or
permitting a write. D23 nevertheless recognizes a relationship chain as one possible
finite composition-path consequence, so non-authoritative derived reachability is a
genuine owner option rather than a default or an invalid candidate.

The denominator contains seven direct exact sources: the N13, N14, and N15 owner
receipts; D23/D29; the ownership registry; canonical `owns`; and the packet row.
The mutable cumulative closeout is not a source, avoiding a self-staling denominator
cycle. Excluded are lifecycle or custody reopening, mixed-dimension paths, runtime
writers or Operations as ownership edges, new canonical edges or verbs, naming,
provenance, materialization, representation, storage, closure proof, mandatory
ownership, runtime, numeric, packet, canonical, and implementation work.

## Dispatch Technique Trace

| Technique | Activation | Effect | Validation |
|---|---|---|---|
| `sequence` | N13 B, N14 A, and N15 A precede N16 | derives sole remaining dimension without copying behavior | receipt and registry checks |
| `owner_boundary_check` | A/B alter write-responsibility semantics | A/B authority-gated | canonical prefilter |
| `residue_ledger` | lifecycle, custody, mixed paths, runtime actors, and representation stay separate | explicit exclusions | boundary checks |
| `artifact_contract_bridge` | manifest feeds extractor and selector | fixed point | byte-identical replay |
| `concrete_path_evidence` | seven direct SHA-bound sources | no ambient inference | SHA checks |
| `validation_loop` | generated denominator, selection, and prefilter | deterministic artifacts | replay |
| `frame_handoff` | stop at N16 | one unselected owner gate | strict runtime handoff |

A full dispatch document is not required: this is one local authoring sequence with
no delegation, protected-context transfer, or multi-capability execution graph.

## Ordered Design Rules

1. Bind N13 B, N14 A, N15 A, and the exact current D29 active set.
2. Derive `write-responsibility` as the sole remaining current dimension without
   treating registry order as precedence or N15 A as N16 consent.
3. Classify only acyclic paths of length at least two whose canonical `owns` edges
   all carry exact dimension `write-responsibility`.
4. A keeps consequences on direct facts only.
5. B permits a non-authoritative derived write-responsibility reachability
   consequence without authoring a new canonical `owns` fact.
6. Do not treat runtime writers, Operations, permissions, or calls as canonical
   ownership or reopen lifecycle or custody.
7. Present A, B, defer, and stop with aligned examples and decision effect none.
8. Stop before N16 selection, Plan, implementation, or canonical mutation.

Authority effect: `none`.
