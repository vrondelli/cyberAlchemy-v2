// Final artifacts admitted by the existing guard. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import {join} from 'node:path';
export function persistCatalogFinalOutcome({persistence,supervision,value,failed=false}){
 const path=join(supervision,failed?'RESULTS-V2.json':'RESULTS.json');
 persistence.writeJson(path,value,{final:true});return path;
}
