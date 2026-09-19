import assert from 'node:assert/strict';import {randomUUID,randomBytes} from 'node:crypto';
import {loadBackup,seal,unseal} from './backup.mjs';import {docker,report} from './common.mjs';
const payload=loadBackup(process.argv[2]); // Authenticate before any Docker effect.
const key=randomBytes(32),sample=seal(Buffer.from('tamper fixture'),key),bad=Buffer.from(sample);bad[bad.length-1]^=1;assert.throws(()=>unseal(bad,key));assert.throws(()=>unseal(sample,randomBytes(32)));
const name='auth-restore-'+randomUUID(),label='auth-foundation.restore-test',image='postgres@sha256:67f41722b7a8cbdb868a44a4995c846eddfdc2973bccb291ce937dce88ad5675';let started=false;
const sql=(db,text)=>docker(['exec','-i',name,'psql','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-At'],{input:text}).toString().trim();
try{docker(['run','-d','--name',name,'--label',label+'=true','--network','none','--tmpfs','/var/lib/postgresql/data:rw','-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);started=true;
 for(let i=0;;i++){try{docker(['exec',name,'pg_isready','-U','postgres']);break;}catch{if(i>=60)throw Error('Restore PostgreSQL readiness failed');await new Promise(r=>setTimeout(r,500));}}
 const checks=['authenticated-encryption-tamper-rejected','wrong-key-rejected'],counts={};
 for(const db of payload.databases){docker(['exec',name,'createdb','-U','postgres',db.name]);docker(['exec','-i',name,'pg_restore','-U','postgres','-d',db.name,'--no-owner','--no-acl','--exit-on-error'],{input:Buffer.from(db.dump,'base64')});
  if(db.name==='issuer'){
   const summary="SELECT type||':'||count(*) FROM credential WHERE type IN ('password','otp','webauthn-passwordless') GROUP BY type ORDER BY type";const before=sql(db.name,summary);
   sql(db.name,`BEGIN; TRUNCATE offline_client_session,offline_user_session,auth_session,root_auth_session CASCADE; DELETE FROM credential WHERE type='recovery-authn-codes'; UPDATE realm SET not_before=extract(epoch FROM now())::integer+90; UPDATE user_entity SET not_before=extract(epoch FROM now())::integer+90; COMMIT;`);
   assert.equal(sql(db.name,summary),before);assert.equal(sql(db.name,'SELECT count(*) FROM offline_user_session'),'0');assert.equal(sql(db.name,"SELECT count(*) FROM credential WHERE type='recovery-authn-codes'"),'0');counts.credentials=before.split('\n');checks.push('issuer-restored-accounts-and-MFA-preserved','issuer-restored-sessions-and-recovery-codes-removed','issuer-90-second-OTP-quarantine');
  }else{sql(db.name,'TRUNCATE af_login_transactions,af_session_families,af_session_handles CASCADE');assert.equal(sql(db.name,'SELECT count(*) FROM af_session_families'),'0');if(db.name==='bodywar'){sql(db.name,'TRUNCATE auth_access_tokens,auth_sessions,body_war_oauth_states CASCADE');counts.bodywarProfiles=Number(sql(db.name,'SELECT count(*) FROM body_war_runner_profiles'));}checks.push(db.name+'-restored-login-state-discarded');}
 }
 const inspection=JSON.parse(docker(['inspect',name]))[0];assert.equal(inspection.HostConfig.NetworkMode,'none');assert.equal(Object.keys(inspection.HostConfig.PortBindings||{}).length,0);checks.push('restore-isolated-with-no-published-ports');report('restore',{status:'passed',checks,counts,live_databases_modified:false});console.log('PASS '+checks.length+' backup/restore checks');
}finally{if(started){const info=JSON.parse(docker(['inspect',name]))[0];if(info.Config.Labels?.[label]!=='true')throw Error('Restore container ownership mismatch');docker(['rm','-f',name]);}}
