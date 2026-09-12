// Runs only in task container; fixed public optimization assertion. Open questions: PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';import {createRequire} from 'node:module';
import {compile} from '/testbed/packages/svelte/src/compiler/index.js';
const require=createRequire('/testbed/packages/svelte/package.json'),{parse}=require('acorn');
const source=readFileSync('/tmp/are-public-main.svelte','utf8');
const compiled=compile(source,{generate:'client',dev:false});writeFileSync('/tmp/are-public-compiled.js',compiled.js.code);
const ast=parse(compiled.js.code,{ecmaVersion:'latest',sourceType:'module'}),assignments=[];
function visit(node){if(!node||typeof node!=='object')return;if(node.type==='AssignmentExpression'&&node.left?.type==='MemberExpression'&&node.left.property?.name==='__click')assignments.push(node);for(const [key,value] of Object.entries(node)){if(key==='start'||key==='end')continue;if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);}}
visit(ast);const B=assignments.find(n=>n.left.object.name==='button_1'),C=assignments.find(n=>n.left.object.name==='button_2');
if(!B||!C)throw Error('probe structure unavailable: expected B and C event assignments');
const hoisted=n=>n.type==='Identifier'||n.type==='ArrayExpression'&&n.elements[0]?.type==='Identifier';
if(!hoisted(C.right))throw Error('ARE_CONTROL_HOISTED_CALLBACK: unshadowed reference must be shared');
if(!hoisted(B.right))throw Error('ARE_EXPECTED_HOISTED_CALLBACK: shadowed local variable should permit shared callback');
console.log('ARE_PUBLIC_COMPILER_PASS');
