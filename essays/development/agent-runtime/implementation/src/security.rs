use crate::{
    AuthenticatedPrincipal, CapabilityLease, ErrorCode, PairingCode, Runtime, RuntimeError,
    runtime::now_unix_ms,
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use p256::ecdsa::{Signature, VerifyingKey, signature::Verifier};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

const MAX_CLOCK_SKEW_SECONDS: i64 = 300;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicJwk {
    pub kty: String,
    pub crv: String,
    pub x: String,
    pub y: String,
}

#[derive(Debug, Deserialize)]
struct DpopHeader {
    typ: String,
    alg: String,
    jwk: PublicJwk,
}

#[derive(Debug, Deserialize)]
struct DpopClaims {
    htm: String,
    htu: String,
    iat: i64,
    jti: String,
}

#[derive(Debug, Deserialize)]
pub struct PairRequest {
    pub code: String,
    pub client_id: String,
    pub jwk: PublicJwk,
}

pub fn create_pairing_code(runtime: &Runtime, pairing: &PairingCode) -> Result<(), RuntimeError> {
    runtime.with_store(|store| store.create_pairing_code(pairing))
}

pub fn local_process_principal(
    client_id: impl Into<String>,
) -> Result<AuthenticatedPrincipal, RuntimeError> {
    Ok(AuthenticatedPrincipal::verified_local(
        crate::platform::local_process_subject()?,
        client_id,
    ))
}

pub fn redeem_pairing_code(
    runtime: &Runtime,
    request: &PairRequest,
    lease_duration_ms: i64,
) -> Result<CapabilityLease, RuntimeError> {
    let thumbprint = jwk_thumbprint(&request.jwk)?;
    runtime.with_store(|store| {
        store.redeem_pairing_code(
            &request.code,
            &request.client_id,
            &thumbprint,
            now_unix_ms(),
            lease_duration_ms,
        )
    })
}

pub fn verify_dpop(
    runtime: &Runtime,
    proof: &str,
    client_id: &str,
    method: &str,
    target_uri: &str,
    required_scope: &str,
) -> Result<AuthenticatedPrincipal, RuntimeError> {
    let mut parts = proof.split('.');
    let header_part = parts.next().unwrap_or_default();
    let claims_part = parts.next().unwrap_or_default();
    let signature_part = parts.next().unwrap_or_default();
    if parts.next().is_some()
        || header_part.is_empty()
        || claims_part.is_empty()
        || signature_part.is_empty()
    {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "invalid DPoP compact JWS",
        ));
    }

    let header: DpopHeader = decode_json(header_part)?;
    let claims: DpopClaims = decode_json(claims_part)?;
    if header.typ != "dpop+jwt" || header.alg != "ES256" {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "DPoP typ or algorithm is not accepted",
        ));
    }
    if claims.htm != method || claims.htu != target_uri || claims.jti.trim().is_empty() {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "DPoP method, URI, or proof identity mismatch",
        ));
    }
    let now_ms = now_unix_ms();
    let now_seconds = now_ms / 1_000;
    if (now_seconds - claims.iat).abs() > MAX_CLOCK_SKEW_SECONDS {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "DPoP issue time is outside the accepted window",
        ));
    }

    let verifying_key = verifying_key(&header.jwk)?;
    let signature_bytes = URL_SAFE_NO_PAD
        .decode(signature_part)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid DPoP signature"))?;
    let signature = Signature::from_slice(&signature_bytes)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid ES256 signature"))?;
    let signing_input = format!("{header_part}.{claims_part}");
    verifying_key
        .verify(signing_input.as_bytes(), &signature)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "DPoP signature rejected"))?;

    let thumbprint = jwk_thumbprint(&header.jwk)?;
    runtime.with_store(|store| {
        store.authorize_dpop(client_id, &thumbprint, &claims.jti, required_scope, now_ms)
    })
}

pub fn jwk_thumbprint(jwk: &PublicJwk) -> Result<String, RuntimeError> {
    if jwk.kty != "EC" || jwk.crv != "P-256" {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "only EC P-256 keys are accepted",
        ));
    }
    let canonical = format!(
        "{{\"crv\":\"{}\",\"kty\":\"{}\",\"x\":\"{}\",\"y\":\"{}\"}}",
        jwk.crv, jwk.kty, jwk.x, jwk.y
    );
    Ok(URL_SAFE_NO_PAD.encode(Sha256::digest(canonical.as_bytes())))
}

fn verifying_key(jwk: &PublicJwk) -> Result<VerifyingKey, RuntimeError> {
    let x = URL_SAFE_NO_PAD
        .decode(&jwk.x)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid JWK x coordinate"))?;
    let y = URL_SAFE_NO_PAD
        .decode(&jwk.y)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid JWK y coordinate"))?;
    if x.len() != 32 || y.len() != 32 {
        return Err(RuntimeError::new(
            ErrorCode::Unauthenticated,
            "invalid P-256 coordinate length",
        ));
    }
    let mut encoded = Vec::with_capacity(65);
    encoded.push(4);
    encoded.extend_from_slice(&x);
    encoded.extend_from_slice(&y);
    VerifyingKey::from_sec1_bytes(&encoded)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid P-256 public key"))
}

fn decode_json<T: for<'de> Deserialize<'de>>(value: &str) -> Result<T, RuntimeError> {
    let bytes = URL_SAFE_NO_PAD
        .decode(value)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid base64url"))?;
    serde_json::from_slice(&bytes)
        .map_err(|_| RuntimeError::new(ErrorCode::Unauthenticated, "invalid DPoP JSON"))
}
