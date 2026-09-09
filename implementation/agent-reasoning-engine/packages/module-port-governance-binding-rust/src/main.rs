use are_module_port_governance_binding::verify_repository;
use std::path::PathBuf;

fn main() {
    let mut args = std::env::args_os().skip(1);
    let flag = args.next();
    let root = args.next();
    if flag.as_deref() != Some("--repository-root".as_ref())
        || root.is_none()
        || args.next().is_some()
    {
        eprintln!("usage: are-module-port-governance-binding --repository-root <path>");
        std::process::exit(2);
    }
    let receipt = verify_repository(&PathBuf::from(root.unwrap()));
    print!("{}", receipt.to_pretty_json());
    if !receipt.is_pass() {
        std::process::exit(1);
    }
}
