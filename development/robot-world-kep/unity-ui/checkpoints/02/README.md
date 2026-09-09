# Checkpoint 02 preparation — not ready for user scene review

Checkpoint 01 was validated by the user's message “yes it shold match this”. The immutable decision receipt is [decision-v1.json](../01/decision-v1.json). Its scope is to match the approved visual direction in the real Unity scene.

## Product construction

- **A2 asset preparation:** seven new source meshes were authored in Blender, followed by a second material/scenery pass. Version 2 adds procedural base-color, roughness and normal maps and combines static meshes by material. Editable Blender source and both revisions remain available. These are preparation assets; matching the approved concept in Unity is still unvalidated.
- **C1 adapter prototype:** the selected 82-frame demo is projected without dropping the distinct final same-tick revision. Six Python boundary tests pass. C# data/loader sources are authored, with Unity compilation and serialization checks pending.
- **S1/T1 Unity scene and validation:** Unity `6000.3.23f1` is installed on the user's Vast VM and its executable version check passes. Account sign-in and license activation remain pending before project creation, compilation and rendering. No Unity scene, package lock, scene screenshot, animation clip or checkpoint 02 candidate is claimed.

The seven original GLBs remain unchanged and were copied into `unity/Assets/RobotWorld/Models/Original/`. New asset revisions live beside them. The checkpoint 01 image, prompt, plan and manifest remain unchanged.

The inspected version 2 Blender previews still fall short of the approved concept: robot bodies remain more box-shaped, workshop contents are sparse, terrain has conspicuous facets and repeated surface patterns, and the lighting/material response needs a real-time art pass. These differences are outstanding work, not an accepted simplification of the target. Asset preparation does not mark A2's visual-fidelity criterion complete.

## Operational support

O1's historical local inspection found no Unity installation in the checked standard locations. C: and D: lacked space for a new editor installation. Windows executable launch failed with `Exec format error`, so the local Windows GPU was not evaluable. Details and measured free space are in [environment-v1.json](environment-v1.json). The user subsequently supplied Vast instance `50043105` as the installation destination.

O2 now has an installed native Linux editor, Unity Hub and GNOME/X11 desktop on that VM. OpenGL reports direct NVIDIA RTX 4060 Ti rendering; the desktop is 1920×1080. The selected input ZIP transferred and extracted with matching hashes. SSH-tunneled desktop HTTP checks pass from both Linux and Windows, and the WebSocket/RFB handshake passes. The user reported a browser-opening error; external-browser confirmation and user-owned Unity activation remain pending. See [the exact setup and reconnect instructions](../../cloud-setup/INSTANCE-50043105.md).

O2 belongs to the environment owner and activation is the remaining exact prerequisite for Unity import, compilation and rendering. This does not block asset and adapter preparation. KEP networking, Kubernetes, production hosting and live agent connections remain deferred; none is a dependency of this checkpoint.

## Next runnable batch after Unity activation

1. Locate the installed editor in Hub if necessary, create a Universal 3D project and resolve the exact Unity 6/URP/glTFast combination. Record the actual package versions, editor GPU log and output path. No package lock is fabricated in advance.
2. Create the project and import the seven version 2 models plus the paired demo session. Test the C# serializer against all fixture frames and the invalid-input cases.
3. Build the real URP scene, tune materials and lighting against checkpoint 01, add camera and replay motion, and fix any import or fidelity gaps.
4. Capture the actual Unity full view, robot/workshop close-ups and movement clip. Only then present checkpoint 02 for the user's validation.

Open questions: Q-UI2 and Q-UI3 in [PLAN.md](../../PLAN.md). Blender previews in `preparation/` must always be identified as Blender preparation renders, never Unity evidence.
