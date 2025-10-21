use regex::Regex;
use std::time::Duration;
use thiserror::Error;
use tokio::{
    io::AsyncBufReadExt,
    process::Child,
    time,
};


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

pub async fn spawn_tunnel(_provider: TunnelProvider, target: &str) -> Result<TunnelHandle, TunnelError> {
    spawn_cloudflared(target).await
}

async fn spawn_cloudflared(target: &str) -> Result<TunnelHandle, TunnelError> {
    // Find the bundled cloudflared binary
    let exe_path = std::env::current_exe()
        .map_err(|_| TunnelError::CloudflaredMissing)?;
    let exe_dir = exe_path.parent()
        .ok_or(TunnelError::CloudflaredMissing)?;

    // Try different possible locations for the binary
    let possible_paths = vec![
        exe_dir.join("cloudflared.exe"),  // Windows
        exe_dir.join("cloudflared"),      // Unix
        exe_dir.join("../bin").join("cloudflared.exe"),  // Windows in bin dir
        exe_dir.join("../bin").join("cloudflared"),      // Unix in bin dir
    ];

    let bin_path = possible_paths.into_iter()
        .find(|p| p.exists())
        .ok_or(TunnelError::CloudflaredMissing)?;

    println!("Found cloudflared binary at: {}", bin_path.display());
    println!("Spawning cloudflared with args: tunnel --url {} --no-autoupdate", target);

    // Use tokio::process::Command to spawn the binary
    let mut child = tokio::process::Command::new(&bin_path)
        .args(["tunnel", "--url", target, "--no-autoupdate"])
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
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

