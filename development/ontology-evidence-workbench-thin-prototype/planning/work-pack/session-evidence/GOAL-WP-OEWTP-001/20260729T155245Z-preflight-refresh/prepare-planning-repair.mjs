#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const repositoryRoot = resolve(process.cwd());
const evidenceRoot =
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/" +
  "planning/work-pack/session-evidence/GOAL-WP-OEWTP-001/" +
  "20260729T155245Z-preflight-refresh";
const planningRoot =
  "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/planning";

const targets = {
  workPack: `${planningRoot}/WORK-PACK.md`,
  executionPack: `${planningRoot}/EXECUTION-PACK.md`,
  manifest: `${planningRoot}/SWU-MANIFEST.json`,
  closeout: `${planningRoot}/CLOSEOUT-SYNC-INVENTORY.json`,
  task001: `${planningRoot}/work-pack/tasks/TASK-OEWTP-01-TYPED-ADMISSION.md`,
  task002: `${planningRoot}/work-pack/tasks/TASK-OEWTP-02-BUILD-PRODUCER.md`,
  task003: `${planningRoot}/work-pack/tasks/TASK-OEWTP-03-EVIDENCE-GATEWAY.md`,
  task004: `${planningRoot}/work-pack/tasks/TASK-OEWTP-04-BROWSER-ACCEPTANCE.md`,
  admission: `${planningRoot}/MUTATION-ADMISSION-CONTRACT.json`,
};

const baselines = new Map([
  [
    targets.workPack,
    "9b015734c24a11d76e9d900f7db5ae641d3a54e0edbd80579bd8a71e9ee2ddde",
  ],
  [
    targets.executionPack,
    "b75a36d4a0198b56985037b3c1901249ffa643c25519727204c3e20a68397f75",
  ],
  [
    targets.manifest,
    "66a9f49344e0856e51436b068284b311e5ce507c2e6cd8e6731231686cfc6cd9",
  ],
  [
    targets.closeout,
    "45df96399ee1c17d0a9925f7d78306b0f8c8b830eab7c56c6f9ef180f80eb201",
  ],
  [
    targets.task001,
    "11a118ed26e402466737eee0138e16ca874ffaeb761d8f82a7d27e4dc5f999c7",
  ],
  [
    targets.task002,
    "25955b75869a60192d4924f6a5c2aa42b919b4377fb95c0ca6cf5675d7cec565",
  ],
  [
    targets.task003,
    "50cb2b022f04826ded07ecfde7a6991c55496b415263842f352c04dfa490dd6f",
  ],
  [
    targets.task004,
    "11954abd359a7ecf25efe3c6e88db663dc3ac11afaa3a455749c6691ca4c2543",
  ],
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first === -1) {
    throw new Error(`missing replacement anchor: ${label}`);
  }
  if (source.indexOf(before, first + before.length) !== -1) {
    throw new Error(`ambiguous replacement anchor: ${label}`);
  }
  return `${source.slice(0, first)}${after}${source.slice(first + before.length)}`;
}

function readBoundTarget(path) {
  const absolute = join(repositoryRoot, path);
  if (!existsSync(absolute)) {
    throw new Error(`missing bound target: ${path}`);
  }
  const bytes = readFileSync(absolute);
  const expected = baselines.get(path);
  const actual = sha256(bytes);
  if (actual !== expected) {
    throw new Error(
      `baseline drift: ${path}: expected ${expected}, observed ${actual}`,
    );
  }
  return bytes.toString("utf8");
}

