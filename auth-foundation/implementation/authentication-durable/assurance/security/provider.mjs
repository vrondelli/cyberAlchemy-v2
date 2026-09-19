import {readFileSync} from 'node:fs';const {mutant}=JSON.parse(readFileSync(process.argv[2]));const {securityRequestAllowed,securityAction,authenticationAfterRevocation}=await import(mutant?'./policy-mutant.mjs':'./policy.mjs');
const valid={origin:'https://app.example',expectedOrigin:'https://app.example',csrf:'c'.repeat(43),expectedCsrf:'c'.repeat(43),action:'CONFIGURE_TOTP'};
const cases=[];for(const action of ['CONFIGURE_TOTP','CONFIGURE_RECOVERY_AUTHN_CODES','UPDATE_PASSWORD'])cases.push(()=>securityRequestAllowed({...valid,action})===true);
for(const change of [{origin:'https://evil.example'},{origin:undefined},{csrf:undefined},{csrf:'wrong'},{expectedCsrf:'d'.repeat(43)},{action:'delete_credential:other'},{action:'__proto__'},{action:null}])cases.push(()=>securityRequestAllowed({...valid,...change})===false);
cases.push(()=>{try{securityAction('UPDATE_PASSWORD arbitrary');return false}catch{return true}});
for(const [auth,fence,expected] of [[100,101,false],[101,101,true],[102,101,true],[102,undefined,false]])cases.push(()=>authenticationAfterRevocation(auth,fence)===expected);
const failed=cases.filter(c=>!c()).length;console.log(JSON.stringify({outcome:failed?'fail':'pass',reason_code:failed?'SECURITY_ORIGIN_MUTANT':'SECURITY_ACTION_BOUNDARY',cases:cases.length,failed_cases:failed}));
