use std::{collections::BTreeMap, sync::RwLock};

use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use cyberalchemy_kep_adapters::{
    crypto::production_profile, ProductionCryptography, Sha256Identity,
};
use cyberalchemy_knowledge_exchange_protocol::{
    encrypted_durable_devnet::{
        cryptography::{ByteIdentityProvider, CryptographyError, CryptographyPort, KeyCustodyPort},
        model::{CryptographicContext, RecipientBinding, SecretHandle},
    },
    Digest32,
};
use hpke::{
    aead::ChaCha20Poly1305, kdf::HkdfSha256, kem::X25519HkdfSha256, Deserializable, Kem, OpModeR,
    Serializable,
};

#[derive(Default)]
struct TestCustody {
    secrets: RwLock<BTreeMap<SecretHandle, Vec<u8>>>,
}

impl TestCustody {
    fn insert(&self, handle: SecretHandle, secret: Vec<u8>) {
        self.secrets.write().unwrap().insert(handle, secret);
    }
}

impl KeyCustodyPort for TestCustody {
    fn with_secret<R>(
        &self,
        handle: &SecretHandle,
        operation: impl FnOnce(&[u8]) -> Result<R, CryptographyError>,
    ) -> Result<R, CryptographyError> {
        let guard = self
            .secrets
            .read()
            .map_err(|_| CryptographyError::CustodyUnavailable)?;
        let secret = guard
            .get(handle)
            .ok_or(CryptographyError::CustodyUnavailable)?;
        operation(secret)
    }
}

fn d(value: u8) -> Digest32 {
    Digest32::try_new([value; 32]).unwrap()
}

fn recipient(identity: u8, binding: u8, fingerprint: u8, version: u64) -> RecipientBinding {
    RecipientBinding {
        recipient_id: d(identity),
        key_binding_id: d(binding),
        key_binding_version: version,
        key_fingerprint: d(fingerprint),
    }
}

#[test]
fn production_crypto_preserves_a_envelope_and_rewraps_for_b() {
    type TestKem = X25519HkdfSha256;
    let custody = TestCustody::default();
    let (a_private, a_public) = TestKem::gen_keypair();
    let (b_private, b_public) = TestKem::gen_keypair();
    let a_handle = SecretHandle("custody:a:hpke:v1".to_owned());
    let b_handle = SecretHandle("custody:b:hpke:v2".to_owned());
    custody.insert(a_handle.clone(), a_private.to_bytes().to_vec());
    custody.insert(b_handle.clone(), b_private.to_bytes().to_vec());

    let crypto = ProductionCryptography::new(custody);
    let identity = Sha256Identity;
    let mut a = recipient(1, 11, 21, 1);
    let mut b = recipient(2, 12, 22, 2);
    a.key_binding_id = identity.digest(&a_public.to_bytes());
    b.key_binding_id = identity.digest(&b_public.to_bytes());
    crypto
        .keys()
        .register(
            a.key_binding_id,
            a_public.to_bytes().as_slice().try_into().unwrap(),
            a_handle.clone(),
        )
        .expect("register A key once");
    assert_eq!(
        Err(CryptographyError::ContextMismatch),
        crypto.keys().register(
            a.key_binding_id,
            b_public.to_bytes().as_slice().try_into().unwrap(),
            a_handle,
        )
    );
    crypto
        .keys()
        .register(
            b.key_binding_id,
            b_public.to_bytes().as_slice().try_into().unwrap(),
            b_handle,
        )
        .expect("register B key once");
    let plaintext = b"ontology knowledge is never public state";
    let context = CryptographicContext {
        artifact_version_id: d(31),
        policy_id: d(32),
        encryption_epoch: 1,
        plaintext_commitment: identity.digest(plaintext),
    };
    let profile = production_profile(d(33));

    let mut material = crypto
        .prepare(
            &profile,
            &context,
            plaintext,
            std::slice::from_ref(&a),
            &identity,
        )
        .unwrap();
    let a_envelope = material.envelopes[0].clone();
    let b_envelope = crypto
        .rewrap_for_reissue(
            &material,
            &a,
            &b,
            b_public.to_bytes().as_slice().try_into().unwrap(),
            &identity,
        )
        .unwrap();
    let mut unbound_public: [u8; 32] = b_public.to_bytes().as_slice().try_into().unwrap();
    unbound_public[0] ^= 1;
    assert_eq!(
        Err(CryptographyError::RecipientMismatch),
        crypto.rewrap_for_reissue(&material, &a, &b, unbound_public, &identity)
    );
    material.envelopes.push(b_envelope);

    assert_eq!(a_envelope, material.envelopes[0]);
    assert_eq!(
        plaintext.to_vec(),
        crypto
            .open(&profile, &context, &material, &b, &identity)
            .unwrap()
    );
    assert!(!material
        .ciphertext
        .windows(plaintext.len())
        .any(|window| window == plaintext));

    let changed_context = CryptographicContext {
        policy_id: d(99),
        ..context
    };
    assert_eq!(
        Err(CryptographyError::AuthenticationFailed),
        crypto.open(&profile, &changed_context, &material, &b, &identity)
    );
}

#[test]
fn xchacha20_poly1305_matches_cfrg_appendix_a1_vector() {
    let key: Vec<u8> = (0x80..=0x9f).collect();
    let nonce: Vec<u8> = (0x40..=0x57).collect();
    let aad = hex::decode("50515253c0c1c2c3c4c5c6c7").unwrap();
    let plaintext = b"Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
    let expected = hex::decode(concat!(
        "bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb",
        "731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b452",
        "2f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff9",
        "21f9664c97637da9768812f615c68b13b52ec0875924c1c7987947deafd8780a",
        "cf49"
    ))
    .unwrap();
    let cipher = XChaCha20Poly1305::new_from_slice(&key).unwrap();
    let nonce = XNonce::try_from(nonce.as_slice()).unwrap();
    assert_eq!(
        expected,
        cipher
            .encrypt(
                &nonce,
                Payload {
                    msg: plaintext,
                    aad: &aad
                }
            )
            .unwrap()
    );
}

#[test]
fn rfc9180_x25519_base_mode_vector_decrypts_exactly() {
    type TestKem = X25519HkdfSha256;
    let private = <TestKem as Kem>::PrivateKey::from_bytes(
        &hex::decode("8057991eef8f1f1af18f4a9491d16a1ce333f695d4db8e38da75975c4478e0fb").unwrap(),
    )
    .unwrap();
    let encapped = <TestKem as Kem>::EncappedKey::from_bytes(
        &hex::decode("1afa08d3dec047a643885163f1180476fa7ddb54c6a8029ea33f95796bf2ac4a").unwrap(),
    )
    .unwrap();
    let info = hex::decode("4f6465206f6e2061204772656369616e2055726e").unwrap();
    let aad = hex::decode("436f756e742d30").unwrap();
    let ciphertext = hex::decode(
        "1c5250d8034ec2b784ba2cfd69dbdb8af406cfe3ff938e131f0def8c8b60b4db21993c62ce81883d2dd1b51a28",
    )
    .unwrap();
    let expected =
        hex::decode("4265617574792069732074727574682c20747275746820626561757479").unwrap();
    let mut receiver = hpke::setup_receiver::<ChaCha20Poly1305, HkdfSha256, TestKem>(
        &OpModeR::Base,
        &private,
        &encapped,
        &info,
    )
    .unwrap();
    assert_eq!(expected, receiver.open(&ciphertext, &aad).unwrap());
}
