import * as entry_Capabilities from '../../entries/Capabilities/app/function/index.mjs';
import * as entry_PublicError from '../../entries/PublicError/app/function/index.mjs';
const entrypoints={"Capabilities":entry_Capabilities,"PublicError":entry_PublicError};
export const routes=[
  {
    "id": "Capabilities",
    "method": "POST",
    "path": "/internal/capabilities"
  },
  {
    "id": "PublicError",
    "method": "POST",
    "path": "/internal/public-error"
  }
];
export async function invoke(entry,input,env={},io={}){const selected=entrypoints[entry];if(!selected){const error=new Error('SERVICE_ENTRY_NOT_FOUND');error.code='SERVICE_ENTRY_NOT_FOUND';throw error;}return selected.invoke(input,env,io);}
export function createInvoker(entry,observe){const selected=entrypoints[entry];if(!selected){const error=new Error('SERVICE_ENTRY_NOT_FOUND');error.code='SERVICE_ENTRY_NOT_FOUND';throw error;}return selected.createInvoker(observe);}
export async function handler(request,env={},io={}){const url=new URL(request.url),samePath=routes.filter(route=>route.path===url.pathname);if(!samePath.length)return Response.json({error:'NOT_FOUND'},{status:404});const route=samePath.find(route=>route.method===request.method);if(!route)return Response.json({error:'METHOD_NOT_ALLOWED'},{status:405});return entrypoints[route.id].handler(request,env,{...io,signal:io.signal??request.signal});}
export default {fetch:handler};
