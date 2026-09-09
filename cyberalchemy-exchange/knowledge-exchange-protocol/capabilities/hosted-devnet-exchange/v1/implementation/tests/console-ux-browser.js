async page=>{
 const context=await page.context().browser().newContext({acceptDownloads:true});
 const p=await context.newPage();
 await p.addInitScript(()=>{
  let pair;
  window.solana={publicKey:null,async connect(){
   if(!pair){const saved=sessionStorage.getItem('kep-account-test-wallet');if(saved){const v=JSON.parse(saved);pair={privateKey:await crypto.subtle.importKey('jwk',v.privateKey,'Ed25519',true,['sign']),publicKey:await crypto.subtle.importKey('jwk',v.publicKey,'Ed25519',true,['verify'])};}else{pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);sessionStorage.setItem('kep-account-test-wallet',JSON.stringify({privateKey:await crypto.subtle.exportKey('jwk',pair.privateKey),publicKey:await crypto.subtle.exportKey('jwk',pair.publicKey)}));}}
   const bytes=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey));let n=BigInt('0x'+[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')),s='';const chars='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){s=chars[Number(n%58n)]+s;n/=58n;}for(const b of bytes){if(b)break;s='1'+s;}this.publicKey={toString:()=>s};
  },async signMessage(message){return {signature:new Uint8Array(await crypto.subtle.sign('Ed25519',pair.privateKey,message))};}};
 });

 const errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
 const check=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
 const done=()=>p.waitForFunction(()=>document.querySelector('#notice-message')?.textContent==='Done.');
 try{
 await p.goto('http://127.0.0.1:8783/console-experience/#identity');
 await p.locator('[data-action=account-lookup]').click();await done();
 await p.locator('[data-action=account-create]').click();await done();
 const recovery=p.waitForEvent('download');await p.locator('[data-action=account-backup]').click();await (await recovery).saveAs('/tmp/kep-ux-browser/recovery.json');
 await p.locator('#backup-confirmed').check();await p.locator('[data-action=account-finish]').click();await done();
 check(!await p.locator('#public-card').isVisible(),'public card hidden by default');
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedCard=text;}}}));
 await p.locator('[data-action=copy-card]').click();check(await p.locator('[data-action=copy-card]').textContent()==='Copied ✓','inline copy feedback');
 check(await p.evaluate(()=>!!JSON.parse(window.copiedCard).publicKeyBase64),'copy contains public identity');
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
 await p.locator('[data-action=copy-card]').click();check(await p.locator('#public-card').isVisible(),'clipboard failure reveals manual fallback');
 await p.locator('#dismiss-notice').click();check(!await p.locator('#workspace-status').isVisible(),'error is dismissible');
 await p.locator('[data-action=account-sync]').click();await done();await p.waitForFunction(()=>document.querySelector('#workspace-status').hidden,{},{timeout:6000});
 check(!await p.locator('#workspace-status').isVisible(),'success auto-dismisses');
 await p.locator('#nav-new').click();await p.locator('[data-route="new/share"]').click();
 await p.locator('#draft-file').setInputFiles('/tmp/kep-ux-browser/original.bin');await p.locator('#policy-accept').check();await p.locator('#draft-form button[type=submit]').click();
 await p.locator('[data-action=upload]').click();await done();
 let unexpectedDownloads=0;const observeDownload=()=>unexpectedDownloads++;p.on('download',observeDownload);
 for(const [status,message] of [[403,'This identity has no access.'],[410,'This package has expired.'],[503,'Retrieval interrupted. Try again.']]){
  await p.route('**/v1/files/*/access',route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify({message})}));
  await p.locator('[data-action=download]').click();await p.waitForFunction(text=>document.querySelector('#notice-message').textContent.includes(text),message);
  check(!await p.locator('[data-action=save]').count(),'failed access exposes no unverified save '+status);
  await p.unroute('**/v1/files/*/access');
 }
 check(unexpectedDownloads===0,'denied, expired and interrupted access never downloads');p.off('download',observeDownload);
 await p.route('**/v1/files/*/acknowledge',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Acknowledgement temporarily unavailable. Retry acknowledgement.'})}));
 const download=p.waitForEvent('download');await p.locator('[data-action=download]').click();await (await download).saveAs('/tmp/kep-ux-browser/download.bin');
 await p.waitForFunction(()=>document.querySelector('#workspace-status').classList.contains('error'));
 check(await p.locator('[data-action=save]').textContent()==='Save again','single save-again primary');
 check(await p.locator('[data-action=download]').count()===0,'no duplicate download control');
 check(await p.locator('[data-action=ack]').isVisible(),'ack failure keeps explicit retry');
 await p.unroute('**/v1/files/*/acknowledge');await p.locator('[data-action=ack]').click();await done();
 let requests=0;p.on('request',()=>requests++);
 const again=p.waitForEvent('download');await p.locator('[data-action=save]').click();await (await again).saveAs('/tmp/kep-ux-browser/again.bin');
 check(requests===0,'save again makes no network requests');
 for(const width of [320,375,768,1440]){await p.setViewportSize({width,height:900});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'console fits '+width);}
 await p.locator('#dismiss-notice').click();await p.locator('#nav-new').click();check(!await p.locator('#workspace-status').isVisible(),'navigation clears old notification');
 check(errors.length===0,'no page errors');return {status:'PASS',checks};
 }finally{await context.close();}
}
