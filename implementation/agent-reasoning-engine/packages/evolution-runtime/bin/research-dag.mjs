import {loadBenchmarkRegistrations} from "../src/benchmark-registration.mjs";
import {materializeResearchDag} from "../src/research-dag.mjs";
console.log(JSON.stringify(materializeResearchDag({registrations: loadBenchmarkRegistrations()}), null, 2));
