# C06 diagnostics, currentness and publication safety

Date: 2026-09-20. Status: C06 scoped construction complete. Authority effect:
none.

## Currentness receipt

Every public `application-v1` check now emits one deterministic
`alchlang.application-currentness-receipt/v1-candidate`. The receipt binds:

- the exact authored source digest;
- the ordered selected-input inventory and count;
- the compiled DomainSpec source manifest;
- the executable trace;
- the optional multi-entry manifest;
- the optional whole-application and provider-application plans;
- an explicit unsupported-residue array; and
- the non-authorizing authority posture.

The check report includes the receipt and its SHA-256. The build manifest binds
that receipt together with source, input, domain-manifest and executable-trace
identities. A fresh check, build or verify therefore reforms currentness from
selected inputs rather than trusting the output manifest.

The current closed application profile reports zero unsupported residue.
Unsupported syntax and inputs reject with causal diagnostics; they are not
silently omitted from a successful build.

## Adversarial denominator

The closed `c06-adversarial-cases.json` corpus contains 16 obligations across:

- source admission;
- selected-input loading and currentness;
- publication preflight;
- publication sealing;
- exact output verification; and
- complete-build repeatability.

It covers unsupported declarations, invalid UTF-8, stale source and selected
inputs, escaping and symlink references, traversal and reserved device names,
case/NFKC aliases, file/directory aliases, an existing destination, late drift,
root replacement, generated-output drift and two complete identical builds.
All 16 pass with no skip.

Portable output identity uses NFKC plus case normalization. Complete path
prefixes participate, so case, compatibility-Unicode and file/directory aliases
reject before destination creation.

## Publication behavior

Publication remains exclusive and no-overwrite. It validates the complete path
set before creating the destination, rechecks input currentness before writing,
writes the completion manifest last, verifies all pre-manifest bytes, and checks
currentness again after sealing.

On failure, cleanup removes only unchanged owned inodes. A foreign replacement
or edit is preserved, but it does not receive a completion manifest. Existing
destinations are never overwritten. Exact verification rejects missing,
changed, extra, linked or replaced output.

## Repeatability evidence

The focused deterministic fixture produced two byte-identical 21-file output
inventories. Both builds emitted manifest SHA-256
`3740cfbc769c5bd17f02ee2ab6a86c127f750da8ee94e2a0c7982c68f6c670a5`
and currentness-receipt SHA-256
`c00e56d061db9fbb14923e5d3fce09867e932492530e1fe22b849eb1fdf205ff`.

The complete serial adjacent application regression passes 108/108 with zero
skip. A prior parallel attempt terminated with status 143 before terminal test
totals and is explicitly not completion evidence.

## Claim ceiling

This proves local application source admission, selected-input currentness,
deterministic complete builds, portable output identity, exclusive publication
and exact output verification. It does not prove installed-package behavior,
provider operation, product approval, publication authorization, release,
deployment or production readiness.

## Open Questions

L2X owns the joined L2 completion record. P02 owns installed and clean-consumer
hostile cases.
