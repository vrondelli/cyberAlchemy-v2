//! One disposable local KEP exchange. No sockets, credentials or Solana calls.
use cyberalchemy_kep_adapters::{production_profile, ProductionCryptography, Sha256Identity};
use cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::{
    cryptography::{ByteIdentityProvider, CryptographyError, CryptographyPort, KeyCustodyPort},
    model::{CryptographicContext, RecipientBinding, SecretHandle},
};
use cyberalchemy_knowledge_exchange_protocol::*;
use hpke::{kem::X25519HkdfSha256, Kem, Serializable};
use p256::{
    ecdsa::{
        signature::{Signer, Verifier},
        Signature, SigningKey, VerifyingKey,
    },
    pkcs8::EncodePublicKey,
};
use rand_core::OsRng;
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    collections::BTreeMap,
    io::{self, BufRead, Read, Write},
};
use zeroize::Zeroizing;

type Result<T> = std::result::Result<T, String>;
fn d(bytes: &[u8]) -> Digest32 {
    Sha256Identity.digest(bytes)
}
fn hx(value: Digest32) -> String {
    hex::encode(value.as_bytes())
}
fn checked<T, E: std::fmt::Debug>(value: std::result::Result<T, E>) -> Result<T> {
    value.map_err(|e| format!("{e:?}"))
}
struct Custody(BTreeMap<SecretHandle, Zeroizing<Vec<u8>>>);
impl KeyCustodyPort for Custody {
    fn with_secret<R>(
        &self,
        h: &SecretHandle,
        op: impl FnOnce(&[u8]) -> std::result::Result<R, CryptographyError>,
    ) -> std::result::Result<R, CryptographyError> {
        op(self.0.get(h).ok_or(CryptographyError::CustodyUnavailable)?)
    }
}
struct Auth(BTreeMap<Digest32, VerifyingKey>);
impl AuthorizationVerifier for Auth {
    fn verify(&self, proof: &AuthorizationProof) -> bool {
        let Some(key) = self.0.get(&proof.signer_id) else {
            return false;
        };
        Signature::from_der(&proof.signature)
            .is_ok_and(|s| key.verify(proof.command_digest.as_bytes(), &s).is_ok())
    }
}
fn proof(signer: Digest32, command: Digest32, key: &SigningKey) -> AuthorizationProof {
    let signature: Signature = key.sign(command.as_bytes());
    AuthorizationProof {
        signer_id: signer,
        command_digest: command,
        signature: signature.to_der().as_bytes().to_vec(),
    }
}
fn identity(name: &[u8], signing: &SigningKey, recipient: &RecipientBinding) -> KnowledgeIdentity {
    KnowledgeIdentity {
        identity_id: d(name),
        authorization_key_fingerprint: d(signing
            .verifying_key()
            .to_encoded_point(false)
            .as_bytes()),
        encryption_key: EncryptionKeyBinding {
            binding_id: recipient.key_binding_id,
            fingerprint: recipient.key_fingerprint,
            version: 1,
            valid_from: 0,
            valid_until: u64::MAX,
            challenge_digest: d(name),
        },
    }
}
#[derive(Deserialize)]
#[serde(tag = "op", deny_unknown_fields)]
enum Request {
    #[serde(rename = "deliver")]
    Deliver {
        envelope: String,
        #[serde(default)]
        fault: Option<String>,
    },
    #[serde(rename = "acknowledge")]
    Acknowledge { receipt: String },
}
struct Session {
    state: EncryptedCoownershipState,
    b: KnowledgeIdentity,
    b_signing: SigningKey,
    auth: Auth,
    envelope_digest: String,
    correlation: String,
    payload_digest: String,
    envelope_digest_b: Digest32,
    acknowledged: Option<(String, Value)>,
}
fn deliver(envelope: String, fault: Option<String>) -> Result<(Session, Value)> {
    if envelope.len() > 524288 {
        return Err("envelope_too_large".into());
    }
    let e: Value = checked(serde_json::from_str(&envelope))?;
    if e["sender"] != "agent-a" || e["recipient"] != "agent-b" {
        return Err("identity_mismatch".into());
    }
    let correlation = e["correlationId"]
        .as_str()
        .ok_or("missing_correlation")?
        .to_owned();
    let payload_digest = e["payloadSha256"]
        .as_str()
        .ok_or("missing_payload_digest")?
        .to_owned();
    if !matches!(
        fault.as_deref(),
        None | Some("ciphertext") | Some("wrong-recipient") | Some("grant-signature")
    ) {
        return Err("unknown_fault".into());
    }
    let a_signing = SigningKey::random(&mut OsRng);
    let b_signing = SigningKey::random(&mut OsRng);
    let mut custody = Custody(BTreeMap::new());
    let mut recipients = Vec::new();
    let mut keys = Vec::new();
    for name in ["agent-a", "agent-b"] {
        let (private, public) = X25519HkdfSha256::gen_keypair();
        let public: [u8; 32] = public
            .to_bytes()
            .as_slice()
            .try_into()
            .map_err(|_| "key_size")?;
        let h = SecretHandle(format!("disposable:{name}"));
        custody
            .0
            .insert(h.clone(), Zeroizing::new(private.to_bytes().to_vec()));
        recipients.push(RecipientBinding {
            recipient_id: d(name.as_bytes()),
            key_binding_id: d(&public),
            key_binding_version: 1,
            key_fingerprint: d(&public),
        });
        keys.push((public, h));
    }
    let crypto = ProductionCryptography::new(custody);
    for (r, (public, h)) in recipients.iter().zip(keys) {
        crypto.keys().register(r.key_binding_id, public, h);
    }
    let a = identity(b"agent-a", &a_signing, &recipients[0]);
    let b = identity(b"agent-b", &b_signing, &recipients[1]);
    let auth = Auth(BTreeMap::from([
        (a.identity_id, *a_signing.verifying_key()),
        (b.identity_id, *b_signing.verifying_key()),
    ]));
    let version = d(envelope.as_bytes());
    let policy_id = d(b"local-alchlang-originator-only-v1");
    let context = CryptographicContext {
        artifact_version_id: version,
        policy_id,
        encryption_epoch: 1,
        plaintext_commitment: version,
    };
    let profile = production_profile(d(b"local-alchlang-crypto-profile-v1"));
    let mut material = checked(crypto.prepare(
        &profile,
        &context,
        envelope.as_bytes(),
        &recipients,
        &Sha256Identity,
    ))?;
    let make_env = |i: usize| RecipientKeyEnvelope {
        envelope_digest: material.envelopes[i].envelope_identity.digest,
        artifact_version_id: version,
        encryption_epoch: 1,
        recipient_id: recipients[i].recipient_id,
        recipient_key_binding_id: recipients[i].key_binding_id,
        recipient_key_binding_version: 1,
        recipient_key_fingerprint: recipients[i].key_fingerprint,
    };
    let a_env = make_env(0);
    let b_env = make_env(1);
    let policy = PropagationPolicy {
        policy_id,
        originator_id: a.identity_id,
        grant_authority: AuthorityRule::OriginatorOnly,
        reissue_authority: AuthorityRule::OriginatorOnly,
    };
    let artifact = ArtifactVersion {
        artifact_id: d(correlation.as_bytes()),
        version_id: version,
        plaintext_commitment: version,
        policy_id,
        originator_id: a.identity_id,
    };
    // The opaque content address identifies bytes held outside the protocol state.
    let mut content_store = BTreeMap::new();
    let address = hx(material.ciphertext_identity.digest);
    content_store.insert(address.clone(), material.ciphertext.clone());
    let initial = checked(EncryptedCoownershipState::new(
        artifact,
        &policy,
        &a,
        1,
        1,
        material.ciphertext_identity.digest,
        d(address.as_bytes()),
        a_env,
    ))?;
    let mut grant = CoownershipGrant {
        command_digest: d(b"unbound"),
        expected_state_revision: 0,
        evaluation_time: 1,
        artifact_version_id: version,
        policy_id,
        grantor_id: a.identity_id,
        recipient_id: b.identity_id,
        recipient_key_binding_id: b.encryption_key.binding_id,
        recipient_key_binding_version: 1,
        recipient_key_fingerprint: b.encryption_key.fingerprint,
        envelope_digest: b_env.envelope_digest,
    };
    grant.command_digest = d(format!("local-grant-v1:{grant:?}").as_bytes());
    let mut authorization = proof(a.identity_id, grant.command_digest, &a_signing);
    if fault.as_deref() == Some("grant-signature") {
        authorization.signature[0] ^= 1;
    }
    let state =
        checked(initial.grant_coownership(&policy, &b, &grant, b_env, &authorization, &auth))?;
    material.ciphertext = content_store.remove(&address).ok_or("content_missing")?;
    if fault.as_deref() == Some("ciphertext") {
        material.ciphertext[0] ^= 1;
    }
    let mut recipient = recipients[1].clone();
    if fault.as_deref() == Some("wrong-recipient") {
        recipient.recipient_id = d(b"outsider");
    }
    let opened = checked(crypto.open(&profile, &context, &material, &recipient, &Sha256Identity))?;
    if opened != envelope.as_bytes() {
        return Err("plaintext_mismatch".into());
    }
    let output = json!({"status":"delivered","authenticated_sender":"agent-a","recipient":"agent-b","envelope":String::from_utf8(opened).map_err(|_|"utf8")?,
        "envelope_sha256":hx(version),"ciphertext_sha256":address,"owner_count":state.owners().len(),"state_revision":state.state_revision(),
        "recipient_public_key_der":hex::encode(checked(b_signing.verifying_key().to_public_key_der())?.as_bytes()),
        "crypto":"XChaCha20-Poly1305 + HPKE X25519","storage":"process-local content-addressed map","solana_invoked":false});
    Ok((
        Session {
            state,
            b,
            b_signing,
            auth,
            envelope_digest: hx(version),
            correlation,
            payload_digest,
            envelope_digest_b: b_env.envelope_digest,
            acknowledged: None,
        },
        output,
    ))
}
impl Session {
    fn acknowledge(&mut self, receipt: String) -> Result<Value> {
        if receipt.len() > 131072 {
            return Err("receipt_too_large".into());
        }
        if let Some((old, result)) = &self.acknowledged {
            if old != &receipt {
                return Err("acknowledgement_conflict".into());
            }
            let mut out = result.clone();
            out["replayed"] = json!(true);
            return Ok(out);
        }
        let r: Value = checked(serde_json::from_str(&receipt))?;
        if r["envelopeSha256"] != self.envelope_digest
            || r["correlationId"] != self.correlation
            || r["payloadSha256"] != self.payload_digest
            || r["sender"] != "agent-a"
            || r["recipient"] != "agent-b"
            || r["outcome"] != "compiled"
            || r["authorityEffect"] != "none"
            || r["schema"] != "kep-alchlang-compilation-receipt/v1"
        {
            return Err("receipt_binding_mismatch".into());
        }
        let command = d(receipt.as_bytes());
        let ack = DecryptionAcknowledgement {
            command_digest: command,
            expected_state_revision: self.state.state_revision(),
            artifact_version_id: self.state.artifact().version_id,
            encryption_epoch: 1,
            recipient_id: self.b.identity_id,
            envelope_digest: self.envelope_digest_b,
            ciphertext_digest: self.state.ciphertext_digest(),
            challenge_digest: d(format!("ack:{}", self.envelope_digest).as_bytes()),
        };
        let next = checked(self.state.acknowledge_decryption(
            ack,
            &proof(self.b.identity_id, command, &self.b_signing),
            &self.auth,
        ))?;
        let signature: Signature = self.b_signing.sign(receipt.as_bytes());
        checked(
            self.b_signing
                .verifying_key()
                .verify(receipt.as_bytes(), &signature),
        )?;
        let out = json!({"status":"acknowledged","receipt_sha256":hx(command),"signature_der":hex::encode(signature.to_der().as_bytes()),
          "state_revision":next.state_revision(),"acknowledgements":next.acknowledgement_count(),"owner_count":next.owners().len(),"replayed":false});
        self.state = next;
        self.acknowledged = Some((receipt, out.clone()));
        Ok(out)
    }
}
fn main() {
    let stdin = io::stdin();
    let mut input = stdin.lock();
    let mut session: Option<Session> = None;
    loop {
        let mut bytes = Vec::new();
        // Bounded framing, including malformed unterminated input.
        let count = match input.by_ref().take(600001).read_until(b'\n', &mut bytes) {
            Ok(n) => n,
            Err(_) => break,
        };
        if count == 0 {
            break;
        }
        if bytes.len() > 600000 || !bytes.ends_with(b"\n") {
            println!("{{\"status\":\"rejected\",\"error\":\"frame_bounds\"}}");
            break;
        }
        let response: Result<Value> = (|| {
            let request: Request = checked(serde_json::from_slice(&bytes))?;
            match request {
                Request::Deliver { envelope, fault } => {
                    if session.is_some() {
                        return Err("delivery_already_started".into());
                    }
                    let (next, out) = deliver(envelope, fault)?;
                    session = Some(next);
                    Ok(out)
                }
                Request::Acknowledge { receipt } => session
                    .as_mut()
                    .ok_or("delivery_required")?
                    .acknowledge(receipt),
            }
        })();
        println!(
            "{}",
            response.unwrap_or_else(|error| json!({"status":"rejected","error":error}))
        );
        let _ = io::stdout().flush();
    }
}
