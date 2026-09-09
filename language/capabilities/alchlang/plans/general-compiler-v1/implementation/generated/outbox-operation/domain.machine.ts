export const stateMachines = [
  {
    "subject_ref": "OrderOperation",
    "states": [
      "pending",
      "committed"
    ],
    "transitions": [
      {
        "id": "OrderOperation-pending-committed",
        "subject_ref": "OrderOperation",
        "from_state_ref": "pending",
        "to_state_ref": "committed",
        "trigger_ref": null,
        "guard_rule_refs": [
          "operation-pending"
        ],
        "resulting_event_refs": [
          "outbox-message-recorded"
        ],
        "authority_boundary_ref": null
      }
    ]
  },
  {
    "subject_ref": "OutboxMessage",
    "states": [],
    "transitions": []
  }
] as const;
