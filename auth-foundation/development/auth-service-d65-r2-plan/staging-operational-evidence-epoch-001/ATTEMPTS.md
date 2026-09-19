# Staging evidence attempt ledger

- The first predecessor app launch reached health 200 but was not persistent after
  its shell closed. It is superseded by the supervised systemd deployment.
- The predecessor HTTPS live test passed 6 of 10 checks. Its browser assumptions
  conflict with the deployed durable MFA profile, and its repeat-setup path
  recreated Keycloak without the durable overlay. This is preserved as a
  diagnostic and excluded from the durable staging denominator.
- The durable overlay was restored. The supervised deployment, verified HTTPS
  readiness, cold-start recovery, killed-worker recovery, and proxy fault
  campaign passed.

`authority_effect: none`

## Open Questions

See [README.md](README.md#open-questions).
