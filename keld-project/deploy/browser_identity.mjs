// Input: JSON array of {name,password} over stdin; never prints credentials or codes.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
if(!process.env.CHROMIUM_EXECUTABLE)throw new Error('CHROMIUM_EXECUTABLE is required');
import {createHash,randomBytes} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const buyers=JSON.parse(input);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true});
try {
 for(const buyer of buyers){
  const context=await browser.newContext();const page=await context.newPage();let returned=false;
  const state=randomBytes(16).toString('hex');
  const verifier=randomBytes(32).toString('base64url');
  const url=new URL('https://auth.staging.keld.studio/realms/keld/protocol/openid-connect/auth');
  url.search=new URLSearchParams({client_id:'keld',response_type:'code',redirect_uri:'https://staging.keld.studio/auth/callback',scope:'openid',state,nonce:randomBytes(16).toString('hex'),code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
  await page.goto(url.toString());await page.locator('#username').fill(buyer.name);await page.locator('#password').fill(buyer.password);await page.locator('#kc-login').click();
  try { await page.waitForURL(url=>url.origin==='https://staging.keld.studio'&&url.pathname==='/auth/callback',{timeout:15000}); }
  catch {console.log(JSON.stringify({phase:'login',path:new URL(page.url()).pathname,pageText:(await page.locator('body').innerText()).slice(0,1000)}));throw new Error('login-redirect-timeout');}
  await page.waitForLoadState('load');const callback=new URL(page.url());returned=Boolean(callback.searchParams.get('code'))&&callback.searchParams.get('state')===state;if(!returned)throw new Error('identity-authorization-failed');
  console.log(JSON.stringify({buyer:buyer.name,authorizationRedirect:true,applicationSessionTested:false}));await context.close();
 }
}finally{await browser.close();}
