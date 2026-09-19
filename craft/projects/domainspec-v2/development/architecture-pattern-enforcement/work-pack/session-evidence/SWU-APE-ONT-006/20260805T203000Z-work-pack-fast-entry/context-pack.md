# Context Pack — SWU-APE-ONT-006

Status: strict / task-ready

## Objective

Add the generic Enum composition graph to the candidate implementation-conformance
ontology before any language profile admits a composable representation.

## Selected contract

- Model the canonical-bound root as architecture.EnumImplementation.
- Model internal implementation pieces as non-canonical
  architecture.EnumRepresentationUnit evidence objects.
- Model composition with directed, acyclic, provenance-bearing
  architecture.composed_from relations.
- Observe leaf {key, value} member facts and derive normalized root values
  from the total set of exact input fact IDs.
- Block duplicate keys, duplicate values, repeated diamond contributions,
  cycles, unresolved components, incomplete derivations, and missing
  relation/member provenance.
- Record the TypeScript owned const-object protocol as unmaterialized;
  admitted forms and active representation constraints remain empty.

## Boundary

This unit may change only the ontology experiment, its Enum profile/fixtures,
and its validators. It may not implement the TypeScript runtime provider or
adapter, activate the TypeScript profile, change canonical DS-D1 meaning,
promote authority, publish, deploy, or release.

## Acceptance

The focused profile, provenance, and composition runners and the full ontology
validator must pass twice with deterministic output under Node 22.13.0.

