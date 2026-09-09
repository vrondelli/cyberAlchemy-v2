//! Native Solana realization of the encrypted co-ownership public state.
//!
//! Accounts contain commitments and public keys only. Ciphertext bytes,
//! plaintext, key material, locators, prices, and credentials are forbidden.

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    hash::hashv,
    program::{invoke_signed, set_return_data},
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use solana_sdk_ids::system_program;
use solana_system_interface::instruction::create_account;

pub mod membership;

#[cfg(not(feature = "devnet-deployment"))]
pub const ID: Pubkey = Pubkey::new_from_array([0x65; 32]);
#[cfg(feature = "devnet-deployment")]
pub const ID: Pubkey = Pubkey::from_str_const(env!("EXCHANGE_KEP_PROGRAM_ID"));
pub const ARTIFACT_SEED: &[u8] = b"artifact";
pub const REPLAY_SEED: &[u8] = b"replay";
pub const REISSUE_SEED: &[u8] = b"reissue";
pub const ARTIFACT_SPACE: usize = 338;
pub const REPLAY_SPACE: usize = 33;
pub const REISSUE_SPACE: usize = 74;

pub fn id() -> Pubkey {
    ID
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Eq, PartialEq)]
pub enum ProtocolInstruction {
    InitializeArtifact {
        artifact_id: [u8; 32],
        policy_commitment: [u8; 32],
        epoch: u64,
        ciphertext_commitment: [u8; 32],
        originator_envelope_commitment: [u8; 32],
        locator_commitment: [u8; 32],
        operation_id: [u8; 32],
    },
    GrantCoownership {
        recipient: Pubkey,
        recipient_key_commitment: [u8; 32],
        recipient_envelope_commitment: [u8; 32],
        expected_revision: u64,
        operation_id: [u8; 32],
    },
    RequestReissue {
        replacement_key_commitment: [u8; 32],
        expected_revision: u64,
        operation_id: [u8; 32],
    },
    FulfillReissue {
        replacement_envelope_commitment: [u8; 32],
        expected_revision: u64,
        operation_id: [u8; 32],
    },
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Eq, PartialEq)]
pub struct ArtifactState {
    pub version: u8,
    pub artifact_id: [u8; 32],
    pub originator: Pubkey,
    pub recipient: Pubkey,
    pub has_recipient: bool,
    pub policy_commitment: [u8; 32],
    pub epoch: u64,
    pub ciphertext_commitment: [u8; 32],
    pub originator_envelope_commitment: [u8; 32],
    pub recipient_key_commitment: [u8; 32],
    pub recipient_envelope_commitment: [u8; 32],
    pub recipient_key_envelope_binding: [u8; 32],
    pub locator_commitment: [u8; 32],
    pub revision: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Eq, PartialEq)]
pub struct ReplayMarker {
    pub version: u8,
    pub operation_id: [u8; 32],
}

#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, Eq, PartialEq)]
pub struct ReissueRequest {
    pub version: u8,
    pub recipient: Pubkey,
    pub replacement_key_commitment: [u8; 32],
    pub expected_revision: u64,
    pub fulfilled: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, thiserror::Error)]
#[repr(u32)]
pub enum ProtocolProgramError {
    #[error("invalid instruction")]
    InvalidInstruction = 1,
    #[error("invalid PDA")]
    InvalidPda = 2,
    #[error("required signer missing")]
    MissingSigner = 3,
    #[error("authority rejected")]
    AuthorityRejected = 4,
    #[error("revision mismatch")]
    RevisionMismatch = 5,
    #[error("recipient already exists")]
    RecipientAlreadyExists = 6,
    #[error("recipient missing")]
    RecipientMissing = 7,
    #[error("reissue request mismatch")]
    ReissueRequestMismatch = 8,
    #[error("reissue already fulfilled")]
    ReissueAlreadyFulfilled = 9,
    #[error("invalid account owner")]
    InvalidAccountOwner = 10,
    #[error("serialization failed")]
    SerializationFailed = 11,
    #[error("invalid epoch")]
    InvalidEpoch = 12,
}

impl From<ProtocolProgramError> for ProgramError {
    fn from(value: ProtocolProgramError) -> Self {
        Self::Custom(value as u32)
    }
}

