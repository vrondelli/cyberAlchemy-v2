use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::{Read, Write};
use std::os::unix::fs::MetadataExt;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};
use tempfile::{NamedTempFile, TempDir};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolchainBinding {
    pub executable: PathBuf,
    pub executable_sha256: String,
    pub closure_sha256: BTreeMap<PathBuf, String>,
    pub bubblewrap: PathBuf,
    pub bubblewrap_sha256: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RepositoryWorkInput {
    pub command_id: String,
    pub repository_root: PathBuf,
    pub repository_root_identity: String,
    pub argv: Vec<String>,
    pub read_scope: Vec<PathBuf>,
    pub write_scope: Vec<PathBuf>,
    pub required_outputs: BTreeMap<PathBuf, Option<String>>,
    pub protected_sha256: BTreeMap<PathBuf, String>,
    pub deadline_unix_ms: u128,
    pub max_output_bytes: usize,
    pub authority_effect: String,
    pub external_effect: String,
    pub toolchain: ToolchainBinding,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct RepositoryWorkReceipt {
    pub command_id: String,
    pub status: String,
    pub cause: Option<String>,
    pub changed_paths: Vec<PathBuf>,
    pub output_sha256: BTreeMap<PathBuf, String>,
    pub protected_verified: bool,
    pub promoted: bool,
    pub elapsed_ms: u128,
    pub authority_effect: String,
    pub external_effect: String,
}

#[derive(Debug)]
pub struct PreparedRepositoryWork {
    input: RepositoryWorkInput,
    root: PathBuf,
    stage: TempDir,
    write_preimage: BTreeMap<PathBuf, Option<String>>,
    write_chain_preimage: BTreeMap<PathBuf, PathChainSnapshot>,
}

#[derive(Debug)]
struct PathChainSnapshot {
    existing: Vec<(PathBuf, u64, u64, bool)>,
    first_absent: Option<PathBuf>,
}

fn sha_bytes(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn sha_file(path: &Path) -> Result<String, String> {
    fs::read(path)
        .map(|bytes| sha_bytes(&bytes))
        .map_err(|error| format!("REPOSITORY_HASH_FAILED:{}:{error}", path.display()))
}

pub fn repository_root_identity(root: &Path) -> Result<String, String> {
    let root = root
        .canonicalize()
        .map_err(|error| format!("REPOSITORY_ROOT_INVALID:{error}"))?;
    Ok(sha_bytes(root.as_os_str().as_encoded_bytes()))
}

fn validate_relative(path: &Path) -> Result<(), String> {
    if path.as_os_str().is_empty()
        || path.is_absolute()
        || path
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err(format!("REPOSITORY_PATH_ESCAPE:{}", path.display()));
    }
    Ok(())
}

fn reject_links(root: &Path, relative: &Path, may_be_absent: bool) -> Result<(), String> {
    let mut current = root.to_path_buf();
    for part in relative.components() {
        let Component::Normal(part) = part else {
            return Err(format!("REPOSITORY_PATH_ESCAPE:{}", relative.display()));
        };
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(metadata) => {
                if metadata.file_type().is_symlink() || metadata.nlink() > 1 && metadata.is_file() {
                    return Err(format!(
                        "REPOSITORY_PATH_LINK_FORBIDDEN:{}",
                        relative.display()
                    ));
                }
            }
            Err(error) if may_be_absent && error.kind() == std::io::ErrorKind::NotFound => break,
            Err(error) => {
                return Err(format!(
                    "REPOSITORY_PATH_INVALID:{}:{error}",
                    relative.display()
                ))
            }
        }
    }
    Ok(())
}

fn snapshot_path_chain(root: &Path, relative: &Path) -> Result<PathChainSnapshot, String> {
    let mut current = root.to_path_buf();
    let mut existing = Vec::new();
    for part in relative.components() {
        let Component::Normal(part) = part else {
            return Err(format!("REPOSITORY_PATH_ESCAPE:{}", relative.display()));
        };
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(metadata) => existing.push((
                current
                    .strip_prefix(root)
                    .expect("beneath root")
                    .to_path_buf(),
                metadata.dev(),
                metadata.ino(),
                metadata.is_dir(),
            )),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(PathChainSnapshot {
                    existing,
                    first_absent: Some(
                        current
                            .strip_prefix(root)
                            .expect("beneath root")
                            .to_path_buf(),
                    ),
                })
            }
            Err(error) => {
                return Err(format!(
                    "REPOSITORY_PATH_INVALID:{}:{error}",
                    relative.display()
                ))
            }
        }
    }
    Ok(PathChainSnapshot {
        existing,
        first_absent: None,
    })
}

