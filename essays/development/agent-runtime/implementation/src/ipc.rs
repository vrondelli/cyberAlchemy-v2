use crate::{AuthenticatedPrincipal, Command, ErrorResponse, Receipt, Runtime};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use std::{io, path::Path};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{UnixListener, UnixStream};
use tokio::sync::Semaphore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpcRequest {
    pub client_id: String,
    pub command: Command,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "result", rename_all = "kebab-case")]
pub enum IpcResponse {
    Receipt { receipt: Box<Receipt> },
    Error { error: ErrorResponse },
}

pub fn write_frame<T: Serialize>(mut out: impl io::Write, value: &T) -> io::Result<()> {
    let bytes = serde_json::to_vec(value).map_err(io::Error::other)?;
    let size = u32::try_from(bytes.len()).map_err(io::Error::other)?;
    out.write_all(&size.to_be_bytes())?;
    out.write_all(&bytes)
}

pub fn read_frame<T: DeserializeOwned>(mut input: impl io::Read, max: usize) -> io::Result<T> {
    let mut header = [0_u8; 4];
    input.read_exact(&mut header)?;
    let size = u32::from_be_bytes(header) as usize;
    if size > max {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "frame budget exceeded",
        ));
    }
    let mut bytes = vec![0; size];
    input.read_exact(&mut bytes)?;
    serde_json::from_slice(&bytes).map_err(io::Error::other)
}

pub async fn serve_unix(
    socket_path: impl AsRef<Path>,
    runtime: Runtime,
    max_frame_bytes: usize,
    max_connections: usize,
) -> io::Result<()> {
    let listener = UnixListener::bind(socket_path)?;
    let permits = std::sync::Arc::new(Semaphore::new(max_connections.max(1)));
    loop {
        let (stream, _) = listener.accept().await?;
        let permit = permits
            .clone()
            .acquire_owned()
            .await
            .map_err(io::Error::other)?;
        let runtime = runtime.clone();
        tokio::spawn(async move {
            let _permit = permit;
            let _ = handle_connection(stream, runtime, max_frame_bytes).await;
        });
    }
}

async fn handle_connection(
    mut stream: UnixStream,
    runtime: Runtime,
    max_frame_bytes: usize,
) -> io::Result<()> {
    let credential = stream.peer_cred()?;
    let request: IpcRequest = read_async_frame(&mut stream, max_frame_bytes).await?;
    let principal = AuthenticatedPrincipal::verified_local(
        format!("unix:{}", credential.uid()),
        request.client_id,
    );
    let response = match runtime.execute(&request.command, &principal) {
        Ok(receipt) => IpcResponse::Receipt {
            receipt: Box::new(receipt),
        },
        Err(error) => IpcResponse::Error {
            error: ErrorResponse::from(&error),
        },
    };
    write_async_frame(&mut stream, &response).await
}

async fn read_async_frame<T: DeserializeOwned>(
    stream: &mut UnixStream,
    max: usize,
) -> io::Result<T> {
    let size = stream.read_u32().await? as usize;
    if size > max {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "frame budget exceeded",
        ));
    }
    let mut bytes = vec![0; size];
    stream.read_exact(&mut bytes).await?;
    serde_json::from_slice(&bytes).map_err(io::Error::other)
}

async fn write_async_frame<T: Serialize>(stream: &mut UnixStream, value: &T) -> io::Result<()> {
    let bytes = serde_json::to_vec(value).map_err(io::Error::other)?;
    let size = u32::try_from(bytes.len()).map_err(io::Error::other)?;
    stream.write_u32(size).await?;
    stream.write_all(&bytes).await?;
    stream.shutdown().await
}