#[cfg(not(feature = "no-entrypoint"))]
solana_program::entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.first() == Some(&membership::TAG) {
        if program_id != &ID { return Err(ProgramError::IncorrectProgramId); }
        return membership::process(accounts, &instruction_data[1..]);
    }
    let instruction = ProtocolInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProtocolProgramError::InvalidInstruction)?;
    match instruction {
        ProtocolInstruction::InitializeArtifact {
            artifact_id,
            policy_commitment,
            epoch,
            ciphertext_commitment,
            originator_envelope_commitment,
            locator_commitment,
            operation_id,
        } => initialize_artifact(
            program_id,
            accounts,
            artifact_id,
            policy_commitment,
            epoch,
            ciphertext_commitment,
            originator_envelope_commitment,
            locator_commitment,
            operation_id,
        ),
        ProtocolInstruction::GrantCoownership {
            recipient,
            recipient_key_commitment,
            recipient_envelope_commitment,
            expected_revision,
            operation_id,
        } => grant_coownership(
            program_id,
            accounts,
            recipient,
            recipient_key_commitment,
            recipient_envelope_commitment,
            expected_revision,
            operation_id,
        ),
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment,
            expected_revision,
            operation_id,
        } => request_reissue(
            program_id,
            accounts,
            replacement_key_commitment,
            expected_revision,
            operation_id,
        ),
        ProtocolInstruction::FulfillReissue {
            replacement_envelope_commitment,
            expected_revision,
            operation_id,
        } => fulfill_reissue(
            program_id,
            accounts,
            replacement_envelope_commitment,
            expected_revision,
            operation_id,
        ),
    }
}

#[allow(clippy::too_many_arguments)]
fn initialize_artifact(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    artifact_id: [u8; 32],
    policy_commitment: [u8; 32],
    epoch: u64,
    ciphertext_commitment: [u8; 32],
    originator_envelope_commitment: [u8; 32],
    locator_commitment: [u8; 32],
    operation_id: [u8; 32],
) -> ProgramResult {
    if epoch == 0
        || [
            artifact_id,
            policy_commitment,
            ciphertext_commitment,
            originator_envelope_commitment,
            locator_commitment,
            operation_id,
        ]
        .iter()
        .any(is_zero)
    {
        return Err(ProtocolProgramError::InvalidEpoch.into());
    }
    let mut iter = accounts.iter();
    let payer = next_account_info(&mut iter)?;
    let originator = next_account_info(&mut iter)?;
    let artifact_account = next_account_info(&mut iter)?;
    let replay_account = next_account_info(&mut iter)?;
    let system = next_account_info(&mut iter)?;
    require_signer(payer)?;
    require_signer(originator)?;
    require_system(system)?;

    let artifact_bump = require_pda(program_id, artifact_account, &[ARTIFACT_SEED, &artifact_id])?;
    let replay_bump = require_pda(
        program_id,
        replay_account,
        &[REPLAY_SEED, &artifact_id, &operation_id],
    )?;
    create_owned_pda(
        program_id,
        payer,
        artifact_account,
        system,
        ARTIFACT_SPACE,
        &[ARTIFACT_SEED, &artifact_id, &[artifact_bump]],
    )?;
    create_owned_pda(
        program_id,
        payer,
        replay_account,
        system,
        REPLAY_SPACE,
        &[REPLAY_SEED, &artifact_id, &operation_id, &[replay_bump]],
    )?;
    write_account(
        artifact_account,
        &ArtifactState {
            version: 1,
            artifact_id,
            originator: *originator.key,
            recipient: Pubkey::default(),
            has_recipient: false,
            policy_commitment,
            epoch,
            ciphertext_commitment,
            originator_envelope_commitment,
            recipient_key_commitment: [0; 32],
            recipient_envelope_commitment: [0; 32],
            recipient_key_envelope_binding: [0; 32],
            locator_commitment,
            revision: 0,
        },
    )?;
    write_replay(replay_account, operation_id)
}

fn grant_coownership(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    recipient: Pubkey,
    recipient_key_commitment: [u8; 32],
    recipient_envelope_commitment: [u8; 32],
    expected_revision: u64,
    operation_id: [u8; 32],
) -> ProgramResult {
    let mut iter = accounts.iter();
    let payer = next_account_info(&mut iter)?;
    let originator = next_account_info(&mut iter)?;
    let artifact_account = next_account_info(&mut iter)?;
    let replay_account = next_account_info(&mut iter)?;
    let system = next_account_info(&mut iter)?;
    require_signer(payer)?;
    require_signer(originator)?;
    require_system(system)?;
    require_program_owner(program_id, artifact_account)?;
    let mut state: ArtifactState = read_account(artifact_account)?;
    require_artifact_pda(program_id, artifact_account, &state.artifact_id)?;
    if state.originator != *originator.key {
        return Err(ProtocolProgramError::AuthorityRejected.into());
    }
    if state.revision != expected_revision {
        return Err(ProtocolProgramError::RevisionMismatch.into());
    }
    if state.has_recipient
        || recipient == state.originator
        || recipient == Pubkey::default()
        || is_zero(&recipient_key_commitment)
        || is_zero(&recipient_envelope_commitment)
        || is_zero(&operation_id)
    {
        return Err(ProtocolProgramError::RecipientAlreadyExists.into());
    }
    let replay_bump = require_pda(
        program_id,
        replay_account,
        &[REPLAY_SEED, &state.artifact_id, &operation_id],
    )?;
    create_owned_pda(
        program_id,
        payer,
        replay_account,
        system,
        REPLAY_SPACE,
        &[
            REPLAY_SEED,
            &state.artifact_id,
            &operation_id,
            &[replay_bump],
        ],
    )?;
    state.recipient = recipient;
    state.has_recipient = true;
    state.recipient_key_commitment = recipient_key_commitment;
    state.recipient_envelope_commitment = recipient_envelope_commitment;
    state.recipient_key_envelope_binding =
        key_envelope_binding(&recipient_key_commitment, &recipient_envelope_commitment);
    state.revision = state
        .revision
        .checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    write_account(artifact_account, &state)?;
    write_replay(replay_account, operation_id)
}

