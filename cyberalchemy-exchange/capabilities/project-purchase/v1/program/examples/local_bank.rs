#![allow(deprecated)]
//! Ephemeral local Solana bank for the reference demo. No RPC or mainnet access.
use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_exchange_purchase as purchase;
use cyberalchemy_kep_solana_program as kep;
use serde_json::{json, Value};
use solana_program::{clock::Clock, program_option::COption, program_pack::Pack};
use solana_program_test::{processor, ProgramTest};
use solana_sdk::{account::Account, pubkey::Pubkey, transaction::Transaction};
use spl_token_interface::state::{Account as TokenAccount, AccountState, Mint};
use std::{
    io::{self, BufRead, Write},
    str::FromStr,
};
fn pk(v: &Value) -> Pubkey {
    Pubkey::from_str(v.as_str().expect("public key string")).expect("public key")
}
fn reply(v: Value) {
    println!("{v}");
    io::stdout().flush().unwrap();
}
#[tokio::main]
async fn main() {
    assert!(
        cfg!(feature = "local-test-mint"),
        "local bank requires local-test-mint"
    );
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();
    let initial: Value = serde_json::from_str(&lines.next().expect("genesis").unwrap()).unwrap();
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
    pt.add_program(
        "spl_token",
        spl_token_interface::ID,
        processor!(spl_token::processor::Processor::process),
    );
    let mut supply = 0u64;
    for wallet in initial["wallets"].as_array().expect("wallets") {
        let owner = pk(&wallet["wallet"]);
        pt.add_account(
            owner,
            Account {
                lamports: 10_000_000_000,
                ..Account::default()
            },
        );
        let amount = wallet["amount"].as_u64().expect("integer amount");
        supply = supply.checked_add(amount).unwrap();
        let token = TokenAccount {
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
        TokenAccount::pack(token, &mut data).unwrap();
        pt.add_account(
            pk(&wallet["token"]),
            Account {
                lamports: 10_000_000,
                data,
                owner: spl_token_interface::ID,
                executable: false,
                rent_epoch: 0,
            },
        );
    }
    let mut data = vec![0; Mint::LEN];
    Mint::pack(
        Mint {
            mint_authority: COption::None,
            supply,
            decimals: 6,
            is_initialized: true,
            freeze_authority: COption::None,
        },
        &mut data,
    )
    .unwrap();
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
    reply(
        json!({"ready":true,"network":"ephemeral-local-bank","mint":purchase::PAYMENT_MINT.to_string()}),
    );
    for line in lines {
        let request: Value = serde_json::from_str(&line.unwrap()).unwrap();
        let result = match request["method"].as_str().unwrap_or("") {
            "blockhash" => {
                json!({"blockhash":c.banks_client.get_latest_blockhash().await.unwrap().to_string()})
            }
            "account" => match c
                .banks_client
                .get_account(pk(&request["key"]))
                .await
                .unwrap()
            {
                Some(a) => {
                    json!({"owner":a.owner.to_string(),"data":STANDARD.encode(a.data),"lamports":a.lamports})
                }
                None => Value::Null,
            },
            "clock" => {
                let clock: Clock = c.banks_client.get_sysvar().await.unwrap();
                json!({"timestamp":clock.unix_timestamp})
            }
            "advance" => {
                let mut clock: Clock = c.banks_client.get_sysvar().await.unwrap();
                clock.unix_timestamp += request["seconds"].as_i64().unwrap();
                c.set_sysvar(&clock);
                json!({"timestamp":clock.unix_timestamp})
            }
            "submit" => {
                let raw = STANDARD
                    .decode(request["transaction"].as_str().unwrap())
                    .unwrap();
                let tx: Transaction = bincode::deserialize(&raw).unwrap();
                if raw.len() > 1232 || tx.verify().is_err() {
                    json!({"error":"invalid signed transaction"})
                } else {
                    let signature = tx.signatures[0].to_string();
                    let result = c
                        .banks_client
                        .process_transaction_with_metadata(tx)
                        .await
                        .unwrap();
                    match result.result {
                        Ok(()) => {
                            json!({"signature":signature,"slot":c.banks_client.get_root_slot().await.unwrap(),"computeUnits":result.metadata.map(|m|m.compute_units_consumed)})
                        }
                        Err(e) => json!({"error":e.to_string()}),
                    }
                }
            }
            _ => json!({"error":"unknown local bank command"}),
        };
        reply(json!({"id":request["id"],"result":result}));
    }
}
