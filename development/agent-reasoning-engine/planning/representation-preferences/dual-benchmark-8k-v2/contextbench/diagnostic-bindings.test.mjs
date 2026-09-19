import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';import {verifyDiagnosticBindings} from './diagnostic-bindings.mjs';
test('diagnostic binds its wrapper and independently audited evidence, rejecting drift or omission',()=>{
 const root=mkdtempSync(join(tmpdir(),'diagnostic-bindings-'));try{
 for(const name of ['wrapper','evidence'])writeFileSync(join(root,name),name);
 const bound=name=>({path:name,sha256:createHash('sha256').update(readFileSync(join(root,name))).digest('hex')});
 writeFileSync(join(root,'prior'),JSON.stringify({result_integrity_approved:true,classification:'inconclusive',source_bindings:[bound('evidence')]}));
 const args={root,required_paths:['wrapper'],prior_review_path:'prior',review:{source_bindings:[bound('wrapper'),bound('prior')]}};
 assert.equal(verifyDiagnosticBindings(args).verified,true);
 assert.throws(()=>verifyDiagnosticBindings({...args,review:{source_bindings:[bound('prior')]}}),/required-binding-missing/);
 writeFileSync(join(root,'evidence'),'changed');assert.throws(()=>verifyDiagnosticBindings(args),/binding-drift/);writeFileSync(join(root,'evidence'),'evidence');
 writeFileSync(join(root,'wrapper'),'changed');assert.throws(()=>verifyDiagnosticBindings(args),/binding-drift/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
