---
document_id: cav2-domainspec-v2-architecture-entry/v1
status: candidate-successor
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# DomainSpec v2 Architecture

This is the proposed CyberAlchemy architecture home for DomainSpec v2.

- [SYSTEM-ARCHITECTURE.md](SYSTEM-ARCHITECTURE.md) is the stable product/system map.
- [MIGRATION-CONTRACT.md](MIGRATION-CONTRACT.md) defines how authority and implementation may move without
  invalidating frozen evidence.
- [`../../inventory/domainspec-v2/`](../../inventory/domainspec-v2/) records the exact source snapshot and risks.

The current architecture authority remains `projects/domainspec-v2/ARCHITECTURE.md` at inventoried SHA-256
`c9e26cd91b8795ce768e842106c78bec0d180941a86dd2cee612799bba853f35` until a successor baseline is accepted.

## Open Questions

The migration decision determines whether this package is an entry surface or the full successor authority home.
