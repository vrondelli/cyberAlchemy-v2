# Current KEP deployment — 2026-09-06

Authorization: user requested "deploy the current version" following the tested clock-fix result. Target is the existing https://kep.cyberalchemylab.com deployment, root@187.77.248.154:/srv/kep-hosted-devnet. Operational-support lane, owner: this task acting on that explicit request; affected stage: deployed hosted application. No Git publication or broader infrastructure change.

Product frontier: current source includes console/security/persistence/clock changes. Source manifest freezes exact build inputs. Clock suite: 31 regular Rust tests, seven PostgreSQL tests, three real HTTP trials, 216 reconciled acknowledgements. Current npm checks and bundle/paper consistency rerun before build. Longer soak and slow-reader/disconnect coverage remain deferred construction validation, not a demonstrated capacity guarantee.

DAG: frozen inputs + UI checks -> container build -> transported image identity -> isolated restore and migration rehearsal -> stop live writer -> quiescent backup -> application-only replacement -> health/routes/database continuity checks -> execution receipt.

Keep database service/container/volume, environment, edge labels and domain identical. Rehearsal uses a new database in the existing private PostgreSQL service with no public listener, no public RPC and no user transaction. Database contents and credential-bearing files stay private on the VPS. Rehearsal database and backup remain retained; do not delete historical evidence.

Recovery: preserve previous Compose and a verified quiescent database dump. Migration 004 freezes legacy application_state and creates normalized state_documents. Binary-only rollback is unsafe. On effectful failure, stop the sequence and report the exact state; no automatic restore, rollback or deployment retry. A restore would require an explicit recovery decision and must account for writes after cutover.

Limitations: same-VPS backups are not an independent disaster recovery copy. No production-security, global clock synchronization, Mainnet or latency SLO claim. Existing keys, unrelated dirty files, alchLang and local preview are outside the change scope.
