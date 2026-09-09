import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ERROR_REGISTRY, normalizeFailure } from "./errors.js";

import {
  base64ToBytes,
  buildFulfillReissueInstruction,
  buildGrantInstruction,
  buildInitializeInstruction,
  buildRequestReissueInstruction,
  classifySubmissionError,
  decryptKnowledge,
  encryptKnowledge,
  generateEncryptionIdentity,
  messages,
  openContentKey,
  parseHandoffCard,
  publicCardDigest,
  randomHex,
  sealContentKey,
  verifyFinalizedSignature,
} from "./protocol.js";

test("BlockhashNotFound is classified as a pre-submission rejection without retry authority", () => {
  const error = classifySubmissionError({
    message: "Transaction simulation failed: Blockhash not found",
    id: "rpc-001",
  }, "devnet_preflight");
  assert.equal(error.code, "blockhash_not_found");
  assert.equal(error.effectStatus, "rejected_before_submission");
  assert.equal(error.rpcRequestId, "rpc-001");
  assert.match(error.guidance, /fresh transaction/i);
});

test("saved fulfillment signatures are inspected without a second submission", async () => {
  let reads = 0;
  const connection = {
    async getSignatureStatus(signature, options) {
      reads += 1;
      assert.equal(signature, "saved-signature");
      assert.deepEqual(options, { searchTransactionHistory: true });
      return { value: { err: null, confirmationStatus: "finalized" } };
    },
  };
  assert.equal(
    await verifyFinalizedSignature("saved-signature", undefined, { connection }),
    "saved-signature",
  );
  assert.equal(reads, 1);
});

test("a non-finalized saved signature blocks resubmission", async () => {
  const connection = {
    async getSignatureStatus() {
      return { value: { err: null, confirmationStatus: "confirmed" } };
    },
  };
  await assert.rejects(
    () => verifyFinalizedSignature("pending-signature", undefined, { connection }),
    (error) => error.code === "devnet_finality_unavailable"
      && error.effectStatus === "submitted_finality_unknown"
      && error.transactionSignature === "pending-signature",
  );
});

test("the versioned registry classifies failures across every declared layer", () => {
  const cases = [
    [new Error("A Phantom-compatible Solana wallet is required."), {}, "wallet_unavailable", "wallet"],
    [new Error("User rejected the request"), {}, "wallet_request_rejected", "wallet"],
    [new Error("network connection unavailable"), {}, "transport_unavailable", "transport"],
    [new Error("request timed out"), {}, "transport_timeout", "transport"],
    [{ message: "rate limited", httpStatus: 429 }, {}, "http_rate_limited", "http"],
    [{ message: "RPC rejected", code: -32000 }, {}, "json_rpc_rejected", "json_rpc"],
    [{ message: "simulation", data: { err: "BlockhashNotFound" } }, { stage: "devnet_preflight" }, "blockhash_not_found", "transaction"],
    [{ message: "simulation", data: { err: { InstructionError: [2, "InvalidArgument"] } } }, {}, "instruction_error", "instruction"],
    [{ message: "program", data: { err: { InstructionError: [1, { Custom: 5 }] } } }, {}, "kep_revision_mismatch", "program"],
    [{ message: "finalized", code: "devnet_finalized_failure", transactionError: "AccountNotFound" }, { stage: "devnet_finalization", transactionSignature: "sig" }, "devnet_finalized_failure", "finality"],
    [{ message: "service", httpStatus: 503, serverCode: "dependency_unavailable" }, {}, "hosted_api_error", "hosted_api"],
    [{ message: "bad card", code: "invalid_handoff_card" }, {}, "invalid_handoff_card", "client_input"],
    [{ message: "bad envelope", code: "recipient_envelope_authentication_failed" }, {}, "recipient_envelope_authentication_failed", "cryptography"],
    [{ message: "bad content key", code: "content_decryption_failed" }, {}, "content_decryption_failed", "cryptography"],
    [new Error("unclassified anomaly"), {}, "unknown_failure", "unknown"],
  ];
  for (const [error, context, code, layer] of cases) {
    const normalized = normalizeFailure(error, context);
    assert.equal(normalized.canonicalCode, code);
    assert.equal(normalized.sourceLayer, layer);
    assert.ok(normalized.safeMessage);
    assert.ok(normalized.retryDisposition);
  }
});

