# Explain what changes in the work

Date: 2026-09-17. Status: research and design hypotheses, not implemented or validated with readers. Scope: ARE documentation prototype. No runtime capability or benchmark claims change.

## Objective and existing work

Explain ARE as connected support for agent work: goals, context, state, evidence, decisions, scoped language lessons and action boundaries. Preserve the holographic engine, blue palette, icon-led design, automatic scenes with holds, manual controls, continuous page and canvas documentation. Keep concrete coding/startup situations in the lower explanation; the hero remains general.

The first [presentation research](PRESENTATION-RESEARCH.md) proposed a shared task demonstration. [Its implementation](SHARED-DEMO-PLAN.md) exists. Repeating that recommendation would not address the remaining gap.

## Local findings

- [Hero.tsx](src/Hero.tsx) names concepts without consistently showing the input and consequence of each connection. The lower page starts by explaining the name.
- [ExplanationPaths.tsx](src/ExplanationPaths.tsx) maps six capabilities onto four moments. TaskVisual receives step and applied, not the selected capability. Feedback and next-step support share one visual; working state and action boundaries share another. Changing prose alone does not show their different contributions.
- The context illustration swaps information but does not show why each item is selected.
- Four independent applied flags permit direct access without a chronological walkthrough. This is useful, but each jump needs an explicit scenario snapshot to avoid implying unseen events occurred.
- Browser checks establish operation and layout, not reader comprehension.

These are source-review findings and design inferences, not measured user failures.

## External research

Sources were read through published page content. This was not a live usability test or full visual audit of those sites.

| Source | Observed approach | Application to ARE |
| --- | --- | --- |
| [Bartosz Ciechanowski, Mechanical Watch](https://ciechanow.ski/mechanical-watch/) | Moves from the whole mechanism to selected parts, explains their purposes, then reconnects them. | Keep the engine overview; isolate only connections relevant to the current question. |
| [Bret Victor, Ladder of Abstraction](https://worrydream.com/LadderOfAbstraction/) | Moves between concrete behavior and broader representations, with direct control over time and parameters. | Let visitors inspect an event and its recorded state without waiting through a replay. |
| [Red Blob Games, Introduction to A*](https://www.redblobgames.com/pathfinding/a-star/introduction.html) | Establishes input, representation and output; distinguishes algorithm knowledge from application responsibilities. | Show what ARE receives and returns, and what the model, tools and host still do. |
| [NN/g, Purpose of Animation](https://www.nngroup.com/articles/animation-purpose-ux/) | Motion can communicate feedback and state changes; competing motion can distract. | Animate the item or evidence link that changes, then hold still while readers inspect it. |
| [NN/g, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) | Prioritizes essential information and defers advanced detail. | Establish a primary task path, retain direct capability shortcuts, and keep implementation references secondary. |
| [Linear AI](https://linear.app/ai) | Presents concrete work actions and recognizable artifacts, including issues, updates and reviews. | Tie each benefit to something visibly changing. Its product claims are not evidence about ARE. |
| [Anthropic, Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Separates context curation, retrieval and tool use, including lightweight references for later retrieval. | Distinguish stored information, selected context and executed actions. Saved information is not automatically model-visible. |

## Proposed opening

Retain “Why is it called Agent Reasoning Engine?” as the first lower-section heading, as requested. Answer with the role before decomposing the name:

> A.R.E. helps an AI agent carry the important parts of a task from one step to the next. It connects the goal, relevant information, results and unfinished work so the next decision can build on what happened.

Follow with a compact responsibility map:

- You supply the goal and corrections.
- The host connects ARE to the agent and tools.
- ARE prepares context, maintains connected working state and supports decisions.
- The model produces responses and proposed actions; the host runs tools.
- Observed results become evidence for the next step.

This is proposed copy based on existing prototype descriptions, not a new canonical definition. Integration guarantees remain scoped. Avoid implying model weight training, automatic correctness, universally enforced permissions or measured token savings.

Possible general hero captions: “Connect the parts of the task”; “Prepare what the agent needs next”; “Let results inform the next decision”; “Carry the work forward, together.” Preserve choreography. Copy changes are a later implementation choice, not required to improve the lower demonstration.

## Make the contribution visible

Keep the signup story, but give each moment an input, visible contribution and next responsibility.

| Moment | Input | Visible ARE contribution | Agent/host responsibility |
| --- | --- | --- | --- |
| Confirm language | Member means paying customer here | Scoped meaning available for later requests | Supply and confirm scope; use prepared meaning |
| Change requirement | Invitation-only launch | Select requirement and expiry checks with reasons; pricing remains saved outside | Produce the proposed change |
| Inspect result | Expired invitation accepted | Link failed output to attempted change and violated rule | Run test and investigate defect |
| Choose next step | Failed check and unfinished goal | Explain why investigation remains necessary | Decide and perform the next action through the integration |
| Resume | Goal, decision and unresolved check | Restore relevant work | Continue and verify completion |
| Propose release | Deployment proposal | Identify approval boundary separately from saved state | Enforce boundary and obtain approval |

Capability selection should highlight different relations in the same task, not only substitute a paragraph. Keep direct jumps with explicit scenario snapshots. Use icon nodes, labelled edges and nearby text rather than another catalogue of cards.

Conceptual feedback flow: goal/corrections → connected working state → selected context → agent/model → host/tools → observed results → working state. Next-step support draws from state; consequential proposals have a separately assessed boundary. This illustrates responsibilities, not literal runtime topology. The feedback loop is cyclic; implementation ordering is a separate DAG.

## Hypotheses and evaluation

- H1: Role labels help readers distinguish ARE, model and host. Compare the existing opening against the proposed role map.
- H2: Selection reasons clarify stored versus model-visible information. Ask what the model can use after a requirement changes and whether omitted notes were deleted.
- H3: Distinct capability highlights clarify evidence recording, decision support, state retention and permission enforcement. Ask what changed when switching between these capabilities.
- H4: A noncoding transfer question distinguishes general understanding from memorizing signup details. Ask how the same cycle could support preparing a customer proposal.

First evaluation: five first-time readers; counterbalance exposure order where possible. Capture unaided answers before revealing capability names. Record correct distinctions, unsupported claims, clarification requests and time to explain. A small sample is formative, not statistically conclusive.

Proposed acceptance target: four of five readers can explain ARE's role, distinguish selected and stored information, and identify the next unresolved action. Any inference of automatic correctness, model training or universal permission enforcement triggers review. These are proposed targets, not results.

Keep illustrative state changes labelled. Do not fabricate with/without-ARE outcomes or infer benchmark improvements from comprehension results.

## Next work and construction boundaries

First build only the role map and improved context-selection explanation. Evaluate comprehension before expanding the other capability views. This tests a specific hypothesis rather than continuing visual refinement without evidence of understanding.

Current product frontier: an understandable local product explanation. Runnable candidate work: copy, role map, selection reasons, distinct capability highlights, then formative evaluation. Operational prerequisites: none for local illustration. Evaluation depends on recruited first-time readers; the product owner arranges participation. Real runtime traces, release and deployment remain separately scoped. Research grants no admission or operational effects.

## Open Questions

- Who is the primary first-time reader: agent user, integration developer or team buyer?
- Can readers explain the whole connected cycle beyond context management?
- Is the four-second hero hold sufficient after copy changes?
- Which exact implementation evidence supports each public-facing claim?
- Which real trace can replace the illustration without exposing private evidence?
- When does a short embedded pane need a different diagram layout?
