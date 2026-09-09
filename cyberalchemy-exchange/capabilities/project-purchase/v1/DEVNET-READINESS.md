# Devnet readiness envelope

Status: local compiled-program checks passed; deployment not performed. Owner: Exchange operator.
Sources and local checks: [README](README.md), [SBF report](evidence/sbf-test-report.json),
[completion evidence](evidence/sbf-completion.json).

The local preflight passed eight settlement tests for each mint configuration using
compiled KEP, purchase and bundled token programs under Agave 4.2.2. The shared
compiler lock is cargo-build-sbf 4.3.0 / platform-tools v1.57, targeting SBPF v3.
The original Agave 3.1.11 harness remains available for native regressions; its
ELF incompatibility is recorded in [compatibility evidence](evidence/sbf-runtime-compatibility.json).

## Remaining work before a Devnet submission

1. The exact deployment identities are now selected in [public.json](deployment/public.json).
   Both programs were rebuilt and all eight SBF settlement tests passed against
   those identities. The [envelope](deployment/envelope.json) binds the profile,
   sources, binary hashes and test report. Local/legacy IDs remain the defaults.
2. The dated [Devnet preflight](deployment/preflight.json) confirmed the genesis,
   unused program addresses, active SBPF v3 feature and valid Devnet USDC mint.
   Local tests still do not establish complete target-cluster execution equivalence.
3. Fund the selected fee payer, set a transaction-fee ceiling, and verify a deployment
   executor. At the recorded preflight the balance was zero; conservative rent was
   2.35636816 Devnet SOL including staging buffers, with transaction fees additional.
   Refresh the preflight and review the [deployment plan](deployment/PLAN.md).
4. Prepare a dedicated PostgreSQL database and recovery/backup policy. Verify
   operator recovery using the release key and ciphertext storage after restart.
5. Obtain authorization for that concrete deployment envelope. Then execute one
   Devnet purchase, one refund and one recovery with independent participant keys,
   retaining signatures, finalized slots, balances and verified original file digest.

## Prepared launcher

After the exact programs are deployed and reviewed, the Devnet-only server accepts:

```sh
EXCHANGE_DATABASE_URL='postgresql://localhost/exchange' \
./cyberalchemy-exchange/run serve-devnet
```

The launcher binds loopback by default, verifies the Devnet genesis hash and uses
finalized account reads. Unknown submission outcomes remain pending for chain
reconciliation. Mainnet, TLS exposure, publishing, upgrades and external spending
are not authorized by the local tests or this document.

## Open Questions

Upgrade-authority custody, transaction-fee ceiling, operational retention,
real-money wrong-envelope handling and public fee policy remain open. The complete
question owner is the [purchase plan](../../../plans/purchase-v1/SOLANA-USDC-PLAN.md#open-questions).
