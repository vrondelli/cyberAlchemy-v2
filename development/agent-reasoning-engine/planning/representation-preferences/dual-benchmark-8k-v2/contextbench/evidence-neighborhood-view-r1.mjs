// Bounded hint view; hints are navigation only and grant no evidence credit.
// Open questions: EVIDENCE-NEIGHBORHOOD-FRONTIER-R1.md.
const need=(value,message)=>{if(!value)throw Error('evidence-frontier-view.'+message);};
export function renderEvidenceNeighborhoodFrontier({query_results,per_facet=6,maximum_entries=48,maximum_bytes=8192}){
  need(query_results&&typeof query_results==='object'&&!Array.isArray(query_results),'results');
  need(Number.isSafeInteger(per_facet)&&per_facet>=1&&per_facet<=10,'per-facet');
  need(Number.isSafeInteger(maximum_entries)&&maximum_entries>=1&&maximum_entries<=80,'entries');
  need(Number.isSafeInteger(maximum_bytes)&&maximum_bytes>=1&&maximum_bytes<=8192,'bytes');
  const selected=new Map();let index_digest=null,base_commit=null;
  for(const [facet,result] of Object.entries(query_results)){
    need(/^[a-z][a-z0-9_]{0,63}$/.test(facet),'facet');
    need(result?.schema==='are.ranked-source-frontier-hints/v1'&&Array.isArray(result.hints),'result');
    index_digest??=result.index_digest;need(result.index_digest===index_digest,'index');
    for(const hint of result.hints.slice(0,per_facet)){
      need(typeof hint.path==='string'&&Number.isSafeInteger(hint.start_line)&&Number.isSafeInteger(hint.end_line)&&hint.start_line>=1&&hint.end_line>=hint.start_line,'hint');
      base_commit??=hint.base_commit;need(hint.base_commit===base_commit,'base');
      const row=selected.get(hint.path)??{path:hint.path,start_line:hint.start_line,end_line:hint.end_line,facets:[]};
      if(!row.facets.includes(facet))row.facets.push(facet);
      selected.set(hint.path,row);
    }
  }
  const rows=[...selected.values()].slice(0,maximum_entries);
  const header='Evidence-neighborhood hints (navigation only; read and verify before use):';
  while(rows.length){
    const text=[header,...rows.map(row=>`[${row.facets.join(',')}] ${row.path}:${row.start_line}-${row.end_line}`)].join('\n');
    if(Buffer.byteLength(text)<=maximum_bytes)return {schema:'are.evidence-neighborhood-view/v1',text,rows,index_digest,base_commit,omitted_paths:selected.size-rows.length,provider_calls:0,model_calls:0};
    rows.pop();
  }
  need(false,'view-does-not-fit');
}
