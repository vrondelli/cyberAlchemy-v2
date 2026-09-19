role=explorer-turing-feedback  
status=pass

## Immutable checkout binding

- Repository root: `/home/vrondelli/projects/domainspec-core`
- Git `HEAD`: `2f95b14d0d1006a35a7828b1bcf70106c6e11578`
- Checkout state: dirty.
- All bindings below therefore identify the exact observed working-tree bytes by SHA-256. The commit identifies their checkout context, but it is not claimed to contain modified or untracked bytes.
- Material exception:
  - `projects/domainspec-v2/development/architecture-realization-compiler/` is untracked.
  - `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json` is tracked but modified.
- No private rule implementation is reproduced.

## Immutable artifact bindings

### Engine and executable tests — closed

| Artifact | SHA-256 | Commit posture |
|---|---|---|
| `projects/domainspec-v2/impl/package.json` | `d1c3d51ad7b5552141a84d7642a743f35cfe1d2142c55ca67b9ed5552ae555a3` | tracked, unchanged |
| `projects/domainspec-v2/impl/test-derivation-engine/package.json` | `3170bfa13b3a019c62594df034c8389030d7114f59fc5ecbafd07f17be4e8f26` | tracked, unchanged |
| `projects/domainspec-v2/impl/test-derivation-engine/README.md` | `03284fe696d2bf982156a8892300438f0a44fa06cc032265773a73682162b26e` | tracked, unchanged |
| `.../src/emit/tests.test.ts` | `5c866246df25e314de280258b56a58ad5c173a25c1fbd33b6e2aa0d674b3a8d0` | tracked, unchanged |
| `.../src/index.test.ts` | `b61d6b2929cfeb0955b0c246b454ed4ca452167934d5a611a91a332552f1c23f` | tracked, unchanged |
| `.../src/roundtrip/negative-control.test.ts` | `f8b6702f420f1595c3bbccf9491f826e307ed94c08281e52ae8b81aab32c5802` | tracked, unchanged |
| `.../src/minted-project/conformance.test.ts` | `35f4ab6745530adeb86b965e2f5750a494be2cb289fd25fc231f26c29954321d` | tracked, unchanged |
| `.../SWU-BTE-L0A-REPAIR-001/20260723T100352Z-exact-byte-repair/execution-receipt.json` | `5679b5408aa3a70edc9dc2621ad68100deb8dfab1e3351fa2594d9ee6c28d51a` | tracked, unchanged |

The suite’s complete transitive source closure was not individually enumerated. Therefore the exact 240-test rerun is closed against the working-tree checkout and transcript, while any claim that this table alone binds every individual rule source is deferred.

### Attestation evidence — closed

| Artifact | SHA-256 |
|---|---|
| `.../authority/attestations/2026-07-12-governance-kinds-l1/verify_manifest.py` | `68b70ae3741e0c6413411fb916cf95dc817cb94f8b18a89b87a4bf671ba8aced` |
| `.../manifest.json` | `c8c19428c3b30e21607c39c44b597eb2708b51062477694593e0b5ee22609bda` |
| `.../controls/manifest.content-mutated.json` | `7bba333f942dc5deea3a393b1b3efd196eecc38c876f754d40b5e5b8311796e2` |
| `.../verification-receipt.json` | `6bc1a70fa70e7d22198191f26f35366df4ae3a86d91bfcf98d54a7afab303b2e` |

All are tracked and unchanged at the observed checkout.

### Architecture self-test — closed as working-tree evidence

| Artifact | SHA-256 |
|---|---|
| `.../catalogues/order-status.member-bijection.v1.json` | `88a2a7ed7324633c432dd56d8bc6e4030facf251315d3fb862575ae4731dbea8` |
| `.../fixtures/order-status/catalogue.same-key-drift.json` | `dbda734c98af27d90f236096462723c7cb1de70217502dc263a8ef3cbd74adac` |
| `.../tools/validate-obligation-catalogue.mjs` | `c51fd799d72889edfb17a054b5681c4645af13b98a52e50c336b30e0ac04b33f` |
| `.../receipts/SWU-ARE-003.json` | `9857c3984d5aae8e7f5af0aa4a874d19dce71f191be213c387c5c29016e54a94` |

These bytes are untracked at `HEAD`; the execution is exact-byte-bound but not immutable-commit-bound. Public retention must describe it as candidate-local working-tree evidence.

### Candidate evaluator — closed as exact working-tree run; commit binding deferred

Core identities:

