import { ParticleType, SceneStyle } from '@/data/backgrounds';

export interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  phase: number;
  alpha: number;
}

export function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = parseInt(full, 16) || 0;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgba(hex: string, a: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function createParticles(width: number, height: number, density: number): Particle[] {
  const count = Math.round((density / 100) * 85);
  const arr: Particle[] = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 4 + Math.random() * 18,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.4 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.25 + Math.random() * 0.65,
    });
  }
  return arr;
}

function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, maxYRatio = 0.55) {
  for (let i = 0; i < 65; i++) {
    const sx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * w;
    const sy = ((Math.sin(i * 78.233) * 19341.123) % 1 + 1) % 1 * (h * maxYRatio);
    const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.6 + i * 0.9));
    const r = (i % 5 === 0 ? 2.4 : 1.3);
    ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.85})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBackgroundScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  opts: {
    primary: string;
    secondary: string;
    accent: string;
    style: SceneStyle;
    pulse: boolean;
  }
) {
  const { primary, secondary, accent, style, pulse } = opts;
  const pulseFactor = pulse ? 1 + Math.sin(t * 7.5) * 0.05 : 1;

  // Deep atmospheric sky/base gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, primary);
  grad.addColorStop(0.55, secondary);
  grad.addColorStop(1, '#04060d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Volumetric center glow
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.34, 12, w * 0.5, h * 0.34, w * 0.85 * pulseFactor);
  glow.addColorStop(0, rgba(accent, 0.38));
  glow.addColorStop(0.45, rgba(accent, 0.12));
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (style === 'krathong') {
    drawStarfield(ctx, w, h, t, 0.52);

    // Realistic glowing full moon with soft atmospheric halo
    const mx = w * 0.72;
    const my = h * 0.19;
    const moonHalo = ctx.createRadialGradient(mx, my, w * 0.05, mx, my, w * 0.35);
    moonHalo.addColorStop(0, rgba('#fff6cc', 0.45));
    moonHalo.addColorStop(0.4, rgba(accent, 0.18));
    moonHalo.addColorStop(1, 'transparent');
    ctx.fillStyle = moonHalo;
    ctx.fillRect(0, 0, w, h * 0.55);

    ctx.save();
    ctx.fillStyle = '#fff8dc';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 55;
    ctx.beginPath();
    ctx.arc(mx, my, w * 0.085, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Distant mountain & temple silhouette along horizon
    const horizonY = h * 0.52;
    ctx.fillStyle = rgba('#050814', 0.78);
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.quadraticCurveTo(w * 0.18, horizonY - 75, w * 0.38, horizonY - 25);
    ctx.quadraticCurveTo(w * 0.62, horizonY - 90, w * 0.85, horizonY - 30);
    ctx.lineTo(w, horizonY - 55);
    ctx.lineTo(w, horizonY + 20);
    ctx.lineTo(0, horizonY + 20);
    ctx.closePath();
    ctx.fill();

    // Riverside Wat silhouette on left bank
    ctx.fillStyle = rgba('#03050d', 0.92);
    ctx.beginPath();
    ctx.moveTo(w * 0.04, horizonY + 5);
    ctx.lineTo(w * 0.04, horizonY - 35);
    ctx.lineTo(w * 0.1, horizonY - 70);
    ctx.lineTo(w * 0.12, horizonY - 125); // spire
    ctx.lineTo(w * 0.14, horizonY - 70);
    ctx.lineTo(w * 0.2, horizonY - 35);
    ctx.lineTo(w * 0.2, horizonY + 5);
    ctx.closePath();
    ctx.fill();

    // Realistic River with moonlight reflection column
    const wGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    wGrad.addColorStop(0, rgba(secondary, 0.92));
    wGrad.addColorStop(0.5, rgba(primary, 0.95));
    wGrad.addColorStop(1, '#020510');
    ctx.fillStyle = wGrad;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Moon reflection shimmer on water
    for (let i = 0; i < 28; i++) {
      const ry = horizonY + 14 + i * ((h - horizonY) / 28);
      const spread = 24 + i * 6.5;
      const rx = mx + Math.sin(t * 1.8 + i * 0.7) * (10 + i * 0.8);
      ctx.strokeStyle = rgba('#ffe9a3', Math.max(0.05, 0.42 - i * 0.012));
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rx - spread, ry);
      ctx.lineTo(rx + spread, ry);
      ctx.stroke();
    }

    // Floating animated Krathongs with glowing candles on the river
    for (let k = 0; k < 5; k++) {
      const progress = ((t * 0.045 + k * 0.21) % 1);
      const kx = w * (0.15 + k * 0.17) + Math.sin(t * 0.9 + k) * 28;
      const ky = horizonY + 60 + progress * (h - horizonY - 140);
      const scale = 0.55 + progress * 0.85;
      ctx.save();
      ctx.translate(kx, ky);
      ctx.scale(scale, scale);

      // Water glow underneath krathong
      const kGlow = ctx.createRadialGradient(0, 6, 4, 0, 6, 70);
      kGlow.addColorStop(0, rgba(accent, 0.45));
      kGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = kGlow;
      ctx.beginPath();
      ctx.arc(0, 6, 70, 0, Math.PI * 2);
      ctx.fill();

      // Lotus base
      ctx.fillStyle = '#2d6a4f';
      ctx.beginPath();
      ctx.ellipse(0, 10, 38, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8fab';
      ctx.beginPath();
      ctx.ellipse(0, 4, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Candle & flickering flame
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-3, -18, 6, 20);
      const flicker = 1 + Math.sin(t * 14 + k * 3) * 0.18;
      ctx.fillStyle = '#fff3b0';
      ctx.shadowColor = '#ff9e00';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(0, -24, 5 * flicker, 11 * flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (style === 'temple') {
    // Golden volumetric sun/dharma rays
    ctx.save();
    ctx.translate(w * 0.5, h * 0.42);
    for (let i = 0; i < 20; i++) {
      ctx.rotate((Math.PI * 2) / 20 + t * 0.0025);
      const rayGrad = ctx.createLinearGradient(0, 0, 0, -h * 0.65);
      rayGrad.addColorStop(0, rgba(accent, 0.16));
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-32, -h * 0.65);
      ctx.lineTo(32, -h * 0.65);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Central glowing aura behind Chedi / Buddha silhouette
    const aura = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.42);
    aura.addColorStop(0, rgba(accent, 0.52));
    aura.addColorStop(0.5, rgba(accent, 0.14));
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);

    // Layered Thai Wat / Chedi silhouette
    ctx.fillStyle = rgba('#0b0502', 0.85);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.77);
    ctx.lineTo(w * 0.14, h * 0.77);
    ctx.lineTo(w * 0.24, h * 0.67);
    ctx.lineTo(w * 0.34, h * 0.72);
    ctx.lineTo(w * 0.43, h * 0.56);
    ctx.lineTo(w * 0.48, h * 0.42);
    ctx.lineTo(w * 0.5, h * 0.30); // Chedi spire
    ctx.lineTo(w * 0.52, h * 0.42);
    ctx.lineTo(w * 0.57, h * 0.56);
    ctx.lineTo(w * 0.66, h * 0.72);
    ctx.lineTo(w * 0.76, h * 0.67);
    ctx.lineTo(w * 0.86, h * 0.77);
    ctx.lineTo(w, h * 0.77);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Warm temple lantern/candle glow along the base
    for (let i = 1; i <= 5; i++) {
      const lx = (w / 6) * i;
      const ly = h * 0.78;
      const cGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 45);
      cGlow.addColorStop(0, rgba('#ffe8a3', 0.7));
      cGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = cGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 45, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'culture') {
    // Rotating Thai Mandala / Kanok-inspired sacred geometry
    ctx.save();
    ctx.translate(w * 0.5, h * 0.44);
    ctx.rotate(t * 0.08);
    ctx.strokeStyle = rgba(accent, 0.24);
    ctx.lineWidth = 3;
    for (let ring = 1; ring <= 4; ring++) {
      const rad = w * 0.11 * ring;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.stroke();
      for (let p = 0; p < 12; p++) {
        const ang = (p / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * rad, Math.sin(ang) * rad, 18, 8, ang, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Festive temple fair string lights draped across top
    for (let row = 0; row < 2; row++) {
      ctx.strokeStyle = rgba('#ffffff', 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) {
        const y = 70 + row * 65 + Math.sin((x / w) * Math.PI) * 85;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let i = 0; i <= 14; i++) {
        const lx = (w / 14) * i;
        const ly = 70 + row * 65 + Math.sin((lx / w) * Math.PI) * 85;
        const colors = [accent, '#ff4d6d', '#00f5d4', '#ffd166'];
        const col = colors[(i + row) % colors.length];
        ctx.save();
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(lx, ly, 7 + Math.sin(t * 4 + i) * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (style === 'concert') {
    // Stage truss frame at top
    ctx.strokeStyle = rgba('#ffffff', 0.14);
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.06, 40, w * 0.88, 55);

    // Sweeping volumetric spotlights with haze
    for (let i = 0; i < 6; i++) {
      const sx = w * (0.1 + i * 0.16);
      const angle = Math.sin(t * 1.2 + i * 1.1) * 0.42;
      ctx.save();
      ctx.translate(sx, 85);
      ctx.rotate(angle);
      const beam = ctx.createLinearGradient(0, 0, 0, h * 0.88);
      beam.addColorStop(0, rgba(accent, 0.42));
      beam.addColorStop(0.6, rgba(accent, 0.08));
      beam.addColorStop(1, 'transparent');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-190, h * 0.9);
      ctx.lineTo(190, h * 0.9);
      ctx.lineTo(14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Equalizer backdrop & crowd silhouette at bottom
    const bars = 28;
    const bw = w / bars;
    for (let i = 0; i < bars; i++) {
      const bh = 55 + Math.abs(Math.sin(t * 6 + i * 0.55)) * 210;
      const bGrad = ctx.createLinearGradient(0, h - bh, 0, h);
      bGrad.addColorStop(0, rgba(accent, 0.55));
      bGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bGrad;
      ctx.fillRect(i * bw + 4, h - bh, bw - 8, bh);
    }

    // Crowd silhouettes
    ctx.fillStyle = '#05050a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 28) {
      const jump = Math.abs(Math.sin(t * 5 + x * 0.04)) * 22;
      ctx.lineTo(x, h - 75 - jump);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'caraudio') {
    // Carbon/metallic trunk panel grid
    ctx.strokeStyle = rgba(accent, 0.08);
    ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 90) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Realistic 3D-shaded twin subwoofers
    const subY = h * 0.62;
    const beat = Math.abs(Math.sin(t * 7)) * 18;
    [w * 0.29, w * 0.71].forEach((cx) => {
      // Outer neon shockwave rings
      for (let ring = 3; ring >= 1; ring--) {
        ctx.strokeStyle = rgba(accent, 0.2 * (4 - ring));
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, subY, ring * 68 + beat * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Speaker surround & cone
      const coneGrad = ctx.createRadialGradient(cx - 25, subY - 25, 10, cx, subY, 155);
      coneGrad.addColorStop(0, '#2b303a');
      coneGrad.addColorStop(0.55, '#11141a');
      coneGrad.addColorStop(0.88, '#050608');
      coneGrad.addColorStop(1, accent);
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.arc(cx, subY, 155 + beat * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Metallic dust cap
      const capGrad = ctx.createRadialGradient(cx - 12, subY - 12, 5, cx, subY, 55);
      capGrad.addColorStop(0, '#4f5666');
      capGrad.addColorStop(1, '#090b10');
      ctx.fillStyle = capGrad;
      ctx.beginPath();
      ctx.arc(cx, subY, 55 + beat * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(accent, 0.8);
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    // Bottom mirrored spectrum bars
    const bars = 26;
    const bw = w / bars;
    for (let i = 0; i < bars; i++) {
      const bh = 35 + Math.abs(Math.sin(t * 6.5 + i * 0.5)) * 165;
      ctx.fillStyle = rgba(accent, 0.45);
      ctx.fillRect(i * bw + 4, h - bh, bw - 8, bh);
    }
  } else if (style === 'nature') {
    drawStarfield(ctx, w, h, t, 0.45);

    // Warm sun/moon glow behind mountains
    const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.44, 20, w * 0.5, h * 0.44, w * 0.45);
    sunGrad.addColorStop(0, rgba(accent, 0.65));
    sunGrad.addColorStop(0.4, rgba(accent, 0.18));
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // 4 atmospheric layered mountain ridges with mist
    const layers = [
      { y: 0.48, amp: 85, alpha: 0.38 },
      { y: 0.58, amp: 70, alpha: 0.55 },
      { y: 0.69, amp: 55, alpha: 0.75 },
      { y: 0.82, amp: 40, alpha: 0.92 },
    ];
    layers.forEach((ly, idx) => {
      ctx.fillStyle = rgba(idx % 2 === 0 ? secondary : primary, ly.alpha);
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 30) {
        const y = h * ly.y + Math.sin(x * 0.0055 + idx * 2.1) * ly.amp + Math.cos(x * 0.013 + idx) * 24;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Soft mist band between mountain layers
      const mist = ctx.createLinearGradient(0, h * ly.y - 40, 0, h * ly.y + 80);
      mist.addColorStop(0, 'transparent');
      mist.addColorStop(0.5, rgba('#ffffff', 0.07));
      mist.addColorStop(1, 'transparent');
      ctx.fillStyle = mist;
      ctx.fillRect(0, h * ly.y - 40, w, 120);
    });
  } else if (style === 'school') {
    // Classroom window frames & warm diagonal sunbeams
    for (let i = 0; i < 3; i++) {
      const wx = w * (0.08 + i * 0.3);
      ctx.fillStyle = rgba(accent, 0.14);
      ctx.fillRect(wx, h * 0.12, w * 0.22, h * 0.34);
      ctx.strokeStyle = rgba('#ffffff', 0.18);
      ctx.lineWidth = 4;
      ctx.strokeRect(wx, h * 0.12, w * 0.22, h * 0.34);

      // Sunbeam pouring from window
      const beam = ctx.createLinearGradient(wx, h * 0.12, wx + 220, h * 0.85);
      beam.addColorStop(0, rgba(accent, 0.16));
      beam.addColorStop(1, 'transparent');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(wx, h * 0.46);
      ctx.lineTo(wx + w * 0.22, h * 0.46);
      ctx.lineTo(wx + w * 0.45, h);
      ctx.lineTo(wx + w * 0.12, h);
      ctx.closePath();
      ctx.fill();
    }

    // Chalkboard / wall ledge at bottom
    ctx.fillStyle = rgba('#0b1410', 0.6);
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
  } else if (style === 'hospital') {
    // Modern hospital corridor perspective lines & ceiling lights
    const vpX = w * 0.5;
    const vpY = h * 0.42;
    ctx.strokeStyle = rgba(accent, 0.12);
    ctx.lineWidth = 2;
    [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
      [0, h * 0.28],
      [w, h * 0.28],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Recessed ceiling light panels
    for (let i = 1; i <= 4; i++) {
      const ratio = i / 5;
      const ly = vpY - ratio * vpY * 0.85;
      const lw = 60 + ratio * 240;
      ctx.fillStyle = rgba('#ffffff', 0.12 + ratio * 0.15);
      ctx.fillRect(vpX - lw / 2, ly, lw, 10 + ratio * 14);
    }

    // Smooth animated ECG Heartbeat line
    ctx.save();
    ctx.strokeStyle = rgba(accent, 0.55);
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const phase = ((x + t * 200) % 340) / 340;
      let dy = 0;
      if (phase > 0.42 && phase < 0.45) dy = -68;
      else if (phase >= 0.45 && phase < 0.49) dy = 42;
      else if (phase >= 0.49 && phase < 0.53) dy = -22;
      const y = h * 0.52 + dy;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  t: number,
  dt: number,
  opts: {
    type: Exclude<ParticleType, 'auto'>;
    accent: string;
    speed: number;
    density: number;
  }
) {
  ctx.clearRect(0, 0, w, h);
  const { type, accent, speed, density } = opts;
  if (type === 'none' || density === 0) return;

  for (const p of particles) {
    if (type === 'lanterns') {
      p.y -= p.vy * 60 * dt * speed;
      p.x += Math.sin(t + p.phase) * 0.6 * speed;
      if (p.y < -40) {
        p.y = h + 40;
        p.x = Math.random() * w;
      }
      ctx.save();
      ctx.fillStyle = rgba(accent, p.alpha);
      ctx.shadowColor = accent;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.roundRect(p.x - p.size * 0.45, p.y - p.size * 0.65, p.size * 0.9, p.size * 1.3, 4);
      ctx.fill();
      // Inner flame core
      ctx.fillStyle = rgba('#fff6cc', p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y + p.size * 0.25, p.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (type === 'sparkles' || type === 'bokeh') {
      p.y -= p.vy * 25 * dt * speed;
      p.x += Math.sin(t * 0.8 + p.phase) * 0.4 * speed;
      if (p.y < -30) {
        p.y = h + 30;
        p.x = Math.random() * w;
      }
      const r = type === 'bokeh' ? p.size * 1.9 : p.size * 0.35;
      const a = type === 'bokeh' ? p.alpha * 0.25 : p.alpha * (0.5 + 0.5 * Math.sin(t * 3 + p.phase));
      ctx.fillStyle = rgba(accent, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'leaves') {
      p.y += p.vy * 45 * dt * speed;
      p.x += Math.sin(t * 1.5 + p.phase) * 1.2 * speed;
      if (p.y > h + 30) {
        p.y = -30;
        p.x = Math.random() * w;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(t + p.phase);
      ctx.fillStyle = rgba(accent, p.alpha * 0.75);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (type === 'bass') {
      p.y -= p.vy * 35 * dt * speed;
      if (p.y < -30) {
        p.y = h + 30;
        p.x = Math.random() * w;
      }
      const pulse = 1 + Math.abs(Math.sin(t * 6 + p.phase)) * 0.6;
      ctx.strokeStyle = rgba(accent, p.alpha * 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'laser') {
      p.y += p.vy * 70 * dt * speed;
      if (p.y > h + 60) {
        p.y = -60;
        p.x = Math.random() * w;
      }
      ctx.strokeStyle = rgba(accent, p.alpha * 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 30, p.y + p.size * 3);
      ctx.stroke();
    }
  }
}
