# A Human Guide to Proofs and Obligations

> [!WARNING]
> **WORKING RESEARCH NOTE — NOT AN OFFICIAL STANDARD**
>
> This guide explains a proposed way to document proofs and requirements. DomainSpec and CAV2 have not adopted it. It does not prove that either system is complete, ready to release, or approved for publication.

This guide is for collaborators who want to understand the idea before reading the research ledger. The publishable evidence narrative is in [the full findings](../findings.md). The machine-readable dispatch closeout stays local at `../receipts/dispatch-closeout.json` under repository policy. If this guide disagrees with those records, this guide is wrong. None of these documents can approve itself.

## The problem

Words such as “proved,” “validated,” and “approved” often hide several different events:

- Someone wrote a claim.
- Someone chose the exact version of the material being checked.
- A program ran and returned a result.
- Lean checked a theorem about a formal model.
- A responsible owner accepted what the result means for the project.
- Someone authorized a release or publication.

These events may support one another, but they are not interchangeable. A test can pass while checking old inputs. A Lean theorem can be correct while its model does not match the live repository. A document can be current but not approved. A cryptographic fingerprint can identify a file without saying whether the file is true.

The documentation system should connect these events without pretending they are the same event.

## The model in one minute

The proposal keeps six things separate:

1. **Claim:** the statement we want to support or challenge.
2. **Obligation:** the exact requirement that must be met before the claim can move forward.
3. **Exact inputs:** the versions and fingerprints of the sources, examples, programs, rules, and settings used for one attempt.
4. **Evidence:** what was observed, tested, or proved.
5. **Recorded result:** what a named checker reported when it examined those exact inputs.
6. **Owner decision:** what the person or group responsible for the obligation decides after reviewing the evidence.

A human page or machine index comes after those six. It is a view of the records, not a new source of truth.

```text
owner-written meaning
  -> claim
  -> requirement
  -> exact inputs
  -> test or formal proof
  -> recorded result
  -> owner decision
  -> human page and machine index
```

The arrows are references. They carry identity and history; they do not transfer authority. A checker cannot approve its own result, and a generated page cannot make its sources official.

Under the hood, the system will need more precise names. A **predicate** is the condition being checked. A **binding** is the exact list of input versions and fingerprints. A **receipt** is the recorded result of one checker run. A **projection** is a generated view. These terms are useful once the simple chain is understood.

## How far does a proof claim reach?

People often use the word “proof” for several different achievements. That makes a small result sound like a complete guarantee. For the systems we want to build, start with three plain questions:

1. **Shape:** Is the artifact formed correctly? Are the required fields, types, and relationships present?
2. **Meaning:** According to rules defined independently of the program being checked, is this the right answer?
3. **Behavior:** Did the real, identified system make that decision and enforce it when it ran?

A shape check can be perfectly deterministic and still say nothing about meaning. A theorem can prove that a decision function matches its mathematical definition without proving that the definition represents the real policy. A runtime can return the expected answer without proving that a forbidden action could not bypass it.

For an agent or runtime claim, those three questions expand into a more exact ladder:

| Rung | Plain question | Precise record name |
|---|---|---|
| 1. Exact material | Do we have the intended artifact, and do its bytes and declared identity match? | `ShapeValid` and `BytesMatch` |
| 2. Output conformance | Does this one output meet a frozen set of output requirements? | `OutputObligationsHold` |
| 3. Intended decision | What should the independent domain rules decide for this exact request and environment? | `RequestedActionAuthorized` |
| 4. Runtime agreement | Did the exact bound runtime return the same decision as those independent rules? | `DecisionMatchesSpec` |
| 5. Enforced effect | Did the action that actually happened obey the decision, with no path around the gate? | `ExecutedActionMatchesDecision` |
| 6. Trace or policy behavior | Does a declared finite sequence obey its trace rule, or does one policy preserve another over an exact bounded set? | `RecordedTraceMeets` and `PolicyRefinesWithin` |
| 7. Whole-agent conformance | Does the agent satisfy the specification across a stated family of environments and a stated period of time? | `agent ⊨ spec` |

Each rung makes a different claim. Evidence for a lower rung does not automatically earn a higher one. File fingerprints and schemas support rung 1. An independent semantic definition is needed for rung 3. Runtime observation, exact bindings, and replay are needed for rung 4. Non-bypass mediation and effect observation are needed for rung 5. Whole-agent conformance additionally needs a frozen agent boundary, an environment family, observation rules, a time horizon, and an owner-approved comparison rule.

