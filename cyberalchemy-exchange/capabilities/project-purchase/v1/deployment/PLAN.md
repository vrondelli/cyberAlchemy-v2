# Devnet identity and deployment preparation

Status: owner-directed local implementation; no deployment authorization.
Owner: Exchange operator. Construction chain: [candidate binding](../construction.json).

## Product work

1. Generate separate program, upgrade, fee-payer, release and staging-buffer keys.
   Keep private files outside Git; retain only addresses in [public.json](public.json).
   Preparation is repeatable and rejects missing keys for an existing profile.
2. Select program IDs through the `devnet-deployment` build feature. Preserve the
   existing KEP and purchase IDs for local/legacy builds. Bind server transactions
   and the release signer to the same public profile.
3. Build both programs with those exact IDs and the Devnet mint. Run all eight
   settlement tests against the resulting SBF binaries. Keep source/profile/binary
   hashes in [the deployment test report](../evidence/deployment-sbf-test-report.json).
4. Read Devnet genesis, runtime version, SBPF v3 activation, mint state, account
   availability, fee-payer balance and rent requirements. Retain the dated
   [preflight](preflight.json) and [deployment envelope](envelope.json).

```sh
./cyberalchemy-exchange/run prepare-devnet
./cyberalchemy-exchange/run build-deployment
./cyberalchemy-exchange/run check-deployment
./cyberalchemy-exchange/run preflight-devnet
./cyberalchemy-exchange/run envelope-devnet
```

The key directory defaults to
`${XDG_DATA_HOME:-~/.local/share}/cyberalchemy/exchange/devnet-purchase-v1`.
It is mode 0700 and keys are mode 0600. `EXCHANGE_DEPLOYMENT_KEY_DIR` can select a
different private directory; an existing public profile must match its keys.
The public profile is a proposed local operator setup, not a production custody
or recovery policy. No private key bytes appear in the deployment envelope.

## Operational tasks and owners

- Exchange operator: preserve/back up the private keys and decide the eventual
  upgrade-authority custody policy before public use.
- Exchange operator: fund the selected fee payer with Devnet test SOL and set an
  explicit transaction-fee ceiling. Rent estimates include staging buffers and
  are conservative; they do not include transaction fees or imply an approved spend.
- Deployment owner: review exact hashes, IDs, authorities and a fresh preflight,
  then authorize the concrete deployment. Install/verify the matching Solana CLI
  or transaction executor as part of that separately scoped deployment step.
- Service operator: provision PostgreSQL and a backup/retention policy. After
  deployment, `EXCHANGE_DATABASE_URL=... ./cyberalchemy-exchange/run serve-devnet`
  uses the selected public bindings and local release key. Starting the service
  does not deploy its programs.

The current product frontier is the bound, locally tested Devnet candidate.
Funding, executor setup and deployment authorization block chain submission;
they do not block local construction. Tenant/identity expansion, seller delegation,
public fees, retention promises and real-money delivery correctness remain deferred.

## Open Questions

Who will hold the upgrade authority beyond this local operator setup, and what
transaction-fee ceiling should the deployment use? Key recovery, service retention
and real-money invalid-envelope handling remain owned by the
[readiness checklist](../DEVNET-READINESS.md#open-questions).

Protocol references: [Solana deployment and authorities](https://solana.com/docs/programs/deploying),
[rent-exemption RPC](https://solana.com/docs/rpc/http/getminimumbalanceforrentexemption).
