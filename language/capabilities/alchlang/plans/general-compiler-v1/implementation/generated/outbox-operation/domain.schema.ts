export const factModel = [
  {
    "id": "OrderOperation",
    "fields": [
      {
        "id": "operationId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "orderId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "status",
        "type": "string",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "outboxMessageId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "occurredAt",
        "type": "timestamp",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "payload",
        "type": "record",
        "required": true,
        "owner": "order-domain-owner"
      }
    ]
  },
  {
    "id": "OutboxMessage",
    "fields": [
      {
        "id": "operationId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "orderId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "status",
        "type": "string",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "outboxMessageId",
        "type": "identifier",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "occurredAt",
        "type": "timestamp",
        "required": true,
        "owner": "order-domain-owner"
      },
      {
        "id": "payload",
        "type": "record",
        "required": true,
        "owner": "order-domain-owner"
      }
    ]
  }
] as const;