function mutationAdmissionContract() {
  const sessionPrefix =
    "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/" +
    "planning/work-pack/session-evidence/<swu-id>/<attempt-id>/materialization";
  const common = {
    staging_root: `${sessionPrefix}/staging`,
    material_package: `${sessionPrefix}/material-package.json`,
    material_receipt: `${sessionPrefix}/material-package-receipt.json`,
    mutation_admission_request: `${sessionPrefix}/mutation-admission-request.json`,
    mutation_admission_receipt: `${sessionPrefix}/mutation-admission-receipt.json`,
    package_id_template: "MP-<swu-id>-<attempt-id>",
    material_package_schema:
      ".agents/skills/invoke/schemas/material-package.schema.json",
    producer_receipt_schema:
      ".agents/skills/invoke/schemas/material-package-receipt.schema.json",
    admission_request_schema:
      ".agents/skills/task-session/schemas/mutation-admission-request.schema.json",
    admission_receipt_schema:
      ".agents/skills/task-session/schemas/mutation-admission-receipt.schema.json",
    material_validator:
      "python3 .agents/skills/invoke/scripts/material_package_validator.py " +
      "--root <staging-root> --schema-dir .agents/skills/invoke/schemas " +
      "--output <material-receipt> <material-package>",
    admission_validator:
      "python3 .agents/skills/task-session/scripts/verify-mutation-readiness.py " +
      "--repository-root <repository-root> " +
      "--request-schema .agents/skills/task-session/schemas/" +
      "mutation-admission-request.schema.json " +
      "--receipt-schema .agents/skills/task-session/schemas/" +
      "mutation-admission-receipt.schema.json " +
      "--output <admission-receipt> <admission-request>",
  };

  const implementationRoot =
    "cyberAlchemy-v2/implementation/ontology-evidence-workbench";
  const evidencePrefix =
    "cyberAlchemy-v2/development/ontology-evidence-workbench-thin-prototype/" +
    "planning/work-pack/session-evidence";

  return {
    schema_version: "oewtp.mutation-admission.v1",
    work_pack_id: "WP-OEWTP-001",
    execution_mode: "routed-mutation",
    lifecycle_owner: "task-session",
    authority_class: "private",
    publication_class: "internal",
    mutation_authorized: false,
    common_paths: common,
    common_rules: {
      prewrite_sequence: [
        "Bind one collision-resistant attempt ID and all live baselines.",
        "Build a strict runtime Context Builder handoff pack.",
        "Produce only proposed canonical material bytes under staging_root.",
        "Construct and validate the Invoke material package.",
        "Construct and validate the Task Session mutation-admission request.",
        "Require patchVerdict=pass, mutationHandoff=ready, empty reasons, admissionVerdict=admit, and mutationReady=true.",
        "Apply only material_write_scope bytes to canonical targets.",
        "Run live validation, then write only execution_output_inventory.",
      ],
      material_scope_rule:
        "allowedWrites equals the material package change targets, target " +
        "inventory, and validated paths. Generated run artifacts and Task " +
        "Session receipts are execution outputs, not material change targets.",
      execution_output_rule:
        "Execution outputs remain in the parent SWU write scope, are " +
        "collision-checked and baseline-bound, and may be written only after " +
        "material admission and live validation reach their declared phase.",
      source_receipt_rule:
        "The terminal Task Session receipt is written after live validation; " +
        "it is never staged as a material source mutation.",
      approval_rule:
        "The material package uses explicit-apply approval owned by " +
        "task-session and bound to exactly the material_write_scope. Planning " +
        "approval and a proposal receipt do not satisfy this rule.",
      package_boundary_rule:
        "Capture the live repository package-manifest path and byte inventory " +
        "before staging and after validation; reject every delta.",
      staging_rule:
        "Staging is session evidence, never a package root or authority " +
        "projection. Reject collisions, symlinks, traversal, overwrite, or " +
        "paths outside the bound attempt.",
      cleanup_rule:
        "Preserve material, admission, source, owner, and continuity receipts. " +
        "Delete only task-owned scratch roots after their absence is verified.",
    },
    swus: [
      {
        swu_id: "SWU-OEWTP-001",
        task_id: "TASK-OEWTP-01-TYPED-ADMISSION",
        dependencies: [],
        material_write_scope: [
          `${implementationRoot}/upstream/overlay/packages/dashboard/src/oew/types.ts`,
          `${implementationRoot}/upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts`,
          `${implementationRoot}/upstream/overlay/packages/dashboard/src/oew/store.ts`,
          `${implementationRoot}/upstream/overlay/overlay-manifest.json`,
          `${implementationRoot}/upstream/overlay/first-working-version-manifest.json`,
        ],
        execution_output_inventory: [
          `${implementationRoot}/generated/runs/SWU-OEWTP-001/<attempt-id>/typed-admission.json`,
          `${evidencePrefix}/SWU-OEWTP-001/<attempt-id>/receipt.json`,
        ],
        validation_commands: [
          "node --test test/ui-store.test.mjs test/trust-rail.test.mjs " +
            "test/evidence-inspector.test.mjs test/view-parity.test.mjs " +
            "test/navigation.test.mjs test/poker-tour.test.mjs " +
            "test/responsive.test.mjs",
          "pnpm --dir <fresh-root> --filter @understand-anything/dashboard " +
            "exec vitest run src/oew/EvidenceInspector.test.tsx " +
            "src/oew/PokerTour.test.tsx src/oew/TrustRail.test.tsx " +
            "src/oew/navigation.test.tsx src/oew/responsive.test.tsx " +
            "src/oew/viewParity.test.ts",
          "pnpm --dir <fresh-root> --filter @understand-anything/dashboard " +
            "exec tsc -b --pretty false",
        ],
      },
      {
        swu_id: "SWU-OEWTP-002",
        task_id: "TASK-OEWTP-02-BUILD-PRODUCER",
        dependencies: ["SWU-OEWTP-001"],
        material_write_scope: [
          `${implementationRoot}/scripts/build-thin-prototype.mjs`,
          `${implementationRoot}/contracts/thin-prototype-build-handle.schema.json`,
          `${implementationRoot}/test/thin-prototype-build.test.mjs`,
        ],
        execution_output_inventory: [
          `${implementationRoot}/generated/runs/SWU-OEWTP-002/<attempt-id>/dashboard-dist/`,
          `${implementationRoot}/generated/runs/SWU-OEWTP-002/<attempt-id>/thin-prototype-build-handle.json`,
          `${evidencePrefix}/SWU-OEWTP-002/<attempt-id>/receipt.json`,
        ],
        validation_commands: [
          "node --test test/thin-prototype-build.test.mjs",
          "node scripts/build-thin-prototype.mjs build " +
            "--typed-receipt <swu-001-receipt> --output <build-handle>",
        ],
      },
      {
        swu_id: "SWU-OEWTP-003",
        task_id: "TASK-OEWTP-03-EVIDENCE-GATEWAY",
        dependencies: ["SWU-OEWTP-002"],
        material_write_scope: [
          `${implementationRoot}/scripts/serve-oew-prototype.mjs`,
          `${implementationRoot}/contracts/oew-prototype-gateway-handle.schema.json`,
          `${implementationRoot}/test/oew-prototype-gateway.test.mjs`,
        ],
        execution_output_inventory: [
          `${implementationRoot}/generated/runs/SWU-OEWTP-003/<attempt-id>/gateway-handle.json`,
          `${evidencePrefix}/SWU-OEWTP-003/<attempt-id>/receipt.json`,
        ],
        validation_commands: [
          "node --test test/oew-prototype-gateway.test.mjs",
        ],
      },
      {
        swu_id: "SWU-OEWTP-004",
        task_id: "TASK-OEWTP-04-BROWSER-ACCEPTANCE",
        dependencies: ["SWU-OEWTP-003"],
        material_write_scope: [
          `${implementationRoot}/test/browser-acceptance.test.mjs`,
          `${implementationRoot}/contracts/browser-acceptance.schema.json`,
        ],
        execution_output_inventory: [
          `${implementationRoot}/generated/runs/SWU-OEWTP-004/<attempt-id>/gateway-runtime.json`,
          `${implementationRoot}/generated/runs/SWU-OEWTP-004/<attempt-id>/browser-acceptance.json`,
          `${implementationRoot}/generated/runs/SWU-OEWTP-004/<attempt-id>/request-ledger.json`,
          `${implementationRoot}/generated/runs/SWU-OEWTP-004/<attempt-id>/console-ledger.json`,
          `${implementationRoot}/generated/runs/SWU-OEWTP-004/<attempt-id>/browser-witness.png`,
          `${evidencePrefix}/SWU-OEWTP-004/<attempt-id>/receipt.json`,
        ],
        validation_commands: [
          "command -v playwright && playwright --version && " +
            "npm list -g --depth=0 playwright && playwright install --list",
          "node --test test/browser-acceptance.test.mjs",
        ],
      },
    ],
  };
}