fn verify_path_chain(
    root: &Path,
    relative: &Path,
    snapshot: &PathChainSnapshot,
) -> Result<(), String> {
    reject_links(root, relative, true)?;
    for (component, expected_dev, expected_ino, expected_dir) in &snapshot.existing {
        let metadata = fs::symlink_metadata(root.join(component))
            .map_err(|_| format!("REPOSITORY_WRITE_CHAIN_DRIFT:{}", relative.display()))?;
        if metadata.dev() != *expected_dev
            || metadata.ino() != *expected_ino
            || metadata.is_dir() != *expected_dir
        {
            return Err(format!(
                "REPOSITORY_WRITE_CHAIN_DRIFT:{}",
                relative.display()
            ));
        }
    }
    if snapshot
        .first_absent
        .as_ref()
        .is_some_and(|path| root.join(path).exists())
    {
        return Err(format!(
            "REPOSITORY_WRITE_CHAIN_DRIFT:{}",
            relative.display()
        ));
    }
    Ok(())
}

fn copy_tree(source: &Path, destination: &Path) -> Result<(), String> {
    let metadata = fs::symlink_metadata(source)
        .map_err(|error| format!("REPOSITORY_STAGE_READ_FAILED:{}:{error}", source.display()))?;
    if metadata.file_type().is_symlink() {
        return Err(format!(
            "REPOSITORY_PATH_LINK_FORBIDDEN:{}",
            source.display()
        ));
    }
    if metadata.is_dir() {
        fs::create_dir_all(destination)
            .map_err(|error| format!("REPOSITORY_STAGE_CREATE_FAILED:{error}"))?;
        for entry in
            fs::read_dir(source).map_err(|error| format!("REPOSITORY_STAGE_READ_FAILED:{error}"))?
        {
            let entry = entry.map_err(|error| format!("REPOSITORY_STAGE_READ_FAILED:{error}"))?;
            copy_tree(&entry.path(), &destination.join(entry.file_name()))?;
        }
    } else if metadata.is_file() {
        if metadata.nlink() > 1 {
            return Err(format!(
                "REPOSITORY_PATH_LINK_FORBIDDEN:{}",
                source.display()
            ));
        }
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("REPOSITORY_STAGE_CREATE_FAILED:{error}"))?;
        }
        fs::copy(source, destination).map_err(|error| {
            format!("REPOSITORY_STAGE_COPY_FAILED:{}:{error}", source.display())
        })?;
    } else {
        return Err(format!(
            "REPOSITORY_PATH_TYPE_FORBIDDEN:{}",
            source.display()
        ));
    }
    Ok(())
}

fn inventory(root: &Path) -> Result<BTreeMap<PathBuf, String>, String> {
    fn visit(base: &Path, path: &Path, out: &mut BTreeMap<PathBuf, String>) -> Result<(), String> {
        for entry in
            fs::read_dir(path).map_err(|error| format!("REPOSITORY_INVENTORY_FAILED:{error}"))?
        {
            let entry = entry.map_err(|error| format!("REPOSITORY_INVENTORY_FAILED:{error}"))?;
            let meta = entry
                .metadata()
                .map_err(|error| format!("REPOSITORY_INVENTORY_FAILED:{error}"))?;
            if meta.is_dir() {
                visit(base, &entry.path(), out)?;
            } else if meta.is_file() {
                let relative = entry
                    .path()
                    .strip_prefix(base)
                    .expect("beneath root")
                    .to_path_buf();
                out.insert(relative, sha_file(&entry.path())?);
            } else {
                return Err("REPOSITORY_OUTPUT_INVALID".to_owned());
            }
        }
        Ok(())
    }
    let mut result = BTreeMap::new();
    visit(root, root, &mut result)?;
    Ok(result)
}

