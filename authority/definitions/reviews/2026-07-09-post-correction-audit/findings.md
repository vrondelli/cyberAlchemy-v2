# Findings — post-correction audit of the ontology tower

Dispatch: `2026-07-09-post-correction-audit` (`dispatch_type: review`)
Attackers: Peirce (formal/mechanics) · Whitehead (adversarial/overclaim) · Abramsky (computational/reference-integrity)
Verifiers: Popper (counter-example) · Wittgenstein (definitional)
Final approver: Bourbaki
Tree state: HEAD `62e7b055`, working tree clean — **all material below is committed**.

## The headline

`implementation/domainspec/vault/ontology-conventions.md` (`node_type: constitution`,
`status: consolidated`, **v2.3.0**) already implements the three-way split the owner
demanded, typed, with inverses:

```
:570  derives-from / derives    formalized nodes -> formalized nodes
      "...If a session synthesizes two discoveries into a new third, the session
       uses `creates`; the new artifact then declares `derives-from` toward its sources."
:599  creates / created-by      session -> any
      "A produced B as output. Replaces the deprecated `provenance-for`."
```

`derives-from` = inputs. `creates`/`created-by` = producer. Separate, in a consolidated
constitution. The cav2 spine has been re-deriving this in ignorance of the file, and
`CANONICAL-KINDS.md`'s new `## Edges` section **omits `creates` entirely**.

## Surviving findings

| # | File | Evidence | Sev | Fix |
|---|---|---|---|---|
| 1 | `implementation/domainspec/vault/ontology-conventions.md:618-634` vs `cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md:112-115` | The vault's **"Edges deprecated by this catalog"** table retires `contextualizes`→`cites`, `depends-on`→`derives-from`, `questions`→`opens-question`, `updates`→"(none — use `version:` frontmatter)", `exemplifies`→"(defer)", `resolves`→`closes-question`. The `## Edges` section **revives all of them** and promotes `updates` to a succession *morphism*. It also inverts the class of three live vault edges (`refines`, `alternative-to`, `consumed-by`). | CRITICAL | Declare `## Edges`'s relation to the v2.3.0 catalog — supersede, import, or scope out. It cannot silently fork it. |
| 2 | `CANONICAL-KINDS.md:126` | *"`consumed-by` is the `### Primary Consumers` list carried by every definition card."* The vault owns `consumes`/`consumed-by` as **session → any**, *"read or used B as input **without deriving new claims from it**. Distinct from `derives-from`."* cav2 files it under **grounding** ("morphisms… must be acyclic") sourced from a *definition card*. Same string, opposite category. | CRITICAL | Strike the provenance bullet. As a grounding edge it **is** invented here. |
| 3 | `DEFINITIONS.md:3401` (CAV2-D51, `Status: active`) | `canonical(a) <-> kind(a) in CanonicalKinds and origin(a) = process(kind(a))`. `process(·)` has **no definition in the spine** post-CAV2-D56-retraction. Wittgenstein's correction: the clause is not *refuted*, it is **not truth-evaluable** — an active card whose formal voice calls an undefined symbol. `residue` (`CANONICAL-KINDS.md:56`, *"no producer of its own"*) is the counterexample that *would* refute it once well-formed. | CRITICAL | Eliminate or redefine `process(·)` in D51's Formal Interpretation. **Then** adjudicate residue (owner-parked). |
| 4 | `CANONICAL-KINDS.md:224,232-233` | `### OQ-7 … RESOLVED (recorded, not re-litigated)` / *"Kept as a record so the objection is not re-raised."* / `Status: CLOSED`. OQ-1..OQ-6 all read OPEN. The objection it closes is verbatim from `ontology-conventions.md:131` (*"Why `session` is not a node_type"*) — a **consolidated** constitution the file never cites. A `candidate` file self-closed an objection from a consolidated source, with no gate, within one session. | CRITICAL | Revert to `Status: OPEN`. Strike "not re-litigated" / "not re-raised" — a self-authored argument cannot bar its own review. |
| 5 | `CANONICAL-KINDS.md:112-113` | `:113` calls `supersedes` an *"Endomorphism (`T -> T`, same kind both ends); a strict order, **acyclic**"* — a `T -> T` arrow **is** a type-level self-loop. `:112` says grounding "must be acyclic" with no level named. The file's own `:160` warns: *"Conflating (1) [type-level] and (2) [instance-level] is the same error that malformed the `Process` column."* It commits that error two sections earlier. | MAJOR | Scope acyclicity to the **instance** graph. The type graph may cycle (owner: discovery↔research). |
| 6 | `CANONICAL-KINDS.md:219-221` | *"which is **independent evidence** that 'produced by a declared process' was never the right membership test."* A **candidate**, self-authored row cited as evidence against an **active** card. This is the same inference-from-one-case that got CAV2-D56 retracted. | MAJOR | Excise from "which is independent evidence". State the gap; draw nothing from it. |
| 7 | `DEFINITION-SCHEMAS.md:43` | `CAV2-D51-SCHEMA`, status `tracked (documentary)` = active, carries `process_origin`. **Zero artifacts in the repo carry a `process_origin` value.** Wittgenstein's correction: not "dangling" — it is an **unwired duplicate** of the vault's existing `created-by`, differing only in admitting a skill-run rather than a session. `CA-OQ-2` forks attested-vs-declared **without ever considering `created-by`**. | MAJOR | Reopen `CA-OQ-2` to consider wiring `process_origin` to `created-by` before minting an attestation scheme. |
| 8 | `CANONICAL-KINDS.md:122` | *"Provenance for these verbs — they are already in use, not invented here"* — universally quantified over 16 verbs; 7 cited, and half of the "in use" ones are in use **as tombstones** (finding 1). | MAJOR | Restrict the quantifier or excise the sentence. |
| 9 | Enumeration collision | `ontology-conventions.md` `node_type` has **16 values**; `CANONICAL-KINDS.md` has **17 rows**; they share **6** (`discovery`, `research`, `axiom`, `premise`, `constitution`, `spec`). **Zero files carry a `canonical_kind:` field** — `node_type` is the only one actually used. cav2 minted a second, incompatible enumeration for a field that already had one. | MAJOR | Reconcile the two enumerations, or declare cav2's a distinct vocabulary and say so. |

