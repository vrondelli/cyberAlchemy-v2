use std::collections::BTreeMap;

use cyberalchemy_knowledge_exchange_protocol::{
    ArtifactVersion, AuthorityRule, AuthorizationProof, AuthorizationVerifier, CoownershipGrant,
    DecryptionAcknowledgement, Digest32, EncryptedCoownershipState, EncryptionKeyBinding,
    EpochRotation, KeyReissue, KeyReissueRequest, KnowledgeIdentity, PropagationPolicy,
    ProtocolError, RecipientKeyEnvelope, ReissueReason, ADMISSION_DECISION_ID,
    ADMITTED_SYSTEM_ONTOLOGY_DIGEST,
};

const CANONICAL_DEFINITIONS: &str = include_str!("../../authority/definitions/DEFINITIONS.md");
const ADMITTED_SYSTEM_ONTOLOGY: &str =
    include_str!("../../domainspec/successors/002/generated/system-ontology.json");

struct TestVerifier;

impl AuthorizationVerifier for TestVerifier {
    fn verify(&self, proof: &AuthorizationProof) -> bool {
        proof.signature == b"verified"
    }
}

fn d(byte: u8) -> Digest32 {
    Digest32::try_new([byte; 32]).unwrap()
}

fn identity(id: u8, auth: u8, binding_id: u8, encryption: u8, version: u64) -> KnowledgeIdentity {
    KnowledgeIdentity {
        identity_id: d(id),
        authorization_key_fingerprint: d(auth),
        encryption_key: EncryptionKeyBinding {
            binding_id: d(binding_id),
            fingerprint: d(encryption),
            version,
            valid_from: 1,
            valid_until: 100,
            challenge_digest: d(binding_id.wrapping_add(1)),
        },
    }
}

fn envelope(recipient: &KnowledgeIdentity, epoch: u64, digest: u8) -> RecipientKeyEnvelope {
    RecipientKeyEnvelope {
        envelope_digest: d(digest),
        artifact_version_id: d(11),
        encryption_epoch: epoch,
        recipient_id: recipient.identity_id,
        recipient_key_binding_id: recipient.encryption_key.binding_id,
        recipient_key_binding_version: recipient.encryption_key.version,
        recipient_key_fingerprint: recipient.encryption_key.fingerprint,
    }
}

fn proof(signer: Digest32, command: u8) -> AuthorizationProof {
    AuthorizationProof {
        signer_id: signer,
        command_digest: d(command),
        signature: b"verified".to_vec(),
    }
}

fn fixture() -> (
    EncryptedCoownershipState,
    PropagationPolicy,
    KnowledgeIdentity,
    KnowledgeIdentity,
) {
    let a = identity(1, 2, 3, 4, 1);
    let b = identity(5, 6, 7, 8, 1);
    let artifact = ArtifactVersion {
        artifact_id: d(10),
        version_id: d(11),
        plaintext_commitment: d(12),
        policy_id: d(13),
        originator_id: a.identity_id,
    };
    let policy = PropagationPolicy {
        policy_id: d(13),
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
        d(14),
        d(15),
        envelope(&a, 1, 16),
    )
    .unwrap();
    (state, policy, a, b)
}

fn grant_for(
    state: &EncryptedCoownershipState,
    a: &KnowledgeIdentity,
    b: &KnowledgeIdentity,
    command: u8,
) -> CoownershipGrant {
    CoownershipGrant {
        command_digest: d(command),
        expected_state_revision: state.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(11),
        policy_id: d(13),
        grantor_id: a.identity_id,
        recipient_id: b.identity_id,
        recipient_key_binding_id: b.encryption_key.binding_id,
        recipient_key_binding_version: b.encryption_key.version,
        recipient_key_fingerprint: b.encryption_key.fingerprint,
        envelope_digest: d(21),
    }
}

fn grant_b(
    state: &EncryptedCoownershipState,
    policy: &PropagationPolicy,
    a: &KnowledgeIdentity,
    b: &KnowledgeIdentity,
) -> Result<EncryptedCoownershipState, ProtocolError> {
    let grant = grant_for(state, a, b, 20);
    state.grant_coownership(
        policy,
        b,
        &grant,
        envelope(b, 1, 21),
        &proof(a.identity_id, 20),
        &TestVerifier,
    )
}

