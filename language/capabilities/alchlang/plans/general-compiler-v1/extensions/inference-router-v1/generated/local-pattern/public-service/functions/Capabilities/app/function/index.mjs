
import {createBoundary} from '../../runtime/boundary.mjs';
import {createTracedInvoker} from '../../runtime/invocation-trace.mjs';
import ontology from '../../provenance/function/ontology.json' with {type:'json'};
import manifest from '../../manifest.json' with {type:'json'};
import {execute,validateInput} from './behavior.mjs';
import api from '../../domain/typescript/lib/index.js';
import model from '../../provenance/function/function.json' with {type:'json'};
import bindings from '../../provenance/function/bindings.json' with {type:'json'};
const modules={};
export function createInvoker(observe){const relay=event=>{const n=ontology.nodes.find(n=>n.name===event.declaration)??ontology.nodes.find(n=>n.kind==='result');observe?.({...event,definition:event.definition??(n?{name:n.name,id:n.id,source:n.source,clauses:n.clauses}:null)});};return createBoundary(model,bindings,scope=>execute(scope,api,relay),scope=>validateInput(scope,relay),modules,relay,(scope,binding)=>execute(scope,api,relay,binding),(scope,binding)=>execute(scope,api,relay,binding,'input'));};
export const {invoke,handler}=createInvoker();
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"cdcea890bf0c9f21645f029d21a66712816302e0c0b30b491b36d00edf56bdcf","ontology_sha256":"112ebff5c9fc0c3ca0b744528c8195588fe5dad0572d37cc110368d5de2b25af","behavior_sha256":"7d190fc9f10322183eca0e16d30b674bae5104d5b9d82efdc42c252ec0a13bfb","contract_sha256":"d020e5c47d933900a0915c6a460783a04084cbaeb0247599a64607b8aa9d6d22"},manifest},createBoundary,modules);
export default {fetch:handler};
