# How CAV2 Authority Works — Declared vs Enforced (parent synthesis)

Dispatch `2026-06-25-cav2-authority-synthesis` · research · 2 agents (inventory cartographer ↔ spec-literalist) · final_approver: parent (P8-verified the spec cites below). Claim ≤ proof.

## The answer (what both agents + verified spec agree on)

cav2 authority is a **review-time classification system for deciding what may *count*** — not an engine, not an automatic pipeline.

1. **Authority = a permission to make something count, attached to an owner + scope.** It *"moves by owner route, not by proximity, usefulness, or repetition"* (`AUTHORITY-MODEL.md:25`, verbatim — **VERIFIED**). Anything that would change what cav2 may rely on must be routed to the **narrowest responsible owner** before it governs work (Narrowest Owner Rule, `:90`).
2. **Core flow is a review flow:** source evidence → import → inventory/ontology *candidate* → owner-routed local authority → implemented/validated → stable asset. Any state can be blocked / deferred / demoted / re-routed (`AUTHORITY-MODEL.md:31`).
3. **Structure:** nine **authority kinds** as a *closed enumeration* with a default-deny catch-all for anything unenumerated (D49), plus eight **postures** (allowed/blocked use). Governed by **seven Non-Collapse rules**, the load-bearing one being rule 2: *"Ontology can model authority, but it cannot decide authority."* (`:124`, verbatim — **VERIFIED**).
4. **Definitions** run CAV2-D1…D49 (contiguous). D41 = the Authority Model itself; D48 = Authority Promotion Lifecycle; D49 = Closed Authority-Kind Enumeration.
5. **Teeth, today:** `promotion-policy.md` is a 7-state ladder + 6 gates, but it is **candidate status with no validator**. Enforcement is **review-mode**; every deterministic scan is pending (OQ-1). The only live gate is human review.

## Where the inventory's narrative over-reaches the spec (the payload)

The inventory carries four *candidate* (non-promoted) syntheses. Reconciled against spec text, three headline claims drift past what is codified:

| Inventory headline | Verdict vs spec | What the spec actually says |
|---|---|---|
| **"CAV2 is a reflexive meta-authority *mold* (castings)"** | **NOT IN SPEC** — inventory-only framing | Spec says "governed structure" / "traffic map" (D41). Zero hits for `reflexive`/`meta-authority`/`mold` in `authority/`. The inventory itself flags this as *posture, not enforcement*. |
| **"No authority without a lifecycle" (invariant)** | **REJECTED, not merely absent** | Re-scoped *per review CR-1* because it *"re-skinned the Authority Rule"*; the narrower **D49 (closed-kind enumeration / default-deny)** was promoted in its place (`DEFINITIONS.md:3250`, `DEFINITION-DRIFT-AUDIT.md:155` — **VERIFIED**). The synthesis *title* outruns its own body, which records the re-scope. |
| **"Build-from-owned is already authority (D48)"** | **PARTIAL / overstated** | D48 exists and was promoted *via* a build-from-owned generalization inference (`:3187`); C17 derives from it. But D48's own boundary: naming the lifecycle *"does not enact a binding rule; the binding form is CAV2-D49."* Build-from-owned is the **method** D48 was promoted by, not a standing "already-authority" property. |

Two headlines **are** spec-codified verbatim: *authority = decision by owner route* (`:25`) and *ontology models but cannot decide* (`:124`).

## The through-line

**The enforced reality is narrower and more defensive than the narrative.** cav2 authority today = a review-mode, candidate-status, owner-routed *classification* model whose only live teeth are human review gates; all deterministic validators are pending. The inventory's grander framing (meta-authority mold, scientific-method lifecycle) is faithful as **description/aspiration** but claims more **enforcement** than the spec codifies.

Crucially this is **tracked candidate status, not sloppy drift**: the drift audit lives *inside* cav2, and the inventory cards carry the `candidate` flags. The one place a label genuinely outruns its content is the surviving synthesis title "no-authority-without-a-lifecycle" — spec rejected that exact phrasing.

## Sources
- Returns: `return-inventory.md`, `return-spec.md` (this folder)
- Spec (verified): `authority/AUTHORITY-MODEL.md:25,90,31,124`; `authority/definitions/DEFINITIONS.md` D41/D48/D49 (`:2627,:3182,:3245`); `authority/definitions/DEFINITION-DRIFT-AUDIT.md:145-157`; `authority/promotion-policy.md`; `authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md` (C17)
- Inventory: `.arcanum/inventory/entries/authority-ontology-governed-artifact-synthesis.md` + 3 sibling syntheses (all `status: candidate`)
