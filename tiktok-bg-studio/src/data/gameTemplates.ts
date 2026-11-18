export interface GameTemplate {
  id: 'shrine' | 'retrochat' | 'boss' | 'tug' | 'kaechong' | 'khanomkrok';
  name: string;
  icon: string;
  filename: string;
  desc: string;
  rules: string[];
  themeBg: string;
  accent: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'shrine',
    name: 'ไหว้พระศาลเจ้าจีน & เซียมซี',
    icon: '🏮',
    filename: 'chinese-shrine-live.html',
    desc: 'กดใจเดิน 5 จุดครบรับการ์ดอวยพร พิมพ์ "ขอพร..." และ "เซียมซี"',
    rules: ['กดใจ 2 ครั้ง = เดิน 1 จุด (ครบ 5 จุดรับพร)', 'พิมพ์ "ขอพร..." ขึ้นบอร์ด, "เซียมซี" เสี่ยงทาย', 'ของขวัญ 1 เหรียญ = +2 จุด, 5 เหรียญ+ = ถึงเส้นชัย'],
    themeBg: 'linear-gradient(180deg, #2b0303 0%, #590a0a 50%, #1c0303 100%)',
    accent: '#ffd166',
  },
  {
    id: 'retrochat',
    name: 'RetroChat 98 (Pirch ย้อนยุค)',
    icon: '💻',
    filename: 'retrochat-98-live.html',
    desc: 'ห้องแชตย้อนยุคสไตล์ Windows 98 พิมพ์อะไรก็ขึ้นจอพร้อมเสียงเตือน',
    rules: ['ทุกคอมเมนต์ขึ้นหน้าต่างแชตสไตล์ Pirch98', 'กดใจ = ปล่อยอิโมจิหัวใจลอยในห้องแชต', 'ของขวัญ = ประกาศตัววิ่ง VIP สีทองกลางห้อง'],
    themeBg: 'linear-gradient(180deg, #008080 0%, #005f5f 100%)',
    accent: '#000080',
  },
  {
    id: 'boss',
    name: 'ศึกปราบบอสยักษ์',
    icon: '⚔️',
    filename: 'boss-raid-live.html',
    desc: 'ทั้งห้องรวมพลังกดใจตีบอสลด HP ส่งของขวัญปล่อยท่าไม้ตาย',
    rules: ['กดใจ 1 ครั้ง = โจมตีบอส -10 HP', 'พิมพ์ "โจมตี" / "ฟัน" = ฟาดดาบ -25 HP', 'ของขวัญ = ท่าไม้ตายดาเมจคูณ 80 เท่า!'],
    themeBg: 'linear-gradient(180deg, #0d061f 0%, #240b36 55%, #07030f 100%)',
    accent: '#ff4d6d',
  },
  {
    id: 'tug',
    name: 'ชักเย่อทีมแดง vs น้ำเงิน',
    icon: '🔴🔵',
    filename: 'tug-of-war-live.html',
    desc: 'แบ่งฝั่งเชียร์ ทีมแดง vs ทีมน้ำเงิน แข่งกันดึงธงเข้าเส้นชัย',
    rules: ['พิมพ์ "แดง" หรือกดใจ = ดึงฝั่งซ้าย', 'พิมพ์ "น้ำเงิน" หรือส่งของขวัญ = ดึงฝั่งขวา', 'ธงถึงฝั่งไหนก่อน ทีมนั้นชนะและเริ่มรอบใหม่!'],
    themeBg: 'linear-gradient(180deg, #240814 0%, #0d152b 55%, #060914 100%)',
    accent: '#00f2ea',
  },
  {
    id: 'kaechong',
    name: 'สายบุญ ไหว้แก้ชง 5 ศาลเจ้า',
    icon: '🙏',
    filename: 'kae-chong-live.html',
    desc: 'เดินไหว้ครบ 5 ศาลเจ้าดัง ครบแล้วรับอั่งเปาคำอวยพรแก้ชง',
    rules: ['กดใจ 2 ครั้ง = เดินไปศาลเจ้าถัดไป', 'พิมพ์ "แก้ชง..." ขึ้นชื่อผู้ร่วมทำบุญ', 'ของขวัญ = ถวายชุดสะเดาะเคราะห์ เดินไว x2'],
    themeBg: 'linear-gradient(180deg, #1f0a04 0%, #4d1908 50%, #170602 100%)',
    accent: '#ffb703',
  },
  {
    id: 'khanomkrok',
    name: 'ร้านขนมครก & ชงชาหน้าไลฟ์',
    icon: '🥟',
    filename: 'khanom-krok-live.html',
    desc: 'คนดูสั่งออเดอร์ในแชต กดใจช่วยแคะขนมครก สะสมยอดขายเรียลไทม์',
    rules: ['พิมพ์ "สั่ง..." = รับออเดอร์ขึ้นบอร์ดหน้าร้าน', 'กดใจ = หยอดแป้ง/แคะขนมครกเสิร์ฟลูกค้า', 'ของขวัญ = เหมาทั้งเตา +10 ออเดอร์ทันที!'],
    themeBg: 'linear-gradient(180deg, #2b1a08 0%, #4a2e10 50%, #1c1004 100%)',
    accent: '#f4a261',
  },
];

