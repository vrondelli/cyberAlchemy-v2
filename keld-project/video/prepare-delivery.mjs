import {join} from 'node:path';
import {writeFile,access} from 'node:fs/promises';
import sharp from 'sharp';
import {root,source,output,readJSON,json} from './common.mjs';
let authoritative=false;try{await access(join(root,'NARRATION.md'));authoritative=true;}catch{}
if(!authoritative){
const raw=await readJSON(join(root,'transcript-raw.json'));
const words=await readJSON(join(root,'transcript-words.json'));
const fix=s=>s.replace(/\b(Kelt|Kelled|Kelle|Ked|Killed)\b/g,'Keld').replace(/patient's sound/g,'patient sound').replace(/\bIntensions\b/g,'Intentions');
const chunks=[];let group=[],start=0,end=0;
function flush(){if(!group.length)return;chunks.push({start:Math.max(0,start),end:Math.min(189.466,end),text:fix(group.join(' ').trim())});group=[];}
for(const c of words.chunks){
 const text=c.text.trim();let [a,b]=c.timestamp;
 if(!text||a==null)continue;b=b==null?Math.min(a+0.6,189.466):b;
 if(a>=189.466)continue;
 if(group.length&&((group.join(' ')+' '+text).length>72||b-start>5||a-end>0.7))flush();
 if(!group.length)start=a;group.push(text);end=Math.max(b,a+0.08);
 if(/[.!?]$/.test(text)&&end-start>=1.2)flush();
}flush();
for(let i=0;i<chunks.length;i++){if(i+1<chunks.length)chunks[i].end=Math.min(chunks[i].end,chunks[i+1].start);if(chunks[i].end<=chunks[i].start)throw Error('Invalid caption timing');}
await json(join(root,'captions.json'),{status:'Local word-aligned ASR; spelling corrected against KELD story. Final listening review remains an editorial check.',chunks});
function stamp(t,sep=','){let ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}${sep}${String(ms%1000).padStart(3,'0')}`;}
function wrap(s){if(s.length<=42)return s;const ws=s.split(' ');let best;for(let i=1;i<ws.length;i++){const a=ws.slice(0,i).join(' '),b=ws.slice(i).join(' ');if(!best||Math.abs(a.length-b.length)<best.score)best={text:a+'\n'+b,score:Math.abs(a.length-b.length)};}return best?.text??s;}
await writeFile(join(root,'captions.srt'),chunks.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${wrap(c.text)}`).join('\n\n')+'\n');
await writeFile(join(root,'captions.vtt'),'WEBVTT\n\n'+chunks.map(c=>`${stamp(c.start,'.')} --> ${stamp(c.end,'.')}\n${wrap(c.text)}`).join('\n\n')+'\n');
await writeFile(join(root,'transcript.txt'),fix(raw.text).trim().replace(/\. /g,'.\n\n')+'\n');
}else{await import('./align-subtitles.mjs');}
const assets=await readJSON(join(root,'assets.json'));
await sharp(join(source,assets.files.find(x=>x.id===1).filename)).resize(1920,1080).jpeg({quality:90}).toFile(join(output,'poster.jpg'));
const title=Buffer.from(`<svg width="1280" height="720"><defs><linearGradient id="shade"><stop stop-color="#080706" stop-opacity=".92"/><stop offset=".7" stop-color="#080706" stop-opacity=".16"/></linearGradient></defs><rect width="1280" height="720" fill="url(#shade)"/><text x="74" y="230" fill="#d4a364" font-family="Liberation Sans" font-size="19" letter-spacing="5">THE LEGEND OF</text><text x="68" y="353" fill="#f0e4cf" font-family="Liberation Serif" font-size="125" letter-spacing="4">KELD</text><path d="M74 391H142" stroke="#d4a364" stroke-width="2"/><text x="74" y="451" fill="#f0e4cf" font-family="Liberation Serif" font-size="29">Even minds need tools.</text></svg>`);
await sharp(join(source,assets.files.find(x=>x.id===7).filename)).resize(1280,720).composite([{input:title}]).jpeg({quality:91}).toFile(join(output,'youtube-thumbnail.jpg'));
console.log('Captions, poster and thumbnail prepared.');