fn acknowledgement_for(
    state: &EncryptedCoownershipState,
    recipient: &KnowledgeIdentity,
    command: u8,
    challenge: u8,
) -> DecryptionAcknowledgement {
    DecryptionAcknowledgement {
        command_digest: d(command),
        expected_state_revision: state.state_revision(),
        artifact_version_id: d(11),
        encryption_epoch: state.encryption_epoch(),
        recipient_id: recipient.identity_id,
        envelope_digest: state
            .envelope_for(recipient.identity_id)
            .unwrap()
            .envelope_digest,
        ciphertext_digest: state.ciphertext_digest(),
        challenge_digest: d(challenge),
    }
}

fn lost_reissue(
    state: &EncryptedCoownershipState,
    recipient: &KnowledgeIdentity,
    replacement: &KnowledgeIdentity,
    issuer: &KnowledgeIdentity,
) -> (KeyReissueRequest, KeyReissue, RecipientKeyEnvelope) {
    let request = KeyReissueRequest {
        command_digest: d(40),
        expected_state_revision: state.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(11),
        recipient_id: recipient.identity_id,
        previous_key_binding_id: recipient.encryption_key.binding_id,
        previous_key_binding_version: recipient.encryption_key.version,
        previous_key_fingerprint: recipient.encryption_key.fingerprint,
        replacement_key_binding_id: replacement.encryption_key.binding_id,
        replacement_key_binding_version: replacement.encryption_key.version,
        replacement_key_fingerprint: replacement.encryption_key.fingerprint,
        reason: ReissueReason::Lost,
    };
    let result = KeyReissue {
        reissue_digest: d(41),
        request_digest: d(40),
        expected_state_revision: state.state_revision(),
        artifact_version_id: d(11),
        encryption_epoch: state.encryption_epoch(),
        issuer_id: issuer.identity_id,
        recipient_id: recipient.identity_id,
        replacement_key_binding_id: replacement.encryption_key.binding_id,
        replacement_key_binding_version: replacement.encryption_key.version,
        previous_envelope_digest: state
            .envelope_for(recipient.identity_id)
            .unwrap()
            .envelope_digest,
        replacement_envelope_digest: d(42),
        protected_state_before_digest: d(43),
        protected_state_after_digest: d(43),
        unaffected_envelopes_before_digest: d(44),
        unaffected_envelopes_after_digest: d(44),
    };
    (
        request,
        result,
        envelope(replacement, state.encryption_epoch(), 42),
    )
}

#[test]
fn runtime_binds_the_admitted_successor() {
    assert_eq!(
        "32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60",
        ADMITTED_SYSTEM_ONTOLOGY_DIGEST
    );
    assert_eq!(
        "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002",
        ADMISSION_DECISION_ID
    );
}

#[test]
fn definition_kep_d6_grant_changes_a_into_a_and_b_without_removing_a() {
    assert!(CANONICAL_DEFINITIONS.contains("## KEP-D6: Co-Ownership Grant"));
    assert!(CANONICAL_DEFINITIONS.contains("without removing or silently changing any existing"));
    let grant_node = ADMITTED_SYSTEM_ONTOLOGY
        .split("\"node_id\": \"encrypted-knowledge-coownership.CoownershipGrant\"")
        .nth(1)
        .expect("admitted ontology must contain CoownershipGrant");
    let grant_node = grant_node
        .split("\"node_id\":")
        .next()
        .expect("CoownershipGrant must have a bounded ontology record");
    assert!(grant_node.contains("\"KEP-D6\""));

    let (state, policy, a, b) = fixture();
    let successor = grant_b(&state, &policy, &a, &b).unwrap();
    assert_eq!(0, state.state_revision());
    assert_eq!(1, successor.state_revision());
    assert_eq!(2, successor.owners().len());
    assert!(successor.owners().contains(&a.identity_id));
    assert!(successor.owners().contains(&b.identity_id));
    assert!(successor.has_consumed_command(d(20)));
}

#[test]
fn stale_revision_and_replayed_command_fail_closed() {
    let (state, policy, a, b) = fixture();
    let mut stale = grant_for(&state, &a, &b, 20);
    stale.expected_state_revision = 1;
    assert_eq!(
        Err(ProtocolError::StateRevisionMismatch),
        state.grant_coownership(
            &policy,
            &b,
            &stale,
            envelope(&b, 1, 21),
            &proof(a.identity_id, 20),
            &TestVerifier,
        )
    );
    assert_eq!(0, state.state_revision());

    let successor = grant_b(&state, &policy, &a, &b).unwrap();
    let replay = grant_for(&successor, &a, &b, 20);
    assert_eq!(
        Err(ProtocolError::CommandAlreadyConsumed),
        successor.grant_coownership(
            &policy,
            &b,
            &replay,
            envelope(&b, 1, 21),
            &proof(a.identity_id, 20),
            &TestVerifier,
        )
    );
}

