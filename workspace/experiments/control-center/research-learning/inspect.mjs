import {loadInput} from './adapter.mjs';
import {buildView,renderHtml} from './view.mjs';
const args=process.argv.slice(2);
if(args.length>1 || (args.length && !['--html','--registration'].includes(args[0])))throw Error('Usage: node inspect.mjs [--html|--registration]');
const {registration,view}=buildView(loadInput());
console.log(args[0]==='--html'?renderHtml(view):JSON.stringify(args[0]==='--registration'?registration:view,null,2));
