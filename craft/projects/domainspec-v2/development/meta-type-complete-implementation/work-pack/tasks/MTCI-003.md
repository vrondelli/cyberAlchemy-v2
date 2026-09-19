# MTCI-003 — Canonical DS-D1 Assets

Owner route: definitions-governance plus bounded Task Session mutation. Status: ineligible until MTCI-002 admits.

## Outcome

Add the admitted canonical registry/card entry, executable criterion schema and companion card, positive/negative fixtures, relationship signatures if approved, and content/generation validator coverage.

## Candidate write scope

- `projects/domainspec-v2/definitions/meta-types/meta-types.yml`;
- `projects/domainspec-v2/definitions/meta-types/meta-types.md`;
- one new `projects/domainspec-v2/impl/spec/meta-types/<category>/<slug>.schema.yml` and companion `.md`;
- bounded fixtures under `projects/domainspec-v2/impl/spec/__fixtures__/mt/`;
- exact relationship registry/test files named by the MTCI-002 receipt;
- exact content-validator/generated-instance tests named during admission.

Anything else requires Invoke Refresh and scope approval.

## Validation

Run schema/card fixtures, exact positive/negative validator tests, generated-instance round trip, relationship signature validation, existing meta-type baselines, `npm run validate:content`, `npm run tools:test`, `npm run instances:generate`, and `npm run instances:validate` after live command discovery confirms them. Record exact versions and outputs.

## Acceptance

Canonical identity and criterion agree; fixtures discriminate; no stable ID is reused; existing types and packs do not regress; all canonical changes trace to the owner receipt. This is G1 canonical validation, not language implementation.

