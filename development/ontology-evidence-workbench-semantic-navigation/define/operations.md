# Operations: OEW Semantic Navigation

## AdmitProjectProfile

**Actor:** project profile owner
**Input:** frozen profile, baseline manifest, admitted graph/sidecar handles
**Rules:** all digests match; context, predicate, Path, count, icon, copy and
ceiling fields are explicit; owner-pending fields block their dependent UI
behavior; profile data cannot mutate source ontology.
**Postcondition:** one immutable profile handle is available to pure
presentation derivations.

## DeriveRelationPresentation

**Actor:** OEW presentation adapter
**Input:** exact admitted edge, project relation mapping, active scene
**Ordered rules:**

1. Preserve graph edge ID, source relation ID, endpoints, exact predicate,
   source direction, provenance and source authority.
2. Look up color by exact `sourcePredicate` and pattern by
   `presentationRelation`; missing mappings fail closed.
3. Derive projected direction without overwriting source direction.
4. Add traversal orientation only for Path hops.
5. Emit visible and accessible text sufficient without color or hover.

**Postcondition:** one lossless, authority-none relation presentation record.

## EnterProjectedCluster

**Actor:** reviewer
**Input:** admitted profile, portal ID, current navigation frame
**Rules:** destination is profile-approved; source evidence is named; current
frame and invoker are pushed; result announces projected scope and non-
membership ceiling.
**Transition:** `NavigationState: home|cluster -> cluster`.

## RestoreNavigationFrame

**Actor:** reviewer
**Triggers:** Back, Close, Escape, cancel, or completed transient action
**Rules:** restore prior scope, filter, selection, direction and focus when the
invoker exists; otherwise focus the restored scene heading and announce the
fallback. Responsive dimension change permits one zero-duration reflow.

## ApplyAccessibleControlContract

**Actor:** OEW UI renderer
**Rules:** inert graph geometry is outside sequential focus; actionable edge
instances have visible focus and declared activation; one mode is selected and
owns a named result; modal/disclosures own focus and state; named text reaches
4.5:1 and required graphical boundaries 3:1; icons are redundant with text.

## RunComparableQualityLoop

**Actor:** UX evidence owner
**Input:** unchanged profile/scenario/runtime policy and current build
**Rules:** replay every frozen task/control/state/mode cell; retain original
evidence class and scope; emit atomic deltas and residue; never aggregate a
universal score or convert deterministic reachability into human evidence.
**Postcondition:** one digest-bound quality delta receipt.
