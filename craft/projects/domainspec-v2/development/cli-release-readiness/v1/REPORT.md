# CLI 1.0.0 release readiness

**HOLD: locally tested candidate, not ready for publication under the current configuration.** BTE comparison is deferred and is not a release prerequisite.

Selected package: `@domainspec-v2/cli@1.0.0`, source commit `cd1ec3272ba782d975691149c5ce28d8f61e5756`, archive SHA-256 `8587a0355c39878264935ef4e824ff80266383690e82c756f8216af48a5c194a`.

## Verified now

The frozen bundle's offline verifier passed all 44 checks. An isolated extraction passed CLI --help and root API import/compileProject availability checks. The archive has 248 regular files, no traversal paths, no declared runtime npm dependencies and no install hooks. This is not a full security assessment or a fresh rerun of the accepted compiler test suite. In particular, no comprehensive vulnerability or secret scan, registry installation, or publisher-permission verification was performed.

## Release findings

| Finding | State | Required next step |
| --- | --- | --- |
| Exact-commit hosted verification | not_evaluable | GitHub's product-workflow query returned zero runs for the selected commit. Obtain and inspect passing hosted product/qualification evidence for the exact release source. No workflow was dispatched. |
| npm provenance configuration | BLOCK for the configured npm provenance path | Archive requests restricted access and provenance=true, has no repository metadata, and source repository is PRIVATE. Select a private distribution/signing approach compatible with that boundary, or separately design a public extraction. Do not expose the private repository to satisfy tooling. |
| Release source selection | BLOCK for release from current working directory | CLI has modified and untracked work beyond the frozen candidate, including generation/composition changes. Use the approved archive as the baseline, or select a new exact candidate and repeat affected testing/review/approval. |
| Distribution terms and destination | not_evaluable | Archive has no license field or license file. Explicitly select recipient scope, registry/channel, distribution terms and publisher identity. This is a missing release-package decision, not a claim that private distribution is legally prohibited. |
| Registry ownership and version availability | not_evaluable | Target registry/account were not selected or authenticated for this check. Do not assume 1.0.0 is available or that publication rights exist. |

The npm documentation requires public matching repository metadata and a supported hosted build for provenance. See [npm provenance requirements](https://docs.npmjs.com/generating-provenance-statements/) and [trusted publishing limitations](https://docs.npmjs.com/trusted-publishers/). Those requirements do not make the source repository public or authorize a public/private crossing.

The three latest product-workflow runs observed during the check were failures at commits 9832ee36 and 9afdfad3, and a success at 06951ac5. None establishes the selected commit's readiness. The exact query result is retained in hosted-exact.json; earlier failures were not diagnosed in this assessment.

## Supported scope

The package declares Linux x64, Node 26.8.1 and npm 11.19.0. Its experimental runtime is outside the stable compatibility/security promise. Generated deployment recipes require environment-specific review and do not establish safe production deployment. No all-platform or arbitrary-generated-application security claim follows from these checks.

## Next bounded work

Operational support frontier: release owner selects private distribution channel, signing/provenance policy and package terms; compiler owner selects the exact source candidate. Then prepare any necessary packaging changes in an isolated successor, rerun affected tests and review, and obtain hosted evidence for that exact commit. A changed package needs a successor approval; the accepted archive is preserved.

Product construction: the previously accepted local compiler scope remains accepted. No new compiler behavior was selected here. BTE and UI remain deferred. Publication itself still needs an exact authorization naming the artifact, destination and access level.
