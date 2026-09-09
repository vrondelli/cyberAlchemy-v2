use std::collections::{BTreeMap, BTreeSet};

use futures::executor::block_on;

use cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::{
    cryptography::{
        encode_canonical_record, ByteIdentityProvider, CanonicalCborError, CanonicalRecordSchema,
        CanonicalValue, CryptographyError, CryptographyPort,
    },
    durable_storage::{DurableStorageError, DurableStoragePort},
    evidence::{EvidenceError, SeparatedCostObservation},
    model::{
        CryptographicContext, CryptographicProfile, OpaqueRecipientEnvelope, OpaqueStorageLocator,
        PreparedMaterial, RecipientBinding, StorageLayer,
    },
    protocol::{
        activate_finalized_delivery, construct_submission_intent, prepare_and_persist_material,
        retrieve_and_open_for_recipient, LocalProtocolError,
    },
    solana::{
        Finality, NetworkCostObservation, ProgramObservation, SolanaObservationError,
        SolanaObservationPort,
    },
    ACCEPTANCE_DECISION_ID, ACCEPTED_BINDING_ID, ACCEPTED_BINDING_MATERIAL_DIGEST,
};
use cyberalchemy_knowledge_exchange_protocol::{
    ArtifactVersion, AuthorityRule, AuthorizationProof, AuthorizationVerifier, CoownershipGrant,
    Digest32, EncryptedCoownershipState, EncryptionKeyBinding, KeyReissue, KeyReissueRequest,
    KnowledgeIdentity, PropagationPolicy, ProtocolError, RecipientKeyEnvelope, ReissueReason,
};

const ACCEPTED_BINDING_JSON: &str = include_str!(
    "../../capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/implementation/rust-binding/generated/implementation-binding.json"
);
const ADMITTED_SYSTEM_ONTOLOGY_JSON: &str = include_str!(
    "../../capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/domainspec/generated/system-ontology.json"
);

fn d(byte: u8) -> Digest32 {
    Digest32::try_new([byte; 32]).unwrap()
}

struct FixtureIdentity;

impl ByteIdentityProvider for FixtureIdentity {
    fn digest(&self, bytes: &[u8]) -> Digest32 {
        let mut output = [0_u8; 32];
        output[0] = 1;
        for (index, byte) in bytes.iter().enumerate() {
            let slot = index % 32;
            output[slot] = output[slot]
                .wrapping_add(*byte)
                .rotate_left((index % 7) as u32)
                ^ (index as u8).wrapping_mul(17);
        }
        Digest32::try_new(output).unwrap()
    }
}

struct FixtureCryptography;

impl FixtureCryptography {
    fn validate_profile(profile: &CryptographicProfile) -> Result<(), CryptographyError> {
        if profile.content_suite == "TEST-ONLY-XOR-NOT-CRYPTO"
            && profile.envelope_suite == "TEST-ONLY-OPAQUE-ENVELOPE"
            && profile.serialization == "deterministic-cbor-v1"
        {
            Ok(())
        } else {
            Err(CryptographyError::UnsupportedProfile)
        }
    }

    fn aad(context: &CryptographicContext) -> Vec<u8> {
        let mut aad = b"CA2-LOCAL-KAT-1".to_vec();
        aad.extend(context.artifact_version_id.as_bytes());
        aad.extend(context.policy_id.as_bytes());
        aad.extend(context.encryption_epoch.to_be_bytes());
        aad.extend(context.plaintext_commitment.as_bytes());
        aad
    }
}

impl CryptographyPort for FixtureCryptography {
    fn prepare(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        plaintext: &[u8],
        recipients: &[RecipientBinding],
        identity: &dyn ByteIdentityProvider,
    ) -> Result<PreparedMaterial, CryptographyError> {
        Self::validate_profile(profile)?;
        if context.encryption_epoch == 0
            || context.plaintext_commitment != identity.digest(plaintext)
        {
            return Err(CryptographyError::ContextMismatch);
        }
        if recipients.is_empty() {
            return Err(CryptographyError::RecipientMismatch);
        }
        let mut ciphertext = Self::aad(context);
        ciphertext.extend(plaintext.iter().map(|byte| byte ^ 0xa5));
        let envelopes = recipients
            .iter()
            .map(|recipient| {
                let mut envelope_bytes = b"LOCAL-ENVELOPE".to_vec();
                envelope_bytes.extend(recipient.recipient_id.as_bytes());
                envelope_bytes.extend(recipient.key_binding_id.as_bytes());
                envelope_bytes.extend(recipient.key_binding_version.to_be_bytes());
                envelope_bytes.extend(recipient.key_fingerprint.as_bytes());
                OpaqueRecipientEnvelope {
                    recipient: recipient.clone(),
                    envelope_identity: identity.identify(1, &envelope_bytes),
                    envelope_bytes,
                }
            })
            .collect();
        Ok(PreparedMaterial {
            context: context.clone(),
            profile_id: profile.profile_id,
            ciphertext_identity: identity.identify(1, &ciphertext),
            ciphertext,
            envelopes,
        })
    }

