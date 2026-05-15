// ─── PlayerGrades.tsx ─────────────────────────────────────────────────────────
// Système de niveaux + carte style FIFA + modale plein écran avec swipe
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';

export type Grade = {
  name: string;
  lvLabel: string;
  min: number;
  max?: number;
  color: string;
  glow: boolean;
};

export const GRADES: Grade[] = [
  { name: 'Rookie',       lvLabel: 'Lv 1',  min: 0,   color: '#9ca3af', glow: false },
  { name: 'Bronze',       lvLabel: 'Lv 2',  min: 5,   color: '#cd7f32', glow: false },
  { name: 'Argent',       lvLabel: 'Lv 3',  min: 10,  color: '#94a3b8', glow: false },
  { name: 'Or',           lvLabel: 'Lv 4',  min: 15,  color: '#f59e0b', glow: true  },
  { name: 'Saphir',       lvLabel: 'Lv 5',  min: 20,  color: '#3b82f6', glow: true  },
  { name: 'Émeraude',     lvLabel: 'Lv 6',  min: 25,  color: '#10b981', glow: true  },
  { name: 'Rubis',        lvLabel: 'Lv 7',  min: 30,  color: '#ef4444', glow: true  },
  { name: 'Diamant',      lvLabel: 'Lv 8',  min: 35,  color: '#a855f7', glow: true  },
  { name: 'Platine',      lvLabel: 'Lv 9',  min: 40,  color: '#06b6d4', glow: true  },
  { name: 'Maître',       lvLabel: 'Lv 10', min: 45,  color: '#f97316', glow: true  },
  { name: 'Grand Maître', lvLabel: 'Lv 11', min: 50,  color: '#1f2937', glow: false },
  { name: 'Légendaire',   lvLabel: 'Lv 12', min: 55,  color: 'rainbow', glow: true  },
  { name: 'Immortel',     lvLabel: 'Lv 13', min: 60,  color: '#dc2626', glow: true  },
  { name: 'Divin',        lvLabel: 'Lv 14', min: 65,  color: '#d97706', glow: true  },
  { name: 'Transcendant', lvLabel: 'Lv 15', min: 70,  color: '#7c3aed', glow: true  },
  { name: 'Céleste',      lvLabel: 'Lv 16', min: 75,  color: '#0ea5e9', glow: true  },
  { name: 'Mythique',     lvLabel: 'Lv 17', min: 80,  color: '#ec4899', glow: true  },
  { name: 'Cosmique',     lvLabel: 'Lv 18', min: 85,  color: '#8b5cf6', glow: true  },
  { name: 'Universel',    lvLabel: 'Lv 19', min: 90,  color: '#14b8a6', glow: true  },
  { name: 'HANDBALL GOD', lvLabel: 'Lv 20', min: 95,  color: 'rainbow', glow: true  },
  { name: 'Elite',        lvLabel: 'Lv 21', min: 100, color: '#2563eb', glow: true  },
  { name: 'Champion',     lvLabel: 'Lv 22', min: 105, color: '#16a34a', glow: true  },
  { name: 'Titan',        lvLabel: 'Lv 23', min: 110, color: '#9333ea', glow: true  },
  { name: 'Galactique',   lvLabel: 'Lv 24', min: 115, color: '#0891b2', glow: true  },
  { name: 'Supreme',      lvLabel: 'Lv 25', min: 120, color: '#be123c', glow: true  },
  { name: 'Icone',        lvLabel: 'Lv 26', min: 125, color: '#ca8a04', glow: true  },
  { name: 'Prodige',      lvLabel: 'Lv 27', min: 130, color: '#7c2d12', glow: true  },
  { name: 'Invincible',   lvLabel: 'Lv 28', min: 135, color: '#0f766e', glow: true  },
  { name: 'Eternel',      lvLabel: 'Lv 29', min: 140, color: '#4f46e5', glow: true  },
  { name: 'Hall of Fame', lvLabel: 'Lv 30', min: 145, color: '#db2777', glow: true  },
  { name: 'Legende 150',  lvLabel: 'Lv 31', min: 150, color: 'rainbow', glow: true  },
];

const RAINBOW_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ef4444'];

