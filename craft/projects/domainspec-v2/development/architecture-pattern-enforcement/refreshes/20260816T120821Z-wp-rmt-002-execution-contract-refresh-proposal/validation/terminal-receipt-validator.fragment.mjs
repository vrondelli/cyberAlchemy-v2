const rawPathCompare = (left, right) => Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
const pathWithin = (root, candidate) => {
  const child = relative(root, candidate);
  return child === "" || (!isAbsolute(child) && child !== ".." && !child.startsWith(`..${sep}`));
};
const validateRelativeMaterialPath = (raw, code) => {
  if (typeof raw !== "string" || raw.length === 0 || raw.startsWith("/") || raw.includes("\\")) fail(code, String(raw));
  const parts = raw.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) fail(code, raw);
  return parts;
};
const repoRootStat = lstatSync(repoRoot, { bigint: true });
if (!repoRootStat.isDirectory() || repoRootStat.isSymbolicLink()) fail("WP_TERMINAL_RECEIPT_REPOSITORY_ROOT", repoRoot);
const repoRootReal = realpathSync(repoRoot);
const inspectRepoPath = (raw, code) => {
  const parts = validateRelativeMaterialPath(raw.endsWith("/") ? raw.slice(0, -1) : raw, code);
  const candidate = resolve(repoRoot, ...parts);
  if (!pathWithin(repoRoot, candidate)) fail(`${code}_LEXICAL_ESCAPE`, raw);
  let current = repoRoot;
  for (const part of parts) {
    current = join(current, part);
    if (!lstatExists(current)) return { exists: false, path: candidate, relative_path: raw };
    const stat = lstatSync(current, { bigint: true });
    if (stat.isSymbolicLink()) fail(`${code}_SYMLINK`, raw);
    const real = realpathSync(current);
    if (!pathWithin(repoRootReal, real)) fail(`${code}_REALPATH_ESCAPE`, raw);
  }
  return {
    exists: true,
    path: candidate,
    relative_path: raw,
    stat: lstatSync(candidate, { bigint: true }),
  };
};
const commandExecutable = (command) => {
  let index = command.argv[0] === "env" ? 1 : 0;
  while (command.argv[0] === "env" && index < command.argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(command.argv[index])) index += 1;
  return command.argv[index];
};
const canonicalValue = (value) => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
};
const canonicalHash = (value) => sha256(Buffer.from(JSON.stringify(canonicalValue(value)), "utf8"));
const exactArtifactRef = (ref, code) => {
  exactKeys(ref, ["path","sha256","size_bytes"], `${code}_SHAPE`);
  if (typeof ref.path !== "string" || typeof ref.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(ref.sha256) || !Number.isInteger(ref.size_bytes) || ref.size_bytes < 0) fail(`${code}_SHAPE`, String(ref?.path));
  const inspected = inspectRepoPath(ref.path, code);
  if (!inspected.exists || !inspected.stat.isFile() || inspected.stat.isSymbolicLink()) fail(`${code}_FILE`, ref.path);
  const bytes = read(inspected.path);
  if (bytes.length !== ref.size_bytes || sha256(bytes) !== ref.sha256) fail(`${code}_STALE`, ref.path);
  return { inspected, bytes };
};
const exactJsonRef = (ref, code) => {
  const artifact = exactArtifactRef(ref, code);
  try {
    return { ...artifact, value: JSON.parse(artifact.bytes.toString("utf8")) };
  } catch (error) {
    fail(`${code}_JSON`, error.message);
  }
};
const refsEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const projectedValidationCommands = (contract) => contract.validation_contracts.map((command) => ({
  command_id: command.command_id,
  argv: command.argv,
  cwd: command.cwd,
  timeout_seconds: command.timeout_seconds,
  max_output_bytes: command.max_output_bytes,
}));
const validateExecutionContext = (receipt, contract) => {
  const contextArtifact = exactJsonRef(receipt.execution_context_ref, "WP_TERMINAL_RECEIPT_CONTEXT_REF");
  const context = contextArtifact.value;
  exactKeys(context, ["schema_version","profile","work_pack_id","task_id","swu_id","selected_unit","run_id","attempt_id","repository_root_realpath","material_root","repository_identity_ref","attempt_root","attempt_root_ref","current_run_ref","execution_ticket_ref","selection_receipt_ref","mutation_admission_receipt_ref","plan_semantic_manifest_ref","plan_epoch_id","unit_contract_digest","plan_manifest_digest","validation_contract_digest","target_baseline_digest","execution_output_prestate_ref","execution_output_prestate_digest","consumed_admission","authority_effect"], "WP_TERMINAL_RECEIPT_CONTEXT_SHAPE");
  if (context.schema_version !== "domainspec.wp-rmt-002-execution-context/v1" || context.profile !== "plan-once-selected-unit" || context.work_pack_id !== "WP-RMT-002" || context.task_id !== contract.task_id || context.swu_id !== contract.swu_id || context.selected_unit !== contract.swu_id || context.authority_effect !== "none") fail("WP_TERMINAL_RECEIPT_CONTEXT_IDENTITY", contract.swu_id);
  if (context.run_id !== context.attempt_id || receipt.attempt_id !== context.attempt_id) fail("WP_TERMINAL_RECEIPT_ATTEMPT_CONTEXT", `${receipt.attempt_id}/${context.run_id}`);
  if (context.repository_root_realpath !== repoRootReal || context.material_root !== ".") fail("WP_TERMINAL_RECEIPT_REPOSITORY_BINDING", context.repository_root_realpath);

  const repositoryIdentity = exactJsonRef(context.repository_identity_ref, "WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY").value;
  exactKeys(repositoryIdentity, ["schema_version","work_pack_id","repository_root_realpath","material_root","authority_effect"], "WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY_SHAPE");
  if (repositoryIdentity.schema_version !== "task-session.repository-identity.v1" || repositoryIdentity.work_pack_id !== "WP-RMT-002" || repositoryIdentity.repository_root_realpath !== repoRootReal || repositoryIdentity.material_root !== "." || repositoryIdentity.authority_effect !== "none") fail("WP_TERMINAL_RECEIPT_REPOSITORY_IDENTITY", repoRootReal);

  const expectedAttemptRoot = `.task-session/runs/${context.attempt_id}`;
  if (context.attempt_root !== expectedAttemptRoot || context.attempt_root_ref.path !== `${expectedAttemptRoot}/attempt-root.json` || context.current_run_ref.path !== `${expectedAttemptRoot}/governance-request.json` || context.execution_ticket_ref.path !== `${expectedAttemptRoot}/execution-ticket.json` || context.execution_output_prestate_ref.path !== `${expectedAttemptRoot}/execution-output-prestate.json` || receipt.execution_context_ref.path !== `${expectedAttemptRoot}/execution-context.json`) fail("WP_TERMINAL_RECEIPT_ATTEMPT_ROOT", context.attempt_root);
  const attemptRootIdentity = exactJsonRef(context.attempt_root_ref, "WP_TERMINAL_RECEIPT_ATTEMPT_ROOT_REF").value;
  exactKeys(attemptRootIdentity, ["schema_version","work_pack_id","task_id","swu_id","run_id","attempt_id","repository_identity_ref","attempt_root","authority_effect"], "WP_TERMINAL_RECEIPT_ATTEMPT_ROOT_SHAPE");
  if (attemptRootIdentity.schema_version !== "task-session.attempt-root-identity.v1" || attemptRootIdentity.work_pack_id !== "WP-RMT-002" || attemptRootIdentity.task_id !== contract.task_id || attemptRootIdentity.swu_id !== contract.swu_id || attemptRootIdentity.run_id !== context.run_id || attemptRootIdentity.attempt_id !== context.attempt_id || !refsEqual(attemptRootIdentity.repository_identity_ref, context.repository_identity_ref) || attemptRootIdentity.attempt_root !== context.attempt_root || attemptRootIdentity.authority_effect !== "none") fail("WP_TERMINAL_RECEIPT_ATTEMPT_ROOT", context.attempt_id);

  const selection = exactJsonRef(context.selection_receipt_ref, "WP_TERMINAL_RECEIPT_SELECTION_REF").value;
  const semanticArtifact = exactJsonRef(context.plan_semantic_manifest_ref, "WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_REF");
  const semanticManifest = semanticArtifact.value;
  if (semanticManifest.schema_version !== "1.0.0" || semanticManifest.work_pack_id !== "WP-RMT-002" || semanticManifest.plan_epoch_id !== context.plan_epoch_id || semanticManifest.canonical_semantic_digest !== selection.canonicalSemanticDigest || semanticManifest.unit_contract_digests?.[contract.swu_id] !== context.unit_contract_digest || context.plan_manifest_digest !== context.plan_semantic_manifest_ref.sha256) fail("WP_TERMINAL_RECEIPT_PLAN_SEMANTIC_BINDING", contract.swu_id);
  if (selection.schemaVersion !== "1.0.0" || selection.selectionVerdict !== "select" || selection.terminalCode !== "SELECTION_READY" || selection.taskId !== contract.task_id || selection.swuId !== contract.swu_id || selection.planEpochId !== context.plan_epoch_id || selection.unitContractDigest !== context.unit_contract_digest || selection.manifestDigest !== context.plan_manifest_digest || selection.canonicalSemanticDigest !== semanticManifest.canonical_semantic_digest || selection.mutationReady !== false || selection.authorityEffect !== "none" || !Array.isArray(selection.reasons) || selection.reasons.length !== 0) fail("WP_TERMINAL_RECEIPT_SELECTION_BINDING", contract.swu_id);

  const admissionArtifact = exactJsonRef(context.mutation_admission_receipt_ref, "WP_TERMINAL_RECEIPT_ADMISSION_REF");
  const admission = admissionArtifact.value;
  const requestValidation = projectedValidationCommands(contract);
  if (context.validation_contract_digest !== canonicalHash(requestValidation)) fail("WP_TERMINAL_RECEIPT_VALIDATION_CONTRACT", contract.swu_id);
  const baselines = admission.targetBaselines;
  if (!Array.isArray(baselines) || baselines.length !== contract.write_partition.material_writes.length || JSON.stringify(baselines.map((item) => item.path)) !== JSON.stringify(contract.write_partition.material_writes) || baselines.some((item) => item.state !== "absent" || item.sha256 !== null || item.sizeBytes !== null)) fail("WP_TERMINAL_RECEIPT_TARGET_BASELINE", contract.swu_id);
  if (context.target_baseline_digest !== canonicalHash(baselines) || admission.targetBaselineDigest !== context.target_baseline_digest) fail("WP_TERMINAL_RECEIPT_TARGET_BASELINE_DIGEST", contract.swu_id);
  const canonicalAdmissionToken = canonicalHash({ requestDigest: admission.requestDigest, selectionReceiptDigest: admission.selectionReceiptDigest, attemptId: admission.attemptId, targetBaselineDigest: admission.targetBaselineDigest, validationContractDigest: admission.validationContractDigest });
  if (admission.admissionToken !== canonicalAdmissionToken) fail("WP_TERMINAL_RECEIPT_ADMISSION_TOKEN", contract.swu_id);
  const canonicalExecutionOutputs = [contract.atomicity.receipt];
  const canonicalAllowedWrites = [...contract.write_partition.material_writes, ...canonicalExecutionOutputs].sort();
  if (admission.schemaVersion !== "1.2.0" || admission.admissionProfile !== "plan-once-selected-unit" || admission.executionMode !== "routed-mutation" || admission.writeProfile !== "material-bound" || admission.admissionVerdict !== "admit" || admission.mutationReady !== true || admission.singleUse !== true || admission.taskId !== contract.task_id || admission.swuId !== contract.swu_id || admission.planEpochId !== context.plan_epoch_id || admission.unitContractDigest !== context.unit_contract_digest || admission.attemptId !== context.attempt_id || admission.planManifestDigest !== context.plan_manifest_digest || admission.selectionReceiptDigest !== context.selection_receipt_ref.sha256 || admission.validationContractDigest !== context.validation_contract_digest || !Array.isArray(admission.reasons) || admission.reasons.length !== 0 || JSON.stringify([...admission.materialWrites].sort()) !== JSON.stringify([...contract.write_partition.material_writes].sort()) || JSON.stringify([...admission.executionOutputs].sort()) !== JSON.stringify(canonicalExecutionOutputs) || JSON.stringify([...admission.allowedWrites].sort()) !== JSON.stringify(canonicalAllowedWrites) || JSON.stringify(admission.validationCommands) !== JSON.stringify(contract.verification.commands) || admission.lifecycleOwner !== contract.lifecycle_owner || admission.authorityClass !== contract.authority_class || admission.publicationClass !== contract.publication_class) fail("WP_TERMINAL_RECEIPT_ADMISSION_BINDING", contract.swu_id);

  const currentRun = exactJsonRef(context.current_run_ref, "WP_TERMINAL_RECEIPT_CURRENT_RUN_REF").value;
  exactKeys(currentRun, ["schema_version","admission_profile","request_id","run_id","work_pack_ref","swu_ref","task_id","swu_id","control_refs","execution_contract","owner_identity","idempotency_key","closeout_contract","plan_admission"], "WP_TERMINAL_RECEIPT_CURRENT_RUN_SHAPE");
  const expectedPlanAdmission = {
    plan_epoch_id: context.plan_epoch_id,
    unit_contract_digest: context.unit_contract_digest,
    attempt_id: context.attempt_id,
    selection_receipt_ref: context.selection_receipt_ref,
    mutation_admission_receipt_ref: context.mutation_admission_receipt_ref,
    admission_token: admission.admissionToken,
    target_baseline_digest: context.target_baseline_digest,
    validation_contract_digest: context.validation_contract_digest,
    consumption_ledger_path: context.consumed_admission.consumption_ledger_ref.path,
  };
  if (currentRun.schema_version !== "task-session.governance-run-request.v1" || currentRun.admission_profile !== "plan-once-selected-unit" || currentRun.run_id !== context.run_id || currentRun.task_id !== contract.task_id || currentRun.swu_id !== contract.swu_id || JSON.stringify(currentRun.plan_admission) !== JSON.stringify(expectedPlanAdmission) || !currentRun.control_refs.some((ref) => refsEqual(ref, context.selection_receipt_ref)) || !currentRun.control_refs.some((ref) => refsEqual(ref, context.mutation_admission_receipt_ref)) || !currentRun.control_refs.some((ref) => refsEqual(ref, context.execution_output_prestate_ref)) || JSON.stringify([...currentRun.execution_contract.allowed_writes].sort()) !== JSON.stringify([...contract.write_partition.material_writes].sort()) || JSON.stringify(currentRun.execution_contract.declared_outputs) !== JSON.stringify(canonicalExecutionOutputs) || JSON.stringify(currentRun.execution_contract.validation_commands) !== JSON.stringify(requestValidation) || currentRun.execution_contract.timeout_seconds !== 120 || currentRun.execution_contract.max_output_bytes !== 1048576 || currentRun.closeout_contract.terminal_receipt_path !== contract.atomicity.receipt) fail("WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING", contract.swu_id);
  const workPackIdentity = exactJsonRef(currentRun.work_pack_ref, "WP_TERMINAL_RECEIPT_WORK_PACK_REF").value;
  const swuIdentity = exactJsonRef(currentRun.swu_ref, "WP_TERMINAL_RECEIPT_SWU_REF").value;
  if (workPackIdentity.work_pack_id !== "WP-RMT-002" || swuIdentity.swu_id !== contract.swu_id || swuIdentity.task_id !== contract.task_id) fail("WP_TERMINAL_RECEIPT_CURRENT_RUN_BINDING", contract.swu_id);

  const outputPrestateArtifact = exactJsonRef(context.execution_output_prestate_ref, "WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_REF");
  const outputPrestate = outputPrestateArtifact.value;
  exactKeys(outputPrestate, ["schema_version","owner","work_pack_id","task_id","swu_id","run_id","attempt_id","plan_epoch_id","unit_contract_digest","selection_receipt_ref","mutation_admission_receipt_ref","write_scope_baseline_ref","selected_baseline_rows","captured_phase","execution_outputs","authority_effect"], "WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_SHAPE");
  if (outputPrestate.schema_version !== "domainspec.wp-rmt-002-execution-output-prestate/v1" || outputPrestate.owner !== "task-session" || outputPrestate.work_pack_id !== "WP-RMT-002" || outputPrestate.task_id !== contract.task_id || outputPrestate.swu_id !== contract.swu_id || outputPrestate.run_id !== context.run_id || outputPrestate.attempt_id !== context.attempt_id || outputPrestate.plan_epoch_id !== context.plan_epoch_id || outputPrestate.unit_contract_digest !== context.unit_contract_digest || !refsEqual(outputPrestate.selection_receipt_ref, context.selection_receipt_ref) || !refsEqual(outputPrestate.mutation_admission_receipt_ref, context.mutation_admission_receipt_ref) || outputPrestate.captured_phase !== "pre-execution" || outputPrestate.authority_effect !== "none") fail("WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_BINDING", contract.swu_id);
  const outputPrestateRows = outputPrestate.execution_outputs;
  if (!Array.isArray(outputPrestateRows) || JSON.stringify(outputPrestateRows.map((item) => item.path)) !== JSON.stringify(contract.write_partition.execution_outputs) || outputPrestateRows.some((item) => item.state !== "absent" || item.sha256 !== null || item.size_bytes !== null) || context.execution_output_prestate_digest !== canonicalHash(outputPrestateRows)) fail("WP_TERMINAL_RECEIPT_FIXED_PATH_BASELINE", contract.atomicity.receipt);
  const staticBaseline = exactJsonRef(outputPrestate.write_scope_baseline_ref, "WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_REF").value;
  if (outputPrestate.write_scope_baseline_ref.sha256 !== "990ffc79aaf16bbf1beb563a2eadbe8699aeaaabec9a6373a24d70e64b79a767" || outputPrestate.write_scope_baseline_ref.size_bytes !== 51192 || staticBaseline.schema_version !== "domainspec.wp-rmt-002-write-scope-baseline/v2" || staticBaseline.work_pack_id !== "WP-RMT-002" || staticBaseline.all_paths_absent !== true || !Array.isArray(staticBaseline.entries)) fail("WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE", contract.swu_id);
  const selectedBaselineRows = staticBaseline.entries.filter((item) => item.owner_swu === contract.swu_id);
  if (JSON.stringify(outputPrestate.selected_baseline_rows) !== JSON.stringify(selectedBaselineRows) || selectedBaselineRows.some((item) => item.baseline_state !== "absent" || item.owner_swu !== contract.swu_id) || contract.write_partition.execution_outputs.some((output) => !selectedBaselineRows.some((item) => item.path.endsWith("/") ? output.startsWith(item.path) : output === item.path))) fail("WP_TERMINAL_RECEIPT_WRITE_SCOPE_BASELINE_COVERAGE", contract.swu_id);

  const ticket = exactJsonRef(context.execution_ticket_ref, "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_REF").value;
  exactKeys(ticket, ["schema_version","admission_profile","ticket_id","run_id","task_id","swu_id","request_ref","predecessor_ref","control_refs","baseline_inventory","allowed_writes","declared_outputs","validation_contracts","executor_contract","owner_identity","idempotency_key","closeout_contract","plan_admission"], "WP_TERMINAL_RECEIPT_EXECUTION_TICKET_SHAPE");
  const expectedTicketBaselines = baselines.map((item) => ({ path: item.path, state: item.state, sha256: item.sha256, size_bytes: item.sizeBytes }));
  const expectedTicketAdmission = { ...expectedPlanAdmission, target_baselines: expectedTicketBaselines };
  if (ticket.schema_version !== "task-session.execution-ticket.v1" || ticket.admission_profile !== "plan-once-selected-unit" || ticket.run_id !== context.run_id || ticket.task_id !== contract.task_id || ticket.swu_id !== contract.swu_id || !refsEqual(ticket.request_ref, context.current_run_ref) || !ticket.control_refs.some((ref) => refsEqual(ref, context.execution_output_prestate_ref)) || JSON.stringify(ticket.baseline_inventory) !== JSON.stringify(expectedTicketBaselines) || JSON.stringify([...ticket.allowed_writes].sort()) !== JSON.stringify([...contract.write_partition.material_writes].sort()) || JSON.stringify(ticket.declared_outputs) !== JSON.stringify(canonicalExecutionOutputs) || JSON.stringify(ticket.validation_contracts) !== JSON.stringify(requestValidation) || ticket.closeout_contract.terminal_receipt_path !== contract.atomicity.receipt || JSON.stringify(ticket.plan_admission) !== JSON.stringify(expectedTicketAdmission)) fail("WP_TERMINAL_RECEIPT_EXECUTION_TICKET_BINDING", contract.swu_id);

  exactKeys(context.consumed_admission, ["receipt_ref","admission_token","attempt_id","consumption_ledger_ref"], "WP_TERMINAL_RECEIPT_CONSUMED_ADMISSION_SHAPE");
  const admissionParent = context.mutation_admission_receipt_ref.path.split("/").slice(0, -1).join("/");
  const expectedLedgerPath = `${admissionParent ? `${admissionParent}/` : ""}.admission-consumption/${context.mutation_admission_receipt_ref.sha256}.json`;
  if (!refsEqual(context.consumed_admission.receipt_ref, context.mutation_admission_receipt_ref) || context.consumed_admission.admission_token !== admission.admissionToken || context.consumed_admission.attempt_id !== context.attempt_id || context.consumed_admission.consumption_ledger_ref.path !== expectedLedgerPath) fail("WP_TERMINAL_RECEIPT_CONSUMED_ADMISSION", contract.swu_id);
  const ledger = exactJsonRef(context.consumed_admission.consumption_ledger_ref, "WP_TERMINAL_RECEIPT_LEDGER_REF").value;
  exactKeys(ledger, ["schema_version","run_id","task_id","swu_id","attempt_id","admission_token","ticket_ref","mutation_admission_receipt_ref"], "WP_TERMINAL_RECEIPT_LEDGER_SHAPE");
  if (ledger.schema_version !== "task-session.admission-consumption.v1" || ledger.run_id !== context.run_id || ledger.task_id !== contract.task_id || ledger.swu_id !== contract.swu_id || ledger.attempt_id !== context.attempt_id || ledger.admission_token !== admission.admissionToken || !refsEqual(ledger.ticket_ref, context.execution_ticket_ref) || !refsEqual(ledger.mutation_admission_receipt_ref, context.mutation_admission_receipt_ref)) fail("WP_TERMINAL_RECEIPT_LEDGER_BINDING", contract.swu_id);
  const ledgerDirectory = expectedLedgerPath.split("/").slice(0, -1).join("/");
  const matchingLedgers = readdirSync(resolve(repoRoot, ledgerDirectory), { encoding: "utf8" }).filter((name) => name.endsWith(".json")).map((name) => {
    const inspected = inspectRepoPath(`${ledgerDirectory}/${name}`, "WP_TERMINAL_RECEIPT_LEDGER_NAMESPACE");
    if (!inspected.exists || !inspected.stat.isFile()) fail("WP_TERMINAL_RECEIPT_LEDGER_NAMESPACE", name);
    try { return JSON.parse(read(inspected.path).toString("utf8")); } catch (error) { fail("WP_TERMINAL_RECEIPT_LEDGER_NAMESPACE_JSON", name); }
  }).filter((candidate) => candidate.attempt_id === context.attempt_id || candidate.admission_token === admission.admissionToken);
  if (matchingLedgers.length !== 1) fail("WP_TERMINAL_RECEIPT_ATTEMPT_REUSED", `${context.attempt_id}:${matchingLedgers.length}`);
  return { context, admission, outputPrestateStat: outputPrestateArtifact.inspected.stat };
};
const terminalReceiptOutput = () => {
  if (terminalReceiptArgument === null || terminalUnitArgument === null) fail("WP_TERMINAL_RECEIPT_CLI", "receipt and unit are required");
  const contract = contracts.contracts.find((candidate) => candidate.swu_id === terminalUnitArgument);
  if (!contract) fail("WP_TERMINAL_RECEIPT_UNIT_UNKNOWN", terminalUnitArgument);
  const expectedReceipt = inspectRepoPath(contract.atomicity.receipt, "WP_TERMINAL_RECEIPT_PATH");
  const receiptPath = resolve(terminalReceiptArgument);
  if (!expectedReceipt.exists || receiptPath !== expectedReceipt.path) fail("WP_TERMINAL_RECEIPT_PATH", terminalReceiptArgument);
  if (!expectedReceipt.stat.isFile() || expectedReceipt.stat.isSymbolicLink()) fail("WP_TERMINAL_RECEIPT_FILE", terminalReceiptArgument);
  const receipt = json(receiptPath);
  exactKeys(receipt, ["schema_version","work_pack_id","task_id","swu_id","attempt_id","execution_context_ref","attempt_contract","result","expected_receipt","material_inventory","command_evidence","validation","lifecycle_owner_validation","receipt_written_last","authority_effect"], "WP_TERMINAL_RECEIPT_SHAPE");
  if (receipt.schema_version !== "domainspec.wp-rmt-002-terminal-receipt/v3" || receipt.work_pack_id !== "WP-RMT-002") fail("WP_TERMINAL_RECEIPT_SCHEMA", receipt.schema_version);
  if (receipt.task_id !== contract.task_id || receipt.swu_id !== contract.swu_id || receipt.swu_id !== terminalUnitArgument) fail("WP_TERMINAL_RECEIPT_IDENTITY", `${receipt.task_id}/${receipt.swu_id}`);
  if (typeof receipt.attempt_id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]+$/.test(receipt.attempt_id) || JSON.stringify(receipt.attempt_contract) !== JSON.stringify(contract.attempt_contract)) fail("WP_TERMINAL_RECEIPT_ATTEMPT", receipt.attempt_id);
  if (!new Set(["pass","block"]).has(receipt.result) || receipt.expected_receipt !== contract.atomicity.receipt || receipt.receipt_written_last !== true || receipt.authority_effect !== "none") fail("WP_TERMINAL_RECEIPT_RESULT", receipt.result);
  const executionBinding = validateExecutionContext(receipt, contract);

  const executionOutputs = contract.write_partition.execution_outputs;
  const isExecutionOutput = (raw) => executionOutputs.some((scope) => scope.endsWith("/") ? raw === scope.slice(0, -1) || raw.startsWith(scope) : raw === scope);
  for (const transient of contract.atomicity.transient_outputs ?? []) {
    const inspected = inspectRepoPath(transient.path, "WP_TERMINAL_RECEIPT_TRANSIENT");
    if (inspected.exists) fail("WP_TERMINAL_RECEIPT_TRANSIENT_PRESENT", transient.path);
  }

  const actualByPath = new Map();
  const materialTimes = [];
  const addMaterialTime = (raw, stat) => materialTimes.push({ path: raw, mtime_ns: stat.mtimeNs, ctime_ns: stat.ctimeNs });
  const addMaterial = (raw, inspected) => {
    if (!inspected.stat.isFile() || inspected.stat.isSymbolicLink()) fail("WP_TERMINAL_RECEIPT_MATERIAL_REGULAR", raw);
    if (isExecutionOutput(raw)) return;
    const bytes = read(inspected.path);
    actualByPath.set(raw, { path: raw, sha256: sha256(bytes), size_bytes: bytes.length });
    addMaterialTime(raw, inspected.stat);
  };
  const censusDirectory = (scope, directory) => {
    const names = readdirSync(directory, { encoding: "utf8" }).sort(rawPathCompare);
    for (const name of names) {
      const raw = `${scope}${name}`;
      if (isExecutionOutput(raw)) continue;
      const inspected = inspectRepoPath(raw, "WP_TERMINAL_RECEIPT_MATERIAL");
      if (!inspected.exists) fail("WP_TERMINAL_RECEIPT_MATERIAL_DISAPPEARED", raw);
      if (inspected.stat.isDirectory()) {
        addMaterialTime(`${raw}/`, inspected.stat);
        censusDirectory(`${raw}/`, inspected.path);
      } else {
        addMaterial(raw, inspected);
      }
    }
  };
  const missingMaterialScopes = [];
  const emptyMaterialScopes = [];
  for (const scope of contract.write_partition.material_writes) {
    const inspected = inspectRepoPath(scope, "WP_TERMINAL_RECEIPT_MATERIAL_SCOPE");
    if (!inspected.exists) {
      missingMaterialScopes.push(scope);
      continue;
    }
    const beforeCount = actualByPath.size;
    if (scope.endsWith("/")) {
      if (!inspected.stat.isDirectory()) fail("WP_TERMINAL_RECEIPT_MATERIAL_SCOPE_TYPE", scope);
      addMaterialTime(scope, inspected.stat);
      censusDirectory(scope, inspected.path);
    } else {
      addMaterial(scope, inspected);
    }
    if (actualByPath.size === beforeCount) emptyMaterialScopes.push(scope);
  }
  const actualMaterials = [...actualByPath.values()].sort((left, right) => rawPathCompare(left.path, right.path));

  const inventory = receipt.material_inventory;
  exactKeys(inventory, ["algorithm","file_count","total_size_bytes","sha256","materials"], "WP_TERMINAL_RECEIPT_INVENTORY_SHAPE");
  if (inventory.algorithm !== "sha256 of raw-UTF8-byte-sorted sha256<TAB>size_bytes<TAB>path<LF> rows" || !Array.isArray(inventory.materials)) fail("WP_TERMINAL_RECEIPT_INVENTORY_SHAPE", contract.swu_id);
  for (let index = 0; index < inventory.materials.length; index += 1) {
    const item = inventory.materials[index];
    exactKeys(item, ["path","sha256","size_bytes"], "WP_TERMINAL_RECEIPT_MATERIAL_SHAPE");
    validateRelativeMaterialPath(item.path, "WP_TERMINAL_RECEIPT_MATERIAL");
    if (!/^[a-f0-9]{64}$/.test(item.sha256) || !Number.isInteger(item.size_bytes) || item.size_bytes < 0) fail("WP_TERMINAL_RECEIPT_MATERIAL", item.path);
    const owned = contract.write_partition.material_writes.some((scope) => scope.endsWith("/") ? item.path.startsWith(scope) : item.path === scope);
    if (!owned || isExecutionOutput(item.path)) fail("WP_TERMINAL_RECEIPT_MATERIAL_UNKNOWN", item.path);
    if (index > 0 && rawPathCompare(inventory.materials[index - 1].path, item.path) >= 0) fail("WP_TERMINAL_RECEIPT_INVENTORY_ORDER", item.path);
  }
  const declaredRows = inventory.materials.map((item) => `${item.sha256}\t${item.size_bytes}\t${item.path}\n`);
  const declaredTotal = inventory.materials.reduce((total, item) => total + item.size_bytes, 0);
  if (inventory.file_count !== inventory.materials.length || inventory.total_size_bytes !== declaredTotal || inventory.sha256 !== sha256(Buffer.from(declaredRows.join(""), "utf8"))) fail("WP_TERMINAL_RECEIPT_INVENTORY_STALE", contract.swu_id);
  if (JSON.stringify(inventory.materials) !== JSON.stringify(actualMaterials)) fail("WP_TERMINAL_RECEIPT_INVENTORY_LIVE_MISMATCH", contract.swu_id);
  const completeMaterial = missingMaterialScopes.length === 0 && emptyMaterialScopes.length === 0 && actualMaterials.length > 0;
  if (receipt.result === "pass" && !completeMaterial) fail("WP_TERMINAL_RECEIPT_PASS_MATERIAL_INCOMPLETE", [...missingMaterialScopes, ...emptyMaterialScopes].join(","));

  const validateEvidence = (evidence, declared, code) => {
    exactKeys(evidence, ["state","declared","observed_runtime","exit_code","stdout_sha256","stderr_sha256"], `${code}_SHAPE`);
    if (JSON.stringify(evidence.declared) !== JSON.stringify(declared)) fail(`${code}_DECLARED`, contract.swu_id);
    if (evidence.state === "not-run") {
      if (evidence.observed_runtime !== null || evidence.exit_code !== null || evidence.stdout_sha256 !== null || evidence.stderr_sha256 !== null) fail(`${code}_NOT_RUN`, contract.swu_id);
      return;
    }
    if (evidence.state !== "executed") fail(`${code}_STATE`, String(evidence.state));
    exactKeys(evidence.observed_runtime, ["executable","version","sha256"], `${code}_RUNTIME_SHAPE`);
    const executable = commandExecutable(declared);
    if (declared.runtime_identity.executable !== executable || evidence.observed_runtime.executable !== executable || typeof evidence.observed_runtime.version !== "string" || evidence.observed_runtime.version.length === 0 || !/^[a-f0-9]{64}$/.test(evidence.observed_runtime.sha256) || !Number.isInteger(evidence.exit_code) || !/^[a-f0-9]{64}$/.test(evidence.stdout_sha256) || !/^[a-f0-9]{64}$/.test(evidence.stderr_sha256)) fail(`${code}_RUNTIME`, contract.swu_id);
  };
  exactKeys(receipt.command_evidence, ["primary","validation_commands"], "WP_TERMINAL_RECEIPT_COMMAND_SHAPE");
  validateEvidence(receipt.command_evidence.primary, contract.primary_command, "WP_TERMINAL_RECEIPT_PRIMARY");
  if (!Array.isArray(receipt.command_evidence.validation_commands) || receipt.command_evidence.validation_commands.length !== contract.validation_contracts.length) fail("WP_TERMINAL_RECEIPT_VALIDATION_COUNT", contract.swu_id);
  for (let index = 0; index < contract.validation_contracts.length; index += 1) validateEvidence(receipt.command_evidence.validation_commands[index], contract.validation_contracts[index], "WP_TERMINAL_RECEIPT_VALIDATION");

  const validation = receipt.validation;
  exactKeys(validation, ["result","failure_phase","failure_reason","declared_command_count","executed_command_count","first_failure_index","commands","failure_exit_preserved"], "WP_TERMINAL_RECEIPT_VALIDATION_SHAPE");
  if (!Array.isArray(validation.commands) || validation.declared_command_count !== contract.validation_contracts.length || validation.commands.length !== contract.validation_contracts.length || validation.failure_exit_preserved !== true) fail("WP_TERMINAL_RECEIPT_VALIDATION_SUMMARY", contract.swu_id);
  let executedValidationCount = 0;
  for (let index = 0; index < validation.commands.length; index += 1) {
    const row = validation.commands[index];
    const evidence = receipt.command_evidence.validation_commands[index];
    exactKeys(row, ["command_id","state","result","exit_code"], "WP_TERMINAL_RECEIPT_VALIDATION_ROW");
    const expectedResult = evidence.state === "not-run" ? "not-run" : evidence.exit_code === 0 ? "pass" : "block";
    if (row.command_id !== contract.validation_contracts[index].command_id || row.state !== evidence.state || row.exit_code !== evidence.exit_code || row.result !== expectedResult) fail("WP_TERMINAL_RECEIPT_VALIDATION_EVIDENCE", `${contract.swu_id}:${index}`);
    if (evidence.state === "executed") executedValidationCount += 1;
  }
  if (validation.executed_command_count !== executedValidationCount) fail("WP_TERMINAL_RECEIPT_EXECUTED_COUNT", contract.swu_id);

  const primary = receipt.command_evidence.primary;
  const validationEvidence = receipt.command_evidence.validation_commands;
  if (receipt.result === "pass") {
    if (primary.state !== "executed" || primary.exit_code !== 0 || validationEvidence.some((item) => item.state !== "executed" || item.exit_code !== 0) || validation.result !== "pass" || validation.failure_phase !== null || validation.failure_reason !== null || validation.first_failure_index !== null || executedValidationCount !== validationEvidence.length) fail("WP_TERMINAL_RECEIPT_PASS_COHERENCE", contract.swu_id);
  } else {
    if (validation.result !== "block" || !new Set(["materialization","primary","validation"]).has(validation.failure_phase) || typeof validation.failure_reason !== "string" || validation.failure_reason.length === 0) fail("WP_TERMINAL_RECEIPT_BLOCK_SHAPE", contract.swu_id);
    if (validation.failure_phase === "materialization") {
      if (primary.state !== "not-run" || validationEvidence.some((item) => item.state !== "not-run") || validation.first_failure_index !== null || executedValidationCount !== 0) fail("WP_TERMINAL_RECEIPT_MATERIALIZATION_FAILURE", contract.swu_id);
    } else if (validation.failure_phase === "primary") {
      if (primary.state !== "executed" || primary.exit_code === 0 || validationEvidence.some((item) => item.state !== "not-run") || validation.first_failure_index !== null || executedValidationCount !== 0) fail("WP_TERMINAL_RECEIPT_PRIMARY_FAILURE", contract.swu_id);
    } else {
      if (primary.state !== "executed" || primary.exit_code !== 0 || !Number.isInteger(validation.first_failure_index) || validation.first_failure_index < 0 || validation.first_failure_index >= validationEvidence.length) fail("WP_TERMINAL_RECEIPT_VALIDATION_FAILURE", contract.swu_id);
      for (let index = 0; index < validationEvidence.length; index += 1) {
        const evidence = validationEvidence[index];
        if (index < validation.first_failure_index && (evidence.state !== "executed" || evidence.exit_code !== 0)) fail("WP_TERMINAL_RECEIPT_FAIL_FAST_PREFIX", `${contract.swu_id}:${index}`);
        if (index === validation.first_failure_index && (evidence.state !== "executed" || evidence.exit_code === 0)) fail("WP_TERMINAL_RECEIPT_FAIL_FAST_FAILURE", `${contract.swu_id}:${index}`);
        if (index > validation.first_failure_index && evidence.state !== "not-run") fail("WP_TERMINAL_RECEIPT_FAIL_FAST_SUFFIX", `${contract.swu_id}:${index}`);
      }
      if (executedValidationCount !== validation.first_failure_index + 1) fail("WP_TERMINAL_RECEIPT_FAIL_FAST_COUNT", contract.swu_id);
    }
  }
  exactKeys(receipt.lifecycle_owner_validation, ["owner","status"], "WP_TERMINAL_RECEIPT_LIFECYCLE_SHAPE");
  if (receipt.lifecycle_owner_validation.owner !== contract.lifecycle_owner || receipt.lifecycle_owner_validation.status !== receipt.result || validation.result !== receipt.result) fail("WP_TERMINAL_RECEIPT_COHERENCE", contract.swu_id);

  const receiptStat = lstatSync(receiptPath, { bigint: true });
  const prestateStat = executionBinding.outputPrestateStat;
  if (prestateStat.mtimeNs >= receiptStat.mtimeNs || prestateStat.ctimeNs >= receiptStat.ctimeNs) fail("WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_ORDER", contract.swu_id);
  for (const material of materialTimes) {
    if (prestateStat.mtimeNs >= material.mtime_ns || prestateStat.ctimeNs >= material.ctime_ns) fail("WP_TERMINAL_RECEIPT_OUTPUT_PRESTATE_ORDER", material.path);
    if (receiptStat.mtimeNs <= material.mtime_ns || receiptStat.ctimeNs <= material.ctime_ns) fail("WP_TERMINAL_RECEIPT_NOT_LAST", material.path);
  }
  return {
    schema_version: "domainspec.wp-rmt-002-terminal-receipt-semantic-validation/v3",
    status: "pass",
    work_pack_id: "WP-RMT-002",
    task_id: contract.task_id,
    swu_id: contract.swu_id,
    run_id: executionBinding.context.run_id,
    attempt_id: executionBinding.context.attempt_id,
    execution_context_ref: receipt.execution_context_ref,
    execution_ticket_ref: executionBinding.context.execution_ticket_ref,
    repository_identity_ref: executionBinding.context.repository_identity_ref,
    selection_receipt_ref: executionBinding.context.selection_receipt_ref,
    mutation_admission_receipt_ref: executionBinding.context.mutation_admission_receipt_ref,
    plan_semantic_manifest_ref: executionBinding.context.plan_semantic_manifest_ref,
    consumption_ledger_ref: executionBinding.context.consumed_admission.consumption_ledger_ref,
    execution_output_prestate_ref: executionBinding.context.execution_output_prestate_ref,
    material_root: ".",
    result: receipt.result,
    material_count: actualMaterials.length,
    material_scopes_complete: completeMaterial,
    executed_validation_command_count: executedValidationCount,
    declared_validation_command_count: contract.validation_contracts.length,
    authority_effect: "none",
  };
};
if ((terminalReceiptArgument === null) !== (terminalUnitArgument === null)) fail("WP_TERMINAL_RECEIPT_CLI", "receipt/unit mismatch");
if (terminalReceiptArgument !== null) {
  process.stdout.write(`${JSON.stringify(terminalReceiptOutput(), null, 2)}\n`);
  process.exit(0);
}
