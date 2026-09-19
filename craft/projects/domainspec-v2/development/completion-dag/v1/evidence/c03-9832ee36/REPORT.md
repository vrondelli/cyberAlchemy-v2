# C03 — reproducible compiler candidate

**PASS.** The exact source commit `9832ee36c5332be825ff065fb8cff05b23b2fd81` produced two byte-identical candidate bundles, and the selected bundle passed independent offline and installed-consumer checks.

## Candidate

- Package: **@domainspec-v2/cli@1.0.0**.
- Candidate ID: `domainspec-v2-cli-1.0.0-9832ee36c533`.
- [Installable package](bundle/package/domainspec-v2-cli-1.0.0.tgz): **333,032 bytes**, with **248 packed files**.
- Package SHA-256: `8587a0355c39878264935ef4e824ff80266383690e82c756f8216af48a5c194a`.
- Candidate manifest digest: `8a99e676c8b8979686873a55ea35aaec436ed9920b2284885fc7651d90e986a1`.
- [Candidate manifest](bundle/candidate.json) · [Checksums](bundle/SHA256SUMS) · [Offline verifier](bundle/verify-release-candidate.mjs).

The bundle includes the package inventory, SPDX SBOM, unsigned provenance, and both passing C02 qualification runs. The only declared normalization changes `equivalence.evidence_root` to `qualification`; all other qualification bytes match C02.

## Verification

| Check | Result |
|---|---|
| Two clean-source builds | PASS |
| Byte equality across all 35 bundle files | PASS |
| Offline verifier, network disabled and no repository mount | 28/28 checks on each build |
| Two independent offline package installations | PASS; root API, CLI version and capability observations agree |
| Wrong source, package tampering, missing certificate, SBOM/provenance changes, checksum drift, extra artifact and verifier tampering | All eight rejected |
| C01 builder source-sensitivity fixture | Existing current PASS reused for the unchanged builder |
| Final source check | All 206 hashes match; isolated checkout clean |

The offline checks used the trusted verifier bytes bound to C00, including when testing a modified embedded verifier. Tampering was performed only in disposable copies. The selected bundle stayed unchanged.

[C03 results](RESULTS.json) retain the exact scope of reused source-sensitivity evidence: the prior synthetic-source test proves changed inputs affect the builder, while this task proves reproducibility and verification of the actual compiler bundle. No alternate compiler commit was created.

The npm cache correction from C01 is retained in build commands: `env -u NPM_CONFIG_CACHE`. Neither compiler source nor dependencies changed.

## Next frontier

**Next product task: C04**, independent review of this exact candidate and evidence. C05 product approval follows that review. E00, R00, U00 and L00 remain independent ready product tasks. O01 can inspect hosted evidence for the selected commit; later publication, signing and deployment remain separately owned operational work.

This provenance is **unsigned** and does not authenticate a publisher. C03 grants no product approval, publication, release or deployment authority.

[Task receipt](receipt.json) · [Progress](progress.json)
