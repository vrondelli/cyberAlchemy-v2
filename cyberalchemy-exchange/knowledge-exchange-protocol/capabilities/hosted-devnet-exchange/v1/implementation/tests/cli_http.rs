use std::{fs,process::Command,time::{SystemTime,UNIX_EPOCH}};

use cyberalchemy_kep_hosted_devnet::{router,Application,FinalityGateway,MockFinalityGateway};

#[tokio::test(flavor="multi_thread",worker_threads=2)]
async fn node_cli_uses_the_real_http_account_and_upload_routes(){
    let listener=tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();let address=listener.local_addr().unwrap();
    let app=router(Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await);
    let server=tokio::spawn(async move{axum::serve(listener,app).await.unwrap()});
    let nonce=SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();let root=std::env::temp_dir().join(format!("kep-cli-http-{}-{nonce}",std::process::id()));fs::create_dir(&root).unwrap();
    let output=Command::new("node").arg("tests/cli-http-smoke.mjs").arg(format!("http://{address}")).arg(&root).current_dir(env!("CARGO_MANIFEST_DIR")).output().expect("run Node CLI smoke test");
    server.abort();let _=fs::remove_dir_all(&root);
    assert!(output.status.success(),"Node CLI smoke failed:\nstdout: {}\nstderr: {}",String::from_utf8_lossy(&output.stdout),String::from_utf8_lossy(&output.stderr));
    let value:serde_json::Value=serde_json::from_slice(&output.stdout).unwrap();assert_eq!(value["originalBytes"],4);assert!(value["artifactId"].as_str().is_some_and(|id|id.len()==64));
}
