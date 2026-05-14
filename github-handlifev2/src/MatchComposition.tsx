import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  photo_url: string | null;
  jersey_number: number | null;
};

type HandballPosition =
  | 'gardien' | 'ailier_gauche' | 'ailier_droit'
  | 'arriere_gauche' | 'demi_centre' | 'arriere_droit'
  | 'pivot'
  | 'remplacant_1' | 'remplacant_2' | 'remplacant_3'
  | 'remplacant_4' | 'remplacant_5' | 'remplacant_6';

type PhaseKey = 'attaque' | 'defense';

const EMPTY: Record<HandballPosition, string | null> = {
  gardien: null, ailier_gauche: null, ailier_droit: null,
  arriere_gauche: null, demi_centre: null, arriere_droit: null, pivot: null,
  remplacant_1: null, remplacant_2: null, remplacant_3: null,
  remplacant_4: null, remplacant_5: null, remplacant_6: null,
};

const POS_LABEL: Record<HandballPosition, string> = {
  gardien: 'Gardien', ailier_gauche: 'Ailier G.', ailier_droit: 'Ailier D.',
  arriere_gauche: 'Arrière G.', demi_centre: 'Demi-centre', arriere_droit: 'Arrière D.', pivot: 'Pivot',
  remplacant_1: 'Remplaçant 1', remplacant_2: 'Remplaçant 2', remplacant_3: 'Remplaçant 3',
  remplacant_4: 'Remplaçant 4', remplacant_5: 'Remplaçant 5', remplacant_6: 'Remplaçant 6',
};

const REMPLACANT_KEYS: HandballPosition[] = [
  'remplacant_1','remplacant_2','remplacant_3',
  'remplacant_4','remplacant_5','remplacant_6',
];

// ── POSITIONS ATTAQUE ── buts à gauche, attaque vers droite
// Arrières proches de la zone 9m, pivot devant zone 6m adverse, demi-centre plus loin
type PosEntry = { key: HandballPosition; label: string; shortLabel: string; x: number; y: number };

const ATTAQUE_POSITIONS: PosEntry[] = [
  { key: 'gardien',        label: 'Gardien',    shortLabel: 'G',   x: 13,  y: 50 },
  { key: 'ailier_gauche',  label: 'Ailier G.',  shortLabel: 'AG',  x: 45,  y: 9  },
  { key: 'ailier_droit',   label: 'Ailier D.',  shortLabel: 'AD',  x: 45,  y: 90 },
  { key: 'arriere_gauche', label: 'Arrière G.', shortLabel: 'ArG', x: 70,  y: 22 },
  { key: 'demi_centre',    label: 'Demi-centre',shortLabel: 'DC',  x: 80,  y: 50 },
  { key: 'arriere_droit',  label: 'Arrière D.', shortLabel: 'ArD', x: 70,  y: 78 },
  { key: 'pivot',          label: 'Pivot',      shortLabel: 'P',   x: 50,  y: 50 },
];

// ── Systèmes défensifs — positions à ajuster directement ici ──────────────
// Toutes les variantes partagent le même gardien
const DEF_GARDIEN: PosEntry = { key: 'gardien', label: 'Gardien', shortLabel: 'G', x: 13, y: 50 };

// 6-0 : 6 défenseurs en ligne, tous sur la zone des 6m
const DEFENSE_6_0: PosEntry[] = [
  DEF_GARDIEN,
  { key: 'ailier_gauche',  label: 'Ailier G.',  shortLabel: 'AG',  x: 35,  y: 10 },
  { key: 'ailier_droit',   label: 'Ailier D.',  shortLabel: 'AD',  x: 35,  y: 90 },
  { key: 'arriere_gauche', label: 'Arrière G.', shortLabel: 'ArG', x: 46,  y: 25 },
  { key: 'demi_centre',    label: 'Demi-centre',shortLabel: 'DC',  x: 51,  y: 40 },
  { key: 'arriere_droit',  label: 'Arrière D.', shortLabel: 'ArD', x: 46,  y: 75 },
  { key: 'pivot',          label: 'Pivot',      shortLabel: 'P',   x: 51,  y: 60 },
];

