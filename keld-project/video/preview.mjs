import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './common.mjs';
const allowed=new Set(['index.html','captions.vtt','teaser.vtt','transcript.txt','output/poster.jpg','output/youtube-thumbnail.jpg',...['full','sample','teaser','full-subtitled','teaser-subtitled'].map(n=>`output/keld-legend-${n}.mp4`)]);
const mime={html:'text/html; charset=utf-8',vtt:'text/vtt; charset=utf-8',txt:'text/plain; charset=utf-8',jpg:'image/jpeg',mp4:'video/mp4'};
export async function startPreview(port=4398){
 const server=createServer(async(req,res)=>{
  try{
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
   let file=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
   if(!allowed.has(file)){res.writeHead(404);return res.end();}
   const path=join(root,file),info=await stat(path);let start=0,end=info.size-1,status=200;
   const headers={'Content-Type':mime[file.split('.').pop()],'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
   if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m||Number(m[1])>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(end<start){res.writeHead(416);return res.end();}status=206;headers['Content-Range']=['bytes ',start,'-',end,'/',info.size].join('');}
   headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')return res.end();
   const stream=createReadStream(path,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{if(!res.headersSent)res.writeHead(404);res.end();}
 });
 await new Promise((yes,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',yes);});return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=await startPreview(Number(process.env.KELD_VIDEO_PORT??4398));console.log(`KELD film preview: http://127.0.0.1:${server.address().port}`);}
