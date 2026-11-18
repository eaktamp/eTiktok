'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LIVE_GAMES, LiveGameConfig } from '@/data/liveGames';
import { SCENES } from '@/data/backgrounds';
import { createParticles, drawBackgroundScene, drawParticles, Particle } from '@/lib/canvasRenderer';
import { generateLiveGameHtml } from '@/lib/exportGameHtml';
import RotHaeTruckArt from '@/components/RotHaeTruckArt';

interface CrowdMember {
  id: string;
  nickname: string;
  avatar: string;
  emoji: string;
  x: number; // % 8..92
  y: number; // % 54..90
  score: number;
  bubble?: string;
  vip?: boolean;
  jumpUntil?: number;
  delay: number;
}

const GAME_TO_SCENE_MAP: Record<string, string> = {
  'rot-hae': 'ca-2',
  'shrine-dragon': 'tp-1',
  'muay-thai': 'co-3',
  'boat-race': 'lk-2',
  'temple-fair': 'cu-3',
  'songkran': 'cu-1',
  'mor-lam': 'co-2',
  'thai-cafe': 'co-5',
  'haunted-house': 'na-4',
  'space-raid': 'co-1',
  'penalty-cup': 'sc-5',
  'retro-98': 'ho-3',
  'loy-krathong': 'lk-1',
  'suat-mon': 'tp-2',
  'sai-bat': 'tp-4',
  'travel-thai': 'na-1',
  'dance-party': 'co-4',
};

const SAMPLE_NAMES = [
  'mizumiso_0', 'ออรอที่นี่ฯ', 'ชื่อตะวัน', 'เปรี้ยว', 'แพนไม่ลึก',
  'pop py', 'บัว_51128', 'Kotchapak', 'P por', 'ฟ้าใส',
  'ต้นกล้า99', 'น้องมายด์', 'สายชิล', 'Nop_N', 'เจ๊พิมพ์',
  'Boy-TNV', 'กัสซี่', 'พลอยใส',
];

function makeInitialCrowd(game: LiveGameConfig): CrowdMember[] {
  return SAMPLE_NAMES.map((name, i) => ({
    id: `seed-${i}`,
    nickname: name,
    avatar: '',
    emoji: game.crowdEmojis[i % game.crowdEmojis.length],
    x: 9 + ((i * 19) % 82),
    y: 55 + Math.floor(i / 5) * 9 + (i % 3) * 2,
    score: Math.max(10, 1050 - i * 65),
    vip: i < 2,
    delay: (i * 0.17) % 1.5,
  }));
}