test("typed hosted conflicts remain precise and non-effectful", () => {
  const conflict = normalizeFailure({
    message: "identity exists",
    serverCode: "identity_binding_conflict",
    httpStatus: 409,
  });
  assert.equal(conflict.canonicalCode, "identity_binding_conflict");
  assert.equal(conflict.effectStatus, "none");
  assert.equal(conflict.retryDisposition, "do_not_retry");
});

test("public card digests are canonical across object key order", async () => {
  assert.equal(
    await publicCardDigest({ role: "originator", identityId: "a", epoch: 1 }),
    await publicCardDigest({ epoch: 1, identityId: "a", role: "originator" }),
  );
});

test("the KEP custom-program registry stays aligned with the Rust discriminants", async () => {
  const rust = await readFile(
    new URL("../../../../../runtime/solana-program/src/lib.rs", import.meta.url),
    "utf8",
  );
  const discriminants = [...rust.matchAll(/^\s*([A-Z][A-Za-z]+) = (\d+),$/gm)]
    .map((match) => Number(match[2]));
  const registered = ERROR_REGISTRY.entries
    .filter((entry) => Number.isInteger(entry.custom_program_code))
    .map((entry) => entry.custom_program_code);
  assert.deepEqual(registered, discriminants);
  assert.deepEqual(registered, Array.from({ length: 12 }, (_, index) => index + 1));
});

test("browser crypto keeps exact plaintext recoverable only with the recipient key", async () => {
  const recipient = await generateEncryptionIdentity();
  const outsider = await generateEncryptionIdentity();
  const artifactId = randomHex();
  const policyId = randomHex();
  const encrypted = await encryptKnowledge("Definitions become tradable only as sealed bytes.", artifactId, policyId, 1);
  const context = {
    artifactId,
    policyId,
    epoch: 1,
    plaintextCommitment: encrypted.plaintextCommitment,
    ciphertextSha256: encrypted.ciphertextSha256,
    contentNonceBase64: encrypted.contentNonceBase64,
    recipientIdentityId: "recipient-b",
    recipientKeyVersion: 1,
    envelopeRevision: 1,
  };
  const envelope = await sealContentKey(recipient.publicKeyBase64, encrypted.contentKeyBase64, context);
  await assert.rejects(
    () => openContentKey(envelope.envelopeBase64, outsider.privateKeyBase64, context),
    (error) => error.code === "recipient_envelope_authentication_failed" && error.effectStatus === "none",
  );
  await assert.rejects(
    () => openContentKey(envelope.envelopeBase64, recipient.privateKeyBase64, { ...context, envelopeRevision: 0 }),
    (error) => error.code === "recipient_envelope_authentication_failed" && error.effectStatus === "none",
  );
  const contentKey = await openContentKey(envelope.envelopeBase64, recipient.privateKeyBase64, context);
  assert.equal(
    await decryptKnowledge(encrypted.ciphertextBase64, contentKey, context),
    "Definitions become tradable only as sealed bytes.",
  );
});

test("browser opens the exact recipient envelope produced by the Rust successor", async () => {
  const vector = JSON.parse(await readFile(
    new URL("./fixtures/rust-recipient-envelope-v1.json", import.meta.url),
    "utf8",
  ));
  assert.equal(vector.schemaVersion, "ca2-kep-rust-browser-hpke-vector/v1");
  assert.equal(vector.producer, "ca2-kep-a-operator-v2-rust");
  const context = {
    artifactId: vector.artifactId,
    policyId: vector.policyId,
    epoch: vector.epoch,
    ciphertextSha256: vector.ciphertextSha256,
    contentNonceBase64: vector.contentNonceBase64,
    recipientIdentityId: vector.recipientIdentityId,
    recipientKeyVersion: vector.recipientKeyVersion,
    envelopeRevision: vector.envelopeRevision,
  };
  assert.equal(
    await openContentKey(vector.envelopeBase64, vector.recipientPrivateKeyBase64, context),
    vector.contentKeyBase64,
  );
  await assert.rejects(
    () => openContentKey(vector.envelopeBase64, vector.recipientPrivateKeyBase64, {
      ...context,
      envelopeRevision: vector.envelopeRevision - 1,
    }),
    (error) => error.code === "recipient_envelope_authentication_failed",
  );
});

