# Planned Design witness and validator contracts

Status: unexecuted Design contracts. These rows are not Plan or product evidence.

## Fixture contracts

| ID | Claim | Polarity | Input/violation | Expected result | Future phase |
| --- | --- | --- | --- | --- | --- |
| FX-SFC-ROOT-GREEN | explicit project root | positive | complete 13/16 project in arbitrary root | deterministic source manifest | implementation |
| FX-SFC-ROOT-FALLBACK | no fallback | negative | feature name, feature root, cwd/sibling candidate | exit 22, stable code | implementation |
| FX-SFC-PROFILE-STALE | owner-bound P2 | negative | changed membership/digest/owner receipt | exit 20 | implementation |
| FX-SFC-CAUSAL-MUTANT | C2 binding | negative | remove or mutate one active node/edge binding | obligation changes or validation rejects | validation |
| FX-SFC-RECEIPT-FUTURE | closed receipt decoder | negative | future major/unknown member/missing member | stable schema rejection | implementation |
| FX-SFC-DIAG-PAGE | deterministic lint pagination | positive/negative | reorder input, replay token, change page size/profile | stable order; mismatches rejected | implementation |
| FX-SFC-PARTIAL | one closed result | negative | serializer/output-cap/write fault | no partial stdout; exit 23/24 | implementation |
| FX-SFC-SECRET | pointer-only output | negative | source/path/env/stack secret canaries | no canary in output/evidence | validation |
| FX-SFC-RESOURCE | bounded envelope | boundary/over-bound | 50k/50k+1 records and byte limits | boundary measured; over-bound early exit 23 | validation |
| FX-SFC-CLEAN-ROOT | reproducible build | positive | two clean arbitrary roots | equal artifact/normalized-result digests | validation |
| FX-SFC-N1 | compatibility | positive/negative | supported N-1 and expired/unknown versions | read succeeds only inside declared overlap | validation |
| FX-SFC-OPERATOR | operability | green/red | independent install/run/recover/rollback/support | operator completes without author aid | release-candidate |

## Validator contracts

| ID | Target | Binding | Verdicts | Stale/self-issue rule | Owner |
| --- | --- | --- | --- | --- | --- |
| VAL-SFC-CONTRACT | foundation contract | decision + product/profile contract digests | pass/fail | reject either | CLI contract validator |
| VAL-SFC-SOURCE | project source manifest | profile + per-file + aggregate digests | pass/fail | reject stale | CLI source validator |
| VAL-SFC-RESULT | receipt/diagnostic/fault JSON | exact schema ID/version | pass/fail | reject future/self-declared schema | schema owner |
| VAL-SFC-CAUSAL | external C2 receipt | independent expected catalogue + executed evidence | pass/fail | reject engine self-oracle | conformance owner |
| VAL-SFC-BUILD | compiled artifact | npm/lock/script/runtime/source manifest | pass/fail | reject changed byte | build owner |
| VAL-SFC-ACCEPT | candidate acceptance binding | all product/profile/runtime/dependency/evidence hashes | pass/fail | any mutation invalidates | independent verifier |
| VAL-SFC-RELEASE | private release record | exact accepted candidate and separated owner approvals | pass/fail | implementation receipt cannot self-release | release owner |

No validator above exists merely because this document names it.

