//! Optional participant workbench delivery.
//!
//! This module is deliberately excluded from the default protocol build and
//! from the protocol implementation binding. Enable the `ui` Cargo feature to
//! compose these routes with the protocol API.

use axum::{
    http::{header, HeaderValue},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};

use crate::{api::router, Application};

pub fn router_with_ui(application: Application) -> Router {
    router(application).merge(crate::file_ui::routes()).merge(
        Router::new()
            .route("/", get(landing))
            .route("/console-experience/", get(console_experience))
            .route("/console-experience", get(console_experience))
            .route("/assets/console-experience.css", get(console_experience_css))
            .route("/assets/console-experience.js", get(console_experience_js))
            .route("/workbench", get(workbench_redirect))
            .route("/white-paper", get(white_paper))
            .route("/assets/white-paper.css", get(white_paper_css))
            .route("/assets/workbench-redirect.js", get(workbench_redirect_js))
            .route("/white-paper/", get(white_paper))
            .route("/assets/landing.css", get(landing_css))
            .route("/assets/landing.js", get(landing_js))
            .route("/assets/kep-logo-dark-v2.svg", get(kep_dark_vector))
            .route("/assets/kep-logo-light-v2.svg", get(kep_light_vector))
            .route("/assets/cyberalchemy-lab-logo-dark-v2.svg", get(cyberalchemy_lab_dark_vector))
            .route("/assets/cyberalchemy-lab-logo-light-v2.svg", get(cyberalchemy_lab_light_vector))
            .route("/assets/kep-logo-approved-v1.png", get(kep_logo))
            .route("/assets/cyberalchemy-lab-logo-v1.png", get(lab_logo))
            .route("/design-system", get(design_system))
            .route("/assets/design-system.css", get(design_system_styles))
            .route("/assets/style.css", get(styles))
            .route("/assets/brand.css", get(brand_styles))
            .route("/assets/cyberalchemy-mark.svg", get(cyberalchemy_mark))
            .route("/assets/flag-br.svg", get(flag_br))
            .route("/assets/flag-us.svg", get(flag_us))
            .route(
                "/assets/cyberalchemy-orb-frozen.webp",
                get(cyberalchemy_orb_frozen_webp),
            )
            .route(
                "/assets/cyberalchemy-orb-loop.webm",
                get(cyberalchemy_orb_loop_webm),
            )
            .route("/assets/app.js", get(client_script)),
    ).layer(axum::middleware::from_fn(security_headers))
}

// Outer layer covers UI, API, errors and fallback responses without buffering
// their bodies. HSTS is host-only: no includeSubDomains or preload commitment.
async fn security_headers(
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    headers.insert(header::STRICT_TRANSPORT_SECURITY, HeaderValue::from_static("max-age=31536000"));
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    headers.insert(header::REFERRER_POLICY, HeaderValue::from_static("no-referrer"));
    response
}


async fn design_system() -> Response {
    page_response(include_str!("../static/design-system.html"))
}

async fn design_system_styles() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/css; charset=utf-8")],
        include_str!("../static/assets/design-system.css"),
    )
}

fn page_response(html: &'static str) -> Response {
    let mut response = Html(html).into_response();
    response.headers_mut().insert(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static(
            "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' https://api.devnet.solana.com wss://api.devnet.solana.com; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
        ),
    );
    response
}

async fn styles() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/css; charset=utf-8")],
        include_str!("../static/assets/style.css"),
    )
}

async fn brand_styles() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/css; charset=utf-8")],
        include_str!("../static/assets/brand.css"),
    )
}

async fn cyberalchemy_mark() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "image/svg+xml")],
        include_str!("../../../../../../../../arcanum/docs/assets/cyberalchemy-mark.svg"),
    )
}

async fn flag_br() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "image/svg+xml")],
        include_str!("../static/assets/flag-br.svg"),
    )
}

async fn flag_us() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "image/svg+xml")],
        include_str!("../static/assets/flag-us.svg"),
    )
}

async fn cyberalchemy_orb_frozen_webp() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "image/webp")],
        include_bytes!("../static/assets/cyberalchemy-orb-frozen.webp").as_slice(),
    )
}

async fn cyberalchemy_orb_loop_webm() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "video/webm")],
        include_bytes!("../static/assets/cyberalchemy-orb-loop.webm").as_slice(),
    )
}

async fn client_script() -> impl IntoResponse {
    (
        [(
            header::CONTENT_TYPE,
            "application/javascript; charset=utf-8",
        )],
        include_str!("../static/assets/app.js"),
    )
}

async fn landing() -> Response { page_response(include_str!("../static/landing.html")) }
async fn landing_css() -> impl IntoResponse { ([(header::CONTENT_TYPE,"text/css; charset=utf-8")],include_str!("../static/assets/landing.css")) }
async fn landing_js() -> impl IntoResponse { ([(header::CONTENT_TYPE,"application/javascript; charset=utf-8")],include_str!("../static/assets/landing.js")) }
async fn kep_logo() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/png")],include_bytes!("../static/assets/kep-logo-approved-v1.png").as_slice()) }

async fn lab_logo() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/png")],include_bytes!("../static/assets/cyberalchemy-lab-logo-v1.png").as_slice()) }

async fn kep_dark_vector() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/svg+xml")],include_str!("../static/assets/kep-logo-dark-v2.svg")) }

async fn kep_light_vector() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/svg+xml")],include_str!("../static/assets/kep-logo-light-v2.svg")) }

async fn cyberalchemy_lab_dark_vector() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/svg+xml")],include_str!("../static/assets/cyberalchemy-lab-logo-dark-v2.svg")) }

async fn cyberalchemy_lab_light_vector() -> impl IntoResponse { ([(header::CONTENT_TYPE,"image/svg+xml")],include_str!("../static/assets/cyberalchemy-lab-logo-light-v2.svg")) }

async fn console_experience() -> Response { page_response(include_str!("../static/console-experience.html")) }
async fn console_experience_css() -> impl IntoResponse { ([(header::CONTENT_TYPE,"text/css; charset=utf-8")],include_str!("../static/assets/console-experience.css")) }
async fn console_experience_js() -> impl IntoResponse { ([(header::CONTENT_TYPE,"text/javascript; charset=utf-8")],include_str!("../static/assets/console-experience.js")) }

async fn white_paper() -> Response { page_response(include_str!("../static/white-paper.html")) }
async fn workbench_redirect() -> Response { page_response(include_str!("../static/workbench-redirect.html")) }

async fn white_paper_css() -> impl IntoResponse { ([(header::CONTENT_TYPE,"text/css; charset=utf-8")],include_str!("../static/assets/white-paper.css")) }
async fn workbench_redirect_js() -> impl IntoResponse { ([(header::CONTENT_TYPE,"application/javascript; charset=utf-8")],include_str!("../static/assets/workbench-redirect.js")) }