test("public handoff cards fail at the boundary before cryptography or network work", () => {
  const artifact = {
    kind: "ca2-kep-public-artifact/v1",
    artifactId: randomHex(),
    policyId: randomHex(),
    epoch: 1,
    plaintextCommitment: randomHex(),
    ciphertextSha256: randomHex(),
    contentNonceBase64: Buffer.alloc(24).toString("base64"),
    originatorIdentityId: "originator-a",
    artifactAccount: "K6Hi4RT2j8QC3ja8fuWMzWKvPkgzcbUB1N3PgahUaLw",
  };
  assert.deepEqual(parseHandoffCard(JSON.stringify(artifact), artifact.kind), artifact);
  assert.throws(
    () => parseHandoffCard(JSON.stringify({ ...artifact, contentNonceBase64: "bad" }), artifact.kind),
    (error) => error.code === "invalid_handoff_card" && error.effectStatus === "none",
  );
  assert.throws(
    () => parseHandoffCard(JSON.stringify({ ...artifact, kind: "ca2-kep-public-artifact-card/v1" }), artifact.kind),
    (error) => error.code === "invalid_handoff_card" && error.effectStatus === "none",
  );
  assert.throws(
    () => parseHandoffCard(JSON.stringify({ ...artifact, artifactAccount: "not-a-solana-key" }), artifact.kind),
    (error) => error.code === "invalid_handoff_card" && error.effectStatus === "none",
  );
});

test("browser messages and Solana instructions match the hosted contracts", async () => {
  assert.equal(
    messages.grant("op", "artifact", "a", "b", 0, "digest"),
    JSON.parse(await readFile(new URL('../tests/fixtures/authorization-v2.json',import.meta.url),'utf8')).grant,
  );
  const wallet = "8dbzfBijfp79PJGdzihADpCdE4hGJVLLdhyQPPXS9ki9";
  const recipientWallet = "KA8sUcQbFrVt8yDYpjZxUuDQAKAbHpwe9stMa3EciQJ";
  const recipient = await generateEncryptionIdentity();
  const artifactId = randomHex();
  const digest = randomHex();
  const initialized = await buildInitializeInstruction({
    walletPublicKey: wallet,
    artifactId,
    policyId: randomHex(),
    epoch: 1,
    ciphertextSha256: digest,
    originatorEnvelopeSha256: randomHex(),
    operationId: "initialize-browser-test",
    apiBase: "https://example.invalid",
  });
  const grant = await buildGrantInstruction({
    walletPublicKey: wallet,
    recipientWalletPublicKey: recipientWallet,
    recipientEncryptionPublicKey: recipient.publicKeyBase64,
    artifactId,
    recipientEnvelopeSha256: randomHex(),
    expectedRevision: 0,
    operationId: "grant-browser-test",
  });
  const request = await buildRequestReissueInstruction({
    walletPublicKey: recipientWallet,
    artifactId,
    expectedRevision: 1,
    operationId: "reissue-browser-test",
    replacementPublicKey: recipient.publicKeyBase64,
  });
  const fulfill = await buildFulfillReissueInstruction({
    walletPublicKey: wallet,
    recipientWalletPublicKey: recipientWallet,
    artifactId,
    expectedRevision: 1,
    fulfillOperationId: "fulfill-browser-test",
    replacementEnvelopeSha256: randomHex(),
  });
  assert.equal(initialized.instruction.data.length, 201);
  assert.equal(grant.instruction.data.length, 137);
  assert.equal(request.instruction.data.length, 73);
  assert.equal(fulfill.instruction.data.length, 73);
  assert.equal(initialized.artifactAccount, grant.artifactAccount);
  assert.equal(request.artifactAccount, grant.artifactAccount);
  assert.equal(fulfill.artifactAccount, grant.artifactAccount);
});

