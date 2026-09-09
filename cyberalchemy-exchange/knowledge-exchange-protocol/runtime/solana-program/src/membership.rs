//! Version 2 membership accounts. Legacy v1 artifacts and instructions remain unchanged.
use super::*;
use solana_program::instruction::{AccountMeta, Instruction};
pub const TAG: u8 = 128;
pub const ARTIFACT_V2_SEED: &[u8] = b"artifact-v2";
pub const MEMBER_SEED: &[u8] = b"member-v2";
pub const REQUEST_SEED: &[u8] = b"reissue-v2";
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, PartialEq, Eq)]
pub struct Artifact {
    pub version: u8,
    pub artifact_id: [u8; 32],
    pub originator: Pubkey,
    pub policy_commitment: [u8; 32],
    pub epoch: u64,
    pub ciphertext_commitment: [u8; 32],
    pub locator_commitment: [u8; 32],
    pub revision: u64,
}
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, PartialEq, Eq)]
pub struct Member {
    pub version: u8,
    pub artifact: Pubkey,
    pub identity: Pubkey,
    pub key_commitment: [u8; 32],
    pub envelope_commitment: [u8; 32],
    pub revision: u64,
}
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug, PartialEq, Eq)]
pub struct Request {
    pub version: u8,
    pub member: Pubkey,
    pub replacement_key: [u8; 32],
    pub member_revision: u64,
    pub fulfilled: bool,
}
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
pub enum Command {
    Initialize {
        artifact_id: [u8; 32],
        policy: [u8; 32],
        epoch: u64,
        ciphertext: [u8; 32],
        locator: [u8; 32],
        key: [u8; 32],
        envelope: [u8; 32],
    },
    Grant {
        recipient: Pubkey,
        key: [u8; 32],
        envelope: [u8; 32],
        expected_revision: u64,
        operation_id: [u8; 32],
    },
    RequestReissue {
        key: [u8; 32],
        member_revision: u64,
    },
    FulfillReissue {
        envelope: [u8; 32],
        expected_revision: u64,
    },
}
pub fn instruction(command: Command, accounts: Vec<AccountMeta>) -> Instruction {
    let mut data = vec![TAG];
    data.extend(borsh::to_vec(&command).expect("serialize KEP command"));
    Instruction {
        program_id: ID,
        accounts,
        data,
    }
}
pub fn artifact_address(id: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[ARTIFACT_V2_SEED, id], &ID)
}
pub fn member_address(artifact: &Pubkey, identity: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[MEMBER_SEED, artifact.as_ref(), identity.as_ref()], &ID)
}
fn check(ok: bool) -> ProgramResult {
    if ok {
        Ok(())
    } else {
        Err(ProtocolProgramError::AuthorityRejected.into())
    }
}
pub fn read_artifact(a: &AccountInfo) -> Result<Artifact, ProgramError> {
    require_program_owner(&ID, a)?;
    let s: Artifact = read_account(a)?;
    check(s.version == 2 && artifact_address(&s.artifact_id).0 == *a.key)?;
    Ok(s)
}
pub fn read_member(
    a: &AccountInfo,
    artifact: &Pubkey,
    identity: &Pubkey,
) -> Result<Member, ProgramError> {
    require_program_owner(&ID, a)?;
    let m: Member = read_account(a)?;
    check(
        m.version == 2
            && m.artifact == *artifact
            && m.identity == *identity
            && member_address(artifact, identity).0 == *a.key,
    )?;
    Ok(m)
}
fn make<'a, T: BorshSerialize>(
    payer: &AccountInfo<'a>,
    dest: &AccountInfo<'a>,
    system: &AccountInfo<'a>,
    state: &T,
    seeds: &[&[u8]],
) -> ProgramResult {
    create_owned_pda(&ID, payer, dest, system, borsh::to_vec(state)?.len(), seeds)?;
    write_account(dest, state)
}
pub fn process(accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    let cmd =
        Command::try_from_slice(data).map_err(|_| ProtocolProgramError::InvalidInstruction)?;
    match cmd {
        Command::Initialize {
            artifact_id,
            policy,
            epoch,
            ciphertext,
            locator,
            key,
            envelope,
        } => {
            let [payer, originator, art, member, system] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };
            require_signer(payer)?;
            require_signer(originator)?;
            require_system(system)?;
            check(
                epoch > 0
                    && [artifact_id, policy, ciphertext, locator, key, envelope]
                        .iter()
                        .all(|x| !is_zero(x)),
            )?;
            let (ap, ab) = artifact_address(&artifact_id);
            check(ap == *art.key)?;
            let (mp, mb) = member_address(art.key, originator.key);
            check(mp == *member.key)?;
            let a = Artifact {
                version: 2,
                artifact_id,
                originator: *originator.key,
                policy_commitment: policy,
                epoch,
                ciphertext_commitment: ciphertext,
                locator_commitment: locator,
                revision: 0,
            };
            make(
                payer,
                art,
                system,
                &a,
                &[ARTIFACT_V2_SEED, &artifact_id, &[ab]],
            )?;
            make(
                payer,
                member,
                system,
                &Member {
                    version: 2,
                    artifact: *art.key,
                    identity: *originator.key,
                    key_commitment: key,
                    envelope_commitment: envelope,
                    revision: 0,
                },
                &[
                    MEMBER_SEED,
                    art.key.as_ref(),
                    originator.key.as_ref(),
                    &[mb],
                ],
            )
        }
        Command::Grant {
            recipient,
            key,
            envelope,
            expected_revision,
            operation_id,
        } => {
            let [payer, seller, art, seller_member, buyer_member, replay, system] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };
            require_signer(payer)?;
            require_signer(seller)?;
            require_system(system)?;
            let mut a = read_artifact(art)?;
            read_member(seller_member, art.key, seller.key)?;
            check(
                a.revision == expected_revision
                    && recipient != Pubkey::default()
                    && recipient != *seller.key
                    && !is_zero(&key)
                    && !is_zero(&envelope)
                    && !is_zero(&operation_id),
            )?;
            let (bp, bb) = member_address(art.key, &recipient);
            check(bp == *buyer_member.key)?;
            let rb = require_pda(&ID, replay, &[REPLAY_SEED, &a.artifact_id, &operation_id])?;
            a.revision = a
                .revision
                .checked_add(1)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            make(
                payer,
                buyer_member,
                system,
                &Member {
                    version: 2,
                    artifact: *art.key,
                    identity: recipient,
                    key_commitment: key,
                    envelope_commitment: envelope,
                    revision: a.revision,
                },
                &[MEMBER_SEED, art.key.as_ref(), recipient.as_ref(), &[bb]],
            )?;
            make(
                payer,
                replay,
                system,
                &ReplayMarker {
                    version: 2,
                    operation_id,
                },
                &[REPLAY_SEED, &a.artifact_id, &operation_id, &[rb]],
            )?;
            write_account(art, &a)
        }
        Command::RequestReissue {
            key,
            member_revision,
        } => {
            let [payer, recipient, art, member, request, system] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };
            require_signer(payer)?;
            require_signer(recipient)?;
            require_system(system)?;
            read_artifact(art)?;
            let m = read_member(member, art.key, recipient.key)?;
            check(m.revision == member_revision && !is_zero(&key))?;
            let rev = member_revision.to_le_bytes();
            let rb = require_pda(&ID, request, &[REQUEST_SEED, member.key.as_ref(), &rev])?;
            make(
                payer,
                request,
                system,
                &Request {
                    version: 2,
                    member: *member.key,
                    replacement_key: key,
                    member_revision,
                    fulfilled: false,
                },
                &[REQUEST_SEED, member.key.as_ref(), &rev, &[rb]],
            )
        }
        Command::FulfillReissue {
            envelope,
            expected_revision,
        } => {
            let [seller, art, seller_member, member, request] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };
            require_signer(seller)?;
            let mut a = read_artifact(art)?;
            read_member(seller_member, art.key, seller.key)?;
            require_program_owner(&ID, member)?;
            let mut m: Member = read_account(member)?;
            read_member(member, art.key, &m.identity)?;
            require_program_owner(&ID, request)?;
            let mut r: Request = read_account(request)?;
            require_pda(
                &ID,
                request,
                &[
                    REQUEST_SEED,
                    member.key.as_ref(),
                    &r.member_revision.to_le_bytes(),
                ],
            )?;
            check(
                r.version == 2
                    && r.member == *member.key
                    && !r.fulfilled
                    && r.member_revision == m.revision
                    && a.revision == expected_revision
                    && !is_zero(&envelope),
            )?;
            a.revision = a
                .revision
                .checked_add(1)
                .ok_or(ProgramError::ArithmeticOverflow)?;
            m.key_commitment = r.replacement_key;
            m.envelope_commitment = envelope;
            m.revision = a.revision;
            r.fulfilled = true;
            write_account(art, &a)?;
            write_account(member, &m)?;
            write_account(request, &r)
        }
    }
}
