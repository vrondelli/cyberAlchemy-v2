// Frozen protocol interpretation over fully audited source. Open questions: FINAL-SCREEN.md.
export function evaluateComparison(rows,treatment,baseline,rule){
 const blocks=new Map();for(const r of rows){if(![treatment,baseline].includes(r.arm))continue;const block=blocks.get(r.block)??new Map();if(block.has(r.arm))throw Error('duplicate arm/block');block.set(r.arm,r);blocks.set(r.block,block);}
 let wins=0,losses=0,ties=0,semantic_losses=0,semantic_loss_unknown=0;const pairs=[];
 for(const [block,arms] of blocks){const t=arms.get(treatment),b=arms.get(baseline);if(!t||!b)continue;
  if(t.initial_pass&&!b.initial_pass)wins++;else if(!t.initial_pass&&b.initial_pass)losses++;else ties++;
  const tb=t.raw_source_semantics,bb=b.raw_source_semantics,loss=bb===true&&tb===false,unknown=(typeof bb!=='boolean'&&tb!==true)||(typeof tb!=='boolean'&&bb!==false);
  semantic_losses+=Number(loss);semantic_loss_unknown+=Number(unknown);pairs.push({block,initial_net:Number(t.initial_pass)-Number(b.initial_pass),semantic_loss:loss,semantic_loss_unknown:unknown});
 }
 const paired_blocks=wins+losses+ties,complete=paired_blocks===rule.paired_blocks,net_wins=wins-losses,guard=['metadata-card','host-envelope'].includes(treatment);
 const kind=!complete?'inconclusive':net_wins<rule.minimum_net_paired_wins?'counterevidence':guard&&semantic_losses>rule.semantic_losses_allowed_for_envelope_or_metadata?'counterevidence':guard&&semantic_loss_unknown>0?'inconclusive':'supporting';
 return {treatment,baseline,kind,complete,paired_blocks,wins,losses,ties,net_wins,semantic_losses,semantic_loss_unknown,semantic_guard_required:guard,pairs};
}
