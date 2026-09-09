import {invoke as Started} from '../../modules/Started/app/function/index.mjs';
import {invoke as Delta} from '../../modules/Delta/app/function/index.mjs';
import {invoke as Completed} from '../../modules/Completed/app/function/index.mjs';
import {invoke as Failed} from '../../modules/Failed/app/function/index.mjs';
import {createStreamSession} from './stream-runtime.js';
import contract from '../../stream.json' with {type:'json'};
export const modules={Started,Delta,Completed,Failed};
export const createSession=session=>createStreamSession(contract,modules,session);
export {contract};
