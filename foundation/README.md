# CyberAlchemy Foundation candidate

This package is the additive, effect-free Foundation vertical for the
CyberAlchemy-v2 Tauri Workspace. It composes existing mechanisms around the
CyberAlchemy Lab meaning of **Capability Instance**; it does not copy Lab
authority or redefine a Capability Instance as an add-on.

The package is deliberately a product-construction candidate:

- Lab definition records remain read-only sources with exact digests.
- CyberAlchemy-v2 `CAV2-D67` remains the parent Product Capability reference.
- evaluation produces candidate evidence, never approval, admission, grant,
  activation, publication, release, deployment, or a host execution receipt.
- adapters are pure ports. Existing owners retain effect and receipt authority.

Run `npm test` and `npm run validate`. Run `npm run generate` after changing the
candidate; the Workspace runs the corresponding check during its Foundation
test suite.

The current vertical is intentionally effect-free. It proves that the
Workspace can materialize, inspect, and preflight a version-exact Capability
Instance while failing closed on identity, lifecycle, grant, source, and host
claim drift. A later owner decision is required before binding an effectful
Tauri command.
