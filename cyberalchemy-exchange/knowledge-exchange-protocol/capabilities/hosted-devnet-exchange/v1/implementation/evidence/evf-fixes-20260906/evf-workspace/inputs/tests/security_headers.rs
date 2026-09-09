#![cfg(feature = "ui")]
use axum::{body::Body, http::{Request, StatusCode}};
use cyberalchemy_kep_hosted_devnet::{router_with_ui, Application, FinalityGateway, MockFinalityGateway};
use tower::ServiceExt;

#[tokio::test]
async fn headers_cover_pages_assets_api_errors_and_missing_routes() {
    let app = router_with_ui(Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await);
    for (method, path, expected) in [
        ("GET", "/", StatusCode::OK),
        ("GET", "/console-experience/", StatusCode::OK),
        ("GET", "/white-paper", StatusCode::OK),
        ("GET", "/assets/console-experience.js", StatusCode::OK),
        ("GET", "/health", StatusCode::OK),
        ("GET", "/missing-route", StatusCode::NOT_FOUND),
        ("POST", "/v1/identities", StatusCode::BAD_REQUEST),
        ("POST", "/health", StatusCode::METHOD_NOT_ALLOWED),
    ] {
        let response = app.clone().oneshot(Request::builder().method(method).uri(path)
            .header("content-type", "application/json")
            .body(Body::from("{" )).unwrap()).await.unwrap();
        assert_eq!(response.status(), expected, "{path}");
        let h = response.headers();
        assert_eq!(h["strict-transport-security"], "max-age=31536000", "{path}");
        assert_eq!(h["x-content-type-options"], "nosniff", "{path}");
        assert_eq!(h["referrer-policy"], "no-referrer", "{path}");
        if ["/", "/console-experience/", "/white-paper"].contains(&path) {
            assert!(h["content-security-policy"].to_str().unwrap().contains("frame-ancestors 'none'"));
        }
    }
}
