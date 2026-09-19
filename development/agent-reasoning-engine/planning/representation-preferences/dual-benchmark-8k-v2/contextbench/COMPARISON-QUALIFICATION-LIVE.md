# Exact tokenizer-only qualification invocation

The candidate invocation uses `run-comparison-qualification.mjs` with the exact manifest in `comparison-qualification-live-r1/FREEZE.json`. Its SHA-256 is `8d62634f694b4b60480145f5ad44c23d646ae00b749955759ba69bac60e9cdd5`. It binds 113 source/configuration/task files, including all R3 review bindings, the dedicated worker and local static import closure. The credential configuration is hash-bound; its contents are not copied into evidence.

The invocation verifies source hashes, static dependency closure, schedule and task identities, fixed ten-minute deadline and 2 GiB + 384 MiB storage reservation. Five disjoint fresh canonical paths hold outcomes, run journals, metadata, source worktrees and supervision. Fresh D:/WSL capacity checks precede directory creation. C: is excluded. The child uses storage R2 quotas and disables model dispatch. Returned failures and process settlement are retained in the guarded supervision report; absent child output remains incomplete evidence.

Independent review must bind the manifest digest and explicitly admit tokenizer-only execution before the command runs. This is a technical review within existing user authorization, not new permission for model generation. No evaluator is invoked. Hashes are rechecked after child settlement; source drift invalidates qualification while preserving returned evidence.

Commands from this directory:
```sh
node --experimental-vm-modules run-comparison-qualification.mjs check comparison-qualification-live-r1/FREEZE.json 8d62634f694b4b60480145f5ad44c23d646ae00b749955759ba69bac60e9cdd5
node --experimental-vm-modules run-comparison-qualification.mjs run comparison-qualification-live-r1/FREEZE.json 8d62634f694b4b60480145f5ad44c23d646ae00b749955759ba69bac60e9cdd5 comparison-qualification-live-r1/REVIEW.json
```

## Open Questions

Exact invocation review is pending. After execution, independently audit all twelve prompt/journal/receipt bindings and zero model calls before freezing production. Partial or failed qualification cannot establish quality or savings. Source worktrees may be cleaned after retained evidence is verified. Final production generation, native scoring and untouched confirmation remain required.