#[test]
fn stale_or_wrong_key_binding_is_rejected() {
    let (state, policy, a, mut b) = fixture();
    let mut grant = grant_for(&state, &a, &b, 20);
    grant.evaluation_time = 101;
    assert_eq!(
        Err(ProtocolError::BindingNotCurrent),
        state.grant_coownership(
            &policy,
            &b,
            &grant,
            envelope(&b, 1, 21),
            &proof(a.identity_id, 20),
            &TestVerifier,
        )
    );
    b.encryption_key.binding_id = d(90);
    let grant = grant_for(&state, &a, &b, 20);
    let mut wrong_envelope = envelope(&b, 1, 21);
    wrong_envelope.recipient_key_binding_id = d(91);
    assert_eq!(
        Err(ProtocolError::BindingIdMismatch),
        state.grant_coownership(
            &policy,
            &b,
            &grant,
            wrong_envelope,
            &proof(a.identity_id, 20),
            &TestVerifier,
        )
    );
}

#[test]
fn acknowledgement_binds_ciphertext_and_consumes_fresh_challenge() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let acknowledgement = acknowledgement_for(&state, &b, 30, 31);
    let successor = state
        .acknowledge_decryption(acknowledgement, &proof(b.identity_id, 30), &TestVerifier)
        .unwrap();
    assert_eq!(2, successor.state_revision());
    assert_eq!(Some(&acknowledgement), successor.acknowledgement(d(30)));
    assert!(successor.has_consumed_command(d(30)));
    assert!(successor.has_consumed_challenge(d(31)));
}

#[test]
fn wrong_ciphertext_and_challenge_replay_are_rejected() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let mut wrong = acknowledgement_for(&state, &b, 30, 31);
    wrong.ciphertext_digest = d(99);
    assert_eq!(
        Err(ProtocolError::CiphertextMismatch),
        state.acknowledge_decryption(wrong, &proof(b.identity_id, 30), &TestVerifier)
    );
    let first = acknowledgement_for(&state, &b, 30, 31);
    let state = state
        .acknowledge_decryption(first, &proof(b.identity_id, 30), &TestVerifier)
        .unwrap();
    let replayed_challenge = acknowledgement_for(&state, &b, 32, 31);
    assert_eq!(
        Err(ProtocolError::ChallengeAlreadyConsumed),
        state.acknowledge_decryption(replayed_challenge, &proof(b.identity_id, 32), &TestVerifier,)
    );
}

#[test]
fn lost_key_reissue_replaces_only_the_recipient_envelope() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let ack = acknowledgement_for(&state, &b, 30, 31);
    let state = state
        .acknowledge_decryption(ack, &proof(b.identity_id, 30), &TestVerifier)
        .unwrap();
    let replacement = identity(5, 6, 70, 71, 2);
    let (request, reissue, replacement_envelope) = lost_reissue(&state, &b, &replacement, &a);
    let successor = state
        .reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &reissue,
            replacement_envelope,
            &proof(b.identity_id, 40),
            &proof(a.identity_id, 41),
            &TestVerifier,
        )
        .unwrap();
    assert_eq!(state.owners(), successor.owners());
    assert_eq!(state.artifact(), successor.artifact());
    assert_eq!(state.encryption_epoch(), successor.encryption_epoch());
    assert_eq!(state.ciphertext_digest(), successor.ciphertext_digest());
    assert_eq!(
        state.external_retrieval_reference_digest(),
        successor.external_retrieval_reference_digest()
    );
    assert_eq!(
        state.envelope_for(a.identity_id),
        successor.envelope_for(a.identity_id)
    );
    assert_eq!(
        d(42),
        successor
            .envelope_for(b.identity_id)
            .unwrap()
            .envelope_digest
    );
    assert_eq!(1, successor.acknowledgement_count());
    assert_eq!(3, successor.state_revision());
    assert!(successor.has_consumed_command(d(40)));
    assert!(successor.has_consumed_command(d(41)));
}

#[test]
fn lost_key_reissue_rejects_stale_binding_and_protected_mutation_claim() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let mut replacement = identity(5, 6, 70, 71, 2);
    replacement.encryption_key.valid_until = 9;
    let (request, reissue, replacement_envelope) = lost_reissue(&state, &b, &replacement, &a);
    assert_eq!(
        Err(ProtocolError::BindingNotCurrent),
        state.reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &reissue,
            replacement_envelope,
            &proof(b.identity_id, 40),
            &proof(a.identity_id, 41),
            &TestVerifier,
        )
    );

    let replacement = identity(5, 6, 70, 71, 2);
    let (request, mut reissue, replacement_envelope) = lost_reissue(&state, &b, &replacement, &a);
    reissue.protected_state_after_digest = d(99);
    assert_eq!(
        Err(ProtocolError::ProtectedStateMutation),
        state.reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &reissue,
            replacement_envelope,
            &proof(b.identity_id, 40),
            &proof(a.identity_id, 41),
            &TestVerifier,
        )
    );
}

