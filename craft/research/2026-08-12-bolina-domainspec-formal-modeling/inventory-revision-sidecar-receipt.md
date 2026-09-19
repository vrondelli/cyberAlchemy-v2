# Inventory Revision Sidecar Receipt

Status: resolved proposal; apply remains owner-gated

## Root Cause

The Inventory `append` runtime is intentionally append-only. A normalized record that reuses an existing ID with different fields deterministically returns `id-conflict` / `existing-id-differs`; no supported in-place update path exists.

## Affected Invariant

Stable Inventory IDs are immutable identities. A revised synthesis cannot reuse the original ID/path, and machine/human projections must be generated together from one validated candidate.

## Minimal Repair

Preserve the original indexed row and stage the revision as:

- ID: `bolina-domainspec-formal-modeling-research-strategy-result-synthesis-r2`
- Path: `entries/bolina-domainspec-formal-modeling-research-strategy-result-synthesis-r2.md`

The `-r2` candidate must return `dry-run-ready` before any apply. Apply remains owner-gated.

## Changed-Byte Inventory

The sidecar itself changed no files. The staged repair creates only the new `-r2` entry and record. A later successful apply may change only `.arcanum/inventory/index.json` and `.arcanum/inventory/index.md`; the original entry/index row, research bindings, and projections must not be hand-edited.

## Required Revalidation

- Run Inventory append in dry-run and require `status: dry-run-ready`.
- Run `append-dry-run.test.cjs` and `append-apply.test.cjs`.
- After an authorized apply, run `validate-index-json.sh` and require lookup readiness `ready`, no introduced blocking failures, exact post-write digests, and an apply receipt listing only `index.json` and `index.md`.

## Renewed Owner Acceptance

The accepted sheet, material strategy, and supplied-brief bindings need no renewal if their bytes remain unchanged. The new `-r2` entry/record and resulting projection digests are fresh acceptance-bound bytes and require owner acceptance before apply.

## Permanent Regression Fix

Add a fixture proving that a differing same-ID record remains a mutation-free conflict while the same revision under a new versioned ID/path becomes `dry-run-ready`, applies as a second entry, and leaves the original row byte-equivalent. Document this versioned-revision route beside append-conflict behavior.
