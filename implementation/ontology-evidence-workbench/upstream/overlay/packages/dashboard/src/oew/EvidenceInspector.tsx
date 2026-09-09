// @ts-nocheck
import "./inspector.css";

const Field = ({label, value, mono = false}) => (
  <div className="oew-inspector-field">
    <dt>{label}</dt>
    <dd className={mono ? "oew-mono" : undefined}>{value ?? "not applicable"}</dd>
  </div>
);

export function inspectorModel(entry) {
  if (!entry) return null;
  const row = entry.row;
  const projection = entry.relationProjection;
  return {
    sourceRef: projection?.ref.source_relation_id ?? entry.sourceRef,
    kind: entry.kind === "edge" ? "Exact relation" : row.source_kind,
    relation: projection?.predicate ?? row.source_relation ?? null,
    relationId: projection?.ref.source_relation_id ?? null,
    sceneDigest: projection?.ref.scene_digest ?? null,
    relationDigest: projection?.relation_digest ?? null,
    sourceDirection: projection?.source_direction ?? null,
    directionText: projection?.encoding.direction_text ?? null,
    endpoints: projection?.endpoints
      ? `${projection.endpoints.source_node_id} → ${projection.endpoints.target_node_id}`
      : null,
    presentationRelation:
      projection?.display_cues.presentation_family ??
      row.presentation_relation ??
      null,
    mappingLoss: projection?.mapping_loss ?? row.mapping_loss,
    disposition: row.policy_disposition ?? null,
    diagnostics: row.diagnostics ?? [],
    path:
      projection?.evidence_refs?.join(" · ") ??
      row.source_path ??
      row.evidence_refs?.join(" · "),
    digest: row.source_digest ?? null,
    grounding: row.grounding_inclusion ?? null,
    authorityEffect: projection?.authority_effect ?? row.authority_effect,
    colorToken: projection?.encoding.color_token ?? null,
    color: projection?.encoding.color_dark ?? null,
    pattern: projection?.encoding.pattern_label ?? null,
  };
}

export default function EvidenceInspector({entry, onClose}) {
  const model = inspectorModel(entry);
  return (
    <aside className="oew-inspector" aria-label="Exact evidence inspector">
      <div className="oew-panel-heading">
        <span>Evidence inspector</span>
        <button onClick={onClose} aria-label="Close inspector">×</button>
      </div>
      {!model ? (
        <div className="oew-empty">
          <strong>Select exact evidence</strong>
          <p>Choose a source object or relation to inspect its source handle.</p>
        </div>
      ) : (
        <>
          <div className="oew-inspector-identity">
            <span className="oew-kicker">{model.kind}</span>
            <h2>{model.sourceRef}</h2>
            <span className="oew-authority">authority_effect: {model.authorityEffect}</span>
          </div>
          <dl>
            <Field label="Exact relation ID" value={model.relationId} mono />
            <Field label="Exact relation" value={model.relation} />
            <Field label="Exact endpoints" value={model.endpoints} mono />
            <Field label="Source direction" value={model.sourceDirection} />
            <Field label="Direction text" value={model.directionText} />
            <Field label="Presentation relation" value={model.presentationRelation} />
            <Field label="Scene digest" value={model.sceneDigest} mono />
            <Field label="Relation digest" value={model.relationDigest} mono />
            <div className="oew-inspector-field oew-inspector-encoding">
              <dt>Redundant display cues</dt>
              <dd>
                {model.color && (
                  <span
                    aria-hidden="true"
                    className="oew-inspector-swatch"
                    style={{"--oew-edge-color": model.color}}
                  />
                )}
                <span>{model.colorToken ?? "no color cue"}</span>
                <span>{model.pattern ?? "no pattern cue"}</span>
              </dd>
            </div>
            <Field label="Mapping loss" value={model.mappingLoss} />
            <Field label="Policy disposition" value={model.disposition} />
            <Field label="Grounding inclusion" value={model.grounding} />
            <Field
              label="Diagnostics"
              value={model.diagnostics.length ? model.diagnostics.join(", ") : "none"}
              mono
            />
            <Field label="Exact source" value={model.path} mono />
            <Field label="Source digest" value={model.digest} mono />
          </dl>
          <div className="oew-inspector-note">
            <strong>Why it is here</strong>
            <p>
              This read-only view preserves exact source semantics even when the
              upstream presentation relation is generalized.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
