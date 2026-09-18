// Round-two role introduction remains; the context controls now belong to walkthrough-proof.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const b=await chromium.launch({headless:true,executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
let checks=0;
try{for(const [width,height] of [[1440,900],[331,587],[240,320]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto('http://127.0.0.1:4193/');
 await p.getByRole('figure',{name:'How the work stays connected'}).waitFor();checks++;
 const clear=await p.locator('.role-flow').evaluate(el=>{const r=[...el.children].map(e=>e.getBoundingClientRect());return r.every((a,i)=>r.slice(i+1).every(b=>a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top))});
 if(!clear)throw Error('Role overlap at '+width);checks++;
 if(!(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)))throw Error('Overflow at '+width);checks++;await p.close();
}console.log({status:'PASS',checks})}finally{await b.close()}
