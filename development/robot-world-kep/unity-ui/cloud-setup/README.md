# Unity research workstation setup

Prepared 2026-09-06. Scope: one individual research workstation for the Robot
World game prototype. Payments and the separate commercial initiative are
outside this setup. Provider selection, account access and paid activation are
pending. No remote machine has been created or files uploaded.

## Provider choice

Recommendation: **Shadow Power Lite for regular interactive development**, if
the UK offer and its session limits fit the user. **Shadow Neo Lite** is the
lower-cost starting point. **airgpu** is the alternative for a short hourly
experiment. This recommendation supersedes the AWS-first suggestion in
`../CLOUD-WORKSTATION.md`; that earlier proposal remains historical evidence.

| Option | Public price checked today | Fit and limitations |
|---|---|---|
| Shadow Neo Lite | GBP 25.99/month | Windows 11, RTX 2000 Ada, 16 GB RAM, 256 GB SSD. Lower-cost prototype desktop. |
| Shadow Power Lite | GBP 39.99/month | Windows 11, RTX A4500, 28 GB RAM, 256 GB SSD. More memory for Unity and asset imports. |
| airgpu T4 / L4 | From USD 0.65 / 0.90 per running hour, plus USD 14/month for 200 GB | Managed desktop. Prices vary by configuration and region; confirm the total including streaming settings at checkout. VAT excluded. |
| TensorDock | RTX 4090 advertised from USD 0.35/hour, plus selected CPU, RAM and storage | Full KVM VM and OS control. More administration; the GPU headline is not a complete workstation quote. |

