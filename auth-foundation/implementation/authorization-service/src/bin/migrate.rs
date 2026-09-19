use std::path::PathBuf;

fn main() {
    let mut arguments = std::env::args_os().skip(1);
    let Some(path) = arguments.next().map(PathBuf::from) else {
        eprintln!("usage: migrate <sqlite-database-path>");
        std::process::exit(2);
    };
    if arguments.next().is_some() {
        eprintln!("usage: migrate <sqlite-database-path>");
        std::process::exit(2);
    }
    if auth_foundation_authorization_service::migrate_database(path).is_err() {
        eprintln!("auth service schema migration failed");
        std::process::exit(1);
    }
}
