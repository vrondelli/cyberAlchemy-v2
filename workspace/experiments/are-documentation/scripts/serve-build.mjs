import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
export async function serveBuild(directory){
 const root=resolve(directory),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
 const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://local'),file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+sep))throw Error('Outside build');res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');res.end(readFileSync(file));}catch{res.statusCode=404;res.end('Not found');}});
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
 return {url:`http://127.0.0.1:${server.address().port}/`,close:()=>new Promise(done=>server.close(done))};
}
