import {join} from 'node:path';
import {root,output,ffmpeg,run,probe,json} from './common.mjs';
for(const edition of ['teaser','full']){
 const target=join(output,`keld-legend-${edition}-subtitled.mp4`);
 await run(ffmpeg,['-v','error','-y','-i',join(output,`keld-legend-${edition}.mp4`),'-map','0:v:0','-map','0:a:0',
 '-vf',`ass='${join(root,edition==='full'?'captions.ass':'teaser.ass')}'`,'-c:v','libx264','-preset','veryfast','-crf','18','-threads','4','-pix_fmt','yuv420p',
 '-c:a','copy','-disposition:a:0','default','-metadata:s:a:0','language=eng','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',target]);
 await json(join(output,`${edition}-subtitled-probe.json`),await probe(target));console.log(target);
}
