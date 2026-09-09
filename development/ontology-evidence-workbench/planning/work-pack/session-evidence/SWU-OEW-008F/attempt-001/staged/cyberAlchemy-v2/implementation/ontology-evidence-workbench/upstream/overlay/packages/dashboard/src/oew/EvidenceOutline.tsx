// @ts-nocheck

export default function EvidenceOutline({model, onSelect}) {
  const nodes = model.rows.filter((row) => row.presentationType !== "relation");
  const relations = model.rows.filter((row) => row.presentationType === "relation");
  return (
    <div className="oew-outline" aria-label="Evidence outline">
      <section>
        <h3>Grounding closure</h3>
        <ol>
          {model.groundingPath.map((sourceRef, index) => {
            const row = nodes.find((item) => item.sourceRef === sourceRef);
            if (!row) return null;
            return (
              <li key={sourceRef}>
                <button
                  className={model.selectedSourceRef === sourceRef ? "is-selected" : ""}
                  onClick={() => onSelect(sourceRef)}
                >
                  <span className="oew-sequence">{index + 1}</span>
                  <span><strong>{sourceRef}</strong><small>{row.sourceKind} · {row.name}</small></span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      <section>
        <h3>Visible conflict residue</h3>
        {nodes.filter((row) => row.residue).map((row) => (
          <button className="oew-conflict-card" key={row.sourceRef} onClick={() => onSelect(row.sourceRef)}>
            <strong>{row.sourceRef}</strong>
            <span>{row.name}</span>
            <small>Excluded from grounding · still visible</small>
          </button>
        ))}
      </section>
      <section>
        <h3>Exact relations</h3>
        <ul className="oew-relation-list">
          {relations.map((row) => (
            <li key={row.sourceRef}>
              <button onClick={() => onSelect(row.sourceRef)}>
                <strong>{row.source} → {row.target}</strong>
                <span>{row.relation}</span>
                <small>{row.disposition} · {row.mappingLoss}</small>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
