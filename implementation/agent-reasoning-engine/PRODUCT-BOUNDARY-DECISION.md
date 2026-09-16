# ARE successor product-boundary decision

Date: 2026-09-16

Option B was selected and applied. This packet records the product-property
decision and its verified result; it grants no product approval or effect
authority.

## Decision

`conversation-runtime` is the eighteenth required component, and
`are.gateway-backend-adapter/v1` is a supported product surface. Candidate 013
freezes the selected boundary at version
`0.10.0-signed-envelope-candidate.2`.

Candidate inspection and release verification pass with no reason codes. Its
source closure contains 3,410 files and 53,860,253 bytes. The isolated receipt
binds 156 test files, 1,244 passing cases, 26 owned suites, and a passing
failure-learning canary.

## Verified evidence

- The selected 18 required components pass their directly owned suites.
- All six required integrations now have directly owned suites.
- The isolated closure plan passes 1,244/1,244 cases across 156 files and 26
  suites.
- The persistent gateway accepts the default Codex backend and a validated
  model-neutral JSON-lines process adapter through the same continuity
  protocol.
- `conversation-runtime` passes its four test files and 13 cases inside the
  supported release closure.
- Candidate 012 remains immutable as historical evidence; Candidate 013 passes
  current-source inspection and release verification.

## Option A: retain the current boundary

Keep the 17 components in `product.json`. The backend adapter remains an
exported, tested implementation inside `codex-app-server-wrapper`, while
`conversation-runtime` remains an undeclared package.

The successor candidate would claim the gateway, Codex compatibility, and the
existing product components. It would not claim the conversation runtime or a
general agent-facing adapter surface as required product behavior.

This option changes no product property. The next executable step is to freeze
and verify the successor candidate.

## Option B: declare the general conversation and agent boundary

Make these product-property changes before freezing:

1. Add `conversation-runtime` as the eighteenth required component in
   `product.json`.
2. Add a product entrypoint/reference for the gateway backend-adapter contract,
   whose existing public exports are `validateGatewayBackendAdapter`,
   `spawnGatewayBackend`, `createCodexGatewayBackendAdapter`, and
   `createJsonLineProcessBackendAdapter`.
3. Document the supported contract as JSON-RPC 2.0 over JSON lines with the
   existing process-transport validation and unchanged authority ceiling.
4. Include the conversation runtime's four test files in the generated product
   test plan and successor receipt.

This option makes the release surface match the implemented general-agent and
conversation-continuity behavior. It does not add a hosted endpoint, browser
adapter, deployment, provider credential, effect authority, or MCP adapter.

## Recommendation

Select Option B. The product objective is reusable continuity for people and
agents, and both implementation surfaces already exist and pass their focused
tests. Leaving them undeclared would make the release boundary narrower than
the behavior being prepared for release.

Keep the objective-language resolver conservative for this candidate. Its
12/20 resolutions plus 8/20 safe deferrals are an explicit limitation;
broadening intent behavior is a separate product-property change and lacks a
held-out qualification result.

## Work after the decision

For Option A, freeze the current closure and run release verification.

Option B construction, isolated testing, freezing, inspection, and release
verification are complete. Commit, tag, push, publication, activation, product
approval, and deployment remain separate owner actions.

Candidate 013 also freezes the exact sibling DomainSpec compiler distribution
used by the isolated run, plus the Alch compiler's ignored `dist` output and
pinned TypeScript runtime. Their hashes are evidence, not a commit of the
sibling repository or installed dependencies. Publication must materialize
those 1,769 content-addressed files or freeze a successor against committed or
package-locked compiler inputs.

## Open Questions

- Which owner will review and approve Candidate 013 for the next lifecycle
  stage?
- Will publication materialize Candidate 013's 1,769 frozen workspace inputs,
  or use a successor bound to committed/package-locked compiler inputs?
