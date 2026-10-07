export function requirementPostureView(value) {
  if (value?.status === "enabled" && value.source === "managed-gateway-startup") {
    return {status: "enabled", open: true,
      text: "Requirement tracking is on for this managed session. A new objective needs an explicit list; continuations retain the current list."};
  }
  if (value?.status === "disabled" && value.source === "managed-gateway-startup") {
    return {status: "disabled", open: false,
      text: "Requirement tracking is off for this managed session. This form cannot turn it on; leave the list unconfirmed."};
  }
  return {status: "unverified", open: false,
    text: "Requirement-tracking status is unverified. ARE will block a new tracked objective before a model turn if its explicit list is missing."};
}
