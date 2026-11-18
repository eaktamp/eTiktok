'use client';

import React from 'react';

interface RotHaeTruckArtProps {
  vip1?: string;
  vip2?: string;
  compact?: boolean;
}

export default function RotHaeTruckArt({ vip1 = 'mizumiso_0', vip2 = 'ออรอที่นี่ฯ', compact = false }: RotHaeTruckArtProps) {
  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* Top 2 VIP Singers on Stage */}
      {!compact && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 36,
            marginBottom: -38,
            paddingLeft: 170,
            position: 'relative',
            zIndex: 5,
          }}
        >
          {[
            { name: vip1, emoji: '🎤💃', grad: 'linear-gradient(90deg, #ff2d55, #ff9f1c)' },
            { name: vip2, emoji: '🎤🕺', grad: 'linear-gradient(90deg, #7c3aed, #00f2ea)' },
          ].map((vip, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: vip.grad,
                  border: '2px solid #fff',
                  borderRadius: 99,
                  padding: '4px 16px',
                  fontSize: 21,
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.65)',
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                🎤 {vip.name}
              </div>
              <div className="crowd-dancer" style={{ fontSize: 66, lineHeight: 1, animationDelay: `${idx * 0.4}s` }}>
                {vip.emoji}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Thai รถแห่ Sound Truck SVG */}
      <svg viewBox="0 0 960 360" style={{ width: '100%', height: 'auto', display: 'block', filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.75))' }}>
        <defs>
          <linearGradient id="cabGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4da6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffd166" />
            <stop offset="50%" stopColor="#fff3b0" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="stageBanner" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#111827" />
            <stop offset="50%" stopColor="#311042" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <radialGradient id="subGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f2ea" />
            <stop offset="65%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#090d1f" />
          </radialGradient>
        </defs>

        {/* Lighting Truss Frame */}
        <rect x="275" y="18" width="635" height="16" rx="4" fill="none" stroke="#94a3b8" strokeWidth="4" />
        <line x1="285" y1="18" x2="285" y2="120" stroke="#64748b" strokeWidth="8" />
        <line x1="900" y1="18" x2="900" y2="120" stroke="#64748b" strokeWidth="8" />

        {/* Thai Golden Crown Ornament on Truss */}
        <path d="M540 20 L590 -2 L640 20 Z" fill="url(#goldTrim)" />
        {[320, 410, 500, 680, 770, 860].map((lx, i) => (
          <circle key={i} cx={lx} cy="26" r="8" fill={i % 2 === 0 ? '#ffd166' : '#00f2ea'} />
        ))}

        {/* Rear Sound System Stage Platform */}
        <rect x="265" y="110" width="660" height="190" rx="12" fill="#0b0f1f" stroke="url(#goldTrim)" strokeWidth="5" />

        {/* Left & Right Giant Speaker Stacks */}
        {[285, 355, 775, 845].map((sx, idx) => (
          <g key={idx}>
            <rect x={sx} y="122" width="62" height="150" rx="6" fill="#090d1a" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx={sx + 31} cy="156" r="21" fill="url(#subGlow)" stroke="#e0f2fe" strokeWidth="2" />
            <circle cx={sx + 31} cy="156" r="8" fill="#020617" />
            <circle cx={sx + 31} cy="212" r="21" fill="url(#subGlow)" stroke="#e0f2fe" strokeWidth="2" />
            <circle cx={sx + 31} cy="212" r="8" fill="#020617" />
            <rect x={sx + 10} y="244" width="42" height="16" rx="3" fill="#ff2d55" opacity="0.85" />
          </g>
        ))}

        {/* Center LED Screen & Subwoofers */}
        <rect x="430" y="124" width="330" height="96" rx="8" fill="#1e1b4b" stroke="#ff2d55" strokeWidth="3" />
        <text x="595" y="168" textAnchor="middle" fill="#ffd166" fontSize="28" fontWeight="800">
          🔥 รถแห่ซิ่งออนทัวร์ 🔥
        </text>
        <text x="595" y="200" textAnchor="middle" fill="#00f2ea" fontSize="18" fontWeight="700">
          กดใจ + ส่งของขวัญ ขึ้นเวทีได้เลย!
        </text>

        {/* Bottom Stage Banner */}
        <rect x="275" y="242" width="640" height="48" rx="6" fill="url(#stageBanner)" stroke="url(#goldTrim)" strokeWidth="2.5" />
        <text x="595" y="274" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">
          ⚡ ม่วนจอยหน้าฮ้าน • TIKTOK LIVE SOUND SYSTEM ⚡
        </text>

        {/* Truck Cab (Left) */}
        <path d="M55 295 L55 185 Q55 140 105 135 L245 135 L260 295 Z" fill="url(#cabGrad)" stroke="url(#goldTrim)" strokeWidth="5" />
        {/* Windshield */}
        <path d="M85 152 L225 152 L232 205 L72 205 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
        {/* Roof LED Lightbar */}
        {[95, 120, 145, 170, 195, 220].map((cx, i) => (
          <circle key={i} cx={cx} cy="126" r="7" fill={i % 2 === 0 ? '#ffd166' : '#ff2d55'} />
        ))}
        {/* Headlights */}
        <rect x="60" y="242" width="28" height="18" rx="4" fill="#fef08a" />
        <rect x="210" y="242" width="28" height="18" rx="4" fill="#fef08a" />
        {/* Chrome Grille */}
        <rect x="98" y="238" width="102" height="30" rx="5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.5" />
        {/* Thai Gold Kanok Flame on Side */}
        <path d="M235 160 Q268 180 250 230 Q272 260 245 290" fill="none" stroke="url(#goldTrim)" strokeWidth="6" strokeLinecap="round" />

        {/* Wheels */}
        {[135, 340, 790, 865].map((wx, i) => (
          <g key={i}>
            <circle cx={wx} cy="306" r="34" fill="#09090b" stroke="#475569" strokeWidth="5" />
            <circle cx={wx} cy="306" r="16" fill="#cbd5e1" />
            <circle cx={wx} cy="306" r="6" fill="#0f172a" />
          </g>
        ))}
      </svg>
    </div>
  );
}
