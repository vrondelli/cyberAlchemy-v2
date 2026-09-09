use super::*;
use crate::accounts::*;
use axum::extract::DefaultBodyLimit;
use serde_json::{json,Value};
pub(super) fn routes()->Router<Application>{Router::new()
 .route("/v1/account/read",post(read))
 .route("/v1/account/write",post(write).layer(DefaultBodyLimit::max(1_500_000)))}
fn fresh(expires:u64,now:u64)->Result<(),ApiError>{if expires<now||expires>now.saturating_add(120){Err(ApiError::forbidden("Account authorization expired; sign again."))}else{Ok(())}}
async fn read(State(app):State<Application>,Json(req):Json<AccountRead>)->Result<([(axum::http::HeaderName,&'static str);1],Json<Value>),ApiError>{
 fresh(req.expires_at,(app.clock)())?;
 verify_wallet_signature(&req.wallet_public_key,&req.authorization,&req.message()).map_err(ApiError::forbidden)?;
 let db=app.database.read().await;
 let ids:std::collections::BTreeSet<_>=db.identities.values().filter(|i|i.wallet_public_key==req.wallet_public_key).map(|i|i.identity_id.clone()).collect();
 let packages:Vec<_>=db.artifacts.values().filter(|a|a.owners.iter().any(|id|ids.contains(id))).filter_map(|a|db.files.get(&a.artifact_version_id).map(|f|json!({"artifact_id":a.artifact_version_id,"originator":ids.contains(&a.originator_id),"status":f.status(&a.artifact_version_id,(app.clock)())}))).collect();
 Ok(([(axum::http::header::CACHE_CONTROL,"no-store")],Json(json!({"account":db.accounts.get(&req.wallet_public_key),"packages":packages,"identities":db.identities.values().filter(|i|i.wallet_public_key==req.wallet_public_key).collect::<Vec<_>>()}))))
}
async fn write(State(app):State<Application>,Json(req):Json<AccountWrite>)->Result<Json<AccountRecord>,ApiError>{
 fresh(req.expires_at,(app.clock)())?;
 verify_wallet_signature(&req.wallet_public_key,&req.authorization,&req.message()).map_err(ApiError::forbidden)?;
 let bytes=verify_digest(&req.ciphertext_base64,&req.ciphertext_sha256,"account ciphertext").map_err(input)?;
 if !(28..=1_000_000).contains(&bytes.len()) {return Err(ApiError::bad("account_size","Encrypted account must contain 28 to 1000000 bytes."));}
 let next=req.expected_revision.checked_add(1).ok_or_else(||ApiError::bad("account_revision","Invalid account revision."))?;
 let mut guard=app.database.write().await;
 if let Some(existing)=guard.accounts.get(&req.wallet_public_key){
  if existing.revision==next&&existing.ciphertext_sha256==req.ciphertext_sha256{return Ok(Json(existing.clone()));}
 }
 if guard.accounts.get(&req.wallet_public_key).map_or(0,|x|x.revision)!=req.expected_revision{return Err(ApiError::conflict("Account changed in another session. Lock and unlock to load its latest revision before continuing."));}
 let record=AccountRecord{revision:next,ciphertext_base64:req.ciphertext_base64,ciphertext_sha256:req.ciphertext_sha256};
 let mut candidate=guard.clone();candidate.accounts.insert(req.wallet_public_key.clone(),record.clone());
 app.limits.validate_growth(&guard, &candidate).map_err(ApiError::capacity)?;
 app.persistence.save(&candidate,"encrypted_account_saved",&req.wallet_public_key).await.map_err(ApiError::unavailable)?;
 *guard=candidate;Ok(Json(record))
}