#[test]
fn compromised_key_cannot_use_same_epoch_reissue() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let replacement = identity(5, 6, 70, 71, 2);
    let (mut request, reissue, replacement_envelope) = lost_reissue(&state, &b, &replacement, &a);
    request.reason = ReissueReason::Compromised;
    assert_eq!(
        Err(ProtocolError::RequiresNewEncryptionEpoch),
        state.reissue_lost_key(
            &policy,
            &b,
            &replacement,
            &request,
            &reissue,
            replacement_envelope,
            &proof(b.identity_id, 40),
            &proof(a.identity_id, 41),
            &TestVerifier,
        )
    );
}

fn rotation(
    state: &EncryptedCoownershipState,
    a: &KnowledgeIdentity,
    envelopes: Vec<RecipientKeyEnvelope>,
) -> EpochRotation {
    EpochRotation {
        command_digest: d(50),
        expected_state_revision: state.state_revision(),
        evaluation_time: 10,
        artifact_version_id: d(11),
        actor_id: a.identity_id,
        prior_epoch: 1,
        successor_epoch: 2,
        ciphertext_digest: d(51),
        external_retrieval_reference_digest: d(52),
        envelopes,
    }
}

#[test]
fn compromised_epoch_rotation_requires_every_owner_envelope() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let identities = BTreeMap::from([(a.identity_id, a), (b.identity_id, b)]);
    let incomplete = rotation(&state, &a, vec![envelope(&a, 2, 53)]);
    assert_eq!(
        Err(ProtocolError::IncompleteOwnerEnvelopeCoverage),
        state.rotate_compromised_epoch(
            &policy,
            &identities,
            &incomplete,
            &proof(a.identity_id, 50),
            &TestVerifier,
        )
    );
}

#[test]
fn compromised_epoch_rotation_is_complete_and_replay_safe() {
    let (state, policy, a, b) = fixture();
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let ack = acknowledgement_for(&state, &b, 30, 31);
    let state = state
        .acknowledge_decryption(ack, &proof(b.identity_id, 30), &TestVerifier)
        .unwrap();
    let identities = BTreeMap::from([(a.identity_id, a), (b.identity_id, b)]);
    let rotation = rotation(&state, &a, vec![envelope(&a, 2, 53), envelope(&b, 2, 54)]);
    let successor = state
        .rotate_compromised_epoch(
            &policy,
            &identities,
            &rotation,
            &proof(a.identity_id, 50),
            &TestVerifier,
        )
        .unwrap();
    assert_eq!(state.owners(), successor.owners());
    assert_eq!(2, successor.encryption_epoch());
    assert_eq!(d(51), successor.ciphertext_digest());
    assert_eq!(d(52), successor.external_retrieval_reference_digest());
    assert_eq!(0, successor.acknowledgement_count());
    assert_eq!(3, successor.state_revision());
    assert!(successor.has_consumed_command(d(50)));
    assert!(successor.has_consumed_challenge(d(31)));
}

#[test]
fn rejected_authorization_leaves_prior_state_unchanged() {
    let (state, policy, a, b) = fixture();
    let grant = grant_for(&state, &a, &b, 20);
    let bad_proof = AuthorizationProof {
        signer_id: a.identity_id,
        command_digest: d(20),
        signature: b"forged".to_vec(),
    };
    assert_eq!(
        Err(ProtocolError::AuthorizationFailed),
        state.grant_coownership(
            &policy,
            &b,
            &grant,
            envelope(&b, 1, 21),
            &bad_proof,
            &TestVerifier,
        )
    );
    assert_eq!(0, state.state_revision());
    assert_eq!(1, state.owners().len());
}

#[test]
fn originator_only_policy_rejects_downstream_grant() {
    let (state, mut policy, a, b) = fixture();
    policy.grant_authority = AuthorityRule::OriginatorOnly;
    let state = grant_b(&state, &policy, &a, &b).unwrap();
    let c = identity(60, 61, 62, 63, 1);
    let grant = grant_for(&state, &b, &c, 64);
    assert_eq!(
        Err(ProtocolError::GrantorNotAuthorized),
        state.grant_coownership(
            &policy,
            &c,
            &grant,
            envelope(&c, 1, 21),
            &proof(b.identity_id, 64),
            &TestVerifier,
        )
    );
}
