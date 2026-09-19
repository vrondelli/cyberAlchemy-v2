# Migration to 1.0

1. Replace package version `0.0.0-candidate.5` with `1.0.0`.
2. Replace current compiler/assurance schema identifiers ending in `-candidate` with their stable identifier shown by 1.0 output.
3. Import runtime APIs from `@domainspec-v2/cli/experimental/runtime`; the package root now contains stable compiler-product APIs only.
4. Run `domainspec-v2 capabilities`, then `domainspec-v2 doctor`.
5. Recompile, regenerate, and recertify from authored source. Candidate-era compiled graphs and certificates are intentionally not accepted as 1.0 artifacts.

Frozen predecessor foundation-contract files retain their original names and bytes. They are historical inputs, not 1.0 package output contracts.
