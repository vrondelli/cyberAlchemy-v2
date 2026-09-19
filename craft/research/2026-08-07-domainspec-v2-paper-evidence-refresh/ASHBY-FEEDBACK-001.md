action_id=spawn-0003  
agent_id=/root/paper_explorer_ashby  
dispatch_id=2026-08-07-domainspec-v2-paper-evidence-refresh  
role=explorer-ashby-feedback  
status=pass

## Immutable-binding supplement

### Binding table

| Row | Claim retained or tested | Immutable identity | Exact selector | Disposition |
|---|---|---|---|---|
| LIC-01 | Arcanum uses PolyForm Noncommercial 1.0.0 | Public commit `a5c8bc5c010711721063e258ee92559f02dfc504`; Git blob `83fbb268e0654c48e4ba8932de0d5d3113e3b367`; SHA-256 `313e4e1490d38a991ddbd339e10edb1889dda2851086a1db2bf97149dea25ebc`; public immutable URL: https://github.com/cyberAlchemyAI/Arcanum/blob/a5c8bc5c010711721063e258ee92559f02dfc504/LICENSE | `LICENSE:1-5` identifies the required notice and license; `LICENSE:48-64` defines permitted noncommercial purposes; `LICENSE:71-75` denies implied additional rights | **Closed.** Public wording must say “source-available under PolyForm Noncommercial 1.0.0,” not “open-source.” |
| PAGE-01 | Deployed Pages bytes correspond to a public commit | Public commit `a5c8bc5c010711721063e258ee92559f02dfc504`; paper blob `7e6d74b7da8cf742dfaa04764572760413d2f737`; SHA-256 `cb430f8d5f15c917fef70fae5e0e7fc1ee3533cfb2d7f6bc044c26d473620e73` | On 2026-08-07, `https://cyberalchemyai.github.io/Arcanum/paper.html` returned HTTP 200 and SHA-256 `cb430…620e73`; immutable raw commit URL returned the same digest: https://raw.githubusercontent.com/cyberAlchemyAI/Arcanum/a5c8bc5c010711721063e258ee92559f02dfc504/docs/paper.html | **Closed for byte identity and reachability only.** This does not establish visual correctness, research validity, release status, or production readiness. |
| E3-01 | Original mutation score 38.75% | Implementation checkout commit `4e8834ddf54baa28f8de91abcf86f9a367f63948`; blob `f1ce500b5eb74c5388b21f93f935e3087e4825a2`; SHA-256 `ebba9b2517dec8b17a2a9c7a934bff6b94928a45a062cb560c81693c50cdfca0` | `docs/research/results/E3-results.md:27`; pilot status at line 3 | **Closed**, only as the financial-settlement pilot result. |
| E3-02 | Revised aggregate mutation score 54.37%, change +15.6 points | Same identity as E3-01 | `E3-results.md:71` | **Closed**, single-feature pilot only. |
| E3-03 | Hardest module changed 17.2%→36.56%, +19.4 points | Same identity as E3-01 | `E3-results.md:72` | **Closed**, module-local pilot result only. |
| E3-04 | Regenerated suite passed 13/13 against unmutated code | Same identity as E3-01 | `E3-results.md:76` | **Closed**, bounded correctness check only. It does not prove corpus effectiveness or general implementation conformance. |
| E3-05 | Scope and adjudication limits | Same identity as E3-01 | Single-rater status `E3-results.md:46`; non-claims and pilot boundary `:55-59`; interpretation `:78` | **Closed as mandatory adjacent caveat.** |
| E6-01 | 747 concepts; 746 covered, 1 strained, 0 uncovered; 99.87% | Parent checkout commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; protocol blob `b91a91fa6a2f32185d40ac9e142d6d51479e2bf0`; SHA-256 `fd807442139fb361767549c1a4905c13a6b9e9ef332e48ae1d3bf5ff568a41b2` | `research/projects/domainspec/experiments/E6-vocabulary-sufficiency/protocol.md:169-174` | **Closed**, as author-controlled classification coverage in this corpus. |
| E6-02 | 670 relationships; 663 covered, 7 strained, 0 uncovered; 98.96% | Same identity as E6-01 | `protocol.md:169-174` | **Closed**, same bounded meaning. |
| E6-03 | 18 domains × 36 features | Same protocol identity | `protocol.md:160-167`, tier table `:176-184`; corroborating corrected analysis below | **Closed.** |
| E6-04 | Corrected totals and Wilson intervals | Parent commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; results blob `ba75ecc51031ef8f64caddcc5c2fce4f4fb4d1b7`; SHA-256 `f6a46c4d52cdcafc1e4f494c27e655eda18937e7f96f9a39fd246ae6a72c3d06` | Corrected JSONL totals `E6-results.md:250-254`; Wilson intervals `:289-295`; manual aggregation discrepancy `:503` | **Closed.** The earlier narrative at `:84`, `:129`, `:220`, `:234-236` uses stale 738/668 and 99.86/98.95 values and must not be cited. |
| E6-05 | E6 validates representational input coverage, not derivation correctness | Same E6 results identity | Operator/domain selection risks `E6-results.md:434-435`; contribution boundary `:467-468`; input-space qualification `:474` | **Closed as mandatory caveat.** |
| E9-01 | Rerun contains 94 cross-context edges in 6 domains | Parent commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; blob `7d1a7050fa06115125f28f5624cc02ce5ffa6df9`; SHA-256 `c034c7357b43d40bc9ab080d3365ebeeb494cc1a72793878c3ede93e916748d5` | `E9-run2-rerun-results.md:17-21`; domain/edge summary `:304-305` | **Closed.** |
| E9-02 | Original-rubric gap: 70/94 = 74.5%, comprising 29 strained and 41 broken | Same E9 identity | `E9-run2-rerun-results.md:61-63`, total row `:75` | **Closed arithmetically, but only as rubric-defined extension adoption.** |
| E9-03 | Extended scheme maps all 94 rows to “works” | Same E9 identity | `E9-run2-rerun-results.md:52-54`; success row `:140-141` | **Closed only as modeled-row coverage.** It is not semantic or implementation validation. |
| E9-04 | Definitional circularity and operator bias | Same E9 identity | Fixed mapping warning `:26`; operator bias `:352`; circularity `:368`; “works means edge type exists” `:369`; modest generalizability `:376` | **Closed as mandatory adjacent caveat.** The paper must not call 74.5% an independently observed failure rate or 100% semantic completeness. |
| E11-01 | Fixed-input bootstrap full/rerun agreement = 1.000 | Parent commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; result blob `82b297f822ecfb63c87763aa49206d038d9e21a8`; SHA-256 `3bcbafb77ece9ff3127742f15caefa1c8be06e7430441809d798ce29cf856b03` | `run-run-2026-04-22-bootstrap-results.md:27-33` | **Closed**, as mechanical fixed-input repeatability of the bootstrap bundle only. |
| E11-02 | Bootstrap result cannot upgrade claims | Same E11 bootstrap identity | Disclaimer `:3-5`; hold decision and reason `:42-45` | **Closed as mandatory caveat.** |
| E11-03 | Completion used a single-human policy override | Parent commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; completion blob `14eddb74aaeb2c7530dcd15c8a15ca58e033d238`; SHA-256 `f47fb7c3906402e470b5ea9d4c7c83e46ccc7a81ed4fb3c2b341c594b161aed1` | `COMPLETION-STATUS.md:18`, residual risks `:21-23` | **Closed.** |
| E11-04 | Claim matrix remained unchanged | Parent commit `2f95b14d0d1006a35a7828b1bcf70106c6e11578`; claim-delta blob `020ed9b5939c3a734373d7c0050cdb24bebcf1b6`; SHA-256 `035b432b07ceea90ea03ecabc8d13b628956a0b9ab337edb9d2027af29512a6f` | `E11-claim-delta.md:3-12`; override identity/reason `:14-19` | **Closed.** Public prose may say “fixed-input repeatability was observed”; it may not say E11 promoted or validated a DomainSpec contribution. |
| TH-SHANNON-01 | Shannon’s noisy-channel capacity formula | C. E. Shannon, “A Mathematical Theory of Communication,” *BSTJ* 27, 1948; primary PDF: https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf; downloaded SHA-256 `6e4e3411984f3edf99dbfe8b941cb5e8a321379ff0cae6ae5c1f592ad8882ca8` | Part IV, §25, Theorem 17; PDF page 42, lines 2462-2480 in the indexed rendering; original article second-part pagination approximately pp. 626-627 | **Closed for the communications theorem only.** It assumes band `W`, white thermal noise power `N`, and transmitter power `P`. |
| TH-SHANNON-02 | Shannon proves DomainSpec governance attenuation or `∂C/∂k<0` | No supporting source selector exists | Theorem 17 does not define instructions, governance layers, context attention, or `k` | **Removed.** The formula may be cited only as inspiration for a proposed analogy, not as a bound or corollary. |
| TH-ASHBY-01 | Law of Requisite Variety | W. R. Ashby, *An Introduction to Cybernetics*, 1956; primary archive PDF: https://ashby.info/Ashby-Introduction-to-Cybernetics.pdf; downloaded SHA-256 `26bd434d9b5d8e430c9b6aea107983249a7196b438502d4624847ab7b8c15da6` | Chapter 11, §11/7, printed p. 207; indexed PDF page 109, lines 4979-4998. Section §11/8 begins at line 5001 | **Closed** for the regulator/disturbance/outcome variety inequality and “variety can destroy variety.” |
| TH-ASHBY-02 | `log₂(54)≈5.75` governance dimensions are sufficient; seven layers have diminishing returns | No supporting source selector exists | §11/7 relates logarithmic varieties of disturbance, regulator, and outcome. It does not license summing heterogeneous type counts or deriving an architecture-layer optimum. | **Removed.** |
| TH-CONANT-01 | Good Regulator theorem’s actual scope | R. C. Conant and W. R. Ashby, “Every Good Regulator of a System Must Be a Model of That System,” *International Journal of Systems Science* 1(2), 1970, pp. 89-97, DOI https://doi.org/10.1080/00207727008920220 | Article abstract, p. 89, and theorem development across pp. 91-96; publisher abstract states the qualified result for a regulator that is maximally successful and simple, with exact assumptions in the article | **Closed** only for that qualified theorem. |
| TH-CONANT-02 | The theorem proves an executor cannot observe itself or predicts under-reporting | No supporting selector exists | Neither the abstract nor theorem states an observer/executor incompatibility or an LLM self-report rate | **Removed.** Observer separation can remain only as a DomainSpec design hypothesis inspired by model-based regulation. |
| TH-MILLER-01 | Miller’s actual result and warning | G. A. Miller, “The Magical Number Seven, Plus or Minus Two,” *Psychological Review* 63(2), 1956, pp. 81-97, DOI https://doi.org/10.1037/h0043158; author-approved HTML reproduction: https://psychclassics.yorku.ca/Miller/ | “Immediate Memory” discussion, HTML lines 125-129; conclusion lines 178-179. Miller explicitly calls conflating different “seven” spans a fundamental mistake and withholds judgment | **Closed**, as evidence against the paper’s mapping. |
| TH-MILLER-02 | Miller supports `k*≈6-7` governance layers or analogous LLM limits | No supporting selector exists | Miller’s own warning at HTML lines 127-129 rejects the simple unification of the human spans; the article contains no LLM evidence | **Removed.** |
| TH-BEER-01 | Beer proved that exactly five systems validate DomainSpec’s layer count/mapping | No exact primary-source theorem binding was established in this feedback loop | The cited `Brain of the Firm` bibliographic entry alone does not bind the paper’s “proved exactly five—no more, no fewer” statement or the DomainSpec mapping | **Removed.** |
| TH-BEER-02 | Descriptive VSM inspiration | Stafford Beer, *Brain of the Firm*, 1972, bibliographic identity only | No immutable primary digital page selector was bound in this run | **Deferred.** If retained, wording must be limited to “inspired by Beer’s five-function VSM” and requires a verified edition/page selector before evidence closure. |
| AUTHOR-01 | Vladimir Rondelli and Victor Boscaro approved scholarly authorship | Repository commits and copyright attribution are not consent/contribution records | No existing author-approved contribution or consent record was found in the bounded evidence reviewed | **Deferred.** Do not infer consent from Git attribution or copyright text. |

