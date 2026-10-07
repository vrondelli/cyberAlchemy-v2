# Selected target-byte baseline (planning candidate)
+
Status: sampled on 2026-09-27 from the current checkout. This is a read-only
snapshot of primary repair targets, paired tests and immediate binding inputs;
it is not a complete source closure, ownership decision, validation pass or
permission to edit. Rehash each path immediately before its track begins.
`clean` means only that Git's index and working tree match for that path;
`modified` and `untracked` bytes are pre-existing user work to preserve.

| Local path | SHA-256 | Git state |
| --- | --- | --- |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim-lowering.ts` | `0b1dc0c5828e7955b0303e05d925c82e68ab1a0b0342f767ab1b83db0c57232a` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/formal-claim-lowering.test.ts` | `90247031220c7513732ef2114915cd917b17de2078d627faabc8b0cee1ead2c6` | modified |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/durable-outbox-runtime.ts` | `4d2cc7364179285b10b9e57ce24f0a15d077f9f5b4f30c44a1f38e41e97af1c3` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/durable-outbox.test.ts` | `f3a68f399645b3774e7b7baabb97ff920f7009b73b0aa86a078d029ec1d267d6` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-evf-evidence.ts` | `8a7f9a54bd2dd472403ba4f1f414f47614e01c377a5af035d1b23a1177aa50d6` | untracked |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/application-evf-evidence.test.ts` | `1d3a643e06bd09024ffd3882975645bba96f6c6fa8e271e7ce1ec168284bbdf5` | untracked |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-runtime-observation.ts` | `4c2caa936817aa2d4a0c128296ba5d01990cf9782e90a0aaa61148ded921fe2d` | untracked |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/application-runtime-observation.test.ts` | `2afa14c6311b7abdcd1020fdab2db4c57644b70f16abd50ea65dd333c13c9aa1` | untracked |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/http-invocation-adapter.ts` | `50e687d407418158b3af72bf6524bd53a68f215adcaad11f52ffae5d88130e9c` | modified |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/integration-runtime-types.ts` | `4800fefed944bd9c01818e255309de2e46af158cf8f42b82d1ea8023afcb7be6` | untracked |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/outbound-runtime.ts` | `5ca3c842724a2a1fc4bbd977410337dbde1394aef0e0801cb44d9257b8c7d19c` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs-app/src/workspace.ts` | `05debf3b087ee049ed8b3dedebea4d3fac53f66241096a98314c8fe628b63938` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs-app/src/workspace.test.ts` | `c41cd6a83845918c6f8cffd82b08cf82ffc557b751430dfb129d5cbcb952d14c` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs-app/src/App.tsx` | `1f8ac8bb9efef1416a49a9010810ccf569bf06b7b9603fef1b7eb598a44b9f42` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/README.md` | `04a963f15a6380a8107253cbe46ebd2d0a1c70b81a2455573a9af4a2d4e890ad` | modified |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs/FORMAL-CLAIMS.md` | `ec3c8dce3d99ddc91d4f97bd4dcf1ffad5c00a60e85fc6b6045eb37963bdeed6` | modified |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/docs/LANGUAGE.md` | `af21d39d4b472ab77e57e21f6f47bdcfb5b152d46b4c9399c2bb7ea35423020a` | modified |
| `language/capabilities/alchlang/README.md` | `b2ecc59973d8bbc3ca944fd3be8dcfaf562cd1e826578f5388e0fdddf27c213e` | clean |
| `language/capabilities/alchlang/product-capability.json` | `478695ce8437085fef5c7f9a2f1ab10d91ee78b8dcbff3d4dfafe9d3fca4ce4b` | clean |
| `language/capabilities/alchlang/sources.json` | `19144598dbca60b0fe9720104e047f0416294b6ad9117c2d6b6edaf9539d9c04` | clean |
| `research/2026-09-22-alchlang-obligation-derivation/REPORT.md` | `72db52c242e157a87f33cdbf23d317c813c35fc0135544a00b2becddce7865e6` | untracked |
| `craft/projects/domainspec-v2/formalization/formalization-package.json` | `8287adfb302ff2db0ec03f045c9fca852915720c1adb376a85b794908db2cd46` | modified |
| `craft/projects/domainspec-v2/formalization/definitions/formalization-definitions.json` | `ce4a45a5e742d8bf182f2c34c8bf6d24880d8c2a96749cbe9260fcfa65116d69` | clean |
| `craft/projects/domainspec-v2/formalization/validate.mjs` | `7a270adb0d63ec7f0fd7cb383e7d712dba1ce3b2eea4b5ed826a4255a8d0c3f3` | modified |
| `craft/projects/domainspec-v2/formalization/method/formalization-method.json` | `2a4cbac15462aadde2352b944b5de0701e0c7cd5fec26e8a2f7dcac9fbbe4dbf` | clean |
| `craft/projects/domainspec-v2/ontology/sources.json` | `75685eccc1d0be7f087295d5984f45f9bf3660b309bdb8b096b39c3a365f43a9` | clean |
| `craft/projects/domainspec-v2/definitions/minted-project/supported-profiles.yml` | `489fb4faa8cd00554c03d7673c9c4a9035abcecb6e6b165dc5e87239cede2305` | clean |
| `craft/projects/domainspec-v2/definitions/relationships/relationships.yml` | `19790f73c6d1a401a37a1eeb90f1477fd53d388d2116102c414d9172893cb81f` | clean |
| `craft/projects/domainspec-v2/definitions/DEFINITIONS.md` | `f6974f45ef25dfd10a0028a07696dde7f7ae8dfde942bcb16c45dd33cbee4ee6` | clean |
| `craft/projects/domainspec-v2/definitions/meta-types/meta-types.md` | `c49f7879f7d27f214f930dc0c643edf411e63bf26d1a057f81be959645f51a51` | clean |
| `craft/projects/domainspec-v2/IMPORT-MANIFEST.md` | `c354581e5c88b67db645ee6c9f59dfb3a9958a1b4dcbad1687f7603ec300a2b1` | clean |
| `craft/projects/domainspec-v2/AUTHORING-TO-RUNTIME.md` | `bc9f4a9caddac7c6fee2e69c5e9ee3830d159624325fcaa196fa6a2f98a750ae` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts` | `34b9a2a088e3b1baaa598265e4fa381ef67ae4fdebe4463b18cbdf1c0bb6cfe7` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.test.ts` | `5c866246df25e314de280258b56a58ad5c173a25c1fbd33b6e2aa0d674b3a8d0` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts` | `c85f4c6f89b515cda41763bfad82beedb7bbfbf34ab5e5aa4000eeb4ecd950e4` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/grammar/normalized-spec.test.ts` | `fbd762dd1c6f8bb10803eb43bb0e93b943d4e566111f547401abca955609695a` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/bte/validation/validate-semantics.ts` | `305903224b0bd986614ea852bc65c13720fe8b9cef473a1b89e0c40c4c931a46` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/bte/validation/validate-semantics.test.ts` | `71b6b1d13b8b59c8ad45770e8e1e209a79c863ed29f38334f3d409fce0ea987e` | clean |
| `craft/projects/domainspec-v2/impl/cli/src/assurance/certify.ts` | `290ea0fe7c06d828530db2942eb81596b8c2bc73800b3716d37ef425cce86e6a` | clean |
| `craft/projects/domainspec-v2/impl/cli/test/assurance/certify.test.ts` | `0a782e3b959fcabca09dffd73d9a0a9189299826c3b7c41506427fa335fff507` | clean |
| `craft/projects/domainspec-v2/impl/cli/src/meta-types/catalog.ts` | `2fcd3283205885213ed8877884f4c2dbbcf5aa777a37154c43b2343910af3d45` | clean |
| `craft/projects/domainspec-v2/impl/cli/test/meta-types/catalog.test.ts` | `658eb6025d3495644e275434f5f64455e5b43cbce50ba7a8fb31f754580b9cb4` | clean |
| `craft/projects/domainspec-v2/ARCHITECTURE.md` | `3a02f063e8573af19e14f469313d87c1e2de7865d67ea898c46654a7c56ee863` | clean |
| `craft/projects/domainspec-v2/definitions/meta-types/current-implementation.json` | `84dccd7682a94b7d27df4346bd1ced24d1a31aa4b88c89998313c712934818f4` | clean |
| `craft/projects/domainspec-v2/impl/test-derivation-engine/src/keys/index.ts` | `94644132b9fc72eec11437e0d47206f41525322e5758cb5c82d771dc4c1989a4` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/domainspec/specs/typed-backend/nodes/typed-mapping.json` | `617be19dc426fa3573ba52faf1e71659a50b752dca021c51a1422ee72cd0d19b` | clean |
| `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-rule-projection.ts` | `b69bc0cb3ddd0fc78258969e38d89611ee7bac303d0304e0df42fdfeba6d58f4` | modified |
| `craft/projects/domainspec-v2/impl/cli/src/input/project-model.ts` | `9951c41aee9e15fc9ebee02a4f30cb06814bc0db908dc9e9f0e70710bb7e8cec` | clean |

This selection does not include every transitive consumer, generator, package
archive, generated binary, provider, browser runtime, or external environment.
The independent analysts must extend it for their exact patches and report
any intervening drift. No hash here establishes that a finding is fixed.

## Open Questions

- Which dirty bytes belong to overlapping user work, and what exact merge
  boundary will preserve them when a repair track is authorized?
- Which transitive inputs must enter each track's implementation identity and
  test currentness before target edits?
