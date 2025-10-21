use std::{
    collections::{HashMap, VecDeque},
    net::SocketAddr,
    sync::Arc,
    time::{Duration, Instant},
};

use axum::{
    extract::ws::{Message, WebSocket},
    extract::State,
    extract::WebSocketUpgrade,
    response::IntoResponse,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use tokio::{
    net::TcpListener,
    sync::{mpsc, oneshot, RwLock},
    task::JoinHandle,
};
use tokio_stream::wrappers::UnboundedReceiverStream;
use uuid::Uuid;

const ROOM_TTL: Duration = Duration::from_secs(60 * 60 * 2);

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Dm,
    Player,
}

impl Role {
    pub fn is_dm(&self) -> bool {
        matches!(self, Role::Dm)
    }
}

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub struct PeerInfo {
    pub id: String,
    pub name: String,
    pub role: Role,
    pub connected: bool,
}

#[derive(Clone)]
pub struct RoomSeed {
    pub code: String,
    pub host_id: String,
}

#[derive(Debug, Error)]
pub enum ServerError {
    #[error("no pending room seed available")]
    MissingSeed,
    #[error("rooms at capacity")]
    Capacity,
    #[error("room not found")]
    RoomNotFound,
    #[error("room code mismatch")]
    JoinDenied,
    #[error("peer not registered in room")]
    UnknownPeer,
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "t")]
enum InboundMsg {
    #[serde(rename = "HELLO")]
    Hello { name: String, role: Role },
    #[serde(rename = "CREATE_SESSION")]
    CreateSession,
    #[serde(rename = "JOIN_SESSION")]
    JoinSession { code: String, name: String },
    #[serde(rename = "ACTION")]
    Action { id: String, actor: String, action: serde_json::Value },
    #[serde(rename = "STATE_SNAPSHOT")]
    StateSnapshot { snapshot: serde_json::Value },
    #[serde(rename = "STATE_PATCH")]
    StatePatch { base: u64, patch: serde_json::Value },
    #[serde(rename = "RTC_OFFER")]
    RtcOffer {
        from: String,
        to: String,
        sdp: serde_json::Value,
    },
    #[serde(rename = "RTC_ANSWER")]
    RtcAnswer {
        from: String,
        to: String,
        sdp: serde_json::Value,
    },
    #[serde(rename = "RTC_ICE")]
    RtcIce {
        from: String,
        to: String,
        candidate: serde_json::Value,
    },
    #[serde(rename = "PING")]
    Ping,
    #[serde(rename = "PONG")]
    Pong,
}

