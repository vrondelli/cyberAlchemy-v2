import {engineNodes,neighbors} from './engineGraph.ts';
// Every explanation retains its authored guide facts, including scope and limits.
export const engineStories=Object.fromEntries(engineNodes.map(node=>[node.id,{
 title:node.title,explanation:node.detail,
 facts:node.sources.filter((s,i,a)=>a.findIndex(x=>x.detail===s.detail)===i),
 incoming:neighbors(node.id).filter(e=>e.target===node.id),
 outgoing:neighbors(node.id).filter(e=>e.source===node.id),
 limit:node.guides.includes('interaction-learning')?'Interaction learning is a prototype and off by default. Delivery does not prove use or improvement.':'This describes the engine design, not a live execution trace.',
}]));
