# I can generate code faster now. I still need to know what it means.

I have been building CyberAlchemy mostly on my own. It started with a question I kept running into: if we can produce software so quickly, how do we keep the original intent from disappearing along the way?

I do not think the hard part is simply converting a requirement into code. The hard part is noticing when the requirement, the formal model, the generated program, and the test result are each answering a slightly different question.

Here is the path I have been working on.

First, settle the vocabulary. A definition has three connected forms: a formal voice that states the normative meaning, a plain-language explanation, and a domain-context explanation that shows how the term is used. The latter two help a person understand the first; they do not quietly replace it. Important terms have identities, owners, versions, and explicit dependencies.

Those definitions are connected in a business ontology. That sounds abstract, but the job is practical: record which business concepts depend on which others, where a meaning came from, and what is still disputed. A graph is useful here because a change to one definition should tell us which claims and systems might need another look. The graph does not become the authority just because it is a graph.

Next comes a FormalClaim. It connects a selected piece of business intent to an exact proposition, with its signature, definitions, assumptions, and limits made explicit. I have been using a sorted first-order logic path for suitable claims, while keeping other formal routes separate when the question calls for them. A FormalClaim says what is being asserted. It is not, by itself, proof that the assertion is true or that any implementation satisfies it.

The formal notation needs a human way back in. Consider this illustrative clause:

`Eligible(o) ∧ ValidTotal(o)`

I want a reader to be able to follow it in order: what the `and` means, what `Eligible(o)` refers to, which exact version of the eligibility definition it uses, what `ValidTotal(o)` refers to, and what the whole expression says when put back together. Each explanation node points to a specific clause or expression and to the definitions actually bound to it. The underlying graph keeps the traceability; the reading view puts the steps in a sequence a person can follow. These nodes are explanatory only. They cannot rewrite the claim, and I cannot claim that a reader understood something just because an explanation was displayed.

Once the meaning is explicit, the author can describe the software semantics through AlchLang and DomainSpec. The backend vocabulary uses 13 governed meta-types, including Entity, Value Object, Rule, Operation, Workflow, Event, Interface, and Policy. The relationships matter as much as the nouns. A Rule may gate an Operation; an Operation may produce an Event. An arbitrary link is not accepted merely because it makes a nice diagram.

DomainSpec compiles supported source into a typed graph and source-bound outputs, including a system-ontology view. I think of that view as a map back to the exact declarations, not as a second source of truth. The selected realization machinery for the 13 roles currently has 39 TypeScript, Python, and Rust rows. For an exact compiled graph, the stable compiler can generate a Lean proof unit for applicable structural obligations, and generated artifacts can be checked against their selected realization contracts. That is meaningful reusable rigor, but it is not a theorem that every generated application behaves correctly in production.

The evidence side has the same discipline. TDE is meant to derive provider-neutral, bounded test obligations from an admitted executable projection. It should not invent a business rule the source never stated. A model checker, theorem prover, test runner, and runtime observer each contribute different evidence. EVF then joins current evidence to the exact obligation, source, assumptions, provider, and environment. A passing check supports only the conclusion it actually measured. Even a `PASS_BOUNDED` result is not product approval.

Some parts of this chain are implemented, including DomainSpec graph compilation and selected structural proof and conformance paths. Other pieces, especially the general FormalClaim-to-TDE-to-provider-to-EVF lifecycle and compiler-emitted understanding view, are still candidate contracts or partial verticals. I would rather say that plainly than hide the gaps under the word “verified.”

I am sharing this because I would like to work with people who care about the gap between what we meant, what we built, and what we can honestly claim to know. I have taken this a long way alone, but I am looking for a team where I can contribute, be challenged, and build this kind of work with others.

If you work in formal methods, language tooling, software architecture, or evidence-driven engineering, I would genuinely value your critique. Where would you put the sharpest boundary in this chain?

## Open questions

- What evidence is enough to say a generated projection preserves a selected business meaning?
- How should a change to a definition invalidate downstream claims and evidence?
- Which parts of a human explanation can be derived safely, and which need an owner to write or review them?