#[derive(Clone, Serialize)]
#[serde(tag = "t")]
enum OutboundMsg {
    #[serde(rename = "SESSION_CREATED")]
    SessionCreated { code: String, #[serde(rename = "host_id")] host_id: String },
    #[serde(rename = "JOIN_OK")]
    JoinOk { peers: Vec<PeerInfo>, #[serde(rename = "you_are")] you_are: PeerInfo },
    #[serde(rename = "JOIN_DENY")]
    JoinDeny { reason: String },
    #[serde(rename = "PRESENCE")]
    Presence { peers: Vec<PeerInfo> },
    #[serde(rename = "ACTION")]
    Action { id: String, actor: String, action: serde_json::Value },
    #[serde(rename = "STATE_SNAPSHOT")]
    StateSnapshot { snapshot: serde_json::Value },
    #[serde(rename = "STATE_PATCH")]
    StatePatch { base: u64, patch: serde_json::Value },
    #[serde(rename = "RTC_OFFER")]
    RtcOffer {
        from: String,
        to: String,
        sdp: serde_json::Value,
    },
    #[serde(rename = "RTC_ANSWER")]
    RtcAnswer {
        from: String,
        to: String,
        sdp: serde_json::Value,
    },
    #[serde(rename = "RTC_ICE")]
    RtcIce {
        from: String,
        to: String,
        candidate: serde_json::Value,
    },
    #[serde(rename = "PONG")]
    Pong,
    #[serde(rename = "ERROR")]
    Error { code: String, message: String },
}

impl OutboundMsg {
    fn to_message(&self) -> Message {
        let text = serde_json::to_string(self).unwrap_or_else(|_| "{\"t\":\"ERROR\",\"code\":\"SERDE\",\"message\":\"serialization\"}".into());
        Message::Text(text)
    }
}

#[derive(Default)]
struct RoomManager {
    seeds: VecDeque<RoomSeed>,
    rooms: HashMap<String, Room>,
}

struct Room {
    code: String,
    host_id: String,
    last_activity: Instant,
    peers: HashMap<String, PeerEntry>,
}

struct PeerEntry {
    info: PeerInfo,
    sender: mpsc::UnboundedSender<OutboundMsg>,
}

impl Room {
    fn new(seed: RoomSeed, host_info: PeerInfo, host_sender: mpsc::UnboundedSender<OutboundMsg>) -> Self {
        let mut peers = HashMap::new();
        peers.insert(
            host_info.id.clone(),
            PeerEntry {
                info: host_info,
                sender: host_sender,
            },
        );
        Self {
            host_id: seed.host_id,
            code: seed.code,
            last_activity: Instant::now(),
            peers,
        }
    }

    fn peer_list(&self) -> Vec<PeerInfo> {
        self.peers.values().map(|p| p.info.clone()).collect()
    }

    fn senders(&self) -> Vec<mpsc::UnboundedSender<OutboundMsg>> {
        self.peers.values().map(|p| p.sender.clone()).collect()
    }

    fn host_sender(&self) -> Option<mpsc::UnboundedSender<OutboundMsg>> {
        self.peers.get(&self.host_id).map(|p| p.sender.clone())
    }

    fn update_activity(&mut self) {
        self.last_activity = Instant::now();
    }
}

impl RoomManager {
    fn register_seed(&mut self, seed: RoomSeed) {
        self.seeds.push_back(seed);
    }

    fn next_seed(&mut self) -> Result<RoomSeed, ServerError> {
        self.seeds.pop_front().ok_or(ServerError::MissingSeed)
    }

    fn register_host(
        &mut self,
        name: String,
        sender: mpsc::UnboundedSender<OutboundMsg>,
    ) -> Result<(String, RoomInfo), ServerError> {
        let seed = self.next_seed()?;
        let host_info = PeerInfo {
            id: seed.host_id.clone(),
            name,
            role: Role::Dm,
            connected: true,
        };
        let host_id = host_info.id.clone();
        let room = Room::new(seed.clone(), host_info.clone(), sender);
        let code = room.code.clone();
        self.rooms.insert(code.clone(), room);
        Ok((
            code.clone(),
            RoomInfo {
                code,
                host_id,
                peers: vec![host_info],
            },
        ))
    }

    fn join_room(
        &mut self,
        code: &str,
        name: String,
        sender: mpsc::UnboundedSender<OutboundMsg>,
    ) -> Result<JoinResult, ServerError> {
        let room = self.rooms.get_mut(code).ok_or(ServerError::RoomNotFound)?;

        // Remove any existing peers with the same name (cleanup from reconnections)
        room.peers.retain(|_, peer| peer.info.name != name);

        let peer_id = Uuid::new_v4().to_string();
        let info = PeerInfo {
            id: peer_id.clone(),
            name,
            role: Role::Player,
            connected: false,
        };
        room.update_activity();
        room.peers.insert(
            peer_id.clone(),
            PeerEntry {
                info: info.clone(),
                sender: sender.clone(),
            },
        );
        let peers_snapshot = room.peer_list();
        let broadcast = room.senders();
        Ok(JoinResult {
            peer_id,
            you_are: info,
            peers: peers_snapshot,
            broadcast,
        })
    }

    fn route_to(&self, code: &str, peer_id: &str) -> Option<mpsc::UnboundedSender<OutboundMsg>> {
        self.rooms
            .get(code)
            .and_then(|room| room.peers.get(peer_id).map(|p| p.sender.clone()))
    }

    fn host_route(&self, code: &str) -> Option<mpsc::UnboundedSender<OutboundMsg>> {
        self.rooms.get(code).and_then(|room| room.host_sender())
    }


    fn remove_peer(&mut self, code: &str, peer_id: &str) -> Option<RemovalOutcome> {
        let room = self.rooms.get_mut(code)?;
        let host_left = room.host_id == peer_id;
        if room.peers.remove(peer_id).is_none() {
            return None;
        }
        if host_left {
            let senders = room.senders();
            let _ = room;
            self.rooms.remove(code);
            Some(RemovalOutcome::RoomClosed { senders })
        } else {
            let room = self.rooms.get_mut(code)?;
            room.update_activity();
            let peers = room.peer_list();
            let senders = room.senders();
            Some(RemovalOutcome::PeerLeft { peers, senders })
        }
    }

    fn cleanup_expired(&mut self) -> Vec<RemovalOutcome> {
        let now = Instant::now();
        let mut expired = Vec::new();
        let mut to_remove = Vec::new();
        for (code, room) in self.rooms.iter() {
            if now.duration_since(room.last_activity) > ROOM_TTL {
                let senders = room.senders();
                expired.push(RemovalOutcome::Expired { senders });
                to_remove.push(code.clone());
            }
        }
        for code in to_remove {
            self.rooms.remove(&code);
        }
        expired
    }
}

struct RoomInfo {
    code: String,
    host_id: String,
    peers: Vec<PeerInfo>,
}

struct JoinResult {
    peer_id: String,
    you_are: PeerInfo,
    peers: Vec<PeerInfo>,
    broadcast: Vec<mpsc::UnboundedSender<OutboundMsg>>,
}

enum RemovalOutcome {
    PeerLeft { peers: Vec<PeerInfo>, senders: Vec<mpsc::UnboundedSender<OutboundMsg>> },
    RoomClosed { senders: Vec<mpsc::UnboundedSender<OutboundMsg>> },
    Expired { senders: Vec<mpsc::UnboundedSender<OutboundMsg>> },
}

#[derive(Default, Clone)]
struct AppState {
    manager: Arc<RwLock<RoomManager>>,
}

impl AppState {
    fn new() -> Self {
        Self {
            manager: Arc::new(RwLock::new(RoomManager::default())),
        }
    }
}

#[derive(Clone)]
pub struct ServerHandle {
    addr: SocketAddr,
    shutdown: Arc<RwLock<Option<oneshot::Sender<()>>>>,
    task: Arc<RwLock<Option<JoinHandle<()>>>>,
    state: Arc<RwLock<RoomManager>>,
}

impl ServerHandle {
    pub fn local_addr(&self) -> SocketAddr {
        self.addr
    }

    pub async fn register_seed(&self, seed: RoomSeed) {
        let mut manager = self.state.write().await;
        manager.register_seed(seed);
    }

    pub async fn shutdown(&self) -> Result<(), ServerError> {
        if let Some(tx) = self.shutdown.write().await.take() {
            let _ = tx.send(());
        }
        if let Some(task) = self.task.write().await.take() {
            let _ = task.await;
        }
        self.state.write().await.rooms.clear();
        Ok(())
    }

    pub async fn broadcast_host_leaving(&self, room_code: &str) {
        let state = self.state.read().await;
        if let Some(room) = state.rooms.get(room_code) {
            let senders = room.senders();
            let message = OutboundMsg::Error {
                code: "HOST_LEFT".to_string(),
                message: "The host has left the session".to_string(),
            };
            for sender in senders {
                let _ = sender.send(message.clone());
            }
        }
    }

    pub async fn remove_peer(&self, room_code: &str, peer_id: &str) -> Result<(), ServerError> {
        let mut state = self.state.write().await;

        // First, try to get the sender for the peer we're removing
        let peer_sender = if let Some(room) = state.rooms.get(room_code) {
            room.peers.get(peer_id).map(|peer| peer.sender.clone())
        } else {
            None
        };

        // Remove the peer
        if let Some(outcome) = state.remove_peer(room_code, peer_id) {
            // Send a kick message to the kicked player if we have their sender
            if let Some(sender) = peer_sender {
                let _ = sender.send(OutboundMsg::Error {
                    code: "KICKED".to_string(),
                    message: "You have been removed from the session by the host".to_string(),
                });
            }

            // Handle other outcomes if needed
            match outcome {
                RemovalOutcome::PeerLeft { peers, senders } => {
                    // Notify remaining players that someone left with updated peer list
                    for sender in senders {
                        let _ = sender.send(OutboundMsg::Presence {
                            peers: peers.clone(),
                        });
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
}

pub async fn start_server() -> Result<ServerHandle, ServerError> {
    let state = AppState::new();
    let listener = TcpListener::bind(("127.0.0.1", 0)).await?;
    let addr = listener.local_addr()?;
    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    let shared_state = state.manager.clone();
    spawn_cleanup_task(shared_state.clone());
    let router = Router::new()
        .route("/signal", get(ws_handler))
        .with_state(state);
    let server = axum::serve(listener, router.into_make_service()).with_graceful_shutdown(async move {
        let _ = shutdown_rx.await;
    });
    let task = tokio::spawn(async move {
        let _ = server.await;
    });
    Ok(ServerHandle {
        addr,
        shutdown: Arc::new(RwLock::new(Some(shutdown_tx))),
        task: Arc::new(RwLock::new(Some(task))),
        state: shared_state,
    })
}

fn spawn_cleanup_task(state: Arc<RwLock<RoomManager>>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            let expired = {
                let mut manager = state.write().await;
                manager.cleanup_expired()
            };
            for outcome in expired {
                match outcome {
                    RemovalOutcome::Expired { senders } => {
                        senders.into_iter().for_each(|sender| {
                            let _ = sender.send(OutboundMsg::Error {
                                code: "ROOM_EXPIRED".into(),
                                message: "Session expired".into(),
                            });
                        });
                    }
                    _ => {}
                }
            }
        }
    });
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(state.manager.clone(), socket))
}

struct PeerContext {
    id: Option<String>,
    role: Option<Role>,
    name: Option<String>,
    room_code: Option<String>,
}

impl Default for PeerContext {
    fn default() -> Self {
        Self {
            id: None,
            role: None,
            name: None,
            room_code: None,
        }
    }
}

async fn handle_socket(state: Arc<RwLock<RoomManager>>, socket: WebSocket) {
    let (sender, mut receiver) = socket.split();
    let (tx, rx) = mpsc::unbounded_channel::<OutboundMsg>();
    let mut rx_stream = UnboundedReceiverStream::new(rx);
    let send_task = tokio::spawn(async move {
        let mut sender = sender;
        while let Some(msg) = rx_stream.next().await {
            let message = msg.to_message();
            if sender.send(message).await.is_err() {
                break;
            }
        }
    });

    let mut ctx = PeerContext::default();

    while let Some(Ok(message)) = receiver.next().await {
        match message {
            Message::Text(text) => match serde_json::from_str::<InboundMsg>(&text) {
                Ok(InboundMsg::Hello { name, role }) => {
                    ctx.name = Some(name);
                    ctx.role = Some(role);
                }
                Ok(InboundMsg::CreateSession) => {
                    if ctx.role.as_ref().map_or(false, |r| r.is_dm()) {
                        match register_host(&state, &mut ctx, tx.clone()).await {
                            Ok(info) => {
                                let _ = tx.send(OutboundMsg::SessionCreated {
                                    code: info.code.clone(),
                                    host_id: info.host_id.clone(),
                                });
                                broadcast_presence(info.peers, vec![tx.clone()]);
                            }
                            Err(err) => {
                                let _ = tx.send(OutboundMsg::Error {
                                    code: "CREATE_FAILED".into(),
                                    message: err.to_string(),
                                });
                            }
                        }
                    }
                }
                Ok(InboundMsg::JoinSession { code, name }) => {
                    match join_room(&state, &mut ctx, code.clone(), name, tx.clone()).await {
                        Ok(result) => {
                            let _ = tx.send(OutboundMsg::JoinOk {
                                peers: result.peers.clone(),
                                you_are: result.you_are.clone(),
                            });
                            broadcast_presence(result.peers, result.broadcast);
                        }
                        Err(err) => {
                            let _ = tx.send(OutboundMsg::JoinDeny {
                                reason: err.to_string(),
                            });
                        }
                    }
                }
                Ok(InboundMsg::Action { id, actor, action }) => {
                    forward_to_host(&state, &ctx, OutboundMsg::Action { id, actor, action }).await;
                }
                Ok(InboundMsg::StateSnapshot { snapshot }) => {
                    forward_to_room(&state, &ctx, OutboundMsg::StateSnapshot { snapshot }).await;
                }
                Ok(InboundMsg::StatePatch { base, patch }) => {
                    forward_to_room(&state, &ctx, OutboundMsg::StatePatch { base, patch }).await;
                }
                Ok(InboundMsg::RtcOffer { from, to, sdp }) => {
                    let target = to.clone();
                    forward_to_peer(&state, &ctx, &target, OutboundMsg::RtcOffer { from, to, sdp }).await;
                }
                Ok(InboundMsg::RtcAnswer { from, to, sdp }) => {
                    let target = to.clone();
                    forward_to_peer(&state, &ctx, &target, OutboundMsg::RtcAnswer { from, to, sdp }).await;
                }
                Ok(InboundMsg::RtcIce { from, to, candidate }) => {
                    let target = to.clone();
                    forward_to_peer(&state, &ctx, &target, OutboundMsg::RtcIce { from, to, candidate }).await;
                }
                Ok(InboundMsg::Ping) => {
                    let _ = tx.send(OutboundMsg::Pong);
                }
                Ok(InboundMsg::Pong) => {}
                Err(err) => {
                    let _ = tx.send(OutboundMsg::Error {
                        code: "BAD_MESSAGE".into(),
                        message: err.to_string(),
                    });
                }
            },
            Message::Ping(_payload) => {
                let _ = tx.send(OutboundMsg::Pong);
            }
            Message::Pong(_) => {}
            Message::Close(_) => break,
            _ => {}
        }
    }

    cleanup_peer(&state, ctx).await;
    send_task.abort();
}

async fn register_host(
    state: &Arc<RwLock<RoomManager>>,
    ctx: &mut PeerContext,
    sender: mpsc::UnboundedSender<OutboundMsg>,
) -> Result<RoomInfo, ServerError> {
    let name = ctx.name.clone().unwrap_or_else(|| "Host".into());
    let (code, info) = {
        let mut manager = state.write().await;
        manager.register_host(name.clone(), sender)?
    };
    ctx.room_code = Some(code.clone());
    ctx.id = Some(info.peers[0].id.clone());
    Ok(info)
}

async fn join_room(
    state: &Arc<RwLock<RoomManager>>,
    ctx: &mut PeerContext,
    code: String,
    name: String,
    sender: mpsc::UnboundedSender<OutboundMsg>,
) -> Result<JoinResult, ServerError> {
    let result = {
        let mut manager = state.write().await;
        manager.join_room(&code, name, sender)?
    };
    ctx.room_code = Some(code);
    ctx.id = Some(result.peer_id.clone());
    ctx.role = Some(Role::Player);
    Ok(result)
}

async fn forward_to_host(state: &Arc<RwLock<RoomManager>>, ctx: &PeerContext, msg: OutboundMsg) {
    if let (Some(code), Some(_id)) = (&ctx.room_code, &ctx.id) {
        let sender = {
            let manager = state.read().await;
            manager.host_route(code)
        };
        if let Some(sender) = sender {
            let _ = sender.send(msg);
        }
    }
}

async fn forward_to_room(state: &Arc<RwLock<RoomManager>>, ctx: &PeerContext, msg: OutboundMsg) {
    if let Some(code) = &ctx.room_code {
        let targets = {
            let manager = state.read().await;
            manager
                .rooms
                .get(code)
                .map(|room| {
                    room
                        .peers
                        .values()
                        .filter(|peer| Some(&peer.info.id) != ctx.id.as_ref())
                        .map(|peer| peer.sender.clone())
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default()
        };
        for target in targets {
            let _ = target.send(msg.clone());
        }
    }
}

async fn forward_to_peer(
    state: &Arc<RwLock<RoomManager>>,
    ctx: &PeerContext,
    target_id: &str,
    msg: OutboundMsg,
) {
    if let Some(code) = &ctx.room_code {
        let sender = {
            let manager = state.read().await;
            manager.route_to(code, target_id)
        };
        if let Some(sender) = sender {
            let _ = sender.send(msg);
        }
    }
}

fn broadcast_presence(peers: Vec<PeerInfo>, targets: Vec<mpsc::UnboundedSender<OutboundMsg>>) {
    for target in targets {
        let _ = target.send(OutboundMsg::Presence {
            peers: peers.clone(),
        });
    }
}

async fn cleanup_peer(state: &Arc<RwLock<RoomManager>>, ctx: PeerContext) {
    if let (Some(code), Some(peer_id)) = (ctx.room_code, ctx.id) {
        let outcome = {
            let mut manager = state.write().await;
            manager.remove_peer(&code, &peer_id)
        };
        if let Some(outcome) = outcome {
            match outcome {
                RemovalOutcome::PeerLeft { peers, senders } => broadcast_presence(peers, senders),
                RemovalOutcome::RoomClosed { senders } => {
                    for sender in senders {
                        let _ = sender.send(OutboundMsg::Error {
                            code: "HOST_LEFT".into(),
                            message: "Host closed the session".into(),
                        });
                    }
                }
                RemovalOutcome::Expired { senders } => {
                    for sender in senders {
                        let _ = sender.send(OutboundMsg::Error {
                            code: "ROOM_EXPIRED".into(),
                            message: "Session expired".into(),
                        });
                    }
                }
            }
        }
    }
}

pub fn generate_code(len: usize) -> String {
    const ALPHABET: &[u8] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let mut rng = rand::thread_rng();
    let mut bytes = vec![0u8; len];
    rng.fill_bytes(&mut bytes);
    bytes
        .into_iter()
        .map(|byte| {
            let idx = (byte as usize) % ALPHABET.len();
            ALPHABET[idx] as char
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dummy_sender() -> mpsc::UnboundedSender<OutboundMsg> {
        let (tx, mut rx) = mpsc::unbounded_channel();
        tokio::spawn(async move {
            while rx.recv().await.is_some() {}
        });
        tx
    }

    #[tokio::test]
    async fn room_lifecycle() {
        let mut manager = RoomManager::default();
        let code = "ABC123".to_string();
        manager.register_seed(RoomSeed {
            code: code.clone(),
            host_id: "host-1".into(),
        });

        let host_sender = dummy_sender();
        let (_code, room_info) = manager.register_host("Host".into(), host_sender.clone()).unwrap();
        assert_eq!(room_info.peers.len(), 1);

        let join_sender = dummy_sender();
        let join = manager
            .join_room(&code, "Player".into(), join_sender.clone())
            .unwrap();
        assert_eq!(join.peers.len(), 2);
        assert_eq!(manager.rooms.get(&code).unwrap().peers.len(), 2);

        let outcome = manager.remove_peer(&code, &join.peer_id).unwrap();
        match outcome {
            RemovalOutcome::PeerLeft { peers, .. } => assert_eq!(peers.len(), 1),
            _ => panic!("expected peer left"),
        }

        let outcome = manager.remove_peer(&code, "host-1").unwrap();
        matches!(outcome, RemovalOutcome::RoomClosed { .. });
        assert!(manager.rooms.is_empty());
    }

    #[tokio::test]
    async fn ttl_cleanup() {
        let mut manager = RoomManager::default();
        manager.register_seed(RoomSeed {
            code: "CODE01".into(),
            host_id: "host-1".into(),
        });
        let sender = dummy_sender();
        let _ = manager.register_host("Host".into(), sender).unwrap();
        if let Some(room) = manager.rooms.get_mut("CODE01") {
            room.last_activity -= ROOM_TTL + Duration::from_secs(1);
        }
        let expired = manager.cleanup_expired();
        assert_eq!(expired.len(), 1);
        assert!(manager.rooms.is_empty());
    }
}