// ─── POSITIONS HANDBALL ──────────────────────────────────────────────────────
export type PositionCode = 'GB' | 'ALG' | 'ALD' | 'ARG' | 'ARD' | 'DC' | 'PV';

export const POSITIONS: { code: PositionCode; label: string; full: string }[] = [
  { code: 'GB',  label: 'GB',  full: 'Gardien de but' },
  { code: 'ALG', label: 'ALG', full: 'Ailier gauche'  },
  { code: 'ALD', label: 'ALD', full: 'Ailier droit'   },
  { code: 'ARG', label: 'ARG', full: 'Arrière gauche' },
  { code: 'ARD', label: 'ARD', full: 'Arrière droit'  },
  { code: 'DC',  label: 'DC',  full: 'Demi-centre'    },
  { code: 'PV',  label: 'PV',  full: 'Pivot'          },
];

export function getPositionFullName(code: string | null | undefined): string {
  if (!code) return '';
  const p = POSITIONS.find((x) => x.code === code);
  return p ? p.full : code;
}

export function computeGrade(totalTrainingPresences: number, totalGoals: number = 0, totalMatchesPlayed: number = 0) {
  const trainingStars = Math.floor(totalTrainingPresences / 2);
  const goalStars = Math.max(0, totalGoals || 0);
  const matchStars = Math.max(0, totalMatchesPlayed || 0);
  const totalStars = trainingStars + goalStars + matchStars;
  const gradeIdx = [...GRADES].reverse().findIndex((g) => totalStars >= g.min);
  const grade = GRADES[GRADES.length - 1 - (gradeIdx === -1 ? GRADES.length - 1 : gradeIdx)];
  const starsInLevel = totalStars === 0 ? 0 : ((totalStars - grade.min) % 5) + 1;
  const isRainbow = grade.color === 'rainbow';
  return { grade, totalStars, starsInLevel, isRainbow, trainingStars, goalStars, matchStars };
}

/** OVR (Overall) FIFA-style : 50 (débutant) → 99 (max). */
export function computeOverall(totalStars: number): number {
  const capped = Math.min(totalStars, 150);
  return Math.min(99, Math.max(50, Math.floor(50 + capped * (49 / 150))));
}

// ─── Type joueur partagé ─────────────────────────────────────────────────────
type Player = {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  photo_url: string | null;
  jersey_number: number | null;
  position?: string | null;
};

// ─── Helpers de style partagés (carte FIFA) ──────────────────────────────────
function getCardStyle(_grade: Grade, _isRainbow: boolean) {
  const mainColor = '#b7791f';
  const cardBg = 'linear-gradient(160deg, #fff7cc 0%, #facc15 42%, #d97706 72%, #fff2a8 100%)';
  const textColor = '#1e293b';
  const subtleText = 'rgba(30,41,59,0.72)';
  const borderColor = 'rgba(120,53,15,0.28)';
  const isLight = true;
  return { mainColor, cardBg, textColor, subtleText, borderColor, isLight };
}

// ─── FifaPlayerCard (vignette dans la grille) ────────────────────────────────
type FifaPlayerCardProps = {
  player: Player;
  totalTrainingPresences: number;
  totalGoals?: number;
  totalShots?: number;
  totalMatches?: number;
  isMyChild: boolean;
  /** Si true, masque OVR/grade/étoiles/stats. Garde photo + nom + poste + n°. */
  hideStats?: boolean;
  age: number | null;
  clubLogo?: string;
  onClick?: () => void;
  onJerseyClick?: () => void;
};

