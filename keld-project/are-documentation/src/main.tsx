import {CanvasRecovery} from './CanvasRecovery';
import {DocumentationLoader} from './useDocumentation';
import {engineNodes,engineNodeMap,resolveNode} from './engineGraph';
import {findTour,tourReducer,validStep} from './engineTours';
import {useMotionPreference,useIllustrationActivity} from './motionPreference';
import {GuidePicker} from './GuidePicker';
import {useWorkspacePersistence} from './useWorkspacePersistence';
import {useStableEvent} from './useStableEvent';
import {countPerformance} from './performanceMetrics';
import React, {Suspense,lazy,useEffect,useState,useRef,useMemo,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {entries,properties,relations,type Entry} from './data';
import './style.css';
import './navigation.css';
import {Documentation} from './Capabilities';
import {BrandMark} from './BrandMark';
import {DocumentationHome,DocumentationPage} from './DocumentationPage';
import {documents,documentForNode,findDocument,documentationVersion,articleHref,canvasHref,readingPaths} from './documentationContent';
import {emptyWorkspace,openCard,restoreWorkspace,STORAGE_KEY,type Workspace} from './canvasWorkspace';
import './documentation.css';
import './explorer.css';
import type {DocumentActions} from './DocumentationNode';
import {LiveChat} from './LiveChat';
const CanvasGraph=lazy(()=>import('./CanvasGraph'));
const Hero=lazy(()=>import('./Hero').then(module=>({default:module.Hero})));
function IntroLoading(){return <main className="intro-loading" role="status" aria-label="Loading the A.R.E. introduction"><div><BrandMark/><strong>A.R.E.</strong><span>Agent Reasoning Engine</span></div></main>;}
function getRoute(){const p=new URLSearchParams(location.hash.slice(1));return {view:p.get('view')??'intro',node:p.get('node'),page:p.get('page')==='1',doc:p.get('doc')??'',topic:p.get('topic'),anchor:p.get('anchor')??'',origin:p.get('origin')??'',guide:p.get('guide')??'',feature:p.get('feature')??'',card:p.get('card')??'',tour:p.get('tour')??'',step:p.get('step')??''};}
function loadWorkspace(){try{return restoreWorkspace(sessionStorage.getItem(STORAGE_KEY),documentationVersion,documents.map(d=>d.id),entries.map(e=>e.id),properties.map(p=>p.id));}catch{return {workspace:emptyWorkspace(documentationVersion),notice:'Canvas storage is unavailable. Your layout is kept while this page remains open.'};}}
function App(){
 countPerformance('app.render');
 const [loaded]=useState(loadWorkspace),[workspace,setWorkspace]=useState<Workspace>(loaded.workspace),[notice,setNotice]=useState(loaded.notice);
 const [route,setRoute]=useState(getRoute),[query,setQuery]=useState(''),[sidebarOpen,setSidebarOpen]=useState(()=>matchMedia('(min-width:701px)').matches);
 const {userPaused:signalsPaused,reduced:reducedMotion,toggle:toggleMotion}=useMotionPreference();
 const [resetId,setResetId]=useState(0);const [focusRequest,setFocusRequest]=useState<{id:string;sequence:number}|null>(null);const topbarRef=useRef<HTMLElement>(null);
 const reveal=(id:string)=>setFocusRequest(r=>({id,sequence:(r?.sequence??0)+1}));
 const navigate=(view:string,node?:string)=>{location.hash=new URLSearchParams({view,...(node?{node}:{})}).toString();};
 const property=properties.find(p=>p.id===route.view)??properties.find(p=>p.id===workspace.lens)??properties[0];
 const featureId=findDocument(route.feature||route.guide)?route.feature||route.guide:'';
 const intro=route.view==='intro',docs=route.view==='docs'||route.view==='article';
 const explorerRef=useRef<HTMLElement>(null);const canvasMotion=useIllustrationActivity(explorerRef,!intro&&!docs);
 useEffect(()=>{const bar=topbarRef.current;if(!bar)return;const observer=new ResizeObserver(()=>document.documentElement.style.setProperty('--are-header-height',`${bar.getBoundingClientRect().height}px`));observer.observe(bar);return()=>observer.disconnect();},[]);
 useEffect(()=>{const f=()=>setRoute(getRoute());window.addEventListener('hashchange',f);window.addEventListener('popstate',f);return()=>{window.removeEventListener('hashchange',f);window.removeEventListener('popstate',f);};},[]);
 useEffect(()=>{if(!intro&&!(route.view==='docs'&&!route.doc))return;const timer=setTimeout(()=>{const target=location.hash==='#are-walkthrough'?document.getElementById('are-walkthrough'):document.querySelector<HTMLElement>('main h1,.continuous-intro h1');if(location.hash==='#are-walkthrough')target?.scrollIntoView({block:'start'});else window.scrollTo(0,0);if(target){target.tabIndex=-1;target.focus({preventScroll:true});}},80);return()=>clearTimeout(timer);},[route.view,route.doc,location.hash]);

 const persistence=useWorkspacePersistence(workspace,()=>setNotice('Canvas storage is unavailable. Your layout is kept while this page remains open.'));
 function addDocument(docId:string,source:string,focus=true){const entry=engineNodeMap[resolveNode(source)??'request'];setWorkspace(w=>openCard(w,docId,entry.id,{x:entry.position.x+360,y:entry.position.y+200}));if(focus)reveal(`doc-${docId}`);}
 useEffect(()=>{
  if(intro||docs){setFocusRequest(null);return;}
  if(route.view==='continuity'&&!route.feature&&!route.guide&&!route.node&&!route.card&&!route.tour&&!workspace.viewport&&!new URLSearchParams(location.hash.slice(1)).has('overview')){location.hash=canvasHref('concepts');return;}
  if(properties.some(p=>p.id===route.view))setWorkspace(w=>w.lens===route.view?w:{...w,lens:route.view});
  if([Boolean(route.card),Boolean(route.tour),Boolean(route.node)].filter(Boolean).length>1){setNotice('This link has conflicting destinations. Choose a workflow or show the full graph.');return;}
  if(route.page&&route.node){const node=resolveNode(route.node),doc=documentForNode(route.node)??findDocument(node?engineNodeMap[node].guides[0]:'');if(doc){location.hash=articleHref(doc.id,'','engine');return;}}
  if(route.card){const guide=findDocument(route.card);if(guide)addDocument(guide.id,resolveNode(guide.nodes[0])??'request',!workspace.cards.some(c=>c.document===guide.id));else setNotice('Unknown guide. Choose a guide from Add a guide.');return;}
  if(route.tour){const t=findTour(route.tour),step=route.step||t?.steps[0].id;if(!t||!step||!validStep(t.id,step)){setNotice('Unknown tour or step. Choose a guided tour to start again.');return;}
   setWorkspace(w=>({...w,selected:step,tour:{id:t.id,step,status:w.tour?.id===t.id&&w.tour.step===step?w.tour.status:'running'}}));reveal(step);return;
  }
  if(route.node){const id=resolveNode(route.node);if(id){setWorkspace(w=>({...w,selected:id,tour:tourReducer(w.tour,{type:'pause'})}));reveal(id);}return;}
  if(route.feature||route.guide){setFocusRequest(null);setWorkspace(w=>({...w,selected:null,tour:tourReducer(w.tour,{type:'pause'})}));}else if(route.view!=='continuity'&&properties.some(p=>p.id===route.view)){setWorkspace(w=>({...w,selected:null,tour:tourReducer(w.tour,{type:'pause'})}));reveal('lens:'+route.view);}
 },[route.view,route.node,route.page,route.card,route.tour,route.step,route.feature,route.guide]);
 function select(id:string){const node=resolveNode(id);if(!node)return;setWorkspace(w=>({...w,selected:node,tour:tourReducer(w.tour,{type:'pause'})}));reveal(node);if(route.node!==node)navigate(property.id,node);}
 function closeCard(id:string){const c=workspace.cards.find(c=>c.id===id);setWorkspace(w=>({...w,cards:w.cards.filter(c=>c.id!==id),active:w.active===id?null:w.active}));requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-component="${c?.sources[0]}"]`)?.focus({preventScroll:true}));}
 function returnToCanvas(){if(route.origin==='engine'){setFocusRequest(null);navigate(workspace.lens);return;}if(route.origin.startsWith('feature:')&&findDocument(route.origin.slice(8))){setFocusRequest(null);location.hash=canvasHref(route.origin.slice(8));return;}const doc=findDocument(route.doc),card=workspace.cards.find(c=>c.id===route.origin);if(card){setWorkspace(w=>({...w,active:card.id}));navigate(workspace.lens);setFocusRequest(null);setTimeout(()=>document.querySelector<HTMLElement>(`[data-id="${card.id}"] .read-document`)?.focus({preventScroll:true}),150);}else if(doc){setFocusRequest(null);location.hash=canvasHref(doc.id);}else navigate(workspace.lens);}
 const saveViewport=useCallback((viewport:{x:number;y:number;zoom:number})=>setWorkspace(w=>w.viewport?.x===viewport.x&&w.viewport?.y===viewport.y&&w.viewport?.zoom===viewport.zoom?w:{...w,viewport}),[]);
 const stableSelect=useStableEvent(select);
 const openDocument=useStableEvent((id:string,anchor:string)=>{const doc=findDocument(id);if(!doc)return;addDocument(id,doc.nodes[0]);if(anchor)setTimeout(()=>{const body=document.querySelector<HTMLElement>(`[data-document="${id}"] .document-body`),heading=document.getElementById(`doc-${id}-${anchor}`);if(body&&heading)body.scrollTop=heading.offsetTop;},150);});
 const stableClose=useStableEvent(closeCard);
 const actions=useMemo<DocumentActions>(()=>({
  toggle:id=>setWorkspace(w=>({...w,cards:w.cards.map(c=>c.id===id?{...c,expanded:!c.expanded}:c)})),
  close:stableClose,
  read:(id,doc)=>{setWorkspace(w=>({...w,tour:tourReducer(w.tour,{type:'pause'})}));persistence.flush();setFocusRequest(null);location.hash=articleHref(doc,'',id);},
  scroll:persistence.recordScroll,readScroll:persistence.readScroll,
  move:(id,x,y)=>setWorkspace(w=>({...w,cards:w.cards.map(c=>c.id===id?{...c,position:{x:c.position.x+x,y:c.position.y+y}}:c)})),
  openDocument,
 }),[persistence,stableClose,openDocument]);
 return <div className="app"><a className="skip-content" href="#main-content" onClick={e=>{e.preventDefault();const el=document.querySelector<HTMLElement>('main');if(el){el.tabIndex=-1;el.focus();}}}>Skip to content</a><header className="topbar" ref={topbarRef}><a href="#view=intro" className="brand"><BrandMark className="brand-mark"/><span className="brand-wordmark">A.R.E.</span><span className="brand-sub">Agent Reasoning Engine</span></a><nav><a className={intro?'current':''} href="#view=intro">Introduction</a><a href="#are-walkthrough">Try ARE</a><a className={!intro&&!docs?'current':''} href={`#view=${workspace.lens}`}>Explore the engine</a><a className={docs?'current':''} href="#view=docs">Documentation</a></nav></header>
 {notice&&<div role="status" className="workspace-notice">{notice} <button onClick={()=>setNotice('')}>Dismiss</button></div>}
 {route.view==='article'?<DocumentationLoader><DocumentationPage id={route.doc} anchor={route.anchor} origin={route.origin} onReturn={returnToCanvas} onExplore={()=>{if(findDocument(route.doc)){setFocusRequest(null);location.hash=canvasHref(route.doc);}}}/></DocumentationLoader>:route.view==='docs'?(<DocumentationLoader>{route.doc?<Documentation doc={route.doc} topic={route.topic}/>:<DocumentationHome/>}</DocumentationLoader>):intro?<Suspense fallback={<IntroLoading/>}><Hero onExplore={()=>{window.scrollTo(0,0);navigate(workspace.lens);}}/></Suspense>:<main id="main-content" ref={explorerRef} className={`explorer ${signalsPaused||reducedMotion||!canvasMotion.running?'signals-paused':'signals-running'}`}><aside id="explorer-navigation" aria-label="Engine navigation" className="properties" hidden={!sidebarOpen} tabIndex={0}><label className="feature-selector">Focus a feature<select aria-label="Focus a feature" value={featureId} onChange={event=>{setFocusRequest(null);if(event.target.value)location.hash=canvasHref(event.target.value);else navigate(workspace.lens);}}><option value="">Engine overview</option>{documents.map(doc=><option key={doc.id} value={doc.id}>{doc.title}</option>)}</select></label><nav className="explorer-workflows" aria-label="Explore workflows"><h2>Workflows</h2>{readingPaths.map(path=><details key={path.title}><summary>{path.title}</summary><p>{path.description}</p><ol>{path.guides.map(id=><li key={id}><a aria-current={featureId===id?'page':undefined} href={canvasHref(id)} onClick={()=>setFocusRequest(null)}>{findDocument(id)?.title}</a></li>)}</ol></details>)}</nav><details className="explorer-lenses"><summary>What matters to you?</summary>{properties.map((p,i)=><button key={p.id} aria-pressed={focusRequest?.id==='lens:'+p.id} onClick={()=>{setWorkspace(w=>({...w,selected:null,tour:tourReducer(w.tour,{type:'pause'})}));reveal('lens:'+p.id);navigate(p.id);}}><span>0{i+1}</span>{p.name}<b>↗</b></button>)}</details><label className="search-label">Find a node<input type="search" placeholder="Name or role…" value={query} onChange={e=>setQuery(e.target.value)}/></label>{query&&<div className="search-results">{engineNodes.filter(e=>(e.title+' '+e.detail).toLowerCase().includes(query.toLowerCase())).map(e=><button onClick={()=>select(e.id)} key={e.id}>{e.title}</button>)}{engineNodes.every(e=>!(e.title+' '+e.detail).toLowerCase().includes(query.toLowerCase()))&&<p role="status">No matching node. Try another name.</p>}</div>}{<><GuidePicker onOpen={openDocument}/><section className="open-documents" aria-label="Open documents"><p className="eyebrow">OPEN DOCUMENTS</p>{workspace.cards.map(c=><button key={c.id} onClick={()=>{setWorkspace(w=>({...w,active:c.id}));reveal(c.id);}}>{findDocument(c.document)?.title}</button>)}<button onClick={()=>{persistence.reset();setWorkspace(emptyWorkspace(documentationVersion));setFocusRequest(null);setResetId(n=>n+1);navigate('continuity');}}>Reset canvas</button></section></>}</aside><section className="scene"><div className="scene-heading"><button className="sidebar-toggle" aria-controls="explorer-navigation" aria-expanded={sidebarOpen} onClick={()=>setSidebarOpen(value=>!value)}>{sidebarOpen?'Hide navigation':'Show navigation'}</button><div><h1>{featureId?findDocument(featureId)?.title:'Explore the engine'}</h1></div></div><div className="canvas-frame"><div className="graph-area"><CanvasRecovery><Suspense fallback={<p role="status" className="page-loading">Loading canvas…</p>}><CanvasGraph feature={featureId} workspace={workspace} property={property} signalsPaused={signalsPaused||!canvasMotion.running} reducedMotion={reducedMotion} stableSelect={stableSelect} actions={actions} resetId={resetId} routeNode={route.node} focusRequest={focusRequest} saveViewport={saveViewport} setWorkspace={setWorkspace}/></Suspense></CanvasRecovery></div></div>{route.feature&&!featureId&&<p role="status">Unknown feature. Choose a feature from the feature map list.</p>}{route.guide&&!findDocument(route.guide)&&<p role="status">Unknown guide. Choose a guide from “Add a guide”.</p>}{route.node&&!resolveNode(route.node)&&<p role="status">Unknown component. Choose a component from the map.</p>}</section></main>}
 <LiveChat active={intro}/></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