test("interface separates the narrative pages from the task-first KEP journey", async () => {
  const html = await readFile(new URL("../static/index.html", import.meta.url), "utf8");
  const source = await readFile(new URL("./app.js", import.meta.url), "utf8");
  const i18n = await readFile(new URL("./i18n.js", import.meta.url), "utf8");
  for (const view of ["home-view", "paper-view", "explore-view"]) {
    assert.match(html, new RegExp(`id="${view}"`));
  }
  for (const target of ["paper", "explore"]) {
    assert.match(html, new RegExp(`data-view-target="${target}"`));
  }
  assert.match(html, /class="brand" href="\/"/);
  assert.match(html, /class="nav-explore" href="\/console-experience\/"/);
  for (const task of ["share", "receive", "restore", "inspect"]) {
    assert.match(source, new RegExp(`data-task=\\"${task}\\"`));
  }
  for (const required of ["journey-shell", "journey-task", "chapter-progress", "change-task"]) {
    assert.match(html, new RegExp(`(?:class|id)="[^"]*${required}`));
  }
  for (const required of ["persistent-error", "persistent-error-title", "persistent-error-receipt", "persistent-error-retry", "inspect-error-id", "persistent-error-evidence", "dismiss-error"]) {
    assert.match(html, new RegExp(`id="${required}"`));
  }
  assert.match(html, /role="alert" aria-live="assertive"/);
  assert.match(source, /\/v1\/client-errors/);
  assert.match(source, /x-ca2-error-id/);
  assert.match(source, /activeError: null/);
  assert.match(source, /pendingFulfillment: null/);
  assert.match(source, /SESSION_STORE_KEY/);
  assert.match(source, /Resume an exact session/);
  assert.match(source, /ca2-kep-public-preflight\/v1/);
  assert.match(source, /frozenOperation/);
  assert.match(source, /Shared wallet authority does not prove independent custody/);
  assert.match(source, /Resume saved fulfillment/);
  assert.match(source, /onSubmitted/);
  assert.match(source, /verifyFinalizedSignature/);
  assert.match(source, /HOSTED_REQUEST_TIMEOUT_MS = 15_000/);
  assert.match(source, /serverStatus: "sending"/);
  assert.match(source, /state\.activeError = null/);
  assert.doesNotMatch(html, /carousel-visual|role-switch|orb-scene/);
  assert.match(html, /CyberAlchemy Exchange/);
  assert.match(html, /Knowledge Expansion Protocol/);
  assert.match(html, /Powered by KEP/);
  assert.match(html, /href="#white-paper"/);
  assert.match(html, /Not approved for publication/);
  assert.match(html, /Run the KEP process/);
  for (const section of ["paper-types", "paper-logic", "paper-architecture", "paper-flow"]) {
    assert.match(html, new RegExp(`id="${section}"`));
  }
  for (const implementedType of [
    "KnowledgeIdentity",
    "Artifact",
    "PreparedGrant",
    "RecipientEnvelope",
    "AccessResponse",
    "ReissueRequest",
  ]) {
    assert.match(html, new RegExp(`>${implementedType}<`));
  }
  assert.match(html, /paper-figure-expansion/);
  assert.match(html, /architecture-map/);
  assert.match(html, /lifecycle-map/);
  assert.match(html, /owners′ = owners ∪ \{ B \}/);
  assert.match(html, /consideration_lamports = 0/);
  assert.match(html, /data-locale-select/);
  assert.match(html, /data-locale-flag/);
  assert.match(html, /value="pt-BR">PT-BR/);
  assert.match(i18n, /flag-br\.svg/);
  assert.match(html, /locale-switch-runtime/);
  assert.match(source, /initializeLocale/);
  assert.match(i18n, /O conhecimento se expande\. A origem permanece\./);
  assert.match(i18n, /Construído sobre a Solana/);
  assert.match(i18n, /Executar o processo KEP/);
  assert.match(i18n, /Modelo de tipos/);
  assert.match(i18n, /Lógica do protocolo/);
  assert.match(i18n, /Quatro responsabilidades delimitadas/);
  assert.doesNotMatch(html, /button[^>]+data-step=/);
  assert.match(html, /id="scene-back"/);
  assert.match(html, /id="scene-next"/);
  assert.match(source, /Create artifact on Devnet/);
  assert.match(source, /Grant B access on Devnet/);
  assert.match(source, /Request replacement access on Devnet/);
  assert.match(source, /Fulfill B’s reissue on Devnet/);
  assert.match(source, /Choose a JSON card file/);
  assert.match(source, /Copy public card/);
  assert.doesNotMatch(source, /const stepOrder/);
  assert.doesNotMatch(html, /wallet_private_key|encryption_private_key|content_key_base64/i);
});


