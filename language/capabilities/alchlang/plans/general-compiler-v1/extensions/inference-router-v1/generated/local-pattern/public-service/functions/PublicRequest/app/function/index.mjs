
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"8c513f7c9bf6156b5a025b97ae565d36fe95ce012af79e424f19879f0ff4ee6a","ontology_sha256":"12bfeea1b6e6e2a42a3a1127e62328f3c56151d57abc8917e93e90d9d37f29cf","behavior_sha256":"16275d5e94616f3a43e5248c63ae64e990b99b23e20bc8856cb9891269c59f24","contract_sha256":"c564c3cf33b24df32485e8b4c1a4d1f837c6e38d900c67ff185bcb98d826e097"},manifest},createBoundary,modules);
export default {fetch:handler};