The current repository does **not** implement or prove general `agent ⊨ spec`. The first honest runtime target is rung 4: `DecisionMatchesSpec` for one bounded access decision. It asks whether a content-addressed runtime agrees with independently owned access semantics over one explicit, nonempty, finite set of requests. If the compiler, runtime, observation, mediation, or denominator bridge is missing, the result must be called an **integration demonstration**, not a complete proof.

Lean’s existing `Satisfies ↔ decidePolicy` theorem can support one link inside that rung. It does not by itself prove the compiler, the TypeScript runtime, enforcement, trace behavior, or whole-agent correctness.

This ladder refines the [earlier three-layer explanation](../../../.arcanum/inventory/entries/three-layer-agent-conformance-verifier-decision.md) with the later [verified current-state result](../../../.arcanum/inventory/entries/agent-satisfies-spec-current-state-research-strategy-result-synthesis.md). It is a scope ladder for system claims, not a universal ranking of mathematics.

## Where the records should live

DomainSpec and CAV2 own different meanings. The safest design is therefore not one master database that becomes a new authority over both projects.

| Plain-language option | Research code | Decision |
|---|---|---|
| Keep a small shared address format, while each project keeps its own meanings and decisions | `TOP-03` | Preferred only if a named owner maintains the shared format and both projects explicitly adopt the same version |
| Keep two separate catalogs and generate a cross-reference between them | `TOP-02` | Safe default when the shared-format agreement does not exist |
| Put both projects under one master meaning-and-status registry | `TOP-01` | Rejected because it would become a competing authority |

The shared part, if adopted, may say “this record has this ID, version, owner, and file fingerprint.” It may check that required fields are present. It may not decide what a DomainSpec obligation means, whether CAV2 authority has been granted, whether an obligation is resolved, or whether something may be published.

Until the owners choose otherwise, assume two local catalogs with a generated cross-reference (`TOP-02`).

## What already exists

The work does not start from an empty page. We already have useful experiments, programs, and Lean proofs. They answer different questions.

### Mint taught us what a domain must own

Mint is the CAV2 work for creating a domain-specific authority package without making that domain depend on CAV2 at runtime.

The [first Mint experiment](../../../cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/findings.md) asked every new domain to invent a new kind of authority. The research-domain example failed that test because its kinds were reasonable specializations of CAV2’s general kinds. The experiment was correctly recorded as **falsified**.

That failure exposed a bad test, not necessarily a bad design. The [follow-up experiment](../../../cyberAlchemy-v2/development/mint/experiment-content-autonomy/run-findings.md) asked a better question: does each domain own some real rules or definitions of its own, can it operate without looking back to CAV2, and can it do so without circular authority? The research, product, and process examples all passed that test.

The practical lesson is:

> Reuse the machinery for organizing authority, but let each domain own its actual rules and definitions.

This is experimental evidence from three examples. It is not proof that complete Mint has shipped.

The [current Mint runtime](../../../cyberAlchemy-v2/development/mint/runtime/README.md) can already check structured authority packages, create bounded candidate files, recover files it created, and produce Cedar- and logic-shaped outputs. It still cannot grant authority, approve a promotion, or mint the complete target system.

### Domains also teach CAV2

CAV2 is not only a base that domains consume. It is also a learning framework
that domains can improve. A domain may discover a better definition, rule,
knowledge relationship, architecture pattern, validator, proof method, or
formalization approach. That discovery remains owned by the domain where it was
made. CAV2 receives a proposal to generalize it, not ownership of the original.

The canonical CAV2 lifecycle now makes the feedback loop explicit:

```text
domain-owned idea
  -> evidence in the originating domain
  -> CAV2 candidate
  -> a generalized proposal that states what changed or was lost
  -> exercise in another independently owned domain or a very different setting
  -> challenge and contrary-evidence review
  -> CAV2 owner decision
  -> one promoted CAV2 version
  -> separate adoption by each domain that chooses to use that version
```

Here **promotion** means CAV2 accepts the generalized idea into its own base.
**Adoption** is a different decision: a domain chooses to use one exact CAV2
version. Neither event changes the original domain's local meaning.

The owners remain separate throughout:

| Step | Who decides | What the decision does not do |
|---|---|---|
| Local idea and evidence | Originating domain | Does not make the idea CAV2 authority |
| Exercise in another context | The exercising domain owns its bounded result | Does not approve CAV2 promotion or rewrite the source domain |
| Generalization and promotion | The relevant CAV2 owner route | Does not silently change or update any domain |
| Adoption of a promoted version | Each consuming domain | Does not transfer its local meanings or lifecycle decisions to CAV2 |

