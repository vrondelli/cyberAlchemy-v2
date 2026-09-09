//! Exact top-level KEP transitions accepted by the hosted receipt verifier.
use crate::PROGRAM_ID;
use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::Value;
use sha2::{Digest, Sha256};

#[derive(Clone, Debug)]
pub struct TransitionExpectation {
    pub artifact_id: String,
    pub originator_wallet: String,
    pub recipient_wallet: String,
    pub recipient_key_base64: String,
    pub envelope_sha256: String,
    pub expected_revision: u64,
    /// Some for grants; reissues bind the request PDA and derive their replay
    /// PDA from the executed fulfillment nonce (not present in the hosted API).
    pub grant_operation_id: Option<String>,
}
fn key(text: &str) -> Result<[u8; 32], String> {
    bs58::decode(text)
        .into_vec()
        .map_err(|_| "invalid public key")?
        .try_into()
        .map_err(|_| "public key must have 32 bytes".into())
}
fn digest(text: &str) -> Result<[u8; 32], String> {
    hex::decode(text)
        .map_err(|_| "invalid digest")?
        .try_into()
        .map_err(|_| "digest must have 32 bytes".into())
}
fn pda(seeds: &[&[u8]]) -> Result<String, String> {
    let program = key(PROGRAM_ID)?;
    for bump in (0..=255u8).rev() {
        let mut hash = Sha256::new();
        for seed in seeds {
            hash.update(seed);
        }
        hash.update([bump]);
        hash.update(program);
        hash.update(b"ProgramDerivedAddress");
        let bytes: [u8; 32] = hash.finalize().into();
        // Dalek rejects compressed encodings that do not decompress to a point.
        if ed25519_dalek::VerifyingKey::from_bytes(&bytes).is_err() {
            return Ok(bs58::encode(bytes).into_string());
        }
    }
    Err("cannot derive program address".into())
}
impl TransitionExpectation {
    pub fn artifact_account(&self) -> Result<String, String> {
        pda(&[b"artifact", &digest(&self.artifact_id)?])
    }
    pub fn key_digest(&self) -> Result<[u8; 32], String> {
        let bytes = STANDARD
            .decode(&self.recipient_key_base64)
            .map_err(|_| "invalid recipient key")?;
        if bytes.len() != 32 {
            return Err("recipient key must have 32 bytes".into());
        }
        Ok(Sha256::digest(bytes).into())
    }
    /// Returns the transaction slot only after a matching successful instruction.
    pub fn verify_transaction(
        &self,
        tx: &Value,
        signature: &str,
        account: &str,
        status_slot: u64,
    ) -> Result<u64, String> {
        let root = tx.get("result").ok_or("transaction unavailable")?;
        let slot = root
            .get("slot")
            .and_then(Value::as_u64)
            .ok_or("transaction slot missing")?;
        if slot != status_slot || !root.pointer("/meta/err").is_some_and(Value::is_null) {
            return Err("transaction failed or status slot disagrees".into());
        }
        if root
            .pointer("/transaction/signatures/0")
            .and_then(Value::as_str)
            != Some(signature)
        {
            return Err("RPC transaction signature mismatch".into());
        }
        if account != self.artifact_account()? {
            return Err("artifact account is not the expected PDA".into());
        }
        let message = root
            .pointer("/transaction/message")
            .ok_or("transaction message missing")?;
        let raw = message
            .get("accountKeys")
            .and_then(Value::as_array)
            .ok_or("account keys missing")?;
        let mut keys: Vec<&str> = raw
            .iter()
            .map(|v| v.as_str().ok_or("compiled account key must be a string"))
            .collect::<Result<_, _>>()?;
        let static_count = keys.len();
        let required = message
            .pointer("/header/numRequiredSignatures")
            .and_then(Value::as_u64)
            .ok_or("signer header missing")? as usize;
        if required == 0 || required > static_count {
            return Err("invalid signer header".into());
        }
        let signed_readonly = message
            .pointer("/header/numReadonlySignedAccounts")
            .and_then(Value::as_u64)
            .ok_or("readonly signer header missing")? as usize;
        let unsigned_readonly = message
            .pointer("/header/numReadonlyUnsignedAccounts")
            .and_then(Value::as_u64)
            .ok_or("readonly account header missing")? as usize;
        if signed_readonly > required
            || unsigned_readonly > static_count - required
            || root
                .pointer("/transaction/signatures")
                .and_then(Value::as_array)
                .is_none_or(|signatures| signatures.len() != required)
        {
            return Err("invalid transaction account header".into());
        }
        let mut loaded_writable = 0usize;
        match root.get("version") {
            Some(Value::String(v)) if v == "legacy" => {}
            Some(Value::Number(v)) if v.as_u64() == Some(0) => {
                for kind in ["writable", "readonly"] {
                    let loaded = root
                        .pointer(&format!("/meta/loadedAddresses/{kind}"))
                        .and_then(Value::as_array)
                        .ok_or("v0 loaded addresses missing")?;
                    if kind == "writable" {
                        loaded_writable = loaded.len();
                    }
                    for address in loaded {
                        keys.push(address.as_str().ok_or("invalid loaded address")?);
                    }
                }
            }
            _ => return Err("unsupported or missing transaction version".into()),
        }
        let instructions = message
            .get("instructions")
            .and_then(Value::as_array)
            .ok_or("instructions missing")?;
        let writable = |index: usize| {
            if index < required {
                index < required - signed_readonly
            } else if index < static_count {
                index < static_count - unsigned_readonly
            } else {
                index < static_count + loaded_writable
            }
        };
        let mut matches = 0;
        for instruction in instructions {
            let program = instruction
                .get("programIdIndex")
                .and_then(Value::as_u64)
                .ok_or("program index missing")? as usize;
            let program_key = keys.get(program).ok_or("program index out of bounds")?;
            if *program_key != PROGRAM_ID {
                continue;
            }
            let indices = instruction
                .get("accounts")
                .and_then(Value::as_array)
                .ok_or("instruction accounts missing")?;
            let positions: Vec<usize> = indices
                .iter()
                .map(|v| {
                    v.as_u64()
                        .map(|x| x as usize)
                        .ok_or("invalid account index")
                })
                .collect::<Result<_, _>>()?;
            let accounts: Vec<&str> = positions
                .iter()
                .map(|i| keys.get(*i).copied().ok_or("account index out of bounds"))
                .collect::<Result<_, _>>()?;
            let data = bs58::decode(
                instruction
                    .get("data")
                    .and_then(Value::as_str)
                    .ok_or("instruction bytes missing")?,
            )
            .into_vec()
            .map_err(|_| "invalid instruction encoding")?;
            let grant = self.grant_operation_id.is_some();
            if data.len() != if grant { 137 } else { 73 }
                || data.first() != Some(&if grant { 1 } else { 3 })
            {
                return Err("unexpected KEP instruction".into());
            }
            if accounts.len() != if grant { 5 } else { 6 }
                || positions[0] >= required
                || positions[1] >= required
                || accounts[1] != self.originator_wallet
                || accounts[2] != account
                || accounts.last() != Some(&"11111111111111111111111111111111")
            {
                return Err("instruction account roles or signer mismatch".into());
            }
            if !writable(positions[0])
                || positions[2..positions.len() - 1]
                    .iter()
                    .any(|i| !writable(*i))
            {
                return Err("transition accounts are not writable".into());
            }
            let artifact = digest(&self.artifact_id)?;
            let envelope = digest(&self.envelope_sha256)?;
            let revision = self.expected_revision.to_le_bytes();
            let operation: &[u8];
            if let Some(id) = &self.grant_operation_id {
                let expected_operation =
                    Sha256::digest([b"KEP:OPERATION:v1\0".as_slice(), id.as_bytes()].concat());
                if data[1..33] != key(&self.recipient_wallet)?
                    || data[33..65] != self.key_digest()?
                    || data[65..97] != envelope
                    || data[97..105] != revision
                    || data[105..137] != expected_operation[..]
                {
                    return Err("grant instruction does not match prepared operation".into());
                }
                operation = &data[105..137];
            } else {
                if data[1..33] != envelope || data[33..41] != revision {
                    return Err(
                        "reissue instruction does not match prepared revision/envelope".into(),
                    );
                }
                let request = pda(&[
                    b"reissue",
                    &artifact,
                    &key(&self.recipient_wallet)?,
                    &revision,
                ])?;
                if accounts[3] != request {
                    return Err("reissue request PDA mismatch".into());
                }
                operation = &data[41..73];
            }
            let replay = pda(&[b"replay", &artifact, operation])?;
            if accounts[if grant { 3 } else { 4 }] != replay {
                return Err("replay PDA mismatch".into());
            }
            matches += 1;
        }
        if matches != 1 {
            return Err("exactly one expected top-level KEP transition is required".into());
        }
        Ok(slot)
    }
}
