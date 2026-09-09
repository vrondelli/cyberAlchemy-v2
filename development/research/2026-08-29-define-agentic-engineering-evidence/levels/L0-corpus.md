# L0 — Corpus And Evidence Boundary

Status: `prepared`

Cutoff: `2026-08-29`

## Primary 2026 Empirical Corpus

| ID | arXiv | Evidence role |
| --- | --- | --- |
| SRC-ARXIV-ECL | [2607.28815](https://arxiv.org/abs/2607.28815) | structured evidence conditions and commitment gating |
| SRC-ARXIV-ACT | [2605.07769](https://arxiv.org/abs/2605.07769) | action bias, verification before editing, and valid non-action |
| SRC-ARXIV-APR | [2607.21832](https://arxiv.org/abs/2607.21832) | task scope, semantic definition, mergeability, and observational quality |
| SRC-ARXIV-CTX1 | [2602.11988](https://arxiv.org/abs/2602.11988) | controlled evaluation of repository context files |
| SRC-ARXIV-CTX2 | [2607.27250](https://arxiv.org/abs/2607.27250) | two-agent context-file ablation on real repositories |
| SRC-ARXIV-MIS | [2605.29442](https://arxiv.org/abs/2605.29442) | real-session developer-agent misalignment taxonomy |
| SRC-ARXIV-LOG | [2604.09409](https://arxiv.org/abs/2604.09409) | instruction compliance and hidden human repair work |
| SRC-ARXIV-COMP | [2607.26375](https://arxiv.org/abs/2607.26375) | completion speed versus human code understanding |
| SRC-ARXIV-ISSUE | [2607.17286](https://arxiv.org/abs/2607.17286) | executable tests as a bridge from issue text to code |
| SRC-ARXIV-REVIEW | [2607.03316](https://arxiv.org/abs/2607.03316) | agentic review rejection, scope mismatch, and human burden |

## Related 2026 Sources

| ID | arXiv | Boundary |
| --- | --- | --- |
| SRC-ARXIV-AIDEV | [2602.09185](https://arxiv.org/abs/2602.09185) | dataset infrastructure, not causal outcome evidence |
| SRC-ARXIV-HUMAN | [2608.12355](https://arxiv.org/abs/2608.12355) | position paper; interaction dimensions, not measured effects |
| SRC-ARXIV-READMES | [2511.12884](https://arxiv.org/abs/2511.12884) | 2025 study revised in 2026; context-file content, not effectiveness |
| SRC-ARXIV-PRO | [2512.14012](https://arxiv.org/abs/2512.14012) | 2025 professional study revised in 2026; qualitative control practices |

## Clearly Labeled 2025 Foundation

| ID | arXiv | Boundary |
| --- | --- | --- |
| SRC-ARXIV-METR | [2507.09089](https://arxiv.org/abs/2507.09089) | randomized early-2025 productivity result; different tools and population |

## Local Corpus

| ID | Path | SHA-256 at preparation |
| --- | --- | --- |
| SRC-LOCAL-DEFINE | `cyberAlchemy-v2/define/docs/DEFINE.md` | `bde8a4dd172738b15c28390ae49fdaae836999a7b3c6d2c1f32a944b52e15743` |
| SRC-LOCAL-PACK | `cyberAlchemy-v2/define/docs/DEFINITION-PACK.md` | `42fb13db5f090f167e7a25079a6e3a98d9762b707f92a0a6dbee4bc181a53906` |
| SRC-LOCAL-INTERACTION | `cyberAlchemy-v2/define/docs/INTERACTION.md` | `abc1feb9889c7487673a4b02bc931e884dc104a2f370dd090940c50b1eb7f383` |
| SRC-LOCAL-THESIS | `cyberAlchemy-v2/product/PRODUCT-THESIS.md` | `d41a227adf6323da0518e8b51b9e49e8b98ae3166a5a1ee802169c510600efa4` |
| SRC-LOCAL-OUTCOMES | `cyberAlchemy-v2/product/OUTCOME-MODEL.md` | `94489d09c90095fe90209ac7d6ced6f18cda13b7fb2b9760ae4fbeb7ad44c3b7` |
| SRC-LOCAL-E10-CONTEXT | `research/projects/domainspec/experiments/E10-developer-productivity/context.md` | `1b63468478443307ab3b16cd9d96c95105e8215e93d71d852eac90f2c4bc3c65` |
| SRC-LOCAL-E10-PROTOCOL | `research/projects/domainspec/experiments/E10-developer-productivity/protocol.md` | `95c88af12165e77d3954e96857a99d4b13f3776bef7a67f343e962a7a3b7cfc2` |

The local files are current worktree candidates. Their hashes identify the
inspected bytes; they do not make those files canonical.

## Exclusions

- vendor marketing and benchmark leaderboards without a controlled method;
- generic code-generation benchmarks unrelated to downstream meaning;
- studies outside the cutoff except explicitly labeled foundations;
- direct Jira-versus-Linear comparisons, because none was found in the bounded
  arXiv corpus;
- `arXiv:2604.05013`, which was withdrawn after significant data errors were
  reported by its author.

## Negative-Claim Rule

Use “not found in the inspected corpus,” not “the literature contains no such
study.” The corpus is bounded, and arXiv preprints may change after the cutoff.
