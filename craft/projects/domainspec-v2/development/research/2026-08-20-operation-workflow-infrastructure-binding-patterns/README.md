# Operation, Workflow, and Infrastructure-Binding Pattern Research

Status: compact Research Tower complete; local-only

Checked: 2026-08-20

Authority effect: none

Preset: compact

## Outcome

This research does not recommend an Operation-only enforcement system.
It recommends one APE realization mechanism with subject-specific property sets:

- an `Operation` profile for one state-changing domain outcome, rule gating,
  dependency-specific effect contracts, and bounded transactional work;
- a `Workflow` profile for ordered coordination of Operations or nested
  Workflows, explicit outcomes, failure routing, continuation, compensation,
  and—when durable—checkpoint/replay constraints;
- a join from those implementation obligations to existing or proposed
  infrastructure-binding records only where an infrastructure guarantee is
  actually claimed.

The TypeScript projection uses higher-order-function construction and
structural types. It introduces no DI framework, decorator container, service
locator, or universal code-level `Port` abstraction. Dependency contracts are
named for their roles: `Repository`, `UnitOfWork`, `Transporter`,
`EventHandler`, `WorkflowStore`, `Scheduler`, `Clock`, system-specific client,
codec, hasher, or generator.

## Navigation

| Artifact | Purpose |
| --- | --- |
| [TOWER.md](TOWER.md) | research question, compositional spine, and non-collapse rules |
| [levels/L0-corpus.md](levels/L0-corpus.md) | exact local and primary-source claim ledger |
| [levels/L1-residue-map.md](levels/L1-residue-map.md) | property and infrastructure-binding gap map |
| [levels/L2-closure-plan.md](levels/L2-closure-plan.md) | recommended bounded Work Pack decomposition |
| [GLOSSARY.md](GLOSSARY.md) | local definitions, status, and misuse warnings |
| [DECISIONS.md](DECISIONS.md) | borrow, block, defer, and promotion decisions |
| [learning-pack.md](learning-pack.md) | final operator model and worked mappings |
| [gates/closure-gates.md](gates/closure-gates.md) | structural and evidence closure checks |
| [residue/open-residue.md](residue/open-residue.md) | unresolved authority and implementation decisions |
| [lanes/LEDGER.md](lanes/LEDGER.md) | bounded helper closeout ledger |

## Reading rule

`current-source` means the proposition is present in the cited current local
artifact. It does not erase that artifact's candidate lifecycle or create
semantic authority. `local-inference` and `operator-reading` are research
interpretations. `open-residue` is unresolved. The Operation-internal findings
are especially constrained: their terminal audit is `BLOCK`, so this tower may
reuse their bounded distinctions but must not call that artifact accepted.

## Claim ceiling

This tower recommends a candidate architecture and Work Pack shape only. It
does not alter DomainSpec definitions, activate an APE profile, repair or accept
the blocked Operation research, admit the system-integration namespace, select
a provider, implement an analyzer or adapter, prove persistence, transaction,
delivery, replay, or workflow correctness, or authorize promotion, publication,
release, deployment, or production use.
