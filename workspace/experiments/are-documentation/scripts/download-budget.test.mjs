import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeAssets,assessRoute} from './check-download-budget.mjs';

test('route closure counts shared assets once and includes selected lazy dependencies',()=>{
 const manifest={entry:{file:'entry.js',imports:['shared'],dynamicImports:['hero','canvas'],css:['base.css']},shared:{file:'shared.js',css:['base.css']},hero:{file:'hero.js',imports:['shared'],css:['hero.css']},canvas:{file:'canvas.js',imports:['shared']}};
 assert.deepEqual(routeAssets(manifest,['entry','hero']),['base.css','entry.js','hero.css','hero.js','shared.js']);
 assert.throws(()=>routeAssets(manifest,['missing']),/Missing route dependency/);
});
test('over-budget payload fails independently for compressed and decoded size',()=>{
 const route={maxGzipBytes:100,maxDecodedBytes:200};
 assert.equal(assessRoute(route,[{bytes:200,gzipBytes:100}]).failures.length,0);
 assert.deepEqual(assessRoute(route,[{bytes:201,gzipBytes:101}]).failures,['decoded byte budget exceeded','gzip byte budget exceeded']);
});

test('missing limits and empty route declarations fail closed',()=>{
 assert.throws(()=>routeAssets({},[]),/nonempty/);
 assert.throws(()=>assessRoute({maxDecodedBytes:200},[{bytes:20,gzipBytes:10}]),/Invalid budget/);
 assert.throws(()=>assessRoute({maxDecodedBytes:200,maxGzipBytes:100},[]),/no JavaScript/);
});
