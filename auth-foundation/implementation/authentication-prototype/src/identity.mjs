import * as oidc from 'openid-client';
import {createRemoteJWKSet,jwtVerify,importPKCS8,SignJWT} from 'jose';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
export const now=()=>Math.floor(Date.now()/1000);
export async function configuration(c, api=false) {
 if(c.issuer!=='http://localhost:18080/realms/auth-prototype'||c.origin!=='http://localhost:13000')throw Error('This build is loopback-only');
 return oidc.discovery(new URL(c.issuer),api?'prototype-api':c.browserClient,api?c.apiSecret:c.browserSecret,undefined,{execute:[oidc.allowInsecureRequests],timeout:3});
}
export function verifier(c, testKeys) {
 const keys=testKeys || createRemoteJWKSet(new URL(c.issuer+'/protocol/openid-connect/certs'),{timeoutDuration:3000,cooldownDuration:1000,cacheMaxAge:60000});
 return async token=>{
  if(typeof token!=='string'||token.length>16000)throw Error('Invalid token');
  const {payload}=await jwtVerify(token,keys,{issuer:c.issuer,audience:'prototype-api',algorithms:['RS256'],requiredClaims:['iss','sub','aud','exp','iat','jti'],clockTolerance:0});
  if(payload.typ!=='Bearer'||!Number.isInteger(payload.exp)||!Number.isInteger(payload.iat)||payload.iat>now()||payload.exp-payload.iat>300||!['prototype-browser','prototype-service'].includes(payload.azp))throw Error('Invalid access-token profile');
  return payload;
 };
}
export async function active(config,token,payload) {
 const result=await oidc.tokenIntrospection(config,token);
 if(result.active!==true||result.sub!==payload.sub||result.client_id!==payload.azp||result.exp!==payload.exp)throw Error('Inactive token');
}
export async function serviceToken(c) {
 const key=await importPKCS8(await readFile(new URL('../.runtime/service-private.pem',import.meta.url),'utf8'),'RS256');
 const endpoint=c.issuer+'/protocol/openid-connect/token';
 const assertion=await new SignJWT({}).setProtectedHeader({alg:'RS256'}).setIssuer(c.serviceClient).setSubject(c.serviceClient).setAudience(endpoint).setIssuedAt().setExpirationTime('30s').setJti(randomUUID()).sign(key);
 const r=await fetch(endpoint,{method:'POST',body:new URLSearchParams({grant_type:'client_credentials',client_id:c.serviceClient,client_assertion_type:'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',client_assertion:assertion}),signal:AbortSignal.timeout(3000)});
 if(!r.ok)throw Error('Service authentication failed: '+r.status);
 return r.json();
}