function transformCloseout(source) {
  const document = JSON.parse(source);
  const commonRules = {
    ...document.common_rules,
    execution_ownership:
      "Task Session applies only admitted material_write_scope bytes, then " +
      "writes only the expanded execution_output_inventory. Invoke Refresh " +
      "reads immutable terminal evidence and writes only " +
      "declared_target_inventory.",
    allowed_delta_classes: [
      "evidence_added",
      "blocker_opened",
      "blocker_resolved",
      "status_changed",
      "route_changed",
    ],
    owner_validation: [
      document.common_rules.owner_validation[0],
      {
        cwd: "<repository-root>",
        command:
          "python3 -m json.tool cyberAlchemy-v2/development/" +
          "ontology-evidence-workbench-thin-prototype/planning/" +
          "MUTATION-ADMISSION-CONTRACT.json",
      },
      ...document.common_rules.owner_validation.slice(1),
    ],
    expected_owner_receipt_contract: {
      capability_ref: "invoke:refresh",
      mutation_mode: "apply-approved",
      phase_status: ["pass", "no-op"],
      required_fields: [
        "dispatch_id",
        "step_id",
        "capability_ref",
        "status",
        "validation",
        "blockers",
        "handoff_note",
        "residue",
      ],
      required_bindings: [
        "source receipt",
        "target inventory",
        "live target baselines",
        "admitted delta classes",
        "validation commands",
        "expected owner receipt path",
        "unique successor or terminal verification route",
      ],
      write_result:
        "phaseStatus=pass, mutationMode=apply-approved, mutationReady=true, " +
        "empty refresh-authoring/apply blockers, and owner validation pass",
      no_op_result:
        "phaseStatus=no-op with receipt-backed proof that every target already " +
        "represents the terminal source receipt",
    },
  };

  return stableJson({
    schema_version: "oewtp.task-session-closeout.v2",
    work_pack_id: document.work_pack_id,
    mutation_admission_contract: "MUTATION-ADMISSION-CONTRACT.json",
    lifecycle_owner_route: "invoke:refresh:apply-approved",
    authorization_ceiling: "closeout-only",
    common_rules: commonRules,
    swus: document.swus,
  });
}

