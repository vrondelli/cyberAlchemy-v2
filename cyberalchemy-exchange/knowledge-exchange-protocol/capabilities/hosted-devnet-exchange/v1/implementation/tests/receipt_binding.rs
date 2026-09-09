use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{
    transition::TransitionExpectation, FinalityGateway, DEVNET_GENESIS_HASH, PROGRAM_ID,
};
use serde_json::{json, Value};
fn fixture(reissue: bool) -> (TransitionExpectation, Value, String) {
    let f: Value =
        serde_json::from_str(include_str!("fixtures/receipt-transactions.json")).unwrap();
    let i = &f["input"];
    let name = if reissue { "reissue" } else { "grant" };
    (
        TransitionExpectation {
            artifact_id: i["artifactId"].as_str().unwrap().into(),
            originator_wallet: i["walletPublicKey"].as_str().unwrap().into(),
            recipient_wallet: i["recipientWalletPublicKey"].as_str().unwrap().into(),
            recipient_key_base64: i["recipientEncryptionPublicKey"].as_str().unwrap().into(),
            envelope_sha256: i["recipientEnvelopeSha256"].as_str().unwrap().into(),
            expected_revision: 0,
            grant_operation_id: if reissue {
                None
            } else {
                Some("receipt-grant".into())
            },
        },
        f[name]["response"].clone(),
        f[name]["artifactAccount"].as_str().unwrap().into(),
    )
}
#[test]
fn browser_built_grant_and_reissue_match_expected_pdas_and_bytes() {
    for reissue in [false, true] {
        let (e, tx, account) = fixture(reissue);
        assert_eq!(
            e.verify_transaction(&tx, "fixture-signature", &account, 100)
                .unwrap(),
            100
        );
    }
}
#[test]
fn unrelated_failed_missing_or_ambiguous_transactions_are_rejected() {
    let (e, tx, account) = fixture(false);
    for mutation in 0..10 {
        let mut bad = tx.clone();
        match mutation {
            0 => bad["result"]["transaction"]["message"]["instructions"] = json!([]),
            1 => bad["result"]["meta"]["err"] = json!({"InstructionError":[0,"InvalidArgument"]}),
            2 => {
                bad["result"]["meta"].as_object_mut().unwrap().remove("err");
            }
            3 => bad["result"]["transaction"]["signatures"][0] = json!("another-signature"),
            4 => bad["result"]["slot"] = json!(99),
            5 => {
                bad["result"]["transaction"]["message"]["header"]["numRequiredSignatures"] =
                    json!(0)
            }
            6 => {
                bad["result"]["transaction"]["message"]["instructions"][0]["accounts"][2] =
                    json!(999)
            }
            7 => {
                let x = bad["result"]["transaction"]["message"]["instructions"][0].clone();
                bad["result"]["transaction"]["message"]["instructions"]
                    .as_array_mut()
                    .unwrap()
                    .push(x);
            }
            8 => bad["result"]["version"] = json!(1),
            _ => {
                bad["result"]["transaction"]["message"]["instructions"][0]["programIdIndex"] =
                    json!(999)
            }
        }
        assert!(
            e.verify_transaction(&bad, "fixture-signature", &account, 100)
                .is_err(),
            "mutation {mutation}"
        );
    }
    assert!(e
        .verify_transaction(
            &tx,
            "fixture-signature",
            "11111111111111111111111111111111",
            100
        )
        .is_err());
}
#[test]
fn all_bound_instruction_fields_reject_changes() {
    for reissue in [false, true] {
        let (e, tx, account) = fixture(reissue);
        let raw = bs58::decode(
            tx["result"]["transaction"]["message"]["instructions"][0]["data"]
                .as_str()
                .unwrap(),
        )
        .into_vec()
        .unwrap();
        for offset in if reissue {
            vec![0, 1, 33, 41]
        } else {
            vec![0, 1, 33, 65, 97, 105]
        } {
            let mut bad = tx.clone();
            let mut data = raw.clone();
            data[offset] ^= 1;
            bad["result"]["transaction"]["message"]["instructions"][0]["data"] =
                json!(bs58::encode(data).into_string());
            assert!(
                e.verify_transaction(&bad, "fixture-signature", &account, 100)
                    .is_err(),
                "reissue={reissue} offset={offset}"
            );
        }
    }
}
#[test]
fn v0_resolves_loaded_addresses_and_rejects_missing_addresses() {
    let (e, _, account) = fixture(false);
    let f: Value =
        serde_json::from_str(include_str!("fixtures/receipt-transactions.json")).unwrap();
    let mut tx = f["v0"]["response"].clone();
    assert!(e
        .verify_transaction(&tx, "fixture-signature", &account, 100)
        .is_ok());
    tx["result"]["meta"]["loadedAddresses"]["writable"] = json!([]);
    assert!(e
        .verify_transaction(&tx, "fixture-signature", &account, 100)
        .is_err());
}
async fn rpc_server(
    tx: Value,
    account_slot: u64,
    expected: TransitionExpectation,
) -> (FinalityGateway, tokio::task::JoinHandle<()>) {
    use axum::{routing::post, Json, Router};
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    let app=Router::new().route("/",post(move |Json(req):Json<Value>| {
        let tx=tx.clone();let e=expected.clone();async move {
            let response=match req["method"].as_str().unwrap() {
                "getGenesisHash"=>json!({"result":DEVNET_GENESIS_HASH}),
                "getSignatureStatuses"=>json!({"result":{"value":[{"err":null,"confirmationStatus":"finalized","slot":100}]}}),
                "getTransaction"=>tx,
                "getAccountInfo"=>{
                    assert_eq!(req["params"][1]["minContextSlot"],100);
                    // Borsh field order from runtime/solana-program/src/lib.rs::ArtifactState.
                    let mut bytes=vec![1];
                    bytes.extend(hex::decode(&e.artifact_id).unwrap());
                    bytes.extend(bs58::decode(&e.originator_wallet).into_vec().unwrap());
                    bytes.extend(bs58::decode(&e.recipient_wallet).into_vec().unwrap());
                    bytes.push(1);
                    bytes.extend([9;32]); // policy
                    bytes.extend(1u64.to_le_bytes()); // epoch
                    bytes.extend([8;32]); // ciphertext
                    bytes.extend([6;32]); // originator envelope
                    bytes.extend(e.key_digest().unwrap());
                    bytes.extend(hex::decode(&e.envelope_sha256).unwrap());
                    bytes.extend([5;32]); // key/envelope binding
                    bytes.extend([4;32]); // locator
                    bytes.extend(1u64.to_le_bytes());
                    json!({"result":{"context":{"slot":account_slot},"value":{"owner":PROGRAM_ID,"data":[STANDARD.encode(bytes),"base64"]}}})
                },
                other=>panic!("unexpected RPC {other}"),
            };Json(response)
        }
    }));
    let task = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });
    (FinalityGateway::devnet(url), task)
}
#[tokio::test]
async fn real_gateway_path_requires_transaction_binding_and_nonstale_state() {
    let (e, tx, account) = fixture(false);
    let (gateway, task) = rpc_server(tx.clone(), 100, e.clone()).await;
    let result = gateway
        .observe_transition("fixture-signature", &account, &e)
        .await;
    task.abort();
    assert_eq!(result.unwrap().revision, 1);
    let (gateway, task) = rpc_server(tx.clone(), 99, e.clone()).await;
    let result = gateway
        .observe_transition("fixture-signature", &account, &e)
        .await;
    task.abort();
    assert!(result.is_err());
    let mut unrelated = tx;
    unrelated["result"]["transaction"]["message"]["instructions"] = json!([]);
    let (gateway, task) = rpc_server(unrelated, 100, e.clone()).await;
    let result = gateway
        .observe_transition("fixture-signature", &account, &e)
        .await;
    task.abort();
    assert!(result.is_err());
}
