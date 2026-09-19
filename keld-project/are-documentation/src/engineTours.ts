import {engineEdges,engineNodeMap,workflowNodes} from './engineGraph.ts';
export type TourStep={id:string;node:string;nodes:string[];edges:string[];reason:string};
export type EngineTour={id:string;title:string;steps:TourStep[]};
const tour=(id:string,title:string,ids:string[]):EngineTour=>({id,title,steps:[...new Set(ids)].map(node=>{
 const edges=engineEdges.filter(e=>e.source===node);
 return {id:node,node,nodes:[node,...edges.map(e=>e.target)],edges:edges.map(e=>e.id),reason:edges.length?`${engineNodeMap[node].title}: ${edges[0].meaning} → ${engineNodeMap[edges[0].target].title}. The highlighted relations show its part in the design.`:'This is an outcome or boundary. Inspect the incoming connections to see how it is reached.'};
})});
export const engineTours=[
 tour('request','Follow a request',['request','route','context-decision','context-envelope','agent-host','proposed-effect','effect-assessment','host-policy','observed-result','continuation']),
 tour('understand','Understand a request',[...workflowNodes.concepts,...workflowNodes.workflows]),
 tour('connect','Connect your agent',[...workflowNodes.configuration,...workflowNodes.gateway,...workflowNodes.compatibility]),
 tour('memory','Manage memory and corrections',[...workflowNodes['working-memory'],...workflowNodes['interaction-learning'],...workflowNodes.privacy]),
 tour('operate','Operate the engine',[...workflowNodes.operations,...workflowNodes.privacy]),
];
export const findTour=(id:string)=>engineTours.find(t=>t.id===id);
export type TourState={id:string;step:string;status:'running'|'paused'|'completed'}|null;
export type TourAction={type:'start';id:string}|{type:'step';step:string}|{type:'pause'}|{type:'resume'}|{type:'exit'};
export function tourReducer(state:TourState,action:TourAction):TourState{
 if(action.type==='exit')return null;
 if(action.type==='start'){const t=findTour(action.id);return t?{id:t.id,step:t.steps[0].id,status:'running'}:state;}
 if(!state)return null;
 if(action.type==='pause')return {...state,status:state.status==='completed'?'completed':'paused'};
 if(action.type==='resume')return {...state,status:'running'};
 if(action.type==='step'){const t=findTour(state.id),index=t?.steps.findIndex(s=>s.id===action.step)??-1;return index<0?state:{...state,step:action.step,status:index===t!.steps.length-1?'completed':'running'};}
 return state;
}
export const tourNode=(state:TourState)=>state?findTour(state.id)?.steps.find(s=>s.id===state.step)?.node??null:null;
export const validStep=(id:string,step:string)=>Boolean(findTour(id)?.steps.some(s=>s.id===step&&engineNodeMap[s.node]));
