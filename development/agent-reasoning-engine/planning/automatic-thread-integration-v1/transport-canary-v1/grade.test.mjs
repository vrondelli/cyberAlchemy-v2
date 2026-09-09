import test from 'node:test';import assert from 'node:assert/strict';import {grade} from './grade.mjs';
test('exact provenance accepted',()=>assert.ok(grade('{"explanation":"A cache stores reused data.","source_digest":"abc"}','abc').ok));
test('substring is not exact provenance',()=>assert.equal(grade('{"explanation":"abc","source_digest":"prefix-abc"}','abc').ok,false));
test('absence baseline accepted',()=>assert.ok(grade('{"explanation":"A cache stores reused data.","source_digest":"absent"}','absent').ok));
test('wrong provenance rejected',()=>assert.equal(grade('{"explanation":"Cache","source_digest":"wrong"}','abc').ok,false));
test('empty explanation rejected',()=>assert.equal(grade('{"explanation":"","source_digest":"abc"}','abc').ok,false));
test('non JSON cannot pass through text matching',()=>assert.equal(grade('abc','abc').ok,false));
