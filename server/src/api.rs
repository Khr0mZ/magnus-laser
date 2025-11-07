use axum::{
    extract::State,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;

use crate::host::HostState;
use crate::server::RoomManager;
use crate::tunnel::TunnelProvider;

#[derive(Clone)]
pub struct AppState {
    pub host_state: Arc<HostState>,
    pub room_manager: Arc<RwLock<RoomManager>>,
}

pub fn create_router_with_state(state: AppState) -> Router {
    Router::new()
        .route("/api/host/start", post(start_host))
        .route("/api/host/stop", post(stop_host))
        .route("/api/host/status", get(host_status))
        .route("/api/host/kick", post(kick_player))
        .route("/health", get(health_check))
        .layer(CorsLayer::permissive()) // Allow all origins for development
        .with_state(state)
}

async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "ok" }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct StartHostRequest {
    #[serde(default)]
    provider: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct StartHostResponse {
    code: String,
    host_id: String,
    public_url: String,
    local_ws_url: String,
}

async fn start_host(
    State(state): State<AppState>,
    Json(req): Json<StartHostRequest>,
) -> impl IntoResponse {
    println!("[ServerAPI] Received start_host request with provider: {:?}", req.provider);
    // Always use cloudflared (bundled with the server)
    match state.host_state.start(TunnelProvider::Cloudflared).await {
        Ok(info) => {
            println!("[ServerAPI] Host started successfully - Code: {}, URL: {}", info.code, info.public_url);

            // Register the room seed in the room manager so WebSocket connections can find it
            let mut room_manager = state.room_manager.write().await;
            room_manager.register_seed(crate::server::RoomSeed {
                code: info.code.clone(),
                host_id: info.host_id.clone(),
            });

            let response = StartHostResponse {
                code: info.code,
                host_id: info.host_id,
                public_url: info.public_url,
                local_ws_url: info.local_ws_url,
            };
            (axum::http::StatusCode::OK, Json(response)).into_response()
        }
        Err(err) => {
            println!("[ServerAPI] Failed to start host: {:?}", err);
            let error_msg = format!(
                "Failed to start tunnel. The server includes cloudflared, but it may need executable permissions. Error: {}",
                err
            );
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": error_msg }))).into_response()
        }
    }
}

async fn stop_host(State(state): State<AppState>) -> impl IntoResponse {
    println!("[ServerAPI] Received stop_host request");
    match state.host_state.stop(&state.room_manager).await {
        Ok(()) => {
            println!("[ServerAPI] Host stopped successfully");
            (axum::http::StatusCode::OK, Json(serde_json::json!({ "status": "stopped" }))).into_response()
        }
        Err(err) => {
            println!("[ServerAPI] Failed to stop host: {:?}", err);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": err.to_string() }))).into_response()
        }
    }
}

async fn host_status(State(state): State<AppState>) -> impl IntoResponse {
    let status = state.host_state.status().await;
    (axum::http::StatusCode::OK, Json(status)).into_response()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct KickPlayerRequest {
    peer_id: String,
}

async fn kick_player(
    State(state): State<AppState>,
    Json(req): Json<KickPlayerRequest>,
) -> impl IntoResponse {
    // Get the current session code from the host state
    let host_status = state.host_state.status().await;
    if let Some(code) = host_status.code {
        let mut manager = state.room_manager.write().await;
        if manager.remove_peer(&code, &req.peer_id).is_some() {
            (axum::http::StatusCode::OK, Json(serde_json::json!({ "status": "kicked" }))).into_response()
        } else {
            (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({ "error": "Player not found" }))).into_response()
        }
    } else {
        (axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": "No active session" }))).into_response()
    }
}
