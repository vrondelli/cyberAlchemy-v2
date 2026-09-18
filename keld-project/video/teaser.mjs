import {join} from 'node:path';
import {writeFile} from 'node:fs/promises';
import {root,output,cache,ffmpeg,run,readJSON,json,probe} from './common.mjs';
// Sentence boundaries selected from the word-aligned recording. No voice is generated.
const cuts=[[0,7.5],[145.25,162],[177,179.625]];
const duration=30;const input=join(output,'keld-legend-full.mp4');
const filters=[];let sequence='';
cuts.forEach(([a,b],i)=>{
 filters.push(`[0:v]trim=start=${a}:end=${b},setpts=PTS-STARTPTS[v${i}]`);
 filters.push(`[0:a]atrim=start=${a}:end=${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=${b-a-0.08}:d=0.08[a${i}]`);
 sequence+=`[v${i}][a${i}]`;
});
filters.push(`${sequence}concat=n=3:v=1:a=1[v][a]`);
filters.push(`[v]fps=24,tpad=stop_mode=clone:stop_duration=4,fade=t=out:st=29.25:d=0.75[vout]`);
filters.push('[a]apad[aout]');
const captions=(await readJSON(join(root,'captions.json'))).chunks;let offset=0;const selected=[];
for(const [a,b] of cuts){for(const c of captions){if(c.end>a&&c.start<b)selected.push({start:Math.max(c.start,a)-a+offset,end:Math.min(c.end,b)-a+offset,text:c.text});}offset+=b-a;}
const stamp=(t,separator='.')=>{const ms=Math.round(t*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}${separator}${String(ms%1000).padStart(3,'0')}`;};
await writeFile(join(root,'teaser.vtt'),'WEBVTT\n\n'+selected.map(c=>`${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}`).join('\n\n')+'\n');
await writeFile(join(root,'teaser.srt'),selected.map((c,i)=>`${i+1}\n${stamp(c.start,',')} --> ${stamp(c.end,',')}\n${c.text}`).join('\n\n')+'\n');
const film=join(output,'keld-legend-teaser.mp4');
await run(ffmpeg,['-v','error','-y','-filter_complex_threads','1','-i',input,'-i',join(root,'teaser.srt'),'-filter_complex',filters.join(';'),'-map','[vout]','-map','[aout]','-map','1:s',
 '-t',String(duration),'-c:v','libx264','-preset','fast','-crf','19','-threads','4','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-c:s','mov_text','-metadata:s:s:0','language=eng',
 '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',film]);
await json(join(output,'teaser-probe.json'),await probe(film));
await json(join(root,'teaser-timeline.json'),{duration,cuts,endingHold:duration-offset,captions:selected});
console.log(film);
