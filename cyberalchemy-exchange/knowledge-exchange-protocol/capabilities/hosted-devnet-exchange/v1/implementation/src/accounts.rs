//! Wallet-bound encrypted account documents; plaintext recovery material never enters this API.
use serde::{Deserialize, Serialize};
use crate::model::Authorization;
#[derive(Clone,Debug,Deserialize,Serialize)]
pub struct AccountRecord {
 pub revision:u64,
 pub ciphertext_base64:String,
 pub ciphertext_sha256:String,
}
#[derive(Clone,Debug,Deserialize,Serialize)]
#[serde(deny_unknown_fields)]
pub struct AccountRead {
 pub wallet_public_key:String,
 pub expires_at:u64,
 pub authorization:Authorization,
}
impl AccountRead {pub fn message(&self)->String{crate::auth::signed_message("account-read", &(&self.wallet_public_key,self.expires_at))}}
#[derive(Clone,Debug,Deserialize,Serialize)]
#[serde(deny_unknown_fields)]
pub struct AccountWrite {
 pub wallet_public_key:String,
 pub expires_at:u64,
 pub expected_revision:u64,
 pub ciphertext_base64:String,
 pub ciphertext_sha256:String,
 pub authorization:Authorization,
}
impl AccountWrite {pub fn message(&self)->String{crate::auth::signed_message("account-write", &(&self.wallet_public_key,self.expires_at,self.expected_revision,&self.ciphertext_sha256))}}
