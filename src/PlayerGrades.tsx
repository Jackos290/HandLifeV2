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

export function computeGrade(totalTrainingPresences: number, _totalGoals: number = 0, totalMatchesPlayed: number = 0) {
  const trainingStars = Math.floor(totalTrainingPresences / 2);
  const goalStars = 0;
  const matchStars = Math.max(0, totalMatchesPlayed || 0) * 2;
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
  card_powers?: string[] | null;
};

export const HANDBALL_POWERS = [
  { id: 'muraille', label: 'Muraille', icon: '🧱' },
  { id: 'missile', label: 'Missile', icon: '🚀' },
  { id: 'aimant', label: 'Aimant à ballons', icon: '🧲' },
  { id: 'feinte', label: 'Feinte magique', icon: '✨' },
  { id: 'eclair', label: 'Vitesse éclair', icon: '⚡' },
  { id: 'passe', label: 'Passe laser', icon: '🎯' },
  { id: 'gardien', label: 'Réflexes de gardien', icon: '🧤' },
  { id: 'capitaine', label: 'Esprit capitaine', icon: '🗣️' },
  { id: 'interception', label: 'Interception ninja', icon: '🥷' },
  { id: 'roucoulette', label: 'Roucoulette', icon: '🌀' },
  { id: 'kungfu', label: 'Kung-fu volant', icon: '🪽' },
  { id: 'contre', label: 'Contre géant', icon: '🛡️' },
  { id: 'relance', label: 'Relance éclair', icon: '🏹' },
  { id: 'lucarne', label: 'Lucarne magique', icon: '🪄' },
  { id: 'pivot', label: 'Pivot indestructible', icon: '💪' },
  { id: 'dernier_rempart', label: 'Dernier rempart', icon: '🚧' },
  { id: 'vision', label: 'Vision de jeu', icon: '👁️' },
  { id: 'mental', label: 'Mental d’acier', icon: '🧠' },
  { id: 'supporter', label: 'Boost équipe', icon: '📣' },
  { id: 'grinta', label: 'Grinta', icon: '🔥' },
  { id: 'torpille', label: 'Torpille lointaine', icon: '💥' },
  { id: 'mur_defensif', label: 'Mur défensif', icon: '🧱' },
  { id: 'tir_roucoulette', label: 'Tir roucoulette', icon: '🌀' },
  { id: 'passe_cachee', label: 'Passe cachée', icon: '🎩' },
  { id: 'crochet', label: 'Crochet éclair', icon: '🪝' },
  { id: 'demarrage', label: 'Démarrage turbo', icon: '🏁' },
  { id: 'repli', label: 'Repli express', icon: '↩️' },
  { id: 'lecture', label: 'Lecture du jeu', icon: '📖' },
  { id: 'sang_froid', label: 'Sang-froid', icon: '🧊' },
  { id: 'main_chaude', label: 'Main chaude', icon: '✋' },
  { id: 'duel', label: 'Duel gagné', icon: '⚔️' },
  { id: 'suspension', label: 'Tir en suspension', icon: '🦘' },
  { id: 'aile_rapide', label: 'Aile supersonique', icon: '🪽' },
  { id: 'bloc_pivot', label: 'Bloc pivot', icon: '🪨' },
  { id: 'relance_gardien', label: 'Relance gardien', icon: '🥅' },
  { id: 'parade', label: 'Parade réflexe', icon: '🧤' },
  { id: 'tir_7m', label: 'Spécialiste 7 m', icon: '7️⃣' },
  { id: 'contre_attaque', label: 'Contre-attaque', icon: '🌬️' },
  { id: 'pression', label: 'Pression haute', icon: '⛓️' },
  { id: 'passe_decisive', label: 'Passe décisive', icon: '🤝' },
  { id: 'appui', label: 'Appuis de feu', icon: '👟' },
  { id: 'lucidite', label: 'Lucidité finale', icon: '💎' },
  { id: 'courage', label: 'Courage total', icon: '❤️' },
  { id: 'solidarite', label: 'Solidarité', icon: '🤜' },
  { id: 'tempo', label: 'Maître du tempo', icon: '⏱️' },
  { id: 'impact', label: 'Impact offensif', icon: '🥊' },
  { id: 'volonte', label: 'Volonté de fer', icon: '🔩' },
  { id: 'explosivite', label: 'Explosivité', icon: '🧨' },
  { id: 'fairplay', label: 'Fair-play', icon: '⭐' },
  { id: 'legende_club', label: 'Légende du club', icon: '🏆' },
] as const;

