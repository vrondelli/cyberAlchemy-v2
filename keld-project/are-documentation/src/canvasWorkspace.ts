import {GRAPH_VERSION,MIN_ZOOM,MAX_ZOOM,resolveNode,engineNodeMap} from './engineGraph.ts';
import {validStep,type TourState} from './engineTours.ts';
export const STORAGE_KEY='are.documentation.workspace.v1';
export type Card={id:string;document:string;position:{x:number;y:number};expanded:boolean;scroll:number;sources:string[]};
export type Workspace={schema:2;version:string;graphVersion:string;positions:Record<string,{x:number;y:number}>;tour:TourState;lens:string;selected:string|null;active:string|null;cards:Card[];viewport:{x:number;y:number;zoom:number}|null};
export function emptyWorkspace(version:string):Workspace{return {schema:2,version,graphVersion:GRAPH_VERSION,positions:{},tour:null,lens:'continuity',selected:null,active:null,cards:[],viewport:null};}
export function openCard(state:Workspace,doc:string,source:string,position:{x:number;y:number}):Workspace{
 const id=`doc-${doc}`,existing=state.cards.find(c=>c.id===id);
 if(existing){const linked=existing.sources.includes(source);if(linked&&state.active===id&&state.selected===source)return state;return {...state,active:id,selected:source,cards:linked?state.cards:state.cards.map(c=>c.id===id?{...c,sources:[...c.sources,source]}:c)};}
 let p={...position};while(state.cards.some(c=>Math.abs(c.position.x-p.x)<390&&Math.abs(c.position.y-p.y)<480))p={x:p.x+400,y:p.y};
 return {...state,active:id,selected:source,cards:[...state.cards,{id,document:doc,position:p,expanded:true,scroll:0,sources:[source]}]};
}
export function restoreWorkspace(raw:string|null,version:string,documents:string[],_nodes:string[],lenses:string[]):{workspace:Workspace;notice:string}{
 const empty=emptyWorkspace(version);if(!raw)return {workspace:empty,notice:''};
 try{
  if(raw.length>250000)throw Error();const s=JSON.parse(raw);
  if(![1,2].includes(s.schema)||!Array.isArray(s.cards)||s.cards.length>50)throw Error();
  const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e7;
  const position=(p:any)=>p&&finite(p.x)&&finite(p.y);
  let repaired=s.version!==version||s.schema!==2||s.graphVersion!==GRAPH_VERSION;
  const seen=new Set<string>();const cards:Card[]=[];
  for(const c of s.cards){
   if(!documents.includes(c.document)||c.id!==`doc-${c.document}`||seen.has(c.id)||!position(c.position)||typeof c.expanded!=='boolean'||!finite(c.scroll)||c.scroll<0||!Array.isArray(c.sources)){repaired=true;continue;}
   seen.add(c.id);const sources=c.sources.map(resolveNode).filter((id:unknown):id is string=>typeof id==='string');
   cards.push({id:c.id,document:c.document,position:{...c.position},expanded:c.expanded,scroll:c.scroll,sources});
  }
  const positions:Workspace['positions']={};
  if(s.positions&&typeof s.positions==='object')for(const [id,p] of Object.entries(s.positions)){const key=resolveNode(id);if(key&&position(p))positions[key]={x:(p as any).x,y:(p as any).y};else repaired=true;}
  let viewport=null;if(s.viewport){if(position(s.viewport)&&finite(s.viewport.zoom)&&s.viewport.zoom>=MIN_ZOOM&&s.viewport.zoom<=MAX_ZOOM)viewport={x:s.viewport.x,y:s.viewport.y,zoom:s.viewport.zoom};else repaired=true;}
  const tour=s.tour&&validStep(s.tour.id,s.tour.step)?{id:s.tour.id,step:s.tour.step,status:s.tour.status==='completed'?'completed' as const:'paused' as const}:null;
  if(s.tour&&!tour)repaired=true;
  return {workspace:{...empty,lens:lenses.includes(s.lens)?s.lens:empty.lens,selected:resolveNode(s.selected),active:seen.has(s.active)?s.active:null,cards,positions,tour,viewport},notice:repaired?'Your saved canvas was updated. Compatible cards and positions were kept.':''};
 }catch{return {workspace:empty,notice:'The saved canvas could not be restored. A fresh canvas is ready.'};}
}