## Findings DROPPED on verification

- **`node_type == canonical_kind` propagation (17-of-37 sessions non-conformant).** Popper: *no committed file records that ruling*, and `ontology-conventions.md:71` ("`node_type` — Document Role") says the opposite. The ruling is real (owner, in session) but **exists in no artifact**. Three attackers built on a premise the tree does not contain. **This must be written down before anything is derived from it.**
- **`consumed-by` appears zero times.** False — 40 files.
- **`projection`/`residue` inferred `no`.** The text already discloses the inference and marks OQ-5 OPEN. No line must change.
- **Un-struck CAV2-D56 promotion prose.** Declared intentional (append-only record).
- **`alternative-to` is symmetric.** Refuted — the vault gives it inverse `has-alternative`, 1:N, and states *"`contradicts` is the only symmetric edge."*

## Verdict

| Artifact | Verdict |
|---|---|
| `cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md` | **FIX** (6 surviving findings) |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` (CAV2-D51) | **FIX** (undefined symbol in an active card's formal voice) |
| `cyberAlchemy-v2/authority/definitions/DEFINITION-SCHEMAS.md` | **FIX** (unwired field) |
| `cyberAlchemy-v2/authority/definitions/DEFINITION-DRIFT-AUDIT.md` | **KEEP** |
| `implementation/domainspec/vault/ontology-conventions.md` | **KEEP** — it is the consolidated authority the tower forked |

Whitehead's central hypothesis is **confirmed**: the session retracted one definition and, in the same breath, shipped 8 rows, ~16 edge types with a falsified provenance claim, a morphism doctrine contradicted by its own "Undecided" list, and one self-closed open question. `CANONICAL-KINDS.md` is **more** overclaimed after the correction cycle than before it.
