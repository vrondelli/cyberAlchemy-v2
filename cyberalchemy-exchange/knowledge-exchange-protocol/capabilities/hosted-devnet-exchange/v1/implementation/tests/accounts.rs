use axum::{body::Body,http::{Request,StatusCode},Router};
use base64::{engine::general_purpose::STANDARD,Engine};
use cyberalchemy_kep_hosted_devnet::{accounts::*,auth::*,model::Authorization,router,Application,FinalityGateway,MockFinalityGateway};
use ed25519_dalek::{Signer,SigningKey};
use http_body_util::BodyExt;
use serde::Serialize;
use serde_json::Value;
use tower::ServiceExt;
fn wallet(k:&SigningKey)->String{bs58::encode(k.verifying_key().to_bytes()).into_string()}
fn auth(k:&SigningKey,m:String)->Authorization{Authorization{signature_base64:STANDARD.encode(k.sign(m.as_bytes()).to_bytes()),message:m}}
fn read_req(k:&SigningKey)->AccountRead{let mut r=AccountRead{wallet_public_key:wallet(k),expires_at:1090,authorization:auth(k,String::new())};r.authorization=auth(k,r.message());r}
fn write_req(k:&SigningKey,rev:u64,byte:u8)->AccountWrite{let bytes=[byte;64];let mut r=AccountWrite{wallet_public_key:wallet(k),expires_at:1090,expected_revision:rev,ciphertext_base64:STANDARD.encode(bytes),ciphertext_sha256:sha256_hex(&bytes),authorization:auth(k,String::new())};r.authorization=auth(k,r.message());r}
async fn call<T:Serialize>(app:&Router,path:&str,r:&T)->(StatusCode,Value){let res=app.clone().oneshot(Request::post(path).header("content-type","application/json").body(Body::from(serde_json::to_vec(r).unwrap())).unwrap()).await.unwrap();let status=res.status();let bytes=res.into_body().collect().await.unwrap().to_bytes();(status,serde_json::from_slice(&bytes).unwrap_or(Value::Null))}
async fn memory()->Application{Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await.with_clock(||1000)}
#[tokio::test]
async fn account_isolation_replay_conflicts_and_ciphertext_binding(){
 let state=memory().await;let app=router(state.clone());let a=SigningKey::from_bytes(&[41;32]);let b=SigningKey::from_bytes(&[42;32]);
 let r=write_req(&a,0,1);assert_eq!(call(&app,"/v1/account/write",&r).await.0,StatusCode::OK);assert_eq!(call(&app,"/v1/account/write",&r).await.1["revision"],1);
 assert_eq!(call(&app,"/v1/account/read",&read_req(&b)).await.1["account"],Value::Null);
 let mut stolen=read_req(&a);stolen.authorization=auth(&b,stolen.message());assert_eq!(call(&app,"/v1/account/read",&stolen).await.0,StatusCode::FORBIDDEN);
 let mut tampered=write_req(&a,1,2);tampered.ciphertext_base64=STANDARD.encode([3;64]);assert_eq!(call(&app,"/v1/account/write",&tampered).await.0,StatusCode::BAD_REQUEST);
 assert_eq!(call(&app,"/v1/account/write",&write_req(&a,0,4)).await.0,StatusCode::CONFLICT);
 assert_eq!(call(&app,"/v1/account/write",&write_req(&a,1,4)).await.0,StatusCode::OK);
 assert_eq!(call(&app,"/v1/account/write",&r).await.0,StatusCode::CONFLICT);
 let mut expired=read_req(&a);expired.expires_at=999;expired.authorization=auth(&a,expired.message());assert_eq!(call(&app,"/v1/account/read",&expired).await.0,StatusCode::FORBIDDEN);
 assert_eq!(state.snapshot().await.accounts[&wallet(&a)].revision,2);
}
#[tokio::test]
#[ignore="requires CA2_KEP_ACCOUNT_TEST_DATABASE_URL for a disposable account test database"]
async fn encrypted_account_survives_postgres_reload(){
 let url=std::env::var("CA2_KEP_ACCOUNT_TEST_DATABASE_URL").unwrap();
 let state=Application::postgres(&url,FinalityGateway::Mock(MockFinalityGateway::default())).await.unwrap().with_clock(||1000);
 let key=SigningKey::from_bytes(&[43;32]);let revision=state.snapshot().await.accounts.get(&wallet(&key)).map_or(0,|r|r.revision);
 assert_eq!(call(&router(state),"/v1/account/write",&write_req(&key,revision,7)).await.0,StatusCode::OK);
 let reopened=Application::postgres(&url,FinalityGateway::Mock(MockFinalityGateway::default())).await.unwrap().with_clock(||1000);
 let result=call(&router(reopened),"/v1/account/read",&read_req(&key)).await;assert_eq!(result.0,StatusCode::OK);assert_eq!(result.1["account"]["revision"],revision+1);assert_eq!(result.1["account"]["ciphertext_base64"],STANDARD.encode([7;64]));
}

#[tokio::test]
async fn discovery_lists_only_wallet_owned_file_packages(){
 use cyberalchemy_kep_hosted_devnet::{files::*,model::*};
 let app=router(memory().await);let a=SigningKey::from_bytes(&[51;32]);let b=SigningKey::from_bytes(&[52;32]);
 let public=STANDARD.encode([3;32]);let mut registration=RegisterIdentityRequest{operation_id:"account-identity".into(),identity_id:"account-a".into(),wallet_public_key:wallet(&a),encryption_public_key:public.clone(),encryption_key_version:1,authorization:auth(&a,String::new())};registration.authorization=auth(&a,register_message("account-identity","account-a",&wallet(&a),&public,1));assert_eq!(call(&app,"/v1/identities",&registration).await.0,StatusCode::OK);
 let bytes=[4;64];let mut upload=FileUploadRequest{artifact:CreateArtifactRequest{operation_id:"account-file".into(),artifact_version_id:"owned-file".into(),originator_id:"account-a".into(),policy_id:"policy".into(),encryption_epoch:1,ciphertext_base64:STANDARD.encode(bytes),ciphertext_sha256:sha256_hex(&bytes),originator_envelope_base64:STANDARD.encode(bytes),originator_envelope_sha256:sha256_hex(&bytes),authorization:auth(&a,String::new())},original_bytes:1,retention_policy:RETENTION_POLICY.into(),policy_accepted:true};upload.artifact.authorization=auth(&a,upload.message());assert_eq!(call(&app,"/v1/files",&upload).await.0,StatusCode::OK);
 let own=call(&app,"/v1/account/read",&read_req(&a)).await.1;assert_eq!(own["packages"][0]["artifact_id"],"owned-file");assert_eq!(own["packages"][0]["originator"],true);
 assert_eq!(call(&app,"/v1/account/read",&read_req(&b)).await.1["packages"].as_array().unwrap().len(),0);
}
