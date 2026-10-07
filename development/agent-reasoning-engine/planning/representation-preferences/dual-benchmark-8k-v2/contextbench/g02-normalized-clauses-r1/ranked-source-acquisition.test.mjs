import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Load the actual candidate with only its pinned index import substituted.
const source=readFileSync(new URL('./ranked-source-acquisition.mjs',import.meta.url),'utf8');
const mock=`const rankSourcesTool={}; const createBase=({problem_statement})=>({primer:{hints:[]},query:query=>({hints:[{path:'src/posts/index.js',start_line:1,end_line:10,matched_terms:[query]}]})});`;
const module=await import('data:text/javascript,'+encodeURIComponent(source.replace(
  "import {createRankedSourceAcquisition as createBase,rankSourcesTool} from './ranked-source-acquisition-base.mjs';",mock)));

test('double-encoded task text yields the same clauses as decoded text',()=>{
  const decoded='## Title:\nMigrate socket methods to Write API\n\n### Description:\nGET /api/v3/posts/:pid/raw\nGET /api/v3/posts/:pid/summary';
  assert.deepEqual(module.boundedClauses(JSON.stringify(decoded)),module.boundedClauses(decoded));
  assert.ok(module.boundedClauses(decoded).some(x=>x.includes('/summary')));
});

test('literal escaped newlines without outer quotes are decoded conservatively',()=>{
  assert.deepEqual(module.boundedClauses('Alpha operation has a long description\\nBeta operation has a long description'),
    ['Alpha operation has a long description','Beta operation has a long description']);
  assert.equal(module.normalizeProblem('already\nreal\\n literal'),'already\nreal\\n literal');
});

test('clause count and byte size remain bounded',()=>{
  const clauses=module.boundedClauses(Array.from({length:20},(_,n)=>'Requirement '+n+' '+('é'.repeat(1000))).join('\n'),128);
  assert.equal(clauses.length,8);
  assert.ok(clauses.every(x=>Buffer.byteLength(x)<=128));
});
