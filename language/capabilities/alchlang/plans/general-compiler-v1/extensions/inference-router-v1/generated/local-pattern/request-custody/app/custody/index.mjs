import {invoke as policy} from '../../modules/Policy/app/function/index.mjs';
import {createCustodyDispatcher} from './custody-runtime.js';
import contract from '../../custody.json' with {type:'json'};
export const createCustody=options=>createCustodyDispatcher(contract,{...options,policy:options?.policy??(input=>policy(input,{}, {localOnly:true}))});
export {contract,policy};
