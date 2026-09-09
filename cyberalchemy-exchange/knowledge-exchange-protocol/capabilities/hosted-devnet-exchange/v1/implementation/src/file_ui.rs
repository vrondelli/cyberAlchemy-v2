//! Same-origin local file console. No automatic wallet or chain effects.
use axum::{
    http::header,
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
pub fn routes() -> Router {
    Router::new().route("/files",get(||async { (
        [(header::CONTENT_SECURITY_POLICY,"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.devnet.solana.com wss://api.devnet.solana.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")],
        Html(include_str!("../static/files.html"))) }))
    .route("/assets/files.js",get(script))
    .route("/assets/files.css",get(||async { ([(header::CONTENT_TYPE,"text/css")],include_str!("../static/assets/files.css")) }))
}
async fn script() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/javascript")],
        include_str!("../static/assets/files.js"),
    )
}
