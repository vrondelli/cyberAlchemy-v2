#![allow(deprecated)]
use borsh::BorshDeserialize;
use cyberalchemy_exchange_purchase::{self as purchase, Order, PurchaseInstruction as P, Status};
use cyberalchemy_kep_solana_program::{self as kep, ArtifactState, ProtocolInstruction as K};
use solana_program::{clock::Clock, program_option::COption, program_pack::Pack};
use solana_program_test::{processor, ProgramTest, ProgramTestContext};
#[cfg(not(feature = "modern-sbf"))]
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta as A, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
#[cfg(feature = "modern-sbf")]
use {solana_account::Account, solana_instruction::{AccountMeta as A, Instruction},
     solana_pubkey::Pubkey, solana_keypair::Keypair, solana_signer::Signer,
     solana_transaction::Transaction};
use solana_sdk_ids::system_program;
use spl_token_interface::state::{Account as TokenAccount, AccountState, Mint};

fn ix<T: borsh::BorshSerialize>(program_id: Pubkey, data: T, accounts: Vec<A>) -> Instruction {
    Instruction {
        program_id,
        accounts,
        data: borsh::to_vec(&data).unwrap(),
    }
}
fn token_account(owner: Pubkey, amount: u64) -> Account {
    let state = TokenAccount {
        mint: purchase::PAYMENT_MINT,
        owner,
        amount,
        delegate: COption::None,
        state: AccountState::Initialized,
        is_native: COption::None,
        delegated_amount: 0,
        close_authority: COption::None,
    };
    let mut data = vec![0; TokenAccount::LEN];
    TokenAccount::pack(state, &mut data).unwrap();
    Account {
        lamports: 10_000_000,
        data,
        owner: spl_token_interface::ID,
        executable: false,
        rent_epoch: 0,
    }
}
struct Fixture {
    c: ProgramTestContext,
    buyer: Keypair,
    seller: Keypair,
    release: Keypair,
    source: Pubkey,
    destination: Pubkey,
    artifact: Pubkey,
    artifact_id: [u8; 32],
    order: Pubkey,
    vault: Pubkey,
    replay: Pubkey,
    id: [u8; 32],
    deadline: i64,
    v2: bool,
    revision: u64,
}
impl Fixture {
    async fn new() -> Self {
        Self::version(false).await
    }
    async fn version(v2: bool) -> Self {
        let buyer = Keypair::new();
        let seller = Keypair::new();
        let release = Keypair::new();
        let source = Pubkey::new_unique();
        let destination = Pubkey::new_unique();
        let sbf = std::env::var_os("EXCHANGE_SBF_TEST").is_some();
        #[cfg(feature = "modern-sbf")]
        assert!(sbf, "The modern harness requires EXCHANGE_SBF_TEST and compiled artifacts");
        if sbf {
            assert!(std::env::var_os("SBF_OUT_DIR").is_some(), "SBF_OUT_DIR required");
        } else {
            assert!(std::env::var_os("SBF_OUT_DIR").is_none()
                && std::env::var_os("BPF_OUT_DIR").is_none(), "Use EXCHANGE_SBF_TEST for binary tests");
        }
        let mut pt = ProgramTest::new(
            "cyberalchemy_exchange_purchase",
            purchase::ID,
            processor!(purchase::process_instruction),
        );
        pt.add_program(
            "cyberalchemy_kep_solana_program",
            kep::ID,
            processor!(kep::process_instruction),
        );
        // SPL Token is the pinned native processor; both Exchange programs above
        // must load SBF in binary mode (ProgramTest rejects missing artifacts).
        pt.prefer_bpf(false);
        #[cfg(not(feature = "modern-sbf"))]
        pt.add_program(
            "spl_token",
            spl_token_interface::ID,
            processor!(spl_token::processor::Processor::process),
        );
        pt.add_account(
            buyer.pubkey(),
            Account {
                lamports: 10_000_000_000,
                ..Account::default()
            },
        );
        pt.add_account(source, token_account(buyer.pubkey(), 1_000_000));
        pt.add_account(destination, token_account(seller.pubkey(), 0));
        let mint = Mint {
            mint_authority: COption::Some(seller.pubkey()),
            supply: 1_000_000,
            decimals: 6,
            is_initialized: true,
            freeze_authority: COption::Some(seller.pubkey()),
        };
        let mut data = vec![0; Mint::LEN];
        Mint::pack(mint, &mut data).unwrap();
        pt.add_account(
            purchase::PAYMENT_MINT,
            Account {
                lamports: 10_000_000,
                data,
                owner: spl_token_interface::ID,
                executable: false,
                rent_epoch: 0,
            },
        );
        let c = pt.start_with_context().await;
        let artifact_id = [1; 32];
        let id = [9; 32];
        let artifact = if v2 {
            kep::membership::artifact_address(&artifact_id).0
        } else {
            Pubkey::find_program_address(&[kep::ARTIFACT_SEED, &artifact_id], &kep::ID).0
        };
        let init_replay =
            Pubkey::find_program_address(&[kep::REPLAY_SEED, &artifact_id, &[2; 32]], &kep::ID).0;
        let order = purchase::order_address(&id).0;
        let vault = purchase::vault_address(&order).0;
        let replay =
            Pubkey::find_program_address(&[kep::REPLAY_SEED, &artifact_id, &id], &kep::ID).0;
        let clock: Clock = c.banks_client.get_sysvar().await.unwrap();
        let f = Self {
            c,
            buyer,
            seller,
            release,
            source,
            destination,
            artifact,
            artifact_id,
            order,
            vault,
            replay,
            id,
            deadline: clock.unix_timestamp + 100,
            v2,
            revision: 0,
        };
        let init = ix(
            kep::ID,
            K::InitializeArtifact {
                artifact_id,
                policy_commitment: [3; 32],
                epoch: 1,
                ciphertext_commitment: [4; 32],
                originator_envelope_commitment: [5; 32],
                locator_commitment: [6; 32],
                operation_id: [2; 32],
            },
            vec![
                A::new(f.c.payer.pubkey(), true),
                A::new_readonly(f.seller.pubkey(), true),
                A::new(artifact, false),
                A::new(init_replay, false),
                A::new_readonly(system_program::ID, false),
            ],
        );
        let init = if v2 {
            kep::membership::instruction(
                kep::membership::Command::Initialize {
                    artifact_id,
                    policy: [3; 32],
                    epoch: 1,
                    ciphertext: [4; 32],
                    locator: [6; 32],
                    key: [17; 32],
                    envelope: [5; 32],
                },
                vec![
                    A::new(f.c.payer.pubkey(), true),
                    A::new_readonly(f.seller.pubkey(), true),
                    A::new(artifact, false),
                    A::new(
                        kep::membership::member_address(&artifact, &f.seller.pubkey()).0,
                        false,
                    ),
                    A::new_readonly(system_program::ID, false),
                ],
            )
        } else {
            init
        };
        assert!(f.send(vec![init], &[&f.seller]).await);
        f
    }
    async fn send(&self, instructions: Vec<Instruction>, signers: &[&Keypair]) -> bool {
        let mut all = vec![&self.c.payer];
        all.extend_from_slice(signers);
        let hash = self.c.banks_client.get_latest_blockhash().await.unwrap();
        let tx = Transaction::new_signed_with_payer(
            &instructions,
            Some(&self.c.payer.pubkey()),
            &all,
            hash,
        );
        let wire_bytes = 1 + tx.signatures.len() * 64 + tx.message.serialize().len();
        assert!(wire_bytes <= 1232, "transaction too large: {wire_bytes}");
        let result = self
            .c
            .banks_client
            .process_transaction_with_metadata(tx)
            .await
            .unwrap();
        if let Some(m) = &result.metadata {
            println!(
                "wire_bytes={wire_bytes} compute_units={}",
                m.compute_units_consumed
            );
        }
        if let Err(error) = &result.result {
            eprintln!("transaction rejected: {error:?}; metadata={:?}", result.metadata);
        }
        result.result.is_ok()
    }
    fn fund(&self) -> Instruction {
        let mut i = ix(
            purchase::ID,
            P::Fund {
                id: self.id,
                amount: 500_000,
                deadline: self.deadline,
                retention_seconds: 3600,
                terms_commitment: [7; 32],
            },
            vec![
                A::new(self.buyer.pubkey(), true),
                A::new_readonly(self.seller.pubkey(), true),
                A::new_readonly(self.release.pubkey(), false),
                A::new_readonly(purchase::PAYMENT_MINT, false),
                A::new(self.source, false),
                A::new(self.destination, false),
                A::new_readonly(self.artifact, false),
                A::new(self.order, false),
                A::new(self.vault, false),
                A::new_readonly(system_program::ID, false),
                A::new_readonly(spl_token_interface::ID, false),
            ],
        );
        if self.v2 {
            i.accounts.push(A::new_readonly(
                kep::membership::member_address(&self.artifact, &self.seller.pubkey()).0,
                false,
            ));
        }
        i
    }
    fn prepare(&self) -> Instruction {
        let mut i = ix(
            purchase::ID,
            P::Prepare {
                key_commitment: [18; 32],
                envelope_commitment: [8; 32],
                expected_revision: self.revision,
            },
            vec![
                A::new_readonly(self.buyer.pubkey(), true),
                A::new_readonly(self.seller.pubkey(), true),
                A::new_readonly(self.release.pubkey(), true),
                A::new(self.order, false),
                A::new_readonly(self.artifact, false),
            ],
        );
        if self.v2 {
            i.accounts.push(A::new_readonly(
                kep::membership::member_address(&self.artifact, &self.seller.pubkey()).0,
                false,
            ));
        }
        i
    }
    fn unlock(&self) -> Instruction {
        let mut i = ix(
            purchase::ID,
            P::Unlock,
            vec![
                A::new(self.c.payer.pubkey(), true),
                A::new_readonly(self.buyer.pubkey(), true),
                A::new_readonly(self.seller.pubkey(), true),
                A::new_readonly(self.release.pubkey(), true),
                A::new(self.order, false),
                A::new(self.vault, false),
                A::new_readonly(purchase::PAYMENT_MINT, false),
                A::new(self.destination, false),
                A::new(self.artifact, false),
                A::new(self.replay, false),
                A::new_readonly(system_program::ID, false),
                A::new_readonly(spl_token_interface::ID, false),
                A::new_readonly(kep::ID, false),
            ],
        );
        if self.v2 {
            i.accounts.extend([
                A::new_readonly(
                    kep::membership::member_address(&self.artifact, &self.seller.pubkey()).0,
                    false,
                ),
                A::new(
                    kep::membership::member_address(&self.artifact, &self.buyer.pubkey()).0,
                    false,
                ),
            ]);
        }
        i
    }
    fn refund(&self) -> Instruction {
        ix(
            purchase::ID,
            P::Refund,
            vec![
                A::new(self.order, false),
                A::new(self.vault, false),
                A::new_readonly(purchase::PAYMENT_MINT, false),
                A::new(self.source, false),
                A::new_readonly(spl_token_interface::ID, false),
            ],
        )
    }
    async fn ready(&self) {
        assert!(
            self.send(vec![self.fund()], &[&self.buyer, &self.seller])
                .await
        );
        assert!(
            self.send(
                vec![self.prepare()],
                &[&self.buyer, &self.seller, &self.release]
            )
            .await
        );
    }
    async fn account(&self, key: Pubkey) -> Account {
        self.c.banks_client.get_account(key).await.unwrap().unwrap()
    }
    async fn amount(&self, key: Pubkey) -> u64 {
        TokenAccount::unpack(&self.account(key).await.data)
            .unwrap()
            .amount
    }
    async fn order(&self) -> Order {
        Order::try_from_slice(&self.account(self.order).await.data).unwrap()
    }
    async fn snapshot(&self) -> Vec<Option<Account>> {
        let mut out = vec![];
        for k in [
            self.order,
            self.vault,
            self.source,
            self.destination,
            self.artifact,
            self.replay,
        ] {
            out.push(self.c.banks_client.get_account(k).await.unwrap());
        }
        out
    }
}

