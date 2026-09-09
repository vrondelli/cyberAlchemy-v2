import {invoke as f0} from '../../source-query/app/function/index.mjs';
import {invoke as f1} from '../../input-mapping/app/function/index.mjs';
import {invoke as f2} from '../../item-query/app/function/index.mjs';
import {createQueryIteration} from './runtime.mjs';
export const invoke=createQueryIteration({"sourceField":"aliases","inputField":"value","itemField":"value","outputField":"models","maxItems":100,"maxOutputBytes":65536,"maxInputBytes":262144,"timeoutMs":5000},f0,f1,f2);
