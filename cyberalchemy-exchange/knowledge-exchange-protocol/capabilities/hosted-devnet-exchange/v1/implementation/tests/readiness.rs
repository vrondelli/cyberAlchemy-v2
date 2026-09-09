use axum::{body::Body, http::{Request, StatusCode}};
use cyberalchemy_kep_hosted_devnet::{router, Application, FinalityGateway, MockFinalityGateway};
use tower::ServiceExt;

#[tokio::test]
async fn ephemeral_application_is_live_but_not_deployment_ready() {
    let app = router(Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await);
    let live = app.clone().oneshot(Request::get("/health").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(live.status(), StatusCode::OK);
    let ready = app.oneshot(Request::get("/ready").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(ready.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(ready.headers()["cache-control"], "no-store");
}