This route covers more than proofs. Definitions and rules can be proposed
through definitions or constitution governance. Knowledge and architecture
patterns can be proposed through their own owner routes. A reusable proof or
validation approach may become a method, pattern, specification, or definition
candidate. The proof object, Lean result, Cedar or Datalog result, test, or
receipt remains evidence; it cannot promote itself.

The existing examples show why the independent exercise matters:

- The [Mint/Foundry synthesis](../../../.arcanum/inventory/entries/mint-foundry-content-autonomy-synthesis.md)
  records a failed first criterion and a better second experiment. It supports
  inheriting CAV2 machinery while localizing domain content, but remains an
  internal candidate and does not prove that complete Mint has shipped.
- The [Kodamai comparison](../../../.arcanum/inventory/entries/kodamai-smithe-correctness-layer-synthesis.md)
  sharpened the difference between an encoded constraint, a theorem about a
  model, and whole-agent correctness. It can inform a proof-method proposal; it
  does not prove our general verifier or make claims about unpublished systems.
- The [three-layer agent-conformance proposal](../../../.arcanum/inventory/entries/three-layer-agent-conformance-verifier-decision.md)
  separates output shape, output meaning, and actual-action conformance. Its
  distant-witness idea is a useful stress test for generality, but its general
  verifier decision remains proposed rather than implemented or gated.

The lifecycle is now defined, but the complete operational process has not been
demonstrated. We do not yet have a finished candidate package that traverses the
whole route, survives an independently owned domain exercise, receives CAV2
promotion, and is then adopted by another domain as an exact version.

### Lean gives us three different kinds of formal result

Lean checks exact mathematical statements. It does not automatically prove that a statement describes the live repository correctly. We therefore need to record both the theorem and the bridge from real project data into the theorem’s model.

| Human question | Exact Lean anchor | What we currently know |
|---|---|---|
| Does the policy decision function match the policy rules defined in its model? | `AgentPermissionKernel.decidePolicy_sound` in local checkout `domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean` | The isolated target rebuilt successfully. Lean reports that the theorem uses `propext` and `Quot.sound`. The same file includes a concrete example showing that its layered policy cannot be flattened into the single-set policy defined there without changing a decision. It does not prove that a deployed runtime cannot be bypassed. |
| Can individually clean records still form a forbidden cycle? | `governs_acyclicity_witness` and `acyclicity_not_unary` in local checkout `domainspec-lean-formalization/lean-engineer/cav2-governance/GovernsAcyclicity.lean` | The isolated target rebuilt successfully. It proves that the fixed `C2 -> C13 -> C4 -> C2` example contains a cycle even though every modeled one-record check passes. It also proves that checks which cannot see edges cannot characterize cycle-freedom in this model. It does not yet read the real CAV2 graph. |
| Can a richer view detect structure that a simple per-item view misses? | `FunctorialResidueStructure` in local checkout `domainspec-lean-formalization/lean-formalization/FunctorialResidueStructure.lean` | The source contains no `sorry`, `admit`, or declared `axiom`. Its fixed example distinguishes two structures that look the same to the declared item-by-item view but differ in how their parts are joined. However, this target did not rebuild during the latest review because its Lean version and locked dependencies no longer agree. Treat earlier build evidence as historical until that mismatch is repaired. |

Do not describe the whole Lean folder as “proved.” It currently has 482 top-level Lean files. Of those, 191 contain the word `sorry` and four contain an explicit `axiom` declaration. Some `sorry` occurrences are explanatory text rather than unfinished proofs, so the status of a theorem must be checked theorem by theorem: inspect its declaration, build its exact target, and ask Lean which assumptions it uses.

### Cedar, FOL, and Datalog have a different job

Mint can translate parts of an authority package into a small internal Cedar format and a small first-order-logic format. It then reads its own output back and checks that the fields still match. Fifteen focused tests for those two translators passed during the latest review.

That is useful, but it is translation checking—not policy evaluation or theorem proving. The current code does not run the official Cedar engine, a Datalog engine, or a general theorem prover.

The older [Inventory summary](../../../.arcanum/inventory/entries/fol-constitution-validation-complement-synthesis.md) says the first step is to formalize the three-record cycle. That step is now stale: the Lean file exists and rebuilds. The next useful bridge is:

