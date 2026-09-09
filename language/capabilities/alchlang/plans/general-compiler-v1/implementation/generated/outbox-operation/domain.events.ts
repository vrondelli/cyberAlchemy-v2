export const eventContracts = [
  {
    "id": "outbox-message-recorded",
    "payload_facts": [
      "operationId",
      "orderId",
      "outboxMessageId",
      "occurredAt",
      "payload"
    ],
    "authority_boundary_ref": "order-transaction-authority"
  }
] as const;