test('versioned signing vectors match Rust and bind field boundaries', async () => {
  const v=JSON.parse(await readFile(new URL('../tests/fixtures/authorization-v2.json',import.meta.url),'utf8'));
  const {accountMessage}=await import('./account-client.js');
  const {commandMessage}=await import('./file-client.js');
  assert.equal(messages.register('op:part','identity','wallet','key',1),v.register);
  assert.notEqual(messages.register('op','part:identity','wallet','key',1),v.register);
  assert.equal(accountMessage('read',{wallet_public_key:'wallet',expires_at:123}),v.accountRead);
  assert.equal(commandMessage('access','artifact',{requester_id:'identity',attempt_id:'attempt',policy_accepted:true},'digest',2),v.fileAccess);
});

test('receipt fixtures stay aligned with the browser transaction builders', async () => {
  const f=JSON.parse(await readFile(new URL('../tests/fixtures/receipt-transactions.json',import.meta.url),'utf8'));
  const {Transaction,TransactionMessage,AddressLookupTableAccount,PublicKey}=await import('@solana/web3.js');
  const {default:bs58}=await import('bs58');
  for(const [name,builder] of [['grant',buildGrantInstruction],['reissue',buildFulfillReissueInstruction]]) {
    const built=await builder(f.input);
    const message=new Transaction({feePayer:new PublicKey(f.input.walletPublicKey),recentBlockhash:'11111111111111111111111111111111'}).add(built.instruction).compileMessage();
    assert.equal(built.artifactAccount,f[name].artifactAccount);
    assert.deepEqual({header:message.header,accountKeys:message.accountKeys.map(x=>x.toString()),instructions:message.instructions},f[name].response.result.transaction.message);
  }
  const built=await buildGrantInstruction(f.input);
  const addresses=built.instruction.keys.slice(2).map(x=>x.pubkey);
  const table=new AddressLookupTableAccount({key:new PublicKey('11111111111111111111111111111111'),state:{deactivationSlot:18446744073709551615n,lastExtendedSlot:0,lastExtendedSlotStartIndex:0,addresses}});
  const m=new TransactionMessage({payerKey:new PublicKey(f.input.walletPublicKey),recentBlockhash:'11111111111111111111111111111111',instructions:[built.instruction]}).compileToV0Message([table]);
  assert.deepEqual({header:m.header,accountKeys:m.staticAccountKeys.map(x=>x.toString()),instructions:m.compiledInstructions.map(x=>({programIdIndex:x.programIdIndex,accounts:x.accountKeyIndexes,data:bs58.encode(x.data)}))},f.v0.response.result.transaction.message);
  const lookup=m.addressTableLookups[0];
  assert.deepEqual({writable:lookup.writableIndexes.map(n=>addresses[n].toString()),readonly:lookup.readonlyIndexes.map(n=>addresses[n].toString())},f.v0.response.result.meta.loadedAddresses);
});