fn scope_contains(scope: &Path, path: &Path) -> bool {
    path == scope || path.starts_with(scope)
}

fn read_bounded<R: Read>(mut reader: R, maximum: usize) -> (Vec<u8>, bool) {
    let mut kept = Vec::new();
    let mut buffer = [0_u8; 8192];
    let mut overflow = false;
    loop {
        match reader.read(&mut buffer) {
            Ok(0) | Err(_) => break,
            Ok(count) => {
                if kept.len().saturating_add(count) <= maximum {
                    kept.extend_from_slice(&buffer[..count]);
                } else {
                    overflow = true;
                }
            }
        }
    }
    (kept, overflow)
}

pub fn prepare(
    input: RepositoryWorkInput,
    now_unix_ms: u128,
) -> Result<PreparedRepositoryWork, String> {
    if input.authority_effect != "none" || input.external_effect != "none" {
        return Err("REPOSITORY_EFFECT_CEILING_VIOLATION".to_owned());
    }
    if input.argv.is_empty() {
        return Err("REPOSITORY_ARGV_EMPTY".to_owned());
    }
    if input.max_output_bytes == 0 || input.max_output_bytes > 1_048_576 {
        return Err("REPOSITORY_OUTPUT_BOUND_INVALID".to_owned());
    }
    if now_unix_ms >= input.deadline_unix_ms {
        return Err("GLOBAL_DEADLINE_EXCEEDED".to_owned());
    }
    let root = input
        .repository_root
        .canonicalize()
        .map_err(|error| format!("REPOSITORY_ROOT_INVALID:{error}"))?;
    if repository_root_identity(&root)? != input.repository_root_identity {
        return Err("REPOSITORY_ROOT_MISMATCH".to_owned());
    }
    if !input.toolchain.executable.is_absolute() || !input.toolchain.bubblewrap.is_absolute() {
        return Err("TOOLCHAIN_BINDING_INVALID".to_owned());
    }
    if sha_file(&input.toolchain.executable)? != input.toolchain.executable_sha256
        || sha_file(&input.toolchain.bubblewrap)? != input.toolchain.bubblewrap_sha256
    {
        return Err("TOOLCHAIN_BINDING_DRIFT".to_owned());
    }
    for (path, expected) in &input.toolchain.closure_sha256 {
        if !path.is_absolute() || sha_file(path)? != *expected {
            return Err(format!("TOOLCHAIN_CLOSURE_DRIFT:{}", path.display()));
        }
    }
    for path in input
        .read_scope
        .iter()
        .chain(input.write_scope.iter())
        .chain(input.required_outputs.keys())
        .chain(input.protected_sha256.keys())
    {
        validate_relative(path)?;
    }
    for output in input.required_outputs.keys() {
        if !input
            .write_scope
            .iter()
            .any(|scope| scope_contains(scope, output))
        {
            return Err(format!("REPOSITORY_SCOPE_EXPANSION:{}", output.display()));
        }
    }
    if input.write_scope.len() != 1 || input.required_outputs.len() > 1 {
        return Err("REPOSITORY_NONATOMIC_WRITE_SET".to_owned());
    }
    for path in &input.read_scope {
        reject_links(&root, path, false)?;
    }
    for path in input
        .write_scope
        .iter()
        .chain(input.required_outputs.keys())
    {
        reject_links(&root, path, true)?;
    }
    let mut write_preimage = BTreeMap::new();
    let mut write_chain_preimage = BTreeMap::new();
    for path in &input.write_scope {
        let live = root.join(path);
        if live.exists() && !live.is_file() {
            return Err(format!(
                "REPOSITORY_WRITE_TARGET_NOT_REGULAR:{}",
                path.display()
            ));
        }
        write_preimage.insert(
            path.clone(),
            if live.exists() {
                Some(sha_file(&live)?)
            } else {
                None
            },
        );
        write_chain_preimage.insert(path.clone(), snapshot_path_chain(&root, path)?);
    }
    for (path, expected) in &input.protected_sha256 {
        if sha_file(&root.join(path))? != *expected {
            return Err(format!("PROTECTED_HASH_DRIFT:{}", path.display()));
        }
        if input
            .write_scope
            .iter()
            .any(|scope| scope_contains(scope, path) || scope_contains(path, scope))
        {
            return Err(format!(
                "REPOSITORY_SCOPE_PROTECTED_OVERLAP:{}",
                path.display()
            ));
        }
    }
    let stage =
        tempfile::tempdir().map_err(|error| format!("REPOSITORY_STAGE_CREATE_FAILED:{error}"))?;
    for path in input.read_scope.iter().chain(input.write_scope.iter()) {
        let source = root.join(path);
        if source.exists() {
            copy_tree(&source, &stage.path().join(path))?;
        } else if input.write_scope.contains(path) {
            if let Some(parent) = stage.path().join(path).parent() {
                fs::create_dir_all(parent)
                    .map_err(|error| format!("REPOSITORY_STAGE_CREATE_FAILED:{error}"))?;
            }
            fs::File::create(stage.path().join(path))
                .map_err(|error| format!("REPOSITORY_STAGE_CREATE_FAILED:{error}"))?;
        } else {
            return Err(format!("REPOSITORY_READ_SCOPE_MISSING:{}", path.display()));
        }
    }
    Ok(PreparedRepositoryWork {
        input,
        root,
        stage,
        write_preimage,
        write_chain_preimage,
    })
}

