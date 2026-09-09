use std::env;

use cyberalchemy_kep_hosted_devnet::{FinalityGateway, DEFAULT_DEVNET_RPC};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut arguments = env::args().skip(1);
    let signature = arguments
        .next()
        .ok_or("usage: observe <transaction-signature> <artifact-account>")?;
    let artifact_account = arguments
        .next()
        .ok_or("usage: observe <transaction-signature> <artifact-account>")?;
    if arguments.next().is_some() {
        return Err("usage: observe <transaction-signature> <artifact-account>".into());
    }
    let rpc = env::var("CA2_KEP_DEVNET_RPC_URL").unwrap_or_else(|_| DEFAULT_DEVNET_RPC.into());
    let observation = FinalityGateway::devnet(rpc)
        .observe(&signature, &artifact_account)
        .await?;
    println!("{}", serde_json::to_string_pretty(&observation)?);
    Ok(())
}
