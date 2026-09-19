import {createServer as createHttpsServer} from 'node:https';
import {createServer as createHttpServer} from 'node:http';
import {createKeldIntegrations} from './index.mjs';
export class RuntimeError extends Error {constructor(code){super(code);this.code=code;}}
/** Local startup only. Configuration is validated before this explicit migration boundary. */
export async function startRuntime(config,{factory=createKeldIntegrations}={}){
  let app,server,phase='integration-create-failed';
  try{
    app=await factory(config.integration);
    server=config.transport==='http'?createHttpServer(app.handler):createHttpsServer(config.tls,app.handler);
    server.requestTimeout=30000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
    // Bind first so an occupied port cannot trigger a migration. No app requests
    // are admitted until initialization has completed.
    let ready=false;server.removeAllListeners('request');server.on('request',(req,res)=>{
      if(req.method==='GET'&&req.url==='/readyz'){res.writeHead(ready?200:503,{'cache-control':'no-store'});return res.end(ready?'Ready':'Starting');}
      if(!ready){res.writeHead(503,{'cache-control':'no-store'});return res.end('Starting');}
      void Promise.resolve(app.handler(req,res)).catch(()=>{if(!res.headersSent)res.writeHead(503);res.end();});
    });
    phase='listener-start-failed';
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(config.port,config.bindHost??'127.0.0.1',resolve);});
    phase='session-initialize-failed';
    await app.initialize();ready=true;
    let closing;
    const close=()=>closing??=(async()=>{ready=false;await new Promise(resolve=>{const deadline=setTimeout(()=>server.closeAllConnections(),125000);deadline.unref();server.close(()=>{clearTimeout(deadline);resolve();});server.closeIdleConnections();});await app.close();})();
    return {server,close};
  }catch(error){if(server){server.closeAllConnections();await new Promise(resolve=>server.close(()=>resolve()));}if(app)await app.close().catch(()=>{});throw new RuntimeError(phase);}
}
