import {SculptureIcon} from './ComponentIcon';
import {memo,useEffect,useMemo,useRef,useState,useCallback,type Dispatch,type SetStateAction} from 'react';
import {Background,Controls,Handle,Position,ReactFlow,useReactFlow,useViewport,useNodesInitialized,type NodeProps,type Node,type Edge,type ReactFlowInstance} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {engineNodes,engineEdges,engineNodeMap,workflowNodes,neighbors,MIN_ZOOM,MAX_ZOOM,resolveNode} from './engineGraph';
import {engineStories} from './engineStories';
import {engineTours,findTour,tourReducer,type TourAction} from './engineTours';
import {properties} from './data';
import {DocumentationNode,type DocumentActions} from './DocumentationNode';
import {findDocument} from './documentationContent';
import {countPerformance} from './performanceMetrics';
import type {Workspace} from './canvasWorkspace';
import './engine-explorer.css';
const nodeIcons:Record<string,string>={request:'objective',route:'decision','context-envelope':'context','agent-host':'agent','runtime-journal':'evidence','reasoning-state':'state','proposed-effect':'boundary','host-policy':'boundary',continuation:'outcome',conversation:'language','improvement-research':'evolution'};
const regionIcons:Record<string,string>={concepts:'context','working-memory':'state',gateway:'adapters',configuration:'adapters',compatibility:'boundary',workflows:'decision','interaction-learning':'language',privacy:'boundary',operations:'evidence'};
type GraphNode=Node<{id:string;title:string;icon:string;active:boolean;emphasis:boolean;inspect:(id:string)=>void},'engine'>;
const EngineNode=memo(({data}:NodeProps<GraphNode>)=><section className={`engine-node ${data.active?'is-active':''} ${data.emphasis?'is-emphasized':''}`}>
 <Handle type="target" position={Position.Top}/><button className="nodrag nopan" data-engine-node={data.id} aria-label={`Explain ${data.title}`} aria-pressed={data.active} onClick={()=>data.inspect(data.id)}><SculptureIcon id={data.icon} size={38} light/><span>{data.title}</span></button><Handle type="source" position={Position.Bottom}/>
</section>);
const Region=memo(({data}:NodeProps<Node<{title:string}>>)=><div className="engine-region">{data.title}</div>);
const nodeTypes={engine:EngineNode,documentation:DocumentationNode,region:Region};
type Props={feature?:string;workspace:Workspace;property:typeof properties[number];signalsPaused:boolean;reducedMotion:boolean;stableSelect:(id:string)=>void;actions:DocumentActions;resetId:number;routeNode:string|null;focusRequest:{id:string;sequence:number}|null;saveViewport:(v:{x:number;y:number;zoom:number})=>void;setWorkspace:Dispatch<SetStateAction<Workspace>>};
type Focus={kind:'node'|'workflow'|'all'|'card'|'lens';id:string;sequence:number};
export default function CanvasGraph({feature='',workspace,stableSelect,actions,resetId,focusRequest,saveViewport,setWorkspace}:Props){
 const [focus,setFocus]=useState<Focus|null>(null),[tourChoice,setTourChoice]=useState('request'),[lens,setLens]=useState<string|null>(null);
 const [measurements,setMeasurements]=useState<Record<string,{width:number;height:number}>>({});
 const lastRoute=useRef<string|null>(null);
 const request=useCallback((kind:Focus['kind'],id='')=>setFocus(f=>({kind,id,sequence:(f?.sequence??0)+1})),[]);
 const dispatch=useCallback((action:TourAction)=>setWorkspace(w=>({...w,tour:tourReducer(w.tour,action)})),[setWorkspace]);
 const tour=workspace.tour?findTour(workspace.tour.id):null,step=tour?.steps.find(s=>s.id===workspace.tour?.step);
 const inspect=stableSelect;
 useEffect(()=>{if(!focusRequest)return;if(focusRequest.id.startsWith('lens:')){const id=focusRequest.id.slice(5);setLens(id);request('lens',id);}else request(focusRequest.id.startsWith('doc-')?'card':'node',focusRequest.id);},[focusRequest,request]);
 useEffect(()=>{const key=feature;if(lastRoute.current===null){lastRoute.current=key;if(!focusRequest&&!workspace.selected&&!workspace.viewport)request('workflow',feature||'concepts');else if(feature&&!workspace.selected)request('workflow',feature);return;}if(lastRoute.current!==key){lastRoute.current=key;if(feature)setLens(null);if(!focusRequest)request(feature?'workflow':'all',feature);}},[feature,request]);
 useEffect(()=>{if(workspace.tour?.status==='running'&&step)request('node',step.node);},[workspace.tour?.id,workspace.tour?.step,workspace.tour?.status,request]);
 const lensNodes=useMemo(()=>properties.find(p=>p.id===lens)?.nodes.map(id=>resolveNode(id)!).filter(Boolean)??[],[lens]);
 const emphasized=useMemo(()=>new Set(step&&workspace.selected===step.node?step.nodes:workspace.selected?[workspace.selected,...neighbors(workspace.selected).flatMap(e=>[e.source,e.target])]:workflowNodes[feature]??lensNodes),[step,workspace.selected,feature,lensNodes]);
 const highlightedEdges=useMemo(()=>new Set(step&&workspace.selected===step.node?step.edges:workspace.selected?neighbors(workspace.selected).map(e=>e.id):engineEdges.filter(e=>feature?e.guides.includes(feature):lensNodes.includes(e.source)&&lensNodes.includes(e.target)).map(e=>e.id)),[step,workspace.selected,feature,lensNodes]);
 const cache=useRef(new Map<string,Node>());
 const nodes=useMemo(()=>{
  const next=new Map<string,Node>();
  for(const n of engineNodes){const old=cache.current.get(n.id),position=workspace.positions[n.id]??n.position,active=workspace.selected===n.id,emphasis=emphasized.has(n.id);
   next.set(n.id,old&&old.measured===measurements[n.id]&&old.position===position&&old.data.active===active&&old.data.emphasis===emphasis?old:{id:n.id,type:'engine',position,measured:measurements[n.id],ariaLabel:n.title,focusable:false,data:{id:n.id,title:n.title,icon:nodeIcons[n.id]??regionIcons[n.guides[0]]??'context',active,emphasis,inspect}});
  }
  for(const card of workspace.cards){const old=cache.current.get(card.id),active=workspace.active===card.id;const oldCard=old?.data.card as any;
   const data=old&&oldCard?.expanded===card.expanded&&oldCard?.scroll===card.scroll&&old.data.active===active?old.data:{card:{id:card.id,document:card.document,expanded:card.expanded,scroll:card.scroll},active,actions};
   next.set(card.id,old&&old.measured===measurements[card.id]&&old.position===card.position&&old.data===data?old:{id:card.id,type:'documentation',position:card.position,measured:measurements[card.id],dragHandle:'.document-drag-handle',data});
  }
  Object.keys(workflowNodes).forEach((id,i)=>{const key='region-'+id;next.set(key,cache.current.get(key)??{id:key,type:'region',width:950,height:50,draggable:false,selectable:false,focusable:false,position:{x:i%3*1260,y:Math.floor(i/3)*1300-100},data:{title:findDocument(id)?.title??id}});});
  cache.current=next;return [...next.values()];
 },[workspace.positions,workspace.selected,workspace.cards,workspace.active,emphasized,inspect,actions,measurements]);
 const edgeCache=useRef(new Map<string,Edge>());
 const edges=useMemo(()=>{
  const next=new Map<string,Edge>();
  for(const e of engineEdges){const className=highlightedEdges.has(e.id)?'engine-edge is-emphasized':'engine-edge',old=edgeCache.current.get(e.id);next.set(e.id,old?.className===className?old:{id:e.id,source:e.source,target:e.target,type:'smoothstep',ariaLabel:`${engineNodeMap[e.source].title}: ${e.meaning}: ${engineNodeMap[e.target].title}`,className,style:{stroke:highlightedEdges.has(e.id)?'#244f85':'#acbbcc',strokeWidth:highlightedEdges.has(e.id)?3:1,strokeDasharray:e.kind==='constraint'?'5 4':undefined},markerEnd:{type:'arrowclosed',color:highlightedEdges.has(e.id)?'#244f85':'#acbbcc'}});}
  for(const c of workspace.cards)for(const source of c.sources.filter(s=>engineNodeMap[s])){const id=`guide-${source}-${c.id}`;next.set(id,edgeCache.current.get(id)??{id,source,target:c.id,type:'smoothstep',style:{stroke:'#9baec5',strokeDasharray:'3 5'}});}
  edgeCache.current=next;return [...next.values()];
 },[highlightedEdges,workspace.cards.map(c=>c.id+c.sources.join(',')).join('|')]);
 const previousReset=useRef(resetId);useEffect(()=>{if(previousReset.current!==resetId){previousReset.current=resetId;setLens(null);request('all');}},[resetId,request]);
 const showAll=()=>{setLens(null);location.hash='#view=continuity&overview=1';setWorkspace(w=>({...w,selected:null,tour:tourReducer(w.tour,{type:'pause'})}));request('all');};
 const stepTo=(id:string)=>{if(!tour)return;location.hash=new URLSearchParams({view:'continuity',tour:tour.id,step:id}).toString();};
 const start=()=>{const t=findTour(tourChoice)!;location.hash=new URLSearchParams({view:'continuity',tour:t.id,step:t.steps[0].id}).toString();setWorkspace(w=>({...w,selected:t.steps[0].node,tour:{id:t.id,step:t.steps[0].id,status:'running'}}));request('node',t.steps[0].node);};
 const close=()=>{const id=workspace.selected;setWorkspace(w=>({...w,selected:null,tour:tourReducer(w.tour,{type:'pause'})}));requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`[data-engine-node="${id}"]`)?.focus({preventScroll:true}));};
 const exit=()=>{dispatch({type:'exit'});location.hash='#view=continuity';document.querySelector<HTMLButtonElement>('.start-tour')?.focus();};
 return <div className="engine-canvas feature-map" data-feature={feature||undefined}>
 <div className="engine-controls"><button onClick={showAll}>Show all</button>{feature&&<button onClick={()=>request('workflow',feature)}>Fit workflow</button>}{workspace.selected&&<button onClick={()=>request('node',workspace.selected!)}>Focus node</button>}<label><span className="sr-only">Guided tour</span><select aria-label="Guided tour" value={tourChoice} onChange={e=>setTourChoice(e.target.value)}>{engineTours.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><button className="start-tour" onClick={start}>Start guided tour</button>{workspace.tour&&<><button onClick={()=>{dispatch({type:'resume'});if(step){setWorkspace(w=>({...w,selected:step.node}));request('node',step.node);}}}>Follow step</button><button onClick={exit}>Exit tour</button></>}</div>
 <div className="feature-map-canvas"><ReactFlow key={resetId} nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultViewport={workspace.viewport??{x:20,y:20,zoom:.8}} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} nodesConnectable={false} edgesReconnectable={false} deleteKeyCode={null} zoomOnDoubleClick={false}
 onNodeClick={(_,node)=>{if(node.type==='documentation')setWorkspace(w=>w.active===node.id?w:{...w,active:node.id});}} onMoveStart={event=>{if(event){setFocus(null);dispatch({type:'pause'});}}} onMoveEnd={(_,v)=>saveViewport(v)} onNodesChange={changes=>{const dims=changes.filter(c=>c.type==='dimensions'&&c.dimensions);if(dims.length)setMeasurements(old=>{let next=old;for(const c of dims){if(c.type!=='dimensions'||!c.dimensions)continue;const d=c.dimensions;if(old[c.id]?.width!==d.width||old[c.id]?.height!==d.height)next={...next,[c.id]:d};}return next;});setWorkspace(w=>{let changed=false;let positions=w.positions,cards=w.cards;for(const c of changes){if(c.type!=='position'||!c.position)continue;const card=cards.find(x=>x.id===c.id);if(card){if(card.position.x===c.position.x&&card.position.y===c.position.y)continue;cards=cards.map(x=>x.id===c.id?{...x,position:c.position!}:x);changed=true;}else if(engineNodeMap[c.id]){const old=positions[c.id]??engineNodeMap[c.id].position;if(old.x===c.position.x&&old.y===c.position.y)continue;positions={...positions,[c.id]:c.position};changed=true;}}return changed?{...w,positions,cards}:w;});}}>
 <Camera request={focus} saveViewport={saveViewport}/><GraphDetail/>
 {workspace.selected&&<NodeExplanation id={workspace.selected} workspace={workspace} close={close} inspect={inspect} stepTo={stepTo} exit={exit} read={doc=>{dispatch({type:'pause'});actions.read('engine',doc);}} focus={()=>request('node',workspace.selected!)}/>}
 <Background color="#d8dade" gap={24} size={.8}/><Controls showInteractive={false} showFitView={false}/>
 </ReactFlow></div>
 <details className="feature-map-text"><summary>Read graph connections</summary><ul>{(workspace.selected?neighbors(workspace.selected):engineEdges.filter(e=>!feature||e.guides.includes(feature))).map(e=><li key={e.id}><button onClick={()=>inspect(e.source)}>{engineNodeMap[e.source].title}</button> → {e.meaning} → <button onClick={()=>inspect(e.target)}>{engineNodeMap[e.target].title}</button></li>)}</ul></details>
 </div>;
}
function GraphDetail(){const {zoom}=useViewport();useEffect(()=>{document.querySelector('.engine-canvas')?.setAttribute('data-detail',zoom<.25?'overview':'readable');},[zoom]);return null;}
function Camera({request,saveViewport}:{request:Focus|null;saveViewport:Props['saveViewport']}){
 const flow=useReactFlow(),ready=useNodesInitialized();const handled=useRef<Focus|null>(null);
 useEffect(()=>{countPerformance('canvas.mount');return()=>countPerformance('canvas.unmount');},[]);
 useEffect(()=>{if(!ready||!request||handled.current===request)return;let cancelled=false;handled.current=request;
 const run=async()=>{if(request.kind==='all'||request.kind==='workflow'||request.kind==='lens'){const ids=request.kind==='all'?engineNodes.map(n=>n.id):request.kind==='lens'?properties.find(p=>p.id===request.id)?.nodes.map(id=>resolveNode(id)!).filter(Boolean)??[]:workflowNodes[request.id]??[];await flow.fitView({nodes:ids.map(id=>({id})),padding:.12,minZoom:MIN_ZOOM,maxZoom:1});}
 else{const n=flow.getNode(request.id);if(!n)return;const el=document.querySelector('.engine-canvas .react-flow')?.getBoundingClientRect();if(!el)return;const zoom=request.kind==='card'?.85:el.width<600?.8:1;await flow.setViewport({x:(el.width-(n.measured?.width??230)*zoom)/2-n.position.x*zoom,y:24-n.position.y*zoom,zoom});}
 if(!cancelled)saveViewport(flow.getViewport());};void run();return()=>{cancelled=true;};
 },[ready,request,flow,saveViewport]);return null;
}
function NodeExplanation({id,workspace,close,inspect,stepTo,exit,read,focus}:{id:string;workspace:Workspace;close:()=>void;inspect:(id:string)=>void;stepTo:(id:string)=>void;exit:()=>void;read:(doc:string)=>void;focus:()=>void}){
 const story=engineStories[id],flow=useReactFlow(),v=useViewport();const [size,setSize]=useState({width:600,height:500});const panel=useRef<HTMLElement>(null);
 const tour=workspace.tour?findTour(workspace.tour.id):null,index=tour?.steps.findIndex(s=>s.id===workspace.tour?.step)??-1,step=tour?.steps[index],onStep=step?.node===id;
 useEffect(()=>{const el=document.querySelector('.engine-canvas .react-flow');if(!el)return;const observer=new ResizeObserver(([e])=>setSize({width:e.contentRect.width,height:e.contentRect.height}));observer.observe(el);return()=>observer.disconnect();},[]);

 const node=flow.getNode(id),pos=workspace.positions[id]??node?.position??engineNodeMap[id].position,width=Math.min(300,size.width-16),ownerX=pos.x*v.zoom+v.x,ownerY=pos.y*v.zoom+v.y,ownerW=(node?.measured?.width??230)*v.zoom,ownerH=(node?.measured?.height??72)*v.zoom;
 const panelHeight=Math.min(350,Math.max(100,size.height-ownerH-56)),x=Math.max(8,Math.min(size.width-width-8,ownerX+ownerW/2-width/2));
 const below=ownerY+ownerH+12,y=below+panelHeight<=size.height?below:Math.max(8,ownerY-panelHeight-12);
 const visible=ownerX+ownerW>0&&ownerX<size.width&&ownerY+ownerH>0&&ownerY<size.height;
 useEffect(()=>{if(!visible)return;const returning=!new URLSearchParams(location.hash.slice(1)).has('node')&&!new URLSearchParams(location.hash.slice(1)).has('tour');if(returning)document.querySelector<HTMLButtonElement>(`[data-engine-node="${id}"]`)?.focus({preventScroll:true});else panel.current?.focus({preventScroll:true});},[id,visible]);
 if(!visible)return <button className="return-explanation nodrag nopan" onClick={focus}>Return to {story.title}</button>;
 return <><svg className="explanation-tether" aria-hidden="true"><path d={`M${ownerX+ownerW/2},${y>ownerY?ownerY+ownerH:ownerY} L${x+width/2},${y>ownerY?y:y+panelHeight}`}/></svg><section ref={panel} tabIndex={-1} role="region" aria-label={`${story.title} explanation`} className="node-explanation nodrag nopan nowheel" data-explanation={id} style={{left:x,top:y,width,maxHeight:panelHeight}} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close();}}}>
 <header><strong>{story.title}</strong><button aria-label="Close explanation" onClick={close}>×</button></header>
 <div className="explanation-body nowheel" onWheel={e=>e.stopPropagation()}><p>{story.explanation}</p>{story.facts.filter(f=>f.detail!==story.explanation).map(f=><p key={f.guide}>{f.detail}</p>)}
 {onStep&&<p className="tour-position" role="status" aria-live="polite">{tour!.title} · Step {index+1} of {tour!.steps.length} · {workspace.tour?.status}</p>}
 {onStep&&<p>{step.reason}</p>}<h3>What connects here</h3><ul>{[...story.incoming,...story.outgoing].map(e=>{const other=e.source===id?e.target:e.source;return <li key={e.id}><button onClick={()=>inspect(other)}>{engineNodeMap[other].title}</button> — {e.meaning}{e.target===id?' → this node':' → next node'}</li>;})}</ul><p className="explanation-limit">{story.limit}</p><details><summary>Sources</summary>{engineNodeMap[id].guides.map(g=><button key={g} onClick={()=>read(g)}>{findDocument(g)?.title}</button>)}</details><button className="read-node-guide" onClick={()=>read(engineNodeMap[id].guides[0])}>Read full guide →</button></div>
 {onStep&&<footer><button disabled={index===0} onClick={()=>stepTo(tour!.steps[index-1].id)}>Back</button>{index<tour!.steps.length-1?<button onClick={()=>stepTo(tour!.steps[index+1].id)}>Next</button>:<button onClick={()=>stepTo(tour!.steps[0].id)}>Restart</button>}<button onClick={exit}>Exit tour</button></footer>}
 </section></>;
}
