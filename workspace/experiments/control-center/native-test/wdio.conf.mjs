import {fileURLToPath} from 'node:url';
import {config as base} from '../../../runtime/wdio/wdio.conf.mjs';
import {validate} from '../candidates/cc-003/validate.mjs';

if (!validate().selected_runtime_prerequisites_pass) throw new Error('CC003_SOURCE_PREREQUISITES_FAILED');
const appBinaryPath = process.env.CC003_TEST_BINARY;
if (!appBinaryPath?.startsWith('/tmp/cav2-cc003-native.')) throw new Error('ISOLATED_TEST_BINARY_REQUIRED');
export const config = {
  ...base,
  specs: process.env.CC003_UNIFIED === '1' ? base.specs : [fileURLToPath(new URL('./control-center.e2e.mjs', import.meta.url))],
  capabilities: [{browserName:'tauri', 'tauri:options':{application:appBinaryPath}}],
  services: [['tauri', {appBinaryPath, driverProvider:'embedded', embeddedPort:4445}]],
};
