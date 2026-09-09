
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"16658fab1fb5004716a1df941e4559bd2a92b59a3b642767c067096cda528785","ontology_sha256":"98f409fe972dbcb247c6f20cb94059ddf5f6091cde725825967140deb9295539","behavior_sha256":"1d4ccd21ab49a6dfee2193fbc50c8f56199b6adb1c0d3a34b927582c966488b5","contract_sha256":"5830dacbd7517656c050ca3feb4b472ec39dc2e83fc6aaa004b01f3d421eae32"},manifest},createBoundary,modules);
export default {fetch:handler};