// 5-1 : 5 défenseurs sur la zone + 1 avancé (demi-centre sort)
const DEFENSE_5_1: PosEntry[] = [
  DEF_GARDIEN,
  { key: 'ailier_gauche',  label: 'Ailier G.',  shortLabel: 'AG',  x: 35,  y: 10 },
  { key: 'ailier_droit',   label: 'Ailier D.',  shortLabel: 'AD',  x: 35,  y: 90 },
  { key: 'arriere_gauche', label: 'Arrière G.', shortLabel: 'ArG', x: 46,  y: 28 },
  { key: 'demi_centre',    label: 'Demi-centre',shortLabel: 'DC',  x: 49,  y: 50 }, // sorti
  { key: 'arriere_droit',  label: 'Arrière D.', shortLabel: 'ArD', x: 46,  y: 72 },
  { key: 'pivot',          label: 'Pivot',      shortLabel: 'P',   x: 66,  y: 50 },
];

// 4-2 : 4 défenseurs sur la zone + 2 avancés
const DEFENSE_4_2: PosEntry[] = [
  DEF_GARDIEN,
  { key: 'ailier_gauche',  label: 'Ailier G.',  shortLabel: 'AG',  x: 35,  y: 10 },
  { key: 'ailier_droit',   label: 'Ailier D.',  shortLabel: 'AD',  x: 35,  y: 90 },
  { key: 'arriere_gauche', label: 'Arrière G.', shortLabel: 'ArG', x: 46,  y: 35 },
  { key: 'demi_centre',    label: 'Demi-centre',shortLabel: 'DC',  x: 62,  y: 35 }, // avancé gauche
  { key: 'arriere_droit',  label: 'Arrière D.', shortLabel: 'ArD', x: 46,  y: 65 },
  { key: 'pivot',          label: 'Pivot',      shortLabel: 'P',   x: 62,  y: 65 }, // avancé droit
];

// 3-3 : 3 sur zone + 3 en avant
const DEFENSE_3_3: PosEntry[] = [
  DEF_GARDIEN,
  { key: 'ailier_gauche',  label: 'Ailier G.',  shortLabel: 'AG',  x: 44,  y: 26 },
  { key: 'ailier_droit',   label: 'Ailier D.',  shortLabel: 'AD',  x: 44,  y: 74 },
  { key: 'arriere_gauche', label: 'Arrière G.', shortLabel: 'ArG', x: 62,  y: 26 }, // ligne basse
  { key: 'demi_centre',    label: 'Demi-centre',shortLabel: 'DC',  x: 49,  y: 50 }, // ligne haute
  { key: 'arriere_droit',  label: 'Arrière D.', shortLabel: 'ArD', x: 62,  y: 74 }, // ligne haute
  { key: 'pivot',          label: 'Pivot',      shortLabel: 'P',   x: 70,  y: 50 }, // ligne haute
];

type DefenseSystem = '6-0' | '5-1' | '4-2' | '3-3';

const DEFENSE_SYSTEMS: Record<DefenseSystem, { label: string; desc: string; positions: PosEntry[] }> = {
  '6-0': { label: '6-0',  desc: '6 défenseurs sur la zone',          positions: DEFENSE_6_0 },
  '5-1': { label: '5-1',  desc: '5 sur zone + 1 avancé',             positions: DEFENSE_5_1 },
  '4-2': { label: '4-2',  desc: '4 sur zone + 2 avancés',            positions: DEFENSE_4_2 },
  '3-3': { label: '3-3',  desc: '3 sur zone + 3 en avant',           positions: DEFENSE_3_3 },
};

type AssignmentMap = Record<HandballPosition, string | null>;
type FullAssignments = { attaque: AssignmentMap; defense: AssignmentMap };

interface Props {
  matchId: string;
  teamId: string;
  players: Player[];
  squadIds?: string[];
  isCoach?: boolean;
}

function initials(p: Player) {
  return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
}

