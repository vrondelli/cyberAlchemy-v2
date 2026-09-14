# CyberAlchemy Exchange product thesis

Candidate revision, 2026-09-13. Owner: Exchange product owner.
This revision grounds the vision in the selected project catalog, paid managed Alch
hosting and the existing local-inference community, as specified by the owner on 2026-09-13. It preserves
[existing product decisions](../../../define/reviews/cyberalchemy-exchange/INTAKE.md);
the market hypotheses below remain to be tested.

## Vision

**CyberAlchemy Exchange is a trading network where people and agents can make
what they create, know and operate available for others to use, share and trade.**

The ambition is to make useful work travel beyond the person or organization that
produced it. A project can become something another builder acquires and develops.
A service can become something other applications call. A model running on an
operator's infrastructure can become a capability other people use. Participants
can supply value, consume value, or do both.

Exchange brings the market and the means of fulfillment into one product. People
should be able to find an offering, understand its terms, obtain the promised
access or outcome, and continue using what they acquired. Providers should be able
to reach those people without building a separate commercial and delivery system
for every offering.

The long-term scope is a general trading network. Inference and project
co-ownership are the first concrete expressions of that vision. Additional kinds
of trade belong when Exchange can express and support their actual delivery and
settlement requirements.

## Where Exchange starts

Exchange begins with a concrete catalog and community:

| Offering | What the customer obtains |
| --- | --- |
| **CyberAlchemy Lab** | The selected project version of the consolidated, corrected successor to cyberAlchemy-v2, developed at `../CyberAlchemy-lab` |
| **ARE** | A separately sold Agent Reasoning Engine project: Static without the improvements engine, or Full with it |
| **Craft + Alch** | The selected combined offering for authoring and constructing systems |
| **Managed Alch hosting** | A service that accepts an Alch file and hosts its callable behavior for the customer |
| **Community inference** | Access to members’ locally running models, with each provider choosing free or paid access |

The owner supplies the initial project offerings and intends to sell managed
hosting. An existing community, reported by the owner, wants local-inference
sharing. These are concrete starting intentions; released packages, completed
purchases and sustained community use still need their own evidence.

ARE will become one coherent product through a later consolidation of its dispersed
sources. Static and Full are editions of that product. Their exact module and
dependency boundaries remain to be specified; this decision does not perform the merge.

Lab is the successor intended for sale, rather than the dispersed cyberAlchemy-v2
evidence tree. ARE has its own sale offering. Craft + Alch is recorded as a combined
offering. Exact versions, package overlap, licenses, updates and support entitlements
must be stated in each listing. See [the offering catalog](OFFERINGS.md).

For project sales, the selected KEP model provides co-ownership and access to an
exact version under its terms. For managed hosting, the customer purchases ongoing
operation of submitted source. For community inference, the caller requests an
execution on a member's engine. All belong to Exchange, with fulfillment and
commercial terms appropriate to each.

## The customer problem

Our starting hypothesis is that **creating something useful and making it usable
by someone else are two different jobs—and the second job prevents valuable work
from reaching people who need it.**

For the owner selling projects, having a useful project does not automatically provide a way to
present its exact version, sell access, deliver it securely, and support the buyer
after an interruption. For a community member, having a locally running model does
not automatically make it accessible to another member. They need connection,
discovery, access controls, usage limits and a way to communicate availability.
Exchange should provide a repeatable way to share it without each member assembling
that system separately. For paid offerings, Exchange also needs a defined usage and settlement contract.

A customer who has written an Alch service faces another gap: turning the file into
something other people can call and keeping it running. They want to provide the
behavior and use the result; deploying and operating servers is work Exchange can
take on as a paid service. This is a direct reason for the host to belong to Exchange.

The buyer faces the other side of this fragmentation. Finding something promising
is only the beginning. They still need to understand what they receive, which
version or service they are choosing, how to access it, what happens when a request
fails, and whether they can recover a purchase whose delivery was interrupted.
An automated client needs those answers in contracts it can act on, rather than
instructions a person must interpret on every transaction.

Exchange's opportunity is to reduce this work for both sides while preserving the
differences between buying access to a project and requesting an executed service.

## The value Exchange promises

**For providers: a shorter path from having something useful to making it available
on clear terms.** A builder can offer a project version. An operator can expose a
service or model. Exchange supplies the common paths for discovery, access,
interaction and supported transactions around the provider's actual offering.

**For buyers: a shorter path from finding value to using it.** The offering should
make its deliverable and terms understandable before commitment, provide a defined
way to obtain it, and preserve the appropriate recovery path afterward.

**For Alch authors: a path from a source file to an operated service.** The customer
submits supported Alch source, receives build and preparation results, explicitly
activates the service under agreed terms, and obtains a callable endpoint. Exchange
operates the hosting environment and provides usage, status and lifecycle controls.
The intended serverless experience removes server management from the customer's
job; it still requires a precisely supported runtime and service contract.