1. Read an owner-approved CAV2 graph from exact source files.
2. Check it with an operational Cedar or Datalog evaluator.
3. Compare the bounded result with the Lean model.
4. Return the cycle or other counterexample in a structured result record.

Lean, Cedar, and Datalog should support one another. None should be advertised as replacing the others.

## What each artifact can actually tell us

| Artifact | What it tells us | What it does not tell us |
|---|---|---|
| File fingerprint | Which exact bytes were used | Whether those bytes are true, current, or approved |
| Input list or binding | Which source and tool versions belong to one attempt | Whether the sources were authorized or the attempt succeeded |
| Lean environment record | Which Lean version, dependencies, imports, and target were used | Whether the target built or the model matches the real project |
| Observation | What someone or something observed in a stated setting | A formal proof or an owner decision |
| Formal proof | That an exact proposition follows in an exact formal model | That the model matches the live system or that an owner accepts the result |
| Assumption report | Which trusted assumptions a theorem uses | Whether those assumptions are appropriate for the project meaning |
| Checker run | What a checker reported for exact inputs | Approval, authority, or resolution of the obligation |
| Receipt | A structured record of one checker run | The meaning of the claim or the owner’s decision |
| Attestation | An integrity or identity statement about exact material | The truth of the material or permission to act on it |
| Owner decision | What the responsible owner decided about an obligation | Release or publication approval unless those were decided separately |
| Generated page | A readable view of source records | Official status, truth, or permission to publish |

The same caution applies to status. Keep these seven questions separate:

1. Was the record written by a person or generated?
2. Has its owner adopted it?
3. Is it still the current version?
4. Is the obligation open, resolved, reopened, or rejected?
5. What did the latest check report?
6. Is the generated page up to date?
7. May the material be published to this audience?

One “status” field cannot answer all seven.

## Who decides what

| Owner | Decides | Does not decide |
|---|---|---|
| DomainSpec | DomainSpec meanings, requirements, exact evaluation inputs, and whether a DomainSpec obligation is resolved | CAV2 authority, promotion, or publication |
| CAV2 | CAV2 authority kinds, privacy rules, promotion requirements, and CAV2 integrity statements | DomainSpec meanings or whether a DomainSpec obligation is resolved |
| Lean formalization | Exact formal models, propositions, proof sources, build targets, dependency versions, and reported assumptions | Whether the model correctly represents DomainSpec or CAV2 source material |
| Formal-input adapter | The explicit translation from approved project records into Lean, Cedar, FOL, or Datalog inputs | New project meaning, owner approval, or proof by translation alone |
| Generated-view owner | How records are mapped, rebuilt, filtered, and shown | Truth, obligation resolution, promotion, or permission to publish |
| Publishing owner | Whether named material may be shown to a named audience through a named channel | Whether the material is true or proved |

Five actions remain separate: adopting a record, passing a check, resolving an obligation, promoting authority, and publishing. None should be inferred from another.

## How human and machine documentation should work together

The long-term documentation should be generated from exact source records, but the source records must stay with their owners.

| Layer | Purpose | Current state |
|---|---|---|
| Owner source | Defines the actual meaning or rule | Exists, although some DomainSpec validation material is still candidate work |
| Project-local catalog | Helps each project find its own claims, obligations, evidence, and decisions | Proposed; location and format not chosen |
| Lean theorem catalog | Connects one obligation to an exact theorem, model, source fingerprint, build target, toolchain, dependencies, assumptions, and build result | Pieces exist in Lean files and build files; no unified catalog exists |
| Cross-project index | Connects exact DomainSpec, CAV2, Mint, and Lean references without taking ownership of them | Proposed and unbuilt |
| Generation record | Lists the generator, inputs, mappings, privacy rules, publication approval, and output fingerprints | Missing |
| Human page | Explains the claim, evidence, limits, current owner decision, and contrary evidence | Proposed; this manually written guide is not that generated product |
| Public page | Shows only the approved, privacy-safe subset | Blocked until publication ownership is decided |

The machine index and human page should eventually come from the same generation record. That makes it possible to see when a page is stale and exactly how it was built.

## A worked example: the key and the door

The research followed a small DomainSpec example about a key opening a door. The example is useful because it shows where an honest system must stop.

What exists:

- DomainSpec definitions and a relationship rule exist.
- Candidate records describe a condition, an obligation, a runtime contract, an input binding, and a result format.
- A runtime file now exists.

Why the chain still stops:

