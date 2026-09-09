use std::{
    collections::{btree_map::Entry, BTreeMap},
    sync::RwLock,
};

use chacha20poly1305::{
    aead::{Aead, Generate, Key, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use cyberalchemy_knowledge_exchange_protocol::{
    encrypted_durable_devnet::{
        cryptography::{ByteIdentityProvider, CryptographyError, CryptographyPort, KeyCustodyPort},
        model::{
            CryptographicContext, CryptographicProfile, OpaqueRecipientEnvelope, PreparedMaterial,
            QualifiedByteIdentity, RecipientBinding, SecretHandle,
        },
    },
    Digest32,
};
use hpke::{
    aead::ChaCha20Poly1305 as HpkeChaCha20Poly1305, kdf::HkdfSha256, kem::X25519HkdfSha256,
    Deserializable, Kem as KemTrait, OpModeR, OpModeS, Serializable,
};
use sha2::{Digest, Sha256};
use zeroize::Zeroizing;

type Kem = X25519HkdfSha256;
type Kdf = HkdfSha256;
type HpkeAead = HpkeChaCha20Poly1305;

const CONTENT_SUITE: &str = "XCHACHA20-POLY1305";
const ENVELOPE_SUITE: &str = "HPKE-BASE-X25519-HKDF-SHA256-CHACHA20-POLY1305";
const SERIALIZATION: &str = "deterministic-cbor-v1";
const CONTENT_AAD_DOMAIN: &[u8] = b"CA2-KEP-CONTENT-v1";
const HPKE_INFO_DOMAIN: &[u8] = b"CA2-KEP-OWNER-ENVELOPE-v1";

#[derive(Clone, Copy, Debug, Default)]
pub struct Sha256Identity;

impl ByteIdentityProvider for Sha256Identity {
    fn digest(&self, bytes: &[u8]) -> Digest32 {
        let digest: [u8; 32] = Sha256::digest(bytes).into();
        // SHA-256 producing all zeroes is computationally infeasible. Treating
        // it as invalid keeps the core Digest32 invariant fail-closed.
        Digest32::try_new(digest).expect("SHA-256 digest unexpectedly all zero")
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientKeyRecord {
    pub public_key: [u8; 32],
    pub private_key_handle: SecretHandle,
}

#[derive(Default)]
pub struct RecipientKeyDirectory {
    entries: RwLock<BTreeMap<Digest32, RecipientKeyRecord>>,
}

impl RecipientKeyDirectory {
    pub fn register(
        &self,
        binding_id: Digest32,
        public_key: [u8; 32],
        private_key_handle: SecretHandle,
    ) -> Result<(), CryptographyError> {
        let mut entries = self
            .entries
            .write()
            .map_err(|_| CryptographyError::CustodyUnavailable)?;
        match entries.entry(binding_id) {
            Entry::Vacant(slot) => {
                slot.insert(RecipientKeyRecord {
                    public_key,
                    private_key_handle,
                });
                Ok(())
            }
            Entry::Occupied(_) => Err(CryptographyError::ContextMismatch),
        }
    }

    fn resolve(&self, binding_id: Digest32) -> Result<RecipientKeyRecord, CryptographyError> {
        self.entries
            .read()
            .map_err(|_| CryptographyError::CustodyUnavailable)?
            .get(&binding_id)
            .cloned()
            .ok_or(CryptographyError::RecipientMismatch)
    }
}

pub struct ProductionCryptography<C> {
    custody: C,
    keys: RecipientKeyDirectory,
}

impl<C> ProductionCryptography<C> {
    pub fn new(custody: C) -> Self {
        Self {
            custody,
            keys: RecipientKeyDirectory::default(),
        }
    }

    pub fn keys(&self) -> &RecipientKeyDirectory {
        &self.keys
    }

    fn validate_profile(profile: &CryptographicProfile) -> Result<(), CryptographyError> {
        if profile.content_suite == CONTENT_SUITE
            && profile.envelope_suite == ENVELOPE_SUITE
            && profile.serialization == SERIALIZATION
        {
            Ok(())
        } else {
            Err(CryptographyError::UnsupportedProfile)
        }
    }

    fn aad(context: &CryptographicContext) -> Vec<u8> {
        let mut aad = Vec::with_capacity(CONTENT_AAD_DOMAIN.len() + 104);
        aad.extend_from_slice(CONTENT_AAD_DOMAIN);
        aad.extend_from_slice(context.artifact_version_id.as_bytes());
        aad.extend_from_slice(context.policy_id.as_bytes());
        aad.extend_from_slice(&context.encryption_epoch.to_be_bytes());
        aad.extend_from_slice(context.plaintext_commitment.as_bytes());
        aad
    }

    fn envelope_aad(context: &CryptographicContext, recipient: &RecipientBinding) -> Vec<u8> {
        let mut aad = Self::aad(context);
        aad.extend_from_slice(recipient.recipient_id.as_bytes());
        aad.extend_from_slice(recipient.key_binding_id.as_bytes());
        aad.extend_from_slice(&recipient.key_binding_version.to_be_bytes());
        aad.extend_from_slice(recipient.key_fingerprint.as_bytes());
        aad
    }

    fn wrap_content_key(
        context: &CryptographicContext,
        recipient: &RecipientBinding,
        public_key_bytes: &[u8; 32],
        content_key: &[u8; 32],
    ) -> Result<Vec<u8>, CryptographyError> {
        let public_key = <Kem as KemTrait>::PublicKey::from_bytes(public_key_bytes)
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let (encapped, mut sender) =
            hpke::setup_sender::<HpkeAead, Kdf, Kem>(&OpModeS::Base, &public_key, HPKE_INFO_DOMAIN)
                .map_err(|_| CryptographyError::InvalidMaterial)?;
        let sealed = sender
            .seal(content_key, &Self::envelope_aad(context, recipient))
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let encapped = encapped.to_bytes();
        let mut envelope = Vec::with_capacity(2 + encapped.len() + sealed.len());
        envelope.extend_from_slice(&(encapped.len() as u16).to_be_bytes());
        envelope.extend_from_slice(encapped.as_slice());
        envelope.extend_from_slice(&sealed);
        Ok(envelope)
    }

    fn unwrap_content_key(
        &self,
        context: &CryptographicContext,
        recipient: &RecipientBinding,
        envelope: &[u8],
    ) -> Result<Zeroizing<[u8; 32]>, CryptographyError>
    where
        C: KeyCustodyPort,
    {
        if envelope.len() < 2 {
            return Err(CryptographyError::InvalidMaterial);
        }
        let encapped_len = u16::from_be_bytes([envelope[0], envelope[1]]) as usize;
        if envelope.len() <= 2 + encapped_len {
            return Err(CryptographyError::InvalidMaterial);
        }
        let encapped = <Kem as KemTrait>::EncappedKey::from_bytes(&envelope[2..2 + encapped_len])
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let sealed = &envelope[2 + encapped_len..];
        let key_record = self.keys.resolve(recipient.key_binding_id)?;
        self.custody
            .with_secret(&key_record.private_key_handle, |secret| {
                let private_key = <Kem as KemTrait>::PrivateKey::from_bytes(secret)
                    .map_err(|_| CryptographyError::InvalidMaterial)?;
                let mut receiver = hpke::setup_receiver::<HpkeAead, Kdf, Kem>(
                    &OpModeR::Base,
                    &private_key,
                    &encapped,
                    HPKE_INFO_DOMAIN,
                )
                .map_err(|_| CryptographyError::AuthenticationFailed)?;
                let opened = Zeroizing::new(
                    receiver
                        .open(sealed, &Self::envelope_aad(context, recipient))
                        .map_err(|_| CryptographyError::AuthenticationFailed)?,
                );
                let key: [u8; 32] = opened
                    .as_slice()
                    .try_into()
                    .map_err(|_| CryptographyError::InvalidMaterial)?;
                Ok(Zeroizing::new(key))
            })
    }

    pub fn rewrap_for_reissue(
        &self,
        material: &PreparedMaterial,
        authorizing_owner: &RecipientBinding,
        replacement: &RecipientBinding,
        replacement_public_key: [u8; 32],
        identity: &dyn ByteIdentityProvider,
    ) -> Result<OpaqueRecipientEnvelope, CryptographyError>
    where
        C: KeyCustodyPort,
    {
        let registered_replacement = self.keys.resolve(replacement.key_binding_id)?;
        if authorizing_owner.recipient_id == replacement.recipient_id
            || replacement.key_binding_version == 0
            || replacement.key_binding_id != identity.digest(&replacement_public_key)
            || registered_replacement.public_key != replacement_public_key
        {
            return Err(CryptographyError::RecipientMismatch);
        }
        let owner_envelope = material
            .envelopes
            .iter()
            .find(|candidate| &candidate.recipient == authorizing_owner)
            .ok_or(CryptographyError::RecipientMismatch)?;
        let content_key = self.unwrap_content_key(
            &material.context,
            authorizing_owner,
            &owner_envelope.envelope_bytes,
        )?;
        let envelope_bytes = Self::wrap_content_key(
            &material.context,
            replacement,
            &replacement_public_key,
            &content_key,
        )?;
        Ok(OpaqueRecipientEnvelope {
            recipient: replacement.clone(),
            envelope_identity: identity.identify(1, &envelope_bytes),
            envelope_bytes,
        })
    }
}

impl<C: KeyCustodyPort> CryptographyPort for ProductionCryptography<C> {
    fn prepare(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        plaintext: &[u8],
        recipients: &[RecipientBinding],
        identity: &dyn ByteIdentityProvider,
    ) -> Result<PreparedMaterial, CryptographyError> {
        Self::validate_profile(profile)?;
        if context.encryption_epoch == 0
            || context.plaintext_commitment != identity.digest(plaintext)
            || recipients.is_empty()
        {
            return Err(CryptographyError::ContextMismatch);
        }

        let generated_key = Key::<XChaCha20Poly1305>::generate();
        let content_key = Zeroizing::new(<[u8; 32]>::from(generated_key));
        let nonce = XNonce::generate();
        let cipher = XChaCha20Poly1305::new_from_slice(&content_key[..])
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let encrypted = cipher
            .encrypt(
                &nonce,
                Payload {
                    msg: plaintext,
                    aad: &Self::aad(context),
                },
            )
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let mut ciphertext = Vec::with_capacity(nonce.len() + encrypted.len());
        ciphertext.extend_from_slice(&nonce);
        ciphertext.extend_from_slice(&encrypted);

        let envelopes = recipients
            .iter()
            .map(|recipient| {
                let public_key = self.keys.resolve(recipient.key_binding_id)?.public_key;
                let envelope_bytes =
                    Self::wrap_content_key(context, recipient, &public_key, &content_key)?;
                Ok(OpaqueRecipientEnvelope {
                    recipient: recipient.clone(),
                    envelope_identity: identity.identify(1, &envelope_bytes),
                    envelope_bytes,
                })
            })
            .collect::<Result<Vec<_>, CryptographyError>>()?;

        Ok(PreparedMaterial {
            context: context.clone(),
            profile_id: profile.profile_id,
            ciphertext_identity: identity.identify(1, &ciphertext),
            ciphertext,
            envelopes,
        })
    }

    fn open(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        material: &PreparedMaterial,
        recipient: &RecipientBinding,
        identity: &dyn ByteIdentityProvider,
    ) -> Result<Vec<u8>, CryptographyError> {
        Self::validate_profile(profile)?;
        if &material.context != context
            || material.profile_id != profile.profile_id
            || !material
                .ciphertext_identity
                .matches(identity.digest(&material.ciphertext), &material.ciphertext)
            || material.ciphertext.len() <= 24
        {
            return Err(CryptographyError::AuthenticationFailed);
        }
        let envelope = material
            .envelopes
            .iter()
            .find(|candidate| &candidate.recipient == recipient)
            .ok_or(CryptographyError::RecipientMismatch)?;
        if !envelope.envelope_identity.matches(
            identity.digest(&envelope.envelope_bytes),
            &envelope.envelope_bytes,
        ) {
            return Err(CryptographyError::AuthenticationFailed);
        }
        let content_key = self.unwrap_content_key(context, recipient, &envelope.envelope_bytes)?;
        let cipher = XChaCha20Poly1305::new_from_slice(&content_key[..])
            .map_err(|_| CryptographyError::InvalidMaterial)?;
        let (nonce, encrypted) = material.ciphertext.split_at(24);
        let nonce = XNonce::try_from(nonce).map_err(|_| CryptographyError::InvalidMaterial)?;
        let plaintext = cipher
            .decrypt(
                &nonce,
                Payload {
                    msg: encrypted,
                    aad: &Self::aad(context),
                },
            )
            .map_err(|_| CryptographyError::AuthenticationFailed)?;
        if identity.digest(&plaintext) != context.plaintext_commitment {
            return Err(CryptographyError::AuthenticationFailed);
        }
        Ok(plaintext)
    }
}

pub fn production_profile(profile_id: Digest32) -> CryptographicProfile {
    CryptographicProfile {
        profile_id,
        content_suite: CONTENT_SUITE.to_owned(),
        envelope_suite: ENVELOPE_SUITE.to_owned(),
        serialization: SERIALIZATION.to_owned(),
    }
}

pub fn identify_sha256(schema_version: u16, bytes: &[u8]) -> QualifiedByteIdentity {
    Sha256Identity.identify(schema_version, bytes)
}
