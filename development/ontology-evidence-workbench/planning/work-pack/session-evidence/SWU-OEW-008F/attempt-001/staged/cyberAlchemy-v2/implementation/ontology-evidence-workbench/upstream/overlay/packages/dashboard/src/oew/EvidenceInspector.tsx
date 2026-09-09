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
  return {
    sourceRef: entry.sourceRef,
    kind: entry.kind === "edge" ? "Exact relation" : row.source_kind,
    relation: row.source_relation ?? null,
    presentationRelation: row.presentation_relation ?? null,
    mappingLoss: row.mapping_loss,
    disposition: row.policy_disposition ?? null,
    diagnostics: row.diagnostics ?? [],
    path: row.source_path ?? row.evidence_refs?.join(" · "),
    digest: row.source_digest ?? null,
    grounding: row.grounding_inclusion ?? null,
    authorityEffect: row.authority_effect,
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
            <Field label="Exact relation" value={model.relation} />
            <Field label="Presentation relation" value={model.presentationRelation} />
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
