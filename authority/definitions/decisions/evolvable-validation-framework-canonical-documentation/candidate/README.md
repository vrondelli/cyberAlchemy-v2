# EVF Canonical-Documentation Candidate

Status: candidate; not canonical
Owner route: `CA2-ROUTE-DEFINITIONS`
Authority effect: none

This package proposes a single normative documentation source for the
Evolvable Validation Framework. The candidate is intentionally kept outside
`DEFINITIONS.md` and `specs/` until an owner decides whether EVF belongs in the
CyberAlchemy v2 definition authority, the promoted spec surface, DomainSpec v2
authority, or an explicitly related pair.

## Package

- [EVF.md](EVF.md) — canonical-documentation candidate with normative,
  plain-language, and domain-context voices, including representative tools
  for each evidence kind and the route from tool output to EVF observation.
- [source-manifest.json](source-manifest.json) — exact evidence snapshot.
- [validate.py](validate.py) — source-drift, posture, voice, tool-neutrality,
  link, and example consistency checks.

The synchronized implementation guide is
[../../../../../implementation/domainspec-v2/development/evolvable-validation-framework/COMPLETE-GUIDE.md](../../../../../implementation/domainspec-v2/development/evolvable-validation-framework/COMPLETE-GUIDE.md).
It is non-normative and must point back to this candidate.

## Promotion Route

1. Definitions-governance validates and reviews this candidate.
2. The DomainSpec v2 product owner decides meaning ownership and exact bytes.
3. If selected, the responsible owner admits the canonical kind and process
   origin required by `CAV2-D51`.
4. Only then is the exact selected document promoted and its lookup surface
   synchronized.

No step is implied by the presence or validation of this package.

## Open Questions

Open questions are owned by [EVF.md](EVF.md#open-questions).
