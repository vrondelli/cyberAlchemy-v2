# Robot World and KEP prototype definition

Robot World is an environment for agents to act, construct and test systems. KEP is an independently usable capability marketplace. Worlds supply artifacts and evidence to KEP; KEP supplies versioned capabilities and knowledge to worlds. Neither service owns the other's accepted history.

The first testable candidate consists of two autonomous **scripted** robots, an independent fixture dataset marketplace, an artifact bridge, and a Godot replay of actual world output. Existing Rust RWO schedules the two branches. The existing Trusted Dataset Materialization runner produces the dataset through its Rust RWO adapter. The new world and exchange host are Python prototypes. There is no neural inference, deployed serverless function, financial settlement or live KEP cryptographic exchange in this candidate.

## Prototype terms and ontology scaffold

| Local term | Meaning | Relationships |
|---|---|---|
| Participant | Owner of an agent or consumer identity | owns Agent; requests Capability |
| Agent | Policy plus a world-bound robot identity | observes Context; proposes ActionIntent |
| World | Sole local reducer of its simulation state | records WorldEvent; produces Artifact |
| Context | Bounded observation at a particular revision | derived from WorldEvent; references Artifact |
| Artifact | Immutable bytes addressed by SHA-256 | has Evidence; attributed to contributors |
| Capability | Versioned callable or consumable offer | consumes inputs; produces results; governed by AccessPolicy |
| Dataset | Materialized version with provenance | is Artifact; queried by Capability |
| ExchangeReceipt | Record of one bounded consumption | identifies consumer, request, version and result |
| PromotionProposal | Request to evaluate a capability for hosting | references exact Artifact and Evidence |
| HostingBinding | Separately authorized provider/runtime binding | serves approved Capability |

These are agent-navigation scaffolds in `robot-world-kep.prototype`; they do not register an ontology or redefine existing KEP, ARE, AlchLang or RWO terms. Actual selected dependencies are inventoried in `SOURCE-DEPENDENCIES.json`. The cited ontology graph architecture informs the separation of action intent, local event history and disposable projections; this candidate does not implement its canonical event or governance contracts.

## Product and business prototypes

The first user journey is: inspect two robots transporting resources, inspect the construction evidence, find the resulting recipe in the catalog, and observe one robot consume an exact fixture dataset version. A second user can run the dataset branch without running a world. A world can complete construction without a marketplace.

Offers have independent facets: `kind` (tool/workflow), `artifact_type` (dataset/recipe), `domain` (research/construction/ecommerce), effect class and access policy. Dataset and ecommerce are not competing capability kinds. Contributions attach attribution records; they do not mint money or automatically grant rights. Economy balances in later worlds will be simulated credits until a separately specified settlement system exists.

The adapted intent pattern is: state a typed desired outcome, select an eligible versioned offer, execute within bounds, verify the result, record delivery, then handle settlement separately. Open licensing, contribution rewards and provider pricing remain design questions.

## DomainSpec and compiled-system prototypes

The local model in `model/world.domain.json` uses the AlchLang governed-domain carrier shape as a reference. Its explicit local profile narrows the first recipe to resource collection and workshop construction. `contracts/bridge.schema.json` gives concrete JSON wire shapes. `runtime/prototype.py` binds those shapes to hand-written reducers. This is a mapping prototype; it does not claim a general AlchLang compiler or DomainSpec conformance.

The compiled-system sketch is: deterministic World reducer + bounded Catalog adapter + immutable filesystem artifact store + Rust RWO DAG reducer + local Python task host + Godot observation client. Commands cross process boundaries as JSON; artifact dependencies are identified by content digests. No inferred authorization is carried by vectors, catalog ranking or community votes.

## Interaction dynamics

Physical positions use two world coordinates. Semantic preferences have four axes:
exploration, construction, cooperation and caution. These spaces are distinct.
The original `World` policy uses unnormalized prior-plus-memory and zero semantic
velocities; only exploration/construction directly choose tasks. Its action memory
additions precede tick decay. Retained first-epoch/UI recordings use that legacy policy.

The versioned [interaction-v1 successor](interaction-dynamics/CONTRACT.md) computes
`s = clamp(prior + gain * memory, 0, 1)`, retaining raw memory separately. Its
N-dimensional helper evaluates separation, alignment and cohesion in explicit scaled
coordinates. The small world uses all-to-all semantic neighbors and previous-tick
semantic velocities; scaling requires a separately measured neighborhood index.

For component k, the successor uses
`m[k,t+dt] = m[k,t] * exp(-lambda[k] * dt) + interaction[k]`, with impulses from
newly committed actions exactly once. Four bounded utility weights affect eligible
tasks; cooperation favors useful stock delivery and caution means energy conservation.
These are behavior heuristics, not an embedding-based permission or truth model.
Scripted policies use the checked intent boundary intended for later neural inference.
The [implementation report](interaction-dynamics/REPORT.md) owns measured limits,
regression status and remaining questions.

Open questions: [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).
