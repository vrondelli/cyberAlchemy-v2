# G01 BugSwarm selective r38 ranking result — 2026-10-04

Status: passed pre-gold source-only ranking gate  
Population: 24 authenticated cases; 17 Python / 7 Java  
Claim ceiling: routing-denominator and implementation evidence only; no accuracy or superiority claim

## Result

Both unchanged ranking arms completed and independently passed full candidate-
set and provenance audit:

| Measure | Result |
| --- | ---: |
| ARE complete rankings | 24/24 |
| graph-r2 complete rankings | 24/24 |
| projected source files audited | 7,894 |
| ARE top-1 = graph-r2 top-1 | 3/24 |
| ARE top-1 != graph-r2 top-1 | 21/24 |
| r27 selective-policy GLM calls | 21 |
| always-GLM comparator calls | 24 |
| projected call reduction | 3/24 = 12.5% |
| network calls in r38 | 0 |
| model calls in r38 | 0 |
| gold / passing source / patch access | 0 / 0 / 0 |

The three agreement slots are 7, 11, and 22. The other 21 slots would dispatch
under the prospectively defined rule `ARE top-1 != graph-r2 top-1`.

The current rule therefore passes the mechanical transfer gate but is a weak
cost selector on this population: it behaves close to always-GLM. No provider
calls should be spent merely to demonstrate a 12.5% maximum call reduction.

## Integrity receipts

| Artifact | SHA-256 |
| --- | --- |
| protocol | `208da5c751015ff5f4392a8e04907f14d17e8ff44143b4d85dfdec7198077305` |
| ARE runner | `f29c1a1e1df19a3ca689647a427ecf4359ed0b1c427049eed052d3fedd0cab1e` |
| ARE independent sealer | `f156fa24a68a81300d0aeaf1b09cccb39b19fa96777337c09deaef7025105700` |
| graph runner | `2172b48e43a126ba2981903e48165059ced9e9f655d64f59c8b4be3915618765` |
| independent final auditor | `71c0ee934a3bf277d9aa945bf7911529a65fa234311e28d2fae52de0e48df496` |
| ARE freeze | `2a95e0ef59f03b9232971fe6fe34048e5e6fd7f18b729bcf4e13ee67a8852972` |
| ARE seal | `b5c6665bbb1a9142d9b77b9de69d222f014d1fe1847ea89d1208fead1621691d` |
| graph freeze | `7ddbe5903b08ebc9220f34f874b37d46b30a195c18a5cb214d1d69990cfdd3d7` |
| final audit and disagreement census | `ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe` |

Private ranking root:

`/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28/rankings-r38`

The final auditor independently re-enumerated each Git index, rehashed all
7,894 projected files into the r36 tree digest, rehashed and decompressed every
authenticated log, verified each receipt path and hash, checked both rankings
as full permutations of the same source set, and recomputed every top-1
disagreement bit.

Measured ranker time was 13,418 ms for ARE and 4,614 ms for graph-r2. These are
local algorithm timings, not end-to-end benchmark latency.

## Interpretation

This result does not say which top-1 path is correct. It says that the two
source-only views disagree too often for binary top-1 disagreement to deliver a
material efficiency advantage by itself.

The external research scan remains useful, but the next experiment should add
the proposed deterministic symbol/path channel and fixed late fusion before a
GLM campaign. A three-view support count and fused-rank stability can supply a
more selective uncertainty signal than pairwise top-1 disagreement.

## Next gate

R39 should be a no-model, pre-gold ablation:

1. derive exact symbol and path cues only from the frozen r37 query;
2. emit a complete third ranking for every r36 source set;
3. fuse ARE, graph-r2, and symbol/path rankings with a prospectively fixed,
   scale-free rule;
4. preserve the union of each channel's bounded top candidates; and
5. seal three-view agreement, support counts, and packet sizes before any gold
   or model access.

Only after r39 establishes a materially smaller, stable escalation denominator
should the campaign freeze matched always-GLM and selective-GLM packets.

## Open questions

- Will three-view support reduce the escalation set without losing acquisition
  coverage after evaluator-only scoring?
- Which fixed fusion rule is least sensitive to repositories with 9 files
  versus repositories with more than 1,400 files?
- What minimum projected call reduction is worth a matched GLM campaign?