fn request_reissue(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    replacement_key_commitment: [u8; 32],
    expected_revision: u64,
    operation_id: [u8; 32],
) -> ProgramResult {
    let mut iter = accounts.iter();
    let payer = next_account_info(&mut iter)?;
    let recipient = next_account_info(&mut iter)?;
    let artifact_account = next_account_info(&mut iter)?;
    let request_account = next_account_info(&mut iter)?;
    let replay_account = next_account_info(&mut iter)?;
    let system = next_account_info(&mut iter)?;
    require_signer(payer)?;
    require_signer(recipient)?;
    require_system(system)?;
    require_program_owner(program_id, artifact_account)?;
    let state: ArtifactState = read_account(artifact_account)?;
    require_artifact_pda(program_id, artifact_account, &state.artifact_id)?;
    if !state.has_recipient
        || state.recipient != *recipient.key
        || is_zero(&replacement_key_commitment)
        || is_zero(&operation_id)
    {
        return Err(ProtocolProgramError::AuthorityRejected.into());
    }
    if state.revision != expected_revision {
        return Err(ProtocolProgramError::RevisionMismatch.into());
    }
    let revision_seed = expected_revision.to_le_bytes();
    let request_bump = require_pda(
        program_id,
        request_account,
        &[
            REISSUE_SEED,
            &state.artifact_id,
            recipient.key.as_ref(),
            &revision_seed,
        ],
    )?;
    let replay_bump = require_pda(
        program_id,
        replay_account,
        &[REPLAY_SEED, &state.artifact_id, &operation_id],
    )?;
    create_owned_pda(
        program_id,
        payer,
        request_account,
        system,
        REISSUE_SPACE,
        &[
            REISSUE_SEED,
            &state.artifact_id,
            recipient.key.as_ref(),
            &revision_seed,
            &[request_bump],
        ],
    )?;
    create_owned_pda(
        program_id,
        payer,
        replay_account,
        system,
        REPLAY_SPACE,
        &[
            REPLAY_SEED,
            &state.artifact_id,
            &operation_id,
            &[replay_bump],
        ],
    )?;
    write_account(
        request_account,
        &ReissueRequest {
            version: 1,
            recipient: *recipient.key,
            replacement_key_commitment,
            expected_revision,
            fulfilled: false,
        },
    )?;
    write_replay(replay_account, operation_id)
}

