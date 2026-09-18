// Shared geometry for the canvas, readers and animated component map.
const shapes:Record<string,[string,string]> = {
  "objective": [
    "M19 14a8 8 0 1 1-9-10M15 12a3 3 0 1 1-3-3",
    "M12 12 21 3M16 3h5v5"
  ],
  "context": [
    "M8 3h13v18H8M3 7h9M3 17h9",
    "M2 12h14M13 9l3 3-3 3"
  ],
  "agent": [
    "M3 4h10v12H3zM6 8h1M10 8h1M6 12h4M17 14h5v7h-5z",
    "M13 10h6v4M16 10l3 3 3-3"
  ],
  "evidence": [
    "M4 3h10l4 4v8M4 3v18h10M13 3v5h5M7 11h6M7 15h3",
    "M13 18h4M17 18l2-2 3 2-3 3-2-3"
  ],
  "state": [
    "M3 6l9-4 9 4-9 4-9-4M3 11l9 4 9-4M3 16l9 4 5-2",
    "M21 15v6h-6M21 21l-4-4"
  ],
  "decision": [
    "M4 12h6l5 7h6M18 16l3 3-3 3",
    "M10 12l5-7h6M18 2l3 3-3 3"
  ],
  "boundary": [
    "M8 8V3h9v18H8v-5",
    "M2 12h12M11 9l3 3-3 3M19 12h3"
  ],
  "outcome": [
    "M3 13h6l4-7h2M14 5q0-3 3-3t3 3q0 2-3 3v2M17 12v1",
    "M9 13l4 6h4M16 18l2 2 4-5"
  ]
};
export function ComponentGlyph({id}:{id:string}){
 const [base,accent]=shapes[id]??shapes.objective;
 return <g className="component-glyph" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={base}/><path className="icon-accent" d={accent}/></g>;
}
export function ComponentIcon({id}:{id:string}){return <svg aria-hidden="true" className="component-icon" viewBox="0 0 24 24"><ComponentGlyph id={id}/></svg>}
