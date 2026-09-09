// @ts-nocheck

export default function EvidenceTable({model, onSelect}) {
  return (
    <div className="oew-table-wrap">
      <table className="oew-table">
        <caption className="oew-sr-only">Exact evidence objects and relations</caption>
        <thead>
          <tr>
            <th>Source</th>
            <th>Kind / relation</th>
            <th>Disposition</th>
            <th>Mapping</th>
            <th>Grounding</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr
              className={model.selectedSourceRef === row.sourceRef ? "is-selected" : ""}
              key={row.sourceRef}
            >
              <td><button onClick={() => onSelect(row.sourceRef)}>{row.sourceRef}</button></td>
              <td>{row.relation ?? row.sourceKind}</td>
              <td>{row.disposition ?? "not applicable"}</td>
              <td>{row.mappingLoss}</td>
              <td>{row.grounding ? "included" : row.residue ? "visible residue" : "not applicable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
