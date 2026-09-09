import {config as base} from '../cc004.wdio.conf.mjs';
import {specURL} from '../campaign/measurement-loader.mjs';
import {fileURLToPath} from 'node:url';

export const config={...base,specs:[fileURLToPath(specURL)],runnerEnv:{
  ...base.runnerEnv,
  NODE_OPTIONS:'--import='+new URL('./register.mjs',import.meta.url).href,
}};