| Artifact | SHA-256 |
|---|---|
| `.../ontology-experiment/validate-ontology.mjs` | `ab191dfe40112b8468cad1d48474b552da75a58d58a8a188485c156b07f2cb9a` |
| `.../ontology.json` | `4eda2edd8006c719dcf8626caaf66ebde9b6db858959d2239d94993522ef6ed0` |
| `.../domain-meta-types.projection.json` | `c770d54fcdd3ddd0dc3c4b82ef198e71921940157a63f27bd708b8f880985ce2` |
| `.../profiles/base-domain.profile.json` | `629c977c78719603363f545678ae615bc8e38246e7e3a57f2d202434d5f30fbb` |
| `.../profiles/typescript-strict.profile.json` | `4f57f8de1e9da7410d0dec89679014a53b87ceb84a20d545b2d3cfcebea0b558` |
| `.../profiles/python-strict.profile.json` | `e89a91fa5e50325b3bbb19ae2a77689a0decfb15f015aef59ccca688b0441dec` |
| `.../profiles/rust-strict.profile.json` | `1d013e72a4f39992ea11f3c4f457285a352ff2d264a5ad4956a5eb637360afb7` |
| `.../examples/typescript-observed-facts.json` | `74d637de8b6a8c96246df037b85088cad4b80f22207db74ed9218eea874fcf67` |
| `.../examples/typescript-evaluation.expected.json` | `dd82fc27f21a87f9ef965f245c3149224d3d91823da902047a3d7fa5c74adee3` |
| `projects/domainspec-v2/definitions/meta-types/meta-types.yml` | `4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede` |

Enum fixture closure:

| Artifact suffix under `.../ontology-experiment/examples/enum/` | SHA-256 |
|---|---|
| `cases.json` | `b9de425121a58dfd632d8f28e61e8e6a84c25a170280f1fc7d47f5bb57b8331c` |
| `evaluations.expected.json` | `814401abd62a3e31c7af9bdac4d361ef25ccbb4f72c3da37d238cbd25859670a` |
| `composition/cases.json` | `f1ad8a7778d0018bd2fe85f7260c0efe194395554d384365bc957ab96ed35c9e` |
| `composition/check-enum-composition.mjs` | `ae6b2669fb6ea77fbda48e870465eb4b01977689c62c8e67a7f2512438146636` |
| `composition/evaluations.expected.json` | `34eb0fcaec754ccdecada977c7c11798c5fc0a4ad54dda60dea28d3fcefbc51d` |
| `profiles/activation-cases.json` | `1f3f78e2f7d8a135f5763d2fd480216f7b886589a9185864389dc083050a2af8` |
| `profiles/activation-evaluations.expected.json` | `78b144ecfb0c9f4b6f8e6b332e27b861e41ff9f949a532550f3c278d781ca25a` |
| `profiles/cases.json` | `b718a403b1a78b85a55c7d3b4e0e29a1ee06858b1157c6a59ccbee90fd1b448b` |
| `profiles/check-profile-resolution.mjs` | `27b7c678e70523b6730919c0989f52aa7c71e56b6c28488ae4ada86b312048b8` |
| `profiles/evaluations.expected.json` | `14f9c12d8d4b63d781839af4c39194e2836f11952fe86d23da3f3c41db663a07` |
| `provenance/cases.json` | `209034228b770d5d778eed00a7fb3f26d45488eb2e71f71dfc2ada4391a2e963` |
| `provenance/check-observation-projection.mjs` | `11603f89645e894eab0bb8e1578a6210eef29975dbd814557c3bec61b1959313` |
| `provenance/evaluations.expected.json` | `f254945f40f0d1d24098c893983f6bd681c2d53b737506f996fd8e6aa782ddfd` |
| `scenarios/cases.json` | `17eb5e79592a5cf546acccf540125ecb272d99eec8a8d99ed49413f639d7a3ac` |
| `scenarios/check-evaluation-scenario.mjs` | `6a43ad3a91b8b886910a1df844e8908683cafa76d8e1531ff6d6d897e6171ed9` |
| `scenarios/evaluations.expected.json` | `562cf625a547cba67239bf8475a8e7c54b3759d7924c05919d427113a26fd131` |

`ontology.json` was modified in the checkout, so the candidate-evaluator claim is closed only against these exact working-tree bytes and the transcript below. Immutable commit binding is deferred.

### Status-owner documents — closed

| Artifact | SHA-256 |
|---|---|
| `.../implementation-conformance/ontology-experiment/VALIDATION-REPORT.md` | `8364b69cc11d52168d53fe5d82f2ae7c60e8de7a557e3119f95f1ac98234c85b` |
| `.../first-production-release/ROADMAP.md` | `3a5b35c1f9ead0d08778f36920b49985e8d9e82e737b07888193e11e8033f53b` |
| `.../backend-type-test-engine-completeness/PLAN.md` | `2e94aab6c889ead26dabde936408babb802f81fcdab13ed139489990b2df6c0e` |
| `.../agent-spec-conformance/DESIGN.md` | `4210cd6a79a76ad189efbaa311a5ab91082e7f9c41c604b768ff9f64517aa79b` |

