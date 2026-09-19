// Raw bytes hash as bytes; structured records use canonical JSON. Open questions: README.md.
import {createHash} from 'node:crypto';
import {stable} from '../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
export const hash=value=>createHash('sha256').update(Buffer.isBuffer(value)||typeof value==='string'?value:stable(value)).digest('hex');
