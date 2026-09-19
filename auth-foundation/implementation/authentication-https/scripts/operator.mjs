import https from 'node:https';
import {readFile} from 'node:fs/promises';
import {PROFILES} from '../src/profiles.mjs';
const dir=new URL('../.runtime/',import.meta.url);
export async function operatorRequest(path,{method='GET',headers={},body,origin='https://localhost:19443'}={}){
 if(path!=='/admin/realms/auth-https'&&!path.startsWith('/admin/realms/auth-https/')&&path!=='/realms/auth-https/protocol/openid-connect/token')throw Error('Operator path outside selected realm');
 if(!Object.values(PROFILES).some(profile=>profile.operatorOrigin===origin))throw Error('Unapproved operator origin');
 const [ca,cert,key]=await Promise.all(['tls/ca.crt','tls/operator.crt','tls/operator.key'].map(p=>readFile(new URL(p,dir))));
 return new Promise((resolve,reject)=>{
  const req=https.request(new URL(path,origin),{ca,cert,key,method,headers,timeout:5000},res=>{const chunks=[];let size=0;res.on('data',x=>{size+=x.length;if(size>1048576)req.destroy(Error('Operator response limit'));else chunks.push(x)});res.on('end',()=>{const data=Buffer.concat(chunks).toString();resolve({ok:res.statusCode>=200&&res.statusCode<300,status:res.statusCode,json:async()=>JSON.parse(data),text:async()=>data})})});req.on('timeout',()=>req.destroy(Error('Operator timeout')));req.on('error',()=>reject(Error('Operator TLS request failed')));if(body)req.write(body);req.end();
 });
}
export async function operatorHeaders(c){
 const response=await operatorRequest('/realms/auth-https/protocol/openid-connect/token',{origin:c.operatorOrigin,method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:'https-provisioner',client_secret:c.provisionerSecret}).toString()});
 if(!response.ok)throw Error('Realm provisioning authentication failed: '+response.status);
 return {Authorization:'Bearer '+(await response.json()).access_token,'Content-Type':'application/json'};
}
