
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"2f1c5026a89cd877afbd8d5efb61c1ad882511b0af23b055d790c5ea26a20e9b","ontology_sha256":"647cc3413df7db6b03497dfb2cfcc1b269fb1a40e41b5eb3f53089d4009c0103","behavior_sha256":"6880fbba089b356a306e6e624fc97d4ec8efbc5e2ab61aad89de6e8ab57b3d5f","contract_sha256":"83c24534e8ad63b11a3af09485a4091102b02d679e66a945bc40851ccf3b4ee4"},manifest},createBoundary,modules);
export default {fetch:handler};
