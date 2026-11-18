'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  DEFAULT_STATE,
  KEYWORD_GROUPS,
  ParticleType,
  SCENES,
  SavedPreset,
  StudioState,
} from '@/data/backgrounds';
import { GAME_TEMPLATES, generateStandaloneGameHtml } from '@/data/gameTemplates';
import { createParticles, drawBackgroundScene, drawParticles, Particle, rgba } from '@/lib/canvasRenderer';

const STORAGE_KEY = 'tiktok_bg_studio_presets_v1';

type TabId = 'scenes' | 'customize' | 'overlay' | 'keywords' | 'games';

export default function StudioApp() {
  const [state, setState] = useState<StudioState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<TabId>('scenes');
  const [liveMode, setLiveMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(0.42);
  const [resOption, setResOption] = useState('1080x1920');

  const stageWrapRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const customImgRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const stateRef = useRef(state);
  const animTimeRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  stateRef.current = state;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedPresets(JSON.parse(raw));
    } catch {
      // ignore storage errors
    }
  }, []);

  const activeScene = useMemo(
    () => SCENES.find((s) => s.id === state.sceneId) || SCENES[0],
    [state.sceneId]
  );

  const filteredScenes = useMemo(
    () => (state.activeCat === 'all' ? SCENES : SCENES.filter((s) => s.cat === state.activeCat)),
    [state.activeCat]
  );

  const fitStage = useCallback(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const pad = liveMode ? 0 : 28;
    const toolbarOffset = liveMode ? 0 : 40;
    const availW = Math.max(100, rect.width - pad);
    const availH = Math.max(100, rect.height - pad - toolbarOffset);
    const scale = Math.min(availW / state.width, availH / state.height);
    setStageScale(scale);
  }, [liveMode, state.width, state.height]);

  useEffect(() => {
    fitStage();
    window.addEventListener('resize', fitStage);
    return () => window.removeEventListener('resize', fitStage);
  }, [fitStage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && liveMode) setLiveMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [liveMode]);

  useEffect(() => {
    particlesRef.current = createParticles(state.width, state.height, state.density);
  }, [state.width, state.height, state.density]);

  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const s = stateRef.current;
      animTimeRef.current += dt * s.speed;

      const bgCanvas = bgCanvasRef.current;
      const fxCanvas = fxCanvasRef.current;
      const scene = SCENES.find((item) => item.id === s.sceneId) || SCENES[0];

      if (bgCanvas && s.sourceMode === 'procedural') {
        const bCtx = bgCanvas.getContext('2d');
        if (bCtx) {
          drawBackgroundScene(bCtx, s.width, s.height, animTimeRef.current, {
            primary: s.primary,
            secondary: s.secondary,
            accent: s.accent,
            style: scene.style,
            pulse: s.pulse,
          });
        }
      }

      if (fxCanvas) {
        const fCtx = fxCanvas.getContext('2d');
        if (fCtx) {
          const pType: Exclude<ParticleType, 'auto'> = s.particle === 'auto' ? scene.particle : s.particle;
          drawParticles(fCtx, particlesRef.current, s.width, s.height, animTimeRef.current, dt, {
            type: pType,
            accent: s.accent,
            speed: s.speed,
            density: s.density,
          });
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const selectScene = (id: string) => {
    const scene = SCENES.find((s) => s.id === id);
    if (!scene) return;
    setState((prev) => ({
      ...prev,
      sceneId: id,
      sourceMode: 'procedural',
      primary: scene.primary,
      secondary: scene.secondary,
      accent: scene.accent,
    }));
  };

  const handleRandomScene = () => {
    if (!filteredScenes.length) return;
    const pick = filteredScenes[Math.floor(Math.random() * filteredScenes.length)];
    selectScene(pick.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setState((prev) => ({ ...prev, customImageUrl: result, sourceMode: 'image' }));
        showToast('อัปโหลดภาพพื้นหลังเรียบร้อย');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setState((prev) => ({ ...prev, customImageUrl: trimmed, sourceMode: 'image' }));
    showToast('นำเข้ารูปภาพจากลิงก์แล้ว');
  };

  const handleSavePreset = () => {
    const name = presetName.trim() || `ฉากของฉัน #${savedPresets.length + 1}`;
    const updated: SavedPreset[] = [{ presetName: name, data: { ...state } }, ...savedPresets];
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPresetName('');
    showToast(`บันทึกพรีเซ็ต "${name}" แล้ว`);
  };

  const handleDeletePreset = (idx: number) => {
    const updated = savedPresets.filter((_, i) => i !== idx);
    setSavedPresets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast('ลบพรีเซ็ตแล้ว');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tiktok-bg-${state.sceneId}.json`;
    a.click();
    showToast('ส่งออกไฟล์ตั้งค่า JSON แล้ว');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        setState((prev) => ({ ...prev, ...parsed }));
        showToast('นำเข้าการตั้งค่า JSON เรียบร้อย');
      } catch {
        showToast('ไฟล์ JSON ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadPng = () => {
    const out = document.createElement('canvas');
    out.width = state.width;
    out.height = state.height;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    ctx.filter = `brightness(${state.brightness}%) saturate(${state.saturate}%) blur(${state.blur}px)`;
    if (state.sourceMode === 'image' && customImgRef.current && customImgRef.current.complete && customImgRef.current.naturalWidth > 0) {
      ctx.drawImage(customImgRef.current, 0, 0, state.width, state.height);
    } else if (bgCanvasRef.current) {
      ctx.drawImage(bgCanvasRef.current, 0, 0);
    }
    ctx.filter = 'none';
    if (fxCanvasRef.current) {
      ctx.drawImage(fxCanvasRef.current, 0, 0);
    }
    const dimA = (state.dim / 100) * 0.88;
    if (dimA > 0) {
      ctx.fillStyle = `rgba(0,0,0,${dimA})`;
      ctx.fillRect(0, 0, state.width, state.height);
    }
    const link = document.createElement('a');
    link.download = `tiktok-bg-${state.sceneId}-${state.width}x${state.height}.png`;
    link.href = out.toDataURL('image/png');
    link.click();
    showToast(`ดาวน์โหลดภาพ ${state.width}×${state.height} PNG แล้ว`);
  };

  const filterStr = `brightness(${state.brightness}%) saturate(${state.saturate}%) blur(${state.blur}px)`;
  const vigAlpha = (state.vignette / 100) * 0.85;
  const dimAlpha = (state.dim / 100) * 0.88;

  return (
    <div className={`app-shell ${liveMode ? 'live-mode' : ''}`}>
      {/* ==================== SIDEBAR ==================== */}
      {!liveMode && (
        <aside className="sidebar">
          <div className="brand-header">
            <div className="brand-title">
              <div className="brand-badge">9:16</div>
              <div>
                <h1>TikTok LIVE Background Studio</h1>
                <p>52 ฉากพร้อมใช้ 8 หมวด • ปรับค่า &amp; ส่งออก 1080×1920</p>
              </div>
            </div>
            <div className="inline-row">
              <a
                href="/game"
                className="btn btn-sm btn-cyan"
                title="เปิดเกมไลฟ์ TikTok (ไหว้พระศาลเจ้าจีน / ปราบบอส / ชักเย่อ)"
              >
                🎮 เกมไลฟ์
              </a>
              <button
                onClick={() => setLiveMode(true)}
                className="btn btn-sm btn-primary"
                title="ซ่อนเมนูเพื่อใช้ไลฟ์หรือแคปจอ (กด ESC เพื่อออก)"
              >
                📺 โหมดไลฟ์
              </button>
            </div>
          </div>

          <nav className="nav-tabs" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {(
              [
                ['scenes', '🎨', 'เลือกฉาก'],
                ['customize', '🎛️', 'สี/แสง'],
                ['overlay', '📝', 'ข้อความ'],
                ['keywords', '🔍', 'หาภาพ'],
                ['games', '🎮', 'ก๊อปเกม'],
              ] as [TabId, string, string][]
            ).map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`nav-tab ${activeTab === id ? 'active' : ''}`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-content">
            {/* TAB 1: SCENES */}
            {activeTab === 'scenes' && (
              <div>
                <div className="category-pills">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setState((p) => ({ ...p, activeCat: c.id }))}
                      className={`cat-pill ${state.activeCat === c.id ? 'active' : ''}`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                <div className="section-label">
                  <span>ฉากพร้อมใช้ ({filteredScenes.length} แบบ)</span>
                  <button onClick={handleRandomScene} className="btn btn-sm">
                    🎲 สุ่มฉาก
                  </button>
                </div>

                <div className="scenes-grid">
                  {filteredScenes.map((s) => {
                    const cat = CATEGORIES.find((c) => c.id === s.cat);
                    const isActive = state.sceneId === s.id && state.sourceMode === 'procedural';
                    return (
                      <div
                        key={s.id}
                        onClick={() => selectScene(s.id)}
                        className={`scene-card ${isActive ? 'active' : ''}`}
                      >
                        <div
                          className="scene-thumb"
                          style={{
                            background: `linear-gradient(160deg, ${s.primary} 0%, ${s.secondary} 65%, ${s.accent} 140%)`,
                          }}
                        >
                          <div
                            className="scene-thumb-glow"
                            style={{
                              background: `radial-gradient(circle at 50% 40%, ${rgba(s.accent, 0.35)}, transparent 65%)`,
                            }}
                          />
                          <span className="scene-thumb-badge">
                            {cat ? `${cat.icon} ${cat.name}` : ''}
                          </span>
                        </div>
                        <div className="scene-meta">
                          <div className="scene-name">{s.name}</div>
                          <div className="scene-sub">{s.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOMIZE */}
            {activeTab === 'customize' && (
              <div>
                <div className="control-group">
                  <div className="control-group-title">
                    <span>🖼️ แหล่งภาพพื้นหลัง</span>
                  </div>
                  <div className="field-row">
                    <div className="two-col">
                      <button
                        onClick={() => setState((p) => ({ ...p, sourceMode: 'procedural' }))}
                        className="btn btn-sm"
                      >
                        ✨ ใช้ฉากอนิเมชัน
                      </button>
                      <label className="btn btn-sm btn-cyan">
                        📁 อัปโหลดรูป
                        <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
                      </label>
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>หรือวางลิงก์รูปภาพ (Image URL)</span>
                    </div>
                    <div className="inline-row">
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://..."
                      />
                      <button onClick={handleApplyUrl} className="btn btn-sm">
                        ใช้รูป
                      </button>
                    </div>
                  </div>
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>🎨 สีประจำฉาก (Custom Palette)</span>
                    <button
                      onClick={() =>
                        setState((p) => ({
                          ...p,
                          primary: activeScene.primary,
                          secondary: activeScene.secondary,
                          accent: activeScene.accent,
                        }))
                      }
                      className="btn btn-sm"
                    >
                      รีเซ็ตสี
                    </button>
                  </div>
                  <div className="color-row">
                    {(
                      [
                        ['primary', 'สีหลัก (บน)'],
                        ['secondary', 'สีรอง (ล่าง)'],
                        ['accent', 'สีแสง/เอฟเฟกต์'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="color-box">
                        <span>{label}</span>
                        <div className="color-picker-wrap">
                          <input
                            type="color"
                            value={state[key]}
                            onChange={(e) => setState((p) => ({ ...p, [key]: e.target.value }))}
                          />
                          <span className="hex-mini">{state[key].toUpperCase()}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>✨ แสง ฟิลเตอร์ และเอฟเฟกต์</span>
                  </div>
                  {(
                    [
                      ['brightness', 'ความสว่าง (Brightness)', 30, 170, '%'],
                      ['saturate', 'ความอิ่มสี (Saturation)', 0, 200, '%'],
                      ['blur', 'เบลอฉากหลัง (Blur)', 0, 25, ' px'],
                      ['dim', 'ฟิลเตอร์มืดทับ (Dim Overlay)', 0, 85, '%'],
                      ['vignette', 'ขอบมืด (Vignette)', 0, 100, '%'],
                    ] as const
                  ).map(([key, label, min, max, unit]) => (
                    <div key={key} className="field-row">
                      <div className="field-label">
                        <span>{label}</span>
                        <span className="field-val">
                          {state[key]}
                          {unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={state[key]}
                        onChange={(e) => setState((p) => ({ ...p, [key]: Number(e.target.value) }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>⚡ การเคลื่อนไหวและอนุภาค</span>
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>รูปแบบอนุภาคเสริม</span>
                    </div>
                    <select
                      value={state.particle}
                      onChange={(e) => setState((p) => ({ ...p, particle: e.target.value as ParticleType }))}
                    >
                      <option value="auto">อัตโนมัติตามหมวดหมู่</option>
                      <option value="lanterns">โคมลอย / ดวงไฟลอยขึ้น</option>
                      <option value="sparkles">ประกายทองระยิบระยับ</option>
                      <option value="laser">ลำแสงเวที / นีออน</option>
                      <option value="bass">คลื่นเบส / จังหวะดนตรี</option>
                      <option value="leaves">ใบไม้ / กลีบดอกไม้ปลิว</option>
                      <option value="bokeh">โบเก้ฟุ้งละมุน</option>
                      <option value="none">ปิดอนุภาค</option>
                    </select>
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>ความเร็วแอนิเมชัน</span>
                      <span className="field-val">{state.speed.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      value={Math.round(state.speed * 10)}
                      onChange={(e) => setState((p) => ({ ...p, speed: Number(e.target.value) / 10 }))}
                    />
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>ปริมาณอนุภาค</span>
                      <span className="field-val">{state.density}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={state.density}
                      onChange={(e) => setState((p) => ({ ...p, density: Number(e.target.value) }))}
                    />
                  </div>
                  <label className="toggle-row">
                    <span>จังหวะเต้นตามเบส (Beat Pulse)</span>
                    <input
                      type="checkbox"
                      checked={state.pulse}
                      onChange={(e) => setState((p) => ({ ...p, pulse: e.target.checked }))}
                      className="toggle-checkbox"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: OVERLAY & RESOLUTION & SAVE */}
            {activeTab === 'overlay' && (
              <div>
                <div className="control-group">
                  <div className="control-group-title">
                    <span>📝 ข้อความบนฉาก</span>
                    <input
                      type="checkbox"
                      checked={state.showText}
                      onChange={(e) => setState((p) => ({ ...p, showText: e.target.checked }))}
                      className="toggle-checkbox"
                    />
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>หัวข้อหลัก (Title)</span>
                    </div>
                    <input
                      type="text"
                      value={state.title}
                      onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="field-row">
                    <div className="field-label">
                      <span>ข้อความรอง (Subtitle / CTA)</span>
                    </div>
                    <input
                      type="text"
                      value={state.subtitle}
                      onChange={(e) => setState((p) => ({ ...p, subtitle: e.target.value }))}
                    />
                  </div>
                  <div className="two-col">
                    <div className="field-row">
                      <div className="field-label">
                        <span>ตำแหน่ง</span>
                      </div>
                      <select
                        value={state.textPos}
                        onChange={(e) => setState((p) => ({ ...p, textPos: e.target.value as StudioState['textPos'] }))}
                      >
                        <option value="top">ด้านบน (Top)</option>
                        <option value="center">ตรงกลาง (Center)</option>
                        <option value="bottom">ด้านล่าง (Bottom)</option>
                      </select>
                    </div>
                    <div className="field-row">
                      <div className="field-label">
                        <span>ขนาดอักษร</span>
                        <span className="field-val">{state.fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={28}
                        max={120}
                        value={state.fontSize}
                        onChange={(e) => setState((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>📐 ขนาดฉาก &amp; Safe Zone</span>
                  </div>
                  <div className="field-row">
                    <select
                      value={resOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResOption(val);
                        if (val !== 'custom') {
                          const [w, h] = val.split('x').map(Number);
                          setState((p) => ({ ...p, width: w, height: h }));
                        }
                      }}
                    >
                      <option value="1080x1920">TikTok LIVE 9:16 Full HD (1080 × 1920)</option>
                      <option value="720x1280">TikTok LIVE 9:16 HD (720 × 1280)</option>
                      <option value="1080x1080">สี่เหลี่ยมจัตุรัส 1:1 (1080 × 1080)</option>
                      <option value="1920x1080">แนวนอน 16:9 Full HD (1920 × 1080)</option>
                      <option value="custom">กำหนดขนาดเอง (Custom)</option>
                    </select>
                  </div>
                  {resOption === 'custom' && (
                    <div className="two-col field-row">
                      <div>
                        <div className="field-label">
                          <span>กว้าง (px)</span>
                        </div>
                        <input
                          type="number"
                          min={320}
                          max={3840}
                          value={state.width}
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              width: Math.max(320, Math.min(3840, Number(e.target.value) || 1080)),
                            }))
                          }
                        />
                      </div>
                      <div>
                        <div className="field-label">
                          <span>สูง (px)</span>
                        </div>
                        <input
                          type="number"
                          min={320}
                          max={3840}
                          value={state.height}
                          onChange={(e) =>
                            setState((p) => ({
                              ...p,
                              height: Math.max(320, Math.min(3840, Number(e.target.value) || 1920)),
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                  <label className="toggle-row">
                    <span>แสดงเส้น Safe Zone ของ TikTok LIVE</span>
                    <input
                      type="checkbox"
                      checked={state.safeZone}
                      onChange={(e) => setState((p) => ({ ...p, safeZone: e.target.checked }))}
                      className="toggle-checkbox"
                    />
                  </label>
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>💾 บันทึก &amp; ส่งออกการตั้งค่า</span>
                  </div>
                  <div className="inline-row field-row">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="ตั้งชื่อพรีเซ็ตของคุณ..."
                    />
                    <button onClick={handleSavePreset} className="btn btn-primary">
                      บันทึก
                    </button>
                  </div>
                  <div className="field-row">
                    {savedPresets.length === 0 ? (
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        ยังไม่มีพรีเซ็ตที่บันทึกไว้
                      </div>
                    ) : (
                      savedPresets.map((item, idx) => (
                        <div key={idx} className="saved-item">
                          <div className="saved-item-info">
                            <div className="saved-item-name">{item.presetName}</div>
                            <div className="saved-item-meta">
                              {item.data.width}×{item.data.height}
                            </div>
                          </div>
                          <div className="inline-row">
                            <button
                              onClick={() => {
                                setState(item.data);
                                showToast(`โหลดพรีเซ็ต "${item.presetName}" แล้ว`);
                              }}
                              className="btn btn-sm btn-cyan"
                            >
                              ใช้
                            </button>
                            <button onClick={() => handleDeletePreset(idx)} className="btn btn-sm">
                              ลบ
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="two-col">
                    <button onClick={handleExportJson} className="btn btn-sm">
                      📤 Export JSON
                    </button>
                    <label className="btn btn-sm">
                      📥 Import JSON
                      <input type="file" accept=".json" onChange={handleImportJson} hidden />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KEYWORDS */}
            {activeTab === 'keywords' && (
              <div>
                <div className="kw-info">
                  💡 กด <strong>คัดลอก</strong> หรือกดลิงก์ <strong>Pixabay / Pexels</strong> เพื่อค้นหาภาพลิขสิทธิ์ฟรี (CC0) แล้วนำมาอัปโหลดหรือวางลิงก์ในแท็บ <strong>ตั้งค่าสี/แสง</strong> ได้ทันที
                </div>
                {KEYWORD_GROUPS.map((g) => (
                  <div key={g.title} className="kw-card">
                    <div className="kw-title">{g.title}</div>
                    <div className="kw-list">
                      {g.keywords.map((kw) => {
                        const q = encodeURIComponent(kw);
                        return (
                          <div key={kw} className="kw-item">
                            <span className="kw-text" title={kw}>
                              {kw}
                            </span>
                            <div className="kw-actions">
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(kw);
                                  showToast(`คัดลอก: "${kw}"`);
                                }}
                                className="btn btn-sm"
                                style={{ padding: '3px 6px', fontSize: '10.5px' }}
                              >
                                คัดลอก
                              </button>
                              <a
                                href={`https://pixabay.com/images/search/${q}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="kw-link"
                              >
                                Pixabay
                              </a>
                              <a
                                href={`https://www.pexels.com/search/${q}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="kw-link"
                              >
                                Pexels
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: READY-TO-COPY LIVE GAMES */}
            {activeTab === 'games' && (
              <div>
                <div className="kw-info">
                  🎮 เลือกเกมไลฟ์ TikTok ด้านล่างแล้วกด <strong>คัดลอกโค้ด HTML</strong> หรือ <strong>ดาวน์โหลด .html</strong> ไปเปิดใน OBS / TikTok LIVE Studio ได้ทันที (รองรับ <code>ws://localhost:8787</code> และ <code>?clean=1</code>)
                </div>

                <div className="control-group">
                  <div className="control-group-title">
                    <span>⚡ คำสั่งรันตัวเชื่อมไลฟ์ (bridge.mjs)</span>
                  </div>
                  <div className="kw-item" style={{ marginBottom: 6 }}>
                    <span className="kw-text">npm i tiktok-live-connector ws</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('npm i tiktok-live-connector ws');
                        showToast('คัดลอกคำสั่งติดตั้งแล้ว');
                      }}
                      className="btn btn-sm"
                    >
                      คัดลอก
                    </button>
                  </div>
                  <div className="kw-item">
                    <span className="kw-text">node bridge.mjs ชื่อบัญชีTikTok</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('node bridge.mjs ชื่อบัญชีTikTok');
                        showToast('คัดลอกคำสั่งรัน bridge.mjs แล้ว');
                      }}
                      className="btn btn-sm"
                    >
                      คัดลอก
                    </button>
                  </div>
                </div>

                {GAME_TEMPLATES.map((tpl) => (
                  <div key={tpl.id} className="kw-card">
                    <div className="kw-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{tpl.icon}</span>
                      <span>{tpl.name}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {tpl.desc}
                    </div>
                    <ul style={{ paddingLeft: 18, fontSize: '11px', color: '#dbe6ff', marginBottom: 10 }}>
                      {tpl.rules.map((r, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          {r}
                        </li>
                      ))}
                    </ul>
                    <div className="two-col">
                      <button
                        onClick={() => {
                          const html = generateStandaloneGameHtml(tpl);
                          navigator.clipboard?.writeText(html);
                          showToast(`คัดลอกโค้ด ${tpl.filename} แล้ว!`);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        📋 คัดลอกโค้ด HTML
                      </button>
                      <button
                        onClick={() => {
                          const html = generateStandaloneGameHtml(tpl);
                          const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = tpl.filename;
                          a.click();
                          showToast(`ดาวน์โหลด ${tpl.filename} แล้ว!`);
                        }}
                        className="btn btn-sm btn-cyan"
                      >
                        ⬇️ ดาวน์โหลด .html
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ==================== STAGE PREVIEW ==================== */}
      <main className="stage-area">
        <div className="stage-toolbar">
          <div className="toolbar-pill">
            <span style={{ fontWeight: 600 }}>
              {state.sourceMode === 'image' ? 'ภาพพื้นหลังกำหนดเอง' : activeScene.name}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>
              {state.width}×{state.height}
            </span>
          </div>
          <div className="inline-row">
            <button onClick={handleDownloadPng} className="btn btn-sm btn-cyan">
              📸 ดาวน์โหลดภาพ PNG
            </button>
            {liveMode && (
              <button onClick={() => setLiveMode(false)} className="btn btn-sm">
                ✕ ออกจากโหมดไลฟ์ (ESC)
              </button>
            )}
          </div>
        </div>

        <div ref={stageWrapRef} className="stage-frame-wrap">
          <div
            className="stage-viewport"
            style={{
              width: state.width,
              height: state.height,
              transform: `scale(${stageScale})`,
            }}
          >
            <canvas
              ref={bgCanvasRef}
              width={state.width}
              height={state.height}
              className="stage-canvas"
              style={{
                display: state.sourceMode === 'procedural' ? 'block' : 'none',
                filter: filterStr,
              }}
            />
            {state.sourceMode === 'image' && state.customImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={customImgRef}
                src={state.customImageUrl}
                alt="Custom Background"
                crossOrigin="anonymous"
                className="stage-img"
                style={{ filter: filterStr }}
              />
            )}
            <canvas ref={fxCanvasRef} width={state.width} height={state.height} className="stage-fx" />
            <div
              className="stage-vignette"
              style={{
                background: `linear-gradient(rgba(0,0,0,${dimAlpha}), rgba(0,0,0,${dimAlpha})), radial-gradient(circle at center, transparent 42%, rgba(0,0,0,${vigAlpha}) 100%)`,
              }}
            />

            {state.showText && (
              <div className={`stage-text-overlay pos-${state.textPos}`}>
                <div className="overlay-title" style={{ fontSize: state.fontSize }}>
                  {state.title}
                </div>
                <div className="overlay-sub" style={{ fontSize: Math.max(20, Math.round(state.fontSize * 0.44)) }}>
                  {state.subtitle}
                </div>
              </div>
            )}

            {state.safeZone && (
              <div className="safe-zone-guide">
                <div className="sz-top">พื้นที่โปรไฟล์โฮสต์ / ผู้ชม (Top Safe Zone)</div>
                <div className="sz-right">ปุ่มแชร์ / ของขวัญ</div>
                <div className="sz-bottom">พื้นที่คอมเมนต์แชท &amp; ปุ่มส่งของขวัญ TikTok LIVE</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
