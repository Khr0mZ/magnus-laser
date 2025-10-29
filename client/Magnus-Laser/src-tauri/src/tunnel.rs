use regex::Regex;
use std::time::Duration;
use thiserror::Error;
use tokio::{
    io::AsyncBufReadExt,
    process::Child,
    time,
};

#[cfg(windows)]
use crate::embedded_cloudflared::{CLOUDFLARED_BINARY, CLOUDFLARED_BINARY_NAME};


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
    temp_path: std::path::PathBuf,
}

impl TunnelHandle {
    pub async fn stop(&mut self) {
        let _ = self.child.kill().await;
        let _ = self.child.wait().await;
        // Clean up the temporary cloudflared binary
        let _ = tokio::fs::remove_file(&self.temp_path).await;
    }
}

impl Drop for TunnelHandle {
    fn drop(&mut self) {
        let _ = self.child.start_kill();
        // Clean up the temporary cloudflared binary
        let _ = std::fs::remove_file(&self.temp_path);
    }
}

pub async fn spawn_tunnel(_provider: TunnelProvider, target: &str) -> Result<TunnelHandle, TunnelError> {
    spawn_cloudflared(target).await
}

async fn spawn_cloudflared(target: &str) -> Result<TunnelHandle, TunnelError> {
    // Extract the embedded cloudflared binary to a temporary file
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(CLOUDFLARED_BINARY_NAME);

    // Write the embedded binary to the temp file
    tokio::fs::write(&temp_path, CLOUDFLARED_BINARY)
        .await
        .map_err(|_| TunnelError::CloudflaredMissing)?;

    // Make the temp file executable on Unix systems
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = tokio::fs::metadata(&temp_path).await
            .map_err(|_| TunnelError::CloudflaredMissing)?
            .permissions();
        perms.set_mode(0o755);
        tokio::fs::set_permissions(&temp_path, perms).await
            .map_err(|_| TunnelError::CloudflaredMissing)?;
    }

    println!("Extracted cloudflared binary to: {}", temp_path.display());
    println!("Spawning cloudflared with args: tunnel --url {} --no-autoupdate", target);

    // Use tokio::process::Command to spawn the binary
    let mut command = tokio::process::Command::new(&temp_path);
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

    Ok(TunnelHandle { child, public_url, temp_path })
}

