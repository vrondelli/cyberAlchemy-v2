
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"88b7e5a2c8a92c9cc47942e8c488d559aafaa666fd3786cb3749a21bc2a42b9a","ontology_sha256":"c6d3e58b385a4ba70e0777cf710efa63352e780b621d799d9a5f6f618ef81632","behavior_sha256":"bfa38a554c76cc09d7646b64948a57d8dae7f68b86025a562ce9603632acdf70","contract_sha256":"01e9d7214911b09ca7c933c87a4dad99415ec624fbddb17bcac99506d3f620a4"},manifest},createBoundary,modules);
export default {fetch:handler};
