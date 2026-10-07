import assert from "node:assert/strict";
import test from "node:test";

import {renderDeterministicContinuity} from "../src/deterministic-continuity-renderer-v4.mjs";

test("deterministic continuity rendering preserves engine-owned identity and evidence posture", () => {
  const value = renderDeterministicContinuity({transition:"continue",active_objective:"Finish the cycle",active_cycle:"interaction-learning",relationship_code:"engine-coordinates-cycle",response_language:"en",next_action:"Assess the frozen verdict.",clarification_needed:false,evidence_status:"pending"});
  assert.equal(value.transition,"continue");
  assert.match(value.response,/runtime is not itself an evolution cycle/);
  assert.match(value.response,/No completion is claimed yet/);
});

test("the renderer enforces one clarification and preserves Portuguese", () => {
  const value = renderDeterministicContinuity({transition:"continue",active_objective:"Selecionar benchmark",active_cycle:"engine-improvement",relationship_code:"clarification-required",response_language:"pt",next_action:"Qual benchmark registrado devemos executar?",clarification_needed:true,evidence_status:"pending"});
  assert.match(value.response,/Próxima ação/);
  assert.throws(()=>renderDeterministicContinuity({...value,next_action:"Duas? Três?",renderer:undefined,authority_effect:undefined}),/input-invalid/);
});
