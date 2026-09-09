//! Exchange escrow composition. No plaintext, keys, or delivery bytes enter this program.
use borsh::{BorshDeserialize, BorshSerialize};
use cyberalchemy_kep_solana_program as kep;
use solana_program::{
    account_info::AccountInfo,
    clock::Clock,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use solana_sdk_ids::system_program;
use solana_system_interface::instruction::create_account;
use spl_token_interface::{
    instruction as token_ix,
    state::{Account as TokenAccount, Mint},
};

#[cfg(not(feature = "devnet-deployment"))]
pub const ID: Pubkey = Pubkey::new_from_array([0x66; 32]);
#[cfg(feature = "devnet-deployment")]
pub const ID: Pubkey = Pubkey::from_str_const(env!("EXCHANGE_PURCHASE_PROGRAM_ID"));
pub const ORDER_SEED: &[u8] = b"purchase-v1";
pub const VAULT_SEED: &[u8] = b"escrow-v1";
#[cfg(feature = "local-test-mint")]
pub const PAYMENT_MINT: Pubkey = Pubkey::new_from_array([0x71; 32]);
#[cfg(not(feature = "local-test-mint"))]
pub const PAYMENT_MINT: Pubkey =
    solana_program::pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum Status {
    Funded,
    Ready,
    Committed,
    Refunded,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Order {
    pub version: u8,
    pub id: [u8; 32],
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub release_authority: Pubkey,
    pub mint: Pubkey,
    pub buyer_token: Pubkey,
    pub seller_token: Pubkey,
    pub artifact: Pubkey,
    pub amount: u64,
    pub deadline: i64,
    pub retention_seconds: u64,
    pub terms_commitment: [u8; 32],
    pub key_commitment: [u8; 32],
    pub envelope_commitment: [u8; 32],
    pub expected_revision: u64,
    pub status: Status,
    pub committed_at: i64,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug)]
pub enum PurchaseInstruction {
    /// Accounts: buyer/payer*, seller*, release authority, mint, buyer token,
    /// seller token, artifact, order, vault, system program, token program.
    Fund {
        id: [u8; 32],
        amount: u64,
        deadline: i64,
        retention_seconds: u64,
        terms_commitment: [u8; 32],
    },
    /// Accounts: buyer*, seller*, release authority*, order, artifact.
    /// Buyer signs exact key/envelope/revision, not merely an opaque HTTP request.
    Prepare {
        key_commitment: [u8; 32],
        envelope_commitment: [u8; 32],
        expected_revision: u64,
    },
    /// Accounts: payer*, buyer*, seller*, release authority*, order, vault,
    /// mint, seller token, artifact, KEP replay, system program, token program, KEP program.
    Unlock,
    /// Anyone can crank expiry, but the destination is fixed by the funded order.
    /// Accounts: order, vault, mint, buyer token, token program.
    Refund,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    Accounts = 100,
    Authority,
    State,
    Terms,
    Deadline,
    Mint,
    Pda,
    Artifact,
    Overflow,
}
impl From<Error> for ProgramError {
    fn from(e: Error) -> Self {
        Self::Custom(e as u32)
    }
}

#[cfg(not(feature = "no-entrypoint"))]
solana_program::entrypoint!(process_instruction);

pub fn order_address(id: &[u8; 32]) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[ORDER_SEED, id], &ID)
}
pub fn vault_address(order: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[VAULT_SEED, order.as_ref()], &ID)
}
fn require(ok: bool, e: Error) -> ProgramResult {
    if ok {
        Ok(())
    } else {
        Err(e.into())
    }
}
fn signer(a: &AccountInfo) -> ProgramResult {
    require(a.is_signer, Error::Authority)
}
fn key(a: &AccountInfo, expected: &Pubkey) -> ProgramResult {
    require(a.key == expected, Error::Accounts)
}
fn writable(a: &AccountInfo) -> ProgramResult {
    require(a.is_writable, Error::Accounts)
}
fn program(a: &AccountInfo, expected: &Pubkey) -> ProgramResult {
    key(a, expected)?;
    require(a.executable, Error::Accounts)
}
fn save(a: &AccountInfo, o: &Order) -> ProgramResult {
    writable(a)?;
    o.serialize(&mut &mut a.try_borrow_mut_data()?[..])
        .map_err(|_| ProgramError::InvalidAccountData)
}
pub fn read_order(a: &AccountInfo) -> Result<Order, ProgramError> {
    require(a.owner == &ID, Error::Accounts)?;
    let o = Order::try_from_slice(&a.try_borrow_data()?)
        .map_err(|_| ProgramError::InvalidAccountData)?;
    require(
        o.version == 1 && order_address(&o.id).0 == *a.key,
        Error::Pda,
    )?;
    Ok(o)
}
struct ArtifactView {
    version: u8,
    artifact_id: [u8; 32],
    originator: Pubkey,
    revision: u64,
    has_recipient: bool,
}
fn artifact(a: &AccountInfo) -> Result<ArtifactView, ProgramError> {
    require(a.owner == &kep::ID, Error::Artifact)?;
    if a.try_borrow_data()?.first() == Some(&2) {
        let s = kep::membership::read_artifact(a)?;
        return Ok(ArtifactView {
            version: 2,
            artifact_id: s.artifact_id,
            originator: s.originator,
            revision: s.revision,
            has_recipient: false,
        });
    }
    let s =
        kep::ArtifactState::try_from_slice(&a.try_borrow_data()?).map_err(|_| Error::Artifact)?;
    let expected = Pubkey::find_program_address(&[kep::ARTIFACT_SEED, &s.artifact_id], &kep::ID).0;
    require(s.version == 1 && expected == *a.key, Error::Artifact)?;
    Ok(ArtifactView {
        version: 1,
        artifact_id: s.artifact_id,
        originator: s.originator,
        revision: s.revision,
        has_recipient: s.has_recipient,
    })
}
fn seller_authorized(
    s: &ArtifactView,
    art: &AccountInfo,
    seller: &Pubkey,
    extra: &[AccountInfo],
) -> ProgramResult {
    if s.version == 1 {
        require(
            extra.is_empty() && s.originator == *seller && !s.has_recipient,
            Error::Artifact,
        )
    } else {
        require(extra.len() == 1, Error::Accounts)?;
        kep::membership::read_member(&extra[0], art.key, seller)?;
        Ok(())
    }
}
fn token(a: &AccountInfo, mint: &Pubkey, owner: &Pubkey) -> Result<TokenAccount, ProgramError> {
    require(a.owner == &spl_token_interface::ID, Error::Mint)?;
    let t = TokenAccount::unpack(&a.try_borrow_data()?)?;
    require(t.mint == *mint && t.owner == *owner, Error::Mint)?;
    Ok(t)
}
fn mint(a: &AccountInfo) -> ProgramResult {
    key(a, &PAYMENT_MINT)?;
    require(a.owner == &spl_token_interface::ID, Error::Mint)?;
    let m = Mint::unpack(&a.try_borrow_data()?)?;
    require(m.decimals == 6, Error::Mint)
}
fn live(o: &Order) -> ProgramResult {
    require(Clock::get()?.unix_timestamp < o.deadline, Error::Deadline)
}
fn create<'a>(
    payer: &AccountInfo<'a>,
    dest: &AccountInfo<'a>,
    system: &AccountInfo<'a>,
    owner: &Pubkey,
    space: usize,
    seeds: &[&[u8]],
) -> ProgramResult {
    writable(dest)?;
    invoke_signed(
        &create_account(
            payer.key,
            dest.key,
            Rent::get()?.minimum_balance(space),
            space as u64,
            owner,
        ),
        &[payer.clone(), dest.clone(), system.clone()],
        &[seeds],
    )
}