## Explicit closure ledger

### Closed positive rows

- `LIC-01`
- `PAGE-01`, limited to HTTP reachability and exact byte identity
- `E3-01` through `E3-05`
- `E6-01` through `E6-05`
- `E9-01` through `E9-04`
- `E11-01` through `E11-04`
- `TH-SHANNON-01`
- `TH-ASHBY-01`
- `TH-CONANT-01`
- `TH-MILLER-01`

### Deferred rows

- `TH-BEER-02`: no exact primary edition/page binding obtained
- `AUTHOR-01`: no author-approved authorship consent/contribution record
- Any claim that the Pages deployment is a release, production system, replication package, or visually validated artifact
- Any current experiment claim requiring public independent reproduction rather than an immutable internal artifact

### Removed rows

- “Arcanum/DomainSpec is open-source”
- Shannon proves or bounds governance attenuation
- Shannon yields a critical governance-layer derivative
- Ashby yields `log₂(54)` sufficient governance dimensions
- Ashby implies diminishing returns at seven layers
- Good Regulator theorem proves observer/executor incompatibility
- Good Regulator theorem predicts signal under-reporting rates
- Miller supports six or seven governance layers
- Miller establishes analogous LLM instruction capacity
- Beer proved DomainSpec needs exactly five or seven layers
- E9’s 74.5% is an independent semantic failure rate
- E9’s 100% is implementation or semantic completeness
- E11 upgraded the contribution claim
- E3 demonstrates zero human variance or corpus-wide effectiveness

