
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"fe4934b319c47bb7a9e9f649f3e18d993e591f3aa49238cd9f207d555727cd12","ontology_sha256":"d588f25e0cf4e336cd4c25e15b2a0f47a1ccdcd6cdf93ed6d278f312f6e7d5b1","behavior_sha256":"a017b7a7a1fcb947cec69d589e8a26f15dd4fd91c69521f6297c31320f533d00","contract_sha256":"5472c62845464bac746bf356c754d176c6d1eb65d285cda658741af9d8df7653"},manifest},createBoundary,modules);
export default {fetch:handler};
