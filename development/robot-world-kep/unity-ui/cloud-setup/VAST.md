# Vast.ai feasibility and first Unity experiment

Checked 2026-09-06. Finding: **technically plausible and worth a short rental
test**. Vast documents GPU virtual desktops and full Linux VMs. A public,
anonymous offer search returned currently rentable VM-capable hardware. No
account, payment method, private key or rental was accessed or changed, and no
Unity runtime test has been performed.

This is operational-support research for checkpoint 02. The separate money
initiative is outside the experiment. The existing assets and recorded session
remain the product inputs; no live inference or financial service is added.

## Why it can work

Vast supplies an **Ubuntu Desktop (VM)** template with a KDE desktop and GPU
graphics. Its desktop guide provides an Instance Portal, Selkies WebRTC,
NoVNC and SSH. Full VMs also permit systemd and normal Linux administration.
Use the official VM template so that the marketplace filters for VM-capable
hosts. A generic CUDA/PyTorch container is not the selected desktop setup.
[Virtual computing](https://vast.ai/use-cases/virtual-computing),
[VM requirements](https://docs.vast.ai/guides/instances/virtual-machines),
[desktop guide](https://docs.vast.ai/linux-virtual-desktop).

Unity 6.3 supports Ubuntu 22.04/24.04, x64, NVIDIA proprietary drivers and
OpenGL 3.2+ or Vulkan. Its Linux support matrix specifies GNOME. Vast's KDE
template is therefore a compatibility experiment, not a certified Unity
configuration. Inspect the actual guest OS and graphics backend before
installing; if KDE causes problems, evaluate a GNOME/X11 setup within the VM.
Unity also excludes container/emulation/compatibility-layer editor setups from
its stated support conditions. Use the native Linux editor rather than Wine.
[Unity requirements](https://docs.unity3d.com/6000.3/Documentation/Manual/system-requirements.html).

## Observed offers

The saved [API snapshot](vast-offers-2026-09-06.json) was retrieved at
08:01:31 UTC on 2026-09-06. The read-only query selected on-demand, verified,
rentable, single-GPU, VM-capable offers with at least 8 effective CPU cores,
32,000 MB RAM and room for a 200 GB allocation. The following European
candidates also reported reliability above 0.99 and no VM de-verification.
These are provider-reported metrics, not independently measured guarantees.

| Offer ID | Location | GPU / VRAM | Approx. system RAM | Compute/hour | 200 GB disk/hour while running | Total/hour before bandwidth |
|---|---|---|---|---|---|---|
| 49994930 | Portugal | RTX 4060 Ti / 16 GB | 64 GB | $0.0933 | $0.0556 | **$0.1489** |
| 39775591 | United Kingdom | RTX 3060 / 12 GB | 172 GB | $0.0800 | $0.1111 | **$0.1911** |
| 48742494 | United Kingdom | RTX 5060 / 8 GB | 64 GB | $0.1000 | $0.1111 | **$0.2111** |

The selected allocation is 200 GB; the larger `disk_space` field is available
capacity, not disk included in the price. CPU/RAM fields are offer-reported
allocations and need validation inside the VM. Prices and availability must be
refreshed at rental time. An ID-filtered re-query returned zero matches even
though a subsequent broader search returned those offers; select and verify
the actual offer in the console rather than treating that narrow lookup as
proof of availability. [Offer search API](https://docs.vast.ai/api-reference/search/search-offers).

**Preferred first candidate: the Portugal RTX 4060 Ti.** It has 16 GB VRAM,
adequate advertised RAM for the prototype, lower retained-disk cost and
substantially more reported upload bandwidth than the two UK candidates.
Actual latency and interactive performance remain to be measured from the
user's location. The UK RTX 3060 is the simpler alternative if proximity wins
the latency test. There is no need to pay for an RTX 4090 for the first import.

At the Portugal rate, two running hours cost about **$0.30**, and ten cost
**$1.49**, before bandwidth, tax and storage retained outside those hours.
These figures assume disk billing only for those same hours. Retaining the
200 GB disk for 30 days would cost **$40 at the displayed running disk rate
alone**; that is not a stopped-instance quote. Vast says stopped storage can
cost more, and both network directions are metered. Confirm the stopped rate
and transfer prices in the final offer. Stopping the VM does not end storage
billing. [Pricing](https://docs.vast.ai/guides/instances/pricing).

## Proposed two-hour setup trial

This is a proposal, not permission to rent, top up credit or delete resources.

1. In the user's Vast account, select the official **Ubuntu Desktop (VM)**
   template from All Templates. Add the chosen SSH **public** key before VM
   creation; the VM guide says running VMs cannot have their keys edited.
   Confirm the exact template/image, host, 200 GB disk, on-demand price,
   contract end time and stopped-storage charge before renting.
2. After launch, connect through the authenticated Instance Portal and select
   Selkies. Retain the console-provided SSH command as a fallback. Change the
   template's default Linux user password interactively. The general VM guide
   describes SSH-only launch mode, while the desktop-specific guide documents
   browser services; verify both against the launched template. Do not assume
   host external ports equal guest ports.
3. In the desktop terminal, inspect `/etc/os-release`, `nvidia-smi`, `df -h`
   and `glxinfo -B` when available. A reported NVIDIA device alone does not
   prove that Unity's viewport uses it. Check the desktop graphics path and
   later the editor's own graphics-device log. Software rendering requires
   diagnosis before treating the workstation as usable.
4. Install **Unity Hub for Linux**, activate the applicable Personal license
   through Hub, and install **6000.3.23f1**. Keep installer/module selection
   small for this trial. [Linux Hub instructions](https://docs.unity.com/en-us/hub/install-hub-linux)
   and [selected editor](https://unity.com/releases/editor/whats-new/6000.3.23f1).
5. Create a fresh **Universal 3D** project under the normal user's home,
   install `com.unity.cloud.gltfast` and transfer the existing
   `out/robot-world-unity-inputs-v1.zip` plus its `.sha256` companion privately
   over SFTP/SCP. Verify with `sha256sum -c
   robot-world-unity-inputs-v1.zip.sha256`. Follow the bundle's import steps,
   substituting Linux paths for its Windows examples. Its contents are
   portable prepared inputs, not a finished Unity project.
6. Compile the loader, import and render one robot, then load the 82-frame
   session. Record the actual editor/package versions, GPU backend, errors
   and a screenshot. This proves workstation usability only; visual fidelity,
   the full scene, animation and checkpoint-02 review remain separate work.
7. Save and copy back `Assets` including `.meta` files, `Packages`,
   `ProjectSettings` and the render evidence. Confirm backup hashes. Decide
   retention explicitly: leaving the VM stopped costs storage, and destroying
   its disk loses the remote project. No deletion is performed by this guide.

The first connection can use Vast's existing portal. Tailscale is optional for
later private command/file access; the template documents integration. It is
not necessary to connect KEP, Kubernetes or the ontology graph for this trial.
The guide contains an invalid port number (`741641`); use actual console
mappings instead of copying that port list into configuration.

## Construction frontier and operational residue

| Lane | Owner | Exact affected stage | State |
|---|---|---|---|
| Product construction | Client/visual author | A2 assets, C1 session adapter | Prepared inputs exist; further local refinement remains runnable. |
| Product construction | Client/visual author | S1 scene and T1 Unity evidence | Exact dependency: a usable editor/GPU session. No runtime result yet. |
| Operational support | Environment owner with assistant | O2 workstation | Vast feasibility and offer selection prepared; rental/account scope pending. |
| Operational support | Environment owner | O2 transfer and retention | Await an actual destination, authenticated access and retention choice. |
| Deferred operational residue | Future service owners | No current prototype stage | KEP network, live agents, Kubernetes, marketplace and production hosting. |

## Open questions

- Actual user location and measured desktop latency.
- Offer still available, total charge, stopped-disk rate and exact VM image.
- Vast account, selected SSH public key and exact first-rental scope.
- Ubuntu version, KDE/GNOME compatibility, GPU rendering and Unity activation.
- Which tested connection returns project changes and evidence to this workspace.
- Retain storage between sessions or back up and request explicit destruction.