function transformManifest(source) {
  const document = JSON.parse(source);
  return stableJson({
    schema_version: "oewtp.swu-manifest.v2",
    work_pack_id: document.work_pack_id,
    status: document.status,
    selected_swu: document.selected_swu,
    mutation_authorized: false,
    mutation_admission_contract: "MUTATION-ADMISSION-CONTRACT.json",
    selection_reason: document.selection_reason,
    source_design_result: document.source_design_result,
    swus: document.swus.map((swu) => ({
      ...swu,
      mutation_admission_profile: swu.swu_id,
    })),
  });
}

function transformWorkPack(source) {
  let output = replaceOnce(
    source,
    "| closeoutSyncStatus | pass | Exact inventory in [CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json) |",
    "| mutationAdmissionStatus | pass-by-contract | Exact pre-write split in [MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json); live admission remains per attempt |\n" +
      "| closeoutSyncStatus | pass-by-contract | Exact post-run inventory in [CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json); live owner join remains per attempt |",
    "work-pack control admission rows",
  );
  output = replaceOnce(
    output,
    "## Task Session closeout synchronization\n\nEvery mutation-capable SWU has a closed row in\n[CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json), including:",
    "## Task Session mutation admission and closeout synchronization\n\n" +
      "Every mutation-capable SWU first uses\n" +
      "[MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json) " +
      "to separate exact staged canonical material bytes from generated run and\n" +
      "Task Session evidence outputs. Material validation and Task Session\n" +
      "admission must pass before any canonical source write. Planning keeps\n" +
      "`mutation_authorized=false`; each attempt binds its own approval, bytes,\n" +
      "digests, dependencies, validation surface, and admission receipt.\n\n" +
      "Every mutation-capable SWU then has a closed row in\n" +
      "[CLOSEOUT-SYNC-INVENTORY.json](CLOSEOUT-SYNC-INVENTORY.json), including:",
    "work-pack mutation admission section",
  );
  output = replaceOnce(
    output,
    "6. Exact closeout synchronization: pass.",
    "6. Exact staged material admission and closeout synchronization: pass by contract; live receipts remain per attempt.",
    "work-pack gate six",
  );
  output = replaceOnce(
    output,
    "| 2026-07-29 | Distill repaired retained-output, token, closeout, Playwright, UX, and composed relative-URL gaps; final pass | Invoke + bounded Balancer |",
    "| 2026-07-29 | Distill repaired retained-output, token, closeout, Playwright, UX, and composed relative-URL gaps; final pass | Invoke + bounded Balancer |\n" +
      "| 2026-07-29 | Refresh repaired the installed material-admission and exact closeout contract split without authorizing implementation | Invoke Refresh |",
    "work-pack change log",
  );
  return output;
}

