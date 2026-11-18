import { WebcastPushConnection } from 'tiktok-live-connector';
import { WebSocketServer } from 'ws';

const username = process.argv[2];
if (!username) {
  console.error('❌ กรุณาระบุชื่อบัญชี TikTok: node bridge.mjs <username>');
  process.exit(1);
}

const WS_PORT = 8787;
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`🚀 WebSocket Server เปิดรอรับการเชื่อมต่อที่ ws://localhost:${WS_PORT}`);

function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function normalizeData(raw = {}) {
  const user = raw.user || raw;
  const gift = raw.gift || {};
  const avatarList =
    user?.avatarThumb?.urlList ||
    raw?.avatarThumb?.urlList ||
    [];

  return {
    uniqueId: user?.uniqueId || user?.displayId || raw?.uniqueId || 'viewer',
    nickname: user?.nickname || raw?.nickname || user?.displayId || 'ผู้ชม',
    profilePictureUrl:
      raw?.profilePictureUrl ||
      user?.profilePictureUrl ||
      (Array.isArray(avatarList) && avatarList[0]) ||
      '',
    comment: raw?.content ?? raw?.comment ?? '',
    likeCount: Number(raw?.count ?? raw?.likeCount ?? 1),
    giftName: gift?.name ?? raw?.giftName ?? '',
    diamondCount: Number(gift?.diamondCount ?? raw?.diamondCount ?? 0),
    repeatCount: Number(raw?.repeatCount ?? 1),
    repeatEnd: Boolean(raw?.repeatEnd ?? true),
    giftType: Number(gift?.type ?? raw?.giftType ?? 0),
  };
}

let tiktokConnection = null;
let reconnectTimer = null;

function connectTikTok() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`🔗 กำลังเชื่อมต่อ TikTok LIVE ของ @${username} ...`);
  // ห้ามเปิด enableExtendedGiftInfo (ต้องใช้แพ็กเกจเสียเงิน)
  tiktokConnection = new WebcastPushConnection(username, {
    processInitialData: false,
    enableExtendedGiftInfo: false,
  });

  tiktokConnection
    .connect()
    .then((state) => {
      console.log(`✅ เชื่อมต่อสำเร็จ! Room ID: ${state.roomId}`);
    })
    .catch((err) => {
      console.error(`⚠️ เชื่อมต่อไม่สำเร็จ: ${err?.message || err}`);
      scheduleReconnect();
    });

  tiktokConnection.on('chat', (raw) => {
    const data = normalizeData(raw);
    console.log(`💬 [CHAT] ${data.nickname}: ${data.comment}`);
    broadcast('chat', data);
  });

  tiktokConnection.on('like', (raw) => {
    const data = normalizeData(raw);
    broadcast('like', data);
  });

  tiktokConnection.on('gift', (raw) => {
    const data = normalizeData(raw);
    console.log(
      `🎁 [GIFT] ${data.nickname} ส่ง ${data.giftName} x${data.repeatCount} (${data.diamondCount} เหรียญ)`
    );
    broadcast('gift', data);
  });

  tiktokConnection.on('follow', (raw) => {
    const data = normalizeData(raw);
    console.log(`➕ [FOLLOW] ${data.nickname}`);
    broadcast('follow', data);
  });

  tiktokConnection.on('share', (raw) => {
    const data = normalizeData(raw);
    broadcast('share', data);
  });

  tiktokConnection.on('member', (raw) => {
    const data = normalizeData(raw);
    broadcast('member', data);
  });

  tiktokConnection.on('disconnected', () => {
    console.warn('🔌 หลุดการเชื่อมต่อจาก TikTok LIVE');
    scheduleReconnect();
  });

  tiktokConnection.on('error', (err) => {
    console.error('❌ TikTok Error:', err?.message || err);
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log('🔄 จะลองเชื่อมต่อใหม่อีกครั้งใน 5 วินาที...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectTikTok();
  }, 5000);
}

connectTikTok();
