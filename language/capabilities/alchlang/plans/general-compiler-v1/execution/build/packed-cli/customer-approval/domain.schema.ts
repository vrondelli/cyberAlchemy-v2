export const factModel = [
  {
    "id": "Customer",
    "fields": [
      {
        "id": "customerId",
        "type": "identifier",
        "required": true,
        "owner": "customer-domain-owner"
      },
      {
        "id": "riskScore",
        "type": "integer",
        "required": true,
        "owner": "customer-domain-owner"
      },
      {
        "id": "status",
        "type": "string",
        "required": true,
        "owner": "customer-domain-owner"
      },
      {
        "id": "amount",
        "type": "decimal",
        "required": true,
        "owner": "customer-domain-owner"
      }
    ]
  }
] as const;