fn fulfill_reissue(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    replacement_envelope_commitment: [u8; 32],
    expected_revision: u64,
    operation_id: [u8; 32],
) -> ProgramResult {
    let mut iter = accounts.iter();
    let payer = next_account_info(&mut iter)?;
    let originator = next_account_info(&mut iter)?;
    let artifact_account = next_account_info(&mut iter)?;
    let request_account = next_account_info(&mut iter)?;
    let replay_account = next_account_info(&mut iter)?;
    let system = next_account_info(&mut iter)?;
    require_signer(payer)?;
    require_signer(originator)?;
    require_system(system)?;
    require_program_owner(program_id, artifact_account)?;
    require_program_owner(program_id, request_account)?;
    let mut state: ArtifactState = read_account(artifact_account)?;
    let mut request: ReissueRequest = read_account(request_account)?;
    require_artifact_pda(program_id, artifact_account, &state.artifact_id)?;
    if !state.has_recipient {
        return Err(ProtocolProgramError::RecipientMissing.into());
    }
    let recipient = state.recipient;
    let revision_seed = expected_revision.to_le_bytes();
    require_pda(
        program_id,
        request_account,
        &[
            REISSUE_SEED,
            &state.artifact_id,
            recipient.as_ref(),
            &revision_seed,
        ],
    )?;
    if state.originator != *originator.key {
        return Err(ProtocolProgramError::AuthorityRejected.into());
    }
    if state.revision != expected_revision || request.expected_revision != expected_revision {
        return Err(ProtocolProgramError::RevisionMismatch.into());
    }
    if request.recipient != recipient {
        return Err(ProtocolProgramError::ReissueRequestMismatch.into());
    }
    if request.fulfilled {
        return Err(ProtocolProgramError::ReissueAlreadyFulfilled.into());
    }
    if is_zero(&replacement_envelope_commitment) || is_zero(&operation_id) {
        return Err(ProtocolProgramError::ReissueRequestMismatch.into());
    }
    let replay_bump = require_pda(
        program_id,
        replay_account,
        &[REPLAY_SEED, &state.artifact_id, &operation_id],
    )?;
    create_owned_pda(
        program_id,
        payer,
        replay_account,
        system,
        REPLAY_SPACE,
        &[
            REPLAY_SEED,
            &state.artifact_id,
            &operation_id,
            &[replay_bump],
        ],
    )?;
    state.recipient_key_commitment = request.replacement_key_commitment;
    state.recipient_envelope_commitment = replacement_envelope_commitment;
    state.recipient_key_envelope_binding = key_envelope_binding(
        &request.replacement_key_commitment,
        &replacement_envelope_commitment,
    );
    state.revision = state
        .revision
        .checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    request.fulfilled = true;
    write_account(artifact_account, &state)?;
    write_account(request_account, &request)?;
    write_replay(replay_account, operation_id)?;
    set_return_data(&request.replacement_key_commitment);
    Ok(())
}

fn is_zero(value: &[u8; 32]) -> bool {
    value.iter().all(|byte| *byte == 0)
}

pub fn key_envelope_binding(key: &[u8; 32], envelope: &[u8; 32]) -> [u8; 32] {
    hashv(&[b"CA2-KEP-KEY-ENVELOPE-BINDING-v1", key, envelope]).to_bytes()
}

fn require_signer(account: &AccountInfo) -> ProgramResult {
    if account.is_signer {
        Ok(())
    } else {
        Err(ProtocolProgramError::MissingSigner.into())
    }
}

fn require_system(account: &AccountInfo) -> ProgramResult {
    if account.key == &system_program::ID {
        Ok(())
    } else {
        Err(ProgramError::IncorrectProgramId)
    }
}

fn require_program_owner(program_id: &Pubkey, account: &AccountInfo) -> ProgramResult {
    if account.owner == program_id {
        Ok(())
    } else {
        Err(ProtocolProgramError::InvalidAccountOwner.into())
    }
}

fn require_pda(
    program_id: &Pubkey,
    account: &AccountInfo,
    seeds: &[&[u8]],
) -> Result<u8, ProgramError> {
    let (expected, bump) = Pubkey::find_program_address(seeds, program_id);
    if account.key == &expected {
        Ok(bump)
    } else {
        Err(ProtocolProgramError::InvalidPda.into())
    }
}

fn require_artifact_pda(
    program_id: &Pubkey,
    account: &AccountInfo,
    artifact_id: &[u8; 32],
) -> ProgramResult {
    require_pda(program_id, account, &[ARTIFACT_SEED, artifact_id]).map(|_| ())
}

fn create_owned_pda<'a>(
    program_id: &Pubkey,
    payer: &AccountInfo<'a>,
    account: &AccountInfo<'a>,
    system: &AccountInfo<'a>,
    space: usize,
    signer_seeds: &[&[u8]],
) -> ProgramResult {
    if account.lamports() != 0 || account.data_len() != 0 {
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    let lamports = Rent::get()?.minimum_balance(space);
    invoke_signed(
        &create_account(payer.key, account.key, lamports, space as u64, program_id),
        &[payer.clone(), account.clone(), system.clone()],
        &[signer_seeds],
    )
}

fn read_account<T: BorshDeserialize>(account: &AccountInfo) -> Result<T, ProgramError> {
    T::try_from_slice(&account.try_borrow_data()?)
        .map_err(|_| ProtocolProgramError::SerializationFailed.into())
}

fn write_account<T: BorshSerialize>(account: &AccountInfo, value: &T) -> ProgramResult {
    let bytes = borsh::to_vec(value).map_err(|_| ProtocolProgramError::SerializationFailed)?;
    if bytes.len() != account.data_len() {
        return Err(ProtocolProgramError::SerializationFailed.into());
    }
    account.try_borrow_mut_data()?.copy_from_slice(&bytes);
    Ok(())
}

fn write_replay(account: &AccountInfo, operation_id: [u8; 32]) -> ProgramResult {
    write_account(
        account,
        &ReplayMarker {
            version: 1,
            operation_id,
        },
    )
}
