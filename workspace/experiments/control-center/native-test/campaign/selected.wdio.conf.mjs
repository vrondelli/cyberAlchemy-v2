import {config as base} from '../../../../runtime/wdio/wdio.conf.mjs';
import {fileURLToPath} from 'node:url';
import {selectedContext} from './selected.mjs';

const context=selectedContext({candidateId:process.env.CC_CANDIDATE_ID,candidateSha256:process.env.CC_CANDIDATE_SHA256,binary:process.env.CC_BINARY,binarySha256:process.env.CC_BINARY_SHA256,mode:process.env.CC_COLLECTION_MODE});
if(!context.verify().ok)throw new Error('SELECTED_PREFLIGHT_FAILED');
const binary=process.env.CC_BINARY;
export const config={...base,
  specs:[fileURLToPath(new URL('../../../../runtime/wdio/specs/unified-workspace.e2e.mjs',import.meta.url))],
  capabilities:[{browserName:'tauri','tauri:options':{application:binary}}],
  services:[['tauri',{appBinaryPath:binary,driverProvider:'embedded',embeddedPort:4445}]],
  runnerEnv:{NODE_OPTIONS:context.mode==='measurement'?'--import='+new URL('../measurement-v2/register.mjs',import.meta.url).href:'--enable-source-maps'},
};
