# Durable shipment operation with a transactional Outbox

This example models a shipment confirmation whose state change and integration
message must be committed atomically to the same SQLite database.

```alchlang
domain durable-shipment-outbox "Durable shipment Outbox"
owner fulfillment-domain-owner

entity Shipment:
  shipmentId: identifier required
  status: string required
  outboxMessageId: identifier required
  occurredAt: timestamp required
  payload: record required

entity OutboxMessage:

actor FulfillmentService

states Shipment:
  initial pending
  pending -> confirmed when shipment-pending emits shipment-confirmed

rule shipment-pending:
  status == pending

boundary shipment-transaction-authority:
  owner fulfillment-domain-owner

permission confirm-shipment-with-outbox:
  actor FulfillmentService
  action ConfirmShipment
  when shipment-pending
  boundary shipment-transaction-authority

effect PersistShipmentWithOutbox:
  pattern transactional-outbox
  binding sqlite-transactional-outbox
  writes Shipment, OutboxMessage
  emits shipment-confirmed
  guarantee atomic-state-and-outbox
  on-failure rollback
  boundary shipment-transaction-authority

action ConfirmShipment:
  actor FulfillmentService
  subject Shipment
  input shipmentId, outboxMessageId, occurredAt, payload
  requires shipment-pending
  permission confirm-shipment-with-outbox
  boundary shipment-transaction-authority
  emits shipment-confirmed
  performs PersistShipmentWithOutbox using sqlite-transactional-outbox

event shipment-confirmed:
  subject Shipment
  payload shipmentId, outboxMessageId, occurredAt, payload
  boundary shipment-transaction-authority

example pending-shipment:
  kind positive
  expected confirmed-with-outbox-message
  rules shipment-pending
```
