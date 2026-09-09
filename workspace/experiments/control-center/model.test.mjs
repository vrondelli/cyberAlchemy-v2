import test from "node:test";
import assert from "node:assert/strict";
import { initialState, reduce as r, surfaces, visibleSurfaces, proposalProblem } from "./model.mjs";
const act = (s, type, fields = {}) => r(s, {type, ...fields});
const draft = () => act(initialState(), "draft", {text:"Keep this draft"});
test("IC-TARGET-1: surface selection preserves draft target", () => {
 const s=act(draft(),"select",{id:"ontology"}); assert.equal(s.target.id,"essay"); assert.equal(s.draft,"Keep this draft");
});
test("IC-TARGET-2: submitted targets are immutable", () => {
 let s=act(draft(),"target",{id:"orchestration"}); s=act(s,"submit"); s=act(s,"target",{id:"essay"}); assert.equal(s.requests[0].target.id,"orchestration");
});
test("IC-TARGET-3: unresolved targets do not dispatch", () => {
 const s=act(act(draft(),"availability",{id:"essay",value:"unavailable"}),"submit");
 assert.equal(s.requests.length,0); assert.ok(s.error); assert.equal(s.draft,"Keep this draft");
});
test("IC-SURFACE-1: editor and preview retain work identity", () => assert.equal(surfaces.essay.workId,surfaces.preview.workId));
test("IC-SURFACE-2: stale context remains explicit", () => {
 const s=act(initialState(),"availability",{id:"ontology",value:"stale"}); assert.equal(s.availability.ontology,"stale");
});
test("IC-SURFACE-3: narrow view preserves reachable primary", () => {
 const s=act(initialState(),"select",{id:"ontology"}); assert.deepEqual(visibleSurfaces(s,390),["ontology"]); assert.equal(visibleSurfaces(s,1400).length,3);
});
test("IC-LAYOUT-1: proposal does not rearrange typing surface", () => {
 const s=act(draft(),"propose",{layout:"ontology"}); assert.equal(s.primary,"essay"); assert.equal(s.draft,"Keep this draft");
});
test("IC-LAYOUT-2: stale proposals cannot overwrite user layout", () => {
 let s=act(initialState(),"propose",{layout:"ontology"}); s=act(s,"select",{id:"orchestration"}); s=act(s,"apply"); assert.equal(s.primary,"orchestration"); assert.match(s.error,/stale/);
});
test("IC-LAYOUT-3: apply and restore retain draft and anchor", () => {
 let s=act(draft(),"anchor",{id:"essay",value:230}); s=act(act(s,"propose",{layout:"ontology"}),"apply"); s=act(s,"restore"); assert.equal(s.draft,"Keep this draft"); assert.equal(s.anchors.essay,230);
});
test("IC-LAYOUT-4: output updates do not replace layout", () => {
 let s=draft(); for(let i=0;i<10;i++)s=act(s,"edit",{text:"Output "+i}); assert.equal(s.layout,"writing"); assert.equal(s.revision,0);
});
test("IC-PIN-1: pinned role rejects conflicting proposal", () => {
 let s=act(initialState(),"pin"); s=act(s,"propose",{layout:"ontology"}); assert.match(proposalProblem(s),/pin/); s=act(s,"apply"); assert.equal(s.primary,"essay");
});
test("IC-PIN-2: unpin permits reconsideration", () => {
 let s=act(act(initialState(),"pin"),"propose",{layout:"ontology"}); s=act(act(s,"pin"),"apply"); assert.equal(s.primary,"ontology");
});
test("IC-PIN-3: viewport fit does not erase preference", () => {
 const s=act(initialState(),"pin"); visibleSurfaces(s,390); visibleSurfaces(s,1400); assert.equal(s.pin,"essay");
});
test("IC-STATE-1: chat expansion preserves draft and target", () => {
 const s=act(act(draft(),"expand"),"expand"); assert.equal(s.draft,"Keep this draft"); assert.equal(s.target.id,"essay");
});
test("IC-STATE-2: layout restore does not undo content", () => {
 let s=act(act(initialState(),"propose",{layout:"ontology"}),"apply"); s=act(s,"edit",{text:"New version"}); s=act(s,"restore"); assert.equal(s.essay,"New version");
});
test("IC-STATE-3: missing anchor falls back explicitly", () => {
 const s=act(draft(),"invalidate-anchor"); assert.equal(s.anchors.essay,0); assert.ok(s.anchorMissing); assert.equal(s.draft,"Keep this draft");
});
test("IC-STATE-4: reset does not invent durable recovery", () => {
 const s=act(act(draft(),"save"),"reset"); assert.equal(s.draft,""); assert.equal(s.saved,null);
});
test("IC-ATTENTION-1: attention leaves active task intact", () => {
 const s=act(draft(),"attention",{id:"research-block",reason:"Needs source"}); assert.equal(s.primary,"essay"); assert.equal(s.draft,"Keep this draft");
});
test("IC-ATTENTION-2: repeated condition deduplicates", () => {
 let s=initialState(); for(let i=0;i<8;i++)s=act(s,"attention",{id:"research-block",reason:"Needs source"}); assert.equal(Object.keys(s.attention).length,1);
});
test("IC-ATTENTION-3: acknowledgement is not resolution", () => {
 let s=act(initialState(),"attention",{id:"research-block",reason:"Needs source"}); s=act(s,"acknowledge",{id:"research-block"}); assert.equal(s.attention["research-block"].state,"acknowledged");
});
test("IC-ATTENTION-4: detail navigation preserves work and return", () => {
 let s=act(draft(),"open-attention"); assert.equal(s.primary,"orchestration"); s=act(s,"return"); assert.equal(s.primary,"essay"); assert.equal(s.draft,"Keep this draft");
});