    fn open(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        material: &PreparedMaterial,
        recipient: &RecipientBinding,
        identity: &dyn ByteIdentityProvider,
    ) -> Result<Vec<u8>, CryptographyError> {
        Self::validate_profile(profile)?;
        if &material.context != context || material.profile_id != profile.profile_id {
            return Err(CryptographyError::ContextMismatch);
        }
        if !material
            .ciphertext_identity
            .matches(identity.digest(&material.ciphertext), &material.ciphertext)
        {
            return Err(CryptographyError::AuthenticationFailed);
        }
        let envelope = material
            .envelopes
            .iter()
            .find(|envelope| &envelope.recipient == recipient)
            .ok_or(CryptographyError::RecipientMismatch)?;
        if !envelope.envelope_identity.matches(
            identity.digest(&envelope.envelope_bytes),
            &envelope.envelope_bytes,
        ) {
            return Err(CryptographyError::AuthenticationFailed);
        }
        let aad = Self::aad(context);
        let payload = material
            .ciphertext
            .strip_prefix(aad.as_slice())
            .ok_or(CryptographyError::AuthenticationFailed)?;
        let plaintext: Vec<_> = payload.iter().map(|byte| byte ^ 0xa5).collect();
        if identity.digest(&plaintext) != context.plaintext_commitment {
            return Err(CryptographyError::AuthenticationFailed);
        }
        Ok(plaintext)
    }
}

#[derive(Default)]
struct MemoryStorage {
    values: BTreeMap<(StorageLayer, String), Vec<u8>>,
    counters: BTreeMap<StorageLayer, u64>,
    fail_write: Option<StorageLayer>,
    corrupt_read: Option<StorageLayer>,
}

impl DurableStoragePort for MemoryStorage {
    async fn write(
        &mut self,
        layer: StorageLayer,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError> {
        if self.fail_write == Some(layer) {
            return Err(DurableStorageError::WriteFailed(layer));
        }
        let counter = self.counters.entry(layer).or_default();
        *counter += 1;
        let token = format!("local-{layer:?}-{counter}");
        self.values.insert((layer, token.clone()), bytes.to_vec());
        Ok(OpaqueStorageLocator { layer, token })
    }

    async fn retrieve(
        &self,
        locator: &OpaqueStorageLocator,
    ) -> Result<Vec<u8>, DurableStorageError> {
        let mut bytes = self
            .values
            .get(&(locator.layer, locator.token.clone()))
            .cloned()
            .ok_or(DurableStorageError::RetrievalFailed(locator.layer))?;
        if self.corrupt_read == Some(locator.layer) {
            bytes.push(0xff);
        }
        Ok(bytes)
    }
}

#[derive(Clone)]
struct StaticObservation {
    program: ProgramObservation,
    cost: NetworkCostObservation,
}

impl SolanaObservationPort for StaticObservation {
    async fn observe_program_state(
        &self,
        _trial_id: Digest32,
        _program_id: Digest32,
        _artifact_version_id: Digest32,
    ) -> Result<ProgramObservation, SolanaObservationError> {
        Ok(self.program.clone())
    }