function transformExecutionPack(source) {
  let output = replaceOnce(
    source,
    "| workPackManifest | [SWU-MANIFEST.json](SWU-MANIFEST.json) |",
    "| workPackManifest | [SWU-MANIFEST.json](SWU-MANIFEST.json) |\n" +
      "| mutationAdmissionContract | [MUTATION-ADMISSION-CONTRACT.json](MUTATION-ADMISSION-CONTRACT.json) |",
    "execution-pack admission control",
  );
  output = replaceOnce(
    output,
    "| [W0](work-pack/waves/W0-ADMISSION.md) | L0 entry | is one SWU mutation-ready? | SWU-001 preflight | Plan validators pass | strict context/preflight receipt |",
    "| [W0](work-pack/waves/W0-ADMISSION.md) | L0 entry | is one SWU mutation-ready? | selected SWU preflight | Plan validators pass | strict context pack, material receipt, and mutation-admission receipt |",
    "execution-pack W0",
  );
  output = replaceOnce(
    output,
    "Every selected successor repeats W0 Task Session admission and receives a new\nattempt ID. Read-only review may begin only after the required terminal receipt\nexists.",
    "Every selected successor repeats W0 Task Session admission and receives a new\n" +
      "attempt ID. W0 stages and validates only canonical material writes; generated\n" +
      "run artifacts and the terminal Task Session receipt remain separately bound\n" +
      "execution outputs written after material apply and live validation. Read-only\n" +
      "review may begin only after the required terminal receipt exists.",
    "execution-pack ordering",
  );
  return output;
}

function admissionSection(swuId, materialCount, outputCount) {
  return (
    "### Mutation admission\n\n" +
    `Profile \`${swuId}\` in ` +
    "[MUTATION-ADMISSION-CONTRACT.json](../../MUTATION-ADMISSION-CONTRACT.json) " +
    `classifies ${materialCount} canonical file target` +
    `${materialCount === 1 ? "" : "s"} as \`material_write_scope\` and ` +
    `${outputCount} generated/session target` +
    `${outputCount === 1 ? "" : "s"} as \`execution_output_inventory\`. ` +
    "W0 must stage and validate the material files, then require both the Invoke\n" +
    "material receipt and Task Session mutation-admission receipt to pass before\n" +
    "canonical apply. Generated outputs and the terminal Task Session receipt are\n" +
    "not material change targets; they are collision-checked execution evidence\n" +
    "written only after apply and live validation. No planning receipt grants this\n" +
    "per-attempt admission.\n\n"
  );
}

function transformTask001(source) {
  return replaceOnce(
    source,
    "replace `<attempt-id>` with one concrete collision-free value before mutation.\n\n### Implementation detail",
    "replace `<attempt-id>` with one concrete collision-free value before mutation.\n\n" +
      admissionSection("SWU-OEWTP-001", 5, 2) +
      "### Implementation detail",
    "task 001 admission",
  );
}

