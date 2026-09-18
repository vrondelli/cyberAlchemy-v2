import {join} from 'node:path';
import {readFile,writeFile,mkdir,stat,statfs,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {init,root,source,output,cache,ffmpeg,readJSON,run,json,probe} from './common.mjs';
await init();
const edition=process.argv[2]??'sample';
if(!['sample','full'].includes(edition))throw Error('Use sample or full');
const plan=await readJSON(join(root,'timeline.json')),assets=await readJSON(join(root,'assets.json'));
const fps=24,width=1920,height=1080,blend=12;
const limit=edition==='sample'?18:plan.duration;
const shots=plan.shots.filter(s=>s.start<limit).map((s,i,a)=>({...s,end:Math.min(a[i+1]?.start??plan.duration,limit)}));
const encode=['-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-r',String(fps),'-threads','4','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-video_track_timescale','12288'];
const free=await statfs(source);if(Number(free.bavail)*Number(free.bsize)<3*1024**3)throw Error('Keep at least 3 GiB free on source/host volume');
const build=join(cache,'segments');await mkdir(build,{recursive:true});
const pieces=[];
for(const item of assets.files){const bytes=await readFile(join(source,item.filename));if(createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Source changed: '+item.filename);}
function motion(s,offset,count,label){
 const total=Math.round((s.end-s.start)*fps)+blend;
 const phase=`min(1,(on+${offset})/${total-1})`;
 const ease=`(0.5-0.5*cos(PI*${phase}))`;
 const z=`${s.zoom[0]}+(${s.zoom[1]-s.zoom[0]})*${ease}`;
 return `scale=3840:2160:flags=lanczos,zoompan=z='${z}':x='(iw-iw/zoom)*${s.focus[0]}':y='(ih-ih/zoom)*${s.focus[1]}':d=${count+2}:s=${width}x${height}:fps=${fps},format=yuv420p,setsar=1,settb=1/${fps},setpts=PTS-STARTPTS,fps=${fps}${label}`;
}
const image=s=>join(source,assets.files.find(f=>f.id===s.image).filename);
async function piece(spec,args){
 const id=createHash('sha256').update(JSON.stringify({spec,args,sourceHashes:assets.files.map(a=>a.sha256)})).digest('hex').slice(0,20);
 const file=join(build,`${id}.mp4`);let exists=false;try{exists=(await stat(file)).size>0;}catch{}
 if(!exists){await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-filter_complex_threads','1',...args,...encode,file+'.partial.mp4']);await rename(file+'.partial.mp4',file);}
 const meta=(await probe(file)).streams.find(s=>s.codec_type==='video');const expected=Number(args[args.indexOf('-frames:v')+1]);if(Number(meta.nb_frames)!==expected)throw Error('Frame count mismatch: '+file);
 pieces.push(file);
}
for(let i=0;i<shots.length;i++){
 const s=shots[i],frames=Math.round((s.end-s.start)*fps),offset=i===0?0:blend;
 if(frames<=offset)throw Error('Shot must exceed transition length');
 let vf=motion(s,offset,frames-offset,'');
 if(i===0)vf+=',fade=t=in:st=0:d=0.5';
 if(i===shots.length-1&&edition==='full')vf+=`,fade=t=out:st=${(frames-offset)/fps-0.75}:d=0.75`;
 await piece({edition,type:'body',i,s},['-i',image(s),'-vf',vf,'-frames:v',String(frames-offset)]);
 if(i<shots.length-1){
  const next=shots[i+1];
  const fc=`[0:v]${motion(s,frames,blend,'[a]')};[1:v]${motion(next,0,blend,'[b]')};[a][b]xfade=transition=fade:duration=0.5:offset=0,format=yuv420p[v]`;
  await piece({edition,type:'dissolve',i},['-i',image(s),'-i',image(next),'-filter_complex',fc,'-map','[v]','-frames:v',String(blend)]);
 }
 console.log(`${edition}: shot ${i+1}/${shots.length} (${s.label})`);
}
const list=join(cache,`${edition}-concat.txt`);
await writeFile(list,pieces.map(f=>`file '${f.replaceAll("'","'\\''")}'`).join('\n'));
const silent=join(cache,`${edition}-silent.mp4`);
await run(ffmpeg,['-v','error','-y','-f','concat','-safe','0','-i',list,'-c','copy',silent]);
const titles=join(root,'titles.ass');
const voice=join(source,assets.files.find(f=>f.filename.endsWith('.mp3')).filename);
const target=join(output,`keld-legend-${edition}.mp4`);
await run(ffmpeg,['-v','error','-y','-i',silent,'-i',voice,'-i',join(root,'captions.srt'),'-map','0:v','-map','1:a','-map','2:s',
 '-vf',`ass='${titles}'`,'-af','highpass=f=65,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad',
 '-t',String(limit),'-c:v','libx264','-preset','fast','-crf','19','-threads','4','-pix_fmt','yuv420p',
 '-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-c:s','mov_text','-metadata:s:s:0','language=eng',
 '-metadata','title=The Legend of Keld','-metadata','comment=Deterministic editing of supplied illustrations and narration; no AI video generation.',
 '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',target]);
await json(join(output,`${edition}-probe.json`),await probe(target));
console.log(target);