    async fn observe_network_cost(
        &self,
        _trial_id: Digest32,
    ) -> Result<NetworkCostObservation, SolanaObservationError> {
        Ok(self.cost.clone())
    }
}

fn crypto_fixture() -> (
    FixtureIdentity,
    FixtureCryptography,
    CryptographicProfile,
    CryptographicContext,
    RecipientBinding,
) {
    let identity = FixtureIdentity;
    let profile = CryptographicProfile {
        profile_id: d(1),
        content_suite: "TEST-ONLY-XOR-NOT-CRYPTO".to_owned(),
        envelope_suite: "TEST-ONLY-OPAQUE-ENVELOPE".to_owned(),
        serialization: "deterministic-cbor-v1".to_owned(),
    };
    let plaintext = b"ontology knowledge fixture";
    let context = CryptographicContext {
        artifact_version_id: d(2),
        policy_id: d(3),
        encryption_epoch: 1,
        plaintext_commitment: identity.digest(plaintext),
    };
    let recipient = RecipientBinding {
        recipient_id: d(4),
        key_binding_id: d(5),
        key_binding_version: 1,
        key_fingerprint: d(6),
    };
    (identity, FixtureCryptography, profile, context, recipient)
}

#[test]
fn accepted_binding_identity_is_compiled_into_local_module() {
    assert_eq!(
        "CA2-D65-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-001",
        ACCEPTED_BINDING_ID
    );
    assert_eq!(
        "500d902f8a757709c6200e7b5b57a3b999c4c954606e7425cdc52fd9fe906926",
        ACCEPTED_BINDING_MATERIAL_DIGEST
    );
    assert_eq!(
        "CA2-DECISION-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-BINDING-ACCEPTANCE-001",
        ACCEPTANCE_DECISION_ID
    );
}

#[test]
fn proof_kep_sol2_proof_deterministic_cbor() {
    let schema = CanonicalRecordSchema {
        schema_version: 1,
        required_fields: vec!["artifact".to_owned(), "epoch".to_owned()],
        optional_fields: vec![],
    };
    let first = BTreeMap::from([
        ("epoch".to_owned(), CanonicalValue::Unsigned(1)),
        (
            "artifact".to_owned(),
            CanonicalValue::Bytes(vec![0xaa, 0xbb]),
        ),
    ]);
    let second = BTreeMap::from([
        (
            "artifact".to_owned(),
            CanonicalValue::Bytes(vec![0xaa, 0xbb]),
        ),
        ("epoch".to_owned(), CanonicalValue::Unsigned(1)),
    ]);
    let first_bytes = encode_canonical_record(&schema, &first).unwrap();
    assert_eq!(
        first_bytes,
        encode_canonical_record(&schema, &second).unwrap()
    );

    let missing = BTreeMap::from([("epoch".to_owned(), CanonicalValue::Unsigned(1))]);
    assert_eq!(
        Err(CanonicalCborError::MissingField("artifact".to_owned())),
        encode_canonical_record(&schema, &missing)
    );
    let mut unknown = first.clone();
    unknown.insert("unknown".to_owned(), CanonicalValue::Bool(true));
    assert_eq!(
        Err(CanonicalCborError::UnknownField("unknown".to_owned())),
        encode_canonical_record(&schema, &unknown)
    );
    let float_schema = CanonicalRecordSchema {
        schema_version: 1,
        required_fields: vec!["value".to_owned()],
        optional_fields: vec![],
    };
    assert_eq!(
        Err(CanonicalCborError::UnsupportedFloat),
        encode_canonical_record(
            &float_schema,
            &BTreeMap::from([("value".to_owned(), CanonicalValue::Float(1.0))])
        )
    );
}

#[test]
fn proof_kep_sol2_proof_crypto_known_answer_local_contract() {
    let (identity, cryptography, profile, context, recipient) = crypto_fixture();
    let plaintext = b"ontology knowledge fixture";
    let first = cryptography
        .prepare(
            &profile,
            &context,
            plaintext,
            std::slice::from_ref(&recipient),
            &identity,
        )
        .unwrap();
    let second = cryptography
        .prepare(
            &profile,
            &context,
            plaintext,
            std::slice::from_ref(&recipient),
            &identity,
        )
        .unwrap();
    assert_eq!(first, second);
    assert_eq!(
        plaintext.to_vec(),
        cryptography
            .open(&profile, &context, &first, &recipient, &identity)
            .unwrap()
    );
    let mut changed_context = context.clone();
    changed_context.policy_id = d(99);
    assert_eq!(
        Err(CryptographyError::ContextMismatch),
        cryptography.open(&profile, &changed_context, &first, &recipient, &identity)
    );
    let mut changed_profile = profile.clone();
    changed_profile.content_suite = "CHANGED".to_owned();
    assert_eq!(
        Err(CryptographyError::UnsupportedProfile),
        cryptography.open(&changed_profile, &context, &first, &recipient, &identity)
    );
}

#[test]
fn proof_kep_sol2_proof_three_layer_readiness() {
    let (identity, cryptography, profile, context, recipient) = crypto_fixture();
    let mut storage = MemoryStorage::default();
    let prepared = block_on(prepare_and_persist_material(
        &cryptography,
        &mut storage,
        &identity,
        &profile,
        &context,
        b"ontology knowledge fixture",
        &[recipient],
    ))
    .unwrap();
    assert!(prepared.storage_readiness.is_ready());
    assert_eq!(3, prepared.storage_readiness.receipts.len());
    assert_eq!(
        BTreeSet::from(StorageLayer::REQUIRED),
        prepared.storage_readiness.verified_layers
    );
}

#[test]
fn proof_kep_sol2_proof_storage_failure_blocks() {
    let (identity, cryptography, profile, context, recipient) = crypto_fixture();
    let mut failed = MemoryStorage {
        fail_write: Some(StorageLayer::RecoveryJournal),
        ..MemoryStorage::default()
    };
    assert_eq!(
        Err(LocalProtocolError::DurableStorage(
            DurableStorageError::WriteFailed(StorageLayer::RecoveryJournal)
        )),
        block_on(prepare_and_persist_material(
            &cryptography,
            &mut failed,
            &identity,
            &profile,
            &context,
            b"ontology knowledge fixture",
            std::slice::from_ref(&recipient),
        ))
    );

    let mut corrupt = MemoryStorage {
        corrupt_read: Some(StorageLayer::ImmutableArchive),
        ..MemoryStorage::default()
    };
    assert_eq!(
        Err(LocalProtocolError::DurableStorage(
            DurableStorageError::ByteIdentityMismatch(StorageLayer::ImmutableArchive)
        )),
        block_on(prepare_and_persist_material(
            &cryptography,
            &mut corrupt,
            &identity,
            &profile,
            &context,
            b"ontology knowledge fixture",
            &[recipient],
        ))
    );
}

fn prepared_fixture() -> (
    FixtureIdentity,
    FixtureCryptography,
    CryptographicProfile,
    CryptographicContext,
    RecipientBinding,
    MemoryStorage,
    cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::model::PreparedDelivery,
) {
    let (identity, cryptography, profile, context, recipient) = crypto_fixture();
    let mut storage = MemoryStorage::default();
    let prepared = block_on(prepare_and_persist_material(
        &cryptography,
        &mut storage,
        &identity,
        &profile,
        &context,
        b"ontology knowledge fixture",
        std::slice::from_ref(&recipient),
    ))
    .unwrap();
    (
        identity,
        cryptography,
        profile,
        context,
        recipient,
        storage,
        prepared,
    )
}

#[test]
fn proof_kep_sol2_proof_finalized_activation_local_contract() {
    let (_, _, _, _, _, _, prepared) = prepared_fixture();
    let intent = construct_submission_intent(&prepared, d(10), d(11), 7).unwrap();
    let observation = ProgramObservation {
        trial_id: d(10),
        program_id: d(11),
        artifact_version_id: prepared.material.context.artifact_version_id,
        state_revision: 7,
        active_identity: prepared.material.ciphertext_identity.clone(),
        finality: Finality::Confirmed,
    };
    let confirmed = StaticObservation {
        program: observation.clone(),
        cost: NetworkCostObservation {
            trial_id: d(10),
            fee_lamports: 5,
            rent_lamports: 7,
        },
    };
    assert_eq!(
        Err(LocalProtocolError::NotFinalized),
        block_on(activate_finalized_delivery(&confirmed, &intent, &prepared))
    );
    let finalized = StaticObservation {
        program: ProgramObservation {
            finality: Finality::Finalized,
            ..observation
        },
        cost: confirmed.cost,
    };
    let activated = block_on(activate_finalized_delivery(&finalized, &intent, &prepared)).unwrap();
    assert_eq!(7, activated.state_revision);
    assert_eq!(
        prepared.material.ciphertext_identity,
        activated.active_identity
    );
}

#[test]
fn proof_kep_sol2_proof_recipient_decryption_local_fixture() {
    let (identity, cryptography, profile, context, recipient, storage, prepared) =
        prepared_fixture();
    assert_eq!(
        b"ontology knowledge fixture".to_vec(),
        block_on(retrieve_and_open_for_recipient(
            &cryptography,
            &storage,
            &identity,
            &profile,
            &context,
            &prepared,
            &recipient,
        ))
        .unwrap()
    );
    let stranger = RecipientBinding {
        recipient_id: d(90),
        ..recipient
    };
    assert_eq!(
        Err(LocalProtocolError::Cryptography(
            CryptographyError::RecipientMismatch
        )),
        block_on(retrieve_and_open_for_recipient(
            &cryptography,
            &storage,
            &identity,
            &profile,
            &context,
            &prepared,
            &stranger,
        ))
    );
}

#[test]
fn proof_kep_sol2_proof_cost_separation_local_model() {
    let costs = SeparatedCostObservation {
        trial_id: d(10),
        network_lamports: 12,
        storage_minor_units: 34,
        knowledge_consideration_minor_units: 0,
    };
    assert_eq!(Ok(()), costs.validate_no_price());
    let payment = SeparatedCostObservation {
        knowledge_consideration_minor_units: 1,
        ..costs
    };
    assert_eq!(
        Err(EvidenceError::KnowledgeConsiderationPresent),
        payment.validate_no_price()
    );
}

struct TestVerifier;

impl AuthorizationVerifier for TestVerifier {
    fn verify(&self, proof: &AuthorizationProof) -> bool {
        proof.signature == b"verified"
    }
}

fn core_identity(id: u8, binding: u8, fingerprint: u8, version: u64) -> KnowledgeIdentity {
    KnowledgeIdentity {
        identity_id: d(id),
        authorization_key_fingerprint: d(id.wrapping_add(1)),
        encryption_key: EncryptionKeyBinding {
            binding_id: d(binding),
            fingerprint: d(fingerprint),
            version,
            valid_from: 1,
            valid_until: 100,
            challenge_digest: d(binding.wrapping_add(1)),
        },
    }
}

fn core_envelope(identity: &KnowledgeIdentity, digest: u8) -> RecipientKeyEnvelope {
    RecipientKeyEnvelope {
        envelope_digest: d(digest),
        artifact_version_id: d(21),
        encryption_epoch: 1,
        recipient_id: identity.identity_id,
        recipient_key_binding_id: identity.encryption_key.binding_id,
        recipient_key_binding_version: identity.encryption_key.version,
        recipient_key_fingerprint: identity.encryption_key.fingerprint,
    }
}

fn core_proof(signer: Digest32, command: u8) -> AuthorizationProof {
    AuthorizationProof {
        signer_id: signer,
        command_digest: d(command),
        signature: b"verified".to_vec(),
    }
}

fn core_fixture() -> (
    EncryptedCoownershipState,
    PropagationPolicy,
    KnowledgeIdentity,
    KnowledgeIdentity,
) {
    let a = core_identity(1, 3, 4, 1);
    let b = core_identity(5, 7, 8, 1);
    let artifact = ArtifactVersion {
        artifact_id: d(20),
        version_id: d(21),
        plaintext_commitment: d(22),
        policy_id: d(23),
        originator_id: a.identity_id,
    };
    let policy = PropagationPolicy {
        policy_id: d(23),
        originator_id: a.identity_id,
        grant_authority: AuthorityRule::AnyCurrentCoowner,
        reissue_authority: AuthorityRule::AnyCurrentCoowner,
    };
    let state = EncryptedCoownershipState::new(
        artifact,
        &policy,
        &a,
        10,
        1,
        d(24),
        d(25),
        core_envelope(&a, 26),
    )
    .unwrap();
    (state, policy, a, b)
}

fn grant_b(
    state: &EncryptedCoownershipState,
    policy: &PropagationPolicy,
    a: &KnowledgeIdentity,
    b: &KnowledgeIdentity,
) -> Result<EncryptedCoownershipState, ProtocolError> {
    let grant = CoownershipGrant {
        command_digest: d(30),
        expected_state_revision: state.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(21),
        policy_id: d(23),
        grantor_id: a.identity_id,
        recipient_id: b.identity_id,
        recipient_key_binding_id: b.encryption_key.binding_id,
        recipient_key_binding_version: b.encryption_key.version,
        recipient_key_fingerprint: b.encryption_key.fingerprint,
        envelope_digest: d(31),
    };
    state.grant_coownership(
        policy,
        b,
        &grant,
        core_envelope(b, 31),
        &core_proof(a.identity_id, 30),
        &TestVerifier,
    )
}

#[test]
fn proof_kep_sol2_proof_grant_positive_and_negatives_local_kernel() {
    let (state, policy, a, b) = core_fixture();
    let successor = grant_b(&state, &policy, &a, &b).unwrap();
    assert_eq!(
        BTreeSet::from([a.identity_id, b.identity_id]),
        *successor.owners()
    );
    assert_eq!(1, successor.state_revision());
    assert!(successor.has_consumed_command(d(30)));
    assert_eq!(1, state.owners().len());

    let replay = CoownershipGrant {
        command_digest: d(30),
        expected_state_revision: successor.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(21),
        policy_id: d(23),
        grantor_id: a.identity_id,
        recipient_id: b.identity_id,
        recipient_key_binding_id: b.encryption_key.binding_id,
        recipient_key_binding_version: b.encryption_key.version,
        recipient_key_fingerprint: b.encryption_key.fingerprint,
        envelope_digest: d(31),
    };
    assert_eq!(
        Err(ProtocolError::CommandAlreadyConsumed),
        successor.grant_coownership(
            &policy,
            &b,
            &replay,
            core_envelope(&b, 31),
            &core_proof(a.identity_id, 30),
            &TestVerifier,
        )
    );
}

#[test]
fn proof_kep_sol2_proof_reissue_positive_and_negatives_local_kernel() {
    let (state, policy, a, b) = core_fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let replacement = core_identity(5, 70, 71, 2);
    let request = KeyReissueRequest {
        command_digest: d(40),
        expected_state_revision: state.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(21),
        recipient_id: b.identity_id,
        previous_key_binding_id: b.encryption_key.binding_id,
        previous_key_binding_version: b.encryption_key.version,
        previous_key_fingerprint: b.encryption_key.fingerprint,
        replacement_key_binding_id: replacement.encryption_key.binding_id,
        replacement_key_binding_version: replacement.encryption_key.version,
        replacement_key_fingerprint: replacement.encryption_key.fingerprint,
        reason: ReissueReason::Lost,
    };
    let reissue = KeyReissue {
        reissue_digest: d(41),
        request_digest: request.command_digest,
        expected_state_revision: state.state_revision(),
        artifact_version_id: d(21),
        encryption_epoch: 1,
        issuer_id: a.identity_id,
        recipient_id: b.identity_id,
        replacement_key_binding_id: replacement.encryption_key.binding_id,
        replacement_key_binding_version: replacement.encryption_key.version,
        previous_envelope_digest: d(31),
        replacement_envelope_digest: d(42),
        protected_state_before_digest: d(50),
        protected_state_after_digest: d(50),
        unaffected_envelopes_before_digest: d(51),
        unaffected_envelopes_after_digest: d(51),
    };
    let successor = state
        .reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &reissue,
            core_envelope(&replacement, 42),
            &core_proof(b.identity_id, 40),
            &core_proof(a.identity_id, 41),
            &TestVerifier,
        )
        .unwrap();
    assert_eq!(state.owners(), successor.owners());
    assert_eq!(
        d(42),
        successor
            .envelope_for(b.identity_id)
            .unwrap()
            .envelope_digest
    );
    assert_eq!(
        d(31),
        state.envelope_for(b.identity_id).unwrap().envelope_digest
    );

