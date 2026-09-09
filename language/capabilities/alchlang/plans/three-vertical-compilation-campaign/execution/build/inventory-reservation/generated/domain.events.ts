export const eventContracts = {
  "inventory-reserved": {
    "eventType": "inventory-reserved",
    "version": 1,
    "payload": [
      "stock-item-id",
      "request-key",
      "quantity"
    ]
  },
  "reservation-released": {
    "eventType": "reservation-released",
    "version": 1,
    "payload": [
      "stock-item-id",
      "request-key",
      "quantity"
    ]
  }
} as const;
