import {memo,useState} from 'react';
import {documents} from './documentationContent';

// Search stays local so typing does not update the graph or document readers.
export const GuidePicker=memo(function GuidePicker({onOpen}:{onOpen:(id:string,anchor:string)=>void}){
 const [query,setQuery]=useState('');
 const terms=query.toLowerCase().trim().split(/\s+/);
 const matches=documents.filter(d=>terms.every(t=>(d.title+' '+d.summary+' '+d.section+' '+d.markdown).toLowerCase().includes(t)));
 return <details className="guide-picker"><summary>Add a guide ({documents.length})</summary>
  <label>Find a guide<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Gateway, corrections…"/></label>
  <div className="guide-picker-results">{matches.map(d=><button key={d.id} onClick={()=>onOpen(d.id,'')}><strong>{d.title}</strong><small>{d.section}{d.id==='interaction-learning'?' · Off by default':''}</small></button>)}</div>
  {!matches.length&&<p role="status">No matching guide.</p>}
  <p>Guides open as movable cards on this canvas.</p>
 </details>;
});
