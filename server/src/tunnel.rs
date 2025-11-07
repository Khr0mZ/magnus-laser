use regex::Regex;
use std::time::Duration;
use thiserror::Error;
use tokio::{
    io::AsyncBufReadExt,
    process::Child,
    time,
};
use std::path::PathBuf;


#[derive(Debug, Clone, Copy)]
pub enum TunnelProvider {
    Cloudflared,
}

#[derive(Debug, Error)]
pub enum TunnelError {
    #[error("cloudflared binary not found")]
    CloudflaredMissing,
    #[error("failed to discover public url from tunnel")]
    UrlNotFound,
    #[error("command exited early")]
    CommandExited,
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

pub struct TunnelHandle {
    child: Child,
    pub public_url: String,
}

impl TunnelHandle {
    pub async fn stop(&mut self) {
        let _ = self.child.kill().await;
        let _ = self.child.wait().await;
    }
}

impl Drop for TunnelHandle {
    fn drop(&mut self) {
        let _ = self.child.start_kill();
    }
}

fn find_cloudflared_binary() -> Result<PathBuf, TunnelError> {
    let bin_dir = PathBuf::from("bin");

    // Determine the expected filename based on platform
    let target_triple = if cfg!(target_os = "windows") {
        "x86_64-pc-windows-msvc.exe"
    } else if cfg!(target_os = "macos") {
        "x86_64-apple-darwin"
    } else if cfg!(target_os = "linux") {
        "x86_64-unknown-linux-gnu"
    } else {
        return Err(TunnelError::CloudflaredMissing);
    };

    let binary_name = format!("cloudflared-{}", target_triple);
    let binary_path = bin_dir.join(binary_name);

    if binary_path.exists() {
        Ok(binary_path)
    } else {
        Err(TunnelError::CloudflaredMissing)
    }
}

pub async fn spawn_tunnel(_provider: TunnelProvider, target: &str) -> Result<TunnelHandle, TunnelError> {
    spawn_cloudflared(target).await
}

async fn spawn_cloudflared(target: &str) -> Result<TunnelHandle, TunnelError> {
    // Find the cloudflared binary in the bin directory
    let cloudflared_path = find_cloudflared_binary()?;

    println!("Using cloudflared binary at: {}", cloudflared_path.display());
    println!("Spawning cloudflared with args: tunnel --url {} --no-autoupdate", target);

    // Use tokio::process::Command to spawn the binary
    let mut command = tokio::process::Command::new(&cloudflared_path);
    command
        .args(["tunnel", "--url", target, "--no-autoupdate"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW flag to prevent console window from appearing
        command.creation_flags(0x08000000);
    }

    let mut child = command.spawn().map_err(|e| {
        println!("Failed to spawn cloudflared: {}", e);
        TunnelError::CommandExited
    })?;

    let stdout = child.stdout.take().ok_or(TunnelError::CommandExited)?;
    let stderr = child.stderr.take().ok_or(TunnelError::CommandExited)?;

    let mut stdout_reader = tokio::io::BufReader::new(stdout).lines();
    let mut stderr_reader = tokio::io::BufReader::new(stderr).lines();

    let url_regex = Regex::new(r"https://[a-zA-Z0-9\-.]+\.trycloudflare\.com").unwrap();

    let public_url = time::timeout(Duration::from_secs(20), async {
        loop {
            tokio::select! {
                line = stdout_reader.next_line() => {
                    if let Some(line) = line? {
                        println!("cloudflared stdout: {}", line);
                        if let Some(found) = url_regex.find(&line) {
                            return Ok(found.as_str().to_string());
                        }
                    } else {
                        break;
                    }
                }
                line = stderr_reader.next_line() => {
                    if let Some(line) = line? {
                        println!("cloudflared stderr: {}", line);
                        if let Some(found) = url_regex.find(&line) {
                            return Ok(found.as_str().to_string());
                        }
                    } else {
                        break;
                    }
                }
            }
        }
        Err(TunnelError::UrlNotFound)
    })
    .await
    .map_err(|_| TunnelError::UrlNotFound)??;

    Ok(TunnelHandle { child, public_url })
}
