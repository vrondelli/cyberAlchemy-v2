import * as admission from './public-admission/app/function/index.mjs';
import * as service from './public-service/app/service/index.mjs';
import * as invocation from './provider-invocation/app/invocation/index.mjs';
import * as stream from './provider-stream/app/stream/index.mjs';
import * as custody from './request-custody/app/custody/index.mjs';
import * as streamError from './public-stream-error/app/function/index.mjs';
import {createLocalServer} from './runtime.mjs';
const policy={admissionMapper:admission.invoke,serviceFactory:service.createHandler,modelsMapper:service.functions.Models,capabilitiesMapper:service.functions.Capabilities,errorMapper:service.functions.Errors,streamErrorMapper:streamError.invoke,invocationFactory:invocation.createInvocation,streamFactory:stream.createSession,custodyFactory:custody.createCustody};
export const createServer=(config,env={})=>createLocalServer(policy,config,env);
