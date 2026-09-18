import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {root,output,ffmpeg,run,probe,json,readJSON} from './common.mjs';
const editions=process.argv.slice(2);const names=editions.length?editions:['sample','full','teaser'];const checks=[];
for(const name of names){
 const file=join(output,`keld-legend-${name}.mp4`),meta=await probe(file),v=meta.streams.find(s=>s.codec_type==='video'),a=meta.streams.find(s=>s.codec_type==='audio');
 const duration={sample:18,full:192,teaser:30}[name];
 assert.equal(v.codec_name,'h264');assert.equal(v.width,1920);assert.equal(v.height,1080);assert.equal(v.pix_fmt,'yuv420p');assert.equal(v.r_frame_rate,'24/1');
 assert.equal(Number(v.nb_frames),duration*24);assert.ok(Math.abs(Number(v.duration)-duration)<0.05);assert.equal(a.codec_name,'aac');assert.equal(a.sample_rate,'48000');
 const bytes=await readFile(file);let pos=0,moov=-1,mdat=-1;while(pos+8<=bytes.length){let size=bytes.readUInt32BE(pos);const type=bytes.toString('ascii',pos+4,pos+8);if(size===1)size=Number(bytes.readBigUInt64BE(pos+8));if(size===0)size=bytes.length-pos;if(type==='moov')moov=pos;if(type==='mdat')mdat=pos;if(size<8)break;pos+=size;}assert.ok(moov>=0&&moov<mdat,'fast-start metadata required');
 const decoded=await run(ffmpeg,['-hide_banner','-nostats','-v','info','-xerror','-i',file,'-map','0:v','-map','0:a','-vf','blackdetect=d=0.2:pix_th=0.02','-f','null','-']);
 const black=[...decoded.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m=>({start:Number(m[1]),end:Number(m[2])}));
 assert.ok(black.every(b=>b.end<=0.6||b.start>=duration-0.9),'unexpected internal black interval');
 const analysis=await run(ffmpeg,['-hide_banner','-i',file,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json','-f','null','-']);
 const match=analysis.match(/\{\s*"input_i"[\s\S]*?\}/);const loudness=match?JSON.parse(match[0]):null;
 assert.ok(loudness&&Number(loudness.input_tp)<=0,'no clipped true peak');
 checks.push({edition:name,passed:true,duration,frames:Number(v.nb_frames),bytes:(await stat(file)).size,blackIntervals:black,loudness});
 console.log(`${name}: ${v.nb_frames} frames, ${duration}s, complete decode passed`);
}
const caps=(await readJSON(join(root,'captions.json'))).chunks;for(let i=0;i<caps.length;i++){assert.ok(caps[i].start>=0&&caps[i].end>caps[i].start&&caps[i].end<=189.466);if(i)assert.ok(caps[i].start>=caps[i-1].end);}
await json(join(output,editions.length?'sample-validation.json':'validation.json'),{checkedAt:new Date().toISOString(),checks,captions:{count:caps.length,ordered:true,bounded:true},limits:['Automated media checks and sampled visual review; final human listening/creative review remains before publication.']});
