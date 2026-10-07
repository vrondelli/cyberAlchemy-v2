# Test the acceptance-decision slice locally

From `/home/vlad_/projects/cyberAlchemy-v2`:

```sh
cd language/capabilities/alchlang/plans/general-compiler-v1/implementation
node scripts/run-toolchain.mjs tsx --test test/formal-claim-lowering.test.ts test/formal-claim-v2-projection.test.ts
node scripts/run-toolchain.mjs tsc --noEmit
```

The first command should pass 18 tests. It exercises positive lowering,
schema conformance, rejected/wrong-owner/wrong-subject/legacy decisions, and
the v3 identity version in the v2 compatibility projection. It also separates
stale decision bytes, an interpretation change without a fresh decision, and
an acceptance-only reissue that preserves claim identity but changes exact
projection bytes.
The second checks TypeScript. These tests use synthetic fixture decisions, not
an authenticated owner action or a production approval.

The DomainSpec candidate contract and semantic fixtures can be inspected with:

```sh
cd /home/vlad_/projects/cyberAlchemy-v2
node craft/projects/domainspec-v2/formalization/validate.mjs | jq '{status,blockers,checks:[.checks[]|select(.check_id=="DSF-V045" or .check_id=="DSF-V052")|{check_id,status,detail}]}'
```

DSF-V045 and DSF-V052 should pass. Overall status currently remains `block`
because DSF-V008/053 require deferred provenance repair. The local command
does not change repository data or claim runtime guarantees.

To test the independent W3-04 publication and failure diagnostics locally:

```sh
cd /home/vlad_/projects/cyberAlchemy-v2/craft/projects/domainspec-v2/impl/cli
node --import tsx --test --test-name-pattern='certification publication|post-rename target replacement|failed certification|retained-stage inspection|certify-check retains' test/assurance/certify.test.ts
```

The eight selected tests should pass without Lean. Running the entire test file
also invokes two pinned-Lean certification tests; they fail with
`MTCLI_CERTIFY_LEAN_UNAVAILABLE` when Lean is not installed. A failed
certification intentionally retains its staging tree for separate inspection;
`certify-check` also retains its temporary proof tree. Follow
[the candidate retention procedure](CERTIFICATION-STAGING-RETENTION.md), not a
pathname-only deletion.

To exercise the restored optional Alch module adapter without changing ARE's
active native adapter:

```sh
cd /home/vlad_/projects/cyberAlchemy-v2
node --test implementation/agent-reasoning-engine/packages/module-port/test/*.test.mjs
node language/capabilities/alchlang/plans/general-compiler-v1/implementation/scripts/run-toolchain.mjs tsx --test language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/module-configuration.test.ts
```

These currently pass 19 and 4 tests respectively. The broader AlchLang suite
remains red on separate E03/E04/E05 exact qualification bindings; this local
adapter check does not establish those qualifications or runtime guarantees.

## Open Questions

- How will owner-issued decisions be authenticated and admitted outside the
  local candidate contract?
- When will F5's execution request/receipt freshness contract be completed?
