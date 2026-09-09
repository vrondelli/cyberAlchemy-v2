# Research — Presheaf / Vect / Yoneda / Residue: CAV2 Authority Implications

Dispatch: `2026-06-21-presheaf-vect-yoneda-residue-cav2-implications`, lane B.
Three explorer returns recorded VERBATIM below. Synthesis lives in `findings.md`.

Claims under examination:

- (a) presheaf-in-Vect — the V-valued (Vect-enriched) presheaf embedding.
- (b) hallucination/residue governance — representability detects a faithfulness/commitment failure (`IsRepresentable(Δ.op ⋙ yoneda.obj I)`).
- (c) schema-instance independence — the formal lattice/poset decoupling of schema and instance axes.
- (d) geometric-orthogonality — the perpendicular-embeddings reading of semantic independence.

---

## Simon (definitions)

(b) already-owned via CAV2-D18 Residue (DEFINITIONS.md:790-871) + CAV2-D23 Authority Lifecycle Axis (DEFINITIONS.md:1286-1346) — D23 owns commitment-vs-evidence split; the IsRepresentable test detects a commitment-level failure. (c) already-owned via CAV2-D22 Orthogonal Classification (DEFINITIONS.md:1207-1284). (c)-vs-D22: OVERLAPPING not identical — shared concept (axis independence, no silent coupling) but different altitude: (c)=categorical/formal poset-lattice layer, D22=governance/ontology layer; D22 owns the governance rule, (c) owns the formal proof (S2VsS3Counter.lean:158) that schema-instance axes satisfy it. Net-new DEFINITION candidate: "Representability Witness" / Presheaf Faithfulness Detector — formal criterion distinguishing representable (true) vs non-representable (hallucinating) presheaf embeddings via Δ.op ⋙ yoneda.obj I; net-new because CAV2-D18 owns the remainder structure but not the formal witness, CAV2-D23 owns commitment/evidence split but not the categorical test. Proposed home CAV2-D28 or instance-residue witness module. KEYSTONE: D23+D18+D22 jointly own (b)(c) governance, but the formal representability test cementing (b) has no CAV2 definition yet. COLLAPSE: if BACKLOG H-8 already contains a complete no-sorry Lean formalization of IsRepresentable(Δ.op ⋙ yoneda.obj I), the witness is already-deployed not net-new.

---

## Tarski (constitutions/axioms)

(c) does NOT imply a net-new rule that doesn't already exist: ALREADY-OWNED by CAV2-D16 Typed Coupling Invariant (DEFINITIONS.md:644-711 — must record typed relation R(A,B) when A,B cannot vary independently; (c) proves schema/instance CAN vary independently, so no coupling invariant needed) + CAV2-D22 Orthogonal Classification (DEFINITIONS.md:1207-1285). No collision — (c) validates existing rules. No "two-budget/conservation-law" rule is grounded by (c) alone (it is structural poset independence, not measure-theoretic). (b) implies a NET-NEW constitution rule: a Representability-Grounded Promotion Gate. Existing partial coverage: CAV2-C3 Research Before Specification (STABLE-REPOSITORY-CONSTITUTION.md:52-66), CAV2-C9 Validation Before Implementation (:146-159), CAV2-D5 Promotion Gate (DEFINITIONS.md:185-221) — none mandates a representability test. Draft rule: claims/schemas/definitions/ontology-nodes promotable from research into spec/impl authority only when they pass a representability/faithfulness round-trip test; for presheaf-valued claims the test is IsRepresentable(Δ.op ⋙ yoneda.obj I); failure gates to residue/open-question, not auto-block. No collision; complements C3/C9. (a) NO rule (build-from-owned), (d) NO rule (metaphor). KEYSTONE: representability must become an explicit constitution-level admission gate, grounded by (b), not yet explicitly named (only structurally implied by C3/C9). COLLAPSE: if a governance review chooses to leave representability optional rather than blocking, the keystone is falsified (rule stays implicit).

---

## Lawvere (proof-justification / grounding discipline)

RULING: (a) presheaf-in-Vect = GROUNDED externally (Kelly 1982 §4-5 owns V-valued adjoint triple; DomainSpec.lean:105-147 proves Set case no-sorry); residue = Vect Lean encoding not yet written = DEPLOYMENT gap NOT grounding gap; verdict GO/build-from-owned. (b) GROUNDED (M2Counter.lean:54 no-sorry; sharpened categorical existential; cementing test IsRepresentable BACKLOG H-8 open=work not absence); GO. (c) GROUNDED (M6Counter.lean:125 + S2VsS3Counter.lean:158 both no-sorry; lattice decoupling not categorical orthogonality); GO/renamed. (d) NOT GROUNDED in framework: formal notion owned externally (Freyd-Kelly 1972 LNM76, Kelly §5.5 enriched orthogonality) but the perpendicular-embeddings=semantic-independence reading is metaphor (findings line 22), no deployed theorem in domainspec-core; verdict: promote the formal notion as build-from-owned, DEMOTE the in-framework reading to metaphor NOT authority. Policy: CAV2-C1 Source-Ledgered Consolidation requires labeling claims as synthesis/inference/open-question — (d) must be re-labeled metaphor; CAV2-C3 Research Before Specification — (b)(c) pass the gate, (d) stays research-only. For AUTHORITY PROMOTION purposes: only (b) and (c) are deployed theorems that may ground a CAV2 rule; (a) grounds nothing CAV2-side beyond a build-from-owned note; (d)'s framework reading must NOT be promoted. COLLAPSE: if sibling AsymmetricTowerVEnriched.lean already proves the V-enriched triple no-sorry, (a) is already-deployed (trust-but-verify before rebuild).
