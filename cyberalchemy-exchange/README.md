# CyberAlchemy Exchange

CyberAlchemy Exchange is the general trading-network product. KEP is its
internal protocol for knowledge/project versions, encrypted access and
co-ownership. Inference is another offering type in the wider product scope.

## Contents

- [knowledge-exchange-protocol/](knowledge-exchange-protocol/README.md) — the
  existing KEP package, including definitions, models, code, tests and evidence.
- [Product decisions](../define/reviews/cyberalchemy-exchange/INTAKE.md) — selected
  scope, purchase behavior and remaining questions.
- [Purchase design](../define/reviews/cyberalchemy-exchange/DECRYPTION-SETTLEMENT-DESIGN.md)
  — escrow, Unlock, cancellation, internal KEP delivery and recovery.
- [Relocation](RELOCATION.md) — physical layout and compatibility evidence.

The [purchase prototype](capabilities/project-purchase/v1/README.md) now implements
Solana escrow, atomic KEP grants/payments, multiple buyers, API and browser signing,
and encrypted delivery recovery. It is tested locally with valueless tokens and
PostgreSQL. KEP encryption and canonical definitions remain unchanged; its chain
implementation has an additive v2 membership format. No public deployment or
complete general marketplace is claimed.

```sh
./cyberalchemy-exchange/run bootstrap
./cyberalchemy-exchange/run build
./cyberalchemy-exchange/run check
EXCHANGE_DATABASE_URL='postgresql://localhost/exchange_test' ./cyberalchemy-exchange/run demo
```

See the [test report](capabilities/project-purchase/v1/evidence/test-report.json)
and [Devnet readiness](capabilities/project-purchase/v1/DEVNET-READINESS.md).

## Purchase analysis and plan

The [implementation analysis](plans/purchase-v1/ANALYSIS.md) identifies KEP reuse
and commercial gaps. The current [Solana + USDC plan](plans/purchase-v1/SOLANA-USDC-PLAN.md)
stages atomic grant/payment tests, multiple buyers, escrow, delivery recovery and
an API-first local product before Devnet. The [earlier plan](plans/purchase-v1/PLAN.md)
preserves the mock-first proposal and baseline check limits.

## Local checks

From the cyberAlchemy-v2 checkout:

```sh
python3 cyberalchemy-exchange/knowledge-exchange-protocol/validate.py
python3 cyberalchemy-exchange/knowledge-exchange-protocol/white-paper/v1/validate.py
tools/toolchain/run cargo metadata --offline --no-deps --format-version 1 --manifest-path cyberalchemy-exchange/knowledge-exchange-protocol/runtime/Cargo.toml
```

The first two checks already report source drift; see [relocation evidence](RELOCATION.md).

## Open Questions

Product questions belong to the [Exchange intake](../define/reviews/cyberalchemy-exchange/INTAKE.md#open-questions).
Current settlement decisions and remaining purchase questions are tracked in the
[Solana + USDC plan](plans/purchase-v1/SOLANA-USDC-PLAN.md#open-questions).
Existing validation drift and legacy-path retirement are tracked in [relocation notes](RELOCATION.md#open-questions).
