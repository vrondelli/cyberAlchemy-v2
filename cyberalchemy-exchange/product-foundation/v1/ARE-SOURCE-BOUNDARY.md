# ARE source and sale boundary

Status: candidate source map for the separately sold ARE offering. Owner: ARE product/release owners.
Machine record: [are-source-boundary.json](are-source-boundary.json).

| Source area | Current responsibility |
| --- | --- |
| [agent-reasoning-engine](../../../agent-reasoning-engine/README.md) | Product identity, capability, business ontology and authored/compiled model |
| [development/agent-reasoning-engine](../../../development/agent-reasoning-engine/README.md) | Research, designs, specifications, decisions and historical evidence |
| [implementation/agent-reasoning-engine](../../../implementation/agent-reasoning-engine/README.md) | Working runtime, packages, CLI and tested implementation candidates |

These are explicitly linked by their own entry documents. They form one ARE source
landscape; the development workspace is not the whole product, and the runtime
folder alone is not a verified release package.

## Selected editions and consolidation

The owner selected **ARE Static**, without the improvements engine, and **ARE Full**,
with it. Both are editions of one ARE product. The dispersed source directories
will be consolidated later; this is recorded direction, not a completed merge.

The [evolution runtime](../../../implementation/agent-reasoning-engine/packages/evolution-runtime/README.md)
documents the existing improvement loop and is a candidate source for identifying
the edition boundary. Its dependencies must be inspected before deciding what to
extract. Static does not automatically mean stateless reasoning or exclusion of
ordinary context updates. Update/support and edition-upgrade entitlements remain
unselected. Full does not promise automatic adoption or successful improvements.

## Wider declared source closure

The [runtime product profile](../../../implementation/agent-reasoning-engine/product.json)
declares these candidate source roots:

- `cyberAlchemy-v2/agent-routing/capabilities/are-cli`
- `cyberAlchemy-v2/implementation/agent-reasoning-engine`
- `cyberAlchemy-v2/implementation/define-cli`
- `cyberAlchemy-v2/agent-reasoning-engine`
- `cyberAlchemy-v2/ontology/product`
- `cyberAlchemy-v2/capability`
- `cyberAlchemy-v2/development/agent-reasoning-engine`
- `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-cutover-v1`
- `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-packaged-verifier-v1`
- `cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-signed-envelope-v1`

This is a source/candidate declaration, not a conclusion that every byte in every
root should be delivered to a buyer. The profile excludes evidence, receipts,
planning, runs, runtime state, dependencies and build output from its candidate
closure. Required runtime imports, optional integrations, source build dependencies
and validation-only inputs still need classification before extraction.

## Release questions exposed by the map

The runtime product version is `0.10.0-signed-envelope-candidate.1`; the npm package version is `0.6.0-coding-agent-l2-candidate.1`.
Both are recorded without assuming they describe the same release. The sale needs
one exact version identity, supported component set, installation requirements,
license/update terms and a reproducible clean-environment acceptance check.

ARE is selected for separate sale. That does not decide whether Lab also contains
particular ARE components, nor automatically grant hosting or model access with
an ARE purchase. Package entitlements must say so explicitly.

No ARE source was moved, renamed or changed by this inventory. Historical evidence
retains its original scope. The catalog points to the whole source landscape while
leaving the actual distributable boundary unverified.

## Open Questions

[Q16, Q19 and Q20](OPEN-QUESTIONS.md) own package contents and the exact independent ARE
release closure. The Exchange ontology describes what is offered; ARE retains
ownership of its product meaning and implementation.
