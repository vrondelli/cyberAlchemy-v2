# WP-RMT-002 validator repair exact-byte acceptance

## Decision

Should the exact validated one-target repair package be accepted and applied, or remain staged?

## Options

1. `ACCEPT-ONE-TARGET-REPAIR` — accept receipt `dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18` and inventory `f215bfcc08ac47c70e11ab0a27c32dc23ed04a48788ef1dae76ff4442e1ecfb7`, then authorize the reversible one-target apply and post-apply validation.
2. `DEFER-ONE-TARGET-REPAIR` — keep the validated candidate staged; do not change the live validator and keep the 70-SWU Work Pack blocked.

## Status

- Selected option: `ACCEPT-ONE-TARGET-REPAIR`
- Source: exact current user response `ACCEPT-ONE-TARGET-REPAIR`
- Accepted at: `2026-08-16T11:01:47Z`
- Consequential mutation: admitted only for the exact one-target apply and its post-apply validation
- Authority effect: none
- Explain / more context: available and non-committal

## Bound evidence

- Repair receipt: `projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260815T214711Z-wp-rmt-001-ontology-v2-validator-repair-package/REPAIR-PACKAGE-RECEIPT.json`
- Receipt SHA-256: `dda3c156f86f3813311892bc8f04e969f669b65171f7a16d79da41cf1a2beb18`
- Pre-receipt inventory SHA-256: `f215bfcc08ac47c70e11ab0a27c32dc23ed04a48788ef1dae76ff4442e1ecfb7`
- Live target preimage SHA-256: `2b27e0861740600a46be207e72d4a385fc82081e82ed5e42e2eed486092b322e`
- Staged postimage SHA-256: `985e4c5404fb7037b2aecf282e9cb05ebe129ae08cd6d6093a3d018c2bcf522c`