## Validation summary

- Read the declared feedback document, original persisted action, and targeted prompt.
- Performed only immutable-binding repair; no corpus widening or file mutation occurred.
- Bound the public license to a public commit, Git blob, SHA-256, and exact line selectors.
- Fetched the deployed Pages paper and immutable raw commit bytes; both returned HTTP 200 and identical SHA-256.
- Bound every E3/E6/E9/E11 number worth retaining to repository commit, blob, SHA-256, and exact selectors.
- Identified and excluded stale E6 manual totals.
- Bound Shannon and Ashby to primary archive PDFs with exact section/page selectors and downloaded digests.
- Bound Conant–Ashby to DOI, article pagination, and qualified theorem scope.
- Bound Miller to DOI and exact primary-reproduction selectors, including his explicit warning against the paper’s numerical analogy.
- Did not mutate files, Git, telemetry, ledger, receipts, or external systems.

## Residue

The immutable-binding repair closes the licensing, deployed-byte, E3, E6, E9, E11, Shannon, Ashby, Conant–Ashby, and Miller rows at their appropriately narrow scopes.

Two positive rows remain unclosed and must not be promoted:

1. Beer as a precise primary-source theoretical mapping.
2. Victor Boscaro’s authorship consent/contribution approval.

The repaired evidence supports a public architecture-position paper with bounded internal experiment reports. It still does not support open-source, production-validation, independent-replication, general completeness, governance-bound, layer-optimum, or theorem-backed self-governance claims.
