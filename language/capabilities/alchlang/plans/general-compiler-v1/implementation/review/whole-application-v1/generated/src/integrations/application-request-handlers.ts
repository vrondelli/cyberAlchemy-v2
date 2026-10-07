import {operationReceiveNotice as operation_0} from "../features/commerce/application/operations/receive-notice.js";
import {operationSubmitOrder as operation_1} from "../features/commerce/application/operations/submit-order.js";
import {RUNTIME_MAPPING_INVOCATIONS} from "./runtime-bindings.js";
function readPath(value:unknown,parts:readonly string[]):unknown {
  let current=value;
  for(const part of parts){
    if(current===null||typeof current!=="object"||Array.isArray(current))throw new TypeError("APPLICATION_REQUEST_PATH");
    const field=Object.getOwnPropertyDescriptor(current,part);
    if(!field||!("value" in field))throw new TypeError("APPLICATION_REQUEST_PATH");
    current=field.value;
  }
  return current;
}
export const APPLICATION_REQUEST_HANDLERS=Object.freeze({["api-mapping:request-to-order"]:async (body:unknown,dependencies:Parameters<typeof operation_1>[1]):Promise<Awaited<ReturnType<typeof operation_1>>>=>{
  const mapped=RUNTIME_MAPPING_INVOCATIONS["api-mapping:request-to-order"]({["payload"]:body as Parameters<typeof RUNTIME_MAPPING_INVOCATIONS["api-mapping:request-to-order"]>[0]["payload"]});
  const request:Parameters<typeof operation_1>[0]=Object.freeze({["request"]:mapped});
  return operation_1(request,dependencies);
},
["message-mapping:consume-order"]:async (body:unknown,dependencies:Parameters<typeof operation_0>[1]):Promise<Awaited<ReturnType<typeof operation_0>>>=>{
  const mapped=RUNTIME_MAPPING_INVOCATIONS["message-mapping:consume-order"]({["payload"]:readPath(body,["payload"]) as Parameters<typeof RUNTIME_MAPPING_INVOCATIONS["message-mapping:consume-order"]>[0]["payload"]});
  const request:Parameters<typeof operation_0>[0]=Object.freeze({["request"]:mapped});
  return operation_0(request,dependencies);
}});
export type ApplicationRequestHandlerRef=keyof typeof APPLICATION_REQUEST_HANDLERS;
export const APPLICATION_REQUEST_HANDLER_BINDINGS=[{"mapping_binding_ref":"api-mapping:request-to-order","mapping_ref":"commerce:request-to-order","operation_module":"src/features/commerce/application/operations/submit-order.ts","operation_ref":"commerce:submit-order","request_ref":"commerce:submit-order#request","source_ref":"protocol-operation:submit-http#request"},{"mapping_binding_ref":"message-mapping:consume-order","mapping_ref":"commerce:message-to-order","operation_module":"src/features/commerce/application/operations/receive-notice.ts","operation_ref":"commerce:receive-notice","request_ref":"commerce:receive-notice#request","source_ref":"message-type:order-message-v1"}] as const;
