import {createBoundary} from './runtime.mjs';
import {execute,validateInput} from './behavior.mjs';
import api from './domain-runtime/domain.js';
import model from './function.json' with {type:'json'};
import bindings from './bindings.json' with {type:'json'};
export const {invoke,handler}=createBoundary(model,bindings,scope=>execute(scope,api),validateInput);
export default {fetch:handler};