export function generateStandaloneGameHtml(tpl: GameTemplate): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${tpl.name} - TikTok LIVE Game</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%; background: #04050a;
      font-family: 'Prompt', 'Noto Sans Thai', sans-serif;
      color: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center;
    }
    #stage {
      width: 1080px; height: 1920px; position: relative; overflow: hidden;
      background: ${tpl.themeBg}; transform-origin: center center; flex-shrink: 0;
      padding: 150px 56px 320px;
    }
    .topbar { position: absolute; top: 28px; right: 28px; z-index: 50; display: flex; gap: 12px; align-items: center; }
    .ws-pill { padding: 10px 20px; border-radius: 99px; background: rgba(0,0,0,0.65); border: 2px solid #ff4d6d; font-size: 22px; font-weight: 600; }
    .ws-pill.ok { border-color: #06d6a0; }
    .gear-btn { width: 66px; height: 66px; border-radius: 50%; border: 2px solid ${tpl.accent}; background: rgba(0,0,0,0.75); color: #fff; font-size: 32px; cursor: pointer; }
    .sim-box { position: absolute; top: 108px; right: 28px; width: 470px; z-index: 60; background: rgba(12,16,28,0.95); border: 2px solid ${tpl.accent}; border-radius: 24px; padding: 24px; display: none; }
    .sim-box.open { display: block; }
    .sim-box input { width: 100%; padding: 12px; font-size: 22px; border-radius: 10px; border: 1px solid #444; background: #070912; color: #fff; margin-bottom: 10px; font-family: inherit; }
    .sim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sim-btn { padding: 14px; border-radius: 12px; border: none; color: #fff; font-size: 21px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .title { text-align: center; font-size: 66px; font-weight: 800; color: ${tpl.accent}; text-shadow: 0 6px 24px rgba(0,0,0,0.8); }
    .sub { text-align: center; font-size: 29px; color: #f1f5f9; margin-top: 10px; }
    .card { margin-top: 38px; background: rgba(0,0,0,0.48); border: 3px solid rgba(255,255,255,0.22); border-radius: 28px; padding: 30px; }
    .bar-bg { height: 48px; background: rgba(255,255,255,0.14); border-radius: 99px; overflow: hidden; border: 3px solid ${tpl.accent}; margin-top: 22px; }
    .bar-fill { height: 100%; width: 40%; background: linear-gradient(90deg, ${tpl.accent}, #ff4d6d); transition: width 0.25s; }
    .log-list { display: flex; flex-direction: column; gap: 14px; margin-top: 18px; }
    .log-item { background: rgba(255,255,255,0.08); border-radius: 16px; padding: 16px 22px; font-size: 28px; }
    .welcome { position: absolute; top: 155px; left: 56px; right: 56px; z-index: 40; display: none; align-items: center; gap: 16px; padding: 14px 24px; border-radius: 99px; background: ${tpl.accent}; color: #111; font-size: 28px; font-weight: 800; }
    .welcome.show { display: flex; }
  </style>
</head>
<body>
  <div id="stage">
    <div class="topbar" id="topbar">
      <div class="ws-pill" id="ws-pill">🔴 รอ bridge.mjs (ws://8787)</div>
      <button class="gear-btn" onclick="document.getElementById('sim-box').classList.toggle('open')">⚙</button>
    </div>

    <div class="sim-box" id="sim-box">
      <div style="font-size:26px;font-weight:700;color:${tpl.accent};margin-bottom:12px;">⚙ จำลองเหตุการณ์ไลฟ์</div>
      <input id="sim-name" value="คุณหน่อง" placeholder="ชื่อผู้ชม" />
      <input id="sim-text" value="ขอพรให้เฮงๆ รวยๆ" placeholder="ข้อความแชต" />
      <div class="sim-grid">
        <button class="sim-btn" style="background:#ff2d55" onclick="onLiveEvent('like',{nickname:v('sim-name'),likeCount:1})">❤️ กดใจ</button>
        <button class="sim-btn" style="background:#0088a8" onclick="onLiveEvent('chat',{nickname:v('sim-name'),comment:v('sim-text')})">💬 คอมเมนต์</button>
        <button class="sim-btn" style="background:#7c3aed" onclick="onLiveEvent('gift',{nickname:v('sim-name'),diamondCount:5,repeatCount:1,giftName:'ของขวัญ'})">🎁 ของขวัญ 5</button>
        <button class="sim-btn" style="background:#334155" onclick="onLiveEvent('member',{nickname:v('sim-name')})">👋 เข้าห้อง</button>
      </div>
    </div>

    <div class="welcome" id="welcome">🙏 ยินดีต้อนรับคุณ <span id="w-name"></span></div>

    <div class="title">${tpl.icon} ${tpl.name}</div>
    <div class="sub">${tpl.desc}</div>

    <div class="card">
      <div style="font-size:34px;font-weight:800;color:${tpl.accent};">📊 สถานะความคืบหน้า: <span id="score-text">0</span></div>
      <div class="bar-bg"><div class="bar-fill" id="bar-fill"></div></div>
      <div style="margin-top:18px;font-size:26px;color:#cbd5e1;">${tpl.rules.join(' • ')}</div>
    </div>

    <div class="card">
      <div style="font-size:34px;font-weight:800;color:${tpl.accent};">💬 กิจกรรมล่าสุดในห้องไลฟ์</div>
      <div class="log-list" id="log-list">
        <div class="log-item">✨ พร้อมรับคอมเมนต์ กดใจ และของขวัญจากคนดูแล้ว!</div>
      </div>
    </div>
  </div>

  <script>
    const clean = new URLSearchParams(location.search).get('clean') === '1';
    if (clean) document.getElementById('topbar').style.display = 'none';

    function fit() {
      const s = Math.min(innerWidth / 1080, innerHeight / 1920);
      document.getElementById('stage').style.transform = 'scale(' + s + ')';
    }
    fit(); addEventListener('resize', fit);
    const v = id => document.getElementById(id).value;

    let score = 0;
    function addLog(html) {
      const list = document.getElementById('log-list');
      const div = document.createElement('div');
      div.className = 'log-item';
      div.innerHTML = html;
      list.prepend(div);
      while (list.children.length > 5) list.lastChild.remove();
    }

    function updateProgress(delta) {
      score = (score + delta) % 101;
      document.getElementById('score-text').textContent = score + '%';
      document.getElementById('bar-fill').style.width = score + '%';
    }

    let wTimer;
    function onLiveEvent(event, data) {
      const name = data.nickname || 'ผู้ชม';
      if (event === 'member' || event === 'follow') {
        document.getElementById('w-name').textContent = name;
        const el = document.getElementById('welcome');
        el.classList.add('show');
        clearTimeout(wTimer);
        wTimer = setTimeout(() => el.classList.remove('show'), 3500);
      }
      if (event === 'like') {
        updateProgress(Number(data.likeCount || 1) * 5);
        addLog('❤️ <b>' + name + '</b> กดหัวใจให้กำลังใจ!');
      }
      if (event === 'chat') {
        updateProgress(8);
        addLog('💬 <b>' + name + '</b>: ' + (data.comment || ''));
      }
      if (event === 'gift') {
        const coins = Number(data.diamondCount || 1) * Number(data.repeatCount || 1);
        updateProgress(coins * 15);
        addLog('🎁 <b>' + name + '</b> ส่ง ' + (data.giftName || 'ของขวัญ') + ' (' + coins + ' เหรียญ)!');
      }
    }

    function connectWS() {
      const pill = document.getElementById('ws-pill');
      const ws = new WebSocket('ws://localhost:8787');
      ws.onopen = () => { pill.textContent = '🟢 เชื่อมต่อ bridge.mjs แล้ว'; pill.classList.add('ok'); };
      ws.onmessage = e => { try { const p = JSON.parse(e.data); if (p.event) onLiveEvent(p.event, p.data || {}); } catch {} };
      ws.onclose = () => { pill.textContent = '🔴 รอ bridge.mjs (ws://8787)'; pill.classList.remove('ok'); setTimeout(connectWS, 3000); };
      ws.onerror = () => ws.close();
    }
    connectWS();
  </script>
</body>
</html>`;
}
