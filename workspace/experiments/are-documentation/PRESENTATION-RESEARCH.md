# Task and capability presentation research

Date: 2026-09-17. Status: design recommendation, not an implemented change or a
validated usability result. Scope: lower ARE landing page. No runtime claims change.

## Finding

Prefer one shared demonstration with two entry points: a sequential task story
and direct capability selection. The present implementation separates the story
from a capability catalogue and uses similarly shaped three-node diagrams for
very different mechanisms. That exposes labels but makes the visitor infer the
specific contribution of ARE. This diagnosis is a review of
[src/ExplanationPaths.tsx](src/ExplanationPaths.tsx), not user-test evidence.

## Sources and interpretation

- [Linear AI](https://linear.app/ai): presents concrete work, such as triage,
  coding sessions and reviews, with product artifacts. Borrow concrete artifacts
  and outcome-led headings; do not copy its product claims into ARE.
- [LangGraph](https://www.langchain.com/langgraph): connects capability benefits
  to focused documentation. Borrow that shallow-to-deep path, not its architecture
  or positioning as an orchestration framework.
- [Red Blob Games](https://www.redblobgames.com/): describes combining reading,
  watching and doing through interactive explanations and motivating examples.
  Borrow controls that change the diagram, not motion for decoration.
- [NN/g: Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/):
  tabs hide content; repeated cross-panel comparison adds interaction and memory
  demands. Our task and capability descriptions need to be understood together.
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/):
  prioritize primary information and defer secondary complexity. Keep a short
  availability qualifier visible; reveal implementation references on request.
- [NN/g: Direct vs. Sequential Access](https://www.nngroup.com/articles/direct-vs-sequential-access/):
  provide direct access alongside sequences. Visitors should be able to jump to
  context management without completing the full story, including on mobile.
- [Scrollama](https://github.com/russellsamora/scrollama): reusable reference for
  IntersectionObserver and CSS sticky scrollytelling, including side-by-side and
  mobile patterns. Existing React state and SVG may suffice; no dependency needed
  merely to implement the concept.
- [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility):
  consult for the existing deeper engine canvas. Landing interactions can remain
  standard buttons and SVG; visual relationships also need readable text.

Sources establish patterns and examples, not that a particular ARE redesign will
perform better. Pages were researched through text/documentation; this was not a
cross-browser usability audit of those sites.

## Recommended composition

1. Short naming and value introduction, preserving the current hero and blues.
2. Outcome shortcuts: understand your terms; prepare useful context; continue
   with evidence. These group the six capabilities without discarding them.
3. One shared stage. On desktop, task events sit beside a stable diagram; a
   capability icon rail highlights the relevant mechanisms. Every event changes
   concrete content, not just a heading. Direct capability selection jumps to an
   associated event and keeps a way to resume the story.
4. Inline explanation of what changed and why. Expandable implementation details,
   with relevant prototype limits still visible next to the claim.
5. Direct documentation entry for deeper inspection.

Suggested events and artifacts:

| Task event | Visible artifact | Mechanism to explain |
| --- | --- | --- |
| Team corrects the word “member” | Scoped term → meaning → later use | Explicit correction retained for a named project; prototype limitation visible |
| Launch becomes invitation-only | Context window with selected request, rule and tests; saved pricing notes outside | Selection is not deletion; saved state is not automatically model-visible |
| Expired invitation test fails | Test output linked to attempted change and open question | Recording evidence and supporting a next decision are separate from success |
| Team resumes tomorrow | Reconstructed goal, decision and unresolved checks; release proposal awaits approval | State reuse, next-step support, and action boundaries work together |

Each event should offer a small action such as “Apply the requirement” or “Resume
work” and an immediate visible change. Avoid a fabricated with/without-ARE model
comparison or invented token savings. Label illustrative data as illustrative.

## Alternatives and tradeoffs

- Separate feature catalogue: easy to scan, but weak at explaining relationships.
- Mandatory full-screen scroll narrative: coherent story, but costly to revisit
  and unsuitable for small embedded panes.
- Shared interactive stage with direct shortcuts: recommended hypothesis; needs
  careful synchronization and clear selected state.

No scroll hijacking or mandatory long sequence. Desktop may use a short sticky
stage when it fits; narrow and short panes should place each diagram inline.
Keyboard controls, touch targets, visible state labels and reduced motion remain
required. Do not hide important meaning behind hover-only controls.

## First experiment and acceptance questions

Build only the context-management scene first. Ask new readers to identify what
enters the model window, what remains stored outside, and what ARE contributed.
Compare answers and interaction effort with the present section. Then check that
readers can jump directly to a capability and return to the story. Track wrong
interpretations, especially unlimited recall and automatic model learning. This
is a comprehension evaluation, not an engine benchmark.

## Open Questions

- Does the shared stage improve comprehension over the present separate sections?
- Which labels work for visitors unfamiliar with agents and context windows?
- Which recorded live trace can eventually replace the illustrative story?
- When should a narrow pane stop using a shared stage and show inline diagrams?
