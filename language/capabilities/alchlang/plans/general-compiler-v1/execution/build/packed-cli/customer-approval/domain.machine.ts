export const stateMachines = [
  {
    "subject_ref": "Customer",
    "states": [
      "pending",
      "approved",
      "rejected",
      "released"
    ],
    "transitions": [
      {
        "id": "Customer-pending-approved",
        "subject_ref": "Customer",
        "from_state_ref": "pending",
        "to_state_ref": "approved",
        "trigger_ref": null,
        "guard_rule_refs": [],
        "resulting_event_refs": [],
        "authority_boundary_ref": null
      },
      {
        "id": "Customer-pending-rejected",
        "subject_ref": "Customer",
        "from_state_ref": "pending",
        "to_state_ref": "rejected",
        "trigger_ref": null,
        "guard_rule_refs": [],
        "resulting_event_refs": [],
        "authority_boundary_ref": null
      },
      {
        "id": "Customer-approved-released",
        "subject_ref": "Customer",
        "from_state_ref": "approved",
        "to_state_ref": "released",
        "trigger_ref": null,
        "guard_rule_refs": [
          "approved-release"
        ],
        "resulting_event_refs": [
          "credit-released"
        ],
        "authority_boundary_ref": null
      }
    ]
  }
] as const;
