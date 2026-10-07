import {projectEngineHandoffToHypotheses} from "../../conversation-runtime/index.mjs";
import {projectBenchmarkFailuresToHypotheses} from "../index.mjs";

export function projectConversationHandoff(input = {}) {
  return projectEngineHandoffToHypotheses({...input, projector: projectBenchmarkFailuresToHypotheses});
}
