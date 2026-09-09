import { initialState, reduce, layouts, surfaces, proposalProblem, visibleSurfaces } from "./model.mjs";
const $ = s => document.querySelector(s);
let state = initialState(), preview = false, zoom = 1, shownRequests = 0;
$("#essay").value = state.essay;
function send(type, fields={}) { state=reduce(state,{type,...fields}); render(); }
function render() {
  for(const id of ["essay","ontology","orchestration"]) {
    const p=$("#"+id+"-panel"); p.classList.toggle("primary",state.primary===id);
    p.classList.toggle("unavailable",state.availability[id]==="unavailable");
    $("[data-state-for="+id+"]").textContent=state.availability[id]==="fresh"?"":state.availability[id];
  }
  document.querySelectorAll("[data-select]").forEach(b=>b.classList.toggle("active",b.dataset.select===state.primary));
  $("#target").value=state.target?.id ?? "task";
  $("#context-label").textContent=state.context?"Context: "+state.context.label:"No supporting selection";
  $("#target-status").textContent=state.availability[state.target?.id] && state.availability[state.target.id]!=="fresh"?"Target "+state.availability[state.target.id]:"";
  $("#pin").textContent=state.pin?"Unpin "+state.pin:"Pin primary";
  $("#pin").setAttribute("aria-pressed",String(Boolean(state.pin)));
  $("#restore").disabled=!state.history.length; $("#load").disabled=!state.saved;
  $("#layout-label").textContent=layouts[state.layout].label+(state.pin?" · pinned":"");
  $("#split").value=state.split; document.documentElement.style.setProperty("--primary",state.split+"%");
  $("#chat").classList.toggle("expanded",state.expanded);
  $("#expand").textContent=state.expanded?"Compact ↓":"Expand ↑";
  $("#expand").setAttribute("aria-expanded",String(state.expanded));
  $("#message").hidden=!state.error; $("#message").textContent=state.error;
  $("#proposal").hidden=!state.proposal;
  if(state.proposal) {
    $("#proposal-reason").textContent=layouts[state.proposal.layout].reason;
    $("#proposal-problem").textContent=proposalProblem(state);
    $("#apply").disabled=Boolean(proposalProblem(state));
  }
  document.querySelectorAll("[data-propose]").forEach(b=>b.setAttribute("aria-pressed",String(state.proposal?.layout===b.dataset.propose)));
  $("#word-count").textContent=state.essay.trim().split(/\s+/).length+" words";
  if(preview)$("#essay-preview").textContent=state.essay;
  const a=state.attention["research-block"];
  $("#attention-bar").hidden=!a||a.state==="resolved";
  $("#attention-state").textContent=a?.state ?? "";
  $("#review-state").textContent=a && a.state!=="resolved"?"A source is needed before synthesis":"Ready for review";
  $("#review-badge").textContent=a && a.state!=="resolved"?"Blocked":"Ready";
  $("#return-work").hidden=!state.returnSurface;
  while(shownRequests<state.requests.length) {
    const req=state.requests[shownRequests];
    const p=document.createElement("p");p.className="user";p.textContent=req.text;
    const label=document.createElement("small");label.textContent="To "+req.target.label;p.append(label);
    $("#transcript").append(p);
    const reply=document.createElement("p");reply.textContent=state.replies[shownRequests];$("#transcript").append(reply);
    shownRequests++;
  }
}
document.querySelectorAll("[data-select]").forEach(b=>b.onclick=()=>send("select",{id:b.dataset.select}));
document.querySelectorAll("[data-target]").forEach(b=>b.onclick=()=>send("target",{id:b.dataset.target}));
document.querySelectorAll("[data-propose]").forEach(b=>b.onclick=()=>send("propose",{layout:b.dataset.propose}));
$("#target").onchange=e=>send("target",{id:e.target.value});
$("#draft").oninput=e=>{state=reduce(state,{type:"draft",text:e.target.value});};
$("#essay").oninput=e=>{state=reduce(state,{type:"edit",text:e.target.value});$("#word-count").textContent=state.essay.trim().split(/\s+/).length+" words";};
$("#essay").onselect=e=>{state=reduce(state,{type:"selection",value:[e.target.selectionStart,e.target.selectionEnd]});};
$("#essay").onscroll=e=>{state=reduce(state,{type:"anchor",id:"essay",value:e.target.scrollTop});};
$("#composer").onsubmit=e=>{
 e.preventDefault();send("submit");
 $("#draft").value=state.draft;
 if(!state.error && !state.expanded)send("expand");
};
$("#suggest").onclick=()=>{$("#layout-picker").hidden=!$("#layout-picker").hidden;};
$("#close-picker").onclick=()=>{$("#layout-picker").hidden=true;};
$("#dismiss").onclick=()=>send("dismiss");
$("#apply").onclick=()=>{send("apply");if(!state.error)$("#layout-picker").hidden=true;};
$("#restore").onclick=()=>send("restore");
$("#pin").onclick=()=>send("pin");
$("#save").onclick=()=>send("save");
$("#load").onclick=()=>send("load");
$("#split").oninput=e=>send("resize",{value:e.target.value});
$("#expand").onclick=()=>send("expand");
$("#essay-mode").onclick=()=>{
 preview=!preview;$("#essay").hidden=preview;$("#essay-preview").hidden=!preview;
 $("#essay-mode").textContent=preview?"Edit":"Preview";
 render();
 if(!preview)requestAnimationFrame(()=>{$("#essay").scrollTop=state.anchors.essay;});
};
$("#attach-selection").onclick=()=>{
 const [start,end]=state.selection??[0,0];
 const label=state.essay.slice(start,end).trim();
 send("context",{context:{workId:surfaces.essay.workId,revision:1,selection:[start,end],label:label?label.slice(0,45):"Whole essay"}});
};
const meanings={
 Conversation:"The primary exchange through which you direct related work.",
 Request:"An expression of intended work with an identifiable target.",
 Assignment:"Delegated work with a purpose, relevant context, and result.",
 Artifact:"A work product whose identity survives a change of presentation.",
 Surface:"A view of work with its own space needs and interactions.",
};
function chooseNode(n) {
 document.querySelectorAll("[data-node]").forEach(el=>el.classList.toggle("selected",el.dataset.node===n));
 $("#node-detail").textContent=n+" — "+meanings[n];
 send("context",{context:{workId:"ontology-workspace",revision:1,selection:n,label:n}});
}
document.querySelectorAll("[data-node]").forEach(el=>{
 el.onclick=()=>chooseNode(el.dataset.node);
 el.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseNode(el.dataset.node);}};
});
$("#graph-search").oninput=e=>document.querySelectorAll("[data-node]").forEach(n=>n.classList.toggle("dim",!n.dataset.node.toLowerCase().includes(e.target.value.toLowerCase())));
function zoomGraph(delta) { zoom=Math.min(2.4,Math.max(.8,zoom+delta));$("#graph svg").style.width=zoom*100+"%";$("#graph svg").style.height=zoom*100+"%"; }
$("#zoom-in").onclick=()=>zoomGraph(.2);$("#zoom-out").onclick=()=>zoomGraph(-.2);
$("#trigger-attention").onclick=()=>send("attention",{id:"research-block",reason:"Research needs a source"});
$("#resolve-attention").onclick=()=>send("resolve",{id:"research-block"});
$("#open-attention").onclick=()=>send("open-attention");
$("#acknowledge").onclick=()=>send("acknowledge",{id:"research-block"});
$("#return-work").onclick=()=>send("return");
$("#stale-ontology").onclick=()=>send("availability",{id:"ontology",value:state.availability.ontology==="fresh"?"stale":"fresh"});
$("#disconnect").onclick=()=>send("availability",{id:"orchestration",value:state.availability.orchestration==="fresh"?"unavailable":"fresh"});
$("#missing-anchor").onclick=()=>{send("invalidate-anchor");$("#essay").scrollTop=0;};
window.addEventListener("resize",()=>{document.body.dataset.fit=visibleSurfaces(state,innerWidth).length===1?"compact":"full";});
render();
