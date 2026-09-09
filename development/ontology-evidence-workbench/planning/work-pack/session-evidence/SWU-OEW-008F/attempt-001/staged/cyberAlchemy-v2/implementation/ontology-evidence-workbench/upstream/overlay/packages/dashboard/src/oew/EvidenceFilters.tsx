// @ts-nocheck

const FILTERS = [
  ["kind", "Kind", ["Finding", "Research artifact", "Definition", "Relation"]],
  ["relation", "Relation", ["derives-from", "contradicts", "specializes"]],
  ["disposition", "Disposition", ["policy-pass", "policy-indeterminate", "not-applicable"]],
  ["diagnostic", "Diagnostic", ["POLICY_OWNER_UNBOUND"]],
];

export default function EvidenceFilters({filters, onChange}) {
  const toggle = (group, value) => {
    const current = new Set(filters[group] ?? []);
    current.has(value) ? current.delete(value) : current.add(value);
    onChange({...filters, [group]: [...current]});
  };
  return (
    <div className="oew-filters">
      {FILTERS.map(([group, label, values]) => (
        <fieldset key={group}>
          <legend>{label}</legend>
          {values.map((value) => (
            <label key={value}>
              <input
                checked={(filters[group] ?? []).includes(value)}
                onChange={() => toggle(group, value)}
                type="checkbox"
              />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
