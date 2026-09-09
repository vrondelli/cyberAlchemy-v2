import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {evaluateComparison} from './final-screen.mjs';
const rule={minimum_net_paired_wins:3,paired_blocks:24,semantic_losses_allowed_for_envelope_or_metadata:0};
const cohort=()=>Array.from({length:24},(_,block)=>[{block,arm:'baseline',initial_pass:block>=3,raw_source_semantics:block>=3},{block,arm:'host-envelope',initial_pass:true,raw_source_semantics:true}]).flat();
test('complete net wins require proven semantic non-regression',()=>{
 const rs=cohort();assert.equal(evaluateComparison(rs,'host-envelope','baseline',rule).kind,'supporting');
 rs[6].initial_pass=false;rs[7].initial_pass=false;rs[7].raw_source_semantics=false;
 const r=evaluateComparison(rs,'host-envelope','baseline',rule);assert.equal(r.net_wins,3);assert.equal(r.semantic_losses,1);assert.equal(r.kind,'counterevidence');
 rs[7].raw_source_semantics=null;assert.equal(evaluateComparison(rs,'host-envelope','baseline',rule).kind,'inconclusive');
 assert.equal(evaluateComparison(rs.slice(0,-2),'host-envelope','baseline',rule).complete,false);
});
test('retained schema-rejected baseline exposes the real host-envelope semantic loss',()=>{
 const p=new URL('raw-audits-v1/',import.meta.url);const rs=['b3-baseline','b3-host-envelope'].map(id=>JSON.parse(readFileSync(new URL(id+'/result.json',p))));
 assert.equal(rs[0].initial_pass,false);assert.equal(rs[0].raw_source_semantics,true);assert.equal(rs[1].raw_source_semantics,false);
 const r=evaluateComparison(rs,'host-envelope','baseline',rule);assert.equal(r.semantic_losses,1);assert.equal(r.ties,1);assert.equal(r.kind,'inconclusive');
});
