#![allow(deprecated)]

use borsh::BorshDeserialize;
use cyberalchemy_kep_solana_program::{
    id, ArtifactState, ProtocolInstruction, ARTIFACT_SEED, REPLAY_SEED,
};
use solana_program_test::ProgramTest;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Signer,
    transaction::Transaction,
};
use solana_sdk_ids::system_program;

#[tokio::test]
#[ignore = "requires BPF_OUT_DIR containing the exact cargo-build-sbf output"]
async fn exact_sbf_loads_and_initializes_dynamic_program_state() {
    let context = ProgramTest::new("cyberalchemy_kep_solana_program", id(), None)
        .start_with_context()
        .await;
    let artifact_id = [1_u8; 32];
    let operation_id = [2_u8; 32];
    let (artifact, _) = Pubkey::find_program_address(&[ARTIFACT_SEED, &artifact_id], &id());
    let (replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &operation_id], &id());
    let instruction = Instruction {
        program_id: id(),
        accounts: vec![
            AccountMeta::new(context.payer.pubkey(), true),
            AccountMeta::new_readonly(context.payer.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
        data: borsh::to_vec(&ProtocolInstruction::InitializeArtifact {
            artifact_id,
            policy_commitment: [3; 32],
            epoch: 1,
            ciphertext_commitment: [4; 32],
            originator_envelope_commitment: [5; 32],
            locator_commitment: [6; 32],
            operation_id,
        })
        .unwrap(),
    };
    let transaction = Transaction::new_signed_with_payer(
        &[instruction],
        Some(&context.payer.pubkey()),
        &[&context.payer],
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
    let state = ArtifactState::try_from_slice(&account.data).unwrap();
    assert_eq!(id(), account.owner);
    assert_eq!(context.payer.pubkey(), state.originator);
    assert_eq!(0, state.revision);
}
