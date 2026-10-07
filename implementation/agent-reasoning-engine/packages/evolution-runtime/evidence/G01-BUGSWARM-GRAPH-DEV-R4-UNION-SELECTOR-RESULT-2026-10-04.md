# G01 BugSwarm graph development r4 — union selector result

Status, 2026-10-04: **r4 failed its frozen advancement gate**. This is
private, exposed 24-case BugSwarm development, not independent confirmation,
ContextBench, live ARE, or product superiority. The reserved 24-repository
confirmation partition was not opened.

The [protocol](G01-BUGSWARM-GRAPH-DEV-R4-UNION-SELECTOR-PROTOCOL-2026-10-04.md)
was fixed before packet generation, provider calls, and evaluator access at
SHA-256 `cd593460d9168adec84a77aca67f036db7f4264e76b271fc50b705f2e2980475`.
The source-only [packet builder](../research/arb-trace2code-r1/build-bugswarm-graph-dev-r4-union-packets.py)
used sealed r2/r3 rankings and exact failing-commit source projections, not
gold or prior model outputs. It produced 24 packets with at most 50 union
candidates and 11,191 UTF-8 prompt bytes; packet SHA-256 is
`2eab7cd9858421eaca78f6e13c7f6209eec29adf1e6224b5a0e0701b3728d33f`,
seal SHA-256 `cce178545b3e511f6fbbdc14efcddf9a043603fc82b7be680d09072e97f10c32`.

The private VPS same-account tokenizer admitted **24/24** packets under the
8,192-token prompt-plus-512-output rule: summed prompt tokens **52,511**,
maximum per prompt **3,038**, below the frozen 130,000-token aggregate cap.
The [VPS runner](../research/arb-trace2code-r1/run-bugswarm-graph-dev-r4-union-vps.mjs)
then made **24 one-shot GLM calls**, with no retries. All returned HTTP 200,
but only **20/24** responses met the frozen JSON integer-ID schema. The four
invalid responses used exact path strings (one case) or quoted numeric IDs
(three cases). Neither transport repair nor a second call was made. The VPS
and WSL copies of `GENERATION-RESULT.json` checksum-match at SHA-256
`601bb72aa49547b52730fab73086d8e995174c76785e9b1c56c72ea298630cc6`.
All 24 raw responses are preserved in the private WSL archive; the
[source-only prediction seal](../research/arb-trace2code-r1/seal-bugswarm-graph-dev-r4-responses.py)
is SHA-256 `cdb72f6e155dbe8c123d218365c253954eadc73313787619b5361528bf0af4bb`.

After that seal, the [evaluator-only diagnostic](../research/arb-trace2code-r1/evaluate-bugswarm-graph-dev-r4-valid-diagnostic.py)
scored *only the 20 valid responses*. On this selected subset, MRR@8 was
**0.49583** for r4 versus **0.40214** for r2 and **0.20000** for ARE;
r4 had 7 wins and 5 losses versus r2. The diagnostic receipt SHA-256 is
`04507001ee77ee86c9dee5d7b35edebe2d5b9ed65772d304f429517b4925d038`.
These subset means are not a 24-case matched result and cannot be used to
claim the frozen MRR/win/bootstrap gate passed. The 24/24 validity component
failed outright.

The next development hypothesis is a versioned, score-blind response
normalizer accepting integer IDs, unambiguous decimal-string IDs, or exact
listed paths, with duplicate and range checks. Applying it to these already
exposed responses would be a **post-hoc diagnostic**, not an r4 repair or
fresh qualification. A prospectively frozen selector must still establish
whole-cohort accuracy, reliability, and cost before any independent
confirmation. Original logs/diffs remain HTTP-transport-provisional.

## Open Questions

- Does a separately frozen response contract remove the four format failures
  without allowing ambiguous or unlisted candidates?
- Do the candidate-union gains survive all 24 cases and then a truly fresh,
  independently admitted population?
- How will the original HTTP payload provenance be authenticated or reproduced?
