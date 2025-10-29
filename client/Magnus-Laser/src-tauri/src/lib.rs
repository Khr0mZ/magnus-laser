mod server;
mod tunnel;
mod embedded_cloudflared;

use crate::server::{generate_code, start_server, RoomSeed, ServerError, ServerHandle};
use regex::Regex;
use crate::tunnel::{spawn_tunnel, TunnelError, TunnelHandle, TunnelProvider};
use serde::Serialize;
use std::time::Instant;
use thiserror::Error;
use tokio::sync::Mutex;

fn extract_subdomain_from_url(url: &str) -> Option<String> {
    // Extract subdomain from https://subdomain.trycloudflare.com
    let re = Regex::new(r"https://([a-zA-Z0-9-]+)\.trycloudflare\.com").ok()?;
    re.captures(url)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().to_string())
}
use uuid::Uuid;
use tauri::Manager;

#[derive(Default)]
pub struct HostState {
    inner: Mutex<HostManager>,
}

struct HostManager {
    server: Option<ServerHandle>,
    tunnel: Option<TunnelHandle>,
    active: Option<ActiveHost>,
}

struct ActiveHost {
    code: String,
    host_id: String,
    public_url: String,
    local_ws_url: String,
    started_at: Instant,
}

impl Default for HostManager {
    fn default() -> Self {
        Self {
            server: None,
            tunnel: None,
            active: None,
        }
    }
}

impl HostState {
    async fn start(&self, provider: TunnelProvider) -> Result<HostInfo, HostError> {
        let mut manager = self.inner.lock().await;
        manager.start(provider).await
    }

    async fn stop(&self) -> Result<(), HostError> {
        let mut manager = self.inner.lock().await;
        manager.stop().await
    }

    async fn status(&self) -> HostStatus {
        let manager = self.inner.lock().await;
        manager.status()
    }

    async fn kick_player(&self, peer_id: &str) -> Result<(), HostError> {
        let manager = self.inner.lock().await;
        manager.kick_player(peer_id).await
    }
}

impl HostManager {
    async fn start(&mut self, provider: TunnelProvider) -> Result<HostInfo, HostError> {
        let _ = self.stop().await;

        let server = start_server().await?;
        let port = server.local_addr().port();
        let host_id = Uuid::new_v4().to_string();

        let target = format!("http://127.0.0.1:{port}");
        let local_ws_url = format!("ws://127.0.0.1:{port}/signal");
        let tunnel = match spawn_tunnel(provider, &target).await {
            Ok(handle) => handle,
            Err(err) => {
                let _ = server.shutdown().await;
                return Err(err.into());
            }
        };
        let public_url = tunnel.public_url.clone();

        // Extract subdomain from trycloudflare URL and use as session code
        let code = extract_subdomain_from_url(&public_url)
            .unwrap_or_else(|| {
                println!("Failed to extract subdomain from URL: {}, falling back to generated code", public_url);
                let fallback = generate_code(6);
                println!("Generated fallback code: {}", fallback);
                fallback
            });
        println!("Session created - URL: {}, Extracted Code: {}", public_url, code);

        server
            .register_seed(RoomSeed {
                code: code.clone(),
                host_id: host_id.clone(),
            })
            .await;

        let info = HostInfo {
            code: code.clone(),
            host_id: host_id.clone(),
            public_url: public_url.clone(),
            local_ws_url: local_ws_url.clone(),
        };

        self.active = Some(ActiveHost {
            code,
            host_id,
            public_url,
            local_ws_url,
            started_at: Instant::now(),
        });
        self.tunnel = Some(tunnel);
        self.server = Some(server);

        Ok(info)
    }

