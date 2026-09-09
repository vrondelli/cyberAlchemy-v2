
use std::io::{self,Read};
#[tokio::main]
async fn main()->Result<(),Box<dyn std::error::Error>>{
 let args:Vec<String>=std::env::args().skip(1).collect();
 if args.is_empty()||args==["serve"]{let host=std::env::var("HOST").unwrap_or("127.0.0.1".into());let port=std::env::var("PORT").unwrap_or("3000".into());let listener=tokio::net::TcpListener::bind(format!("{host}:{port}")).await?;println!("{}",serde_json::json!({"address":listener.local_addr()?.to_string()}));axum::serve(listener,axum::Router::new().fallback(alch_function::handler)).await?;return Ok(());}
 if args!=["invoke"]&&args!=["trace"]{return Err("usage: alch-function [serve|invoke|trace]".into());}
 let mut bytes=Vec::new();io::stdin().take(1048577).read_to_end(&mut bytes)?;if bytes.len()>1048576{return Err("FUNCTION_BODY_LIMIT".into());}let input=serde_json::from_slice(&bytes)?;
 if args==["trace"]{let manifest_path=std::env::current_exe()?.parent().ok_or("executable parent")?.join("manifest.json");let manifest=serde_json::from_slice(&std::fs::read(manifest_path)?)?;let result=alch_function::trace(input,manifest).await;println!("{}",result);if result["outcome"]["status"]=="failed"{std::process::exit(1);}}
 else{match alch_function::invoke(input,&std::collections::BTreeMap::new()).await{Ok(v)=>println!("{v}"),Err(code)=>{println!("{}",serde_json::json!({"error":code}));std::process::exit(1);}}}Ok(())
}
