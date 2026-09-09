// Provider binding generated from the exact sqlite-transactional-outbox effect.
export {
  CollectingOutboxTelemetry,
  DurableOutboxWorker,
  DurableSqliteTransactionalOutbox,
  FetchOutboxHttpClient,
  HttpOutboxTransport,
  SqliteIdempotentInbox
} from "@cyberalchemy/domainspec-cli-candidate";
export type {
  DurableCommitRequest,
  DurableOutboxRecord,
  DurableOutboxTransport,
  DurableWorkerOptions,
  OutboxTelemetrySink
} from "@cyberalchemy/domainspec-cli-candidate";
export const providerBinding = {
  "binding": "sqlite-transactional-outbox",
  "schema_version": 2,
  "dispatch": "claim-lease-at-least-once",
  "retry": "bounded-exponential-dead-letter",
  "consumer": "sqlite-transactional-inbox",
  "network": "explicit-confirmed-allowlisted-http"
} as const;
