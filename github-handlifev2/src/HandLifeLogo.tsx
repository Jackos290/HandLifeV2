import React from 'react';

interface HandLifeLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function HandLifeLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
}: HandLifeLogoProps) {
  const scales = { sm: 0.45, md: 0.7, lg: 1 };
  const scale = scales[size];

  // Dimensions du SVG source : 260 x 80 (logo horizontal compact)
  const W = Math.round(260 * scale);
  const H = Math.round((showTagline ? 92 : 72) * scale);

  const isDark = variant === 'dark';
  const textHand = isDark ? '#ffffff' : '#062C5D';
  const textLife = isDark ? '#7EC8E3' : '#0A5FB5';
  const ballStroke = isDark ? 'rgba(255,255,255,0.55)' : '#0A5FB5';
  const ballBg = isDark ? 'rgba(255,255,255,0.06)' : '#f0f6ff';
  const ballBorder = isDark ? 'rgba(255,255,255,0.5)' : '#0A5FB5';
  const dotColor = isDark ? 'rgba(255,255,255,0.7)' : '#0A5FB5';
  const tagColor = isDark ? 'rgba(255,255,255,0.4)' : '#5b8fd4';

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 260 ${showTagline ? 92 : 72}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      aria-label="HandLife — Gestion de club handball"
    >
      {/* ── Ballon de handball ── */}
      {/* Cercle fond */}
      <circle cx="36" cy="36" r="32" fill={ballBg} stroke={ballBorder} strokeWidth="0.6" opacity="0.3"/>

      {/* Lignes du ballon */}
      {/* Verticale courbe */}
      <path d={`M 36 5 Q 47 20 47 36 Q 47 52 36 67`} fill="none" stroke={ballStroke} strokeWidth="1.6" strokeLinecap="round"/>
      <path d={`M 36 5 Q 25 20 25 36 Q 25 52 36 67`} fill="none" stroke={ballStroke} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Horizontale haut */}
      <path d={`M 7 22 Q 21 16 36 16 Q 51 16 65 22`} fill="none" stroke={ballStroke} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Horizontale bas */}
      <path d={`M 7 50 Q 21 56 36 56 Q 51 56 65 50`} fill="none" stroke={ballStroke} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Ligne centrale */}
      <path d={`M 10 36 Q 23 31 36 31 Q 49 31 62 36`} fill="none" stroke={ballStroke} strokeWidth="1.2" strokeLinecap="round"/>

      {/* Bordure principale */}
      <circle cx="36" cy="36" r="32" fill="none" stroke={ballBorder} strokeWidth="1.8"/>

      {/* Points clés */}
      <circle cx="36" cy="36" r="3" fill={dotColor}/>
      <circle cx="47" cy="36" r="2" fill={dotColor} opacity="0.5"/>
      <circle cx="25" cy="36" r="2" fill={dotColor} opacity="0.5"/>

      {/* ── Texte HAND ── */}
      <text
        x="80" y="30"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="28"
        letterSpacing="-0.8"
        fill={textHand}
      >Hand</text>

      {/* ── Séparateur ── */}
      <rect x="80" y="35" width="172" height="1.5" rx="0.75" fill={textLife} opacity="0.2"/>

      {/* ── Texte LIFE ── */}
      <text
        x="80" y="62"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="28"
        letterSpacing="-0.8"
        fill={textLife}
      >Life</text>

      {/* ── Tagline optionnelle ── */}
      {showTagline && (
        <text
          x="80" y="82"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="400"
          fontSize="9"
          letterSpacing="2.5"
          fill={tagColor}
        >GESTION DE CLUB</text>
      )}
    </svg>
  );
}
