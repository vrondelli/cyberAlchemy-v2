export interface OutboxMessage {
  readonly messageId: string;
  readonly eventType: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}
export interface AtomicStateAndOutboxRequest {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly state: Readonly<Record<string, unknown>>;
  readonly expectedVersion: number;
  readonly messages: readonly OutboxMessage[];
}
export interface PendingOutboxMessage extends OutboxMessage {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly attempts: number;
}
export interface TransactionalOutboxPort {
  commit(request: AtomicStateAndOutboxRequest, failpoint?: "after-state-write"): void;
  pending(limit?: number): readonly PendingOutboxMessage[];
  markPublished(messageId: string): void;
  markFailed(messageId: string, error: string): void;
}
export interface OutboxTransport { publish(message: PendingOutboxMessage): Promise<void>; }
export const transactionalOutboxContract = {
  "effect_id": "PersistOrderWithOutbox",
  "pattern_ref": "transactional-outbox",
  "integration_binding_ref": "sqlite-transactional-outbox",
  "write_refs": [
    "OrderOperation",
    "OutboxMessage"
  ],
  "event_refs": [
    "outbox-message-recorded"
  ],
  "guarantee": "atomic-state-and-outbox",
  "failure_continuation": "rollback",
  "authority_boundary_ref": "order-transaction-authority",
  "delivery": "at-least-once"
} as const;