function transformTask002(source) {
  return replaceOnce(
    source,
    "before mutation. `package.json` remains unchanged; Task Session invokes the\nscript directly.\n\n### Input/output model",
    "before mutation. `package.json` remains unchanged; Task Session invokes the\n" +
      "script directly.\n\n" +
      admissionSection("SWU-OEWTP-002", 3, 3) +
      "### Input/output model",
    "task 002 admission",
  );
}

function transformTask003(source) {
  return replaceOnce(
    source,
    "when their ownership and semantics remain clear; do not turn it into a generic\nserver framework.\n\n### Algorithm",
    "when their ownership and semantics remain clear; do not turn it into a generic\n" +
      "server framework.\n\n" +
      admissionSection("SWU-OEWTP-003", 3, 2) +
      "### Algorithm",
    "task 003 admission",
  );
}

function transformTask004(source) {
  return replaceOnce(
    source,
    "edit `package.json`; the existing `test:browser` declaration already points to\nthe planned test path.\n\n### Browser binding",
    "edit `package.json`; the existing `test:browser` declaration already points to\n" +
      "the planned test path.\n\n" +
      admissionSection("SWU-OEWTP-004", 2, 6) +
      "### Browser binding",
    "task 004 admission",
  );
}

function buildOutputs() {
  if (existsSync(join(repositoryRoot, targets.admission))) {
    throw new Error(`new target already exists: ${targets.admission}`);
  }
  const outputs = new Map([
    [targets.workPack, transformWorkPack(readBoundTarget(targets.workPack))],
    [
      targets.executionPack,
      transformExecutionPack(readBoundTarget(targets.executionPack)),
    ],
    [targets.manifest, transformManifest(readBoundTarget(targets.manifest))],
    [targets.closeout, transformCloseout(readBoundTarget(targets.closeout))],
    [targets.task001, transformTask001(readBoundTarget(targets.task001))],
    [targets.task002, transformTask002(readBoundTarget(targets.task002))],
    [targets.task003, transformTask003(readBoundTarget(targets.task003))],
    [targets.task004, transformTask004(readBoundTarget(targets.task004))],
    [targets.admission, stableJson(mutationAdmissionContract())],
  ]);

  for (const [path, content] of outputs) {
    if (path.endsWith(".json")) {
      JSON.parse(content);
    }
    if (content.includes("\r")) {
      throw new Error(`non-LF output: ${path}`);
    }
  }
  return outputs;
}

function sameSet(left, right) {
  return (
    left.size === right.size &&
    [...left].every((item) => right.has(item))
  );
}