**For people building with agents: a market their software can participate in.**
Discovery, invocation, purchase and recovery should be available through APIs.
Human interfaces make those same operations understandable and accessible.
Agent participation still requires explicit identity, permissions and spending
authority; automation does not decide those on the user's behalf.

The intended result is less repeated integration work, more successful use of
existing work, and more opportunities for providers to earn from it. Those are
customer outcomes to measure, not conclusions established by technical tests.

## Why the host belongs to the product

An executable offering needs somewhere to run and a way to remain usable. The
Exchange Host connects a provider's service to the experience the buyer receives:
prepare it, make it available, invoke it, observe its condition and recover its
operation when necessary.

That makes hosting part of fulfilling the product promise. It also lets Exchange
support useful services before every provider has built their own operating and
commercial infrastructure. Providers may connect engines running elsewhere;
Exchange does not need to own every machine or model.

The host operator configures and runs the service. The caller requests its use.
They can be the same person, but the product must support them being independent.

The host has two immediate responsibilities: operate customer-submitted Alch
services and provide a dependable path from a member’s local engine to another
member’s authorized request. Connection setup, availability,
limits and disconnect handling are part of that experience. The existing loopback
and operator-tunnel prototypes are starting evidence; they do not yet prove a
community-wide hosting service. The serverless offering does not yet establish
autoscaling, scale-to-zero, unrestricted Alch execution, a billing unit or an
availability guarantee. Those need explicit contracts and tests. Sharing inference also needs explicit expectations
about what request data the provider receives and retains.

## Why knowledge co-ownership matters

Useful knowledge can benefit another participant while remaining useful to its
creator. Exchange's selected project-sale model reflects that: a buyer becomes a
co-owner of an exact project version while existing co-owners remain.

KEP is the internal protocol that gives this relationship concrete meaning through
version identity, membership, encrypted access and key recovery. Exchange adds the
purchase and delivery experience. This supports a market in which sharing can
expand participation without requiring the originator to give up membership.

Co-ownership does not by itself define a copyright license, exclusive rights or
royalties. Those terms must be explicit where needed. The selected purchase flow
commits payment and membership together; interrupted delivery after commitment
remains recoverable. Private content keys stay with participants.

## Matching requests to dependable providers

Quality-based automatic routing is selected for the MVP. A caller can request a
task and Exchange selects among permitted, capable providers using quality and
performance evidence. Provider audiences and accepted free/paid terms constrain
eligibility before ranking. This aims to reduce the caller’s model-selection work
and give providers a reason to deliver dependable results.

Who establishes scores and how each task is evaluated remain explicit decisions.
Existing configuration ranks do not prove measured answer quality. See the
[owner decision](QUALITY-ROUTING-DECISION.json).

## How the network could grow

The starting point is Lab, ARE and Craft + Alch, the managed Alch hosting service,
and the existing community's inference-sharing need. This gives Exchange an initial source of offerings and a
group with whom to test the experience. It does not yet establish the number of
active providers, project buyers or concurrent requests.

First, demonstrate a successful project purchase, a customer-submitted Alch service
running on Exchange, and inference shared between two independent community members. Then learn whether people return, what they need to
share next, and whether additional providers want to join. Expansion to a broader
market should follow that evidence.

The growth hypothesis is that more useful, dependable offerings attract more use;
that use gives providers a reason to improve and supply further offerings. Buyers
may themselves become providers as they create new work. This possibility depends
on actual demand, clear terms and dependable fulfillment. Adding listings alone
does not establish a functioning market.

Alch and DomainSpec support this ambition by making contracts and behavior explicit
and reusable across offerings. They are how we construct Exchange; the customer
value is the ability to offer and use something successfully.

## What would make this thesis credible

We should test whether independent providers can make an offering usable with
less setup and support work, whether buyers reach their intended outcome with less
integration effort, and whether both return for another exchange. Early evidence
should include time to first usable offering, time to first successful use,
fulfillment and recovery failures, repeat use, and willingness to pay.

The thesis needs revision if providers must still build most of the surrounding
system themselves, buyers prefer direct arrangements without finding value in
Exchange, hosting adds complexity without improving fulfillment, or a broad catalog
fails to create repeat demand. Existing host, inference and purchase prototypes
support testing the mechanism; they do not yet prove the market.

## Open Questions

The initial catalog and audience are selected. We still need exact sale versions,
package contents and rights; the first customers/providers; the supported Alch
hosting profile and service guarantees; and metering, pricing and settlement for
paid hosting and inference. Buying Craft + Alch does not yet imply included hosting
or model access. Any bundle must state those entitlements explicitly.

These questions are recorded in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md), particularly
Q10/Q11 and Q16–Q18. Technical capabilities and the preceding integration roadmap
remain in [CAPABILITIES.md](CAPABILITIES.md) and [ROADMAP.md](ROADMAP.md). The roadmap
predates this concrete catalog and needs the managed-hosting commercial journey
incorporated in its next planning revision.
