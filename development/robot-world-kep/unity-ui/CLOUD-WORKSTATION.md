# Cloud Unity workstation for checkpoint 02

Research and setup proposal, 2026-09-06. No cloud resource was provisioned, account accessed, credit purchased or project file uploaded. This is operational support for the existing Unity product prototype, with environment-owner scope. It does not deploy Robot World or KEP.

## Proposed configuration

Use one persistent GPU workstation with Unity 6, URP, glTFast and a remote graphical desktop. The recommendation is AWS when account access is available, because the workstation can support both interactive review and controlled remote commands. A managed cloud PC is an alternative when reducing initial administration matters more.

| Item | AWS proposal | Evidence / qualification |
|---|---|---|
| Compute | One `g4dn.2xlarge`, on demand | 8 vCPUs, 32 GiB RAM and one NVIDIA T4; [AWS G4 specifications](https://aws.amazon.com/ec2/instance-types/g4/) |
| OS | Ubuntu 22.04 with GNOME/X11 and proprietary NVIDIA graphics driver | Ubuntu 22.04 is listed in [Unity 6 editor requirements](https://docs.unity3d.com/6000.0/Documentation/Manual/system-requirements.html); actual VM/driver/editor rendering needs a smoke test |
| Region | A region near the user's review location; London is provisional | Exact account, region, GPU quota and capacity remain unselected |
| Storage | One encrypted 200 GiB gp3 persistent volume, baseline IOPS/throughput | Proposed capacity for editor, imports, assets and builds; retain project data across compute stops |
| Remote desktop | Amazon DCV | AWS documents this [game-development workstation pattern](https://docs.aws.amazon.com/wellarchitected/latest/games-industry-lens/cloud-game-development-workstations.html) and a [Ubuntu/g4dn desktop setup](https://docs.aws.amazon.com/gameliftstreams/latest/developerguide/troubleshoot-compatibility-setup-remote.html) |
| Access | Named user login; administrative access through SSM; DCV ingress limited to the selected user network | Final VPC/access configuration must be part of the resource proposal. Do not copy the tutorial's unrestricted inbound rule |
| Editor | One exact Unity 6 release plus compatible URP/importer versions | Pin together after checking available editor packages; no invented package lock |
| Cost control | Short initial smoke-test session, explicit stop after use, retained-volume cost tracked separately | Account budget alerts are not a guaranteed spending cutoff; no automated cutoff has been installed |

DCV on EC2 does not require a separate license server, but requires access to its licensing endpoint and the documented permissions. [Amazon DCV licensing](https://docs.aws.amazon.com/dcv/latest/adminguide/setting-up-license.html). Unity itself needs the user's applicable account/license activation through Hub. [Unity license management](https://docs.unity.com/en-us/hub/manage-license). This research does not establish the user's eligibility for any Unity plan or certify an untested VM configuration.

## Cost comparison

AWS compute has not been quoted for an exact account/region/OS configuration. Obtain that quote before creation, including compute, persistent storage, public IP if used, streaming data transfer, snapshots and tax. EBS storage is billed while provisioned, including when the editor VM is stopped. [AWS EBS pricing](https://aws.amazon.com/ebs/pricing/).

For a managed alternative, AirGPU advertises an L4 configuration starting at $0.90/hour with at least 8 vCPUs and 32 GB RAM, plus storage at $3.50 per 50 GB per month, excluding VAT. At those advertised starting rates, 10 hours plus 200 GB retained for one month is $23 before VAT. This is arithmetic from public starting prices, not a regional checkout quote. Confirm the chosen OS image, availability and remote-development access before purchase. [AirGPU published pricing](https://airgpu.com/).

AirGPU provides Moonlight desktop access; its setup instructions include pairing and starting/stopping the machine. [AirGPU connection guide](https://help.airgpu.com/getting-started/connect-to-your-machine). Our ability to execute commands and transfer evidence into that machine remains to be established. This makes AWS the current recommendation for agent-driven iteration, subject to existing account/credits.

## Work sequence and checkpoint boundary

1. **Operational support, environment owner:** select provider/account, region and first-run spending envelope. Resolve GPU quota and an applicable Unity account/license. Prepare the exact resource/access/retention configuration and cost before any paid provisioning.
2. **Operational support, environment owner with implementation assistance:** create the scoped workstation; verify GPU driver, remote desktop, persistent storage and a Unity 6 URP smoke render. Record the actual GPU backend and editor/package versions. A software-only renderer does not satisfy the intended GPU setup.
3. **Product construction, client/visual author:** transfer a reviewed package containing the selected version 2 assets, paired demo session, C# sources and approved visual target. The upload allowlist is limited to `unity/Assets/RobotWorld/Models/ColonyV2/`, `unity/Assets/RobotWorld/Textures/ColonyV2/`, `unity/Assets/RobotWorld/Scripts/`, `unity/Assets/StreamingAssets/RobotWorld/demo-session/` and `checkpoints/01/art-direction-v1.png`; verify content hashes before and after transfer. Local absolute paths in planning records are not a portable project format.
4. **Product construction, client/visual author:** compile the loader, import the assets, construct the real scene, animate the retained replay and refine geometry/materials/lighting against the approved image. The current Blender assets still have a visual gap; cloud compute does not automatically remove it.
5. **Product test, validator:** capture the actual Unity full view, robot and workshop close-ups, camera/replay clip, input identity and render logs. Save results locally and stop the cloud compute session as scoped, retaining project data under the agreed storage policy.
6. **User review:** present checkpoint 02 from the running Unity scene and wait for validation. The cloud smoke test is an internal setup check, not an extra user review checkpoint.

The existing simulation, inference architecture, ontology and KEP lifecycle remain outside the renderer. This first workstation uses the local demo session. Future live connections require their own exact adapters and access scope.

## Current frontier and dependencies

Product construction has two authored mesh revisions and a Python adapter with six passing checks; C# compilation and reference-level visual fidelity remain unverified. The exact causal blocker for S1/T1 is a usable Unity environment. The cloud workstation is an O2 operational-support candidate to resolve that blocker. Further independent asset/adapter work remains available; cloud networking for the KEP marketplace, Kubernetes and public hosting are deferred operational residue and do not gate this UI prototype.

## Open questions

- Which cloud account or credits can the user provide, and what is the first-run spending limit? Asked in the current task; unanswered when this proposal was written.
- Which region and GPU quota are actually available in that account?
- Which Unity account/license and exact editor release will be used?
- Can the selected workstation support authenticated command execution and graphical review from the available local environment?
- What persistent-storage retention duration should remain after checkpoint review?

Related state: [checkpoint 02 preparation](checkpoints/02/README.md). The approved image and its existing checkpoint decision are unchanged.