export default function LiveGameApp() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cleanMode, setCleanMode] = useState(false);
  const [catFilter, setCatFilter] = useState('ทั้งหมด');
  const [panelOpen, setPanelOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [stageScale, setStageScale] = useState(0.45);

  // Background customization inside /game (persisted per game in localStorage)
  const [bgMode, setBgMode] = useState<'scene' | 'image'>('scene');
  const [bgSceneId, setBgSceneId] = useState<string>('ca-2');
  const [bgImageUrl, setBgImageUrl] = useState<string>('');
  const [bgUrlInput, setBgUrlInput] = useState<string>('');
  const [bgBrightness, setBgBrightness] = useState<number>(95);
  const [bgBlur, setBgBlur] = useState<number>(0);
  const [bgStatusMsg, setBgStatusMsg] = useState<string | null>(null);

  // Live stage state
  const [likesTotal, setLikesTotal] = useState(23291);
  const [giftsTotal, setGiftsTotal] = useState(155);
  const [sharesTotal, setSharesTotal] = useState(42);
  const [meter, setMeter] = useState(212);
  const [crowd, setCrowd] = useState<CrowdMember[]>([]);
  const [vipBanner, setVipBanner] = useState<{ nickname: string; action: string; icon: string } | null>(null);
  const [fireworkText, setFireworkText] = useState<string | null>(null);

  // AI Voice (TTS) state
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(1.1);
  const ttsEnabledRef = useRef(ttsEnabled);
  const ttsRateRef = useRef(ttsRate);
  ttsEnabledRef.current = ttsEnabled;
  ttsRateRef.current = ttsRate;

  const speakText = useCallback((text: string) => {
    if (!ttsEnabledRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (synth.speaking && synth.pending) {
      // Keep queue fast and responsive without lag
      synth.cancel();
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'th-TH';
    utter.rate = ttsRateRef.current;
    utter.pitch = 1.05;
    synth.speak(utter);
  }, []);

  // Simulator inputs
  const [simName, setSimName] = useState('คุณหน่อง');
  const [simComment, setSimComment] = useState('ม่วนมากครับ!');

  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animTimeRef = useRef(0);
  const vipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fwTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse URL params (?play=...&clean=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const play = params.get('play');
    if (play && LIVE_GAMES.some((g) => g.id === play)) {
      setSelectedId(play);
    }
    if (params.get('clean') === '1') {
      setCleanMode(true);
    }
  }, []);

  const activeGame = useMemo(
    () => LIVE_GAMES.find((g) => g.id === selectedId) || null,
    [selectedId]
  );

  const BG_STORAGE_KEY = 'tiktok_live_game_bgs_v1';

  // Map of saved backgrounds per game for Gallery previews
  const [savedBgsMap, setSavedBgsMap] = useState<
    Record<string, { bgMode: 'scene' | 'image'; bgSceneId: string; bgImageUrl: string; bgBrightness: number; bgBlur: number }>
  >({});

  const refreshSavedBgsMap = useCallback(async (signal?: AbortSignal) => {
    let merged: Record<string, { bgMode: 'scene' | 'image'; bgSceneId: string; bgImageUrl: string; bgBrightness: number; bgBlur: number }> = {};
    try {
      const local = JSON.parse(localStorage.getItem(BG_STORAGE_KEY) || '{}');
      merged = { ...local };
    } catch {
      // ignore
    }
    try {
      const res = await fetch('/api/backgrounds', { cache: 'no-store', signal });
      if (res.ok) {
        const remote = await res.json();
        merged = { ...merged, ...remote };
      }
    } catch {
      // ignore aborted or transient HMR fetch errors
    }
    if (!signal?.aborted) {
      setSavedBgsMap(merged);
    }
    return merged;
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    refreshSavedBgsMap(ctrl.signal);
    return () => ctrl.abort();
  }, [refreshSavedBgsMap, selectedId]);

  const saveBgConfig = useCallback(
    async (
      gameId: string,
      cfg: { bgMode: 'scene' | 'image'; bgSceneId: string; bgImageUrl: string; bgBrightness: number; bgBlur: number },
      msg = '✅ บันทึกพื้นหลังเรียบร้อยแล้ว! (ใช้ได้ใน ?clean=1 / OBS)'
    ) => {
      let savedCfg = cfg;
      try {
        const res = await fetch('/api/backgrounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, ...cfg }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.config) {
            savedCfg = json.config;
            if (savedCfg.bgImageUrl) setBgImageUrl(savedCfg.bgImageUrl);
          }
        }
      } catch {
        // fallback to localStorage only
      }
      try {
        const all = JSON.parse(localStorage.getItem(BG_STORAGE_KEY) || '{}');
        all[gameId] = savedCfg;
        localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(all));
      } catch {
        // ignore quota errors since server already saved it
      }
      setSavedBgsMap((prev) => ({ ...prev, [gameId]: savedCfg }));
      setBgStatusMsg(msg);
    },
    []
  );

  // Seed crowd & load saved background when switching game
  useEffect(() => {
    if (!activeGame) return;
    let cancelled = false;
    setCrowd(makeInitialCrowd(activeGame));
    setMeter(Math.round(activeGame.meterTarget * 0.22));
    setBgStatusMsg(null);
    const defaultScene = GAME_TO_SCENE_MAP[activeGame.id] || 'co-2';

    const applySaved = (saved?: { bgMode: 'scene' | 'image'; bgSceneId: string; bgImageUrl: string; bgBrightness: number; bgBlur: number }) => {
      if (cancelled) return;
      if (saved) {
        setBgMode(saved.bgMode || 'scene');
        setBgSceneId(saved.bgSceneId || defaultScene);
        setBgImageUrl(saved.bgImageUrl || '');
        setBgUrlInput(saved.bgMode === 'image' && !String(saved.bgImageUrl || '').startsWith('data:') ? saved.bgImageUrl : '');
        setBgBrightness(saved.bgBrightness ?? 95);
        setBgBlur(saved.bgBlur ?? 0);
      } else {
        setBgSceneId(defaultScene);
        setBgMode('scene');
        setBgImageUrl('');
        setBgUrlInput('');
        setBgBrightness(95);
        setBgBlur(0);
      }
    };

    const ctrl = new AbortController();
    refreshSavedBgsMap(ctrl.signal).then((all) => {
      applySaved(all[activeGame.id]);
    });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [activeGame, refreshSavedBgsMap]);

  // 60fps 3D Backdrop & Particles Loop
  useEffect(() => {
    if (!activeGame) return;
    particlesRef.current = createParticles(1080, 1920, 75);
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      animTimeRef.current += dt;

      const scene = SCENES.find((s) => s.id === bgSceneId) || SCENES[0];
      if (bgCanvasRef.current && bgMode === 'scene') {
        const bCtx = bgCanvasRef.current.getContext('2d');
        if (bCtx) {
          drawBackgroundScene(bCtx, 1080, 1920, animTimeRef.current, {
            primary: scene.primary,
            secondary: scene.secondary,
            accent: scene.accent,
            style: scene.style,
            pulse: true,
          });
        }
      }
      if (fxCanvasRef.current) {
        const fCtx = fxCanvasRef.current.getContext('2d');
        if (fCtx) {
          drawParticles(fCtx, particlesRef.current, 1080, 1920, animTimeRef.current, dt, {
            type: scene.particle,
            accent: scene.accent,
            speed: 1.1,
            density: 75,
          });
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeGame, bgMode, bgSceneId]);

  // Fit 1080x1920 stage
  useEffect(() => {
    const updateScale = () => {
      const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
      setStageScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const openGame = (id: string, clean = false) => {
    setSelectedId(id);
    setCleanMode(clean);
    const url = new URL(window.location.href);
    url.searchParams.set('play', id);
    if (clean) url.searchParams.set('clean', '1');
    else url.searchParams.delete('clean');
    window.history.pushState({}, '', url.toString());
  };

  const backToGallery = () => {
    setSelectedId(null);
    setCleanMode(false);
    setPanelOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('play');
    url.searchParams.delete('clean');
    window.history.pushState({}, '', url.toString());
  };

  const upsertCrowd = useCallback(
    (nickname: string, avatar: string, deltaScore: number, opts?: { bubble?: string; vip?: boolean }) => {
      if (!activeGame) return;
      const now = Date.now();
      setCrowd((prev) => {
        const idx = prev.findIndex((m) => m.nickname === nickname);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            avatar: avatar || updated[idx].avatar,
            score: updated[idx].score + deltaScore,
            bubble: opts?.bubble ?? updated[idx].bubble,
            vip: opts?.vip ?? updated[idx].vip,
            jumpUntil: now + 1800,
          };
          return updated;
        }
        const nextMember: CrowdMember = {
          id: `u-${now}-${Math.random()}`,
          nickname,
          avatar,
          emoji: activeGame.crowdEmojis[prev.length % activeGame.crowdEmojis.length],
          x: 10 + Math.random() * 80,
          y: 55 + Math.random() * 32,
          score: deltaScore,
          bubble: opts?.bubble,
          vip: opts?.vip,
          jumpUntil: now + 1800,
          delay: Math.random() * 1.4,
        };
        return [...prev.slice(-34), nextMember];
      });
    },
    [activeGame]
  );

  const addMeter = useCallback(
    (amount: number) => {
      if (!activeGame) return;
      setMeter((prev) => {
        const next = prev + amount;
        if (next >= activeGame.meterTarget) {
          setFireworkText(`🎉 ${activeGame.meterLabel} เต็ม 100% แล้ว! ทั้งห้องฉลองพร้อมกัน!`);
          if (fwTimerRef.current) clearTimeout(fwTimerRef.current);
          fwTimerRef.current = setTimeout(() => setFireworkText(null), 4500);
          return 0;
        }
        return next;
      });
    },
    [activeGame]
  );

  const handleLiveEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      if (!activeGame) return;
      const nickname = String(data.nickname || 'ผู้ชม');
      const avatar = String(data.profilePictureUrl || '');

      if (event === 'member' || event === 'follow') {
        upsertCrowd(nickname, avatar, 5, { bubble: 'สวัสดีจ้า!' });
      } else if (event === 'like') {
        const count = Math.max(1, Number(data.likeCount || 1));
        setLikesTotal((n) => n + count);
        addMeter(count * 3);
        upsertCrowd(nickname, avatar, count * 2);
      } else if (event === 'share') {
        setSharesTotal((n) => n + 1);
        addMeter(35);
        upsertCrowd(nickname, avatar, 30, { vip: true, bubble: '🔗 แชร์ไลฟ์แล้ว!' });
        setVipBanner({
          nickname,
          action: 'แชร์ไลฟ์นี้แล้ว! ขอบคุณมากครับ',
          icon: '🔗',
        });
        speakText(`ขอบคุณคุณ ${nickname} ที่ช่วยแชร์ไลฟ์ครับ`);
        if (vipTimerRef.current) clearTimeout(vipTimerRef.current);
        vipTimerRef.current = setTimeout(() => setVipBanner(null), 4000);
      } else if (event === 'chat') {
        const comment = String(data.comment || '').trim();
        addMeter(10);
        upsertCrowd(nickname, avatar, 15, { bubble: comment.slice(0, 28) });
        if (comment) {
          speakText(`${nickname} พิมพ์ว่า ${comment}`);
        }
      } else if (event === 'gift') {
        const coins = Number(data.diamondCount || 1) * Number(data.repeatCount || 1);
        const giftName = String(data.giftName || 'ของขวัญ');
        setGiftsTotal((n) => n + 1);
        addMeter(coins * 25);
        upsertCrowd(nickname, avatar, coins * 50, {
          vip: true,
          bubble: `🎁 ${giftName}!`,
        });
        const tier =
          [...activeGame.giftTiers].reverse().find((t) => coins >= t.coins) || activeGame.giftTiers[0];
        setVipBanner({
          nickname,
          action: `${tier.label} (${coins} เหรียญ)`,
          icon: tier.icon,
        });
        speakText(`ขอบคุณคุณ ${nickname} สำหรับ ${giftName} ครับ`);
        if (vipTimerRef.current) clearTimeout(vipTimerRef.current);
        vipTimerRef.current = setTimeout(() => setVipBanner(null), 4500);
      }
    },
    [activeGame, addMeter, speakText, upsertCrowd]
  );

  // WebSocket client
  useEffect(() => {
    if (!activeGame) return;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      setWsStatus('connecting');
      try {
        ws = new WebSocket('ws://localhost:8787');
        ws.onopen = () => setWsStatus('connected');
        ws.onmessage = (ev) => {
          try {
            const p = JSON.parse(ev.data);
            if (p?.event && p?.data) handleLiveEvent(p.event, p.data);
          } catch {
            // ignore
          }
        };
        ws.onclose = () => {
          setWsStatus('disconnected');
          if (!closed) timer = setTimeout(connect, 3000);
        };
        ws.onerror = () => ws?.close();
      } catch {
        setWsStatus('disconnected');
        if (!closed) timer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      ws?.close();
    };
  }, [activeGame, handleLiveEvent]);

  const categories = useMemo(
    () => ['ทั้งหมด', ...Array.from(new Set(LIVE_GAMES.map((g) => g.category)))],
    []
  );

  const visibleGames = useMemo(
    () => (catFilter === 'ทั้งหมด' ? LIVE_GAMES : LIVE_GAMES.filter((g) => g.category === catFilter)),
    [catFilter]
  );

  const leaderboard = useMemo(
    () => [...crowd].sort((a, b) => b.score - a.score).slice(0, 5),
    [crowd]
  );

  // ==================== GALLERY VIEW (4 PER ROW, 12 GAMES) ====================
  if (!activeGame) {
    return (
      <div
        style={{
          minHeight: '100vh',
          height: '100vh',
          overflowY: 'auto',
          background: 'radial-gradient(circle at top, #182038 0%, #090c14 100%)',
          color: '#f8fafc',
          padding: '28px 36px 48px',
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                🎮 คลังเกมไลฟ์ TikTok 3D Interactive ({LIVE_GAMES.length} แบบไม่ซ้ำใคร)
              </h1>
              <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                ฉากหลัง 3 มิติเคลื่อนไหวสมูส 60fps • ตัวละครคนดูเต้นขยับมีมิติลึก-ตื้น • เปลี่ยนภาพพื้นหลังจริงได้เองในปุ่ม ⚙
              </p>
            </div>
            <a
              href="/"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              🎨 กลับไปคลังฉากหลัง
            </a>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 99,
                  border: '1px solid',
                  borderColor: catFilter === c ? '#ff2d55' : 'rgba(255,255,255,0.12)',
                  background: catFilter === c ? 'rgba(255,45,85,0.22)' : '#121726',
                  color: catFilter === c ? '#fff' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
            {visibleGames.map((g) => {
              const savedBg = savedBgsMap[g.id];
              const customImg = savedBg?.bgMode === 'image' && savedBg.bgImageUrl ? savedBg.bgImageUrl : null;
              const customScene = savedBg?.bgMode === 'scene' ? SCENES.find((s) => s.id === savedBg.bgSceneId) : null;
              const previewBg = customImg
                ? `url("${customImg}") center / cover no-repeat`
                : customScene
                ? `linear-gradient(160deg, ${customScene.primary} 0%, ${customScene.secondary} 65%, ${customScene.accent} 140%)`
                : g.bgGradient;

              return (
                <div
                  key={g.id}
                  style={{
                    background: '#121726',
                    border: savedBg ? '1px solid rgba(0,242,234,0.45)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 14px 36px rgba(0,0,0,0.4)',
                  }}
                >
                  <div
                    onClick={() => openGame(g.id, false)}
                    style={{
                      height: 220,
                      background: previewBg,
                      position: 'relative',
                      padding: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                    }}
                  >
                    {customImg && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', pointerEvents: 'none' }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: g.accent, textShadow: '0 2px 6px #000' }}>{g.icon} {g.title}</span>
                        <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.65)', padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                          {customImg ? '🖼️ พื้นหลังที่ตั้งไว้' : g.category}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginTop: 8 }}>
                        {g.giftTiers.map((t) => (
                          <div key={t.coins} style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '3px 2px', textAlign: 'center', fontSize: 9.5 }}>
                            <div>{t.icon}</div>
                            <div style={{ color: g.accent, fontWeight: 700 }}>{t.coins}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', fontSize: 44, filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.8))' }}>
                      {g.id === 'rot-hae' ? <RotHaeTruckArt compact /> : g.stageEmoji}
                    </div>
                    <div style={{ position: 'relative', zIndex: 2, background: g.floorGradient, margin: '0 -12px -12px', padding: '8px 12px', display: 'flex', justifyContent: 'space-around', fontSize: 20, borderTop: `2px solid ${g.accent}` }}>
                      {g.crowdEmojis.map((em, idx) => <span key={idx}>{em}</span>)}
                    </div>
                  </div>

                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{g.icon} {g.title}</div>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.45 }}>{g.desc}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      <button
                        onClick={() => openGame(g.id, false)}
                        style={{ padding: '8px 6px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #ff2d55, #d91e48)', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        ▶ เล่น
                      </button>
                      <button
                        onClick={() => openGame(g.id, true)}
                        style={{ padding: '8px 6px', borderRadius: 8, border: '1px solid rgba(0,242,234,0.4)', background: 'rgba(0,242,234,0.14)', color: '#00f2ea', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        📺 ไลฟ์
                      </button>
                      <button
                        onClick={() => {
                          const html = generateLiveGameHtml(g, savedBg);
                          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `${g.id}-live.html`;
                          a.click();
                        }}
                        style={{ padding: '8px 6px', borderRadius: 8, border: '1px solid rgba(255,209,102,0.45)', background: 'rgba(255,209,102,0.14)', color: '#ffd166', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        ⬇️ .html
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== FULL 1080x1920 3D INTERACTIVE STAGE ====================
  const meterPct = Math.min(100, Math.round((meter / activeGame.meterTarget) * 100));
  const bgFilter = `brightness(${bgBrightness}%) blur(${bgBlur}px)`;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#04050a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: `scale(${stageScale})`,
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          background: '#050711',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {/* 3D Animated Canvas Backdrop OR Custom Real Photo */}
        <canvas
          ref={bgCanvasRef}
          width={1080}
          height={1920}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: bgMode === 'scene' ? 'block' : 'none',
            filter: bgFilter,
          }}
        />
        {bgMode === 'image' && bgImageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={bgImageUrl}
            alt="Custom Backdrop"
            onError={() => setBgStatusMsg('⚠️ โหลดรูปจากลิงก์นี้ไม่ได้ ลองอัปโหลดจากเครื่องแทนครับ')}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: bgFilter,
              zIndex: 1,
            }}
          />
        )}
        <canvas
          ref={fxCanvasRef}
          width={1080}
          height={1920}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
        />

        {/* Volumetric Sweeping Spotlights */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, overflow: 'hidden' }}>
          <div
            className="spotlight-beam"
            style={{
              position: 'absolute',
              top: -40,
              left: '18%',
              width: 260,
              height: 1100,
              background: `linear-gradient(180deg, ${activeGame.accent}55, transparent)`,
              clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            }}
          />
          <div
            className="spotlight-beam"
            style={{
              position: 'absolute',
              top: -40,
              right: '18%',
              width: 260,
              height: 1100,
              background: `linear-gradient(180deg, ${activeGame.secondary}55, transparent)`,
              clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
              animationDelay: '1.8s',
            }}
          />
        </div>

        {/* Top Controls (hidden when ?clean=1) */}
        {!cleanMode && (
          <div style={{ position: 'absolute', top: 20, left: 24, right: 24, zIndex: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={backToGallery}
              style={{ padding: '10px 20px', borderRadius: 99, background: 'rgba(0,0,0,0.72)', border: '2px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}
            >
              ⬅ เลือกเกมอื่น (12 แบบ)
            </button>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => setTtsEnabled((v) => !v)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 99,
                  background: ttsEnabled ? 'rgba(0,242,234,0.22)' : 'rgba(0,0,0,0.7)',
                  border: `2px solid ${ttsEnabled ? '#00f2ea' : 'rgba(255,255,255,0.25)'}`,
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {ttsEnabled ? '🔊 AI อ่านแชต: เปิด' : '🔇 AI อ่านแชต: ปิด'}
              </button>
              <div style={{ padding: '10px 18px', borderRadius: 99, background: 'rgba(0,0,0,0.7)', border: `2px solid ${wsStatus === 'connected' ? '#06d6a0' : '#ff4d6d'}`, fontSize: 20, fontWeight: 600 }}>
                {wsStatus === 'connected' ? '🟢 bridge.mjs' : '🔴 รอ ws://8787'}
              </div>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                style={{ width: 62, height: 62, borderRadius: '50%', border: `2px solid ${activeGame.accent}`, background: 'rgba(0,0,0,0.78)', color: '#fff', fontSize: 30, cursor: 'pointer' }}
              >
                ⚙
              </button>
            </div>
          </div>
        )}

        {/* Simulator & Background Switcher Drawer */}
        {!cleanMode && panelOpen && (
          <div
            style={{
              position: 'absolute',
              top: 96,
              right: 24,
              width: 500,
              maxHeight: 1450,
              overflowY: 'auto',
              zIndex: 70,
              background: 'rgba(10,14,26,0.96)',
              border: `2px solid ${activeGame.accent}`,
              borderRadius: 22,
              padding: 24,
              boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 800, color: activeGame.accent, marginBottom: 12 }}>
              ⚙ จำลองคนดู &amp; เปลี่ยนพื้นหลัง
            </div>
            <input
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="ชื่อคนดู"
              style={{ width: '100%', padding: 12, fontSize: 21, borderRadius: 10, border: '1px solid #444', background: '#070912', color: '#fff', marginBottom: 10 }}
            />
            <input
              value={simComment}
              onChange={(e) => setSimComment(e.target.value)}
              placeholder="ข้อความคอมเมนต์"
              style={{ width: '100%', padding: 12, fontSize: 21, borderRadius: 10, border: '1px solid #444', background: '#070912', color: '#fff', marginBottom: 12 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <button onClick={() => handleLiveEvent('like', { nickname: simName, likeCount: 5 })} style={{ padding: 12, borderRadius: 12, background: '#ff2d55', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
                ❤️ กดใจ (+5)
              </button>
              <button onClick={() => handleLiveEvent('chat', { nickname: simName, comment: simComment })} style={{ padding: 12, borderRadius: 12, background: '#0088a8', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
                💬 ส่งคอมเมนต์
              </button>
              <button onClick={() => handleLiveEvent('gift', { nickname: simName, diamondCount: 20, repeatCount: 1, giftName: activeGame.giftTiers[3].label })} style={{ padding: 12, borderRadius: 12, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
                🎁 ของขวัญ 20
              </button>
              <button onClick={() => handleLiveEvent('member', { nickname: simName })} style={{ padding: 12, borderRadius: 12, background: '#334155', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
                👋 เข้าห้องใหม่
              </button>
              <button onClick={() => handleLiveEvent('share', { nickname: simName })} style={{ gridColumn: 'span 2', padding: 12, borderRadius: 12, background: '#059669', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, cursor: 'pointer' }}>
                🔗 จำลองแชร์ไลฟ์
              </button>
            </div>

            {/* Quick Theme Switcher & AI Voice */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ffd166', marginBottom: 8 }}>
                🎮 เปลี่ยนธีมเกมด่วน
              </div>
              <select
                value={activeGame.id}
                onChange={(e) => openGame(e.target.value, cleanMode)}
                style={{ width: '100%', padding: 11, fontSize: 20, borderRadius: 10, border: '1px solid #444', background: '#070912', color: '#fff', marginBottom: 10 }}
              >
                {LIVE_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.title}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 19, marginBottom: 4 }}>ความเร็วเสียงพูด AI: {ttsRate.toFixed(1)}x</div>
              <input type="range" min={0.8} max={1.5} step={0.1} value={ttsRate} onChange={(e) => setTtsRate(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            {/* Change Background Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#00f2ea', marginBottom: 10 }}>
                🖼️ เปลี่ยนภาพพื้นหลัง (3D / ภาพจริง)
              </div>
              <select
                value={bgSceneId}
                onChange={(e) => {
                  const nextScene = e.target.value;
                  setBgSceneId(nextScene);
                  setBgMode('scene');
                  saveBgConfig(activeGame.id, {
                    bgMode: 'scene',
                    bgSceneId: nextScene,
                    bgImageUrl,
                    bgBrightness,
                    bgBlur,
                  });
                }}
                style={{ width: '100%', padding: 12, fontSize: 20, borderRadius: 10, border: '1px solid #444', background: '#070912', color: '#fff', marginBottom: 10 }}
              >
                {SCENES.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    ✨ {sc.name} ({sc.sub})
                  </option>
                ))}
              </select>

              <label
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  background: 'linear-gradient(90deg, #00c4bd, #0088a8)',
                  textAlign: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: 10,
                }}
              >
                📁 อัปโหลดรูปภาพจริงจากเครื่อง
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const raw = ev.target?.result;
                      if (typeof raw !== 'string') return;
                      if (isGif) {
                        // Preserve animated GIF without flattening to canvas
                        setBgImageUrl(raw);
                        setBgMode('image');
                        saveBgConfig(
                          activeGame.id,
                          {
                            bgMode: 'image',
                            bgSceneId,
                            bgImageUrl: raw,
                            bgBrightness,
                            bgBlur,
                          },
                          '✅ อัปโหลดและบันทึกภาพเคลื่อนไหว GIF แล้ว!'
                        );
                        return;
                      }
                      const img = new Image();
                      img.onload = () => {
                        const maxW = 1080;
                        const maxH = 1920;
                        const ratio = Math.min(1, maxW / img.width, maxH / img.height);
                        const cw = Math.round(img.width * ratio);
                        const ch = Math.round(img.height * ratio);
                        const c = document.createElement('canvas');
                        c.width = cw;
                        c.height = ch;
                        const ctx = c.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, cw, ch);
                          const compressed = c.toDataURL('image/jpeg', 0.85);
                          setBgImageUrl(compressed);
                          setBgMode('image');
                          saveBgConfig(
                            activeGame.id,
                            {
                              bgMode: 'image',
                              bgSceneId,
                              bgImageUrl: compressed,
                              bgBrightness,
                              bgBlur,
                            },
                            '✅ อัปโหลดและบันทึกภาพพื้นหลังแล้ว!'
                          );
                        }
                      };
                      img.src = raw;
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={bgUrlInput}
                  onChange={(e) => setBgUrlInput(e.target.value)}
                  placeholder="หรือวางลิงก์รูปภาพ (https://...)"
                  style={{ flex: 1, padding: 10, fontSize: 19, borderRadius: 10, border: '1px solid #444', background: '#070912', color: '#fff' }}
                />
                <button
                  onClick={() => {
                    const u = bgUrlInput.trim();
                    if (!u) return;
                    setBgImageUrl(u);
                    setBgMode('image');
                    saveBgConfig(
                      activeGame.id,
                      {
                        bgMode: 'image',
                        bgSceneId,
                        bgImageUrl: u,
                        bgBrightness,
                        bgBlur,
                      },
                      '✅ ใช้ลิงก์ภาพและบันทึกแล้ว!'
                    );
                  }}
                  style={{ padding: '10px 16px', borderRadius: 10, background: '#ff2d55', border: 'none', color: '#fff', fontSize: 19, fontWeight: 700, cursor: 'pointer' }}
                >
                  ใช้รูป
                </button>
              </div>

              <div style={{ fontSize: 19, marginBottom: 4 }}>ความสว่างพื้นหลัง: {bgBrightness}%</div>
              <input type="range" min={30} max={150} value={bgBrightness} onChange={(e) => setBgBrightness(Number(e.target.value))} style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ fontSize: 19, marginBottom: 4 }}>เบลอพื้นหลัง: {bgBlur}px</div>
              <input type="range" min={0} max={18} value={bgBlur} onChange={(e) => setBgBlur(Number(e.target.value))} style={{ width: '100%', marginBottom: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <button
                  onClick={() =>
                    saveBgConfig(activeGame.id, {
                      bgMode,
                      bgSceneId,
                      bgImageUrl,
                      bgBrightness,
                      bgBlur,
                    })
                  }
                  style={{ padding: '11px 10px', borderRadius: 10, background: '#059669', border: 'none', color: '#fff', fontSize: 19, fontWeight: 700, cursor: 'pointer' }}
                >
                  💾 บันทึกพื้นหลังนี้
                </button>
                <button
                  onClick={() => {
                    const def = GAME_TO_SCENE_MAP[activeGame.id] || 'co-2';
                    setBgMode('scene');
                    setBgSceneId(def);
                    setBgImageUrl('');
                    setBgUrlInput('');
                    setBgBrightness(95);
                    setBgBlur(0);
                    saveBgConfig(
                      activeGame.id,
                      { bgMode: 'scene', bgSceneId: def, bgImageUrl: '', bgBrightness: 95, bgBlur: 0 },
                      '🔄 รีเซ็ตพื้นหลังเป็นค่าเริ่มต้นแล้ว'
                    );
                  }}
                  style={{ padding: '11px 10px', borderRadius: 10, background: '#334155', border: 'none', color: '#fff', fontSize: 19, fontWeight: 700, cursor: 'pointer' }}
                >
                  🗑️ รีเซ็ตพื้นหลัง
                </button>
              </div>

              {bgStatusMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(6,214,160,0.16)', border: '1px solid #06d6a0', color: '#a7f3d0', fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 10 }}>
                  {bgStatusMsg}
                </div>
              )}

              <button
                onClick={() => {
                  const html = generateLiveGameHtml(activeGame, { bgMode, bgImageUrl, bgBrightness, bgBlur });
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${activeGame.id}-live.html`;
                  a.click();
                }}
                style={{ width: '100%', padding: '12px 10px', borderRadius: 10, background: 'linear-gradient(90deg, #f59e0b, #d97706)', border: 'none', color: '#fff', fontSize: 20, fontWeight: 800, cursor: 'pointer' }}
              >
                ⬇️ ดาวน์โหลดเป็นไฟล์ .html (1080×1920)
              </button>
            </div>
          </div>
        )}

        {/* ==================== GAME HUD TOP ==================== */}
        <div style={{ padding: cleanMode ? '48px 34px 0' : '102px 34px 0', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: activeGame.accent, textShadow: '0 4px 16px rgba(0,0,0,0.8)' }}>
              {activeGame.icon} {activeGame.title}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 24, fontWeight: 700 }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 18px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.22)' }}>
                👥 {crowd.length} ร่วมงาน
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 18px', borderRadius: 99, border: '1px solid rgba(255,45,85,0.5)' }}>
                ❤️ {likesTotal.toLocaleString()}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(255,209,102,0.5)' }}>
                🎁 {giftsTotal}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(6,214,160,0.5)' }}>
                🔗 {sharesTotal}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 20 }}>
            {activeGame.giftTiers.map((tier) => (
              <div key={tier.coins} style={{ background: 'rgba(8,10,24,0.75)', backdropFilter: 'blur(6px)', border: `2px solid ${activeGame.accent}66`, borderRadius: 18, padding: '12px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>💎 {tier.coins}</div>
                <div style={{ fontSize: 42, margin: '4px 0' }}>{tier.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{tier.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, position: 'relative', height: 42, background: 'rgba(0,0,0,0.65)', borderRadius: 99, overflow: 'hidden', border: `2px solid ${activeGame.accent}` }}>
            <div style={{ width: `${meterPct}%`, height: '100%', background: `linear-gradient(90deg, ${activeGame.secondary}, ${activeGame.accent})`, transition: 'width 0.25s ease' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, textShadow: '0 2px 6px #000' }}>
              {activeGame.meterLabel} ❤️ {meter} / {activeGame.meterTarget} — ครบแล้วฉลองพร้อมกัน!
            </div>
          </div>
        </div>

        {/* ==================== LEADERBOARD + VIP BANNER ==================== */}
        <div style={{ position: 'relative', zIndex: 15, padding: '20px 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ width: 310, background: 'rgba(8,10,20,0.78)', backdropFilter: 'blur(6px)', border: '2px solid rgba(255,209,102,0.45)', borderRadius: 20, padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: activeGame.accent, marginBottom: 8 }}>🏆 อันดับสายม่วน</div>
            {leaderboard.map((m, idx) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 21, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 195 }}>
                  {idx + 1}. {m.nickname}
                </span>
                <span style={{ color: activeGame.accent, fontWeight: 700 }}>{m.score}</span>
              </div>
            ))}
          </div>

          {vipBanner && (
            <div style={{ background: `linear-gradient(135deg, ${activeGame.secondary}, ${activeGame.accent})`, color: '#fff', padding: '18px 28px', borderRadius: 24, border: '3px solid #fff', boxShadow: '0 14px 40px rgba(0,0,0,0.7)', textAlign: 'center', maxWidth: 660 }}>
              <div style={{ fontSize: 34, fontWeight: 800 }}>{vipBanner.icon} {vipBanner.nickname}</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{vipBanner.action}</div>
            </div>
          )}
        </div>

        {/* ==================== 3D FLOATING CENTER STAGE ==================== */}
        <div style={{ position: 'relative', textAlign: 'center', marginTop: activeGame.id === 'rot-hae' ? -18 : 6, zIndex: 12, perspective: 900, padding: '0 24px' }}>
          {activeGame.id === 'rot-hae' ? (
            <RotHaeTruckArt
              vip1={leaderboard[0]?.nickname || 'mizumiso_0'}
              vip2={leaderboard[1]?.nickname || 'ออรอที่นี่ฯ'}
            />
          ) : (
            <div className="stage-hero-3d" style={{ fontSize: 175, lineHeight: 1.05, filter: `drop-shadow(0 18px 40px ${activeGame.accent})` }}>
              {activeGame.stageEmoji}
            </div>
          )}
          <div style={{ fontSize: 25, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.58)', display: 'inline-block', padding: '7px 24px', borderRadius: 99, marginTop: activeGame.id === 'rot-hae' ? -8 : 6, border: `1px solid ${activeGame.accent}55` }}>
            {activeGame.chatHint}
          </div>
        </div>

        {/* ==================== 3D PERSPECTIVE CROWD FLOOR ==================== */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '51%',
            bottom: 0,
            zIndex: 14,
            background: bgMode === 'image' ? 'linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.38) 100%)' : 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 100%)',
            borderTop: `4px solid ${activeGame.accent}`,
          }}
        >
          {/* 3D Perspective Floor Grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(${activeGame.accent}22 2px, transparent 2px), linear-gradient(90deg, ${activeGame.accent}22 2px, transparent 2px)`,
              backgroundSize: '90px 90px',
              transform: 'perspective(700px) rotateX(48deg) scale(1.4)',
              transformOrigin: 'top center',
              pointerEvents: 'none',
            }}
          />

          {crowd.map((m) => {
            const depthRatio = (m.y - 52) / 40; // 0 (back) .. 1 (front)
            const depthScale = 0.78 + depthRatio * 0.48;
            const isJumping = (m.jumpUntil || 0) > Date.now();
            return (
              <div
                key={m.id}
                className="crowd-dancer"
                style={{
                  position: 'absolute',
                  left: `${m.x}%`,
                  top: `${((m.y - 50) / 45) * 72}%`,
                  animationDelay: `${m.delay}s`,
                  zIndex: Math.round(m.y) + (m.vip ? 40 : 0),
                }}
              >
                <div
                  style={{
                    transform: `scale(${depthScale * (m.vip ? 1.15 : 1)}) translateY(${isJumping ? -26 : 0}px)`,
                    transition: 'transform 0.3s ease',
                    textAlign: 'center',
                  }}
                >
                  {m.bubble && (
                    <div style={{ background: '#fff', color: '#111', fontSize: 19, fontWeight: 700, padding: '4px 12px', borderRadius: 14, marginBottom: 4, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                      {m.bubble}
                    </div>
                  )}
                  <div
                    style={{
                      background: m.vip ? 'linear-gradient(90deg, #ff2d55, #ffd166)' : 'rgba(0,0,0,0.72)',
                      color: '#fff',
                      fontSize: 19,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 99,
                      border: m.vip ? '2px solid #fff' : '1px solid rgba(255,255,255,0.28)',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                    }}
                  >
                    {m.vip ? '👑 ' : ''}
                    {m.nickname}
                  </div>
                  <div style={{ fontSize: 64, lineHeight: 1, filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.75))' }}>
                    {m.emoji}
                  </div>
                  {/* Ground shadow */}
                  <div style={{ width: 46, height: 10, margin: '2px auto 0', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(3px)' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Celebration Firework Overlay */}
        {fireworkText && (
          <div style={{ position: 'absolute', inset: '420px 80px auto', zIndex: 80, background: 'linear-gradient(135deg, #ff2d55, #ff9f1c)', border: '6px solid #ffd166', borderRadius: 36, padding: '44px 36px', textAlign: 'center', fontSize: 44, fontWeight: 800, boxShadow: '0 30px 90px rgba(0,0,0,0.9)' }}>
            {fireworkText}
          </div>
        )}
      </div>
    </div>
  );
}
