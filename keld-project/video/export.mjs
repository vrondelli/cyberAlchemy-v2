import {join} from 'node:path';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {root,source,output,readJSON,json} from './common.mjs';
const version=process.env.KELD_VIDEO_EXPORT_VERSION??'legend-v2';if(!/^legend-v[0-9]+$/.test(version))throw Error('Invalid export version');
const destination=join(source,'exports',version);await mkdir(destination,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');const manifest=[];
async function save(name,bytes){
 const path=join(destination,name);let old;try{old=await readFile(path);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(old&&hash(old)!==hash(bytes))throw Error(`Existing different export: ${path}. Preserve it and choose another version directory.`);
 if(!old)await writeFile(path,bytes);manifest.push({file:name,bytes:bytes.length,sha256:hash(bytes)});
}
for(const name of ['keld-legend-full-subtitled.mp4','keld-legend-teaser-subtitled.mp4','keld-legend-full.mp4','keld-legend-teaser.mp4','keld-legend-sample.mp4','poster.jpg','youtube-thumbnail.jpg','validation.json','subtitle-validation.json','preview-validation.json'])await save(name,await readFile(join(output,name)));
for(const name of ['captions.srt','captions.vtt','teaser.srt','teaser.vtt','transcript.txt','timeline.json','teaser-timeline.json','assets.json','NARRATION.md','SUBTITLE-ALIGNMENT.json'])await save(name,await readFile(join(root,name)));
const data={full:await readFile(join(root,'captions.vtt'),'utf8'),teaser:await readFile(join(root,'teaser.vtt'),'utf8'),transcript:await readFile(join(root,'transcript.txt'),'utf8')};
let html=(await readFile(join(root,'index.html'),'utf8')).replaceAll('output/','');
html=html.replace('const video=',`const embedded=${JSON.stringify(data).replaceAll('<','\\u003c')};\nconst tracks={full:URL.createObjectURL(new Blob([embedded.full],{type:'text/vtt'})),teaser:URL.createObjectURL(new Blob([embedded.teaser],{type:'text/vtt'}))};\ndocument.querySelector('track').src=tracks.full;document.querySelector('#transcript').textContent=embedded.transcript;\nconst video=`);
html=html.replace("next==='full'?'captions.vtt':'teaser.vtt'",'tracks[next]');
html=html.replace("if(e.target.open){try{", "if(e.target.open&&location.protocol!=='file:'){try{");
await save('index.html',Buffer.from(html));
await save('UPLOAD.txt',Buffer.from(`THE LEGEND OF KELD\n\nSuggested title: The Legend of Keld — Even Minds Need Tools\n\nDescription:\nHe was known by many titles. An archivist. A blacksmith. A keeper of things not yet made. To the minds that found their way to his door, he was simply the maker.\n\nAn illustrated origin story for KELD. The legend is fiction. The work is real.\n\nEdited from supplied illustrations and narration using deterministic camera movement and transitions.\n\nChapters:\n00:00 The threshold\n00:28 Hoarder of Secrets\n01:02 Cyber Blacksmith\n01:36 Keeper of the Unmade\n02:06 The Maker\n02:42 The maker's mark\n\nUpload keld-legend-full.mp4, youtube-thumbnail.jpg and captions.srt (English).\nReview the complete film and captions before publication. Add your approved studio URL and attribution details.\nNo upload has been performed.\n`));
await save('README.txt',Buffer.from('KELD LEGEND — LOCAL REVIEW DELIVERY\n\nOpen index.html to watch the full film or teaser. The MP4 files also play directly in a video player.\nFor audio, open this page in a normal browser; headless Playwright test launches may mute audio at the browser level.\nFull film: 3:12. Teaser: 0:30. Sample: 0:18. All 1080p / 24 fps.\n\nNo AI video generation was used. The supplied voice is preserved with audio processing; captions use your supplied narration script with local word timings. Files ending in -subtitled.mp4 have subtitles permanently visible; the player uses switchable captions enabled by default. A final human listening/creative review remains before publication.\n\nEditable project: cyberAlchemy-v2/keld-project/video.\nOriginal images and audio remain untouched two folders above this export.\n\nOpen questions: final creative review, optional music, channel and publication details. See UPLOAD.txt.\n'));
await json(join(destination,'MANIFEST.json'),{version:2,edition:version,files:manifest});
console.log(destination);
