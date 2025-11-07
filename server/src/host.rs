use std::time::Instant;
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;
use serde::Serialize;

use crate::server::{generate_code, RoomManager};
use crate::tunnel::{spawn_tunnel, TunnelProvider, TunnelHandle, TunnelError};

fn extract_subdomain_from_url(url: &str) -> Option<String> {
    // Extract subdomain from https://subdomain.trycloudflare.com
    let re = regex::Regex::new(r"https://([a-zA-Z0-9-]+)\.trycloudflare\.com").ok()?;
    re.captures(url)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().to_string())
}

#[derive(Default)]
pub struct HostState {
    inner: Mutex<HostManager>,
}

struct HostManager {
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
            tunnel: None,
            active: None,
        }
    }
}

impl HostState {
    pub async fn start(&self, provider: TunnelProvider) -> Result<HostInfo, HostError> {
        let mut manager = self.inner.lock().await;
        manager.start(provider).await
    }

    pub     async fn stop(&self, room_manager: &RwLock<RoomManager>) -> Result<(), HostError> {
        let mut manager = self.inner.lock().await;
        manager.stop(room_manager).await
    }

    pub async fn status(&self) -> HostStatus {
        let manager = self.inner.lock().await;
        manager.status()
    }

    pub async fn kick_player(&self, peer_id: &str) -> Result<(), HostError> {
        let manager = self.inner.lock().await;
        manager.kick_player(peer_id).await
    }
}

impl HostManager {
    async fn start(&mut self, provider: TunnelProvider) -> Result<HostInfo, HostError> {
        // Clean up any existing session
        self.tunnel = None;
        self.active = None;

        // Use the main server port (same as API server)
        let port = 8080;
        let host_id = Uuid::new_v4().to_string();

        let target = format!("http://127.0.0.1:{port}");
        let tunnel = match spawn_tunnel(provider, &target).await {
            Ok(handle) => handle,
            Err(err) => {
                // No separate server to shut down since we're using the main server
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

        // Register the room seed in the shared state
        // Since we use unified state, the room registration happens through the API state
        // We'll register it via the API AppState
        // For now, room registration will happen when the WebSocket connection is established

        let info = HostInfo {
            code: code.clone(),
            host_id: host_id.clone(),
            public_url: public_url.clone(),
            local_ws_url: format!("ws://127.0.0.1:{}/signal", port), // DM uses local connection
        };

        self.active = Some(ActiveHost {
            code,
            host_id,
            public_url,
            local_ws_url: format!("ws://127.0.0.1:{}/signal", port),
            started_at: Instant::now(),
        });
        self.tunnel = Some(tunnel);
        // No separate server since we're using the unified approach

        Ok(info)
    }

    async fn stop(&mut self, room_manager: &RwLock<RoomManager>) -> Result<(), HostError> {
        // Broadcast host leaving message to all players before shutdown
        if let Some(active) = &self.active {
            let manager = room_manager.read().await;
            manager.broadcast_host_leaving(&active.code);
        }

        // Stop the tunnel
        if let Some(tunnel) = self.tunnel.as_mut() {
            tunnel.stop().await;
        }
        self.tunnel = None;
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

    async fn kick_player(&self, _peer_id: &str) -> Result<(), HostError> {
        // Kicking players is not implemented in the unified server approach
        // since the host state doesn't have direct access to the room manager
        // This would need to be implemented through the API handlers
        Err(HostError::Tunnel("Player kicking not implemented in unified server".to_string()))
    }
}

#[derive(Debug, thiserror::Error)]
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
