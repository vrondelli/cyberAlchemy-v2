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
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const done=()=>p.waitForFunction(()=>document.querySelector('#workspace-status')?.textContent==='Done.');
 await p.goto('http://127.0.0.1:8797/console-experience/?account=1#identity');
 await p.locator('[data-action=account-lookup]').click();await done();
 await p.locator('[data-action=account-create]').click();await done();
 const backupPromise=p.waitForEvent('download');await p.locator('[data-action=account-backup]').click();const backup=await backupPromise;await backup.saveAs('/tmp/kep-image-r2-20260906/test-recovery.json');
 await p.locator('#backup-confirmed').check();await p.locator('[data-action=account-finish]').click();await done();
 let saveFailed=false;
 await p.route('**/v1/account/write',async route=>{if(!saveFailed){saveFailed=true;await route.abort('failed');}else await route.continue();});
 await p.locator('[data-action=account-sync]').click();
 await p.waitForFunction(()=>document.querySelector('#workspace-status')?.classList.contains('error'));
 await p.locator('[data-action=account-sync]').click();await done();
 await p.unroute('**/v1/account/write');
 const identityBefore=await p.locator('#public-card').inputValue();
 await p.locator('#nav-new').click();await p.locator('[data-route="new/share"]').click();await p.locator('#draft-file').setInputFiles('/tmp/kep-original-binary.bin');await p.locator('#policy-accept').check();await p.locator('#draft-form button[type=submit]').click();await p.locator('[data-action=upload]').click();await done();
 await p.reload();await p.locator('#account-label').click();await p.locator('[data-action=account-lookup]').click();await done();await p.locator('#recovery-file').setInputFiles('/tmp/kep-image-r2-20260906/test-recovery.json');await p.locator('[data-action=account-unlock]').click();await done();await p.waitForFunction(()=>document.querySelector('#workspace-status').textContent==='',{},{timeout:6000});if(await p.locator('#workspace-status').isVisible())throw Error('Success notice remained visible');
 const rows=await p.locator('.exchange-row').count();if(rows!==1)throw Error('Expected one restored exchange, got '+rows);
 await p.locator('#account-label').click();if(await p.locator('#public-card').inputValue()!==identityBefore)throw Error('Identity changed after recovery');
 await p.locator('#nav-overview').click();await p.locator('.exchange-row').click();let accessCount=0,ackFailed=false;
 p.on('request',r=>{if(r.url().endsWith('/access'))accessCount++;});
 await p.route('**/acknowledge',async route=>{if(!ackFailed){ackFailed=true;await route.abort('failed');}else await route.continue();});
 await p.locator('[data-action=download]').click();
 await p.waitForFunction(()=>document.querySelector('#workspace-status')?.classList.contains('error'));
 await p.locator('[data-action=ack]').click();await done();
 if(accessCount!==1)throw Error('Receipt retry repeated access: '+accessCount);
 await p.unroute('**/acknowledge');
 const downloadPromise=p.waitForEvent('download');await p.locator('[data-action=save]').click();const download=await downloadPromise;await download.saveAs('/tmp/kep-image-r2-20260906/restored-original.bin');
 await p.locator('#account-label').click();await p.setViewportSize({width:1280,height:900});await p.screenshot({path:'/tmp/kep-image-r2-20260906/account-unlocked.png'});await p.setViewportSize({width:320,height:900});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 await p.locator('[data-action=account-lock]').click();if(await p.locator('#public-card').count())throw Error('Identity remains visible after lock');
 if(errors.length)throw Error(errors.join());
 await context.close();return {passed:true,restoredPackages:rows,identityStable:true,downloadVerified:true,interruptedAccountSaveRecovered:saveFailed,interruptedReceiptRecovered:ackFailed,accessCount,mobileOverflow:false,errors};
}