// ── Composant principal ──────────────────────────────────────────────────────
export default function MatchComposition({ matchId, teamId, players, squadIds, isCoach }: Props) {
  const [phase, setPhase] = useState<PhaseKey>('attaque');
  const [defenseSystem, setDefenseSystem] = useState<DefenseSystem>('6-0');
  const [assignments, setAssignments] = useState<FullAssignments>({
    attaque: { ...EMPTY }, defense: { ...EMPTY },
  });
  const [selectedPos, setSelectedPos] = useState<HandballPosition | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const available = squadIds && squadIds.length > 0
    ? players.filter(p => squadIds.includes(p.id))
    : players;

  const currentAssign = assignments[phase];
  const placedIds = new Set(Object.values(currentAssign).filter(Boolean) as string[]);

  useEffect(() => { if (matchId) load(); }, [matchId, teamId]);
  // Ferme le sélecteur quand on change de phase
  useEffect(() => { setSelectedPos(null); }, [phase]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase.from('match_compositions')
        .select('*').eq('match_id', matchId).eq('team_id', teamId).maybeSingle();
      if (data?.assignments) {
        // Support ancien format (flat) et nouveau (attaque/defense)
        const d = data.assignments;
        if (d.attaque || d.defense) {
          setAssignments({
            attaque: { ...EMPTY, ...d.attaque },
            defense: { ...EMPTY, ...d.defense },
          });
        } else {
          // Migration depuis ancien format plat → attaque
          setAssignments({ attaque: { ...EMPTY, ...d }, defense: { ...EMPTY } });
        }
      } else {
        setAssignments({ attaque: { ...EMPTY }, defense: { ...EMPTY } });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      await supabase.from('match_compositions').upsert(
        { match_id: matchId, team_id: teamId, assignments, updated_at: new Date().toISOString() },
        { onConflict: 'match_id,team_id' }
      );
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Erreur sauvegarde'); }
    finally { setSaving(false); }
  }

  function assign(pos: HandballPosition, pid: string | null) {
    setAssignments(prev => {
      const next = { ...prev[phase] };
      if (pid) (Object.keys(next) as HandballPosition[]).forEach(k => { if (next[k] === pid) next[k] = null; });
      next[pos] = pid;
      return { ...prev, [phase]: next };
    });
    setSelectedPos(null);
    setSaved(false);
  }

  function clearPhase() {
    setAssignments(prev => ({ ...prev, [phase]: { ...EMPTY } }));
    setSaved(false);
  }

  // Copie les assignations de l'autre phase vers la phase courante
  function copyFromOther() {
    const other: PhaseKey = phase === 'attaque' ? 'defense' : 'attaque';
    setAssignments(prev => ({ ...prev, [phase]: { ...prev[other] } }));
    setSaved(false);
  }

  function byId(id: string | null) { return id ? players.find(p => p.id === id) || null : null; }

  const positions = phase === 'attaque'
    ? ATTAQUE_POSITIONS
    : DEFENSE_SYSTEMS[defenseSystem].positions;

  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: '#5b6472' }}>⏳ Chargement...</div>;

  const unplaced = available.filter(p => !placedIds.has(p.id));

  return (
    <div style={{ fontFamily: 'Arial,sans-serif' }}>
      {/* ── Tabs Attaque / Défense ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 0, background: '#f1f5f9', borderRadius: 14, padding: 4 }}>
          {(['attaque', 'defense'] as PhaseKey[]).map(ph => (
            <button key={ph} onClick={() => setPhase(ph)}
              style={{
                padding: '9px 22px', borderRadius: 11, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 14, transition: 'all 0.18s',
                background: phase === ph ? (ph === 'attaque' ? '#0A5FB5' : '#16a34a') : 'transparent',
                color: phase === ph ? 'white' : '#64748b',
                boxShadow: phase === ph ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}>
              {ph === 'attaque' ? '⚔️ Attaque' : '🛡 Défense'}
            </button>
          ))}
        </div>

        {/* Système défensif — visible seulement en mode défense */}
        {phase === 'defense' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Système :</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.keys(DEFENSE_SYSTEMS) as DefenseSystem[]).map(sys => (
                <button key={sys} onClick={() => setDefenseSystem(sys)}
                  style={{
                    padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 800, fontSize: 13, transition: 'all 0.15s',
                    background: defenseSystem === sys ? '#16a34a' : '#e2e8f0',
                    color: defenseSystem === sys ? 'white' : '#374151',
                    boxShadow: defenseSystem === sys ? '0 2px 6px rgba(22,163,74,0.35)' : 'none',
                  }}
                  title={DEFENSE_SYSTEMS[sys].desc}>
                  {sys}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
              {DEFENSE_SYSTEMS[defenseSystem].desc}
            </span>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      {isCoach && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <p style={{ margin: 0, color: '#5b6472', fontSize: 13 }}>
            👆 Cliquez sur une position pour assigner un joueur.
          </p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={copyFromOther}
              style={{ padding: '8px 13px', borderRadius: 10, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              📋 Copier depuis {phase === 'attaque' ? 'défense' : 'attaque'}
            </button>
            <button onClick={clearPhase}
              style={{ padding: '8px 13px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff1f1', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
              🗑 Effacer
            </button>
            <button onClick={save} disabled={saving}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: saved ? '#16a34a' : '#0A5FB5', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 12, opacity: saving ? 0.8 : 1 }}>
              {saving ? '...' : saved ? '✅ Enregistré' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {/* ── TERRAIN ── */}
        <div style={{ flex: '2 1 320px', minWidth: 280 }}>
          <PitchSVG
            positions={positions}
            assignments={currentAssign}
            players={players}
            phase={phase}
            selectedPos={selectedPos}
            onSelect={isCoach ? setSelectedPos : undefined}
            onClear={isCoach ? pos => assign(pos, null) : undefined}
          />
        </div>

        {/* ── PANNEAU ── */}
        <div style={{ flex: '1 1 190px', minWidth: 185, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Sélecteur joueur */}
          {isCoach && selectedPos && (
            <div style={{ background: '#eaf4ff', border: '2px solid #0A5FB5', borderRadius: 15, padding: 12 }}>
              <div style={{ fontWeight: 800, color: '#0A5FB5', fontSize: 13, marginBottom: 9 }}>
                👆 {POS_LABEL[selectedPos]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 230, overflowY: 'auto' }}>
                <button onClick={() => assign(selectedPos, null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 9, border: '1px dashed #d1d5db', background: 'white', cursor: 'pointer', fontSize: 12, color: '#6b7280', fontWeight: 600 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>✕</span>
                  Retirer
                </button>
                {available.map(p => {
                  const placed = placedIds.has(p.id) && currentAssign[selectedPos] !== p.id;
                  const current = currentAssign[selectedPos] === p.id;
                  return (
                    <button key={p.id} onClick={() => !placed && assign(selectedPos, p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 9,
                        border: current ? '2px solid #0A5FB5' : '1px solid #e2e8f0',
                        background: current ? '#dbeafe' : placed ? '#f9fafb' : 'white',
                        cursor: placed ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700,
                        color: placed ? '#9ca3af' : '#10233b', opacity: placed ? 0.5 : 1, textAlign: 'left' as const,
                      }}>
                      <Av player={p} size={24} />
                      <span style={{ flex: 1 }}>
                        {p.first_name} {p.last_name}
                        {p.jersey_number != null && <span style={{ marginLeft: 4, fontSize: 10, color: '#6b7280' }}>#{p.jersey_number}</span>}
                      </span>
                      {placed && <span style={{ fontSize: 10, color: '#9ca3af' }}>placé</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remplaçants */}
          <div style={{ background: '#f8fbff', border: '1px solid #d8e5f2', borderRadius: 15, padding: 12 }}>
            <div style={{ fontWeight: 800, color: '#0f2743', fontSize: 13, marginBottom: 8 }}>🔄 Remplaçants</div>
            {REMPLACANT_KEYS.map(key => {
              const p = byId(currentAssign[key]);
              const sel = selectedPos === key;
              return (
                <div key={key} onClick={() => isCoach && setSelectedPos(sel ? null : key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '6px 9px', borderRadius: 9, marginBottom: 5,
                    cursor: isCoach ? 'pointer' : 'default',
                    border: sel ? '2px solid #0A5FB5' : '1px solid #e2e8f0',
                    background: sel ? '#eaf4ff' : 'white',
                  }}>
                  <Av player={p} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {p
                      ? <div style={{ fontWeight: 700, fontSize: 12, color: '#10233b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.first_name} {p.last_name}</div>
                      : <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>Libre</div>}
                  </div>
                  {isCoach && p && (
                    <button onClick={e => { e.stopPropagation(); assign(key, null); }}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 13, padding: 2, flexShrink: 0 }}>✕</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Non placés */}
          {unplaced.length > 0 && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 13, padding: 11 }}>
              <div style={{ fontWeight: 800, color: '#92400e', fontSize: 12, marginBottom: 6 }}>👤 Non placés ({unplaced.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {unplaced.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 999, background: '#fed7aa', fontSize: 11, fontWeight: 700, color: '#92400e' }}>
                    <Av player={p} size={16} />{p.first_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Légende */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#166534', marginBottom: 5 }}>
              📋 {phase === 'attaque' ? '⚔️ Attaque' : '🛡 Défense'}
            </div>
            {positions.filter(pos => !REMPLACANT_KEYS.includes(pos.key)).map(pos => {
              const p = byId(currentAssign[pos.key]);
              return (
                <div key={pos.key} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: pos.key === 'gardien' ? '#f97316' : pos.key === 'pivot' ? '#7c3aed' : '#0A5FB5' }} />
                  <span style={{ fontWeight: 700, color: '#374151', minWidth: 64 }}>{pos.label}</span>
                  <span style={{ color: p ? '#0A5FB5' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p ? `${p.first_name} ${p.last_name}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Av({ player: p, size: s }: { player: Player | null; size: number }) {
  const fs = Math.round(s * 0.36);
  if (!p) return <div style={{ width: s, height: s, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, color: '#9ca3af', flexShrink: 0 }}>?</div>;
  if (p.photo_url) return <img src={p.photo_url} alt="" style={{ width: s, height: s, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid white' }} />;
  return <div style={{ width: s, height: s, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, color: 'white', fontWeight: 800, flexShrink: 0 }}>{initials(p)}</div>;
}

// ── Terrain SVG ───────────────────────────────────────────────────────────────
interface PitchProps {
  positions: { key: HandballPosition; label: string; shortLabel: string; x: number; y: number }[];
  assignments: Record<HandballPosition, string | null>;
  players: Player[];
  phase: PhaseKey;
  selectedPos: HandballPosition | null;
  onSelect?: (pos: HandballPosition) => void;
  onClear?: (pos: HandballPosition) => void;
}

function PitchSVG({ positions, assignments, players, phase, selectedPos, onSelect, onClear }: PitchProps) {
  const R = 5.2;
  const isDefense = phase === 'defense';

  function getP(pos: HandballPosition) {
    const id = assignments[pos];
    return id ? players.find(p => p.id === id) || null : null;
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(10,95,181,0.22)', border: `2px solid ${isDefense ? '#16a34a' : '#0A5FB5'}` }}>
      <svg viewBox="0 0 160 100" style={{ display: 'block', width: '100%' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="parq2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8924a" />
            <stop offset="100%" stopColor="#c97030" />
          </linearGradient>
          <linearGradient id="zone2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e50b8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          {positions.map(pos => (
            <clipPath key={`cp2-${pos.key}`} id={`cp2-${pos.key}`}>
              <circle cx={pos.x} cy={pos.y} r={R} />
            </clipPath>
          ))}
        </defs>

        {/* Fond salle */}
        <rect x="0" y="0" width="160" height="100" fill="#1a2535" />

        {/* Parquet */}
        <rect x="2" y="2" width="156" height="96" rx="1.5" fill="url(#parq2)" />

        {/* Zone bleue 6m — demi-cercle centré x=2, y=50, r=42 */}
        <path d="M 2 8 A 42 42 0 0 1 2 92 L 2 8 Z" fill="url(#zone2)" />
        <path d="M 2 8 A 42 42 0 0 1 2 92" fill="none" stroke="white" strokeWidth="1.1" opacity="0.95" />

        {/* Zone 9m — pointillés, r=62 */}
        <path d="M 2 -12 A 62 62 0 0 1 2 112" fill="none" stroke="white" strokeWidth="0.65" strokeDasharray="3.5 2.5" opacity="0.65" />

        {/* Buts (gauche) */}
        <rect x="0" y="38" width="3.5" height="24" fill="white" opacity="0.97" />
        {[41, 44, 47, 50, 53, 56, 59].map(y => (
          <line key={y} x1="0.5" y1={y} x2="3" y2={y} stroke="#ccc" strokeWidth="0.3" opacity="0.6" />
        ))}
        <line x1="2" y1="39" x2="2" y2="61" stroke="#ccc" strokeWidth="0.3" opacity="0.6" />

        {/* Point pénalty (7m) */}
        <circle cx="9" cy="50" r="0.9" fill="white" opacity="0.9" />

        {/* Ligne fond (droite) */}
        <line x1="158" y1="2" x2="158" y2="98" stroke="white" strokeWidth="0.7" opacity="0.8" />

        {/* Bordure */}
        <rect x="2" y="2" width="156" height="96" rx="1.5" fill="none" stroke="white" strokeWidth="0.85" opacity="0.9" />

        {/* Label phase */}
        <rect x="100" y="4" width="54" height="7" rx="3.5"
          fill={isDefense ? 'rgba(22,163,74,0.8)' : 'rgba(10,95,181,0.8)'} />
        <text x="127" y="8.3" textAnchor="middle" dominantBaseline="middle" fontSize="3.8" fill="white" fontWeight="800" style={{ userSelect: 'none' }}>
          {isDefense ? '🛡 Défense' : '⚔️ Attaque →'}
        </text>

        {/* Label buts */}
        <rect x="3.5" y="43" width="13" height="5" rx="2.5" fill="rgba(0,0,0,0.45)" />
        <text x="10" y="46" textAnchor="middle" dominantBaseline="middle" fontSize="2.8" fill="rgba(255,255,255,0.9)" style={{ userSelect: 'none' }}>Buts</text>

        {/* ── JOUEURS ── */}
        {positions.map(pos => {
          const p = getP(pos.key);
          const sel = selectedPos === pos.key;
          const isG = pos.key === 'gardien';
          const isPiv = pos.key === 'pivot';
          const col = isG ? '#f97316' : isPiv ? '#7c3aed' : (isDefense ? '#15803d' : '#1d4ed8');

          return (
            <g key={pos.key} style={{ cursor: onSelect ? 'pointer' : 'default' }}
              onClick={() => onSelect && onSelect(pos.key)}>

              {/* Halo sélection */}
              {sel && <circle cx={pos.x} cy={pos.y} r={R + 3}
                fill="rgba(250,204,21,0.28)" stroke="#facc15" strokeWidth="1" />}

              {/* Ombre */}
              <ellipse cx={pos.x + 0.4} cy={pos.y + R + 0.3} rx={R * 0.7} ry="1" fill="rgba(0,0,0,0.28)" />

              {/* Token */}
              {p?.photo_url ? (
                <>
                  <image href={p.photo_url}
                    x={pos.x - R} y={pos.y - R} width={R * 2} height={R * 2}
                    clipPath={`url(#cp2-${pos.key})`} preserveAspectRatio="xMidYMid slice" />
                  <circle cx={pos.x} cy={pos.y} r={R} fill="none"
                    stroke={sel ? '#facc15' : 'white'} strokeWidth={sel ? 1.4 : 0.9} />
                </>
              ) : (
                <>
                  <circle cx={pos.x} cy={pos.y} r={R}
                    fill={p ? col : 'rgba(255,255,255,0.18)'}
                    stroke={sel ? '#facc15' : p ? 'white' : 'rgba(255,255,255,0.5)'}
                    strokeWidth={sel ? 1.4 : 0.8}
                    strokeDasharray={p ? undefined : '2 1.4'} />
                  {p && <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                    fontSize="3.6" fontWeight="900" fill="white" style={{ userSelect: 'none' }}>
                    {initials(p)}
                  </text>}
                </>
              )}

              {/* Badge numéro */}
              {p?.jersey_number != null && (
                <>
                  <circle cx={pos.x + R - 1.3} cy={pos.y - R + 1.3} r={2.3}
                    fill={isG ? '#ea580c' : isPiv ? '#6d28d9' : (isDefense ? '#166534' : '#1e3a8a')}
                    stroke="white" strokeWidth="0.4" />
                  <text x={pos.x + R - 1.3} y={pos.y - R + 1.9} textAnchor="middle" dominantBaseline="middle"
                    fontSize="2.1" fontWeight="800" fill="white" style={{ userSelect: 'none' }}>
                    {p.jersey_number}
                  </text>
                </>
              )}

              {/* Bouton retirer */}
              {sel && p && onClear && (
                <g onClick={e => { e.stopPropagation(); onClear(pos.key); }} style={{ cursor: 'pointer' }}>
                  <circle cx={pos.x - R + 1.3} cy={pos.y - R + 1.3} r={2.4} fill="#dc2626" stroke="white" strokeWidth="0.5" />
                  <text x={pos.x - R + 1.3} y={pos.y - R + 1.9} textAnchor="middle" dominantBaseline="middle"
                    fontSize="3.8" fontWeight="900" fill="white" style={{ userSelect: 'none' }}>×</text>
                </g>
              )}

              {/* Étiquette */}
              <rect x={pos.x - 9.5} y={pos.y + R + 0.7} width={19} height={5} rx={2.5}
                fill={p ? (isDefense ? 'rgba(5,46,22,0.88)' : 'rgba(6,30,70,0.88)') : 'rgba(0,0,0,0.4)'} />
              <text x={pos.x} y={pos.y + R + 3.5} textAnchor="middle" dominantBaseline="middle"
                fontSize="2.7" fontWeight="700" fill="white" style={{ userSelect: 'none' }}>
                {p ? p.first_name.substring(0, 9) : pos.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
