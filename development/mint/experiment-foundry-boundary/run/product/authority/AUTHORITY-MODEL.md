<!--
  RUN OUTPUT — mint-act output for the `product` (API-contract governance) domain.
  Hand-instantiated from templates/authority-model.md by the SWU-3 emit procedure. Mint-act
  output state (criterion §5) = the commit including authority/decisions/2026-06-29-mint.md.

  INTEGRITY RULE (load-bearing): the kinds below are the domain's NATURAL kinds — what an
  API-versioning/compatibility/deprecation authority actually needs. They were NOT chosen to
  pass Obs-A. F3(c) is applied HONESTLY per row; where a natural kind is contestable as a
  re-skin, it is reported as contestable, not laundered into a clean claim.
-->

# Authority Model

Status: active local authority model
Owner: API-contract governance owner

## Purpose

This model decides what this standalone repository is allowed to claim while it
**governs the versioning, backward/forward compatibility, and deprecation of a published API
contract surface** — the public commitments a consuming integrator may rely on.

The model deliberately separates:

- the **published API contract** primary source (what the schema/OpenAPI/proto says about
  itself — its declared types, endpoints, fields, version);
- **repository-local method authority** — owned by *this repo's own* constitution
  (`constitutions/API-CONTRACT-CONSTITUTION.md`), NOT by any external framework;
