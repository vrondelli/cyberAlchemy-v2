
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"1319418dd4c0ef91975c66ae54ea5c5ee65deee12401f879f9ac279b5d6ec25e","ontology_sha256":"9f9e4657e38e60d741491ae7eb6d6312a9d14b3a20e60b0a1643dbdd51e04887","behavior_sha256":"5b080d64464f9c83249adb77c963f30d8bfc2af9a330c469e383a6ac50658780","contract_sha256":"69ae08e4c269e759de01c001bbadbd55ce5316050e222adb9de0c3449dfd5fd0"},manifest},createBoundary,modules);
export default {fetch:handler};