// ─── JerseyBadge : numéro de maillot façon tissu avec coutures ────────────────
function JerseyBadge({ number, size = 'small' }: { number: number; size?: 'small' | 'large' }) {
  const isLarge = size === 'large';
  const dim = isLarge ? 56 : 28;
  const fontSize = isLarge ? 22 : 12;
  const stitchWidth = isLarge ? 1.5 : 1;
  const stitchOffset = isLarge ? 5 : 3;
  const waveDepth = isLarge ? 3 : 1.5;

  // SVG path d'un cercle ondulé (effet bord d'écusson tissu)
  // 12 vagues autour du cercle pour un look "scalloped"
  const waves = 12;
  const cx = dim / 2;
  const cy = dim / 2;
  const r1 = dim / 2 - 1;          // rayon des creux
  const r2 = r1 + waveDepth;       // rayon des crêtes
  const points: string[] = [];
  for (let i = 0; i < waves * 2; i++) {
    const angle = (i / (waves * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r2 : r1;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  const wavePath = `M${points.join('L')}Z`;

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}>
      <defs>
        <radialGradient id={`jersey-grad-${size}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1a3a6e" />
          <stop offset="55%" stopColor="#0A5FB5" />
          <stop offset="100%" stopColor="#062C5D" />
        </radialGradient>
        <linearGradient id={`jersey-shine-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Bord ondulé (tissu) */}
      <path d={wavePath} fill={`url(#jersey-grad-${size})`} stroke="white" strokeWidth={isLarge ? 2 : 1.4} strokeLinejoin="round" />
      {/* Reflet lumineux */}
      <ellipse cx={cx} cy={cy * 0.6} rx={r1 * 0.7} ry={r1 * 0.35} fill={`url(#jersey-shine-${size})`} />
      {/* Coutures pointillées intérieures */}
      <circle cx={cx} cy={cy} r={r1 - stitchOffset} fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={stitchWidth}
        strokeDasharray={isLarge ? '3.5 2.5' : '2 1.5'} />
      {/* Numéro */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        style={{
          fontSize, fontWeight: 900, fill: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: number > 9 ? '-0.5px' : '0',
          paintOrder: 'stroke',
        }}
        stroke="rgba(0,0,0,0.25)" strokeWidth={isLarge ? 1.5 : 0.8}>
        {number}
      </text>
    </svg>
  );
}


export function FifaPlayerCard({
  player: p,
  totalTrainingPresences,
  totalGoals = 0,
  totalShots = 0,
  totalMatches = 0,
  isMyChild,
  hideStats = false,
  age,
  clubLogo,
  onClick,
  onJerseyClick,
}: FifaPlayerCardProps) {
  const { grade, starsInLevel, isRainbow } = computeGrade(totalTrainingPresences, totalGoals, totalMatches);
  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  const { mainColor, cardBg, textColor, subtleText, borderColor } = getCardStyle(grade, isRainbow);

  const positionLabel = p.position || '—';
  const positionFull = getPositionFullName(p.position);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4.4',
        borderRadius: 14,
        background: cardBg,
        boxShadow: '0 4px 20px rgba(217,119,6,0.38), 0 2px 8px rgba(0,0,0,0.15)',
        border: isMyChild ? '3px solid #0A5FB5' : '2px solid #b7791f',
        padding: '8px 8px 10px',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Effet brillant diagonal style FIFA */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {isMyChild && (
        <div style={{
          position: 'absolute', top: 6, right: 6, zIndex: 3,
          background: '#0A5FB5', color: 'white',
          padding: '2px 6px', borderRadius: 6,
          fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>👶 MOI</div>
      )}

      {/* HEADER : Niveau + Position + Logo plus gros */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36 }}>
          {hideStats ? (
            <div style={{ fontSize: 16, fontWeight: 900, color: textColor, lineHeight: 1, opacity: 0.72 }}>ID</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: mainColor, letterSpacing: 0.6, opacity: 0.9, marginBottom: 2 }}>LV</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: mainColor, textShadow: '0 1px 2px rgba(255,255,255,0.35)' }}>
                {grade.lvLabel.replace('Lv ', '')}
              </span>
            </div>
          )}
          <div title={positionFull} style={{
            fontSize: 9, fontWeight: 800, color: textColor,
            letterSpacing: 0.5, marginTop: 2, opacity: 0.9, cursor: 'help',
          }}>{positionLabel}</div>
          {clubLogo && (
            <img src={clubLogo} alt="" style={{
              width: 30, height: 30, borderRadius: '50%', marginTop: 5,
              objectFit: 'cover', border: `1.5px solid ${textColor === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'}`,
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }} />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{
              width: '100%', maxWidth: 90, height: 80, objectFit: 'cover',
              objectPosition: 'top center',
              borderRadius: 8,
            }} />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 8,
              background: 'linear-gradient(135deg,#0A5FB5,#062C5D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: 'white',
            }}>{initials}</div>
          )}
          {p.jersey_number != null && (
            <div
              onClick={(e) => {
                if (!onJerseyClick) return;
                e.stopPropagation();
                onJerseyClick();
              }}
              title={onJerseyClick ? 'Modifier le numéro de maillot' : undefined}
              style={{ position: 'absolute', bottom: -4, right: 0, cursor: onJerseyClick ? 'pointer' : 'default' }}>
              <JerseyBadge number={p.jersey_number} size="small" />
            </div>
          )}
        </div>
      </div>

      {/* NOM */}
      <div style={{
        textAlign: 'center', marginTop: 6, paddingBottom: 4,
        borderBottom: `1px solid ${borderColor}`,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: textColor, lineHeight: 1.1, letterSpacing: 0.3, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.last_name}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: subtleText, lineHeight: 1.1, marginTop: 1 }}>
          {p.first_name}{age !== null ? ` · ${age} ans` : ''}
        </div>
      </div>

      {/* STATS en texte naturel : "19 buts · 12 matchs · 14 entr." */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, position: 'relative', zIndex: 2, padding: '0 4px' }}>
        {hideStats ? (
          <PrivateStatsPanel player={p} textColor={textColor} subtleText={subtleText} compact />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            fontSize: 10, fontWeight: 700, color: textColor,
            textAlign: 'center', lineHeight: 1.2,
          }}>
            <div><span style={{ fontWeight: 900, fontSize: 12 }}>{totalGoals}</span> {totalGoals > 1 ? 'buts' : 'but'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 12 }}>{totalShots}</span> {totalShots > 1 ? 'tirs' : 'tir'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 12 }}>{totalMatches}</span> {totalMatches > 1 ? 'matchs' : 'match'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 12 }}>{totalTrainingPresences}</span> entr.</div>
          </div>
        )}
      </div>

      {/* FOOTER : Grade + étoiles */}
      {!hideStats && (
        <div style={{
          marginTop: 4, paddingTop: 4,
          borderTop: `1px solid ${borderColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: mainColor, letterSpacing: 0.5, opacity: 0.95 }}>
            {grade.lvLabel} · <span style={{ textTransform: 'uppercase' }}>{grade.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{
                fontSize: 9,
                color: i <= starsInLevel
                  ? (isRainbow ? RAINBOW_COLORS[i - 1] : (textColor === 'white' ? '#fde68a' : mainColor))
                  : (textColor === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                lineHeight: 1,
                textShadow: i <= starsInLevel ? '0 0 4px currentColor' : 'none',
              }}>★</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FullScreen Player Card (modale plein écran) ─────────────────────────────
// Variante "grande" de la carte avec swipe gauche/droite pour naviguer
type FifaCardData = {
  player: Player;
  totalTrainingPresences: number;
  totalGoals: number;
  totalShots: number;
  totalMatches: number;
  isMyChild: boolean;
  hideStats: boolean;
  age: number | null;
};

type FullScreenCardProps = {
  cards: FifaCardData[];
  initialIndex: number;
  onClose: () => void;
  clubLogo?: string;
};

export function FullScreenCard({ cards, initialIndex, onClose, clubLogo }: FullScreenCardProps) {
  const [index, setIndex] = useState(initialIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  // Bloquer le scroll body
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  // Clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
      else if (e.key === 'ArrowRight' && index < cards.length - 1) setIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, cards.length, onClose]);

  const goPrev = () => { if (index > 0) setIndex(index - 1); };
  const goNext = () => { if (index < cards.length - 1) setIndex(index + 1); };

  const onPointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || startXRef.current === null) return;
    setDragOffset(e.clientX - startXRef.current);
  };
  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const SWIPE_THRESHOLD = 60;
    if (dragOffset > SWIPE_THRESHOLD && index > 0) setIndex(index - 1);
    else if (dragOffset < -SWIPE_THRESHOLD && index < cards.length - 1) setIndex(index + 1);
    setDragOffset(0);
    startXRef.current = null;
  };

  if (cards.length === 0) return null;
  const c = cards[index];
  if (!c) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      {/* Close */}
      <button onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 5,
          width: 44, height: 44, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.15)',
          color: 'white', fontSize: 20, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(6px)',
        }}>✕</button>

      {/* Compteur */}
      <div style={{
        position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
        color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
        background: 'rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 999,
      }}>
        {index + 1} / {cards.length}
      </div>

      {/* Flèche gauche */}
      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            zIndex: 5, width: 48, height: 48, borderRadius: '50%',
            border: 'none', background: 'rgba(255,255,255,0.15)',
            color: 'white', fontSize: 24, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
      )}

      {/* Flèche droite */}
      {index < cards.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            zIndex: 5, width: 48, height: 48, borderRadius: '50%',
            border: 'none', background: 'rgba(255,255,255,0.15)',
            color: 'white', fontSize: 24, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
      )}

      {/* Carte (avec swipe) */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          width: '100%', maxWidth: 340,
          transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.02}deg)`,
          transition: draggingRef.current ? 'none' : 'transform 0.25s ease',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}>
        <BigFifaCard data={c} clubLogo={clubLogo} />
      </div>
    </div>
  );
}

function PrivateStatsPanel({ player, textColor, subtleText, compact = false }: { player: Player; textColor: string; subtleText: string; compact?: boolean }) {
  const identityRows = [
    ['Poste', player.position || 'A définir'],
    ['N°', player.jersey_number != null ? String(player.jersey_number) : 'A définir'],
  ];
  const badges = [
    ['Fair-play', '⭐'],
    ['Collectif', '🤝'],
    ['Motivation', '🔥'],
  ];
  return (
    <div style={{ width: '100%', display: 'grid', gap: compact ? 6 : 12, color: textColor }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 5 : 10 }}>
        {identityRows.map(([label, value]) => (
          <div key={label} style={{ padding: compact ? '5px 5px' : '10px 12px', borderRadius: compact ? 8 : 14, background: 'rgba(255,255,255,0.28)', border: '1px solid rgba(120,53,15,0.16)', textAlign: 'center' }}>
            <div style={{ fontSize: compact ? 7 : 11, fontWeight: 900, textTransform: 'uppercase', color: subtleText }}>{label}</div>
            <div style={{ fontSize: compact ? 9 : 16, fontWeight: 900, marginTop: compact ? 1 : 4 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: compact ? 4 : 8 }}>
        {badges.map(([label, icon]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 5 : 10, padding: compact ? '4px 6px' : '9px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.24)', border: '1px solid rgba(120,53,15,0.12)' }}>
            <span style={{ fontSize: compact ? 10 : 18 }}>{icon}</span>
            <span style={{ fontSize: compact ? 7 : 12, fontWeight: 900, letterSpacing: compact ? 0.2 : 0.6, textTransform: 'uppercase' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: compact ? 7 : 11, fontWeight: 900, letterSpacing: compact ? 0.6 : 1, textTransform: 'uppercase', color: subtleText }}>
        🔒 Stats sportives privées
      </div>
    </div>
  );
}

// ─── Grande carte (utilisée dans la modale) ──────────────────────────────────
function BigFifaCard({ data, clubLogo }: { data: FifaCardData; clubLogo?: string }) {
  const { player: p, totalTrainingPresences, totalGoals, totalShots, totalMatches, isMyChild, hideStats, age } = data;
  const { grade, starsInLevel, isRainbow } = computeGrade(totalTrainingPresences, totalGoals, totalMatches);
  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  const { mainColor, cardBg, textColor, subtleText, borderColor } = getCardStyle(grade, isRainbow);
  const positionLabel = p.position || '—';
  const positionFull = getPositionFullName(p.position);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '3 / 4.4',
      borderRadius: 24,
      background: cardBg,
      boxShadow: '0 12px 50px rgba(217,119,6,0.5), 0 8px 24px rgba(0,0,0,0.4)',
      border: isMyChild ? '4px solid #0A5FB5' : '3px solid #b7791f',
      padding: '20px 18px 22px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Effet brillant */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 45%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {isMyChild && (
        <div style={{
          position: 'absolute', top: 14, right: 14, zIndex: 3,
          background: '#0A5FB5', color: 'white',
          padding: '5px 12px', borderRadius: 10,
          fontSize: 11, fontWeight: 900, letterSpacing: 0.8,
          boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
        }}>👶 MON ENFANT</div>
      )}

      {/* HEADER : Niveau + Position + Logo */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
          {hideStats ? (
            <div style={{ fontSize: 56, fontWeight: 900, color: textColor, lineHeight: 1, opacity: 0.35 }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: mainColor, letterSpacing: 1, opacity: 0.9, marginBottom: 4 }}>LV</span>
              <span style={{ fontSize: 56, fontWeight: 900, color: mainColor, textShadow: '0 2px 6px rgba(255,255,255,0.35)' }}>
                {grade.lvLabel.replace('Lv ', '')}
              </span>
            </div>
          )}
          <div title={positionFull} style={{
            fontSize: 18, fontWeight: 800, color: textColor,
            letterSpacing: 1, marginTop: 4, opacity: 0.9,
          }}>{positionLabel}</div>
          {clubLogo && (
            <img src={clubLogo} alt="" style={{
              width: 56, height: 56, borderRadius: '50%', marginTop: 10,
              objectFit: 'cover', border: `2px solid ${textColor === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'}`,
              background: 'white',
              boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
            }} />
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{
              width: '100%', maxWidth: 200, aspectRatio: '1 / 1', objectFit: 'cover',
              objectPosition: 'top center',
              borderRadius: 14,
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }} />
          ) : (
            <div style={{
              width: 180, height: 180, borderRadius: 14,
              background: 'linear-gradient(135deg,#0A5FB5,#062C5D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 60, fontWeight: 900, color: 'white',
            }}>{initials}</div>
          )}
          {p.jersey_number != null && (
            <div style={{ position: 'absolute', bottom: -10, right: 4 }}>
              <JerseyBadge number={p.jersey_number} size="large" />
            </div>
          )}
        </div>
      </div>

      {/* NOM */}
      <div style={{
        textAlign: 'center', marginTop: 16, paddingBottom: 12,
        borderBottom: `1.5px solid ${borderColor}`,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: textColor, lineHeight: 1.1, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {p.last_name}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: subtleText, lineHeight: 1.1, marginTop: 4 }}>
          {p.first_name}{age !== null ? ` · ${age} ans` : ''}
        </div>
      </div>

      {/* STATS */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 12, position: 'relative', zIndex: 2 }}>
        {hideStats ? (
          <PrivateStatsPanel player={p} textColor={textColor} subtleText={subtleText} />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            fontSize: 17, fontWeight: 700, color: textColor,
            textAlign: 'center', lineHeight: 1.2,
            width: '100%',
          }}>
            <div><span style={{ fontWeight: 900, fontSize: 24 }}>{totalGoals}</span> {totalGoals > 1 ? 'buts' : 'but'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 24 }}>{totalShots}</span> {totalShots > 1 ? 'tirs' : 'tir'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 24 }}>{totalMatches}</span> {totalMatches > 1 ? 'matchs' : 'match'} {totalMatches > 1 ? 'joués' : 'joué'}</div>
            <div><span style={{ fontWeight: 900, fontSize: 24 }}>{totalTrainingPresences}</span> {totalTrainingPresences > 1 ? 'entraînements' : 'entraînement'}</div>
          </div>
        )}
      </div>

      {/* FOOTER : Grade + étoiles */}
      {!hideStats && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: `1.5px solid ${borderColor}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          position: 'relative', zIndex: 2,
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: mainColor, letterSpacing: 0.8 }}>
            {grade.lvLabel} · <span style={{ textTransform: 'uppercase' }}>{grade.name}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{
                fontSize: 22,
                color: i <= starsInLevel
                  ? (isRainbow ? RAINBOW_COLORS[i - 1] : (textColor === 'white' ? '#fde68a' : mainColor))
                  : (textColor === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                lineHeight: 1,
                textShadow: i <= starsInLevel && grade.glow ? '0 0 8px currentColor' : 'none',
              }}>★</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PlayerCard (legacy) ─────────────────────────────────────────────────────
type PlayerCardProps = {
  player: Player;
  totalTrainingPresences: number;
  totalGoals?: number;
  totalMatches?: number;
  isMyChild: boolean;
  hideGrade?: boolean;
  age: number | null;
};

export function PlayerCard({ player: p, totalTrainingPresences, totalGoals = 0, totalMatches = 0, isMyChild, hideGrade = false, age }: PlayerCardProps) {
  const { grade, starsInLevel } = computeGrade(totalTrainingPresences, totalGoals, totalMatches);
  const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
  const starColor = '#b7791f';
  const borderColor = isMyChild ? '#0A5FB5' : '#b7791f';

  return (
    <div style={{
      background: 'linear-gradient(160deg, #fff7cc 0%, #facc15 48%, #fff2a8 100%)',
      borderRadius: 16, padding: 14,
      boxShadow: '0 2px 14px rgba(217,119,6,0.28)',
      border: `2px solid ${borderColor}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      position: 'relative',
      opacity: hideGrade && !isMyChild ? 0.7 : 1,
    }}>
      {p.jersey_number != null && (
        <div style={{ position: 'absolute', top: 8, left: 8, width: 24, height: 24, borderRadius: '50%', background: '#062C5D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'white' }}>
          {p.jersey_number}
        </div>
      )}
      {isMyChild && (
        <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 13 }}>👶</div>
      )}
      {p.photo_url
        ? <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${borderColor}` }} />
        : <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white' }}>{initials}</div>
      }
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#062C5D', lineHeight: 1.2 }}>{p.first_name}</div>
        <div style={{ fontWeight: 900, fontSize: 11, color: '#0A5FB5', textTransform: 'uppercase' }}>{p.last_name}</div>
        {age !== null && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>{age} ans</div>}
      </div>
      {hideGrade && !isMyChild ? (
        <div style={{ fontSize: 9, color: '#c4b5fd', fontWeight: 600 }}>— — —</div>
      ) : grade.name !== 'Rookie' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: '#92400e', letterSpacing: 0.5 }}>{grade.lvLabel}</div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: '#92400e', textTransform: 'uppercase' }}>{grade.name}</div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{
                fontSize: 11,
                color: i <= starsInLevel
                  ? starColor
                  : '#d1d5db',
                opacity: i <= starsInLevel ? 1 : 0.25,
              }}>★</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: '#9ca3af', letterSpacing: 0.5 }}>Lv 1</div>
          <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700 }}>Rookie</div>
          {totalTrainingPresences > 0 && (
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ fontSize: 11, color: '#d1d5db', opacity: 0.25 }}>★</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GradeModal ───────────────────────────────────────────────────────────────
export function GradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 24, padding: 24, maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#062C5D', fontSize: 18, fontWeight: 900 }}>⭐ Système de niveaux</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>✕</button>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#5b6472' }}>
          Les étoiles ★ viennent de <strong>trois sources</strong> :<br/>
          🏃 <strong>1 étoile tous les 2 entraînements</strong> présents<br/>
          🎯 <strong>1 étoile par but</strong> marqué<br/>
          ⚽ <strong>1 étoile par match joué</strong><br/>
          Après <strong>5 étoiles</strong> cumulées, tu passes au niveau suivant !
        </p>
        {GRADES.map((g, idx) => {
          const isRainbow = g.color === 'rainbow';
          return (
            <div key={g.name} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              borderRadius: 14, marginBottom: 6,
              background: idx % 2 === 0 ? '#f8fbff' : 'white',
              border: `1px solid ${isRainbow ? '#e9d5ff' : g.color + '33'}`,
              boxShadow: g.glow ? `0 1px 8px ${isRainbow ? 'rgba(168,85,247,0.15)' : g.color + '22'}` : 'none',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isRainbow ? 'linear-gradient(135deg,#f59e0b,#10b981,#3b82f6,#a855f7,#ef4444)' : g.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
                boxShadow: g.glow ? `0 2px 8px ${isRainbow ? 'rgba(168,85,247,0.4)' : g.color + '66'}` : 'none',
              }}>
                {g.name === 'HANDBALL GOD' ? '👑' : g.name === 'Rookie' ? '🥚' : '★'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 12, color: isRainbow ? '#7c3aed' : g.color, letterSpacing: 0.5 }}>
                  {g.lvLabel} · {g.name}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                  {g.name === 'Rookie' ? '0 étoile' : `À partir de ${g.min} étoiles`}
                </div>
              </div>
              {g.name !== 'Rookie' && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} style={{
                      fontSize: 14,
                      color: isRainbow ? RAINBOW_COLORS[i - 1] : g.color,
                      opacity: i <= 3 ? 1 : 0.25,
                    }}>★</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
          💡 Étoiles grises = ce qu'il reste pour passer au niveau suivant. Tu progresses avec les entraînements et les matchs joués.
        </div>
      </div>
    </div>
  );
}
