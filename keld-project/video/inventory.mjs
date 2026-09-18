import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {init,source,output,root,probe,json} from './common.mjs';
await init();
const names=(await readdir(source)).filter(x=>/\.(png|mp3)$/i.test(x)).sort();const files=[];const layers=[];
for(const filename of names){
 const path=join(source,filename),bytes=await readFile(path);
 const item={filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 if(filename.endsWith('.png')){
  const m=await sharp(bytes).metadata();Object.assign(item,{id:files.filter(x=>x.width).length+1,width:m.width,height:m.height});
  const n=item.id-1,left=(n%3)*480,top=Math.floor(n/3)*294;
  layers.push({input:await sharp(bytes).resize(480,270).jpeg({quality:80}).toBuffer(),left,top});
  layers.push({input:Buffer.from(`<svg width="480" height="24"><text x="10" y="18" fill="#eee" font-size="16">${item.id} · ${filename.slice(28)}</text></svg>`),left,top:top+270});
 }else item.probe=await probe(path);
 files.push(item);
}
await sharp({create:{width:1440,height:1764,channels:3,background:'#171310'}}).composite(layers).jpeg({quality:86}).toFile(join(output,'contact-sheet.jpg'));
await json(join(root,'assets.json'),{source,files});
console.log(JSON.stringify(files.map(x=>({id:x.id,file:x.filename,dimensions:x.width?[x.width,x.height]:undefined,duration:x.probe?.format.duration})),null,2));
