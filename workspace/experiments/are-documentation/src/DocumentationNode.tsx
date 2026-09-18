import {countPerformance} from './performanceMetrics';
import {memo,useLayoutEffect,useRef} from 'react';
import {Handle,Position,type Node,type NodeProps} from '@xyflow/react';
import type {Card} from './canvasWorkspace';
import {findDocument} from './documentationContent';
import {Markdown} from './Markdown';
export type CardView=Pick<Card,'id'|'document'|'expanded'|'scroll'>;
export type DocumentActions={toggle:(id:string)=>void;close:(id:string)=>void;read:(id:string,doc:string)=>void;scroll:(id:string,n:number)=>void;readScroll:(id:string,fallback:number)=>number;move:(id:string,x:number,y:number)=>void;openDocument:(id:string,anchor:string)=>void};
export type DocumentationNodeType=Node<{card:CardView;active:boolean;actions:DocumentActions},'documentation'>;
export const DocumentationNode=memo(function DocumentationNode({data}:NodeProps<DocumentationNodeType>){
 countPerformance('card.render');countPerformance(`card.render.${data.card.document}`);
 const {card}=data,doc=findDocument(card.document)!,body=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{if(body.current)body.current.scrollTop=data.actions.readScroll(card.id,card.scroll);},[card.id,card.expanded]);
 return <article className={`documentation-card ${data.active?'active':''}`} aria-label={`${doc.title} card`} data-document={doc.id}>
 <Handle type="target" position={Position.Left}/>
 <header className="document-drag-handle" tabIndex={0} aria-label={`Move ${doc.title}; use arrow keys`} onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};if(delta[e.key]){e.preventDefault();e.stopPropagation();data.actions.move(card.id,...delta[e.key]);}}}><span className="drag-grip" aria-hidden="true">⠿</span><strong>{doc.title}</strong><button className="nodrag nopan" onClick={()=>data.actions.close(card.id)} aria-label={`Close ${doc.title}`}>×</button></header>
 <div className="document-actions nodrag nopan"><button aria-expanded={card.expanded} onClick={()=>data.actions.toggle(card.id)}>{card.expanded?'Collapse':'Expand'}</button><button className="read-document" onClick={()=>data.actions.read(card.id,card.document)}>Read full documentation ↗</button></div>
 {card.expanded&&<div className="document-body nodrag nopan nowheel" ref={body} onScroll={e=>data.actions.scroll(card.id,e.currentTarget.scrollTop)}><p className="document-status">{doc.status} · documentation preview</p><p className="document-summary">{doc.summary}</p><Markdown text={doc.markdown} doc={doc.id} origin={card.id} prefix={`${card.id}-`} onDocument={data.actions.openDocument}/></div>}
 </article>;
});