    async fn stop(&mut self) -> Result<(), HostError> {
        // Broadcast host leaving message to all players before shutdown
        if let (Some(server), Some(active)) = (self.server.as_ref(), self.active.as_ref()) {
            server.broadcast_host_leaving(&active.code).await;
        }

        if let Some(tunnel) = self.tunnel.as_mut() {
            tunnel.stop().await;
        }
        self.tunnel = None;
        if let Some(server) = self.server.take() {
            server.shutdown().await?;
        }
        self.active = None;
        Ok(())
    }

    fn status(&self) -> HostStatus {
        if let Some(active) = &self.active {
            HostStatus {
                running: true,
                code: Some(active.code.clone()),
                host_id: Some(active.host_id.clone()),
                public_url: Some(active.public_url.clone()),
                local_ws_url: Some(active.local_ws_url.clone()),
                provider: Some("cloudflared".into()),
                uptime_seconds: Some(active.started_at.elapsed().as_secs()),
            }
        } else {
            HostStatus::inactive()
        }
    }

    async fn kick_player(&self, peer_id: &str) -> Result<(), HostError> {
        if let (Some(server), Some(active)) = (&self.server, &self.active) {
            // Remove the peer from the server
            server.remove_peer(&active.code, peer_id).await
                .map_err(|err| HostError::Server(format!("Failed to kick player: {}", err)))?;
            Ok(())
        } else {
            Err(HostError::Server("No active session".to_string()))
        }
    }
}

#[derive(Debug, Error)]
pub enum HostError {
    #[error("tunnel error: {0}")]
    Tunnel(String),
    #[error("server error: {0}")]
    Server(String),
}

impl From<TunnelError> for HostError {
    fn from(err: TunnelError) -> Self {
        let message = match err {
            TunnelError::CloudflaredMissing => "cloudflared binary not found".to_string(),
            other => other.to_string(),
        };
        HostError::Tunnel(message)
    }
}

impl From<ServerError> for HostError {
    fn from(err: ServerError) -> Self {
        HostError::Server(err.to_string())
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HostInfo {
    pub code: String,
    pub host_id: String,
    pub public_url: String,
    pub local_ws_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HostStatus {
    pub running: bool,
    pub code: Option<String>,
    pub host_id: Option<String>,
    pub public_url: Option<String>,
    pub local_ws_url: Option<String>,
    pub provider: Option<String>,
    pub uptime_seconds: Option<u64>,
}

impl HostStatus {
    fn inactive() -> Self {
        Self {
            running: false,
            code: None,
            host_id: None,
            public_url: None,
            local_ws_url: None,
            provider: None,
            uptime_seconds: None,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(HostState::default())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::start_host,
            commands::stop_host,
            commands::host_status,
            commands::kick_player
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Tauri application")
        .run(|app_handle, event| {
            if matches!(event, tauri::RunEvent::ExitRequested { .. }) {
                let state = app_handle.state::<HostState>();
                let _ = tauri::async_runtime::block_on(state.stop());
            }
        });
}

mod commands {
    use super::*;

    #[tauri::command]
    pub async fn start_host(
        _provider: Option<String>,
        state: tauri::State<'_, HostState>,
    ) -> Result<HostInfo, String> {
        // Always use cloudflared (bundled with the app)
        state
            .start(TunnelProvider::Cloudflared)
            .await
            .map_err(|err| {
                format!(
                    "Failed to start tunnel. The app includes cloudflared, but it may need executable permissions. Error: {}",
                    err
                )
            })
    }

    #[tauri::command]
    pub async fn stop_host(state: tauri::State<'_, HostState>) -> Result<(), String> {
        state.stop().await.map_err(|err| err.to_string())
    }

    #[tauri::command]
    pub async fn host_status(state: tauri::State<'_, HostState>) -> Result<HostStatus, String> {
        Ok(state.status().await)
    }

    #[tauri::command]
    pub async fn kick_player(
        peer_id: String,
        state: tauri::State<'_, HostState>,
    ) -> Result<(), String> {
        state.kick_player(&peer_id).await.map_err(|err| err.to_string())
    }
}