    let mut invalid = reissue;
    invalid.protected_state_after_digest = d(99);
    assert_eq!(
        Err(ProtocolError::ProtectedStateMutation),
        state.reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &invalid,
            core_envelope(&replacement, 42),
            &core_proof(b.identity_id, 40),
            &core_proof(a.identity_id, 41),
            &TestVerifier,
        )
    );
    assert_eq!(
        d(31),
        state.envelope_for(b.identity_id).unwrap().envelope_digest
    );
}

#[test]
fn local_no_network_vertical_stops_before_devnet_claim() {
    let (identity, cryptography, profile, context, recipient, storage, prepared) =
        prepared_fixture();
    let intent = construct_submission_intent(&prepared, d(10), d(11), 7).unwrap();
    let observer = StaticObservation {
        program: ProgramObservation {
            trial_id: d(10),
            program_id: d(11),
            artifact_version_id: context.artifact_version_id,
            state_revision: 7,
            active_identity: prepared.material.ciphertext_identity.clone(),
            finality: Finality::Finalized,
        },
        cost: NetworkCostObservation {
            trial_id: d(10),
            fee_lamports: 0,
            rent_lamports: 0,
        },
    };
    block_on(activate_finalized_delivery(&observer, &intent, &prepared)).unwrap();
    let opened = block_on(retrieve_and_open_for_recipient(
        &cryptography,
        &storage,
        &identity,
        &profile,
        &context,
        &prepared,
        &recipient,
    ))
    .unwrap();
    assert_eq!(b"ontology knowledge fixture", opened.as_slice());
    assert_eq!(
        0,
        block_on(observer.observe_network_cost(d(10)))
            .unwrap()
            .fee_lamports
    );
}

