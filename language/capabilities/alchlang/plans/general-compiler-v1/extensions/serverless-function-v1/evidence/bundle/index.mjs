import {createFunction} from './runtime.mjs';
import api from './domain-runtime/domain.js';
import model from './function.json' with {type:'json'};
export const {invoke,handler}=createFunction(model,api);
export default {fetch:handler};
