import { describe, it, expect } from "vitest";
import { projectWorkers, workerEndpoint } from "./workers";
describe("read-only Luna projection", () => {
  it("accepts loopback only", () => {
    expect(workerEndpoint("http://127.0.0.1:8080")).toBe("http://127.0.0.1:8080/api/v1/state");
    for (const address of ["https://example.com", "http://user:secret@localhost", "http://localhost/private", "http://localhost?key=secret"]) expect(() => workerEndpoint(address)).toThrow();
  });
  it("preserves source mode and does not invent workers", () => {
    expect(projectWorkers({ source_mode:"fixture", generated_at:"now", runs:[], executor_pool:[] })).toEqual({source:"fixture", generatedAt:"now", tasks:[], pool:[]});
  });
  it("shows only explicit Luna assignments and preserves status", () => {
    const run = { run_key:"r", title:"Layout", strategy:{model:"gpt-5.6-luna",nodes:[{node_id:"n",role_id:"builder",stage:"prototype",status:"blocked"}]}};
    const result = projectWorkers({source_mode:"live",generated_at:"now",runs:[run,{...run,strategy:{model:"other",nodes:[]}}],executor_pool:[]});
    expect(result.tasks).toEqual([{id:"r:n",run:"Layout",role:"builder",stage:"prototype",status:"blocked"}]);
  });
  it("rejects missing or malformed worker projections", () => {
    for (const input of [null, {}, {runs:[],executor_pool:[]}, {source_mode:"live",generated_at:"now",runs:[{strategy:{model:"gpt-5.6-luna",nodes:null}}],executor_pool:[]}]) expect(() => projectWorkers(input)).toThrow();
  });
});