fn failure(input: &RepositoryWorkInput, start: Instant, cause: String) -> RepositoryWorkReceipt {
    RepositoryWorkReceipt {
        command_id: input.command_id.clone(),
        status: "failed".to_owned(),
        cause: Some(cause),
        changed_paths: Vec::new(),
        output_sha256: BTreeMap::new(),
        protected_verified: false,
        promoted: false,
        elapsed_ms: start.elapsed().as_millis(),
        authority_effect: "none".to_owned(),
        external_effect: "none".to_owned(),
    }
}

impl PreparedRepositoryWork {
    pub fn execute(self, now_unix_ms: u128) -> RepositoryWorkReceipt {
        let start = Instant::now();
        if sha_file(&self.input.toolchain.executable).ok().as_ref()
            != Some(&self.input.toolchain.executable_sha256)
            || sha_file(&self.input.toolchain.bubblewrap).ok().as_ref()
                != Some(&self.input.toolchain.bubblewrap_sha256)
            || self
                .input
                .toolchain
                .closure_sha256
                .iter()
                .any(|(path, expected)| sha_file(path).ok().as_ref() != Some(expected))
        {
            return failure(&self.input, start, "TOOLCHAIN_BINDING_DRIFT".to_owned());
        }
        let before = match inventory(self.stage.path()) {
            Ok(value) => value,
            Err(error) => return failure(&self.input, start, error),
        };
        let mut command = Command::new(&self.input.toolchain.bubblewrap);
        command
            .arg("--die-with-parent")
            .arg("--new-session")
            .arg("--unshare-all")
            .arg("--clearenv")
            .arg("--proc")
            .arg("/proc")
            .arg("--dev")
            .arg("/dev")
            .arg("--ro-bind")
            .arg(self.stage.path())
            .arg("/workspace");
        for path in &self.input.write_scope {
            command
                .arg("--bind")
                .arg(self.stage.path().join(path))
                .arg(Path::new("/workspace").join(path));
        }
        let mut closure = BTreeSet::new();
        closure.insert(self.input.toolchain.executable.clone());
        closure.extend(self.input.toolchain.closure_sha256.keys().cloned());
        let mut parents = closure
            .iter()
            .filter_map(|path| path.parent())
            .flat_map(|parent| {
                let mut paths = Vec::new();
                let mut current = PathBuf::from("/");
                for component in parent.components() {
                    if let Component::Normal(component) = component {
                        current.push(component);
                        paths.push(current.clone());
                    }
                }
                paths
            })
            .collect::<Vec<_>>();
        parents.sort_by_key(|path| path.components().count());
        parents.dedup();
        for parent in parents {
            command.arg("--dir").arg(parent);
        }
        for path in closure {
            command.arg("--ro-bind").arg(&path).arg(&path);
        }
        command
            .arg("--chdir")
            .arg("/workspace")
            .arg("--")
            .arg(&self.input.toolchain.executable);
        command.args(&self.input.argv);
        command
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let remaining = self.input.deadline_unix_ms.saturating_sub(now_unix_ms);
        let mut child = match command.spawn() {
            Ok(child) => child,
            Err(error) => {
                return failure(
                    &self.input,
                    start,
                    format!("CONTAINMENT_BACKEND_FAILED:{error}"),
                )
            }
        };
        let stdout = match child.stdout.take() {
            Some(value) => value,
            None => return failure(&self.input, start, "REPOSITORY_STDOUT_MISSING".to_owned()),
        };
        let stderr = match child.stderr.take() {
            Some(value) => value,
            None => return failure(&self.input, start, "REPOSITORY_STDERR_MISSING".to_owned()),
        };
        let maximum = self.input.max_output_bytes;
        let stdout_reader = std::thread::spawn(move || read_bounded(stdout, maximum));
        let stderr_reader = std::thread::spawn(move || read_bounded(stderr, maximum));
        let timeout = Duration::from_millis(u64::try_from(remaining).unwrap_or(u64::MAX));
        let status = loop {
            match child.try_wait() {
                Ok(Some(status)) => break status,
                Ok(None) if start.elapsed() < timeout => {
                    std::thread::sleep(Duration::from_millis(10))
                }
                Ok(None) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    let _ = stdout_reader.join();
                    let _ = stderr_reader.join();
                    return failure(&self.input, start, "GLOBAL_DEADLINE_EXCEEDED".to_owned());
                }
                Err(error) => {
                    return failure(
                        &self.input,
                        start,
                        format!("REPOSITORY_COMMAND_WAIT_FAILED:{error}"),
                    )
                }
            }
        };
        let (_, stdout_overflow) = match stdout_reader.join() {
            Ok(value) => value,
            Err(_) => {
                return failure(
                    &self.input,
                    start,
                    "REPOSITORY_OUTPUT_THREAD_FAILED".to_owned(),
                )
            }
        };
        let (_, stderr_overflow) = match stderr_reader.join() {
            Ok(value) => value,
            Err(_) => {
                return failure(
                    &self.input,
                    start,
                    "REPOSITORY_OUTPUT_THREAD_FAILED".to_owned(),
                )
            }
        };
        if stdout_overflow || stderr_overflow {
            return failure(
                &self.input,
                start,
                "REPOSITORY_OUTPUT_LIMIT_EXCEEDED".to_owned(),
            );
        }
        if !status.success() {
            return failure(
                &self.input,
                start,
                format!("REPOSITORY_COMMAND_FAILED:{status}"),
            );
        }
        let after = match inventory(self.stage.path()) {
            Ok(value) => value,
            Err(error) => return failure(&self.input, start, error),
        };
        let changed = before
            .keys()
            .chain(after.keys())
            .collect::<BTreeSet<_>>()
            .into_iter()
            .filter(|path| before.get(*path) != after.get(*path))
            .cloned()
            .collect::<Vec<_>>();
        if let Some(path) = changed.iter().find(|path| {
            !self
                .input
                .write_scope
                .iter()
                .any(|scope| scope_contains(scope, path))
        }) {
            return failure(
                &self.input,
                start,
                format!("REPOSITORY_SCOPE_EXPANSION:{}", path.display()),
            );
        }
        let mut outputs = BTreeMap::new();
        for (path, expected) in &self.input.required_outputs {
            let actual = match after.get(path) {
                Some(value) => value.clone(),
                None => {
                    return failure(
                        &self.input,
                        start,
                        format!("REPOSITORY_OUTPUT_INVALID:{}", path.display()),
                    )
                }
            };
            if expected
                .as_ref()
                .is_some_and(|expected| expected != &actual)
            {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_OUTPUT_INVALID:{}", path.display()),
                );
            }
            outputs.insert(path.clone(), actual);
        }
        for (path, expected) in &self.input.protected_sha256 {
            if sha_file(&self.root.join(path)).ok().as_ref() != Some(expected) {
                return failure(
                    &self.input,
                    start,
                    format!("PROTECTED_HASH_DRIFT:{}", path.display()),
                );
            }
        }
        for (path, expected) in &self.write_preimage {
            let live = self.root.join(path);
            let actual = if live.exists() {
                match sha_file(&live) {
                    Ok(value) => Some(value),
                    Err(error) => return failure(&self.input, start, error),
                }
            } else {
                None
            };
            if &actual != expected {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_WRITE_PREIMAGE_DRIFT:{}", path.display()),
                );
            }
            if let Err(error) =
                verify_path_chain(&self.root, path, &self.write_chain_preimage[path])
            {
                return failure(&self.input, start, error);
            }
        }
        if changed.len() > 1 {
            return failure(
                &self.input,
                start,
                "REPOSITORY_NONATOMIC_WRITE_SET".to_owned(),
            );
        }
        for path in &changed {
            let staged = self.stage.path().join(path);
            if !staged.is_file() {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_OUTPUT_INVALID:{}", path.display()),
                );
            }
            let destination = self.root.join(path);
            let Some(parent) = destination.parent() else {
                return failure(
                    &self.input,
                    start,
                    "REPOSITORY_PROMOTION_INVALID".to_owned(),
                );
            };
            if let Err(error) = fs::create_dir_all(parent) {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_PROMOTION_FAILED:{error}"),
                );
            }
            if let Err(error) = reject_links(&self.root, path, true) {
                return failure(&self.input, start, error);
            }
            let mut temp = match NamedTempFile::new_in(parent) {
                Ok(file) => file,
                Err(error) => {
                    return failure(
                        &self.input,
                        start,
                        format!("REPOSITORY_PROMOTION_FAILED:{error}"),
                    )
                }
            };
            let bytes = match fs::read(&staged) {
                Ok(bytes) => bytes,
                Err(error) => {
                    return failure(
                        &self.input,
                        start,
                        format!("REPOSITORY_PROMOTION_FAILED:{error}"),
                    )
                }
            };
            if let Err(error) = temp
                .write_all(&bytes)
                .and_then(|_| temp.as_file().sync_all())
            {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_PROMOTION_FAILED:{error}"),
                );
            }
            if let Err(error) = temp.persist(&destination) {
                return failure(
                    &self.input,
                    start,
                    format!("REPOSITORY_PROMOTION_FAILED:{error}"),
                );
            }
        }
        RepositoryWorkReceipt {
            command_id: self.input.command_id,
            status: "succeeded".to_owned(),
            cause: None,
            changed_paths: changed,
            output_sha256: outputs,
            protected_verified: true,
            promoted: true,
            elapsed_ms: start.elapsed().as_millis(),
            authority_effect: "none".to_owned(),
            external_effect: "none".to_owned(),
        }
    }
}
