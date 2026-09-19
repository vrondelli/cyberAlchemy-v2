# WP-SFC-001 source-binding refresh

The one stale Work Pack binding now points at the live `impl/package.json` bytes.
All 12 bindings rehash exactly, and the live target equals its staged postimage.

- Result: pass
- Changed target: `work-pack/shared/SOURCE-BINDINGS.json`
- Package binding: `c36f88e...` -> `f5d68ea...`
- Handoff Notice: `HN-0BC27FA33E37`
- Next route: `SWU-SFC-001`
- Authority effect: none

The refresh does not change Design selections or admit the missing 13/16 profile.
`SFC-PR-001` therefore remains a hard stop before SWU-SFC-004.