#[tokio::test]
async fn payment_failure_rolls_back_real_kep_grant_and_retry_commits_once() {
    let f = Fixture::new().await;
    f.ready().await;
    let freeze = spl_token_interface::instruction::freeze_account(
        &spl_token_interface::ID,
        &f.destination,
        &purchase::PAYMENT_MINT,
        &f.seller.pubkey(),
        &[],
    )
    .unwrap();
    assert!(f.send(vec![freeze], &[&f.seller]).await);
    let before = f.snapshot().await;
    assert!(
        !f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(
        before,
        f.snapshot().await,
        "failed token CPI must undo KEP mutation and replay PDA creation"
    );
    let thaw = spl_token_interface::instruction::thaw_account(
        &spl_token_interface::ID,
        &f.destination,
        &purchase::PAYMENT_MINT,
        &f.seller.pubkey(),
        &[],
    )
    .unwrap();
    assert!(f.send(vec![thaw], &[&f.seller]).await);
    // Change the message after the failed transaction so the bank does not replay its cached failure.
    let budget =
        solana_compute_budget_interface::ComputeBudgetInstruction::set_compute_unit_limit(300_000);
    assert!(
        f.send(vec![budget, f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(f.order().await.status, Status::Committed);
    assert_eq!(
        (
            f.amount(f.source).await,
            f.amount(f.vault).await,
            f.amount(f.destination).await
        ),
        (500_000, 0, 500_000)
    );
    let art = ArtifactState::try_from_slice(&f.account(f.artifact).await.data).unwrap();
    assert_eq!(art.originator, f.seller.pubkey());
    assert_eq!(art.recipient, f.buyer.pubkey());
    assert_eq!(art.recipient_envelope_commitment, [8; 32]);
    let before = f.snapshot().await;
    let budget =
        solana_compute_budget_interface::ComputeBudgetInstruction::set_compute_unit_limit(300_001);
    assert!(
        !f.send(vec![budget, f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert!(!f.send(vec![f.refund()], &[]).await);
    assert_eq!(before, f.snapshot().await);
}

#[tokio::test]
async fn later_transaction_failure_rolls_back_grant_payment_and_completion() {
    let f = Fixture::new().await;
    f.ready().await;
    let before = f.snapshot().await;
    let fail = solana_system_interface::instruction::transfer(
        &f.buyer.pubkey(),
        &f.seller.pubkey(),
        u64::MAX,
    );
    assert!(
        !f.send(vec![f.unlock(), fail], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(before, f.snapshot().await);
}

#[tokio::test]
async fn stale_kep_revision_cannot_pay_seller() {
    let f = Fixture::new().await;
    f.ready().await;
    // Another valid free grant consumes the current one-recipient artifact before Unlock.
    let op = [88; 32];
    let replay = Pubkey::find_program_address(&[kep::REPLAY_SEED, &f.artifact_id, &op], &kep::ID).0;
    let grant = ix(
        kep::ID,
        K::GrantCoownership {
            recipient: Pubkey::new_unique(),
            recipient_key_commitment: [88; 32],
            recipient_envelope_commitment: [89; 32],
            expected_revision: 0,
            operation_id: op,
        },
        vec![
            A::new(f.c.payer.pubkey(), true),
            A::new_readonly(f.seller.pubkey(), true),
            A::new(f.artifact, false),
            A::new(replay, false),
            A::new_readonly(system_program::ID, false),
        ],
    );
    assert!(f.send(vec![grant], &[&f.seller]).await);
    let before = f.snapshot().await;
    assert!(
        !f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(before, f.snapshot().await);
}

#[tokio::test]
async fn expiry_wins_at_exact_chain_deadline_and_refunds_only_buyer() {
    let f = Fixture::new().await;
    f.ready().await;
    assert!(!f.send(vec![f.refund()], &[]).await);
    let mut clock: Clock = f.c.banks_client.get_sysvar().await.unwrap();
    clock.unix_timestamp = f.deadline;
    f.c.set_sysvar(&clock);
    assert!(
        !f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    let budget =
        solana_compute_budget_interface::ComputeBudgetInstruction::set_compute_unit_limit(300_000);
    assert!(f.send(vec![budget, f.refund()], &[]).await);
    assert_eq!(f.order().await.status, Status::Refunded);
    assert_eq!(
        (
            f.amount(f.source).await,
            f.amount(f.vault).await,
            f.amount(f.destination).await
        ),
        (1_000_000, 0, 0)
    );
    let art = ArtifactState::try_from_slice(&f.account(f.artifact).await.data).unwrap();
    assert!(!art.has_recipient);
    let before = f.snapshot().await;
    let budget =
        solana_compute_budget_interface::ComputeBudgetInstruction::set_compute_unit_limit(300_001);
    assert!(!f.send(vec![budget, f.refund()], &[]).await);
    assert_eq!(before, f.snapshot().await);
}

#[tokio::test]
async fn readiness_and_destination_authorization_cannot_be_bypassed() {
    let f = Fixture::new().await;
    assert!(f.send(vec![f.fund()], &[&f.buyer, &f.seller]).await);
    assert!(
        !f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    let mut prepare = f.prepare();
    prepare.accounts[2].is_signer = false;
    assert!(!f.send(vec![prepare], &[&f.buyer, &f.seller]).await);
    assert!(
        f.send(vec![f.prepare()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    let before = f.snapshot().await;
    let mut unlock = f.unlock();
    unlock.accounts[7] = A::new(f.source, false);
    assert!(
        !f.send(vec![unlock], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    let mut unlock = f.unlock();
    unlock.accounts[2].is_signer = false;
    assert!(!f.send(vec![unlock], &[&f.buyer, &f.release]).await);
    assert_eq!(before, f.snapshot().await);
}

#[tokio::test]
async fn multiple_buyers_preserve_membership_allow_resale_and_reissue_only_requested_member() {
    let mut f = Fixture::version(true).await;
    f.ready().await;
    assert!(
        f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    let originator = f.seller.pubkey();
    let first_buyer = f.buyer.pubkey();
    let origin_member = kep::membership::member_address(&f.artifact, &originator).0;
    let first_member = kep::membership::member_address(&f.artifact, &first_buyer).0;
    let original = f.account(origin_member).await;
    let first = f.account(first_member).await;
    // First buyer is now an authorized co-owner and can sell to the second buyer.
    f.seller = f.buyer;
    f.buyer = Keypair::new();
    f.destination = f.source;
    f.source = Pubkey::new_unique();
    f.c.set_account(
        &f.buyer.pubkey(),
        &Account {
            lamports: 10_000_000_000,
            ..Account::default()
        }
        .into(),
    );
    f.c.set_account(
        &f.source,
        &token_account(f.buyer.pubkey(), 1_000_000).into(),
    );
    f.id = [10; 32];
    f.order = purchase::order_address(&f.id).0;
    f.vault = purchase::vault_address(&f.order).0;
    f.replay = Pubkey::find_program_address(&[kep::REPLAY_SEED, &f.artifact_id, &f.id], &kep::ID).0;
    f.revision = 1;
    f.ready().await;
    assert!(
        f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(original, f.account(origin_member).await);
    assert_eq!(first, f.account(first_member).await);
    let second_member = kep::membership::member_address(&f.artifact, &f.buyer.pubkey()).0;
    let second =
        kep::membership::Member::try_from_slice(&f.account(second_member).await.data).unwrap();
    assert_eq!(second.revision, 2);
    assert_eq!(f.order().await.status, Status::Committed);
    let request = Pubkey::find_program_address(
        &[
            kep::membership::REQUEST_SEED,
            second_member.as_ref(),
            &2u64.to_le_bytes(),
        ],
        &kep::ID,
    )
    .0;
    let req = kep::membership::instruction(
        kep::membership::Command::RequestReissue {
            key: [33; 32],
            member_revision: 2,
        },
        vec![
            A::new(f.c.payer.pubkey(), true),
            A::new_readonly(f.buyer.pubkey(), true),
            A::new_readonly(f.artifact, false),
            A::new_readonly(second_member, false),
            A::new(request, false),
            A::new_readonly(system_program::ID, false),
        ],
    );
    assert!(f.send(vec![req], &[&f.buyer]).await);
    let fulfill = kep::membership::instruction(
        kep::membership::Command::FulfillReissue {
            envelope: [34; 32],
            expected_revision: 2,
        },
        vec![
            A::new_readonly(f.seller.pubkey(), true),
            A::new(f.artifact, false),
            A::new_readonly(first_member, false),
            A::new(second_member, false),
            A::new(request, false),
        ],
    );
    assert!(f.send(vec![fulfill], &[&f.seller]).await);
    let renewed =
        kep::membership::Member::try_from_slice(&f.account(second_member).await.data).unwrap();
    assert_eq!(renewed.identity, second.identity);
    assert_eq!(renewed.key_commitment, [33; 32]);
    assert_eq!(original, f.account(origin_member).await);
    assert_eq!(first, f.account(first_member).await);
    assert_eq!(f.order().await.status, Status::Committed);
}

#[tokio::test]
async fn v2_failed_payment_removes_new_membership_and_expired_unlock_cannot_win() {
    let f = Fixture::version(true).await;
    f.ready().await;
    let freeze = spl_token_interface::instruction::freeze_account(
        &spl_token_interface::ID,
        &f.destination,
        &purchase::PAYMENT_MINT,
        &f.seller.pubkey(),
        &[],
    )
    .unwrap();
    assert!(f.send(vec![freeze], &[&f.seller]).await);
    let before = f.snapshot().await;
    assert!(
        !f.send(vec![f.unlock()], &[&f.buyer, &f.seller, &f.release])
            .await
    );
    assert_eq!(before, f.snapshot().await);
    assert!(f
        .c
        .banks_client
        .get_account(kep::membership::member_address(&f.artifact, &f.buyer.pubkey()).0)
        .await
        .unwrap()
        .is_none());
    let mut clock: Clock = f.c.banks_client.get_sysvar().await.unwrap();
    clock.unix_timestamp = f.deadline;
    f.c.set_sysvar(&clock);
    assert!(f.send(vec![f.refund()], &[]).await);
    assert_eq!(f.order().await.status, Status::Refunded);
}

#[tokio::test]
async fn funding_failure_leaves_no_vault_or_order_and_wrong_membership_is_rejected() {
    let f = Fixture::version(true).await;
    let mut wrong = f.fund();
    wrong.accounts[11] = A::new_readonly(f.artifact, false);
    assert!(!f.send(vec![wrong], &[&f.buyer, &f.seller]).await);
    let freeze = spl_token_interface::instruction::freeze_account(
        &spl_token_interface::ID,
        &f.source,
        &purchase::PAYMENT_MINT,
        &f.seller.pubkey(),
        &[],
    )
    .unwrap();
    assert!(f.send(vec![freeze], &[&f.seller]).await);
    let before = f.snapshot().await;
    assert!(!f.send(vec![f.fund()], &[&f.buyer, &f.seller]).await);
    assert_eq!(before, f.snapshot().await);
    assert!(f
        .c
        .banks_client
        .get_account(f.order)
        .await
        .unwrap()
        .is_none());
    assert!(f
        .c
        .banks_client
        .get_account(f.vault)
        .await
        .unwrap()
        .is_none());
}
