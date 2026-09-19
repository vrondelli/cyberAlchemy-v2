# Roadmap Lab: quick start

Roadmap Lab helps you understand the current DomainSpec v2 release plan and submit one
specific improvement for review.

It is not a roadmap editor. Submitting something does not save it, apply it, approve it,
or make the release ready.

## Open the page

From the repository root, run:

```bash
python3 -m http.server 8765 --bind 127.0.0.1 --directory projects/domainspec-v2/development/first-production-release/visibility
```

Then open:

```text
http://127.0.0.1:8765/roadmap.html
```

Keep the terminal running while you use the page. If port `8765` is already occupied,
choose another port in both the command and the URL.

## What you are trying to learn

Before proposing a change, you should be able to explain three things:

1. The product direction is agreed, but the first release is not authorized.
2. FPR-01 is the current step: find where the roadmap, specifications, decisions, and
   code disagree, then record what the team will follow and who approved it.
3. Later release work should not rely on those sources until the known contradictions
   have been resolved.

## Walk through Roadmap Lab

### 1. Read the current situation

Start with **Read this first**. Read the **Done**, **Now · FPR-01**, and
**Then · FPR-02** cards.

In **Roadmap Lab**, confirm that the **Focus node** is FPR-01. Enter your name in
**Participant label**, then choose **Continue**.

The event will appear in **Submission history**. In the standalone page, it has only
been emitted locally; it has not been saved.

### 2. Explain FPR-01 in your own words

Under **Restate**, complete:

- **What FPR-01 means** — describe the contradictions that must be found and resolved.
- **What it depends on** — explain what has already been decided.
- **How we know it is done** — describe the evidence that every known contradiction has
  an owner decision and the release documents agree.

Choose **Submit restatement**, then inspect **Last emitted event**.

### 3. Inspect a source

Under **Source trail**, choose a **Source path** and select **Request source**. Use
**Copy path** if you want to open or cite that file in an agent session.

Requesting a source does not change the roadmap. It records which evidence you want to
inspect.

### 4. Propose one improvement

Under **Propose**, select the kind of change you mean:

- **Presentation copy** — change how an existing title or summary is explained.
- **Graph or claim** — question a roadmap relationship or factual claim.
- **Continuation** — suggest a different next action.
- **Research evidence** — request evidence for an unresolved question.
- **Protected or unsupported** — flag something that should not be changed or claimed.

For **Presentation copy**, choose the exact **Presentation field**. Review
**Observed original**, then write one **Proposed change** and its **Reason**.

**Graph or claim** and **Research evidence** proposals require at least one path in
**Evidence refs**. For other proposal types, include a path whenever it helps an owner
verify your reasoning.

Read **Owner preview**, then choose **Submit proposal**.

### 5. Take the proposal to review

Inspect the JSON under **Last emitted event**. Use **Copy event JSON** and paste the
result into an authorized agent or owner session.

If the page says **waiting for storage acknowledgment**, it means exactly that: the
standalone HTML emitted the event, but no host has confirmed that it stored it. Copying
the JSON gives you a portable review record; it still does not accept or apply the
proposal.

## You are finished when

Without help, you can:

- explain what FPR-01 is resolving and why later work depends on it;
- identify and copy the path to one source behind the roadmap; and
- produce one proposal JSON that states the original text or claim, your proposed
  change, your reason, and any required evidence paths.

The next step is owner review. The guide does not authorize implementation, change the
roadmap, or advance the DomainSpec v2 release.
