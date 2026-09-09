export const stateMachines = [
  {
    "subject_ref": "GovernedDomainDescription",
    "states": [
      "draft",
      "reviewed",
      "accepted",
      "blocked"
    ],
    "transitions": [
      {
        "id": "GovernedDomainDescription-draft-reviewed",
        "subject_ref": "GovernedDomainDescription",
        "from_state_ref": "draft",
        "to_state_ref": "reviewed",
        "trigger_ref": null,
        "guard_rule_refs": [],
        "resulting_event_refs": [],
        "authority_boundary_ref": null
      },
      {
        "id": "GovernedDomainDescription-reviewed-accepted",
        "subject_ref": "GovernedDomainDescription",
        "from_state_ref": "reviewed",
        "to_state_ref": "accepted",
        "trigger_ref": null,
        "guard_rule_refs": [
          "MeaningIsClosed"
        ],
        "resulting_event_refs": [
          "DomainMeaningAccepted"
        ],
        "authority_boundary_ref": null
      },
      {
        "id": "GovernedDomainDescription-draft-blocked",
        "subject_ref": "GovernedDomainDescription",
        "from_state_ref": "draft",
        "to_state_ref": "blocked",
        "trigger_ref": null,
        "guard_rule_refs": [],
        "resulting_event_refs": [],
        "authority_boundary_ref": null
      },
      {
        "id": "GovernedDomainDescription-reviewed-blocked",
        "subject_ref": "GovernedDomainDescription",
        "from_state_ref": "reviewed",
        "to_state_ref": "blocked",
        "trigger_ref": null,
        "guard_rule_refs": [],
        "resulting_event_refs": [],
        "authority_boundary_ref": null
      }
    ]
  }
] as const;
