# Colony presentation, UI 002

Product construction: improve W1, the Godot observation client, using the previously generated concept and asset gallery. The reference combines ivory shells, muted mineral accents, dark machinery, warm ground and soft lighting. The current GLBs have simpler geometry than the concept illustration. This candidate adds a dressed environment and a coherent interface around those real meshes.

The product journey is: enter Workshop Valley, watch a recorded construction cycle, select a robot to inspect its current cargo and energy, and inspect the two contributed capability artifacts. World state, movement and counts come from the existing replay. Decorative scenery has no simulation effect. The observation/control scaffold consists of WorldView, AgentSelection, ReplayCursor and CatalogView; it introduces no ontology or permission changes. Implementation uses a separate Godot presentation scene, environment builder and HUD, with the existing replay and catalog as its concrete inputs.

The UI uses a warm neutral canvas, cream cards, dark teal typography, ochre activity accents and a quieter playback bar. Primary actions are play/pause, agent selection, timeline scrubbing, speed selection, camera orbit/zoom and catalog inspection. Infrastructure details belong in the README; the in-game view identifies the session as a recorded replay.

Runnable construction is scene composition, material tuning and interaction validation. Operational-support work has no affected product stage in this pass; networking, hosting and deployment remain deferred to their existing owners in PLAN.md. No operational prerequisite blocks this UI work.

Validation covers real Godot startup and rendering, selected-agent controls, timeline/speed/pause behavior, catalog panel data, and small-window layout. The previous exact candidate is preserved in `evidence/ui-002/baseline/`; `evidence/epoch-001/` remains historical evidence for that original candidate. New visual evidence belongs to `evidence/ui-002/`.

References: the previously generated `robot-colony-assets/previews/concept-art.png` and `asset-gallery.png` in this task's visualization directory. Engine constraints were checked against [Godot 4.5 environment documentation](https://docs.godotengine.org/en/4.5/tutorials/3d/environment_and_post_processing.html). Compatibility rendering is retained for the current local environment; procedural surface shading and contact shadows supplement the existing lights.

Open questions: [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md). Further mesh detailing and authored PBR texture sets are a later art pass if the illustrated concept is selected as the final fidelity target.

## Engine direction raised during this pass

The user asked whether Unity is a better fit. The recommendation for the fuller 3D product is to evaluate Unity 6 with URP as the next client, keeping ARE, RWO, KEP and ontology services outside the engine. Godot was used to make the initial local loop and visual prototype concrete quickly. It is not a requirement of the protocol architecture.

Unity's [2026 rendering strategy](https://unity.com/topics/render-pipelines-strategy-for-2026) prioritizes URP. Its [ML-Agents toolkit](https://unity-technologies.github.io/ml-agents/ML-Agents-Overview/) provides learning environments and a Python interface; its [inference documentation](https://unity-technologies.github.io/ml-agents/Inference-Engine/) distinguishes toolkit-trained models from arbitrary externally trained models, which should use the inference library directly. Participant-hosted inference would still use our external adapter contracts; ML-Agents is an optional experiment/training tool.

Existing GLBs, replay data, capability artifacts and JSON contracts can be reused. Scene composition, shaders, HUD and interaction code need a Unity implementation and fresh visual validation. The concept illustration still requires more detailed meshes and material authoring whichever engine is selected. This pass does not install or migrate to Unity, select a Unity hosting service, or change protocol ownership.
