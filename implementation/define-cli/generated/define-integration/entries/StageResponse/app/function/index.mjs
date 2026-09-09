
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
export const invokeWithTrace=createTracedInvoker(model,bindings,api,execute,validateInput,ontology,{...{"source_sha256":"4aa7d2f9e9d7d9baaf8192b00c6c28217ea4b4ed1f6cd1cd1eba4f66cdbf9784","ontology_sha256":"d247373c1cae31663ca4b2633046a6e8e6cca72beaac1ca00fe8d23abb618625","behavior_sha256":"3df0def7cc90779c643a67499dba0727e29e123f761de3112185b51486c0e5ce","contract_sha256":"c9273b9df9fbf0a0041e40eb326508a184a27fda136bb714387ee926c78949e6"},manifest},createBoundary,modules);
export default {fetch:handler};
