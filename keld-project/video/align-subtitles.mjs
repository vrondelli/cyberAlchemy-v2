import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {root,readJSON,json} from './common.mjs';
const input=process.argv[2]??join(root,'NARRATION.md');
const md=await readFile(input,'utf8');
if(input!==join(root,'NARRATION.md'))await copyFile(input,join(root,'NARRATION.md'));
const scenes=[...md.matchAll(/```text\s*\n([\s\S]*?)```/g)].map(m=>m[1].trim());
if(scenes.length!==6)throw Error('Expected six spoken text blocks, excluding production directions');
const authored=scenes.flatMap(s=>s.split(/\s+/));
const norm=s=>s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'').replace(/^(kelt|kelled|kelle|ked|killed)$/,'keld');
const raw=await readJSON(join(root,'transcript-words.json'));
const spoken=raw.chunks.flatMap(c=>{
 const ws=c.text.trim().split(/[\s-]+/).filter(Boolean),[a,b0]=c.timestamp,b=Math.min(b0??a+0.4,189.466);
 return ws.map((text,i)=>({text,start:a+(b-a)*i/ws.length,end:a+(b-a)*(i+1)/ws.length}));
});
const n=authored.length,m=spoken.length,dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
for(let i=0;i<=n;i++)dp[i][0]=i;for(let j=0;j<=m;j++)dp[0][j]=j;
for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)dp[i][j]=Math.min(dp[i-1][j-1]+(norm(authored[i-1])===norm(spoken[j-1].text)?0:1),dp[i-1][j]+1,dp[i][j-1]+1);
const aligned=[],missing=[],extra=[];let i=n,j=m;
while(i||j){
 const cost=i&&j?(norm(authored[i-1])===norm(spoken[j-1].text)?0:1):Infinity;
 if(i&&j&&dp[i][j]===dp[i-1][j-1]+cost){aligned.push({index:i-1,text:authored[i-1],...{start:spoken[j-1].start,end:spoken[j-1].end},recognized:spoken[j-1].text,cost});i--;j--;}
 else if(i&&dp[i][j]===dp[i-1][j]+1){missing.push({index:i-1,text:authored[i-1]});i--;}
 else{extra.push(spoken[j-1]);j--;}
}
aligned.reverse();missing.reverse();extra.reverse();
const report={sourcePath:input,sourceSha256:createHash('sha256').update(md).digest('hex'),authoredWords:n,recognizedWords:m,editDistance:dp[n][m],unmatchedScript:missing,extraRecognition:extra,substitutions:aligned.filter(w=>w.cost),openQuestionsRef:'README.md#operations-and-open-questions'};
await json(join(root,'SUBTITLE-ALIGNMENT.json'),report);
if(missing.some(w=>w.index<n-2)||missing.map(w=>norm(w.text)).join(' ')!=='agent gear')throw Error('Unexpected script omissions; inspect SUBTITLE-ALIGNMENT.json');
if(extra.length||report.substitutions.length>3)throw Error('Unexpected recording differences; review alignment');
const cues=[];let group=[];
function flush(){if(!group.length)return;cues.push({start:group[0].start,end:group.at(-1).end,text:group.map(w=>w.text).join(' ')});group=[];}
for(const w of aligned){
 if(group.length&&((group.map(x=>x.text).join(' ')+' '+w.text).length>66||w.end-group[0].start>4.5||w.start-group.at(-1).end>0.65))flush();
 group.push(w);if(/[.!?][”"]?$/.test(w.text)&&w.end-group[0].start>=0.7)flush();
}flush();
function stamp(t,separator='.'){let ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}${separator}${String(ms%1000).padStart(3,'0')}`;}
function wrap(s){if(s.length<=40)return s;const ws=s.split(' ');let best;for(let k=1;k<ws.length;k++){const a=ws.slice(0,k).join(' '),b=ws.slice(k).join(' ');const score=Math.abs(a.length-b.length);if(!best||score<best.score)best={text:a+'\n'+b,score};}return best.text;}
const header=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,Liberation Sans,46,&H00FFFFFF,&H000000FF,&H00100F0D,&H90000000,0,0,0,0,100,100,0,0,1,3,1,2,130,130,70,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
async function save(name,cs){
 await writeFile(join(root,name+'.srt'),cs.map((c,k)=>`${k+1}\n${stamp(c.start,',')} --> ${stamp(c.end,',')}\n${wrap(c.text)}`).join('\n\n')+'\n');
 await writeFile(join(root,name+'.vtt'),'WEBVTT\n\n'+cs.map(c=>`${stamp(c.start)} --> ${stamp(c.end)}\n${wrap(c.text)}`).join('\n\n')+'\n');
 await writeFile(join(root,name+'.ass'),header+cs.map(c=>`Dialogue: 0,${stamp(c.start).slice(1,-1)},${stamp(c.end).slice(1,-1)},Caption,,0,0,0,,${wrap(c.text).replaceAll('\n','\\N')}`).join('\n')+'\n');
}
await save('captions',cues);
const cuts=(await readJSON(join(root,'teaser-timeline.json'))).cuts;let offset=0;const teaser=[];
for(const [a,b] of cuts){for(const c of cues)if(c.start>=a&&c.end<=b)teaser.push({...c,start:c.start-a+offset,end:c.end-a+offset});offset+=b-a;}
await save('teaser',teaser);
await json(join(root,'captions.json'),{source:'NARRATION.md',sourceSha256:report.sourceSha256,status:'Owner script wording, aligned to existing local word timings; unspoken final Agent gear omitted from spoken captions',chunks:cues});
await writeFile(join(root,'transcript.txt'),scenes.join('\n\n')+'\n');
console.log(JSON.stringify({cues:cues.length,teaserCues:teaser.length,...report},null,2));
