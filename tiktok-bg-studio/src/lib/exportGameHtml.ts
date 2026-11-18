import { LiveGameConfig } from '@/data/liveGames';

export function generateLiveGameHtml(
  game: LiveGameConfig,
  bg?: { bgMode?: string; bgImageUrl?: string; bgBrightness?: number; bgBlur?: number }
): string {
  const hasCustomImg = bg?.bgMode === 'image' && bg?.bgImageUrl;
  const imgUrl = hasCustomImg ? bg.bgImageUrl : '';
  const brightness = bg?.bgBrightness ?? 95;
  const blur = bg?.bgBlur ?? 0;

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${game.title} - TikTok LIVE 3D Game</title>
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
      background: ${game.bgGradient}; transform-origin: center center; flex-shrink: 0;
    }
    .bg-img {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
      filter: brightness(${brightness}%) blur(${blur}px); z-index: 1;
    }
    .topbar { position: absolute; top: 22px; right: 24px; z-index: 60; display: flex; gap: 10px; align-items: center; }
    .ws-pill { padding: 10px 18px; border-radius: 99px; background: rgba(0,0,0,0.7); border: 2px solid #ff4d6d; font-size: 20px; font-weight: 600; }
    .ws-pill.ok { border-color: #06d6a0; }
    .gear-btn { width: 62px; height: 62px; border-radius: 50%; border: 2px solid ${game.accent}; background: rgba(0,0,0,0.78); color: #fff; font-size: 30px; cursor: pointer; }
    .sim-box { position: absolute; top: 96px; right: 24px; width: 470px; z-index: 70; background: rgba(10,14,26,0.96); border: 2px solid ${game.accent}; border-radius: 22px; padding: 24px; display: none; }
    .sim-box.open { display: block; }
    .sim-box input { width: 100%; padding: 12px; font-size: 21px; border-radius: 10px; border: 1px solid #444; background: #070912; color: #fff; margin-bottom: 10px; font-family: inherit; }
    .sim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sim-btn { padding: 12px; border-radius: 12px; border: none; color: #fff; font-size: 20px; font-weight: 700; cursor: pointer; font-family: inherit; }
    .hud { position: relative; z-index: 10; padding: 92px 34px 0; }
    .hud.clean { padding-top: 44px; }
    .hud-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .title { font-size: 44px; font-weight: 800; color: ${game.accent}; text-shadow: 0 4px 16px rgba(0,0,0,0.8); }
    .pills { display: flex; gap: 10px; font-size: 23px; font-weight: 700; }
    .pill { background: rgba(0,0,0,0.6); padding: 8px 16px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.22); }
    .gifts { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-top: 18px; }
    .gift { background: rgba(8,10,24,0.75); border: 2px solid ${game.accent}66; border-radius: 18px; padding: 12px 6px; text-align: center; }
    .meter-wrap { margin-top: 16px; position: relative; height: 42px; background: rgba(0,0,0,0.65); border-radius: 99px; overflow: hidden; border: 2px solid ${game.accent}; }
    .meter-fill { height: 100%; width: 22%; background: linear-gradient(90deg, ${game.secondary}, ${game.accent}); transition: width 0.25s; }
    .meter-txt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; text-shadow: 0 2px 6px #000; }
    .mid { position: relative; z-index: 15; padding: 18px 34px; display: flex; justify-content: space-between; align-items: flex-start; }
    .lb { width: 310px; background: rgba(8,10,20,0.78); border: 2px solid rgba(255,209,102,0.45); border-radius: 20px; padding: 14px 18px; }
    .vip-banner { display: none; background: linear-gradient(135deg, ${game.secondary}, ${game.accent}); padding: 18px 28px; border-radius: 24px; border: 3px solid #fff; text-align: center; }
    .vip-banner.show { display: block; }
    .hero { position: relative; z-index: 12; text-align: center; font-size: 165px; filter: drop-shadow(0 16px 36px ${game.accent}); }
    .floor { position: absolute; left: 0; right: 0; top: 51%; bottom: 0; z-index: 14; background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%); border-top: 4px solid ${game.accent}; }
    @keyframes dance { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-12px)} }
    .dancer { position: absolute; text-align: center; animation: dance 1.6s ease-in-out infinite; }
    .dancer-name { background: rgba(0,0,0,0.72); font-size: 19px; font-weight: 700; padding: 3px 10px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.28); white-space: nowrap; margin-bottom: 4px; }
    .dancer-bubble { background: #fff; color: #111; font-size: 19px; font-weight: 700; padding: 4px 12px; border-radius: 14px; margin-bottom: 4px; white-space: nowrap; }
  </style>
</head>
<body>
  <div id="stage">
    ${imgUrl ? `<img class="bg-img" src="${imgUrl}" alt="Background" />` : ''}
    <div class="topbar" id="topbar">
      <div class="ws-pill" id="ws-pill">🔴 รอ ws://8787</div>
      <button class="gear-btn" onclick="document.getElementById('sim-box').classList.toggle('open')">⚙</button>
    </div>

    <div class="sim-box" id="sim-box">
      <div style="font-size:25px;font-weight:800;color:${game.accent};margin-bottom:12px;">⚙ จำลองคนดูในไลฟ์</div>
      <input id="sim-name" value="คุณหน่อง" placeholder="ชื่อคนดู" />
      <input id="sim-text" value="ม่วนมากครับ!" placeholder="ข้อความคอมเมนต์" />
      <div class="sim-grid">
        <button class="sim-btn" style="background:#ff2d55" onclick="onEvt('like',{nickname:v('sim-name'),likeCount:5})">❤️ กดใจ (+5)</button>
        <button class="sim-btn" style="background:#0088a8" onclick="onEvt('chat',{nickname:v('sim-name'),comment:v('sim-text')})">💬 คอมเมนต์</button>
        <button class="sim-btn" style="background:#7c3aed" onclick="onEvt('gift',{nickname:v('sim-name'),diamondCount:20,repeatCount:1,giftName:'${game.giftTiers[3].label}'})">🎁 ของขวัญ 20</button>
        <button class="sim-btn" style="background:#059669" onclick="onEvt('share',{nickname:v('sim-name')})">🔗 แชร์ไลฟ์</button>
      </div>
    </div>

    <div class="hud" id="hud">
      <div class="hud-top">
        <div class="title">${game.icon} ${game.title}</div>
        <div class="pills">
          <div class="pill">❤️ <span id="likes">23291</span></div>
          <div class="pill">🎁 <span id="gifts">155</span></div>
          <div class="pill">🔗 <span id="shares">42</span></div>
        </div>
      </div>
      <div class="gifts">
        ${game.giftTiers.map((t) => `<div class="gift"><div style="font-size:22px;font-weight:800;color:#60a5fa">💎 ${t.coins}</div><div style="font-size:40px">${t.icon}</div><div style="font-size:21px;font-weight:700">${t.label}</div></div>`).join('')}
      </div>
      <div class="meter-wrap">
        <div class="meter-fill" id="meter-fill"></div>
        <div class="meter-txt">${game.meterLabel} ❤️ <span id="meter-val">220</span> / ${game.meterTarget}</div>
      </div>
    </div>

    <div class="mid">
      <div class="lb">
        <div style="font-size:24px;font-weight:800;color:${game.accent};margin-bottom:8px;">🏆 อันดับสายม่วน</div>
        <div id="lb-list" style="font-size:21px;"></div>
      </div>
      <div class="vip-banner" id="vip-banner">
        <div id="vip-name" style="font-size:34px;font-weight:800;"></div>
        <div id="vip-act" style="font-size:26px;font-weight:700;"></div>
      </div>
    </div>

    <div class="hero">${game.stageEmoji}</div>
    <div class="floor" id="floor"></div>
  </div>

  <script>
    const clean = new URLSearchParams(location.search).get('clean') === '1';
    if (clean) { document.getElementById('topbar').style.display = 'none'; document.getElementById('hud').classList.add('clean'); }
    function fit() { document.getElementById('stage').style.transform = 'scale(' + Math.min(innerWidth/1080, innerHeight/1920) + ')'; }
    fit(); addEventListener('resize', fit);
    const v = id => document.getElementById(id).value;
    const EMOJIS = ${JSON.stringify(game.crowdEmojis)};
    const TARGET = ${game.meterTarget};
    let likes = 23291, gifts = 155, shares = 42, meter = 220;
    const crowd = ['mizumiso_0','ออรอที่นี่ฯ','ชื่อตะวัน','เปรี้ยว','แพนไม่ลึก','pop py','บัว_51128','ฟ้าใส','ต้นกล้า99','น้องมายด์'].map((n,i)=>({
      nickname:n, score:1000-i*75, x:10+(i*19)%80, y:16+Math.floor(i/5)*26+(i%3)*6, emoji:EMOJIS[i%EMOJIS.length], bubble:''
    }));

    function speak(txt) {
      if (!('speechSynthesis' in window)) return;
      if (speechSynthesis.speaking && speechSynthesis.pending) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt); u.lang = 'th-TH'; u.rate = 1.1; speechSynthesis.speak(u);
    }

    function render() {
      const floor = document.getElementById('floor');
      floor.innerHTML = crowd.map((m,i)=>'<div class="dancer" style="left:'+m.x+'%;top:'+m.y+'%;animation-delay:'+(i*0.15)+'s">'+(m.bubble?'<div class="dancer-bubble">'+m.bubble+'</div>':'')+'<div class="dancer-name">'+m.nickname+'</div><div style="font-size:64px;line-height:1">'+m.emoji+'</div></div>').join('');
      const top5 = [...crowd].sort((a,b)=>b.score-a.score).slice(0,5);
      document.getElementById('lb-list').innerHTML = top5.map((m,i)=>'<div style="display:flex;justify-content:space-between;padding:4px 0"><span>'+(i+1)+'. '+m.nickname+'</span><span style="color:${game.accent};font-weight:700">'+m.score+'</span></div>').join('');
      document.getElementById('likes').textContent = likes.toLocaleString();
      document.getElementById('gifts').textContent = gifts;
      document.getElementById('shares').textContent = shares;
      document.getElementById('meter-val').textContent = meter;
      document.getElementById('meter-fill').style.width = Math.min(100, Math.round(meter/TARGET*100)) + '%';
    }

    function upsert(name, pts, bubble) {
      let m = crowd.find(c=>c.nickname===name);
      if (!m) { m = { nickname:name, score:0, x:10+Math.random()*80, y:14+Math.random()*58, emoji:EMOJIS[crowd.length%EMOJIS.length], bubble:'' }; crowd.push(m); }
      m.score += pts; if (bubble) m.bubble = bubble;
      render();
    }

    let vipT;
    function showVip(name, act) {
      document.getElementById('vip-name').textContent = name;
      document.getElementById('vip-act').textContent = act;
      const b = document.getElementById('vip-banner'); b.classList.add('show');
      clearTimeout(vipT); vipT = setTimeout(()=>b.classList.remove('show'), 4000);
    }

    function onEvt(ev, d) {
      const n = d.nickname || 'ผู้ชม';
      if (ev==='like') { const c = Number(d.likeCount||1); likes+=c; meter=(meter+c*3)%TARGET; upsert(n, c*2); }
      if (ev==='chat') { meter=(meter+10)%TARGET; upsert(n, 15, (d.comment||'').slice(0,26)); if(d.comment) speak(n+' พิมพ์ว่า '+d.comment); }
      if (ev==='share') { shares++; meter=(meter+35)%TARGET; upsert(n, 30, '🔗 แชร์แล้ว!'); showVip('🔗 '+n, 'แชร์ไลฟ์นี้แล้ว!'); speak('ขอบคุณคุณ '+n+' ที่ช่วยแชร์ไลฟ์ครับ'); }
      if (ev==='gift') { const c = Number(d.diamondCount||1)*Number(d.repeatCount||1); gifts++; meter=(meter+c*25)%TARGET; upsert(n, c*50, '🎁 '+(d.giftName||'ของขวัญ')); showVip('🎁 '+n, (d.giftName||'ของขวัญ')+' ('+c+' เหรียญ)'); speak('ขอบคุณคุณ '+n+' สำหรับ '+(d.giftName||'ของขวัญ')+' ครับ'); }
    }

    function connectWS() {
      const p = document.getElementById('ws-pill');
      const ws = new WebSocket('ws://localhost:8787');
      ws.onopen = () => { p.textContent = '🟢 bridge.mjs'; p.classList.add('ok'); };
      ws.onmessage = e => { try { const j = JSON.parse(e.data); if (j.event) onEvt(j.event, j.data||{}); } catch {} };
      ws.onclose = () => { p.textContent = '🔴 รอ ws://8787'; p.classList.remove('ok'); setTimeout(connectWS, 3000); };
      ws.onerror = () => ws.close();
    }
    render(); connectWS();
  </script>
</body>
</html>`;
}
