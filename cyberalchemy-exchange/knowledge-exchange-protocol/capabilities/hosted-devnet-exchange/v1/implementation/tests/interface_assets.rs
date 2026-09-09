#![cfg(feature = "ui")]

use axum::{
    body::Body,
    http::{header, Request, StatusCode},
};
use cyberalchemy_kep_hosted_devnet::{
    router_with_ui as router, Application, FinalityGateway, MockFinalityGateway,
};
use http_body_util::BodyExt;
use tower::ServiceExt;

#[tokio::test]
async fn interface_assets_are_complete_same_origin_and_security_bounded() {
    let application =
        Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await;
    let app = router(application);

    let page = app
        .clone()
        .oneshot(Request::get("/white-paper").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(page.status(), StatusCode::OK);
    let csp = page
        .headers()
        .get(header::CONTENT_SECURITY_POLICY)
        .unwrap()
        .to_str()
        .unwrap();
    assert!(csp.contains("default-src 'self'"));
    assert!(csp.contains("https://api.devnet.solana.com"));
    assert!(csp.contains("object-src 'none'"));
    let html = String::from_utf8(
        page.into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec(),
    )
    .unwrap();
    assert!(html.contains("id=\"paper-view\""));
    assert!(!html.contains("id=\"home-view\""));
    assert!(!html.contains("id=\"explore-view\""));
    assert!(!html.contains("assets/app.js"));
    assert!(html.contains("href=\"/\""));
    assert!(html.contains("href=\"/console-experience/\""));
    assert!(html.contains("kep-logo-light-v2.svg"));
    assert!(html.contains("paper-boundary"));
    assert!(html.contains("paper-correctness"));
    assert!(!html.contains("<script>"));
    assert!(!html.contains("<style>"));

    let reference = app.clone()
        .oneshot(Request::get("/design-system").body(Body::empty()).unwrap())
        .await.unwrap();
    assert_eq!(reference.status(), StatusCode::OK);
    assert!(reference.headers().get(header::CONTENT_SECURITY_POLICY).is_some());
    let reference = String::from_utf8(reference.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap();
    assert!(reference.contains("/assets/design-system.css"));
    assert!(!reference.contains("<script"), "reference must not run wallet or hosted operations");

    let cli = app.clone().oneshot(Request::get("/cli-api").body(Body::empty()).unwrap()).await.unwrap();
    assert_eq!(cli.status(), StatusCode::OK);
    let cli = String::from_utf8(cli.into_body().collect().await.unwrap().to_bytes().to_vec()).unwrap();
    assert!(cli.contains("Use KEP without a browser"));
    assert!(cli.contains("node cli/kep.mjs login"));
    assert!(!cli.contains("<script"), "CLI guide must not request wallet or API effects");

    for (path, content_type, minimum_bytes, maximum_bytes) in [
        ("/assets/design-system.css", "text/css; charset=utf-8", 5_000, 30_000),
        (
            "/assets/style.css",
            "text/css; charset=utf-8",
            5_000,
            100_000,
        ),
        (
            "/assets/brand.css",
            "text/css; charset=utf-8",
            5_000,
            100_000,
        ),
        (
            "/assets/cyberalchemy-mark.svg",
            "image/svg+xml",
            1_000,
            100_000,
        ),
        ("/assets/flag-br.svg", "image/svg+xml", 1_000, 10_000),
        ("/assets/flag-us.svg", "image/svg+xml", 500, 10_000),
        (
            "/assets/cyberalchemy-orb-frozen.webp",
            "image/webp",
            10_000,
            50_000,
        ),
        (
            "/assets/cyberalchemy-orb-loop.webm",
            "video/webm",
            100_000,
            500_000,
        ),
        (
            "/assets/app.js",
            "application/javascript; charset=utf-8",
            100_000,
            600_000,
        ),
    ] {
        let response = app
            .clone()
            .oneshot(Request::get(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers().get(header::CONTENT_TYPE).unwrap(),
            content_type
        );
        let bytes = response
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .len();
        assert!(bytes > minimum_bytes, "{path} is unexpectedly empty");
        assert!(bytes < maximum_bytes, "{path} exceeds its byte ceiling");
    }

    let brand_css = app
        .oneshot(
            Request::get("/assets/brand.css")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let brand_css = String::from_utf8(
        brand_css
            .into_body()
            .collect()
            .await
            .unwrap()
            .to_bytes()
            .to_vec(),
    )
    .unwrap();
    assert!(brand_css.contains(".home-orb-motion.is-active"));
    assert!(brand_css.contains(".home-orb.has-motion .home-orb-still"));
    assert!(brand_css.contains(".kep-term:focus-visible .kep-tooltip"));
    assert!(brand_css.contains("min-height: calc(100svh - 66px);"));
    assert!(brand_css.contains("align-content: safe center;"));
    assert!(!brand_css.contains("\n  height: calc(100svh - 66px);"));
    assert!(!brand_css.contains("ca2-home-orb-turn"));
    assert!(brand_css.contains("@media (prefers-reduced-motion: reduce)"));
    assert!(brand_css.contains(".home-orb-motion { display: none; }"));
}
