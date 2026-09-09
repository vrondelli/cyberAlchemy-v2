# Craft ORODI definition reconciliation

The ten CAV2-D83 through CAV2-D92 sections are reconstructed from the unchanged
promotion selection, original definition pack, and three selected R1 revisions.
All five source voices are preserved verbatim. The canonical index is synchronized.

[Manifest](manifest.json) binds the sources and reconstructed selectors.
[Language v3](language-v3.json) is the immutable semantic candidate; the separate
[admission decision](admission.json) records its admitted use inside Craft ORODI.
The six existing Product Capability identities remain unchanged.

Run `python3 cyberAlchemy-v2/product/craft/capabilities/orodi/definition-reconciliation/validate.py`.

## Scope and frontier

This resolves canonical-definition reconciliation, an operational-support task
affecting the definitions stage. Candidate Alch event and observation work remains
runnable. Broader ontology/profile conformance and runtime effects are not admitted
by this semantic decision. Historical v2 whole-file bindings remain historical;
consumers need explicit migration before relying on the current v3 projection.

## Open Questions

The precise historical omission cause is unknown. Which observation profile and
correlation contract should Alch-generated adapters target?

## Broader validation residue

The focused semantic validator passes. The existing full capability validator
reports digest drift in its historical source/selection bindings, including the
canonical definitions, Craft thesis, and Craft Project. See
[full package result](package-validation.json). These bindings require separate
source reconciliation; they are not made current by the semantic admission.