function getPlayerPowers(player: Player) {
  const selected = Array.isArray(player.card_powers) ? player.card_powers : [];
  const powers = selected
    .map((id) => HANDBALL_POWERS.find((p) => p.id === id))
    .filter(Boolean) as typeof HANDBALL_POWERS[number][];
  return powers.length > 0 ? powers.slice(0, 3) : HANDBALL_POWERS.slice(0, 3);
}

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
  const dim = isLarge ? 72 : 40;
  const fontSize = isLarge ? 28 : 17;
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
  const powers = getPlayerPowers(p);

  const positionLabel = p.position || '—';
  const positionFull = getPositionFullName(p.position);

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease',
      }}
    >
      <BigFifaCard
        data={{
          player: p,
          totalTrainingPresences,
          totalGoals,
          totalShots,
          totalMatches,
          isMyChild,
          hideStats,
          age,
        }}
        clubLogo={clubLogo}
      />
    </div>
  );

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '3 / 4.4',
        borderRadius: 20,
        background: 'linear-gradient(145deg,#f8e8bd 0%,#c79a48 46%,#3a3128 100%)',
        boxShadow: '0 10px 30px rgba(120,53,15,0.38), inset 0 0 0 2px rgba(255,245,200,0.75), inset 0 0 0 5px rgba(18,32,54,0.72)',
        border: isMyChild ? '3px solid #0A5FB5' : '3px solid #d7a53e',
        padding: '10px 10px 12px',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Effet brillant diagonal style collector */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 78% 28%, rgba(255,255,255,0.26), transparent 24%), linear-gradient(115deg, transparent 28%, rgba(255,255,255,0.20) 44%, transparent 62%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', inset: 9, borderRadius: 16, border: '1px solid rgba(255,222,139,0.72)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', right: -54, top: 54, bottom: 42, width: '78%', opacity: 0.18, pointerEvents: 'none', zIndex: 1, mixBlendMode: 'multiply' }}>
        {clubLogo && <img src={clubLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(1) contrast(2.2) brightness(0.9)' }} />}
      </div>

      {isMyChild && (
        <div style={{
          position: 'absolute', top: 6, right: 6, zIndex: 3,
          background: '#0A5FB5', color: 'white',
          padding: '2px 6px', borderRadius: 6,
          fontSize: 8, fontWeight: 900, letterSpacing: 0.5,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}>👶 MOI</div>
      )}

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#10233b', fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 7 }}>
        Club Athletique Gorcy Handball
      </div>

      {/* PHOTO + pouvoirs lateraux */}
      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr 42px', alignItems: 'start', gap: 6, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gap: 6, paddingTop: 14 }}>
          {powers.map((power) => (
            <div key={power.id} title={power.label} style={{ height: 34, borderRadius: 9, background: 'linear-gradient(145deg,#17253b,#06142a)', border: '1px solid #d7a53e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 2px 7px rgba(0,0,0,0.24)' }}>
              <span style={{ fontSize: 17 }}>{power.icon}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{
              width: '100%', maxWidth: 132, aspectRatio: '1 / 1.02', objectFit: 'cover',
              objectPosition: 'top center',
              borderRadius: 12,
              border: '3px solid #d7a53e',
              boxShadow: '0 5px 14px rgba(0,0,0,0.34), inset 0 0 0 2px rgba(255,255,255,0.24)',
            }} />
          ) : (
            <div style={{
              width: 118, height: 118, borderRadius: 12,
              background: 'linear-gradient(135deg,#0A5FB5,#062C5D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 900, color: 'white',
              border: '3px solid #d7a53e',
            }}>{initials}</div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
          <div
              onClick={(e) => {
                if (!onJerseyClick) return;
                e.stopPropagation();
                onJerseyClick();
              }}
              title={onJerseyClick ? 'Modifier le numero de maillot' : undefined}
              style={{ width: 42, height: 48, clipPath: 'polygon(50% 0, 100% 22%, 100% 78%, 50% 100%, 0 78%, 0 22%)', background: 'linear-gradient(145deg,#10233b,#06142a)', border: '2px solid #d7a53e', color: '#ffd66b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, cursor: onJerseyClick ? 'pointer' : 'default', boxShadow: '0 3px 10px rgba(0,0,0,0.32)' }}>
              {p.jersey_number ?? '+'}
          </div>
          {!hideStats && <div style={{ color: '#10233b', fontSize: 10, fontWeight: 900 }}>{grade.lvLabel.replace('Lv ', 'Lv ')}</div>}
          <div title={positionFull} style={{ color: '#10233b', fontSize: 10, fontWeight: 900, cursor: 'help' }}>{positionLabel}</div>
          {clubLogo && <img src={clubLogo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', background: 'white', border: '1px solid #d7a53e' }} />}
        </div>
      </div>

      {/* NOM */}
      <div style={{
        textAlign: 'center', marginTop: 7, padding: '6px 8px',
        background: 'linear-gradient(90deg,rgba(255,238,192,0.95),rgba(255,249,226,0.9),rgba(255,238,192,0.95))',
        border: '1px solid rgba(120,53,15,0.26)',
        borderRadius: 9,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: '#06142a', lineHeight: 1, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.last_name}
        </div>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#7c4a09', lineHeight: 1.1, marginTop: 4 }}>
          {p.first_name}{age !== null ? ` • ${age} ans` : ''}
        </div>
      </div>

      {/* Super pouvoirs / stats */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 7, position: 'relative', zIndex: 2, padding: '0 2px' }}>
        {hideStats ? (
          <PrivateStatsPanel player={p} textColor={textColor} subtleText={subtleText} compact />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, width: '100%' }}>
            {powers.map((power) => (
              <div key={power.id} style={{ minHeight: 43, borderRadius: 9, background: 'linear-gradient(145deg,#17253b,#06142a)', border: '1px solid #d7a53e', color: 'white', display: 'grid', placeItems: 'center', padding: '5px 3px', textAlign: 'center', boxShadow: '0 3px 8px rgba(0,0,0,0.24)' }}>
                <div style={{ fontSize: 15, lineHeight: 1 }}>{power.icon}</div>
                <div style={{ fontSize: 6.5, fontWeight: 900, lineHeight: 1.05, textTransform: 'uppercase' }}>{power.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER : progression */}
      {!hideStats && (
        <div style={{
          marginTop: 7, padding: '5px 8px',
          border: '1px solid #d7a53e',
          background: 'linear-gradient(90deg,#06142a,#173457,#06142a)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          position: 'relative', zIndex: 2,
        }}>
          <span style={{ color: '#ffd66b', fontSize: 11 }}>★</span>
          <span style={{ color: '#ffd66b', fontSize: 8, fontWeight: 900, letterSpacing: 0.8, textTransform: 'uppercase' }}>{grade.name}</span>
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
        padding: '58px 12px 14px',
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
          width: 'min(100%, 330px)',
          maxHeight: 'calc(100dvh - 82px)',
          overflow: 'visible',
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
  const powers = getPlayerPowers(player);
  return (
    <div style={{ width: '100%', display: 'grid', gap: compact ? 6 : 12, color: textColor }}>
      <div style={{ padding: compact ? '6px 8px' : '12px 14px', borderRadius: compact ? 10 : 16, background: 'rgba(255,255,255,0.24)', border: '1px solid rgba(120,53,15,0.14)', textAlign: 'center' }}>
        <div style={{ fontSize: compact ? 7 : 11, fontWeight: 900, textTransform: 'uppercase', color: subtleText }}>Carte personnalisée</div>
        <div style={{ fontSize: compact ? 10 : 18, fontWeight: 900, marginTop: compact ? 2 : 5 }}>{player.position || 'Poste à définir'}</div>
      </div>
      <div style={{ display: 'grid', gap: compact ? 4 : 8 }}>
        {powers.map((power) => (
          <div key={power.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: compact ? 6 : 12, padding: compact ? '6px 7px' : '11px 14px', borderRadius: 999, background: 'linear-gradient(90deg, rgba(255,255,255,0.34), rgba(255,255,255,0.16))', border: '1px solid rgba(120,53,15,0.14)', boxShadow: compact ? 'none' : '0 4px 12px rgba(120,53,15,0.10)' }}>
            <span style={{ fontSize: compact ? 13 : 22 }}>{power.icon}</span>
            <span style={{ fontSize: compact ? 8 : 13, fontWeight: 900, letterSpacing: compact ? 0.2 : 0.6, textTransform: 'uppercase' }}>{power.label}</span>
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
  const powers = getPlayerPowers(p);
  const positionLabel = p.position || '—';
  const positionFull = getPositionFullName(p.position);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: 0,
      borderRadius: 28,
      background: 'linear-gradient(145deg,#f8e8bd 0%,#c79a48 46%,#3a3128 100%)',
      boxShadow: '0 18px 60px rgba(120,53,15,0.58), 0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(255,245,200,0.75), inset 0 0 0 8px rgba(18,32,54,0.72)',
      border: isMyChild ? '4px solid #0A5FB5' : '4px solid #d7a53e',
      padding: '12px 12px 14px',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Effet brillant */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 78% 30%, rgba(255,255,255,0.28), transparent 25%), linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.22) 45%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', inset: 14, borderRadius: 22, border: '1px solid rgba(255,222,139,0.76)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', right: -78, top: 86, bottom: 72, width: '84%', opacity: 0.18, pointerEvents: 'none', zIndex: 1, mixBlendMode: 'multiply' }}>
        {clubLogo && <img src={clubLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(1) contrast(2.2) brightness(0.9)' }} />}
      </div>

      {isMyChild && (
        <div style={{
          position: 'absolute', top: 14, right: 14, zIndex: 3,
          background: '#0A5FB5', color: 'white',
          padding: '5px 12px', borderRadius: 10,
          fontSize: 11, fontWeight: 900, letterSpacing: 0.8,
          boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
        }}>👶 MON ENFANT</div>
      )}

      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#10233b', fontSize: 11, fontWeight: 900, letterSpacing: 2.6, textTransform: 'uppercase', marginBottom: 10 }}>
        Club Athletique Gorcy Handball
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 62px', alignItems: 'start', gap: 8, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gap: 8, paddingTop: 24 }}>
          {powers.map((power) => (
            <div key={power.id} title={power.label} style={{ height: 49, borderRadius: 13, background: 'linear-gradient(145deg,#17253b,#06142a)', border: '2px solid #d7a53e', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.28)' }}>
              <span style={{ fontSize: 24 }}>{power.icon}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {p.photo_url ? (
            <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{
              width: '100%', maxWidth: 190, aspectRatio: '1 / 1.04', objectFit: 'cover',
              objectPosition: 'top center',
              borderRadius: 18,
              border: '5px solid #d7a53e',
              boxShadow: '0 8px 22px rgba(0,0,0,0.35)',
            }} />
          ) : (
            <div style={{
              width: 178, height: 178, borderRadius: 18,
              background: 'linear-gradient(135deg,#0A5FB5,#062C5D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 60, fontWeight: 900, color: 'white',
              border: '5px solid #d7a53e',
            }}>{initials}</div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
          <div style={{ width: 58, height: 68, clipPath: 'polygon(50% 0, 100% 22%, 100% 78%, 50% 100%, 0 78%, 0 22%)', background: 'linear-gradient(145deg,#10233b,#06142a)', border: '3px solid #d7a53e', color: '#ffd66b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, boxShadow: '0 6px 18px rgba(0,0,0,0.36)' }}>
            {p.jersey_number ?? '-'}
          </div>
          {!hideStats && <div style={{ color: '#10233b', fontSize: 12, fontWeight: 900 }}>{grade.lvLabel}</div>}
          <div title={positionFull} style={{ color: '#10233b', fontSize: 12, fontWeight: 900 }}>{positionLabel}</div>
          {clubLogo && <img src={clubLogo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: 'white', border: '2px solid #d7a53e' }} />}
        </div>
      </div>

      {/* NOM */}
      <div style={{
        textAlign: 'center', marginTop: 12, padding: '10px 12px',
        background: 'linear-gradient(90deg,rgba(255,238,192,0.96),rgba(255,249,226,0.94),rgba(255,238,192,0.96))',
        border: '2px solid rgba(120,53,15,0.26)',
        borderRadius: 18,
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#06142a', lineHeight: 1, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          {p.last_name}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color: '#7c4a09', lineHeight: 1.1, marginTop: 6 }}>
          {p.first_name}{age !== null ? ` • ${age} ans` : ''}
        </div>
      </div>

      {/* STATS */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10, position: 'relative', zIndex: 2 }}>
        {hideStats ? (
          <PrivateStatsPanel player={p} textColor={textColor} subtleText={subtleText} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
            {powers.map((power) => (
              <div key={power.id} style={{ minHeight: 60, borderRadius: 13, background: 'linear-gradient(145deg,#17253b,#06142a)', border: '2px solid #d7a53e', color: 'white', display: 'grid', placeItems: 'center', padding: '7px 5px', textAlign: 'center', boxShadow: '0 5px 14px rgba(0,0,0,0.28)' }}>
                <div style={{ fontSize: 23, lineHeight: 1 }}>{power.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 900, lineHeight: 1.05, textTransform: 'uppercase' }}>{power.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER : Grade + étoiles */}
      {!hideStats && (
        <div style={{
          marginTop: 10, padding: '9px 14px',
          border: '2px solid #d7a53e',
          background: 'linear-gradient(90deg,#06142a,#173457,#06142a)',
          borderRadius: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          position: 'relative', zIndex: 2,
        }}>
          <span style={{ color: '#ffd66b', fontSize: 18 }}>★</span>
          <span style={{ color: '#ffd66b', fontSize: 12, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}>{grade.name}</span>
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
          Les étoiles ★ viennent de <strong>deux sources</strong> :<br/>
          🏃 <strong>1 étoile tous les 2 entraînements</strong> présents<br/>
          ⚽ <strong>2 étoiles par match joué</strong><br/>
          Les buts ne font plus monter le niveau : la progression récompense surtout l'assiduité, les matchs joués et l'engagement dans l'équipe.
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
