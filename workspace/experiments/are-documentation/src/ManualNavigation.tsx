import {useEffect,useState} from 'react';
import {articleHref,documentationVersion,findDocument,manualGroups} from './documentationContent';

export function ManualNavigation({active='',origin=''}:{active?:string;origin?:string}){
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState(false);
 useEffect(()=>{setQuery('');setExpanded(false);},[active]);
 const terms=query.toLowerCase().trim().split(/\s+/);
 const groups=manualGroups.map(group=>({...group,documents:group.guides.map(id=>findDocument(id)!).filter(doc=>terms.every(term=>(doc.title+' '+doc.summary).toLowerCase().includes(term)))}));
 return <nav className="manual-navigation" aria-label="Documentation navigation">
  <a className="manual-overview" href="#view=docs" aria-current={!active?'page':undefined}>Documentation overview</a>
  <button className="manual-nav-toggle" aria-expanded={expanded} aria-controls="manual-guide-list" onClick={()=>setExpanded(value=>!value)}>Browse guides {expanded?'−':'+'}</button>
  <div id="manual-guide-list" className={expanded?'is-expanded':''} onKeyDown={event=>{if(event.key==='Escape'){setExpanded(false);document.querySelector<HTMLButtonElement>('.manual-nav-toggle')?.focus();}}}>
   <label>Find a guide<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Memory, agent, recovery…"/></label>
   {groups.map(group=>group.documents.length>0&&<section key={group.label}><h2>{group.label}</h2>{group.documents.map(doc=><a key={doc.id} href={articleHref(doc.id,'',origin)} aria-current={active===doc.id?'page':undefined} onClick={()=>setExpanded(false)}>{doc.title}</a>)}</section>)}
   {!groups.some(group=>group.documents.length)&&<p role="status">No matching guide.</p>}
   <p className="document-status">Documentation preview<br/>{documentationVersion}</p>
  </div>
 </nav>;
}
