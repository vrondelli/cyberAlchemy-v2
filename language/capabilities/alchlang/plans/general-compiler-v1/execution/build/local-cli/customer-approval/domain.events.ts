export const eventContracts = [
  {
    "id": "credit-released",
    "payload_facts": [
      "customerId",
      "amount"
    ],
    "authority_boundary_ref": "credit-release-authority"
  }
] as const;
