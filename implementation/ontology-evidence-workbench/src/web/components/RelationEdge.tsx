export function RelationEdgeVisual({ path, color, dash, label, labelX, labelY, selected }: { readonly path: string; readonly color: string; readonly dash: "solid" | "dashed" | "dotted"; readonly label: string; readonly labelX: number; readonly labelY: number; readonly selected?: boolean }) {
  const dashArray = dash === "dashed" ? "8 6" : dash === "dotted" ? "2 5" : undefined;
  return <><path d={path} fill="none" stroke={color} strokeWidth={selected ? 4 : 2.2} strokeDasharray={dashArray} className="relation-edge-path" /><foreignObject x={labelX - 68} y={labelY - 13} width="136" height="30" className="relation-edge-label-wrap"><div className="relation-edge-label" style={{ borderColor: color }}>{label}</div></foreignObject></>;
}