- external evidence (consumer telemetry, integration breakage reports, standards corpora);
- local synthesis (a maintainer's reading of whether a diff breaks a consumer);
- policy or implementation authority, which this repo does not own (the org's API policy and
  the server implementation live elsewhere).

> **Localization invariant (Obs-B, the precedent's leak — stripped).** Method authority
> (source posture, promotion discipline, non-collapse rules, authority separation) is owned
> **locally** by this repo's constitution + this model. **No external framework (including
> CyberAlchemy v2) is named as the method authority.** CyberAlchemy v2 appears ONLY as
> **harvested precedent (supporting source)** in `source-spine.md` — cited for provenance,
> never on a resolution path. This is the emit-time state; it does not require a later owner
> decision to become true.

## Core Rule

This repo can rule whether a change is compatible, bind a deprecation schedule, and define the
contract surface. This repo cannot ship the API change or force a consumer migration: shipping
crosses an **external owner decision** (the platform/release owner), and only after the change's
compatibility ruling and any bound deprecation schedule are satisfied.

## Authority Kinds

<!--
  These are the domain's NATURAL kinds. F3(c) applied honestly per row.
  cav2 D49 rows: Definition · Constitution · Discipline · Decision · Spec · Runtime contract ·
  Projection · Evidence · Residue (+ closure catch-all).
-->

| Kind | Counts as | Owner route | Blocked use | F3(c) honest self-read |
| --- | --- | --- | --- | --- |
| Primary source | What the published API contract says about itself (schema, OpenAPI/proto, declared version). | The contract-registry / schema source. | Treating a maintainer's reading as the contract's own declaration. | **CONTESTABLE / ~Evidence** — a source specialization; Evidence function. Not a clean new owner route. |
| **Compatibility ruling** ⟵ *domain-originated (PROPOSED; owner-ratify)* | A standing predicate that decides whether a proposed contract change **preserves** an existing contract (breaking / non-breaking / forward-compatible), binding what migration burden falls on consumers. | **`compatibility-governance`** *(authors and maintains the compat predicate over contract diffs)*. | **Default-deny: a compatibility ruling may NOT itself ship the change, waive a deprecation schedule, or be self-asserted by the change author.** | **CONTESTABLE — likely ~Decision-subtype.** It is a *standing predicate over diffs* rather than a one-off `decision-gate` choice, which is the argument for new-owner-route. But "is this change allowed" is close to cav2's `Decision` function. Not a clean win; reported as contestable. |
| **Deprecation schedule** ⟵ *domain-originated (PROPOSED; owner-ratify)* | A **binding temporal sunset commitment**: a contract element is marked deprecated at T0, warns until T1, and is removed at T2 — a *future-dated, time-indexed obligation* the repo is bound to honor and a consumer may rely on. | **`lifecycle-scheduling`** *(authors and maintains time-indexed sunset commitments; enforces that a removal cannot precede its scheduled T2)*. | **Default-deny: a deprecation schedule may NOT be shortened for an element already in its warn window, and a removal may NOT fire before its scheduled T2.** | **DEFENSIBLY NEW (PASSES F3(c)).** A *temporal commitment* object: it carries a future-dated obligation indexed by time, with its own owner route `lifecycle-scheduling`. **cav2 has NO schedule/timeline/temporal-commitment kind** — not lexically (no "schedule" row) AND not owner-route (no cav2 owner governs time-indexed sunset obligations; `decision-gate` rules a point choice, not a binding future timeline). Both lexically AND owner-route new. |
| **Contract surface** ⟵ *domain-originated (PROPOSED; owner-ratify)* | The governed boundary of public commitment: the exact set of types/endpoints/fields that ARE the promise (vs internal surface that is not). | **`surface-governance`** *(authors what is in/out of the public-commitment boundary)*. | **Default-deny: a contract surface may NOT be expanded to cover an element a consumer was never promised, nor silently shrunk to drop a promised one without a deprecation schedule.** | **CONTESTABLE — likely ~Spec-specialization.** A declared boundary of commitments is close to cav2's `Spec` kind. The argument for new is that it governs the *boundary membership* (in/out), not the spec content; weak. Reported as contestable. |
| Related evidence | Consumer telemetry, integration breakage reports, API-versioning standards corpora. | Relevant evidence/telemetry route. | Treating one consumer's breakage as a general compatibility rule. | **RE-SKIN** — cav2 **Evidence**. |
| Local synthesis | A maintainer's repo-authored reading of whether a diff breaks a consumer. | API-contract maintainer review. | Becoming policy by proximity; standing in for a compatibility ruling. | **CONTESTABLE / ~Evidence** — local-inference Evidence. |
| Candidate compat rule | A proposed compatibility condition that should hold for a contract class. | Closure plan + validation (witness on a real diff) route. | Becoming a bound rule before witness and owner ratification. | **CONTESTABLE / ~Definition** — a proposed condition; overlaps the `invariant-as-Definition` treatment. |
| Workflow witness | A concrete past contract change that can test a candidate compat rule. | Evidence harness / validation route. | Being treated as general proof from one change. | **RE-SKIN** — cav2 **Evidence**. |
| External policy authority | The org's API policy, regulatory API constraints, the server implementation's own contracts. | The org API-policy + platform owner route. | This repo cannot exercise it directly; it proposes, the org decides. | **OUT-OF-SCOPE** — pointer to a foreign owner. |

> **D49 owner-gate (SPEC §Boundaries).** The bold rows above are **proposed** by the mint; the
> API-contract governance owner **ratifies** them. They are this repo's OWN domain-local kinds
> table — NOT a change to cav2's closed D49 enumeration. Seeded from cav2's table format,
> owner-authored thereafter (seed, don't bind).
>
> **HONEST OBS-A RESULT FOR THIS DOMAIN: at least one kind is domain-originated under F3(c).**
> **Deprecation schedule** (owner route `lifecycle-scheduling`, a binding temporal-commitment
> object) is both lexically AND owner-route new — cav2 has no schedule/timeline kind and no
> owner governing time-indexed sunset obligations. Compatibility ruling and Contract surface
> are reported as CONTESTABLE (likely Decision- and Spec-specializations); the Obs-A verdict
> rides on the uncontested Deprecation-schedule row, exactly as the instantiation's Lakatos
> validity-check anticipated.

## Source Movement

```text
published contract (schema / OpenAPI / proto + declared version)
  -> source record (captured, dated, kind-labeled)
  -> contract diff (proposed change vs current surface)
  -> compatibility ruling (breaking / non-breaking / forward-compatible)
  -> [if breaking] deprecation schedule bound (T0 deprecate / T1 warn / T2 remove)
  -> candidate compat rule or workflow witness
  -> validation request (does this ruling match real consumer breakage?)
  -> external owner decision (ship / hold the contract change)
```

No arrow is automatic. A change can be blocked, re-ruled breaking on new evidence, split, or
sent back for a deprecation schedule before it may proceed.

## Non-Collapse Rules

1. A **declared** version bump (semver label) is not a **ruled** compatibility verdict.
   (Authors mislabel; compatibility is ruled by `compatibility-governance`, not from the
   version string.)
2. A passing compatibility ruling is not a ship. (A ruling is necessary, not sufficient; the
   ship is the external owner decision.)
3. A deprecation **announcement** is not a deprecation **schedule**. (A schedule is a binding
   time-indexed commitment with T0/T1/T2; an announcement with no bound removal date is not.)
4. A maintainer's breakage reading (local synthesis) is not a compatibility ruling.
5. The **contract surface** (what is promised) is not the **implementation surface** (what
   happens to exist). Removing an unpromised internal field is not a breaking change.
N. **Harvested external method precedent (incl. CyberAlchemy v2) supports API-contract
   credibility — it is NOT final API-contract correctness, and it holds NO authority over
   API-contract decisions.** *(Obs-B non-collapse rule — forbids the precedent's leak at the
   rule level.)*

## Gate Vocabulary

- `pass`: evidence, source kind, owner route, and validation surface are adequate for the next
  move.
- `flag`: work may continue with named risk and follow-up.
- `block`: stop until a source, authority, witness, or boundary gap closes.
- `defer`: not rejected, but the route or timing is not ready.
