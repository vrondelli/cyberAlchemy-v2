import {useEffect,useMemo,useState} from 'react';
import {OntologyCanvas} from './OntologyCanvas';
import {selectRuntimeGraph,type RuntimeSnapshot} from './runtime-views';
import './runtime-ontology.css';

export default function RuntimeOntology() {
  const [snapshot,setSnapshot]=useState<RuntimeSnapshot|null>(null);
  const [error,setError]=useState('');const [loading,setLoading]=useState(true);
  const [refresh,setRefresh]=useState(0);const [packageKey,setPackage]=useState('');
  const [viewId,setView]=useState('all');const [documentId,setDocument]=useState('');
  const [legacy,setLegacy]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    fetch('/api/ontology-v4',{signal:controller.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok) throw new Error('v4 read model unavailable. Start the ontology integration preview and retry.');
      const s=await r.json() as RuntimeSnapshot;
      if(s.schema!=='workspace-ontology-v4/v1'||s.authorityEffect!=='none'||!Array.isArray(s.packages))throw new Error('Invalid v4 response');
      if(controller.signal.aborted)return;
      setSnapshot(s);setPackage(p=>s.packages.some(x=>x.key===p)?p:(s.packages.find(x=>x.ontologyId==='cal.ontology-package.ontology-product-foundation')?.key??s.packages[0]?.key??''));
    }).catch(e=>{if(!controller.signal.aborted){setSnapshot(null);setError(String(e.message));}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[refresh]);
  const views=snapshot?.views.filter(v=>v.packageKey===packageKey)??[];
  const view=views.find(v=>v.id===viewId);
  const docs=snapshot?.documents.filter(d=>d.packageKey===packageKey)??[];
  const document=snapshot?.documents.find(d=>d.id===(view?.kind==='document'?view.documentId:documentId));
  const selectedPackage=snapshot?.packages.find(p=>p.key===packageKey);
  const result=useMemo(()=>{
    if(!snapshot||!packageKey||view?.kind==='document')return {};
    try{return {graph:selectRuntimeGraph(snapshot,packageKey,viewId)};}catch(e){return {error:(e as Error).message};}
  },[snapshot,packageKey,viewId,view?.kind]);
  return <section className="runtime-ontology" aria-label="Event-calculated ontology browser">
    <header className="runtime-controls"><div><h1>Ontology &amp; views</h1><p>Read-only v4 event projection · prototype, not admission</p></div>
      <button onClick={()=>setLegacy(x=>!x)}>{legacy?'Show v4 runtime':'Show Workspace graph'}</button>
      <button disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Refresh from events</button>
    </header>
    {legacy ? <OntologyCanvas/> : <>
      {loading&&<p role="status">Replaying the committed ontology events…</p>}
      {error&&<p role="alert">{error}</p>}
      {!loading&&snapshot&&<>
        <div className="runtime-controls">
          <label>Ontology package<select aria-label="Ontology package" value={packageKey} onChange={e=>{setPackage(e.target.value);setView('all');setDocument('');}}>{snapshot.packages.map(p=><option key={p.key} value={p.key}>{p.ontologyId} — {p.path}</option>)}</select></label>
          <label>Ontology view<select aria-label="Ontology view" value={viewId} onChange={e=>{setView(e.target.value);setDocument('');}}><option value="all">Complete package graph</option>{views.map(v=><option key={v.id} value={v.id}>{v.label} {v.kind==='document'?'(document)':''}</option>)}</select></label>
        </div>
        <div className="runtime-provenance"><span>{snapshot.packages.length} packages · {snapshot.nodes.length} nodes · {snapshot.relations.length} relations · {snapshot.documents.length} documents</span><br/>
          <span>Committed head: <code>{snapshot.head}</code></span><br/>
          <span>Source owner: {selectedPackage?.owner} · source status: {selectedPackage?.status}</span>
          <p>Displaying imported source bytes at this event epoch—not a working-tree currentness claim. Unsafe numeric values are preserved as decimal text.</p>
        </div>
        {view&&<details className="runtime-provenance"><summary>{view.label}: authored view definition</summary><p>{view.purpose}</p><p>Graph display adds real endpoints. Relation-type views include matching one-hop links from the declared anchor nodes; source selectors are unchanged.</p><p>{view.claim}</p>{view.blockedClaim&&<p>Not established: {view.blockedClaim}</p>}{view.raw&&<pre>{view.raw}</pre>}</details>}
        {result.error&&<p role="alert">View not evaluable: {result.error}</p>}
        {result.graph&&<OntologyCanvas key={`${snapshot.head}/${packageKey}/${viewId}`} source={result.graph}/>}
        <div className="runtime-controls"><label>Source document<select aria-label="Source document" value={documentId} onChange={e=>{setDocument(e.target.value);if(view?.kind==='document')setView('all');}}><option value="">Select a source document</option>{docs.map(d=><option key={d.id} value={d.id}>{d.path}</option>)}</select></label></div>
        {document&&<article className="runtime-document"><h2>{document.path}</h2><p>Source SHA-256: <code>{document.binding.sha256}</code></p><pre>{document.content}</pre></article>}
      </>}
    </>}
  </section>;
}
