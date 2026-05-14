// ─── ChildBlock.tsx ────────────────────────────────────────────────────────
// Composant d'inscription enfant — extrait hors du render principal pour
// éviter le remontage à chaque re-render (bug mobile : selects/inputs perdus)
// ──────────────────────────────────────────────────────────────────────────

import React from 'react';

type Team   = { id: string; name: string; category: string };
type Player = { id: string; first_name: string; last_name: string; team_id: string; birth_date: string | null; photo_url: string | null; jersey_number: number | null };

type Props = {
  label: string;
  mode: 'existing' | 'new';
  setMode: (v: 'existing' | 'new') => void;
  existingId: string;
  setExistingId: (v: string) => void;
  teamId: string;
  setTeamId: (v: string) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  // données externes
  players: Player[];
  teams: Team[];
  childTeams: Team[];
  isDirectCategory: (teamId: string) => boolean;
};

const inputStyle: React.CSSProperties = {
  padding: '14px 16px', borderRadius: 14, border: '1px solid #cfd8e3',
  fontSize: 16, lineHeight: 1.35, minHeight: 56, outline: 'none',
  background: 'white', color: '#1b2430', caretColor: '#0A5FB5',
  width: '100%', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: 42, WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontWeight: 700, color: '#1b2430',
};

const formCardStyle: React.CSSProperties = {
  border: '1px solid #d8e5f2', borderRadius: 20, padding: 18, background: '#f8fbff', marginBottom: 16,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16,
};

export default function ChildBlock({
  label, mode, setMode,
  existingId, setExistingId,
  teamId, setTeamId,
  firstName, setFirstName,
  lastName, setLastName,
  birthDate, setBirthDate,
  players, teams, childTeams, isDirectCategory,
}: Props) {

  const filteredPlayers = teamId
    ? players.filter((p) => p.team_id === teamId)
    : players.filter((p) => !isDirectCategory(p.team_id));

  const selectedPlayer = players.find((p) => p.id === existingId);

  const playerAge = selectedPlayer?.birth_date
    ? Math.floor((Date.now() - new Date(selectedPlayer.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div style={formCardStyle}>
      <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>{label}</h4>

      {/* Toggle existing / nouveau */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => { setMode('existing'); setFirstName(''); setLastName(''); }}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
            background: mode === 'existing' ? '#0A5FB5' : '#e5eef8',
            color: mode === 'existing' ? 'white' : '#12304f',
            fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}
        >
          Joueur existant
        </button>
        <button
          type="button"
          onClick={() => { setMode('new'); setExistingId(''); }}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
            background: mode === 'new' ? '#0A5FB5' : '#e5eef8',
            color: mode === 'new' ? 'white' : '#12304f',
            fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}
        >
          Nouveau joueur
        </button>
      </div>

      {mode === 'existing' ? (
        <div>
          {/* Filtre équipe */}
          <label style={labelStyle}>Filtrer par équipe</label>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <select
              value={teamId}
              onChange={(e) => { setTeamId(e.target.value); setExistingId(''); }}
              style={selectStyle}
            >
              <option value="">-- Toutes les équipes --</option>
              {childTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5b6472' }}>▾</span>
          </div>

          {/* Sélection joueur */}
          <label style={labelStyle}>Sélectionner le joueur *</label>
          <div style={{ position: 'relative' }}>
            <select
              value={existingId}
              onChange={(e) => {
                setExistingId(e.target.value);
                const sel = players.find((p) => p.id === e.target.value);
                if (sel?.birth_date) setBirthDate(sel.birth_date);
              }}
              style={selectStyle}
            >
              <option value="">-- Choisir un joueur --</option>
              {[...filteredPlayers]
                .sort((a, b) => a.last_name.localeCompare(b.last_name))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.last_name.toUpperCase()} {p.first_name} — {teams.find((t) => t.id === p.team_id)?.name || ''}
                  </option>
                ))}
            </select>
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5b6472' }}>▾</span>
          </div>

          {filteredPlayers.length === 0 && (
            <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: 13 }}>
              Aucun joueur dans cette équipe. Utilisez "Nouveau joueur".
            </p>
          )}

          {/* Infos joueur sélectionné */}
          {selectedPlayer && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#eaf4ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
              <div style={{ fontWeight: 800, color: '#062C5D', fontSize: 14 }}>
                👤 {selectedPlayer.first_name} {selectedPlayer.last_name}
              </div>
              <div style={{ fontSize: 13, color: '#5b6472', marginTop: 4 }}>
                🏅 {teams.find((t) => t.id === selectedPlayer.team_id)?.name || 'Équipe inconnue'}
                {playerAge !== null ? ` · ${playerAge} ans` : ''}
              </div>
            </div>
          )}

          {/* Date de naissance si absente */}
          {existingId && !selectedPlayer?.birth_date && (
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>
                📅 Date de naissance{' '}
                <span style={{ color: '#dc2626', fontSize: 12 }}>(non renseignée — veuillez compléter)</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={inputStyle}
                max="2025-12-31"
              />
            </div>
          )}
        </div>
      ) : (
        /* Mode nouveau joueur */
        <div style={formGridStyle}>
          <div>
            <label style={labelStyle}>Prénom *</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={inputStyle}
              placeholder="Prénom"
            />
          </div>
          <div>
            <label style={labelStyle}>Nom *</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
              placeholder="Nom"
            />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Équipe *</label>
            <div style={{ position: 'relative' }}>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Choisir l'équipe --</option>
                {childTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5b6472' }}>▾</span>
            </div>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Date de naissance</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={inputStyle}
              max="2025-12-31"
            />
          </div>
        </div>
      )}
    </div>
  );
}
