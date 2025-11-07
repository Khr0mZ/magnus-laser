mod tunnel;
mod server;
mod host;
mod api;

use clap::Parser;
use std::net::SocketAddr;
use axum::Router;
use std::sync::Arc;
use tokio::sync::RwLock;

use server::{RoomManager, AppState as ServerAppState};
use api::AppState as ApiAppState;
use host::HostState;

// Unified AppState that contains both server and API state
#[derive(Clone)]
pub struct UnifiedAppState {
    pub host_state: Arc<HostState>,
    pub room_manager: Arc<RwLock<RoomManager>>,
}

impl UnifiedAppState {
    pub fn new() -> Self {
        Self {
            host_state: Arc::new(HostState::default()),
            room_manager: Arc::new(RwLock::new(RoomManager::default())),
        }
    }
}

#[derive(Parser)]
#[command(name = "magnus-laser-server")]
#[command(version, about = "Companion server for Magnus Laser")]
struct Args {
    /// Host to bind the server to
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    /// Port to bind the server to
    #[arg(short, long, default_value = "3030")]
    port: u16,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let addr = format!("{}:{}", args.host, args.port)
        .parse::<SocketAddr>()?;

    println!("Starting Magnus Laser server on {}", addr);

    // Create the combined router with both API and WebSocket routes
    let app = create_combined_router();

    let listener = tokio::net::TcpListener::bind(addr).await?;
    println!("Server listening on http://{}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}

fn create_combined_router() -> Router {
    // Create a single shared UnifiedAppState
    let shared_state = UnifiedAppState::new();

    // Create API AppState wrapper
    let api_state = ApiAppState {
        host_state: shared_state.host_state.clone(),
        room_manager: shared_state.room_manager.clone(),
    };

    // Create Server AppState wrapper
    let server_state = ServerAppState {
        manager: shared_state.room_manager.clone(),
    };

    // Create routers with the shared state
    let api_router = api::create_router_with_state(api_state);
    let signaling_router = server::create_router_with_state(server_state);

    // Merge the routers - API routes take precedence
    api_router.merge(signaling_router)
}