## Fresh execution bindings

Environment for every rerun:

- `HEAD`: `2f95b14d0d1006a35a7828b1bcf70106c6e11578`
- OS: `Linux 5.15.167.4-microsoft-standard-WSL2 x86_64`
- Node: `v22.13.0`
- npm: `10.9.2`
- Python: `3.12.3`
- `LC_ALL=C`
- `TZ=UTC`

Transcript digest convention: SHA-256 over combined stdout and stderr captured as UTF-8 shell-variable bytes, with trailing newline bytes removed by command substitution. This convention is exact and reproducible but differs from hashing an unnormalized terminal stream.

| Run | UTC interval | Exact command | Exit | Result | Transcript SHA-256 |
|---|---|---|---:|---|---|
| Engine suite | `2026-08-07T13:47:40Z`–`13:47:45Z` | `npm --prefix projects/domainspec-v2/impl run engine:test` | 0 | 29/29 files; 240/240 tests; Vitest duration 5.05s | `9abbf98982a4cfcaf2a76ccc4964b74d7503082b7428b72b725ac4f865cb235b` |
| Typecheck | `13:47:45Z`–`13:47:49Z` | `npm --prefix projects/domainspec-v2/impl run typecheck` | 0 | `tsc --noEmit`; no diagnostics | `8f1b0fadbc1143aa16f416f4521973c141158884d55b7286a198b7e4c97878c0` |
| Attestation positive | `13:47:49Z` | `cd projects/domainspec-v2/authority/attestations/2026-07-12-governance-kinds-l1 && python3 verify_manifest.py manifest.json` | 0 | valid seal; `sources_ok: true` | `5b18ac0ab470eaabf43b1421a61bcaa6d9d3fb588f7b8ce995f6c13fb781d861` |
| Attestation negative | `13:47:49Z` | `cd projects/domainspec-v2/authority/attestations/2026-07-12-governance-kinds-l1 && python3 verify_manifest.py controls/manifest.content-mutated.json` | 1 | expected rejection; tampered seal; `sources_ok: false` | `10040b81323fdeb5b64399823c53c9740a56f5f116207013b03d480312efd77b` |
| Architecture self-test | `13:47:49Z` | `node projects/domainspec-v2/development/architecture-realization-compiler/tools/validate-obligation-catalogue.mjs --catalogue projects/domainspec-v2/development/architecture-realization-compiler/catalogues/order-status.member-bijection.v1.json --self-test` | 0 | pass; one obligation; zero positive diagnostics; one expected mutant diagnostic | `59a4001de97229bdbc8e50325dfd5fa71ec3576b824c01a36d8e4af396d24b64` |
| Candidate evaluator | `13:47:49Z` | `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs` | 0 | overall pass; four profiles; principal negative fixture produced eight expected findings; bounded enum/composition/provenance/scenario controls passed | `1b0a671ed5dc811bb74029a089ccdad8f462f0654d8096d0acb7205521623e54` |

## Closed and deferred rows

| Claim row | Verdict |
|---|---|
| Current private engine suite passes 29 files and 240 tests | `closed`, exact checkout, environment, command, time, exit, and transcript bound |
| TypeScript typecheck passes | `closed` |
| L1 manifest integrity accepts exact manifest and rejects the mutated control | `closed` |
| Candidate-local one-obligation architecture catalogue discriminates its declared mutation | `closed-working-tree`; immutable commit binding deferred |
| Candidate evaluator discriminates supplied fixture matrices | `closed-working-tree`; immutable commit binding deferred |
| Engine implementation is fully identified by the selected test-file hashes | `deferred`; complete transitive implementation-source closure was not enumerated and private rules must remain undisclosed |
| Architecture evidence is contained in an immutable commit | `deferred`; family is untracked |
| Candidate evaluator is contained in an immutable commit | `deferred`; `ontology.json` is modified |
| Production validation, complete BTE L0B–L8 proof, independent release replay, replication package, general agent satisfaction, and release authorization | `deferred or killed exactly as in the original return`; this feedback supplies no upgrading evidence |

## Validation summary

All six requested command groups were freshly rerun read-only. Five expected-success commands exited 0. The attestation negative control exited 1 as expected and demonstrated rejection. Exact environment, UTC intervals, commands, exits, counts, transcript digests, and load-bearing working-tree artifact hashes are supplied.

No file, Git state, ledger, Inventory, telemetry, or external system was mutated.

## Residue

- The checkout is dirty and contains unrelated work.
- The architecture-realization family is untracked, preventing immutable commit binding.
- The candidate ontology is modified, preventing immutable commit binding.
- The engine run is exact checkout/transcript evidence, but a public exact-binding claim must not imply that every private rule source was disclosed or individually enumerated.
- These bindings establish reproducible local component observations only. They do not establish independent replay, production, release, promotion, or publication authority.
