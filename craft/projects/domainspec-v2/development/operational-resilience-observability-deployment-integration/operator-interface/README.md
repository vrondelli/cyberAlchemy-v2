# ORODI local operator interface

This successor package defines the read-only local operator interface for the
existing ORODI canary lab. It projects the already adopted ORODI Product
Capabilities; it does not create or rewrite a Product Capability identity.

The interface combines bounded Prometheus metrics and structured operational
events into a provisioned Grafana view. Provisioned alert rules may evaluate
those metrics into normal, pending, firing, no-data, or error evidence for a
human operator. The local candidate has no notification contact point and may
not actuate a deployment, rollback, admission, promotion, or release.

All records in this package are candidates until the owning human accepts the
successor ontology and exact implementation binding. Local commissioning
evidence remains evidence, not admission or deployment authority.
