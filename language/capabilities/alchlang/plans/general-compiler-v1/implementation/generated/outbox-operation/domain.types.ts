export interface OrderOperation {
  "operationId": string;
  "orderId": string;
  "status": string;
  "outboxMessageId": string;
  "occurredAt": string;
  "payload": Readonly<Record<string, unknown>>;
}

export interface OutboxMessage {
  "operationId": string;
  "orderId": string;
  "status": string;
  "outboxMessageId": string;
  "occurredAt": string;
  "payload": Readonly<Record<string, unknown>>;
}