#[test]
fn accepted_relation_and_proof_surfaces_are_compile_time_bound() {
    assert_eq!(
        204,
        ACCEPTED_BINDING_JSON
            .matches("\"system_relation_id\"")
            .count()
    );
    assert_eq!(
        204,
        ACCEPTED_BINDING_JSON
            .matches("\"required_test_target\"")
            .count()
            - 13
    );
    assert_eq!(
        13,
        ACCEPTED_BINDING_JSON
            .matches("\"proof_requirement_id\"")
            .count()
    );
    assert_eq!(
        89,
        ADMITTED_SYSTEM_ONTOLOGY_JSON
            .matches("\"system_id\"")
            .count()
    );
}

#[test]
fn accepted_rule_guards_and_lifecycles_fail_closed() {
    use cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::{
        durable_storage::{enforce_storage_confidentiality, StoredMaterialKind},
        evidence::{
            enforce_evidence_closure, EndToEndEvidenceContract, EvidenceClosureStatus,
            EvidenceError,
        },
        model::{
            enforce_b_request_only, DeliveryState, DeliveryTransition, ModelRuleError,
            NoPricePolicy,
        },
        solana::{
            enforce_no_cross_system_atomicity, enforce_onchain_no_secrets, OnChainPublicState,
            SolanaObservationError,
        },
    };

    assert_eq!(
        Ok(DeliveryState::Prepared),
        DeliveryState::Absent.transition(DeliveryTransition::PrepareMaterial)
    );
    assert_eq!(
        Err(ModelRuleError::InvalidDeliveryTransition),
        DeliveryState::Absent.transition(DeliveryTransition::ActivateMaterial)
    );
    assert_eq!(Ok(()), enforce_b_request_only(true, true, false));
    assert_eq!(
        Err(ModelRuleError::RequestActivatesMaterial),
        enforce_b_request_only(true, true, true)
    );
    assert_eq!(Ok(()), NoPricePolicy.validate_knowledge_consideration(0));
    assert_eq!(
        Ok(()),
        enforce_storage_confidentiality([
            StoredMaterialKind::EncryptedArtifact,
            StoredMaterialKind::EnvelopeCiphertext,
            StoredMaterialKind::PublicCommitment,
            StoredMaterialKind::OpaqueLocatorMetadata,
        ])
    );
    assert!(enforce_storage_confidentiality([StoredMaterialKind::Plaintext]).is_err());

    let public_state = OnChainPublicState {
        artifact_version_id: d(1),
        revision: 1,
        owner_commitment: d(2),
        envelope_commitment: d(3),
        opaque_locator_commitment: d(4),
    };
    assert_eq!(Ok(()), enforce_onchain_no_secrets(&public_state, false));
    assert_eq!(
        Err(SolanaObservationError::PolicyViolation),
        enforce_onchain_no_secrets(&public_state, true)
    );
    assert_eq!(Ok(()), enforce_no_cross_system_atomicity(false));

    let incomplete = EndToEndEvidenceContract {
        evidence_bundle_id: d(5),
        source_manifest_digest: d(6),
        environment_id: "local-no-network".to_owned(),
        closure_status: EvidenceClosureStatus::NotEvaluable,
        required_proof_ids: vec!["proof-a".to_owned(), "proof-b".to_owned()],
        resolved_proof_ids: vec!["proof-a".to_owned()],
    };
    assert_eq!(
        Err(EvidenceError::IncompleteEvidence),
        enforce_evidence_closure(&incomplete)
    );
}
