// Supplemental projection for exact previously unresolved row schemas; no fresh admission.
// Open Questions: evidence/G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json.
import {freezeCaseIdentity} from './source-freeze-exposure-r1.mjs';
import {directoryCaseId} from './source-directory-exposure-r1.mjs';
const unresolved=reason=>({posture:'unresolved',reason});
export function supplementalRowIdentity(row){
 if(!row||typeof row!=='object'||Array.isArray(row))return unresolved('row-shape');
 const direct=row.case_id!==undefined||row.project!==undefined||row.bug!==undefined;
 const base=direct?freezeCaseIdentity(row):null;
 if(direct&&base.posture==='unresolved')return base;
 // A cell object is a transport configuration, not an identity. Never inspect it.
 let cell=null;
 if(typeof row.cell==='string'){
  if(!/^Defects4J-[A-Za-z]+-[1-9][0-9]{0,4}-(?:baseline|index)$/.test(row.cell))return unresolved('unknown-cell-format');
  cell=directoryCaseId(row.cell);if(!cell)return unresolved('unknown-cell-namespace');
 }
 let instance=null;
 if(row.instance_id!==undefined){
  if(typeof row.instance_id!=='string'||row.instance_id.length>256)return unresolved('instance-id-shape');
  if(!/^(?:SWE-Bench-Pro|SWE-Bench-Verified|Multi-SWE-Bench)__(?:python|cpp)__maintenance__bugfix__[a-f0-9]{8}$/.test(row.instance_id))return unresolved('unsupported-instance-namespace');
  instance=row.instance_id;
 }
 if(instance&&(cell||direct))return unresolved('mixed-identity-namespaces');
 if(cell&&direct&&base.case_id!==cell)return unresolved('cell-coordinate-conflict');
 if(instance)return {posture:'other-dataset-prepared-exclusion',dataset_namespace:instance.split('__')[0],instance_id:instance,cross_dataset_alias_reconciled:false};
 if(cell)return {posture:'recognized-prepared-exclusion',case_id:cell};
 if(base)return base;
 return unresolved('no-supported-identity');
}
