# Exact integration envelope (proposal only)

Base: private origin/master at `9832ee36c5332be825ff065fb8cff05b23b2fd81`.
Proposed tree: `2a7cae033b34b65fbf29024ae8538e93f5835257`.
Patch SHA256: `dd0054692ae405a434deb1c4c45e5abf1cd6d153d045192591bdb347f28bc496`.
File allowlist and per-file before/after SHA256: integration-scope.json (36 CLI paths).

The candidate's only difference from accepted DSV2-CLI-SUCCESSOR-002 is the test-command correction in package.json. Runtime and all other package files are byte-identical. That changes the accepted archive digest, so the correction requires its own product acceptance before requesting execution authority.

After that acceptance, the proposed operational envelope is one local commit on `codex/domainspec-cli-release-1.0.0` using this exact staged tree, followed by a separately authorized push of that branch to the existing private origin and dispatch of `.github/workflows/domainspec-v2-product.yml` on that branch. No master update, PR publication, tag, npm publish, GitHub release, repository visibility change or submodule update is included. A branch push alone does not trigger this workflow because push is filtered to master; workflow_dispatch is required for the proposed branch route.

Proposed commit message: `feat(domainspec): integrate CLI successor and complete product test coverage`.

Before execution: reconcile the accepted product delta and patch hashes, fetch fresh origin/master, verify the selected base is still current and verify the isolated staging area contains exactly the 36-path allowlist. Changed remote base or source bytes require a fresh rehearsal, not an automatic replay claim. The current working checkout and frozen acceptance records remain untouched.

Hosted completion means both verify-product and qualify-recipe passed for the exact resulting commit, artifact hashes were checked, and the formal bundle's verifier passed against that same commit. These outcomes are currently not_evaluable because no successor commit exists. A later release decision is separate.
