export const suites={
 proxy:{command:['node','operations/test-proxy.mjs'],artifacts:['operations/proxy.json']},
 passkeys:{command:['node','operations/test-passkeys.mjs'],artifacts:['operations/passkeys.json']},
 windows:{command:['node','operations/windows-run.mjs'],artifacts:['operations/windows.json']},
 backup:{command:['node','operations/test-backup.mjs'],artifacts:['operations/restore.json']},
 rotation:{command:['node','operations/test-rotation.mjs'],artifacts:['operations/rotation-test.json']},
 restart:{command:['node','operations/test-restart.mjs'],artifacts:['operations/restart.json']},
 smtp:{command:['node','--test','operations/test-smtp.mjs'],artifacts:[]},
 buttons:{command:['node','scripts/test-mfa-buttons.mjs'],artifacts:['mfa-buttons/live.json']},
 store:{command:['node','--test','../session-core/test/store.test.mjs'],artifacts:[]},
 bodywar:{command:['npm','--prefix','../../../body-war-v2-auth-mfa','test'],artifacts:[]},
 security:{command:['node','scripts/test-security.mjs'],artifacts:['security-live.json']},
 account:{command:['node','scripts/test-account.mjs'],artifacts:['account-live.json']},
 delete:{command:['node','scripts/test-delete.mjs'],artifacts:['delete-live.json']},
 console:{command:['node','scripts/test-console.mjs'],artifacts:['repairs/console-actions.json']},
 lifecycle:{command:['node','scripts/test-lifecycle.mjs'],artifacts:['repairs/lifecycle.json']},
 evf:{command:['node','scripts/verify-evf.mjs'],artifacts:['repairs/evf.json']},
 'security-evf':{command:['node','scripts/verify-security-evf.mjs'],artifacts:['repairs/security-evf.json']},
 evidence:{command:['node','--test','scripts/test-receipts.mjs'],artifacts:[]}
};
export function requireCurrentReceipt(r,{suite,digest,logHash,artifacts}){
 const spec=suites[suite];
 if(!spec||r.schema_version!=='auth-source-test-receipt/v1'||r.suite!==suite||r.status!=='passed'||r.exit_code!==0||r.source_digest!==digest||r.after_source_digest!==digest||r.output_sha256!==logHash||JSON.stringify(r.command)!==JSON.stringify(spec.command)||spec.artifacts.some(p=>!artifacts[p]||r.artifacts?.[p]!==artifacts[p]))throw Error('Missing, stale or failed current evidence: '+suite);
}
