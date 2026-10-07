// Open Questions: evidence/G01-JACOCO-FEASIBILITY-R3.json.
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export function classInventory(root){const out=[];function walk(dir,prefix=''){for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const p=prefix+e.name;if(e.isSymbolicLink())throw Error('jacoco.class-symlink');if(e.isDirectory())walk(join(dir,e.name),p+'/');else if(e.isFile()&&p.endsWith('.class')){const b=readFileSync(join(root,p));out.push({path:p,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}}}walk(root);if(!out.length)throw Error('jacoco.no-classfiles');return out;}
export function bindClassInfo(text,inventory,instrumentation){const rows=[],seen=new Set();for(const line of text.split('\n')){if(!line.trim()||line.includes('INST   BRAN')||line.startsWith('[INFO]'))continue;const m=/^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/]+)$/.exec(line);if(!m)throw Error('jacoco.classinfo-shape');const name=m[7],file=inventory.find(x=>x.path===name+'.class');if(!file||seen.has(name))throw Error('jacoco.classinfo-membership');seen.add(name);rows.push({...file,name,class_id:m[6],executable_lines:Number(m[3])});}
 if(rows.length!==inventory.length)throw Error('jacoco.classinfo-incomplete');
 for(const name of instrumentation.classes)if(!seen.has(name.replaceAll('.','/')))throw Error('jacoco.missing-production-type');
 for(const r of rows){const name=r.name.replaceAll('/','.');if(!instrumentation.classes.some(n=>name===n||name.startsWith(n+'$'))&&!name.endsWith('.package-info')&&name!=='package-info'&&name!=='module-info')throw Error('jacoco.unmapped-production-class');}
 return rows;
}
