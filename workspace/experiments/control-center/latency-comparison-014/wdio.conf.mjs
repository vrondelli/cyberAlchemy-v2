import {config as base} from '../../../runtime/wdio/wdio.conf.mjs';
import {fileURLToPath} from 'node:url';
const appBinaryPath=fileURLToPath(new URL('../latency-comparison-008/native/uninstrumented/essays-desktop',import.meta.url));
export const config={...base,connectionRetryCount:0,capabilities:[{browserName:'tauri','tauri:options':{application:appBinaryPath}}],services:[['tauri',{appBinaryPath,driverProvider:'embedded',embeddedPort:4445}]]};
