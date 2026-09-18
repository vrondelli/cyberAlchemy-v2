import {rename} from 'node:fs/promises';
import {join} from 'node:path';
import {root,output,ffmpeg,run} from './common.mjs';
// Refresh optional MP4 text tracks without changing video or audio packets.
for(const [edition,duration] of [['sample',18],['teaser',30],['full',192]]){
 const target=join(output,`keld-legend-${edition}.mp4`),temporary=target+'.captions.mp4';
 await run(ffmpeg,['-v','error','-y','-i',target,'-i',join(root,edition==='teaser'?'teaser.srt':'captions.srt'),
 '-map','0:v:0','-map','0:a:0','-map','1:s:0','-c:v','copy','-c:a','copy','-c:s','mov_text','-metadata:s:s:0','language=eng',
 '-disposition:a:0','default','-disposition:s:0','default','-t',String(duration),'-movflags','+faststart',temporary]);
 await rename(temporary,target);console.log('Updated optional subtitle track:',edition);
}
