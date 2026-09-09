# Authority and applicability policy v1

- **Owner:** `human-project-gatekeeper@local`
- **Authority basis:** explicit D1 selection in
  [`ENGINE-CLOSURE-GATE.md`](../ENGINE-CLOSURE-GATE.md)
- **Version:** `1.0.0`
- **Status:** effective; owner/boundary review passed
- **Effective time:** `2026-07-22T13:40:22-03:00`
- **Selector:** every fresh or current-revalidation invocation of
  `semantic-judgment-evaluator@1`
- **Revision route:** reopen D1 through `decision-gate` under the accountable
  human project gatekeeper or an explicitly recorded successor
- **Gate references:** `DEC-ARE-G6-SCHEMA-SELECTION`, `G-ARE-POLICY`,
  `BLK-ARE-APP-001`
- **Boundary review:**
  [`TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md`](session-evidence/TASK-ARE-READINESS-001-BOUNDARY-REVIEW.md)

## Rules

1. Applicability and exceptions use only explicit catalog selectors and
   deterministic predicates.
2. Missing mandatory evidence returns `Deferred.Insufficient`.
3. No registered conclusion-domain rule returns `OutOfDomain`.
4. Missing, circular, or self-appointed authority returns `EscalateOwner`.
5. Precedence uses only explicit directed edges in the selected catalog policy.
   File order, rule order, specificity, model judgment, or agent consensus
   creates no precedence. A precedence cycle or unresolved applicable-rule
   conflict returns `EscalateOwner`.
6. A fresh catalog is temporally usable only when its status is `active`, its
   revocation field is absent, and either `expires_at` is absent or
   `as_of < expires_at`. At equality the catalog is expired.
7. A syntactically invalid or missing required time value returns
   `InvalidInput`. A well-formed snapshot whose authority, catalog, or temporal
   policy cannot establish currentness returns `EscalateOwner`.
8. An expired or revoked catalog returns `UnauthorizedCatalog` during fresh
   evaluation and `Invalidated` during current revalidation.
9. No result produced by this policy is permission to act.

## Examples

- A refund rule explicitly selecting amounts below 100 matches an amount of 80
  when every mandatory fact exists.
- A missing purchase date returns `Deferred.Insufficient`.
- A refund catalog signed only by the evaluating agent returns
  `EscalateOwner`.
- Two applicable rules connected by an explicit acyclic precedence edge use
  that edge; the same rules with a precedence cycle return `EscalateOwner`.
- A catalog evaluated exactly at `expires_at` is expired. A malformed timestamp
  returns `InvalidInput`; unresolved currentness returns `EscalateOwner`.
- A revoked catalog returns `UnauthorizedCatalog`; discovering the revocation
  in a later run returns `Invalidated` without changing history.

## G6 boundary

This policy uses only the bounded run-02 intent-schema admission. It neither
admits run-01 nor promotes a schema, definition, or reasoning-engine claim.