function validateSemanticOutputs(outputs) {
  const manifest = JSON.parse(outputs.get(targets.manifest));
  const closeout = JSON.parse(outputs.get(targets.closeout));
  const admission = JSON.parse(outputs.get(targets.admission));
  const invariants = [];

  if (manifest.mutation_authorized !== false) {
    throw new Error("manifest mutation_authorized must remain false");
  }
  invariants.push("manifest mutation_authorized remains false");

  if (
    manifest.mutation_admission_contract !==
      "MUTATION-ADMISSION-CONTRACT.json" ||
    closeout.mutation_admission_contract !==
      "MUTATION-ADMISSION-CONTRACT.json"
  ) {
    throw new Error("mutation-admission contract reference mismatch");
  }
  invariants.push("manifest and closeout reference one admission contract");

  if (closeout.lifecycle_owner_route !== "invoke:refresh:apply-approved") {
    throw new Error("closeout route mismatch");
  }
  if (closeout.authorization_ceiling !== "closeout-only") {
    throw new Error("closeout authorization ceiling mismatch");
  }
  const admittedDeltas = new Set([
    "evidence_added",
    "blocker_opened",
    "blocker_resolved",
    "status_changed",
    "route_changed",
  ]);
  if (
    !sameSet(
      new Set(closeout.common_rules.allowed_delta_classes),
      admittedDeltas,
    )
  ) {
    throw new Error("closeout delta allowlist mismatch");
  }
  invariants.push("closeout route, ceiling, and delta allowlist are exact");

  const manifestById = new Map(
    manifest.swus.map((swu) => [swu.swu_id, swu]),
  );
  const closeoutById = new Map(
    closeout.swus.map((swu) => [swu.swu_id, swu]),
  );

  for (const profile of admission.swus) {
    const manifestSwu = manifestById.get(profile.swu_id);
    const closeoutSwu = closeoutById.get(profile.swu_id);
    if (!manifestSwu || !closeoutSwu) {
      throw new Error(`missing recomposition input: ${profile.swu_id}`);
    }
    if (manifestSwu.mutation_admission_profile !== profile.swu_id) {
      throw new Error(`profile reference mismatch: ${profile.swu_id}`);
    }

    const material = new Set(profile.material_write_scope);
    const execution = new Set(profile.execution_output_inventory);
    const overlap = [...material].filter((path) => execution.has(path));
    if (overlap.length > 0) {
      throw new Error(
        `material/execution overlap: ${profile.swu_id}: ${overlap.join(", ")}`,
      );
    }
    const recomposed = new Set([...material, ...execution]);
    if (!sameSet(recomposed, new Set(manifestSwu.write_scope))) {
      throw new Error(`write-scope recomposition mismatch: ${profile.swu_id}`);
    }
    if (
      !sameSet(
        execution,
        new Set(closeoutSwu.execution_output_inventory),
      )
    ) {
      throw new Error(
        `execution/closeout inventory mismatch: ${profile.swu_id}`,
      );
    }
    if (
      [...material].some(
        (path) =>
          path.endsWith("/package.json") ||
          path.includes(
            "cyberAlchemy-v2/development/ontology-evidence-workbench/",
          ),
      )
    ) {
      throw new Error(`forbidden material target: ${profile.swu_id}`);
    }
    invariants.push(
      `${profile.swu_id} material and execution partitions are disjoint and recompose exactly`,
    );
  }

  for (const schemaPath of [
    admission.common_paths.material_package_schema,
    admission.common_paths.producer_receipt_schema,
    admission.common_paths.admission_request_schema,
    admission.common_paths.admission_receipt_schema,
  ]) {
    if (!existsSync(join(repositoryRoot, schemaPath))) {
      throw new Error(`missing installed schema: ${schemaPath}`);
    }
  }
  invariants.push("all installed producer and consumer schemas exist");

  for (const path of outputs.keys()) {
    if (
      path.endsWith("/package.json") ||
      path.includes(
        "cyberAlchemy-v2/development/ontology-evidence-workbench/",
      )
    ) {
      throw new Error(`forbidden repair target: ${path}`);
    }
  }
  invariants.push("repair targets contain no package or old-development path");

  return invariants;
}

function approvalScope() {
  return Object.values(targets).sort();
}

const forbiddenApprovalScopes = [
  "authority and promotion",
  "cyberAlchemy-v2/development/ontology-evidence-workbench/**",
  "cyberAlchemy-v2/implementation/ontology-evidence-workbench/**",
  "package manifests and lockfiles",
  "publication and deployment",
  "release and production",
].sort();

const approvalClaimCeiling =
  "Planning runtime-contract repair only; no implementation mutation, SWU " +
  "completion, browser witness, promotion, release, deployment, or " +
  "production authority.";

