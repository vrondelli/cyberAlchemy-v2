import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const sizes=[[240,320],[257,413],[280,600],[320,480],[331,587],[360,300],[420,720],[487,319],[512,384],[640,360],[768,500],[1024,600],[1440,900],[1920,1080],[3440,1440]];const checks=[];const check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4193/#view=intro');await page.locator('.are-offer').waitFor();check('animation deferred before scroll',await page.locator('.hero-sticky').count()===0);await page.mouse.wheel(0,120);await page.getByRole('button',{name:'Pause animation',exact:true}).click();
for(const [width,height] of sizes){await page.setViewportSize({width,height});await page.waitForTimeout(800);
for(const p of [.20,.46,.765,1]){await page.evaluate(p=>{const el=document.querySelector('.scroll-hero');scrollTo({top:scrollY+el.getBoundingClientRect().top-(parseFloat(getComputedStyle(document.querySelector('.hero-sticky')).top)||0)+(el.offsetHeight-document.querySelector('.hero-sticky').offsetHeight)*p,behavior:'instant'})},p);await page.waitForTimeout(110);
const fit=await page.evaluate(()=>{const box=s=>{const el=document.querySelector(s);if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom}};const controls=['.docs-trigger','.intro-title','.understand-trigger','.scroll-instruction','.chapter-nav','.hero-pause','.visual-caption'].map(box).filter(Boolean);const overlaps=(a,b)=>a&&b&&a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;return {overflow:document.documentElement.scrollWidth>innerWidth,fit:controls.every(b=>b.x>=-1&&b.y>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1),title:box('.intro-title'),caption:box('.visual-caption'),button:box('.understand-trigger'),hint:box('.scroll-instruction'),nav:box('.chapter-nav'),pause:box('.hero-pause'),header:box('.intro-heading'),headerCollision:overlaps(box('.intro-title'),box('.chapter-nav'))||overlaps(box('.intro-title'),box('.hero-pause'))};});
check(`${width}x${height} ${p}: fits viewport`,!fit.overflow&&fit.fit);check(`${width}x${height} ${p}: controls do not overlap`,!fit.headerCollision&&fit.header.bottom<=fit.caption.y&&fit.caption.bottom<=fit.button.y&&(!fit.hint||(fit.caption.bottom<=fit.hint.y&&fit.hint.bottom<=fit.button.y)));
}

check(`${width}x${height}: explanation fits`,await page.locator('.engine-explanation').evaluate(e=>{const b=e.getBoundingClientRect();return b.x>=0&&b.right<=innerWidth&&b.height>=90&&getComputedStyle(e).position==='relative'&&getComputedStyle(e).overflowY==='visible'}));
if([257,487,1440].includes(width))await page.screenshot({path:`evidence/pane-${width}x${height}.png`});
}
check('primary navigation restored',await page.locator('.topbar').count()===1);
check('secondary animation bar removed',await page.locator('.hero-topline,.hero-boundary').count()===0);
writeFileSync('evidence/pane-proof.json',JSON.stringify({status:'PASS',sizes,checks,date:new Date().toISOString()},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length,sizes:sizes.length}));
}finally{await browser.close()}
