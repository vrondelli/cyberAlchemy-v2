import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {prepareInitialSourcePacket,selectInitialSourceHints} from './initial-source-packet.mjs';
import {bindDelivery,bodyForReceipt,stable} from './delivery.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');

test('initial packet selects ranked leads and structural neighbors without duplicate paths',()=>{
  const hints=[
    {path:'a.go',start_line:20},{path:'b.go',start_line:30},{path:'c.go',start_line:40},
    {path:'d.go',start_line:50},{path:'a.go',start_line:20,kind:'sibling'},
    {path:'e.go',start_line:60,kind:'sibling'},
    {path:'config.schema.cue',start_line:7,kind:'contract'},
  ];
  assert.deepEqual(selectInitialSourceHints(hints).map(h=>h.path),['a.go','b.go','c.go','e.go','config.schema.cue']);
  assert.deepEqual(selectInitialSourceHints(hints,[{path:'cmd/bundle.go',start_line:12}]).map(h=>h.path),
    ['a.go','b.go','c.go','e.go','config.schema.cue','cmd/bundle.go']);
  assert.throws(()=>selectInitialSourceHints(hints,Array.from({length:7},(_,i)=>({path:`f${i}.go`,start_line:1}))),/invalid-hints/);
});

test('initial packet reads pinned base and binds to the first successful model receipt',async()=>{
  const calls=[];
  const packet=await prepareInitialSourcePacket({hints:[{path:'a.go',start_line:10},{path:'b.go',start_line:5,kind:'contract'}],
    execute_tool:async(name,args)=>{
      calls.push({name,args});
      const utf8='line one\nline two';
      return {ok:true,output:{path:args.path,start_line:args.start_line,end_line:args.start_line+1,total_lines:100,
        utf8,byte_count:Buffer.byteLength(utf8),source_sha256:hash(args.path),source_revision:'base'}};
    }});
  assert.equal(calls.length,2);
  assert(calls.every(({name,args})=>name==='read_file'&&args.revision==='base'&&args.line_count===50));
  const prompt=stable({messages:[{role:'system',content:'test'},...packet.exchange],tools:[]});
  const receipt={kind:'model',dispatched:true,status:200,model:'test-model',output_cap:100,reasoning_effort:'none',
    input_tokens:1000,output_tokens:10};
  receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
  const binding=bindDelivery({captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]});
  assert.equal(binding.read_observations.length,2);
  assert.deepEqual(binding.read_observations.map(read=>read.id),packet.receipt.map(read=>read.read_id));
  assert.equal(binding.token_accounting.known_total_tokens,1010);
  assert.equal(binding.unmapped.length,0);
});
