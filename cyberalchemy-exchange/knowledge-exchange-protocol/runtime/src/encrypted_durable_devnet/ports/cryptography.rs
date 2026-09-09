use std::collections::BTreeMap;

use crate::Digest32;

use super::model::{
    CryptographicContext, CryptographicProfile, PreparedMaterial, QualifiedByteIdentity,
    RecipientBinding, SecretHandle,
};

#[derive(Clone, Debug, PartialEq)]
pub enum CanonicalValue {
    Unsigned(u64),
    Bytes(Vec<u8>),
    Text(String),
    Bool(bool),
    Array(Vec<CanonicalValue>),
    Map(BTreeMap<String, CanonicalValue>),
    Float(f64),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CanonicalRecordSchema {
    pub schema_version: u64,
    pub required_fields: Vec<String>,
    pub optional_fields: Vec<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CanonicalCborError {
    ZeroSchemaVersion,
    MissingField(String),
    UnknownField(String),
    UnsupportedFloat,
    LengthTooLarge,
}

fn encode_major(major: u8, value: u64, output: &mut Vec<u8>) {
    match value {
        0..=23 => output.push((major << 5) | value as u8),
        24..=0xff => output.extend([(major << 5) | 24, value as u8]),
        0x100..=0xffff => {
            output.push((major << 5) | 25);
            output.extend((value as u16).to_be_bytes());
        }
        0x1_0000..=0xffff_ffff => {
            output.push((major << 5) | 26);
            output.extend((value as u32).to_be_bytes());
        }
        _ => {
            output.push((major << 5) | 27);
            output.extend(value.to_be_bytes());
        }
    }
}

fn encode_value(value: &CanonicalValue, output: &mut Vec<u8>) -> Result<(), CanonicalCborError> {
    match value {
        CanonicalValue::Unsigned(value) => encode_major(0, *value, output),
        CanonicalValue::Bytes(bytes) => {
            encode_major(
                2,
                bytes
                    .len()
                    .try_into()
                    .map_err(|_| CanonicalCborError::LengthTooLarge)?,
                output,
            );
            output.extend(bytes);
        }
        CanonicalValue::Text(text) => {
            encode_major(
                3,
                text.len()
                    .try_into()
                    .map_err(|_| CanonicalCborError::LengthTooLarge)?,
                output,
            );
            output.extend(text.as_bytes());
        }
        CanonicalValue::Bool(value) => output.push(if *value { 0xf5 } else { 0xf4 }),
        CanonicalValue::Array(values) => {
            encode_major(
                4,
                values
                    .len()
                    .try_into()
                    .map_err(|_| CanonicalCborError::LengthTooLarge)?,
                output,
            );
            for value in values {
                encode_value(value, output)?;
            }
        }
        CanonicalValue::Map(values) => encode_map(values, output)?,
        CanonicalValue::Float(_) => return Err(CanonicalCborError::UnsupportedFloat),
    }
    Ok(())
}

fn encoded_text_key(key: &str) -> Result<Vec<u8>, CanonicalCborError> {
    let mut encoded = Vec::new();
    encode_value(&CanonicalValue::Text(key.to_owned()), &mut encoded)?;
    Ok(encoded)
}

fn encode_map(
    fields: &BTreeMap<String, CanonicalValue>,
    output: &mut Vec<u8>,
) -> Result<(), CanonicalCborError> {
    let mut entries = fields
        .iter()
        .map(|(key, value)| Ok((encoded_text_key(key)?, value)))
        .collect::<Result<Vec<_>, CanonicalCborError>>()?;
    entries.sort_by(|left, right| left.0.len().cmp(&right.0.len()).then(left.0.cmp(&right.0)));
    encode_major(
        4_u8.wrapping_add(1),
        entries
            .len()
            .try_into()
            .map_err(|_| CanonicalCborError::LengthTooLarge)?,
        output,
    );
    for (key, value) in entries {
        output.extend(key);
        encode_value(value, output)?;
    }
    Ok(())
}

pub fn encode_canonical_record(
    schema: &CanonicalRecordSchema,
    fields: &BTreeMap<String, CanonicalValue>,
) -> Result<Vec<u8>, CanonicalCborError> {
    if schema.schema_version == 0 {
        return Err(CanonicalCborError::ZeroSchemaVersion);
    }
    for required in &schema.required_fields {
        if !fields.contains_key(required) {
            return Err(CanonicalCborError::MissingField(required.clone()));
        }
    }
    for field in fields.keys() {
        if !schema.required_fields.contains(field) && !schema.optional_fields.contains(field) {
            return Err(CanonicalCborError::UnknownField(field.clone()));
        }
    }
    let mut with_version = fields.clone();
    if with_version
        .insert(
            "schema_version".to_owned(),
            CanonicalValue::Unsigned(schema.schema_version),
        )
        .is_some()
    {
        return Err(CanonicalCborError::UnknownField(
            "schema_version".to_owned(),
        ));
    }
    let mut output = Vec::new();
    encode_map(&with_version, &mut output)?;
    Ok(output)
}

pub trait ByteIdentityProvider {
    fn digest(&self, bytes: &[u8]) -> Digest32;

    fn identify(&self, schema_version: u16, bytes: &[u8]) -> QualifiedByteIdentity {
        QualifiedByteIdentity {
            schema_version,
            digest: self.digest(bytes),
            length: bytes.len() as u64,
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CryptographyError {
    UnsupportedProfile,
    ContextMismatch,
    RecipientMismatch,
    AuthenticationFailed,
    InvalidMaterial,
    CustodyUnavailable,
    SecretHandleMismatch,
}

/// Custody boundary for secret material. Implementations resolve a handle
/// inside a tightly scoped closure so protocol state cannot retain plaintext
/// private keys or content keys.
pub trait KeyCustodyPort {
    fn with_secret<R>(
        &self,
        handle: &SecretHandle,
        operation: impl FnOnce(&[u8]) -> Result<R, CryptographyError>,
    ) -> Result<R, CryptographyError>;
}

pub trait CryptographyPort {
    fn prepare(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        plaintext: &[u8],
        recipients: &[RecipientBinding],
        identity: &dyn ByteIdentityProvider,
    ) -> Result<PreparedMaterial, CryptographyError>;

    fn open(
        &self,
        profile: &CryptographicProfile,
        context: &CryptographicContext,
        material: &PreparedMaterial,
        recipient: &RecipientBinding,
        identity: &dyn ByteIdentityProvider,
    ) -> Result<Vec<u8>, CryptographyError>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContentEncryptionSuite {
    pub suite_id: String,
    pub key_bytes: u16,
    pub nonce_bytes: u16,
    pub aad_domain: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SigningKeyBinding {
    pub knowledge_identity_id: Digest32,
    pub solana_public_key: String,
    pub authorization_purpose: String,
    pub binding_version: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MaterialPrepared {
    pub preparation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub recipient_identity_id: Digest32,
    pub ciphertext_identity: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct KeyReissueRequested {
    pub request_id: Digest32,
    pub artifact_version_id: Digest32,
    pub recipient_identity_id: Digest32,
    pub replacement_binding_id: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientDecryptionVerified {
    pub observation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub recipient_identity_id: Digest32,
    pub plaintext_commitment: Digest32,
}

pub fn enforce_cryptographic_profile_exact(
    expected: &CryptographicProfile,
    observed: &CryptographicProfile,
) -> Result<(), CryptographyError> {
    if expected == observed {
        Ok(())
    } else {
        Err(CryptographyError::UnsupportedProfile)
    }
}

pub fn prepare_encrypted_material(
    cryptography: &impl CryptographyPort,
    profile: &CryptographicProfile,
    context: &CryptographicContext,
    plaintext: &[u8],
    recipients: &[RecipientBinding],
    identity: &dyn ByteIdentityProvider,
) -> Result<PreparedMaterial, CryptographyError> {
    cryptography.prepare(profile, context, plaintext, recipients, identity)
}

pub fn request_key_reissue(
    request_id: Digest32,
    artifact_version_id: Digest32,
    recipient: &RecipientBinding,
    replacement: &RecipientBinding,
    recipient_is_current_owner: bool,
) -> Result<KeyReissueRequested, CryptographyError> {
    if !recipient_is_current_owner
        || recipient.recipient_id != replacement.recipient_id
        || recipient.key_binding_id == replacement.key_binding_id
        || replacement.key_binding_version <= recipient.key_binding_version
    {
        return Err(CryptographyError::RecipientMismatch);
    }
    Ok(KeyReissueRequested {
        request_id,
        artifact_version_id,
        recipient_identity_id: recipient.recipient_id,
        replacement_binding_id: replacement.key_binding_id,
    })
}
