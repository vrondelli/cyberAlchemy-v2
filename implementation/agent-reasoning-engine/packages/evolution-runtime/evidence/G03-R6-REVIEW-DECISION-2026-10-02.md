# G03 r6 exact-card review decision — 2026-10-02

Status: **review-approved as reported by Vlad; private and unpublished**.

In response to the exact question, “Have you and Dave both approved the exact
G03 r6 five-type accuracy claim and caveats in the private reviewer bundle?”,
Vlad replied in this conversation: “Approved by both”. This records Vlad's
report of joint approval of the existing bounded accuracy wording and caveats.
It is not an independently authenticated decision from Dave and does not
authorize publication, release, deployment, or a broader superiority claim.

The decision refers to these unchanged pre-decision artifacts (SHA-256 of the
repository files at the time of the reply):

| Exact artifact | SHA-256 |
| --- | --- |
| [Private reviewer bundle](G03-R6-REVIEW-BUNDLE.md) | `9d0806f6ac27e35200c8a95bdf70f99ce02b10cdcc8d5b05ba0ff62d96ea69c8` |
| [Product-card candidate](G03-R6-PRODUCT-CARD-CANDIDATE.md) | `5b63430546fc222fb7f6ec9e27d60fd559626b8e6862a418d25513aa07d9a3ed` |
| [Machine-readable review packet](G03-R6-REVIEW-PACKET-CANDIDATE.json) | `9f09c331ebf8d5567cb19245fab3dca096d20cfabbedce51ebd7ea2a1b92cb11` |

The packet's `approval_recorded: false` is its pre-decision snapshot, not the
current review state. This addendum supersedes that status without rewriting
the packet or its exact-claim hash.

The approved claim is accuracy superiority only on the prespecified 40-question,
five-type LongMemEval-S cohort with GLM-5.3-flash and an 8K request window:
ARE 22/40 versus sequential retained notes 5/40, paired difference +42.5
percentage points (stratified paired-bootstrap 95% interval +27.5 to +57.5).
The preference type was absent. There is no full-benchmark, all-model, cost,
speed, general-workflow, or broad ARE-product superiority finding. The
technical result and private receipt inventory remain in the
[result note](G03-R6-RESULT-NOTE.md).

This review approval does not establish that a sanitized public evidence
package is ready. Any product-page publication must separately check the
public payload, receipt links, privacy boundaries, and publication authority.

## Open Questions

- What sanitized public evidence package and product-page location should be
  proposed through the publication route?
- Is an independently attributable Dave approval record required for the
  eventual public release, beyond Vlad's report here?