- The input binding was written when that runtime file was absent.
- The new runtime file has not been accepted into the binding with its exact fingerprint.
- The exact evaluator, verifier, rules, and settings are not bound.
- No approved positive and negative examples have been executed and recorded.
- No owner has made a decision about the obligation.

The planned first guard is called `DS-VAL-BINDING-CURRENTNESS`. Its job is simple: stop when the recorded input list and the actual runtime no longer describe the same state.

That guard and its rejection receipt do not exist yet. We have observed the mismatch; we have not executed a successful rejection. Therefore the example does not establish a complete proof, a reliable negative test, repeatability, or readiness to run.

## Bad cases the system must eventually reject

The research designed seven negative examples. None has been turned into final, fingerprinted test material or executed with a receipt.

| Bad case | What a good system must notice | Planned guard |
|---|---|---|
| Required source is missing | The claim cannot be evaluated without it | `DS-VAL-SOURCE-RESOLUTION` |
| File fingerprint does not match | The check is about different bytes than the binding names | `DS-VAL-EXACT-BINDING` |
| Old record is treated as current | A newer record has replaced it | `DS-VAL-RECORD-CURRENTNESS` |
| Source is not allowed to define the meaning | The record came from the wrong authority | `DS-VAL-SEMANTIC-ADMISSION` |
| A negative example is wrongly accepted | The system under test failed, so the test harness must also report failure | `DS-VAL-EVALUATOR-RECEIPT` |
| A resolved obligation was reopened | The old result can no longer be treated as current | `DS-VAL-OBLIGATION-LIFECYCLE` |
| CAV2 authority kind cannot be resolved | The cross-project mapping is unknown or invalid | `PROJ-VAL-CROSS-PROJECT-MAPPING` plus `CAV2-VAL-AUTHORITY-KIND` |

A well-designed example is still only a plan. Reliable evidence requires exact example files, fingerprints, commands, results, and receipts.

## Decisions the owners made in WP-00

The research could not make these decisions on behalf of the owners. The
owners have now made them:

| Gate | Plain-language decision | Who must decide |
|---|---|---|
| `GATE-01` | Will there be a shared address format, who owns it, and will both projects adopt the same exact version? If not, use two local catalogs. | DomainSpec, CAV2, and the proposed format owner |
| `GATE-02` | Which meaning belongs to the authored source, and which belongs only to generated output? | DomainSpec meaning and generation owners |
| `GATE-03` | Which existing CAV2 authority kinds describe these records, and are any genuinely missing? | CAV2 definition and authority-kind owners |
| `GATE-04` | Is “residue”—information not preserved by a translation—a record type of its own or a property of another record? | CAV2 ontology and decision owners |
| `GATE-05` | Which words and transitions describe the lifecycle in each project? | DomainSpec and CAV2 lifecycle owners, separately |
| `GATE-06` | How do we distinguish declared origin from origin supported by an integrity statement? | CAV2 record and attestation owners |
| `GATE-07` | Who owns the cross-project mapping, and what happens when the two sources disagree? | Both source owners and the mapping owner |
| `GATE-08` | Who may publish which material, to which audience, through which channel? | Source owners and the publishing owner |

Current result on 2026-08-22: `GATE-01` is ratified and `GATE-02` through
`GATE-08` are accepted. In plain language, the two systems share only a
CAV2-owned address format. DomainSpec v2 and CAV2 keep their own meanings,
records, proof rules, and lifecycles. Proof material uses existing CAV2 kinds;
residue begins on the operation and becomes a separate record only when it
needs its own route. There is no permanent cross-project adapter. Material is
private by default and publication requires approval for the exact final
bytes, audience, and channel.

These decisions complete `WP-00` for planning. They do not implement the
substrate, prove a claim, discharge an obligation, promote CAV2 authority, or
authorize publication.

## What remains blocked

| Blocker | Plain-language problem |
|---|---|
| `EVF-READINESS-001` | There is no complete positive example from claim through owner decision. |
| `EVF-CURRENTNESS-001` | We can see that the key-door binding is stale, but the guard and rejection receipt do not exist. |
| `NEGATIVE-FIXTURE-READINESS-001` | The seven bad-case examples do not yet have final files, fingerprints, executions, and receipts. |
| `PROJECTION-READINESS-001` | The generator, exact inputs, mappings, privacy rules, publication approval, and output fingerprints are not bound. |
| `LEAN-REPRODUCIBILITY-001` | The CAV2 cycle and permission-policy targets rebuild, but the broader residue target currently fails because its Lean version and locked dependencies disagree. |
| `LEAN-SOURCE-BINDING-001` | No owner-approved adapter maps the live DomainSpec or CAV2 records into the Lean models with exact fingerprints. |
| `CROSS-GRAPH-EVALUATOR-001` | No official Cedar or Datalog evaluator reads the real CAV2 graph and returns the actual cycle or other counterexample. |
| `MINT-FORMAL-PROJECTION-001` | Mint’s Cedar and FOL outputs preserve the selected fields, but no solver result or Lean comparison is bound to them. |