function validateApproval(path) {
  const absolute = resolve(repositoryRoot, path);
  const approval = JSON.parse(readFileSync(absolute, "utf8"));
  const allowedKeys = new Set([
    "schema_version",
    "decision",
    "route",
    "authorized_by",
    "authorization_source",
    "scope_paths",
    "authority_class",
    "publication_class",
    "forbidden_scopes",
    "claim_ceiling",
  ]);
  const unexpectedKeys = Object.keys(approval).filter(
    (key) => !allowedKeys.has(key),
  );
  if (unexpectedKeys.length > 0) {
    throw new Error(`unexpected approval fields: ${unexpectedKeys.join(", ")}`);
  }
  if (approval.schema_version !== "oewtp.planning-repair-approval.v1") {
    throw new Error("approval schema version mismatch");
  }
  if (approval.decision !== "approved") {
    throw new Error("approval decision is not approved");
  }
  if (approval.route !== "invoke:refresh:apply-approved") {
    throw new Error("approval route mismatch");
  }
  if (approval.authorized_by !== "human-prototype-owner") {
    throw new Error("approval owner mismatch");
  }
  if (
    typeof approval.authorization_source !== "string" ||
    approval.authorization_source.length === 0
  ) {
    throw new Error("approval source is missing");
  }
  if (
    approval.authority_class !== "private" ||
    approval.publication_class !== "internal"
  ) {
    throw new Error("approval authority/publication boundary mismatch");
  }
  const observed = [...approval.scope_paths].sort();
  const expected = approvalScope();
  if (JSON.stringify(observed) !== JSON.stringify(expected)) {
    throw new Error("approval scope mismatch");
  }
  const forbidden = [...approval.forbidden_scopes].sort();
  if (JSON.stringify(forbidden) !== JSON.stringify(forbiddenApprovalScopes)) {
    throw new Error("approval forbidden-scope mismatch");
  }
  if (approval.claim_ceiling !== approvalClaimCeiling) {
    throw new Error("approval claim ceiling mismatch");
  }
  return {
    path: relative(repositoryRoot, absolute),
    sha256: sha256(readFileSync(absolute)),
  };
}

function validateStageRoot(rawPath) {
  if (!rawPath) {
    throw new Error("--stage requires a path");
  }
  const absolute = resolve(repositoryRoot, rawPath);
  const allowedRoot = resolve(repositoryRoot, evidenceRoot, "apply-approved");
  if (
    absolute !== allowedRoot &&
    !absolute.startsWith(`${allowedRoot}${sep}`)
  ) {
    throw new Error(`stage root must be below ${relative(repositoryRoot, allowedRoot)}`);
  }
  if (existsSync(absolute)) {
    throw new Error(`stage root already exists: ${relative(repositoryRoot, absolute)}`);
  }
  return absolute;
}

function report(mode, outputs, semanticInvariants, extra = {}) {
  return {
    schema_version: "oewtp.planning-repair-check.v1",
    result: "pass",
    mode,
    source_baselines: [...baselines].map(([path, digest]) => ({
      path,
      sha256: digest,
    })),
    proposed_targets: [...outputs].map(([path, content]) => ({
      path,
      operation: baselines.has(path) ? "update" : "create",
      sha256: sha256(Buffer.from(content)),
      size_bytes: Buffer.byteLength(content),
    })),
    package_manifest_paths_changed: false,
    canonical_targets_written: false,
    semantic_invariants: semanticInvariants,
    approval_schema: `${evidenceRoot}/approval-record.schema.json`,
    ...extra,
  };
}

const args = process.argv.slice(2);
const mode = args[0] ?? "--check";
const outputs = buildOutputs();
const semanticInvariants = validateSemanticOutputs(outputs);

if (mode === "--check") {
  process.stdout.write(stableJson(report("check", outputs, semanticInvariants)));
} else if (mode === "--stage") {
  const stageRoot = validateStageRoot(args[1]);
  const approvalIndex = args.indexOf("--approval");
  if (approvalIndex === -1 || !args[approvalIndex + 1]) {
    throw new Error("--stage requires --approval <approval-record.json>");
  }
  const approval = validateApproval(args[approvalIndex + 1]);
  for (const [path, content] of outputs) {
    const destination = join(stageRoot, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content, { flag: "wx" });
  }
  process.stdout.write(
    stableJson(
      report("stage", outputs, semanticInvariants, {
        stage_root: relative(repositoryRoot, stageRoot),
        approval,
      }),
    ),
  );
} else {
  throw new Error("usage: prepare-planning-repair.mjs [--check | --stage <path> --approval <record>]");
}