Shadow Lite includes unlimited bandwidth, 120 usage hours/month, sessions up to
four hours and shutdown after 30 minutes idle. Reconnecting permits another
session, but does not remove the monthly allowance. Choose monthly billing for
this experiment; the advertised six-month prepayment is a different purchase.
Verify the actual checkout total, renewal date, location and availability before
subscribing. [UK offers](https://shadow.tech/gb/shadowpc/offers/) and
[hardware specifications](https://support.shadow.tech/hc/en-us/articles/31001157820049-Shadow-PC-Gaming-Offers-Hardware-Specifications).

airgpu advertises European locations including London. Ten hours on a T4 plus
200 GB for one month starts at USD 20.50; on an L4 it starts at USD 23. These
are arithmetic from advertised minimum prices, not all-in regional quotes.
Storage continues to consume credit while retained. Check the configured
running/stopped costs and credit policy in the account before activation.
[airgpu pricing](https://airgpu.com/).

TensorDock advertises no ingress/egress fees and root access. Host-specific
capacity and desktop setup remain unresolved. Its published policy deletes
servers when credit reaches zero, so depleted credit is not a safe retention
strategy. [TensorDock](https://www.tensordock.com/).

Paperspace was investigated, but Windows templates are unavailable to users who
joined on or after 1 July 2024. Its old desktop pricing page is not sufficient
evidence that a new account can buy that desktop.
[Current connection documentation](https://docs.digitalocean.com/products/paperspace/machines/how-to/connect/).

An ordinary CPU-only VPS could host a later headless service. It is a poor fit
for validating this project's real-time GPU rendering. Runpod's container Pods
could support later inference experiments, but require extra work to turn into
an interactive Unity workstation.
[Runpod concepts](https://docs.runpod.io/get-started/concepts).

## Ready-to-review Shadow configuration

- One Power Lite workstation, UK offer, monthly billing, advertised GBP 39.99.
- Included 256 GB disk, Windows 11 and provider streaming; no storage upgrade.
- Initial streaming target: 1920 x 1080 at 60 Hz. Adjust bitrate after checking
  latency and text legibility from the user's actual local computer.
- Unity Personal is the proposed zero-cost editor tier, subject to the user's
  eligibility. Activate through the user's Unity account in the remote desktop.
- Editor candidate: **Unity 6.3 LTS, 6000.3.23f1**, changeset **09d2ecc7fb28**,
  released 26 August 2026. This is a published release selected for installation;
  it has not been installed or tested here.
  [Official release](https://unity.com/releases/editor/whats-new/6000.3.23f1).
- Create a Universal 3D project (URP). Resolve glTFast in the Unity Package
  Manager, then retain the actual package manifest and lock file.
- First objective: a working GPU viewport and one imported robot. The complete
  visual scene remains product-construction work for checkpoint 02.

## Setup sequence after provider selection

1. On the local computer, open the selected provider's official site. Confirm
   the exact plan and purchase details in the user's own account. Account
   passwords, MFA and payment details stay in the provider's interface.
2. For Shadow, wait for activation, install its client from the account's
   Downloads page and connect. A browser session is also available at
   <https://pc.shadow.tech/>. Verify that Windows is usable before downloading
   the editor. [Provider setup guide](https://support.shadow.tech/hc/en-us/articles/32731812591633-Getting-Started-with-Shadow-PC).
3. **Inside the remote Windows desktop**, download Unity Hub from
   <https://unity.com/download>. Sign in and activate the applicable Personal
   license. Use the release page above to install **6000.3.23f1** through Hub.
   Start with the Windows editor; mobile, console and server modules are not
   required for the first scene. [Unity installation guide](https://learn.unity.com/tutorial/install-the-unity-hub-and-editor?publish=true).
4. In Hub, create **RobotWorldResearch** using **Universal 3D**, in a fresh
   remote folder such as `C:\Projects\RobotWorldResearch`. Keep enough disk
   space for Unity's imported `Library` cache. The supplied ZIP is an input
   bundle and is not itself a complete Hub project.
5. Transfer only `out/robot-world-unity-inputs-v1.zip` and its `.sha256`
   companion using the chosen private transfer method. Transfer is pending;
   this document does not expose the repository or start a sharing service.
   For browser upload support, consult the provider's current transfer UI.
   If a private network is needed, establish access to this one workstation
   before enabling remote commands.
6. Verify the ZIP's SHA-256 against the companion file, extract to a fresh
   staging folder and follow the included `IMPORT.md`. Add the Unity package
   by name **com.unity.cloud.gltfast** before importing the GLBs.
   [Official glTFast repository](https://github.com/Unity-Technologies/com.unity.cloud.gltfast/blob/main/Packages/com.unity.cloud.gltfast/README.md).
7. Check GPU rendering, compilation and fixture loading. Record the exact
   editor version, GPU/driver, graphics API, package files and logs. A blank
   desktop or a successful ZIP transfer is not a Unity rendering pass.
8. Save the project, back up the changed project inputs and evidence, and stop
   the session. Keep `Assets` including generated `.meta` files, `Packages`
   including `packages-lock.json`, and `ProjectSettings`. Cache folders can be
   recreated. Subscription renewal continues until cancelled; stopping a
   Shadow desktop does not cancel its subscription.

The provider's stream is sufficient for initial graphical access. A separate
Tailscale connection is optional for private file transfer and command access;
it is not a Unity dependency. On Shadow, preserve the provider's network route:
use split routing, no exit node, no overlapping subnet route and no default-route
replacement. Do not expose RDP or an unauthenticated shell to the internet.
[Shadow VPN guidance](https://support.shadow.tech/hc/en-us/articles/33632618785937-How-to-set-up-a-VPN-on-Shadow-PC).

## Prepared package

`package_checkpoint2.py` reads an explicit list of 45 source files: seven
version-2 GLBs, 33 texture PNGs, two C# source files, the paired session JSON and
manifest, and the approved visual reference. It adds portable import
instructions and a manifest with per-file hashes. It does not include the
repository, Git metadata, credentials, ontology graph or other initiatives.

Run from any directory:

```bash
python3 /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/robot-world-kep/unity-ui/cloud-setup/package_checkpoint2.py
```

The default prints an inventory and writes nothing. To build another package,
pass `--output` with a **new directory**. Existing output directories are never
overwritten. A changed input produces a new bundle identity; it does not amend
the approved art-direction decision.

The integrity check proves only that the selected bytes were packaged intact.
The existing session is 82 recorded frames with scripted robot policies; it
does not invoke live inference or perform financial transactions.

The prepared archive is **111,430,638 bytes** (about 111 MB). Its SHA-256 is:

```text
4931fec53e3c3a9ba2a2425c57a200f710de76f98700e834138f9436f93084b1
```

In Windows PowerShell, from the directory containing the downloaded ZIP and
its `.sha256` companion, verify it before extracting:

```powershell
$bundle = 'robot-world-unity-inputs-v1.zip'
$expected = ((Get-Content -LiteralPath "$bundle.sha256" -Raw).Trim() -split '\s+')[0]
$actual = (Get-FileHash -LiteralPath $bundle -Algorithm SHA256).Hash
if ($actual -ine $expected) { throw 'Bundle hash mismatch; do not import.' }
Write-Output 'Bundle hash matches.'
```

Local validation completed: all 47 ZIP entries were accounted for (45 selected
source files, import instructions and integrity manifest), source hashes and
ZIP contents matched, all 82 session frames including both final tick-80
revisions were preserved, and the eight checked checkpoint-01 files remained
unchanged. No Unity import, C# compilation, remote transfer or GPU render was
performed. The PowerShell example has not been executed on the future Windows
workstation.

## Work lanes and current frontier

| Lane | Owner | Exact stage / work | Status |
|---|---|---|---|
| Product construction | Client/visual author | A2 asset refinement and C1 adapter preparation | Runnable locally; existing meshes and C# source still need Unity validation. |
| Product construction | Client/visual author | S1 actual Unity scene; T1 scene evidence | Requires a usable editor/GPU session. Match the approved image, then present checkpoint 02. |
| Operational support | Environment owner with assistant | O2 provider choice, account, workstation and access | Setup inputs prepared; activation and connectivity not performed. |
| Operational support | Environment owner | O2 project transfer and local backup | Await selected workstation and private transfer destination. |
| Deferred operational residue | Future service owners | Kubernetes, KEP networking, hosting and inference endpoints | No prerequisite for this recorded game prototype. |

No product checkpoint decision, approval, release or deployment is recorded by
this setup preparation.

## Open questions

- User budget and preferred provider; the optional budget question remains open.
- Actual review location, checkout total, regional stock and activation delay.
- Provider account access and a private, verified file/command connection.
- Actual Unity import, renderer behavior, resolved package versions and
  achieved fidelity against the approved reference.
- Storage retention and whether to renew after the first experiment.
