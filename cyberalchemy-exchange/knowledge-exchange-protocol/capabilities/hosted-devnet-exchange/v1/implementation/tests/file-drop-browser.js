// Run with playwright-cli run-code; isolated context, no account or upload writes.
async page => {
 const context=await page.context().browser().newContext();
 const p=await context.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 try {
 await p.goto('http://127.0.0.1:8783/console-experience/#new/share');
 await p.locator('[data-file-drop]').waitFor();
 const drop=async(names,sizes=[],selector='[data-file-drop]',folder=false)=>p.evaluate(({names,sizes,selector,folder})=>{
  const dt=new DataTransfer();names.forEach((name,i)=>dt.items.add(new File([new Uint8Array(sizes[i]??12)],name)));
  if(folder)Object.defineProperty(dt,'items',{value:[{webkitGetAsEntry:()=>({isDirectory:true})}]});
  const target=document.querySelector(selector);
  const over=new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt});target.dispatchEvent(over);
  const highlighted=!!document.querySelector('.is-dragging');
  const event=new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt});target.dispatchEvent(event);
  return {highlighted,prevented:event.defaultPrevented};
 },{names,sizes,selector,folder});
 let result=await drop(['art.png']);
 check(result.highlighted&&result.prevented,'valid drag highlights and prevents browser navigation');
 check(await p.locator('.selected-file strong').textContent()==='art.png','drop selects filename');
 check(await p.locator('[data-retention]').evaluate(e=>e.open),'valid drop opens retention');
 await p.locator('#policy-accept').check();await drop(['replacement.png']);
 check(!await p.locator('#policy-accept').isChecked(),'replacement resets acceptance');
 for(const scenario of [{n:['large.bin'],s:[10000001],msg:'10 MB'},{n:['a','b'],msg:'one file'},{n:['folder'],folder:true,msg:'folder'}]){
  await drop(scenario.n,scenario.s||[],undefined,scenario.folder);
  check((await p.locator('#workspace-status').textContent()).includes(scenario.msg),'reject '+scenario.msg);
  check(await p.locator('.selected-file strong').textContent()==='replacement.png','rejection preserves selection '+scenario.msg);
 }
 result=await drop(['outside.txt'],[],'h1');check(result.prevented&&!result.highlighted,'outside drop prevented');
 check(await p.locator('.selected-file strong').textContent()==='replacement.png','outside drop preserves selection');
 await p.locator('#draft-file').setInputFiles('/tmp/kep-drop-picker.txt');
 check(await p.locator('.selected-file strong').textContent()==='kep-drop-picker.txt','picker still works');
 await p.locator('#draft-file').focus();check(await p.locator('#draft-file').evaluate(e=>e===document.activeElement),'picker can receive keyboard focus');
 for(const width of [320,375,768,1440]){await p.setViewportSize({width,height:900});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);}
 check(errors.length===0,'no browser errors');
 return {status:'PASS',checks};
 }finally{await context.close();}
}
