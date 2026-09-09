#![allow(deprecated)]

use borsh::BorshDeserialize;
use cyberalchemy_kep_solana_program::{
    id, key_envelope_binding, process_instruction, ArtifactState, ProtocolInstruction,
    ReissueRequest, ARTIFACT_SEED, REISSUE_SEED, REPLAY_SEED,
};
use solana_program_test::{processor, ProgramTest};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use solana_sdk_ids::system_program;

fn instruction(data: ProtocolInstruction, accounts: Vec<AccountMeta>) -> Instruction {
    Instruction {
        program_id: id(),
        accounts,
        data: borsh::to_vec(&data).unwrap(),
    }
}

#[tokio::test]
async fn all_instructions_enforce_signers_pdas_revisions_replay_and_mutation_bounds() {
    let context = ProgramTest::new(
        "cyberalchemy_kep_solana_program",
        id(),
        processor!(process_instruction),
    )
    .start_with_context()
    .await;
    let originator = Keypair::new();
    let recipient = Keypair::new();
    let outsider = Keypair::new();
    let artifact_id = [1_u8; 32];
    let (artifact, _) = Pubkey::find_program_address(&[ARTIFACT_SEED, &artifact_id], &id());

    let initialize_operation = [2_u8; 32];
    let (initialize_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &initialize_operation], &id());
    let initialize = instruction(
        ProtocolInstruction::InitializeArtifact {
            artifact_id,
            policy_commitment: [3; 32],
            epoch: 1,
            ciphertext_commitment: [4; 32],
            originator_envelope_commitment: [5; 32],
            locator_commitment: [6; 32],
            operation_id: initialize_operation,
        },
        vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(initialize_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );
    let transaction = Transaction::new_signed_with_payer(
        &[initialize],
        Some(&context.payer.pubkey()),
        &[&context.payer, &originator],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();

    let grant_operation = [7_u8; 32];
    let (grant_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &grant_operation], &id());
    let grant_accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new_readonly(originator.pubkey(), true),
        AccountMeta::new(artifact, false),
        AccountMeta::new(grant_replay, false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];
    let stale_grant = instruction(
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: [18; 32],
            recipient_envelope_commitment: [8; 32],
            expected_revision: 9,
            operation_id: grant_operation,
        },
        grant_accounts.clone(),
    );
    let transaction = Transaction::new_signed_with_payer(
        &[stale_grant],
        Some(&context.payer.pubkey()),
        &[&context.payer, &originator],
        context.last_blockhash,
    );
    assert!(context
        .banks_client
        .process_transaction(transaction)
        .await
        .is_err());

    let unsigned_grant = instruction(
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: [18; 32],
            recipient_envelope_commitment: [8; 32],
            expected_revision: 0,
            operation_id: grant_operation,
        },
        vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), false),
            AccountMeta::new(artifact, false),
            AccountMeta::new(grant_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );
    let transaction = Transaction::new_signed_with_payer(
        &[unsigned_grant],
        Some(&context.payer.pubkey()),
        &[&context.payer],
        context.last_blockhash,
    );
    assert!(context
        .banks_client
        .process_transaction(transaction)
        .await
        .is_err());

    let grant = instruction(
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: [18; 32],
            recipient_envelope_commitment: [8; 32],
            expected_revision: 0,
            operation_id: grant_operation,
        },
        grant_accounts,
    );
    let transaction = Transaction::new_signed_with_payer(
        &[grant],
        Some(&context.payer.pubkey()),
        &[&context.payer, &originator],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();
    let account = context
        .banks_client
        .get_account(artifact)
        .await
        .unwrap()
        .unwrap();
    let after_grant = ArtifactState::try_from_slice(&account.data).unwrap();
    assert_eq!(after_grant.originator, originator.pubkey());
    assert!(after_grant.has_recipient);
    assert_eq!(after_grant.recipient, recipient.pubkey());
    assert_eq!(after_grant.revision, 1);
    assert_eq!(after_grant.recipient_key_commitment, [18; 32]);
    assert_eq!(
        after_grant.recipient_key_envelope_binding,
        key_envelope_binding(&[18; 32], &[8; 32])
    );

    let request_operation = [9_u8; 32];
    let revision_seed = 1_u64.to_le_bytes();
    let (request, _) = Pubkey::find_program_address(
        &[
            REISSUE_SEED,
            &artifact_id,
            recipient.pubkey().as_ref(),
            &revision_seed,
        ],
        &id(),
    );
    let (request_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &request_operation], &id());
    let outsider_request = instruction(
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment: [10; 32],
            expected_revision: 1,
            operation_id: request_operation,
        },
        vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(outsider.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(request_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );
    let transaction = Transaction::new_signed_with_payer(
        &[outsider_request],
        Some(&context.payer.pubkey()),
        &[&context.payer, &outsider],
        context.last_blockhash,
    );
    assert!(context
        .banks_client
        .process_transaction(transaction)
        .await
        .is_err());

    let request_instruction = instruction(
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment: [10; 32],
            expected_revision: 1,
            operation_id: request_operation,
        },
        vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(recipient.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(request_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );
    let transaction = Transaction::new_signed_with_payer(
        &[request_instruction],
        Some(&context.payer.pubkey()),
        &[&context.payer, &recipient],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();
    let request_account = context
        .banks_client
        .get_account(request)
        .await
        .unwrap()
        .unwrap();
    let request_state = ReissueRequest::try_from_slice(&request_account.data).unwrap();
    assert!(!request_state.fulfilled);
    assert_eq!(request_state.recipient, recipient.pubkey());

    let fulfill_operation = [11_u8; 32];
    let (fulfill_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &fulfill_operation], &id());
    let fulfill_accounts = vec![
        AccountMeta::new(context.payer.pubkey(), true),
        AccountMeta::new_readonly(originator.pubkey(), true),
        AccountMeta::new(artifact, false),
        AccountMeta::new(request, false),
        AccountMeta::new(fulfill_replay, false),
        AccountMeta::new_readonly(system_program::id(), false),
    ];
    let stale_fulfill = instruction(
        ProtocolInstruction::FulfillReissue {
            replacement_envelope_commitment: [12; 32],
            expected_revision: 0,
            operation_id: fulfill_operation,
        },
        fulfill_accounts.clone(),
    );
    let transaction = Transaction::new_signed_with_payer(
        &[stale_fulfill],
        Some(&context.payer.pubkey()),
        &[&context.payer, &originator],
        context.last_blockhash,
    );
    assert!(context
        .banks_client
        .process_transaction(transaction)
        .await
        .is_err());

    let fulfill = instruction(
        ProtocolInstruction::FulfillReissue {
            replacement_envelope_commitment: [12; 32],
            expected_revision: 1,
            operation_id: fulfill_operation,
        },
        fulfill_accounts,
    );
    let transaction = Transaction::new_signed_with_payer(
        &[fulfill],
        Some(&context.payer.pubkey()),
        &[&context.payer, &originator],
        context.last_blockhash,
    );
    context
        .banks_client
        .process_transaction(transaction)
        .await
        .unwrap();
    let account = context
        .banks_client
        .get_account(artifact)
        .await
        .unwrap()
        .unwrap();
    let after_reissue = ArtifactState::try_from_slice(&account.data).unwrap();
    assert_eq!(after_reissue.revision, 2);
    assert_eq!(after_reissue.recipient_envelope_commitment, [12; 32]);
    assert_eq!(after_reissue.recipient_key_commitment, [10; 32]);
    assert_eq!(
        after_reissue.recipient_key_envelope_binding,
        key_envelope_binding(&[10; 32], &[12; 32])
    );
    assert_eq!(after_reissue.originator, after_grant.originator);
    assert_eq!(after_reissue.recipient, after_grant.recipient);
    assert_eq!(after_reissue.has_recipient, after_grant.has_recipient);
    assert_eq!(
        after_reissue.policy_commitment,
        after_grant.policy_commitment
    );
    assert_eq!(after_reissue.epoch, after_grant.epoch);
    assert_eq!(
        after_reissue.ciphertext_commitment,
        after_grant.ciphertext_commitment
    );
    assert_eq!(
        after_reissue.originator_envelope_commitment,
        after_grant.originator_envelope_commitment
    );
    assert_eq!(
        after_reissue.locator_commitment,
        after_grant.locator_commitment
    );

    let replayed_request_revision = 2_u64.to_le_bytes();
    let (replayed_request, _) = Pubkey::find_program_address(
        &[
            REISSUE_SEED,
            &artifact_id,
            recipient.pubkey().as_ref(),
            &replayed_request_revision,
        ],
        &id(),
    );
    let replayed = instruction(
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment: [13; 32],
            expected_revision: 2,
            operation_id: request_operation,
        },
        vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(recipient.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(replayed_request, false),
            AccountMeta::new(request_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    );
    let transaction = Transaction::new_signed_with_payer(
        &[replayed],
        Some(&context.payer.pubkey()),
        &[&context.payer, &recipient],
        context.last_blockhash,
    );
    assert!(context
        .banks_client
        .process_transaction(transaction)
        .await
        .is_err());
}
