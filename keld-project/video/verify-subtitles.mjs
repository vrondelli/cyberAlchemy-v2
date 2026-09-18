import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root,output,ffmpeg,run,probe,readJSON,json} from './common.mjs';
const checks=[];
for(const edition of ['teaser','full']){
 const clean=join(output,`keld-legend-${edition}.mp4`),burned=join(output,`keld-legend-${edition}-subtitled.mp4`),duration=edition==='full'?192:30;
 const meta=await probe(burned),v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');
 assert.equal(Number(v.nb_frames),duration*24);assert.equal(Number(v.duration),duration);assert.equal(a.codec_name,'aac');assert.equal(a.disposition.default,1);
 const audio=[];for(const file of [clean,burned])audio.push(createHash('sha256').update(await run(ffmpeg,['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','adts','pipe:1'],{capture:true})).digest('hex'));
 assert.equal(audio[0],audio[1],'original audio packets must be preserved');
 await run(ffmpeg,['-v','error','-xerror','-i',burned,'-map','0:v','-map','0:a','-f','null','-']);
 const images=[];for(const file of [clean,burned])images.push(await run(ffmpeg,['-v','error','-ss','4','-i',file,'-frames:v','1','-vf','crop=1600:200:160:850','-pix_fmt','gray','-f','rawvideo','pipe:1'],{capture:true}));
 const extraWhite=images[1].reduce((sum,x,i)=>sum+(x>225&&images[0][i]<175?1:0),0);assert.ok(extraWhite>500,'caption lettering must be visible in the image');
 checks.push({edition,duration,frames:Number(v.nb_frames),audioPacketsUnchanged:true,audioSha256:audio[0],decodePassed:true,captionWhitePixels:extraWhite});
 console.log(`${edition}: captions visible, ${v.nb_frames} frames, original audio unchanged`);
}
const cues=(await readJSON(join(root,'captions.json'))).chunks;for(let i=0;i<cues.length;i++){assert.ok(cues[i].end>cues[i].start&&cues[i].end<=189.466);if(i)assert.ok(cues[i].start>=cues[i-1].end);}
const align=await readJSON(join(root,'SUBTITLE-ALIGNMENT.json'));assert.equal(align.authoredWords-align.unmatchedScript.length,438);
await json(join(output,'subtitle-validation.json'),{checks,cues:cues.length,scriptSha256:align.sourceSha256,unspokenEnding:'Agent gear.',browserEvidence:'preview-validation.json',limitations:['Browser audio decoding does not prove WSL/host speaker output.'],openQuestionsRef:'../README.md#operations-and-open-questions'});
