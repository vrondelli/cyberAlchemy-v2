export const effectContracts = [
  {
    "id": "PersistOrderWithOutbox",
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
    "authority_boundary_ref": "order-transaction-authority"
  }
] as const;