Until these close, do not claim a complete proof chain, reliable repeatability, completed obligation, ready-to-run implementation, ready generated documentation, or official adoption.

## A practical work order

The audited research proposed this order. The codes are kept so the human guide remains traceable to the work plan.

1. Completed: decide ownership and the shared-versus-separate catalog structure (`WP-00`).
2. Next: freeze the exact source files, versions, fingerprints, and current candidate status (`WP-01`).
3. Draft the smallest shared address examples if a shared format is approved; otherwise draft the two local formats and their cross-reference (`WP-02`).
4. Draft DomainSpec’s own record format and checks (`WP-03`).
5. Draft CAV2’s own record format and checks (`WP-04`).
6. Implement the separate format, DomainSpec, CAV2, and mapping checks. Combine their results without changing their meanings (`WP-05`).
7. Create and fingerprint the seven bad cases and the complete positive example (`WP-06`).
8. Update the stale runtime binding, bind the missing tools and settings, and run the positive and negative examples (`WP-07`).
9. Ask the DomainSpec owner to resolve, reopen, reject, or leave the obligation open (`WP-08`).
10. Generate the machine index, human pages, cross-reference, and generation record with privacy checks (`WP-09`).
11. Run independent reviews, then request separate decisions for adoption, obligation resolution, authority promotion, and publication (`WP-10`).

Start with `WP-01`. The source freeze must use `projects/domainspec-v2/` for
DomainSpec authority; frozen `implementation/domainspec/` material is
historical migration evidence only. The freeze records exact bytes and status,
but it does not turn candidates into authority.

The Lean work has a separate companion sequence. It is currently blocked at
`FSP-01 / SWU-FSP01-003`: five of six theorem rows passed, while the broad
residue target could not build because its project pins Lean 4.30.0-rc2 and
its locked dependencies require Lean 4.33.0-rc1. Do not rerun the unchanged
step or continue to FSP-01 step 004 until that blocker has its own repair and
closeout route.

1. List each theorem separately with its proposition, source fingerprint, model scope, build target, Lean version, dependency lock, unfinished-proof status, and reported assumptions (`FSP-01`).
2. Repair and independently check the broad Lean project’s version mismatch without changing theorem claims under old approval (`FSP-02`).
3. Define owner-approved translations from exact DomainSpec and CAV2 records into formal inputs. Record anything the translation cannot preserve (`FSP-03`).
4. Extract the real CAV2 relationship graph and connect it to the cycle model. Keep the three-record example as a negative control (`FSP-04`).
5. Implement the Cedar or Datalog evaluator and compare its bounded results and counterexamples with the Lean model (`FSP-05`).
6. Produce a structured proof-check receipt containing the proposition, proof source, environment, input fingerprints, result, counterexample, assumptions, and claim limit (`FSP-06`).

Even after these checks pass, the relevant owner must still decide what the result means for the obligation or authority record.

## Words to use carefully

- Say **candidate** when material exists but its owner has not adopted it.
- Say **observed** when we inspected evidence and **executed** only when a recorded command actually ran.
- Say **proved in this model** rather than “proved” when the bridge to the live system is not established.
- Say **check passed** rather than “obligation resolved” until the owner makes that decision.
- Say **cross-domain exercise survived** rather than “generalized” until the CAV2 owner promotes a named version.
- Say **promoted in CAV2** does not mean **adopted by a domain**; name the exact version and the separate domain decision.
- Name the owner when discussing meaning, obligation status, promotion, or publication.
- Show exact versions and file fingerprints when a claim depends on exact bytes.
- Keep contrary evidence and uncertain results visible.
- Never use a file fingerprint, schema check, receipt, attestation, generated page, or Inventory entry as shorthand for truth or approval.
- Label every generated page as a view and link it back to its owner sources and generation record.

This discipline is useful now, before a canonical documentation system exists: connect the evidence, keep the meanings separate, and never let a machine result impersonate an owner decision.