pub fn process_instruction(program_id: &Pubkey, a: &[AccountInfo], data: &[u8]) -> ProgramResult {
    require(program_id == &ID, Error::Accounts)?;
    let ix = PurchaseInstruction::try_from_slice(data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    match ix {
        PurchaseInstruction::Fund {
            id,
            amount,
            deadline,
            retention_seconds,
            terms_commitment,
        } => {
            require(a.len() == 11 || a.len() == 12, Error::Accounts)?;
            let [buyer, seller, release, m, source, destination, art, order, vault, system, tp] =
                &a[..11]
            else {
                unreachable!()
            };
            signer(buyer)?;
            signer(seller)?;
            program(system, &system_program::ID)?;
            program(tp, &spl_token_interface::ID)?;
            mint(m)?;
            require(
                buyer.key != seller.key && *release.key != Pubkey::default(),
                Error::Terms,
            )?;
            require(
                id != [0; 32] && terms_commitment != [0; 32] && amount > 0 && retention_seconds > 0,
                Error::Terms,
            )?;
            require(
                retention_seconds <= i64::MAX as u64
                    && deadline.checked_add(retention_seconds as i64).is_some(),
                Error::Overflow,
            )?;
            let s = artifact(art)?;
            seller_authorized(&s, art, seller.key, &a[11..])?;
            token(source, m.key, buyer.key)?;
            token(destination, m.key, seller.key)?;
            let (oa, ob) = order_address(&id);
            key(order, &oa)?;
            let (va, vb) = vault_address(order.key);
            key(vault, &va)?;
            let o = Order {
                version: 1,
                id,
                buyer: *buyer.key,
                seller: *seller.key,
                release_authority: *release.key,
                mint: *m.key,
                buyer_token: *source.key,
                seller_token: *destination.key,
                artifact: *art.key,
                amount,
                deadline,
                retention_seconds,
                terms_commitment,
                key_commitment: [0; 32],
                envelope_commitment: [0; 32],
                expected_revision: 0,
                status: Status::Funded,
                committed_at: 0,
            };
            live(&o)?;
            create(
                buyer,
                order,
                system,
                &ID,
                borsh::to_vec(&o)?.len(),
                &[ORDER_SEED, &id, &[ob]],
            )?;
            create(
                buyer,
                vault,
                system,
                &spl_token_interface::ID,
                TokenAccount::LEN,
                &[VAULT_SEED, order.key.as_ref(), &[vb]],
            )?;
            invoke(
                &token_ix::initialize_account3(tp.key, vault.key, m.key, order.key)?,
                &[vault.clone(), m.clone(), tp.clone()],
            )?;
            invoke(
                &token_ix::transfer_checked(
                    tp.key,
                    source.key,
                    m.key,
                    vault.key,
                    buyer.key,
                    &[],
                    amount,
                    6,
                )?,
                &[
                    source.clone(),
                    m.clone(),
                    vault.clone(),
                    buyer.clone(),
                    tp.clone(),
                ],
            )?;
            save(order, &o)
        }
        PurchaseInstruction::Prepare {
            key_commitment,
            envelope_commitment,
            expected_revision,
        } => {
            require(a.len() == 5 || a.len() == 6, Error::Accounts)?;
            let [buyer, seller, release, order, art] = &a[..5] else {
                unreachable!()
            };
            let mut o = read_order(order)?;
            key(buyer, &o.buyer)?;
            signer(buyer)?;
            key(seller, &o.seller)?;
            signer(seller)?;
            key(release, &o.release_authority)?;
            signer(release)?;
            key(art, &o.artifact)?;
            live(&o)?;
            require(
                matches!(o.status, Status::Funded | Status::Ready),
                Error::State,
            )?;
            require(
                key_commitment != [0; 32] && envelope_commitment != [0; 32],
                Error::Terms,
            )?;
            let s = artifact(art)?;
            seller_authorized(&s, art, &o.seller, &a[5..])?;
            require(s.revision == expected_revision, Error::Artifact)?;
            // Repreparation is explicit: all three parties sign the new binding.
            o.key_commitment = key_commitment;
            o.envelope_commitment = envelope_commitment;
            o.expected_revision = expected_revision;
            o.status = Status::Ready;
            save(order, &o)
        }
        PurchaseInstruction::Unlock => {
            require(a.len() == 13 || a.len() == 15, Error::Accounts)?;
            let [payer, buyer, seller, release, order, vault, m, destination, art, replay, system, tp, kp] =
                &a[..13]
            else {
                unreachable!()
            };
            let mut o = read_order(order)?;
            signer(payer)?;
            key(buyer, &o.buyer)?;
            signer(buyer)?;
            key(seller, &o.seller)?;
            signer(seller)?;
            key(release, &o.release_authority)?;
            signer(release)?;
            require(o.status == Status::Ready, Error::State)?;
            live(&o)?;
            program(kp, &kep::ID)?;
            program(tp, &spl_token_interface::ID)?;
            program(system, &system_program::ID)?;
            key(art, &o.artifact)?;
            mint(m)?;
            key(m, &o.mint)?;
            key(vault, &vault_address(order.key).0)?;
            token(vault, m.key, order.key)?;
            key(destination, &o.seller_token)?;
            token(destination, m.key, &o.seller)?;
            let s = artifact(art)?;
            key(
                replay,
                &Pubkey::find_program_address(&[kep::REPLAY_SEED, &s.artifact_id, &o.id], &kep::ID)
                    .0,
            )?;
            if s.version == 1 {
                require(a.len() == 13, Error::Accounts)?;
                let grant = Instruction {
                    program_id: kep::ID,
                    accounts: vec![
                        AccountMeta::new(*payer.key, true),
                        AccountMeta::new_readonly(*seller.key, true),
                        AccountMeta::new(*art.key, false),
                        AccountMeta::new(*replay.key, false),
                        AccountMeta::new_readonly(*system.key, false),
                    ],
                    data: borsh::to_vec(&kep::ProtocolInstruction::GrantCoownership {
                        recipient: o.buyer,
                        recipient_key_commitment: o.key_commitment,
                        recipient_envelope_commitment: o.envelope_commitment,
                        expected_revision: o.expected_revision,
                        operation_id: o.id,
                    })?,
                };
                invoke(
                    &grant,
                    &[
                        payer.clone(),
                        seller.clone(),
                        art.clone(),
                        replay.clone(),
                        system.clone(),
                        kp.clone(),
                    ],
                )?;
            } else {
                require(a.len() == 15, Error::Accounts)?;
                let seller_member = &a[13];
                let buyer_member = &a[14];
                let grant = kep::membership::instruction(
                    kep::membership::Command::Grant {
                        recipient: o.buyer,
                        key: o.key_commitment,
                        envelope: o.envelope_commitment,
                        expected_revision: o.expected_revision,
                        operation_id: o.id,
                    },
                    vec![
                        AccountMeta::new(*payer.key, true),
                        AccountMeta::new_readonly(*seller.key, true),
                        AccountMeta::new(*art.key, false),
                        AccountMeta::new_readonly(*seller_member.key, false),
                        AccountMeta::new(*buyer_member.key, false),
                        AccountMeta::new(*replay.key, false),
                        AccountMeta::new_readonly(*system.key, false),
                    ],
                );
                invoke(
                    &grant,
                    &[
                        payer.clone(),
                        seller.clone(),
                        art.clone(),
                        seller_member.clone(),
                        buyer_member.clone(),
                        replay.clone(),
                        system.clone(),
                        kp.clone(),
                    ],
                )?;
            }
            // A token failure here must roll back the preceding real KEP invocation.
            payout(order, vault, m, destination, tp, &o)?;
            o.status = Status::Committed;
            o.committed_at = Clock::get()?.unix_timestamp;
            save(order, &o)
        }
        PurchaseInstruction::Refund => {
            require(a.len() == 5, Error::Accounts)?;
            let [order, vault, m, destination, tp] = a else {
                unreachable!()
            };
            let mut o = read_order(order)?;
            require(
                matches!(o.status, Status::Funded | Status::Ready),
                Error::State,
            )?;
            require(Clock::get()?.unix_timestamp >= o.deadline, Error::Deadline)?;
            program(tp, &spl_token_interface::ID)?;
            mint(m)?;
            key(m, &o.mint)?;
            key(vault, &vault_address(order.key).0)?;
            token(vault, m.key, order.key)?;
            key(destination, &o.buyer_token)?;
            token(destination, m.key, &o.buyer)?;
            payout(order, vault, m, destination, tp, &o)?;
            o.status = Status::Refunded;
            save(order, &o)
        }
    }
}
fn payout<'a>(
    order: &AccountInfo<'a>,
    vault: &AccountInfo<'a>,
    mint: &AccountInfo<'a>,
    destination: &AccountInfo<'a>,
    tp: &AccountInfo<'a>,
    o: &Order,
) -> ProgramResult {
    let bump = order_address(&o.id).1;
    invoke_signed(
        &token_ix::transfer_checked(
            tp.key,
            vault.key,
            mint.key,
            destination.key,
            order.key,
            &[],
            o.amount,
            6,
        )?,
        &[
            vault.clone(),
            mint.clone(),
            destination.clone(),
            order.clone(),
            tp.clone(),
        ],
        &[&[ORDER_SEED, &o.id, &[bump]]],
    )
}
