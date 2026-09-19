
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"c901d989b28ea985ee615fe9df4085175d2030d741e9603be11ccbdfde28836c","ontology_sha256":"b6602240a1677a9145b2205edc088f75f8b44df50ede9d9fdcc7ac6f836206e9","behavior_sha256":"a991f815a2f0cf293de4cfb9c1b488591b50e47a9cafabb851bcb7824dedf04e","contract_sha256":"8464c65981c1ec826b9b4d98f9229abb23e9735b0565a898ccf57674b09dd392"},manifest},createBoundary,modules);
export default {fetch:handler};
