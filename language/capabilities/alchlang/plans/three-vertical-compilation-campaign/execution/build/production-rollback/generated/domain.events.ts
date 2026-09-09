export const eventContracts = {
  "rollback-started": {
    "eventType": "rollback-started",
    "version": 1,
    "payload": [
      "service-id",
      "target-revision"
    ]
  },
  "rollback-completed": {
    "eventType": "rollback-completed",
    "version": 1,
    "payload": [
      "service-id",
      "target-revision"
    ]
  },
  "rollback-outcome-uncertain": {
    "eventType": "rollback-outcome-uncertain",
    "version": 1,
    "payload": [
      "service-id",
      "target-revision",
      "observation"
    ]
  }
} as const;
