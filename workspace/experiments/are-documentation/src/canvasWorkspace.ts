export const STORAGE_KEY='are.documentation.workspace.v1';
export type Card={id:string;document:string;position:{x:number;y:number};expanded:boolean;scroll:number;sources:string[]};
export type Workspace={schema:1;version:string;lens:string;selected:string|null;active:string|null;cards:Card[];viewport:{x:number;y:number;zoom:number}|null};
export function emptyWorkspace(version:string):Workspace{return {schema:1,version,lens:'continuity',selected:null,active:null,cards:[],viewport:null};}
export function openCard(state:Workspace,doc:string,source:string,position:{x:number;y:number}):Workspace{
 const id=`doc-${doc}`,existing=state.cards.find(c=>c.id===id);
 if(existing){const linked=existing.sources.includes(source);if(linked&&state.active===id&&state.selected===source)return state;return {...state,active:id,selected:source,cards:linked?state.cards:state.cards.map(c=>c.id===id?{...c,sources:[...c.sources,source]}:c)};}
 let p={...position};while(state.cards.some(c=>Math.abs(c.position.x-p.x)<390&&Math.abs(c.position.y-p.y)<480))p={x:p.x+400,y:p.y};
 return {...state,active:id,selected:source,cards:[...state.cards,{id,document:doc,position:p,expanded:true,scroll:0,sources:[source]}]};
}
export function restoreWorkspace(raw:string|null,version:string,documents:string[],nodes:string[],lenses:string[]):{workspace:Workspace;notice:string}{
 const empty=emptyWorkspace(version);if(!raw)return {workspace:empty,notice:''};
 try{if(raw.length>100000)throw Error();const s=JSON.parse(raw);const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e7;
 if(s.schema!==1||s.version!==version||!Array.isArray(s.cards)||s.cards.length>documents.length||!lenses.includes(s.lens))throw Error();
 if(s.viewport&&(!finite(s.viewport.x)||!finite(s.viewport.y)||!finite(s.viewport.zoom)||s.viewport.zoom<.35||s.viewport.zoom>1.8))throw Error();
 const seen=new Set();for(const c of s.cards){if(!documents.includes(c.document)||c.id!==`doc-${c.document}`||seen.has(c.id)||!finite(c.position?.x)||!finite(c.position?.y)||typeof c.expanded!=='boolean'||!finite(c.scroll)||c.scroll<0||!Array.isArray(c.sources)||!c.sources.every((n:unknown)=>nodes.includes(n as string)))throw Error();seen.add(c.id);}
 if(s.active!==null&&!seen.has(s.active)||s.selected!==null&&!nodes.includes(s.selected))throw Error();
 return {workspace:{schema:1,version,lens:s.lens,selected:s.selected,active:s.active,cards:s.cards.map((c:Card)=>({id:c.id,document:c.document,position:{...c.position},expanded:c.expanded,scroll:c.scroll,sources:[...c.sources]})),viewport:s.viewport?{x:s.viewport.x,y:s.viewport.y,zoom:s.viewport.zoom}:null},notice:''};
 }catch{return {workspace:empty,notice:'The saved canvas could not be restored. A fresh canvas is ready.'};}
}
