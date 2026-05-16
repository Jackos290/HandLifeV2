import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import Calendar from './Calendar';
import MatchComposition from './MatchComposition';
import HandLifeLogo from './HandLifeLogo';
import { GRADES, PlayerCard, FifaPlayerCard, FullScreenCard, GradeModal, computeGrade, POSITIONS, HANDBALL_POWERS } from './PlayerGrades';

type Team = {
  id: string;
  name: string;
  category: string;
  stats_hidden_for_parents?: boolean | null;
};

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  team_id: string;
  birth_date: string | null;
  photo_url: string | null;
  jersey_number: number | null;
  position: string | null;
  gender?: 'male' | 'female' | null;
  card_powers?: string[] | null;
};

type MatchItem = {
  id: string;
  opponent: string;
  match_date: string;
  location: string;
  home_away: string;
  team_id: string;
  score_home: string | number | null;
  score_away: string | number | null;
  fdm_url?: string | null;
  supporter_summary?: string | null;
};

type CoachAccess = {
  id: string;
  coach_code: string;
  first_name: string;
  last_name: string;
  team_id: string;
  photo_url: string | null;
};

type AdminDelegate = {
  id: string;
  target_type: 'user' | 'coach';
  target_id: string;
  created_at: string;
};

type MatchAttendance = {
  id: string;
  match_id: string;
  player_id: string;
  status: 'present' | 'absent' | 'unknown';
};

type PlayerStat = {
  id: string;
  player_id: string;
  goals: number;
  assists: number;
  saves: number;
  matches_played: number;
};

type MatchPlayerStat = {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  shots: number;
  saves: number;
  penalty_scored: number;
  two_minutes: number;
  assists?: number;
};

type UserItem = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  parent_pin: string;
  auth_id?: string | null;
  is_active?: boolean;
};

type ParentPlayerLink = {
  id: string;
  parent_id: string;
  player_id: string;
};

type PlayerSeasonAssignment = {
  id: string;
  player_id: string;
  season_id: string;
  team_id: string;
  status: 'draft' | 'confirmed';
  created_at?: string;
  updated_at?: string;
};

type TrainingTemplate = {
  id: string;
  team_id: string;
  title: string;
  weekday: number;
  start_time: string;
  end_time: string;
  location: string;
  active: boolean;
};

type TrainingAttendance = {
  id: string;
  training_template_id: string;
  player_id: string;
  training_date: string;
  status: 'present' | 'absent' | 'unknown';
};

type TrainingCancellation = {
  id: string;
  training_template_id: string;
  training_date: string;
  reason: string | null;
  cancelled_by: string | null;
  created_at: string;
};

type TrainingBreak = {
  id: string;
  team_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
};

type UpcomingTraining = {
  templateId: string;
  teamId: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  location: string;
  date: string;
  cancelled?: boolean;
  cancellationReason?: string | null;
};

// CoachTab — 'admin' seulement visible pour isAdmin
type CoachTab = 'trainings' | 'matches' | 'stats' | 'composition' | 'players' | 'users' | 'messages' | 'licenses' | 'team' | 'accessibility' | 'admin' | 'password' | 'events' | 'polls';

type Sponsor = {
  id: string;
  name: string;
  photo_url: string;
  website_url: string | null;
  active: boolean;
  display_order: number;
};

type Conversation = {
  id: string;
  team_id: string;
  parent_id: string | null;
  is_group: boolean;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_type: 'coach' | 'parent';
  sender_id: string;
  content: string;
  created_at: string;
};

type UserPresence = {
  id: string;
  auth_id: string;
  role: string;
  display_name: string | null;
  last_seen: string;
};

type ConnectionHistory = {
  id?: string;
  auth_id: string;
  role: string;
  display_name: string | null;
  seen_at: string;
};

type Poll = {
  id: string;
  question: string;
  description: string | null;
  external_url?: string | null;
  questions?: PollQuestion[] | null;
  team_ids: string[];
  created_by: string | null;
  closed: boolean;
  multiple_choice: boolean;
  created_at: string;
};

type PollQuestion = {
  id: string;
  question: string;
  options: string[];
  multiple_choice: boolean;
};

type PollOption = {
  id: string;
  poll_id: string;
  question_key?: string | null;
  label: string;
  display_order: number;
};

type PollVote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_user_id: string | null;
  voter_player_id: string | null;
  voter_label: string | null;
  created_at: string;
};

type EventFormQuestion = {
  id: string;
  event_id: string;
  question: string;
  type: 'text' | 'yesno' | 'choice' | 'multi';
  choices: string[] | null;
  required: boolean;
  display_order: number;
  created_at: string;
};

type EventFormResponse = {
  id: string;
  event_id: string;
  question_id: string;
  player_id: string | null;
  responder_user_id: string | null;
  responder_label: string | null;
  answer: string | null;
  created_at: string;
  updated_at: string;
};

// ADMIN_CODE supprimé — auth via Supabase
const PRESENCE_ONLINE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const CLUB_LOGO = `data:image/png;base64,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`;

// ─── MatchStatsTable ─ tableau groupé avec validation globale ────────────────────
type ClubEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  type: string;
  team_ids: string[];
  payment_link: string | null;
  created_at: string;
};

type EventAttendance = {
  id: string;
  event_id: string;
  player_id: string;
  status: 'present' | 'absent' | 'pending';
  responded_by: string;
  responded_at: string | null;
};

type PlayerStatRow = {
  playerId: string;
  playerName: string;
  goals: number;
  assists: number;
  shots: number;
  saves: number;
  penalty_scored: number;
  two_minutes: number;
};

function MatchStatsTable({
  players: squadPlayers,
  initialStats,
  onSaveAll,
  isCoach,
}: {
  players: { id: string; name: string }[];
  initialStats: Record<string, { goals: number; assists: number; shots: number; saves: number; penalty_scored: number; two_minutes: number }>;
  onSaveAll: (rows: PlayerStatRow[]) => Promise<void>;
  isCoach?: boolean;
}) {
  const squadKey = squadPlayers.map((p) => p.id).join(',');
  const [fullscreen, setFullscreen] = useState(false);
  const [rows, setRows] = useState<PlayerStatRow[]>(() =>
    squadPlayers.map((p) => ({
      playerId: p.id, playerName: p.name,
      goals: initialStats[p.id]?.goals || 0,
      assists: initialStats[p.id]?.assists || 0,
      shots: initialStats[p.id]?.shots || 0,
      saves: initialStats[p.id]?.saves || 0, penalty_scored: initialStats[p.id]?.penalty_scored || 0,
      two_minutes: initialStats[p.id]?.two_minutes || 0,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRows(squadPlayers.map((p) => ({
      playerId: p.id, playerName: p.name,
      goals: initialStats[p.id]?.goals || 0,
      assists: initialStats[p.id]?.assists || 0,
      shots: initialStats[p.id]?.shots || 0,
      saves: initialStats[p.id]?.saves || 0, penalty_scored: initialStats[p.id]?.penalty_scored || 0,
      two_minutes: initialStats[p.id]?.two_minutes || 0,
    })));
    setSaved(false);
  }, [squadKey]);

  function updateCell(idx: number, field: keyof Omit<PlayerStatRow, 'playerId' | 'playerName'>, value: number) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: Math.max(0, value) } : r));
    setSaved(false);
  }

  async function handleSaveAll() {
    setSaving(true);
    try { await onSaveAll(rows); setSaved(true); }
    finally { setSaving(false); }
  }

  const cols: { key: keyof Omit<PlayerStatRow, 'playerId' | 'playerName'>; label: string; bg: string }[] = [
    { key: 'goals', label: 'Buts', bg: '#dbeafe' },
    { key: 'shots', label: 'Tirs', bg: '#ede9fe' },
    { key: 'saves', label: 'Arrêts', bg: '#d1fae5' },
    { key: 'penalty_scored', label: 'Pen.', bg: '#fef3c7' },
    { key: 'two_minutes', label: '2 min', bg: '#fee2e2' },
  ];
  const totals = cols.reduce((acc, c) => ({ ...acc, [c.key]: rows.reduce((s, r) => s + (r[c.key] || 0), 0) }), {} as Record<string, number>);

  const tableContent = (big: boolean) => (
    <div>
      <div style={{ overflowX: 'auto', marginBottom: 16, borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: big ? 16 : 14 }}>
          <thead>
            <tr style={{ background: '#0A5FB5', color: 'white' }}>
              <th style={{ padding: big ? '12px 16px' : '10px 14px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>Joueur</th>
              {cols.map((c) => (
                <th key={c.key} style={{ padding: big ? '12px 14px' : '10px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.label}</th>
              ))}
              {isCoach && <th style={{ padding: big ? '12px 14px' : '10px 10px', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap', background: '#7c3aed' }}>% Tir</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const shootPct = row.shots > 0 ? Math.round((row.goals / row.shots) * 100) : 0;
              return (
                <tr key={row.playerId} style={{ background: idx % 2 === 0 ? 'white' : '#f5f8fd' }}>
                  <td style={{ padding: big ? '10px 16px' : '8px 14px', fontWeight: 700, whiteSpace: 'nowrap', borderBottom: '1px solid #e8eef5' }}>{row.playerName}</td>
                  {cols.map((c) => (
                    <td key={c.key} style={{ padding: big ? '8px 10px' : '6px 8px', textAlign: 'center', borderBottom: '1px solid #e8eef5' }}>
                      <input type="number" min={0} value={row[c.key]}
                        onChange={(e) => updateCell(idx, c.key, Number(e.target.value))}
                        style={{ width: big ? 72 : 58, textAlign: 'center', padding: big ? '8px 4px' : '6px 4px', border: '1px solid #cfd8e3', borderRadius: 8, fontSize: big ? 16 : 14, background: c.bg, fontWeight: 700, outline: 'none' }}
                      />
                    </td>
                  ))}
                  {isCoach && (
                    <td style={{ padding: big ? '8px 10px' : '6px 8px', textAlign: 'center', borderBottom: '1px solid #e8eef5' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: big ? 15 : 13, background: shootPct >= 50 ? '#d1fae5' : shootPct > 0 ? '#fef3c7' : '#f1f5f9', color: shootPct >= 50 ? '#065f46' : shootPct > 0 ? '#92400e' : '#94a3b8' }}>
                        {row.shots > 0 ? `${shootPct}%` : '-'}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#eaf4ff' }}>
              <td style={{ padding: big ? '10px 16px' : '8px 14px', fontWeight: 800, color: '#062C5D' }}>TOTAL</td>
              {cols.map((c) => (
                <td key={c.key} style={{ padding: big ? '10px 12px' : '8px 10px', textAlign: 'center', fontWeight: 800, color: '#0A5FB5', fontSize: big ? 17 : 15 }}>{totals[c.key]}</td>
              ))}
              {isCoach && (
                <td style={{ padding: big ? '10px 12px' : '8px 10px', textAlign: 'center', fontWeight: 800, color: '#7c3aed' }}>
                  {totals['shots'] > 0 ? `${Math.round((totals['goals'] / totals['shots']) * 100)}%` : '-'}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSaveAll} disabled={saving}
          style={{ ...styles.primaryButton, opacity: saving ? 0.75 : 1, background: saved ? '#16a34a' : '#0A5FB5', fontSize: big ? 16 : 14, padding: big ? '16px 22px' : '14px 18px' }}>
          {saving ? 'Enregistrement...' : saved ? '✓ Stats validées !' : '✅ Valider et enregistrer toutes les stats'}
        </button>
        {saved && <span style={{ color: '#166534', fontWeight: 700, fontSize: 14 }}>Ajoutées aux stats globales.</span>}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#0A5FB5', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 17 }}>📊 Stats — Tournez le téléphone en paysage 🔄</span>
          <button onClick={() => setFullscreen(false)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 12, padding: '10px 18px', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
            ✕ Fermer
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {tableContent(true)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setFullscreen(true)} title="Toucher pour ouvrir en plein écran">
        <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, background: '#0A5FB5', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}>
          ⤢ Plein écran
        </div>
        {tableContent(false)}
      </div>
    </div>
  );
}

// ─── LoginForm (email + password) ────────────────────────────────────────────
function LoginForm({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (email: string, password: string) => void;
  loading: boolean;
  error: string;
}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#5b6472', display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr" autoComplete="email"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #d5dfeb', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const }}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit(email, password)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#5b6472', display: 'block', marginBottom: 6 }}>Mot de passe</label>
        <div style={{ position: 'relative' }}>
          <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe" autoComplete="current-password"
            style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, border: '1.5px solid #d5dfeb', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const }}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit(email, password)} />
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>
            {showPw ? 'Masquer' : 'Voir'}
          </button>
        </div>
      </div>
      {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontWeight: 700, fontSize: 14 }}>{error}</div>}
      <button onClick={() => onSubmit(email, password)} disabled={loading || !email || !password}
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: loading ? '#94a3b8' : '#0A5FB5', color: 'white', fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </div>
  );
}


// ─── ParentCompositionButton ─ affiche la compo du match en lecture seule ────
function ParentCompositionButton({ matchId, teamId, players, squadIds }: { matchId: string; teamId: string; players: any[]; squadIds: string[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
        🏐 Voir la composition
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setOpen(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, color: '#0f2743' }}>🏐 Composition du match</h3>
              <button onClick={() => setOpen(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>✕ Fermer</button>
            </div>
            <MatchComposition matchId={matchId} teamId={teamId} players={players} squadIds={squadIds} isCoach={false} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Data ──
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matchAttendance, setMatchAttendance] = useState<MatchAttendance[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [matchPlayerStats, setMatchPlayerStats] = useState<MatchPlayerStat[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [parentLinks, setParentLinks] = useState<ParentPlayerLink[]>([]);
  const [trainingTemplates, setTrainingTemplates] = useState<TrainingTemplate[]>([]);
  const [trainingAttendance, setTrainingAttendance] = useState<TrainingAttendance[]>([]);
  const [trainingCancellations, setTrainingCancellations] = useState<TrainingCancellation[]>([]);
  const [trainingBreaks, setTrainingBreaks] = useState<TrainingBreak[]>([]);
  const [coachAccessList, setCoachAccessList] = useState<CoachAccess[]>([]);
  const [adminDelegates, setAdminDelegates] = useState<AdminDelegate[]>([]);

  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(true);
  const [activeRole, setActiveRole] = useState<'coach' | 'parent'>('parent');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [changePwSuccess, setChangePwSuccess] = useState(false);
  // équipes visibles pour ce coach (vide = toutes si admin)
  const [allowedTeamIds, setAllowedTeamIds] = useState<string[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [loading, setLoading] = useState(false);

  // ── UI states ──
  const [coachTab, setCoachTab] = useState<CoachTab>('trainings');
  const [selectedCoachTeamId, setSelectedCoachTeamId] = useState('');
  const [selectedTrainingTemplateId, setSelectedTrainingTemplateId] = useState('');
  const [selectedTrainingDate, setSelectedTrainingDate] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [matchSubTab, setMatchSubTab] = useState<'planning' | 'convocation'>('planning');
  const [matchDetailTab, setMatchDetailTab] = useState<'convocation' | 'presence' | 'stats'>('convocation');
  const [crossCategoryTeamId, setCrossCategoryTeamId] = useState<string>('');
  const [parentTab, setParentTab] = useState<'home' | 'team' | 'trainings' | 'matches' | 'events' | 'password' | 'player' | 'polls'>('home');
  const [parentChildTab, setParentChildTab] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showParentMessages, setShowParentMessages] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'coaches' | 'adminAccess' | 'trainings' | 'matches' | 'players' | 'roster' | 'accounts' | 'seasons' | 'settings' | 'licenses' | 'registrations' | 'events' | 'polls' | 'online'>('coaches');
  const [matchesExpanded, setMatchesExpanded] = useState(false);
  const [clubEvents, setClubEvents] = useState<ClubEvent[]>([]);
  const [eventAttendance, setEventAttendance] = useState<EventAttendance[]>([]);

  // Sponsors
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [currentSponsorIdx, setCurrentSponsorIdx] = useState(0);
  const [showGradeModal, setShowGradeModal] = useState(false);
  // ─── Modale plein écran de carte FIFA ─────────────────────────────────────
  const [fullScreenCardData, setFullScreenCardData] = useState<{
    cards: any[]; index: number;
  } | null>(null);
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorWebsite, setSponsorWebsite] = useState('');
  const [uploadingSponsorPhoto, setUploadingSponsorPhoto] = useState(false);
  // Admin event form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventType, setNewEventType] = useState('event');
  const [newEventTeamIds, setNewEventTeamIds] = useState<string[]>([]);
  const [newEventPaymentLink, setNewEventPaymentLink] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState('');

  // Admin — gestion coaches
  const [newCoachCode, setNewCoachCode] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachPassword, setNewCoachPassword] = useState('');
  const [newCoachFirstName, setNewCoachFirstName] = useState('');
  const [newCoachLastName, setNewCoachLastName] = useState('');
  const [newCoachTeamIds, setNewCoachTeamIds] = useState<string[]>([]);
  const [savingCoach, setSavingCoach] = useState(false);
  const [editingCoachId, setEditingCoachId] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('admin@cag.fr');
  const [newAdminPassword, setNewAdminPassword] = useState('cagh1965');
  const [savingAdminAccess, setSavingAdminAccess] = useState(false);
  const [savingAdminDelegate, setSavingAdminDelegate] = useState('');

  // Messagerie
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastReadConvTimestamps, setLastReadConvTimestamps] = useState<Record<string, string>>({});
  const [showNewMessagePopup, setShowNewMessagePopup] = useState(false);
  const [newMessagePopupCount, setNewMessagePopupCount] = useState(0);
  const messagePopupKeyRef = React.useRef('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const selectedConvIdRef = React.useRef<string | null>(null);
  React.useEffect(() => { selectedConvIdRef.current = selectedConvId; }, [selectedConvId]);

  // Rotation automatique des sponsors (toutes les 5s)
  React.useEffect(() => {
    if (sponsors.length <= 1) return;
    const timer = setInterval(() => setCurrentSponsorIdx((i) => i + 1), 5000);
    return () => clearInterval(timer);
  }, [sponsors.length]);

  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingTrainingReminder, setSendingTrainingReminder] = useState<string>(''); // key = templateId-date
  const [cancelingTrainingKey, setCancelingTrainingKey] = useState('');
  const [showNewConvForm, setShowNewConvForm] = useState(false);
  const [newConvParentId, setNewConvParentId] = useState('');
  const [newConvTeamId, setNewConvTeamId] = useState('');
  const [newConvIsGroup, setNewConvIsGroup] = useState(false);
  const [parentConvId, setParentConvId] = useState<string | null>(null);
  const [parentSelectedCoachTeamId, setParentSelectedCoachTeamId] = useState<string>('');
  const parentConvEnsuredRef = React.useRef<string>(''); // tracks last parentId for which conv was ensured
  const [realtimeSub, setRealtimeSub] = useState<any>(null);

  function getMessageReadStorageKey() {
    if (activeRole === 'parent') return `handlife_message_reads_parent_${selectedParentId || 'unknown'}`;
    return `handlife_message_reads_coach_${isAdmin ? 'admin' : (connectedCoachId || 'unknown')}`;
  }

  function readStoredMessageReads() {
    try {
      const raw = window.localStorage.getItem(getMessageReadStorageKey());
      return raw ? JSON.parse(raw) as Record<string, string> : {};
    } catch {
      return {};
    }
  }

  function updateMessageReadTimestamps(updater: (prev: Record<string, string>) => Record<string, string>) {
    setLastReadConvTimestamps((prev) => {
      const next = updater(prev);
      try { window.localStorage.setItem(getMessageReadStorageKey(), JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function markConversationsRead(convIds: string[]) {
    if (convIds.length === 0) return;
    const now = new Date().toISOString();
    updateMessageReadTimestamps((prev) => {
      const next = { ...prev };
      convIds.forEach((id) => { next[id] = now; });
      return next;
    });
  }

  function getUnreadMessageConversations() {
    return conversations.filter((conv) => {
      const lastRead = lastReadConvTimestamps[conv.id];
      if (!lastRead) return false;
      return new Date(conv.updated_at).getTime() > new Date(lastRead).getTime();
    });
  }

  function openMessagesPanel() {
    if (activeRole === 'coach') setCoachTab('messages');
    else setShowParentMessages(true);
    setShowNewMessagePopup(false);
  }

  // Admin — entraînement
  const [newTrainingTeamId, setNewTrainingTeamId] = useState('');
  const [newTrainingTitle, setNewTrainingTitle] = useState('Entraînement');
  const [newTrainingWeekday, setNewTrainingWeekday] = useState('3');
  const [newTrainingStart, setNewTrainingStart] = useState('18:30');
  const [newTrainingEnd, setNewTrainingEnd] = useState('20:00');
  const [newTrainingLocation, setNewTrainingLocation] = useState('Gymnase de Gorcy');
  const [editingTrainingTemplateId, setEditingTrainingTemplateId] = useState('');
  const [savingTrainingTemplate, setSavingTrainingTemplate] = useState(false);
  const [newBreakTeamId, setNewBreakTeamId] = useState('');
  const [newBreakTitle, setNewBreakTitle] = useState('Vacances');
  const [newBreakStart, setNewBreakStart] = useState('');
  const [newBreakEnd, setNewBreakEnd] = useState('');
  const [newBreakReason, setNewBreakReason] = useState('');

  // Admin — match
  const [newMatchTeamId, setNewMatchTeamId] = useState('');
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchLocation, setNewMatchLocation] = useState('');
  const [newMatchHomeAway, setNewMatchHomeAway] = useState<'home' | 'away'>('home');
  const [newMatchFdmUrl, setNewMatchFdmUrl] = useState('');
  const [newMatchSupporterSummary, setNewMatchSupporterSummary] = useState('');
  const [editingMatchId, setEditingMatchId] = useState('');

  // Admin — joueur
  const [playerFormFirstName, setPlayerFormFirstName] = useState('');
  const [playerFormLastName, setPlayerFormLastName] = useState('');
  const [playerFormTeamId, setPlayerFormTeamId] = useState('');
  const [playerFormBirthDate, setPlayerFormBirthDate] = useState('');
  const [playerFormJerseyNumber, setPlayerFormJerseyNumber] = useState('');
  const [playerFormPosition, setPlayerFormPosition] = useState<string>('');
  const [playerFormGender, setPlayerFormGender] = useState<'male' | 'female' | ''>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [jerseyEditId, setJerseyEditId] = useState<string | null>(null);
  const [jerseyEditValue, setJerseyEditValue] = useState('');
  const [connectedCoachId, setConnectedCoachId] = useState<string | null>(null);
  const [editingPlayerId, setEditingPlayerId] = useState('');
  const [savingPlayer, setSavingPlayer] = useState(false);

  // Admin — compte enfant
  const [showCreateChildForm, setShowCreateChildForm] = useState(false);
  const [newChildFirstName, setNewChildFirstName] = useState('');
  const [newChildLastName, setNewChildLastName] = useState('');
  const [newChildTeamId, setNewChildTeamId] = useState('');
  const [newChildGender, setNewChildGender] = useState<'male' | 'female' | ''>('');
  const [newParentFirstName, setNewParentFirstName] = useState('');
  const [newParentLastName, setNewParentLastName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [creatingChildAccount, setCreatingChildAccount] = useState(false);
  const [promotionSourceTeamId, setPromotionSourceTeamId] = useState('');
  const [promotionTargetTeamId, setPromotionTargetTeamId] = useState('');
  const [promotionGenderFilter, setPromotionGenderFilter] = useState<'all' | 'male' | 'female' | 'unknown'>('all');
  const [promotionSelectedIds, setPromotionSelectedIds] = useState<string[]>([]);
  const [promotionSaving, setPromotionSaving] = useState(false);

  // Users — gestion parents
  const [selectedManagedParentId, setSelectedManagedParentId] = useState('');
  const [managedParentFirstName, setManagedParentFirstName] = useState('');
  const [managedParentLastName, setManagedParentLastName] = useState('');
  const [managedParentEmail, setManagedParentEmail] = useState('');
  const [managedParentPin, setManagedParentPin] = useState('');
  const [savingManagedParent, setSavingManagedParent] = useState(false);

  // Players — lien parent/enfant
  const [selectedLinkParentId, setSelectedLinkParentId] = useState('');
  const [selectedLinkPlayerId, setSelectedLinkPlayerId] = useState('');
  const [linkingPlayer, setLinkingPlayer] = useState(false);

  // Match — squad + résultat
  const [matchSquad, setMatchSquad] = useState<Record<string, string[]>>({});
  const [squadInitialized, setSquadInitialized] = useState<Record<string, boolean>>({});
  const [matchResults, setMatchResults] = useState<Record<string, { score_home: string; score_away: string }>>({});
  const [savingMatchResult, setSavingMatchResult] = useState(false);

  // Saisons
  type Season = { id: string; name: string; start_date: string; end_date: string; team_id: string };
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedLicenseSeasonId, setSelectedLicenseSeasonId] = useState<string>('');
  const [newSeasonName, setNewSeasonName] = useState('2025/2026');
  const [newSeasonStart, setNewSeasonStart] = useState('');
  const [newSeasonEnd, setNewSeasonEnd] = useState('');
  const [newSeasonTeamId, setNewSeasonTeamId] = useState('');
  const [savingSeason, setSavingSeason] = useState(false);
  const [resetingTraining, setResetingTraining] = useState(false);
  const [playerSeasonAssignments, setPlayerSeasonAssignments] = useState<PlayerSeasonAssignment[]>([]);
  const [planningSeasonId, setPlanningSeasonId] = useState('');
  const [savingSeasonAssignments, setSavingSeasonAssignments] = useState(false);
  const [switchingSeason, setSwitchingSeason] = useState(false);

  // Paramètres (settings)
  type AppSettings = {
    app_url: string;
    admin_email: string;
    registration_notification_emails: string;
    championship_u9: string;
    championship_u11_garcon: string;
    championship_u11_fille: string;
    championship_u13_garcon: string;
    championship_u13_fille: string;
    championship_u15: string;
    championship_u17: string;
    championship_u18: string;
    championship_senior: string;
    championship_senior_fille: string;
    license_url_u9: string;
    license_url_u11_garcon: string;
    license_url_u11_fille: string;
    license_url_u13_garcon: string;
    license_url_u13_fille: string;
    license_url_u15: string;
    license_url_u17: string;
    license_url_u18: string;
    license_url_senior: string;
    license_url_senior_fille: string;
    license_url_loisir: string;
  };
  const [appSettings, setAppSettings] = useState<AppSettings>({
    app_url: '', admin_email: '', registration_notification_emails: '', championship_u9: '', championship_u11_garcon: '', championship_u11_fille: '',
    championship_u13_garcon: '', championship_u13_fille: '', championship_u15: '',
    championship_u17: '', championship_u18: '', championship_senior: '', championship_senior_fille: '',
    license_url_u9: '', license_url_u11_garcon: '', license_url_u11_fille: '',
    license_url_u13_garcon: '', license_url_u13_fille: '', license_url_u15: '',
    license_url_u17: '', license_url_u18: '', license_url_senior: '', license_url_senior_fille: '', license_url_loisir: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Licences ──
  type LicenseStatus = {
    id: string;
    player_id: string;
    season_id: string | null;
    status: 'pending' | 'paid' | 'validated';
    paid_at: string | null;
    validated_at: string | null;
    note: string | null;
  };
  const [licenseStatuses, setLicenseStatuses] = useState<LicenseStatus[]>([]);

  // Retourne la saison courante (date du jour comprise entre start_date et end_date)
  function getCurrentSeason(): Season | null {
    const today = new Date().toISOString().slice(0, 10);
    return seasons.find((s) => s.start_date <= today && s.end_date >= today) || seasons[0] || null;
  }

  async function loadLicenses() {
    const { data, error } = await supabase.from('license_status').select('*');
    if (error) { console.error('[License] load error:', error); return; }
    if (data) setLicenseStatuses(data as LicenseStatus[]);
  }

  async function upsertLicenseStatus(playerId: string, status: 'pending' | 'paid' | 'validated', seasonId?: string) {
    const sid = (seasonId && seasonId !== '') ? seasonId : (getCurrentSeason()?.id || null);

    // IMPORTANT: the DB has a UNIQUE constraint on player_id alone.
    // This means we can never INSERT a 2nd row per player.
    // Strategy: always UPDATE the existing row, switching season_id + status together.
    // If no row exists yet → INSERT once.
    const anyExisting = licenseStatuses.find((l) => l.player_id === playerId);

    const basePayload: any = {
      status,
      paid_at: status === 'paid' || status === 'validated' ? (anyExisting?.paid_at || new Date().toISOString()) : null,
      validated_at: status === 'validated' ? new Date().toISOString() : null,
    };

    if (anyExisting) {
      // Always update this row — change both season_id and status
      const updatePayload = { ...basePayload };
      if (sid !== null) updatePayload.season_id = sid;
      const { error } = await supabase.from('license_status').update(updatePayload).eq('id', anyExisting.id);
      if (error) {
        console.error('[License] update error:', error);
        // If season_id column missing, retry without it
        if (error.message?.includes('season_id') || error.code === '42703') {
          const { error: e2 } = await supabase.from('license_status').update({ status, paid_at: basePayload.paid_at, validated_at: basePayload.validated_at }).eq('id', anyExisting.id);
          if (e2) { alert(`Erreur : ${e2.message}`); return; }
        } else {
          alert(`Erreur : ${error.message}`);
          return;
        }
      }
    } else {
      // First time this player has a license record
      const insertPayload: any = { player_id: playerId, ...basePayload };
      if (sid !== null) insertPayload.season_id = sid;
      const { error } = await supabase.from('license_status').insert(insertPayload);
      if (error) {
        console.error('[License] insert error:', error);
        if (error.message?.includes('season_id') || error.code === '42703') {
          const { error: e2 } = await supabase.from('license_status').insert({ player_id: playerId, status });
          if (e2) { alert(`Erreur : ${e2.message}`); return; }
        } else {
          alert(`Erreur : ${error.message}`);
          return;
        }
      }
    }
    await loadLicenses();
  }

  function getLicenseStatus(playerId: string, seasonId?: string | null): LicenseStatus | null {
    const sid = (seasonId !== undefined && seasonId !== null && seasonId !== '')
      ? seasonId
      : (getCurrentSeason()?.id || null);
    // Try exact season match
    if (sid) {
      const exact = licenseStatuses.find((l) => l.player_id === playerId && l.season_id === sid);
      if (exact) return exact;
      // If no records have season_id (column not yet migrated), fall back to player-only match
      const columnExists = licenseStatuses.some((l) => l.season_id !== null && l.season_id !== undefined);
      if (!columnExists) return licenseStatuses.find((l) => l.player_id === playerId) || null;
      // Column exists but no record for this season → null = pending
      return null;
    }
    return licenseStatuses.find((l) => l.player_id === playerId && !l.season_id) || null;
  }


  // Retourne l'URL de licence correspondant à l'équipe du joueur
  function getLicenseUrl(teamId: string): string {
    const cat = (teams.find((t) => t.id === teamId)?.category || '').toLowerCase();
    const nm = (teams.find((t) => t.id === teamId)?.name || '').toLowerCase();
    const h = cat + ' ' + nm;
    if (h.includes('u9')) return appSettings.license_url_u9;
    if (h.includes('u11') && (h.includes('garcon') || h.includes('garçon') || h.includes('masculin') || h.includes('masc'))) return appSettings.license_url_u11_garcon;
    if (h.includes('u11') && (h.includes('fille') || h.includes('féminin') || h.includes('feminin'))) return appSettings.license_url_u11_fille;
    if (h.includes('u11')) return appSettings.license_url_u11_garcon;
    if (h.includes('u13') && (h.includes('garcon') || h.includes('garçon') || h.includes('masculin') || h.includes('masc'))) return appSettings.license_url_u13_garcon;
    if (h.includes('u13') && (h.includes('fille') || h.includes('féminin') || h.includes('feminin'))) return appSettings.license_url_u13_fille;
    if (h.includes('u13')) return appSettings.license_url_u13_garcon;
    if (h.includes('u15')) return appSettings.license_url_u15;
    if (h.includes('u17')) return appSettings.license_url_u17;
    if (h.includes('u18')) return appSettings.license_url_u18;
    if (h.includes('senior') && (h.includes('fille') || h.includes('féminin') || h.includes('feminin') || h.includes('feminine'))) return appSettings.license_url_senior_fille;
    if (h.includes('senior')) return appSettings.license_url_senior;
    if (h.includes('loisir')) return appSettings.license_url_loisir;
    return '';
  }

  // ── Inscription publique ──
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [regStep, setRegStep] = useState<'choose' | 'parent' | 'direct'>('parent');
  const [regAdultIsPlayer, setRegAdultIsPlayer] = useState(false);
  const [regHasFirstChild, setRegHasFirstChild] = useState(false);
  const [regParentFirstName, setRegParentFirstName] = useState('');
  const [regParentLastName, setRegParentLastName] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');
  const [regParentPassword, setRegParentPassword] = useState('');
  // Enfant 1 : soit joueur existant soit nouveau
  const [regChildFirstName, setRegChildFirstName] = useState('');
  const [regChildLastName, setRegChildLastName] = useState('');
  const [regChildTeamId, setRegChildTeamId] = useState('');
  const [regChildMode, setRegChildMode] = useState<'existing' | 'new'>('existing');
  const [regChildExistingId, setRegChildExistingId] = useState('');
  const [regChildBirthDate, setRegChildBirthDate] = useState('');
  const [regChild2Mode, setRegChild2Mode] = useState<'existing' | 'new'>('existing');
  const [regChild2ExistingId, setRegChild2ExistingId] = useState('');
  const [similarPlayers, setSimilarPlayers] = useState<{child: 1|2; players: any[]}[]>([]);
  const [regChildLinked, setRegChildLinked] = useState(false);
  const [regChild2Linked, setRegChild2Linked] = useState(false);
  const [regLinkedPlayerIds, setRegLinkedPlayerIds] = useState<Record<number, string>>({});
  // Enfant 2
  const [regHasSecondChild, setRegHasSecondChild] = useState(false);
  const [regChild2FirstName, setRegChild2FirstName] = useState('');
  const [regChild2LastName, setRegChild2LastName] = useState('');
  const [regChild2TeamId, setRegChild2TeamId] = useState('');
  const [regChild2BirthDate, setRegChild2BirthDate] = useState('');
  // Inscription directe joueur (loisir/senior)
  const [regDirectFirstName, setRegDirectFirstName] = useState('');
  const [regDirectLastName, setRegDirectLastName] = useState('');
  const [regDirectTeamId, setRegDirectTeamId] = useState('');
  const [regDirectTeamIds, setRegDirectTeamIds] = useState<string[]>([]);
  const [regDirectBirthDate, setRegDirectBirthDate] = useState('');
  const [regDirectEmail, setRegDirectEmail] = useState('');
  const [regDirectPassword, setRegDirectPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');

  type Registration = {
    id: string;
    type: 'parent' | 'direct';
    status: 'pending' | 'approved' | 'rejected';
    parent_first_name: string;
    parent_last_name: string;
    email: string | null;
    child1_mode: string | null;
    child1_existing_id: string | null;
    child1_first_name: string | null;
    child1_last_name: string | null;
    child1_team_id: string | null;
    direct_team_ids?: string[] | null;
    child1_birth_date: string | null;
    child1_name: string | null;
    child2_mode: string | null;
    child2_existing_id: string | null;
    child2_first_name: string | null;
    child2_last_name: string | null;
    child2_team_id: string | null;
    child2_birth_date: string | null;
    child2_name: string | null;
    created_at: string;
  };
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // ── Présence en ligne (admin) ──
  const [onlinePresence, setOnlinePresence] = useState<UserPresence[]>([]);
  const [connectionHistory, setConnectionHistory] = useState<ConnectionHistory[]>([]);
  const [showHeaderOnline, setShowHeaderOnline] = useState(false);
  const [presenceTick, setPresenceTick] = useState(Date.now());
  const [presenceHistoryError, setPresenceHistoryError] = useState('');
  const [localConnectionHistory, setLocalConnectionHistory] = useState<ConnectionHistory[]>([]);
  const presenceHistoryLoggedRef = React.useRef(false);

  // ── Sondages ──
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([]);
  const [pollVotes, setPollVotes] = useState<PollVote[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [newPollExternalUrl, setNewPollExternalUrl] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [newPollQuestions, setNewPollQuestions] = useState<PollQuestion[]>([
    { id: 'q-1', question: '', options: ['', ''], multiple_choice: false },
  ]);
  const [newPollTeamIds, setNewPollTeamIds] = useState<string[]>([]);
  const [newPollMultiple, setNewPollMultiple] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);
  const [editingPollId, setEditingPollId] = useState('');
  const [viewingPollResultsId, setViewingPollResultsId] = useState('');

  // ── Formulaires d'événements ──
  const [eventFormQuestions, setEventFormQuestions] = useState<EventFormQuestion[]>([]);
  const [eventFormResponses, setEventFormResponses] = useState<EventFormResponse[]>([]);
  const [editingEventFormId, setEditingEventFormId] = useState('');
  const [draftFormQuestions, setDraftFormQuestions] = useState<{ tempId: string; question: string; type: 'text' | 'yesno' | 'choice' | 'multi'; choices: string[]; required: boolean }[]>([]);
  const [savingEventForm, setSavingEventForm] = useState(false);
  const [viewingEventFormResultsId, setViewingEventFormResultsId] = useState('');

  // ── Saison sélectionnée pour parents (filtrage cartes/stats) ──
  const [parentSelectedSeasonId, setParentSelectedSeasonId] = useState<string>('');

  // ── État joueur lié au compte (si l'utilisateur est aussi joueur) ──
  const [linkedPlayerId, setLinkedPlayerId] = useState<string | null>(null);
  const [hasPlayerRole, setHasPlayerRole] = useState(false);

  async function loadRegistrations() {
    const { data } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
    if (data) setRegistrations(data as Registration[]);

    // Load club events
    const { data: evData } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (evData) setClubEvents(evData as ClubEvent[]);

    // Load event attendance
    const { data: evAtt } = await supabase.from('event_attendance').select('*');
    if (evAtt) setEventAttendance(evAtt as EventAttendance[]);

    try {
      const { data: tcData } = await supabase.from('training_cancellations').select('*').order('training_date', { ascending: true });
      if (tcData) setTrainingCancellations(tcData as TrainingCancellation[]);
      const { data: tbData } = await supabase.from('training_breaks').select('*').order('start_date', { ascending: true });
      if (tbData) setTrainingBreaks(tbData as TrainingBreak[]);
    } catch (e) { console.warn('Training cancellations/breaks load failed (table missing?)', e); }

    // Load sponsors
    const { data: spData } = await supabase.from('sponsors').select('*').eq('active', true).order('display_order');
    if (spData) setSponsors(spData as Sponsor[]);

    // Polls
    try {
      const { data: pData } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      if (pData) setPolls(pData as Poll[]);
      const { data: poData } = await supabase.from('poll_options').select('*').order('display_order', { ascending: true });
      if (poData) setPollOptions(poData as PollOption[]);
      const { data: pvData } = await supabase.from('poll_votes').select('*');
      if (pvData) setPollVotes(pvData as PollVote[]);
    } catch (e) { console.warn('Polls load failed (table missing?)', e); }

    // Event form questions + responses
    try {
      const { data: efqData } = await supabase.from('event_form_questions').select('*').order('display_order', { ascending: true });
      if (efqData) setEventFormQuestions(efqData as EventFormQuestion[]);
      const { data: efrData } = await supabase.from('event_form_responses').select('*');
      if (efrData) setEventFormResponses(efrData as EventFormResponse[]);
    } catch (e) { console.warn('Event forms load failed (table missing?)', e); }

    await refreshPresenceData();
  }

  async function refreshPresenceData() {
    try {
      const { data: prData } = await supabase.from('user_presence').select('*').order('last_seen', { ascending: false }).limit(500);
      if (prData) setOnlinePresence(prData as UserPresence[]);
    } catch (e) { /* table may not exist yet */ }
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: historyData, error: historyError } = await supabase.from('user_presence_history').select('*').gte('seen_at', sevenDaysAgo).order('seen_at', { ascending: false }).limit(700);
      if (historyError) throw historyError;
      if (historyData) setConnectionHistory(historyData as ConnectionHistory[]);
      const { error: cleanupError } = await supabase.from('user_presence_history').delete().lt('seen_at', sevenDaysAgo);
      if (cleanupError) throw cleanupError;
      setPresenceHistoryError('');
    } catch (e: any) {
      setPresenceHistoryError(e?.message || 'Historique Supabase indisponible.');
    }
    setLocalConnectionHistory(readLocalPresenceHistory());
    setPresenceTick(Date.now());
  }

  function readLocalPresenceHistory(): ConnectionHistory[] {
    try {
      const raw = window.localStorage.getItem('handlife_presence_history');
      if (!raw) return [];
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return (JSON.parse(raw) as ConnectionHistory[])
        .filter((p) => new Date(p.seen_at).getTime() >= cutoff)
        .sort((a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime());
    } catch (e) {
      return [];
    }
  }

  function saveLocalPresenceHistory(item: ConnectionHistory) {
    try {
      const next = [item, ...readLocalPresenceHistory()].slice(0, 500);
      window.localStorage.setItem('handlife_presence_history', JSON.stringify(next));
      setLocalConnectionHistory(next);
    } catch (e) { /* ignore local fallback */ }
  }

  // ── Computed visibilité ──
  const visibleTeams = useMemo(() => {
    if (isAdmin) return teams;
    return teams.filter((t) => allowedTeamIds.includes(t.id));
  }, [teams, isAdmin, allowedTeamIds]);

  const visiblePlayers = useMemo(() => {
    return players.filter((p) => visibleTeams.some((t) => t.id === p.team_id));
  }, [players, visibleTeams]);

  const visibleMatches = useMemo(() => {
    return matches.filter((m) => visibleTeams.some((t) => t.id === m.team_id));
  }, [matches, visibleTeams]);

  const visibleTemplates = useMemo(() => {
    return trainingTemplates.filter((t) => visibleTeams.some((vt) => vt.id === t.team_id));
  }, [trainingTemplates, visibleTeams]);

  // ── Vérifier session existante au démarrage ──
  useEffect(() => {
    // Détecter si on arrive depuis un lien de reset password (hash dans l'URL)
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setShowChangePassword(true);
    }

    let subscription: any = null;
    const timeout = setTimeout(() => setAuthChecked(true), 1500);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeout);
        if (session?.user) {
          // Si c'est une session de recovery, ne pas connecter normalement
          if (hash.includes('type=recovery')) {
            setShowChangePassword(true);
            setAuthChecked(true);
            return;
          }
          try { await applyUserSession(session.user.id); } catch (e) { console.warn('applyUserSession failed', e); }
        }
        setAuthChecked(true);
      } catch (e) {
        console.warn('Supabase auth not available (StackBlitz?)', e);
        clearTimeout(timeout);
        setAuthChecked(true);
      }
    })();

    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          setLoggedIn(false); setIsAdmin(false);
          setAllowedTeamIds([]); setSelectedParentId(''); setConnectedCoachId(null);
        }
      });
      subscription = data.subscription;
    } catch (e) { console.warn('onAuthStateChange failed', e); }

    return () => { try { subscription?.unsubscribe(); } catch(e) {} };
  }, []);

  // ── Load données publiques (avant connexion, pour l'inscription) ──
  useEffect(() => {
    try { loadSettings(); } catch(e) {}
    supabase.from('teams').select('*').order('name')
      .then(({ data }) => { if (data) setTeams(data as Team[]); }, () => {});
    // Joueurs chargés publiquement pour la liste déroulante du formulaire d'inscription
    supabase.from('players').select('id, first_name, last_name, team_id, birth_date, photo_url, jersey_number, position, card_powers').order('last_name')
      .then(({ data }) => { if (data) setPlayers(data as Player[]); }, () => {});
    // Sponsors chargés publiquement pour la page de connexion
    supabase.from('sponsors').select('*').eq('active', true).order('display_order')
      .then(({ data }) => { if (data) setSponsors(data as Sponsor[]); }, () => {});
  }, []);

  // ── Load données privées uniquement après connexion ──
  useEffect(() => {
    if (loggedIn) {
      loadData();
      loadSeasons();
      loadPlayerSeasonAssignments();
    }
  }, [loggedIn]);

  // Auto-refresh toutes les 30 secondes pour les données générales
  useEffect(() => {
    if (!loggedIn) return;
    const interval = setInterval(() => { loadDataSilent(); loadPlayerSeasonAssignments(); }, 30000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  // Rafraîchissement léger de la présence pour le header et l'admin.
  useEffect(() => {
    if (!loggedIn) return;
    refreshPresenceData();
    const interval = setInterval(() => { refreshPresenceData(); }, 15000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  // Heartbeat de présence — mise à jour toutes les 60s
  useEffect(() => {
    if (!loggedIn) return;
    const upsertPresence = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const role = isAdmin ? 'admin' : activeRole;
        const me = users.find((u) => (u as any).auth_id === session.user.id);
        const displayName = me ? `${me.first_name || ''} ${me.last_name || ''}`.trim() : (session.user.email || '');
        const now = new Date().toISOString();
        await supabase.from('user_presence').upsert({
          auth_id: session.user.id,
          role,
          display_name: displayName,
          last_seen: now,
        }, { onConflict: 'auth_id' });
        if (!presenceHistoryLoggedRef.current) {
          try {
            const historyItem = {
              auth_id: session.user.id,
              role,
              display_name: displayName,
              seen_at: now,
            };
            const { error: historyInsertError } = await supabase.from('user_presence_history').insert(historyItem);
            if (historyInsertError) throw historyInsertError;
            presenceHistoryLoggedRef.current = true;
            setPresenceHistoryError('');
          } catch (e: any) {
            presenceHistoryLoggedRef.current = true;
            setPresenceHistoryError(e?.message || 'Historique Supabase indisponible.');
            saveLocalPresenceHistory({
              auth_id: session.user.id,
              role,
              display_name: displayName,
              seen_at: now,
            });
          }
        }
        refreshPresenceData();
      } catch (e) { /* table may not exist yet */ }
    };
    upsertPresence();
    const heartbeat = setInterval(upsertPresence, 60000);
    return () => { clearInterval(heartbeat); };
  }, [loggedIn, activeRole, isAdmin, users]);

  // Auto-refresh des conversations parent (sécurité si realtime ne passe pas)
  useEffect(() => {
    if (!loggedIn || activeRole !== 'parent' || !selectedParentId) return;
    const interval = setInterval(() => {
      loadConversationsForParent(selectedParentId).catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, [loggedIn, activeRole, selectedParentId]);

  useEffect(() => {
    if (!loggedIn) return;
    const stored = readStoredMessageReads();
    conversations.forEach((c) => { if (!stored[c.id]) stored[c.id] = c.updated_at; });
    setLastReadConvTimestamps(stored);
    try { window.localStorage.setItem(getMessageReadStorageKey(), JSON.stringify(stored)); } catch {}
    setShowNewMessagePopup(false);
    messagePopupKeyRef.current = '';
  }, [loggedIn, activeRole, selectedParentId, connectedCoachId, isAdmin]);

  useEffect(() => {
    if (!loggedIn || conversations.length === 0) return;
    const unread = getUnreadMessageConversations();
    if (unread.length === 0) return;
    const popupKey = `${getMessageReadStorageKey()}::${unread.map((c) => `${c.id}-${c.updated_at}`).join('|')}`;
    if (messagePopupKeyRef.current === popupKey) return;
    messagePopupKeyRef.current = popupKey;
    setNewMessagePopupCount(unread.length);
    setShowNewMessagePopup(true);
  }, [loggedIn, conversations, lastReadConvTimestamps, activeRole, selectedParentId, connectedCoachId, isAdmin]);

  // Les rappels email entraînement sont gérés par le cron Supabase (check-training-reminders)
  // Ne pas les déclencher depuis le front pour éviter les doublons

  // Realtime — présences match, présences entraînement, convocations
  useEffect(() => {
    if (!loggedIn) return;

    const ch = supabase.channel('realtime-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_attendance' },
        () => { loadDataSilent(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance' },
        () => { loadDataSilent(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_cancellations' },
        () => { loadDataSilent(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_breaks' },
        () => { loadDataSilent(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_squads' },
        () => { loadDataSilent(); })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    if (activeRole === 'coach') {
      const tids = isAdmin ? teams.map((t) => t.id) : allowedTeamIds;
      loadConversations(tids);
    } else if (activeRole === 'parent' && selectedParentId) {
      // Guard: only run once per parentId to prevent phantom conversations on team reload
      if (parentConvEnsuredRef.current !== selectedParentId) {
        parentConvEnsuredRef.current = selectedParentId;
        ensureParentConversation(selectedParentId);
      }
    }
  }, [loggedIn, activeRole, isAdmin, allowedTeamIds, selectedParentId, teams, connectedCoachId]);

  useEffect(() => {
    if (!selectedConvId) return;
    loadMessages(selectedConvId);
    // Mark this conversation as read now
    markConversationsRead([selectedConvId]);
    const ch = supabase.channel('msgs-' + selectedConvId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + selectedConvId },
        (payload: any) => { setMessages((prev) => prev.find((m) => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]); }
      ).subscribe();
    setRealtimeSub(ch);
    return () => { supabase.removeChannel(ch); };
  }, [selectedConvId]);

  // Realtime: refresh conversations updated_at to update unread badges (coach + parent)
  useEffect(() => {
    if (!loggedIn) return;
    const ch = supabase.channel('conv-updates-' + activeRole)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload: any) => {
          setConversations((prev) => {
            // Si la conv n'est pas encore en mémoire (parent qui reçoit un nouveau message), on l'ajoute via reload
            const exists = prev.find((c) => c.id === payload.new.id);
            if (!exists) return prev;
            return prev.map((c) => c.id === payload.new.id ? { ...c, updated_at: payload.new.updated_at } : c);
          });
          // Si cette conv est ouverte, marquer comme lue
          if (selectedConvIdRef.current === payload.new.id) {
            markConversationsRead([payload.new.id]);
          }
        }
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const newMsg = payload.new as any;
          // Mettre à jour updated_at localement pour déclencher la pastille
          setConversations((prev) => prev.map((c) =>
            c.id === newMsg.conversation_id ? { ...c, updated_at: newMsg.created_at } : c
          ));
          // Si cette conv est ouverte, marquer lue
          if (selectedConvIdRef.current === newMsg.conversation_id) {
            markConversationsRead([newMsg.conversation_id]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loggedIn, activeRole]);

  useEffect(() => {
    if (visibleTeams.length > 0 && !selectedCoachTeamId) setSelectedCoachTeamId(visibleTeams[0].id);
  }, [visibleTeams]);

  useEffect(() => {
    if (seasons.length > 0 && !planningSeasonId) setPlanningSeasonId(seasons[0].id);
  }, [seasons, planningSeasonId]);

  useEffect(() => {
    if (teams.length > 0 && !newTrainingTeamId) setNewTrainingTeamId(teams[0].id);
    if (teams.length > 0 && !newMatchTeamId) setNewMatchTeamId(teams[0].id);
    if (teams.length > 0 && !playerFormTeamId) setPlayerFormTeamId(teams[0].id);
    if (teams.length > 0 && !newChildTeamId) setNewChildTeamId(teams[0].id);
  }, [teams]);

  useEffect(() => {
    if (visibleTemplates.length > 0 && !selectedTrainingTemplateId) {
      setSelectedTrainingTemplateId(visibleTemplates[0].id);
      setSelectedTrainingDate(getNextTrainingsForTemplate(visibleTemplates[0], 1, true)[0]?.date || '');
    }
  }, [visibleTemplates]);

  useEffect(() => {
    if (visibleMatches.length > 0 && !selectedMatchId) {
      const next = getPreferredUpcomingMatch(visibleMatches);
      if (next) setSelectedMatchId(next.id);
    }
  }, [visibleMatches]);

  useEffect(() => {
    if (activeRole !== 'coach' || coachTab !== 'matches' || matchSubTab !== 'convocation') return;
    const candidates = selectedCoachTeamId ? visibleMatches.filter((m) => m.team_id === selectedCoachTeamId) : visibleMatches;
    const next = getPreferredUpcomingMatch(candidates);
    if (next) {
      setSelectedMatchId(next.id);
    }
  }, [activeRole, coachTab, matchSubTab, selectedCoachTeamId, visibleMatches]);

  useEffect(() => {
    if (!selectedTrainingTemplateId) return;
    const t = trainingTemplates.find((x) => x.id === selectedTrainingTemplateId);
    if (t) setSelectedTrainingDate(getNextTrainingsForTemplate(t, 1, true)[0]?.date || '');
  }, [selectedTrainingTemplateId]);

  useEffect(() => {
    const m = matches.find((x) => x.id === selectedMatchId);
    if (m) initMatchResult(m);
  }, [selectedMatchId, matches]);

  useEffect(() => {
    if (!selectedManagedParentId) return;
    const p = users.find((u) => u.id === selectedManagedParentId);
    if (!p) return;
    setManagedParentFirstName(p.first_name || '');
    setManagedParentLastName(p.last_name || '');
    setManagedParentEmail(p.email || '');
    setManagedParentPin(p.parent_pin || '');
  }, [selectedManagedParentId, users]);

  async function loadDataSilent() {
    // Refresh sans flash — ne passe pas loading à true
    const [
      teamsRes, playersRes, matchesRes, matchAttRes, statsRes,
      usersRes, linksRes, templatesRes, attendanceRes, matchStatsRes, coachesRes, coachTeamsRes, squadsRes, trainingCancelRes, trainingBreakRes, adminDelegatesRes,
    ] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('players').select('*').order('last_name', { ascending: true }),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('match_attendance').select('*'),
      supabase.from('player_stats').select('*'),
      supabase.from('users').select('*').order('last_name', { ascending: true }),
      supabase.from('parent_player').select('*'),
      supabase.from('training_templates').select('*').order('weekday', { ascending: true }),
      supabase.from('training_attendance').select('*'),
      supabase.from('match_player_stats').select('*'),
      supabase.from('coaches').select('id, code, first_name, last_name, photo_url'),
      supabase.from('coach_teams').select('*'),
      supabase.from('match_squads').select('*'),
      supabase.from('training_cancellations').select('*').order('training_date', { ascending: true }),
      supabase.from('training_breaks').select('*').order('start_date', { ascending: true }),
      supabase.from('admin_delegates').select('*').order('created_at', { ascending: false }),
    ]);
    setTeams(teamsRes.data || []);
    setPlayers(playersRes.data || []);
    setMatches(matchesRes.data || []);
    setMatchAttendance(matchAttRes.data || []);
    setStats(statsRes.data || []);
    setMatchPlayerStats(matchStatsRes.data || []);
    setUsers(usersRes.data || []);
    setParentLinks(linksRes.data || []);
    setTrainingTemplates(templatesRes.data || []);
    setTrainingAttendance(attendanceRes.data || []);
    setTrainingCancellations(trainingCancelRes.data || []);
    setTrainingBreaks(trainingBreakRes.data || []);
    setAdminDelegates((adminDelegatesRes.data || []) as AdminDelegate[]);
    const squads = squadsRes.data || [];
    const squadMap: Record<string, string[]> = {};
    const initializedMap: Record<string, boolean> = {};
    for (const row of squads) {
      if (!squadMap[row.match_id]) squadMap[row.match_id] = [];
      squadMap[row.match_id].push(row.player_id);
      initializedMap[row.match_id] = true;
    }
    setMatchSquad(squadMap);
    setSquadInitialized(initializedMap);
    const coachRows: CoachAccess[] = [];
    const coaches = coachesRes.data || [];
    const coachTeams = coachTeamsRes.data || [];
    for (const coach of coaches) {
      const cTeams = coachTeams.filter((ct: any) => ct.coach_id === coach.id);
      if (cTeams.length === 0) {
        coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: '', photo_url: coach.photo_url || null });
      } else {
        for (const ct of cTeams) {
          coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: ct.team_id, photo_url: coach.photo_url || null });
        }
      }
    }
    setCoachAccessList(coachRows);
  }

  async function loadData() {
    setLoading(true);
    try {
    const [
      teamsRes, playersRes, matchesRes, matchAttRes, statsRes,
      usersRes, linksRes, templatesRes, attendanceRes, matchStatsRes, coachesRes, coachTeamsRes, squadsRes, trainingCancelRes, trainingBreakRes, adminDelegatesRes,
    ] = await Promise.all([
      supabase.from('teams').select('*').order('name', { ascending: true }),
      supabase.from('players').select('*').order('last_name', { ascending: true }),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('match_attendance').select('*'),
      supabase.from('player_stats').select('*'),
      supabase.from('users').select('*').order('last_name', { ascending: true }),
      supabase.from('parent_player').select('*'),
      supabase.from('training_templates').select('*').order('weekday', { ascending: true }),
      supabase.from('training_attendance').select('*'),
      supabase.from('match_player_stats').select('*'),
      supabase.from('coaches').select('id, code, first_name, last_name, photo_url'),
      supabase.from('coach_teams').select('*'),
      supabase.from('match_squads').select('*'),
      supabase.from('training_cancellations').select('*').order('training_date', { ascending: true }),
      supabase.from('training_breaks').select('*').order('start_date', { ascending: true }),
      supabase.from('admin_delegates').select('*').order('created_at', { ascending: false }),
    ]);

    setTeams(teamsRes.data || []);
    setPlayers(playersRes.data || []);
    setMatches(matchesRes.data || []);
    setMatchAttendance(matchAttRes.data || []);
    setStats(statsRes.data || []);
    setMatchPlayerStats(matchStatsRes.data || []);
    setUsers(usersRes.data || []);
    setParentLinks(linksRes.data || []);
    setTrainingTemplates(templatesRes.data || []);
    setTrainingAttendance(attendanceRes.data || []);
    setTrainingCancellations(trainingCancelRes.data || []);
    setTrainingBreaks(trainingBreakRes.data || []);
    setAdminDelegates((adminDelegatesRes.data || []) as AdminDelegate[]);

    // Reconstituer matchSquad + squadInitialized depuis match_squads
    const squads = squadsRes.data || [];
    const squadMap: Record<string, string[]> = {};
    const initializedMap: Record<string, boolean> = {};
    for (const row of squads) {
      if (!squadMap[row.match_id]) squadMap[row.match_id] = [];
      squadMap[row.match_id].push(row.player_id);
      initializedMap[row.match_id] = true;
    }
    setMatchSquad(squadMap);
    setSquadInitialized(initializedMap);

    // Reconstituer coachAccessList depuis coaches + coach_teams
    const coachRows: CoachAccess[] = [];
    const coaches = coachesRes.data || [];
    const coachTeams = coachTeamsRes.data || [];
    for (const coach of coaches) {
      const cTeams = coachTeams.filter((ct: any) => ct.coach_id === coach.id);
      if (cTeams.length === 0) {
        coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: '', photo_url: coach.photo_url || null });
      } else {
        for (const ct of cTeams) {
          coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: ct.team_id, photo_url: coach.photo_url || null });
        }
      }
    }
    setCoachAccessList(coachRows);

    const parentUsrs = (usersRes.data || []).filter((u: UserItem) => u.role === 'parent' || u.role === 'player');
    if (parentUsrs.length > 0 && !selectedManagedParentId) setSelectedManagedParentId(parentUsrs[0].id);
    if (parentUsrs.length > 0 && !selectedLinkParentId) setSelectedLinkParentId(parentUsrs[0].id);
    if ((playersRes.data || []).length > 0 && !selectedLinkPlayerId) setSelectedLinkPlayerId((playersRes.data || [])[0].id);

    await loadLicenses();
    await loadRegistrations();
    setLoading(false);
    } catch(e) {
      console.warn('loadData failed (network blocked?):', e);
      setLoading(false);
    }
  }

  // ── Auth ──
  async function handleChangePassword() {
    if (newPassword.trim().length < 8) { setChangePwError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    if (newPassword !== newPassword2) { setChangePwError('Les deux mots de passe ne correspondent pas.'); return; }
    setChangePwLoading(true);
    setChangePwError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) throw error;
      setChangePwSuccess(true);
      setNewPassword('');
      setNewPassword2('');
      // Nettoyer le hash de l'URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e: any) {
      setChangePwError(e?.message || 'Erreur lors du changement de mot de passe.');
    }
    setChangePwLoading(false);
  }

  async function handleResetPassword() {
    if (!resetEmail.trim()) { setLoginError("Entre ton adresse email."); return; }
    setResetLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: appSettings.app_url || window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e: any) {
      setLoginError(e?.message?.includes('fetch')
        ? 'Connexion impossible depuis cet environnement.'
        : "Erreur lors de l'envoi. Vérifie l'adresse email.");
    }
    setResetLoading(false);
  }

  async function handleLogin(email: string, password: string) {
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        setLoginError(error?.message === 'Failed to fetch'
          ? 'Connexion impossible depuis cet environnement. Teste sur Bolt.new.'
          : 'Email ou mot de passe incorrect.');
        setLoginLoading(false);
        return;
      }
      await applyUserSession(data.user.id);
    } catch (e: any) {
      if (e?.message?.includes('fetch')) {
        setLoginError('Connexion impossible depuis StackBlitz. Utilise Bolt.new pour tester.');
      } else {
        setLoginError('Erreur de connexion. Réessaie.');
      }
    }
    setLoginLoading(false);
  }

  async function applyUserSession(authId: string) {
    try {
    // Récupérer le rôle depuis user_roles
    const { data: roleRow } = await supabase.from('user_roles').select('*').eq('auth_id', authId).maybeSingle();
    if (!roleRow) { setLoginError('Aucun rôle associé à ce compte.'); return; }

    if (roleRow.role === 'admin') {
      setIsAdmin(true);
      setAllowedTeamIds([]);
      setActiveRole('coach');
      setLoggedIn(true);
    } else if (roleRow.role === 'coach') {
      const { data: coachRow } = await supabase.from('coaches').select('id').eq('auth_id', authId).maybeSingle();
      if (coachRow) {
        const { data: ctData } = await supabase.from('coach_teams').select('team_id').eq('coach_id', coachRow.id);
        setAllowedTeamIds((ctData || []).map((ct: any) => ct.team_id));
        setConnectedCoachId(coachRow.id);
      }
      setIsAdmin(false);
      setActiveRole('coach');
      setLoggedIn(true);
    } else if (roleRow.role === 'parent') {
      // Vérifier que l'inscription est bien approuvée
      const { data: parentRow } = await supabase.from('users').select('id, email, is_active, player_id, roles_extra').eq('auth_id', authId).maybeSingle();
      if (!parentRow) {
        setLoginError("⏳ Votre compte est en attente de validation par l'administrateur. Vous recevrez un email dès que votre accès sera activé.");
        await supabase.auth.signOut();
        return;
      }
      if (parentRow.is_active === false) {
        setLoginError("🚫 Votre accès a été temporairement désactivé. Contactez l'administrateur du club.");
        await supabase.auth.signOut();
        return;
      }
      setSelectedParentId(parentRow.id);
      // Détecter si le user est aussi joueur (player_id renseigné OU roles_extra contient 'player')
      const playerId = (parentRow as any).player_id || null;
      const extras: string[] = ((parentRow as any).roles_extra || []) as string[];
      setLinkedPlayerId(playerId);
      setHasPlayerRole(!!playerId || extras.includes('player'));
      setIsAdmin(false);
      setActiveRole('parent');
      setLoggedIn(true);
    } else if (roleRow.role === 'player') {
      // Compte joueur direct (loisir/senior) — si plus tard on a ce role pur
      const { data: userRow } = await supabase.from('users').select('id, email, is_active, player_id, roles_extra').eq('auth_id', authId).maybeSingle();
      if (!userRow) {
        setLoginError("⏳ Votre compte est en attente de validation.");
        await supabase.auth.signOut();
        return;
      }
      if (userRow.is_active === false) {
        setLoginError("🚫 Votre accès a été désactivé.");
        await supabase.auth.signOut();
        return;
      }
      setSelectedParentId(userRow.id);
      setLinkedPlayerId((userRow as any).player_id || null);
      setHasPlayerRole(true);
      setIsAdmin(false);
      setActiveRole('parent');
      setLoggedIn(true);
    }
    } catch(e) { console.warn(e); }
  }

  async function handleLogout() {
    presenceHistoryLoggedRef.current = false;
    // Conserver la dernière activité pour l'historique admin.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('user_presence').update({ last_seen: new Date().toISOString() }).eq('auth_id', session.user.id);
      }
    } catch (e) { /* ignore */ }
    await supabase.auth.signOut();
    setLoggedIn(false);
    setIsAdmin(false);
    setAllowedTeamIds([]);
    setSelectedParentId('');
    setSelectedCoachTeamId('');
    setSelectedTrainingTemplateId('');
    setSelectedMatchId('');
    setConnectedCoachId(null);
    setLinkedPlayerId(null);
    setHasPlayerRole(false);
    setLoginError('');
  }

  // ── Helpers ──
  function getPlayerName(p: Partial<Player>) { return `${p.first_name || ''} ${p.last_name || ''}`.trim(); }

  function getPlayerAge(birthDate: string | null | undefined): number | null {
    if (!birthDate) return null;
    const today = new Date();
    const dob = new Date(birthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }

  async function uploadPlayerPhoto(playerId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `players/${playerId}.${ext}`;
    // Upload avec upsert
    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { console.error('Upload error', uploadError); return null; }
    // Récupérer l'URL publique propre (sans paramètres parasites)
    const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
    // Ajouter un timestamp pour forcer le rafraîchissement du cache navigateur
    const photoUrl = `${data.publicUrl}?v=${Date.now()}`;
    // Sauvegarder en base
    const { error: updateError } = await supabase.from('players').update({ photo_url: photoUrl }).eq('id', playerId);
    if (updateError) { console.error('Update error', updateError); return null; }
    // Mettre à jour localement sans recharger toute la page
    setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, photo_url: photoUrl } : p));
    return photoUrl;
  }

  async function uploadCoachPhoto(coachId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `coaches/${coachId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { console.error('Coach upload error', uploadError); return null; }
    const { data } = supabase.storage.from('player-photos').getPublicUrl(path);
    const photoUrl = `${data.publicUrl}?v=${Date.now()}`;
    await supabase.from('coaches').update({ photo_url: photoUrl }).eq('id', coachId);
    setCoachAccessList((prev) => prev.map((c) => c.id === coachId ? { ...c, photo_url: photoUrl } : c));
    return photoUrl;
  }
  function getUserName(u: Partial<UserItem>) { return `${u.first_name || ''} ${u.last_name || ''}`.trim(); }
  // ── Club Events CRUD ──
  async function saveEvent() {
    if (!newEventTitle.trim() || !newEventDate) return;
    setSavingEvent(true);
    const eventTeamIds = !isAdmin && newEventTeamIds.length === 0 ? visibleTeams.map((t) => t.id) : newEventTeamIds;
    const payload = {
      title: newEventTitle.trim(),
      description: newEventDesc.trim() || null,
      event_date: newEventDate,
      end_date: newEventEndDate || null,
      location: newEventLocation.trim() || null,
      type: newEventType,
      team_ids: eventTeamIds,
      payment_link: newEventPaymentLink.trim() || null,
    };
    if (editingEventId) {
      await supabase.from('events').update(payload).eq('id', editingEventId);
    } else {
      await supabase.from('events').insert(payload);
    }
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (data) setClubEvents(data as ClubEvent[]);
    setNewEventTitle(''); setNewEventDesc(''); setNewEventDate(''); setNewEventEndDate('');
    setNewEventLocation(''); setNewEventType('event'); setNewEventTeamIds([]); setNewEventPaymentLink(''); setEditingEventId('');
    setSavingEvent(false);
  }

  async function deleteEvent(ev: ClubEvent) {
    if (!window.confirm(`Supprimer l'événement "${ev.title}" ?`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    setClubEvents((p) => p.filter((e) => e.id !== ev.id));
  }

  async function saveEventAttendance(eventId: string, playerId: string, status: 'present' | 'absent' | 'pending') {
    const existing = eventAttendance.find((a) => a.event_id === eventId && a.player_id === playerId);
    if (existing) {
      await supabase.from('event_attendance').update({ status, responded_at: new Date().toISOString() }).eq('id', existing.id);
      setEventAttendance((p) => p.map((a) => a.id === existing.id ? { ...a, status } : a));
    } else {
      const { data } = await supabase.from('event_attendance').insert({ event_id: eventId, player_id: playerId, status, responded_by: activeRole }).select().single();
      if (data) setEventAttendance((p) => [...p, data as EventAttendance]);
    }
  }

  function getEventAttendanceStatus(eventId: string, playerId: string): 'present' | 'absent' | 'pending' {
    return eventAttendance.find((a) => a.event_id === eventId && a.player_id === playerId)?.status || 'pending';
  }

  function getEventCounts(eventId: string) {
    const att = eventAttendance.filter((a) => a.event_id === eventId);
    return {
      present: att.filter((a) => a.status === 'present').length,
      absent: att.filter((a) => a.status === 'absent').length,
      pending: att.filter((a) => a.status === 'pending').length,
    };
  }

  function renderEventVoters(eventId: string) {
    const groups: { status: 'present' | 'absent' | 'pending'; label: string; bg: string; color: string }[] = [
      { status: 'present', label: 'Présents', bg: '#dcfce7', color: '#166534' },
      { status: 'absent', label: 'Absents', bg: '#fee2e2', color: '#991b1b' },
      { status: 'pending', label: 'Sans réponse', bg: '#f1f5f9', color: '#475569' },
    ];
    const attendees = eventAttendance.filter((a) => a.event_id === eventId);
    if (attendees.length === 0) {
      return <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Aucun vote pour le moment.</div>;
    }
    return (
      <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        {groups.map((group) => {
          const rows = attendees
            .filter((a) => a.status === group.status)
            .map((a) => {
              const player = players.find((p) => p.id === a.player_id);
              return {
                id: a.id,
                name: player ? getPlayerName(player) : 'Joueur inconnu',
                team: player?.team_id ? getTeamName(player.team_id) : '',
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
          if (rows.length === 0) return null;
          return (
            <div key={group.status} style={{ padding: '8px 10px', borderRadius: 10, background: group.bg, border: `1px solid ${group.color}22` }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: group.color, marginBottom: 6 }}>{group.label} ({rows.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {rows.map((row) => (
                  <span key={row.id} title={row.team} style={{ padding: '4px 9px', borderRadius: 999, background: 'white', color: group.color, fontSize: 12, fontWeight: 800, border: `1px solid ${group.color}33` }}>
                    {row.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function getTournamentsForTeam(teamId: string) {
    return clubEvents
      .filter((ev) => ev.type === 'tournament')
      .filter((ev) => !ev.team_ids || ev.team_ids.length === 0 || ev.team_ids.includes(teamId))
      .filter((ev) => isFutureOrToday(ev.event_date))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }

  // ────────────── HELPERS PRÉSENCE EN LIGNE ──────────────
  function getOnlineCounts() {
    const cutoff = presenceTick - PRESENCE_ONLINE_WINDOW_MS;
    const fresh = onlinePresence.filter((p) => new Date(p.last_seen).getTime() >= cutoff);
    return {
      total: fresh.length,
      parents: fresh.filter((p) => p.role === 'parent').length,
      coaches: fresh.filter((p) => p.role === 'coach').length,
      admins: fresh.filter((p) => p.role === 'admin').length,
      players: fresh.filter((p) => p.role === 'player').length,
      list: fresh,
    };
  }

  function getConnectionStats() {
    const fallbackHistory: ConnectionHistory[] = onlinePresence.map((p) => ({
      auth_id: p.auth_id,
      role: p.role,
      display_name: p.display_name,
      seen_at: p.last_seen,
    }));
    const source = connectionHistory.length > 0 ? connectionHistory : [...localConnectionHistory, ...fallbackHistory];
    const cutoff = presenceTick - 7 * 24 * 60 * 60 * 1000;
    const recentRaw = source
      .filter((p) => new Date(p.seen_at).getTime() >= cutoff)
      .sort((a, b) => new Date(b.seen_at).getTime() - new Date(a.seen_at).getTime());
    const seenBuckets = new Set<string>();
    const recent = recentRaw.filter((item) => {
      const bucket = Math.floor(new Date(item.seen_at).getTime() / (15 * 60 * 1000));
      const key = `${item.auth_id}-${item.role}-${bucket}`;
      if (seenBuckets.has(key)) return false;
      seenBuckets.add(key);
      return true;
    });
    const byDay = recent.reduce<Record<string, { total: number; users: Set<string> }>>((acc, item) => {
      const day = new Date(item.seen_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      if (!acc[day]) acc[day] = { total: 0, users: new Set<string>() };
      acc[day].total += 1;
      acc[day].users.add(item.auth_id);
      return acc;
    }, {});
    return {
      history: recent,
      daily: Object.entries(byDay).map(([day, data]) => ({ day, total: data.total, users: data.users.size })),
      totals: {
        total: recent.length,
        parents: recent.filter((p) => p.role === 'parent').length,
        players: recent.filter((p) => p.role === 'player').length,
        coaches: recent.filter((p) => p.role === 'coach').length,
        admins: recent.filter((p) => p.role === 'admin').length,
      },
    };
  }

  // ────────────── HELPERS SONDAGES ──────────────
  function resetPollForm() {
    setEditingPollId('');
    setNewPollQuestion('');
    setNewPollDescription('');
    setNewPollExternalUrl('');
    setNewPollOptions(['', '']);
    setNewPollQuestions([{ id: 'q-1', question: '', options: ['', ''], multiple_choice: false }]);
    setNewPollTeamIds([]);
    setNewPollMultiple(false);
  }

  function normalizePollQuestions(poll: Poll): PollQuestion[] {
    if (Array.isArray(poll.questions) && poll.questions.length > 0) {
      return poll.questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question || `Question ${idx + 1}`,
        options: Array.isArray(q.options) ? q.options : [],
        multiple_choice: !!q.multiple_choice,
      }));
    }
    const legacyOptions = pollOptions.filter((o) => o.poll_id === poll.id);
    return [{
      id: 'q-1',
      question: poll.question,
      options: legacyOptions.map((o) => o.label),
      multiple_choice: !!poll.multiple_choice,
    }];
  }

  function getPollOptionsForQuestion(pollId: string, questionId: string): PollOption[] {
    const opts = pollOptions.filter((o) => o.poll_id === pollId);
    const questionOpts = opts.filter((o) => (o.question_key || 'q-1') === questionId);
    return questionOpts.length > 0 ? questionOpts : opts.filter((o) => !o.question_key);
  }

  function isMissingPollMigrationError(error: any) {
    const msg = String(error?.message || error || '').toLowerCase();
    return msg.includes('external_url') || msg.includes('questions') || msg.includes('question_key') || msg.includes('schema cache');
  }

  function buildLegacyPollOptions(questions: PollQuestion[]) {
    const multiQuestion = questions.length > 1;
    return questions.flatMap((q) => q.options.map((label) => multiQuestion ? `${q.question} - ${label}` : label));
  }

  async function addPoll() {
    const cleanQuestions = newPollQuestions
      .map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()).filter((o) => o.length > 0),
        multiple_choice: q.multiple_choice,
      }))
      .filter((q) => q.question.length > 0 || q.options.length > 0);
    if (cleanQuestions.length === 0) { alert('Ajoute au moins une question.'); return; }
    if (cleanQuestions.some((q) => !q.question)) { alert('Chaque question doit avoir un intitulé.'); return; }
    if (cleanQuestions.some((q) => q.options.length < 2)) { alert('Chaque question doit avoir au moins 2 options de réponse.'); return; }
    setSavingPoll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const createdBy = session?.user?.id || null;
      const pollTeamIds = !isAdmin && newPollTeamIds.length === 0 ? visibleTeams.map((t) => t.id) : newPollTeamIds;
      const mainQuestion = newPollQuestion.trim() || cleanQuestions[0].question;
      let pollId = editingPollId;
      if (editingPollId) {
        const { error: updateError } = await supabase.from('polls').update({
          question: mainQuestion,
          description: newPollDescription.trim() || null,
          external_url: newPollExternalUrl.trim() || null,
          questions: cleanQuestions,
          team_ids: pollTeamIds,
          multiple_choice: cleanQuestions.some((q) => q.multiple_choice),
        }).eq('id', editingPollId);
        if (updateError) {
          if (!isMissingPollMigrationError(updateError)) throw updateError;
          const { error: legacyUpdateError } = await supabase.from('polls').update({
            question: mainQuestion,
            description: [
              newPollDescription.trim(),
              newPollExternalUrl.trim() ? `Lien externe : ${newPollExternalUrl.trim()}` : '',
            ].filter(Boolean).join('\n') || null,
            team_ids: pollTeamIds,
            multiple_choice: cleanQuestions.some((q) => q.multiple_choice),
          }).eq('id', editingPollId);
          if (legacyUpdateError) throw legacyUpdateError;
        }
        // Supprimer anciennes options et leurs votes pour repartir propre
        await supabase.from('poll_options').delete().eq('poll_id', editingPollId);
      } else {
        const { data: np, error } = await supabase.from('polls').insert({
          question: mainQuestion,
          description: newPollDescription.trim() || null,
          external_url: newPollExternalUrl.trim() || null,
          questions: cleanQuestions,
          team_ids: pollTeamIds,
          multiple_choice: cleanQuestions.some((q) => q.multiple_choice),
          created_by: createdBy,
        }).select().single();
        if (error || !np) {
          if (!isMissingPollMigrationError(error)) throw error || new Error('Impossible de créer le sondage');
          const { data: legacyPoll, error: legacyError } = await supabase.from('polls').insert({
            question: mainQuestion,
            description: [
              newPollDescription.trim(),
              newPollExternalUrl.trim() ? `Lien externe : ${newPollExternalUrl.trim()}` : '',
            ].filter(Boolean).join('\n') || null,
            team_ids: pollTeamIds,
            multiple_choice: cleanQuestions.some((q) => q.multiple_choice),
            created_by: createdBy,
          }).select().single();
          if (legacyError || !legacyPoll) throw legacyError || new Error('Impossible de créer le sondage');
          pollId = legacyPoll.id;
        } else {
          pollId = np.id;
        }
      }
      const optsRows = cleanQuestions.flatMap((q) => q.options.map((label, idx) => ({
        poll_id: pollId,
        question_key: q.id,
        label,
        display_order: idx,
      })));
      const { error: optionsError } = await supabase.from('poll_options').insert(optsRows);
      if (optionsError) {
        if (!isMissingPollMigrationError(optionsError)) throw optionsError;
        const legacyRows = buildLegacyPollOptions(cleanQuestions).map((label, idx) => ({ poll_id: pollId, label, display_order: idx }));
        const { error: legacyOptionsError } = await supabase.from('poll_options').insert(legacyRows);
        if (legacyOptionsError) throw legacyOptionsError;
      }
      // Reload
      const { data: pData } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
      if (pData) setPolls(pData as Poll[]);
      const { data: poData } = await supabase.from('poll_options').select('*').order('display_order', { ascending: true });
      if (poData) setPollOptions(poData as PollOption[]);
      const { data: pvData } = await supabase.from('poll_votes').select('*');
      if (pvData) setPollVotes(pvData as PollVote[]);
      resetPollForm();
      alert(editingPollId ? '✅ Sondage modifié' : '✅ Sondage créé et envoyé');
    } catch (e: any) { console.error(e); alert('Erreur : ' + (e?.message || 'inconnue')); }
    finally { setSavingPoll(false); }
  }

  async function deletePoll(pollId: string) {
    if (!window.confirm('Supprimer ce sondage et tous ses votes ?')) return;
    await supabase.from('polls').delete().eq('id', pollId);
    setPolls((p) => p.filter((x) => x.id !== pollId));
    setPollOptions((p) => p.filter((x) => x.poll_id !== pollId));
    setPollVotes((p) => p.filter((x) => x.poll_id !== pollId));
  }

  async function togglePollClosed(pollId: string, closed: boolean) {
    await supabase.from('polls').update({ closed: !closed }).eq('id', pollId);
    setPolls((p) => p.map((x) => x.id === pollId ? { ...x, closed: !closed } : x));
  }

  async function votePoll(pollId: string, optionIds: string[], voterUserId: string | null, voterPlayerId: string | null, voterLabel: string) {
    // Supprimer anciens votes du même voter
    if (voterUserId) await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('voter_user_id', voterUserId);
    if (voterPlayerId) await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('voter_player_id', voterPlayerId);
    const rows = optionIds.map((option_id) => ({
      poll_id: pollId, option_id,
      voter_user_id: voterUserId, voter_player_id: voterPlayerId,
      voter_label: voterLabel,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('poll_votes').insert(rows);
      if (error) { alert('Erreur lors du vote : ' + error.message); return; }
    }
    const { data: pvData } = await supabase.from('poll_votes').select('*');
    if (pvData) setPollVotes(pvData as PollVote[]);
  }

  async function votePollQuestion(pollId: string, optionIds: string[], questionOptionIds: string[], voterUserId: string | null, voterPlayerId: string | null, voterLabel: string) {
    if (questionOptionIds.length === 0) return;
    if (voterUserId) {
      await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('voter_user_id', voterUserId).in('option_id', questionOptionIds);
    }
    if (voterPlayerId) {
      await supabase.from('poll_votes').delete().eq('poll_id', pollId).eq('voter_player_id', voterPlayerId).in('option_id', questionOptionIds);
    }
    const rows = optionIds.map((option_id) => ({
      poll_id: pollId, option_id,
      voter_user_id: voterUserId, voter_player_id: voterPlayerId,
      voter_label: voterLabel,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('poll_votes').insert(rows);
      if (error) { alert('Erreur lors du vote : ' + error.message); return; }
    }
    const { data: pvData } = await supabase.from('poll_votes').select('*');
    if (pvData) setPollVotes(pvData as PollVote[]);
  }

  function getMyVotesForPoll(pollId: string, voterUserId: string | null, voterPlayerId: string | null): string[] {
    return pollVotes
      .filter((v) => v.poll_id === pollId &&
        ((voterUserId && v.voter_user_id === voterUserId) ||
         (voterPlayerId && v.voter_player_id === voterPlayerId)))
      .map((v) => v.option_id);
  }

  function getPollResults(pollId: string) {
    const opts = pollOptions.filter((o) => o.poll_id === pollId);
    const votes = pollVotes.filter((v) => v.poll_id === pollId);
    const total = votes.length;
    return opts.map((o) => {
      const optVotes = votes.filter((v) => v.option_id === o.id);
      return {
        option: o,
        count: optVotes.length,
        percent: total > 0 ? Math.round((optVotes.length / total) * 100) : 0,
        voters: optVotes,
      };
    });
  }

  // Sondages visibles pour un parent/joueur
  function getPollsVisibleFor(playerTeamIds: string[]): Poll[] {
    return polls.filter((p) => p.team_ids.length === 0 || p.team_ids.some((tid) => playerTeamIds.includes(tid)));
  }

  // ────────────── HELPERS FORMULAIRES D'ÉVÉNEMENTS ──────────────
  function getQuestionsForEvent(eventId: string): EventFormQuestion[] {
    return eventFormQuestions.filter((q) => q.event_id === eventId).sort((a, b) => a.display_order - b.display_order);
  }

  function getResponseForQuestion(questionId: string, playerId: string): EventFormResponse | undefined {
    return eventFormResponses.find((r) => r.question_id === questionId && r.player_id === playerId);
  }

  function parseMultiAnswer(answer: string | null | undefined): string[] {
    if (!answer) return [];
    try {
      const parsed = JSON.parse(answer);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return answer.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }

  function formatEventFormAnswer(answer: string | null | undefined): string {
    if (!answer) return '(vide)';
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) return parsed.length > 0 ? parsed.map(String).join(', ') : '(vide)';
    } catch {}
    return answer;
  }

  async function saveEventForm(eventId: string) {
    if (draftFormQuestions.length === 0) {
      // Pas de questions : on supprime tout pour cet event
      await supabase.from('event_form_questions').delete().eq('event_id', eventId);
      setEventFormQuestions((p) => p.filter((q) => q.event_id !== eventId));
      setEditingEventFormId(''); setDraftFormQuestions([]);
      return;
    }
    setSavingEventForm(true);
    try {
      // Strategy: delete all existing questions for event, then re-insert
      await supabase.from('event_form_questions').delete().eq('event_id', eventId);
      const rows = draftFormQuestions.map((q, idx) => ({
        event_id: eventId,
        question: q.question.trim(),
        type: q.type,
        choices: q.type === 'choice' || q.type === 'multi' ? q.choices.filter((c) => c.trim().length > 0) : null,
        required: q.required,
        display_order: idx,
      }));
      const { data, error } = await supabase.from('event_form_questions').insert(rows).select();
      if (error) throw error;
      setEventFormQuestions((p) => [...p.filter((q) => q.event_id !== eventId), ...((data || []) as EventFormQuestion[])]);
      setEditingEventFormId(''); setDraftFormQuestions([]);
      alert('✅ Formulaire enregistré');
    } catch (e: any) { console.error(e); alert('Erreur : ' + (e?.message || 'inconnue')); }
    finally { setSavingEventForm(false); }
  }

  async function submitEventFormResponse(eventId: string, questionId: string, playerId: string, answer: string, responderUserId: string | null, responderLabel: string) {
    const existing = eventFormResponses.find((r) => r.question_id === questionId && r.player_id === playerId);
    if (existing) {
      await supabase.from('event_form_responses').update({
        answer, updated_at: new Date().toISOString(),
        responder_user_id: responderUserId, responder_label: responderLabel,
      }).eq('id', existing.id);
      setEventFormResponses((p) => p.map((r) => r.id === existing.id ? { ...r, answer, responder_user_id: responderUserId, responder_label: responderLabel } : r));
    } else {
      const { data, error } = await supabase.from('event_form_responses').insert({
        event_id: eventId, question_id: questionId, player_id: playerId,
        answer, responder_user_id: responderUserId, responder_label: responderLabel,
      }).select().single();
      if (error) { console.error(error); return; }
      if (data) setEventFormResponses((p) => [...p, data as EventFormResponse]);
    }
  }

  function formatDate(d: string) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
  }
  function formatTime(d: string) {
    if (!d) return '';
    try { return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }
  function getWeekdayLabel(w: number) {
    return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][w] || '-';
  }
  function getTeamName(teamId: string) { return teams.find((t) => t.id === teamId)?.name || 'Équipe inconnue'; }
  function getTeamCategory(teamId: string) {
    const t = teams.find((x) => x.id === teamId);
    return t?.category || t?.name || 'Sans catégorie';
  }
  function getPlayersForTeam(teamId: string) { return players.filter((p) => p.team_id === teamId); }
  function getSeasonAssignment(playerId: string, seasonId = ''): PlayerSeasonAssignment | null {
    if (!seasonId) return null;
    return playerSeasonAssignments.find((a) => a.player_id === playerId && a.season_id === seasonId) || null;
  }
  function getPlayerTeamIdForSeason(player: Player, seasonId = '') {
    return getSeasonAssignment(player.id, seasonId)?.team_id || player.team_id;
  }
  function getPlayersForTeamSeason(teamId: string, seasonId = '') {
    return players.filter((p) => getPlayerTeamIdForSeason(p, seasonId) === teamId);
  }
  function getPlayerSeasonTeamName(player: Player, seasonId = '') {
    const assignment = getSeasonAssignment(player.id, seasonId);
    const teamId = assignment?.team_id || player.team_id;
    const suffix = assignment ? (assignment.status === 'confirmed' ? ' (confirme)' : ' (brouillon)') : '';
    return `${getTeamName(teamId)}${suffix}`;
  }
  function getStatForPlayer(playerId: string) { return stats.find((s) => s.player_id === playerId); }
  function getMatchPlayerStat(matchId: string, playerId: string) {
    return matchPlayerStats.find((s) => s.match_id === matchId && s.player_id === playerId);
  }
  function getNextDatesForWeekday(weekday: number, count = 6) {
    const result: string[] = [];
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    for (let i = 0; result.length < count && i < 90; i++) {
      const t = new Date(current);
      t.setDate(current.getDate() + i);
      if (t.getDay() === weekday) {
        // Format YYYY-MM-DD en local (pas UTC)
        const y = t.getFullYear();
        const m = String(t.getMonth() + 1).padStart(2, '0');
        const d = String(t.getDate()).padStart(2, '0');
        result.push(`${y}-${m}-${d}`);
      }
    }
    return result;
  }
  function getTrainingCancellation(templateId: string, date: string) {
    return trainingCancellations.find((c) => c.training_template_id === templateId && c.training_date === date) || null;
  }
  function isTrainingInBreak(template: TrainingTemplate, date: string) {
    return trainingBreaks.some((b) => {
      const appliesToTeam = !b.team_id || b.team_id === template.team_id;
      return appliesToTeam && date >= b.start_date && date <= b.end_date;
    });
  }
  function getNextTrainingsForTemplate(template: TrainingTemplate, count = 6, includeCancelled = true): UpcomingTraining[] {
    const result: UpcomingTraining[] = [];
    const dates = getNextDatesForWeekday(template.weekday, Math.max(count * 4, 12));
    for (const date of dates) {
      if (isTrainingInBreak(template, date)) continue;
      const cancellation = getTrainingCancellation(template.id, date);
      if (cancellation && !includeCancelled) continue;
      result.push({
        templateId: template.id,
        teamId: template.team_id,
        title: template.title,
        weekday: template.weekday,
        startTime: template.start_time,
        endTime: template.end_time,
        location: template.location,
        date,
        cancelled: !!cancellation,
        cancellationReason: cancellation?.reason || null,
      });
      if (result.length >= count) break;
    }
    return result;
  }
  function isFutureOrToday(date: string) {
    if (!date) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const test = new Date(date); test.setHours(0, 0, 0, 0);
    return test >= today;
  }
  // Filtre par saison : retourne les bornes de la saison sélectionnée
  function getSeasonBounds(seasonId: string): { start: Date | null; end: Date | null } {
    if (!seasonId) return { start: null, end: null };
    const s = seasons.find((x) => x.id === seasonId);
    if (!s) return { start: null, end: null };
    return {
      start: s.start_date ? new Date(s.start_date) : null,
      end: s.end_date ? new Date(s.end_date + 'T23:59:59') : null,
    };
  }

  function inSeasonRange(dateStr: string, start: Date | null, end: Date | null): boolean {
    if (!start && !end) return true;
    const d = new Date(dateStr);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  function getTrainingPresentCount(playerId: string, seasonId = '') {
    const { start, end } = getSeasonBounds(seasonId);
    return trainingAttendance.filter((a) =>
      a.player_id === playerId && a.status === 'present' &&
      inSeasonRange(a.training_date, start, end)
    ).length;
  }
  function getMatchPresentCount(playerId: string, seasonId = '') {
    const { start, end } = getSeasonBounds(seasonId);
    const filteredMatchIds = seasonId
      ? matches.filter((m) => inSeasonRange(m.match_date, start, end)).map((m) => m.id)
      : null;
    return matchAttendance.filter((a) =>
      a.player_id === playerId && a.status === 'present' &&
      (!filteredMatchIds || filteredMatchIds.includes(a.match_id))
    ).length;
  }
  function getTrainingTotalCount(teamId: string, seasonId = '') {
    const { start, end } = getSeasonBounds(seasonId);
    const templateIds = trainingTemplates.filter((t) => t.team_id === teamId).map((t) => t.id);
    const dates = new Set(
      trainingAttendance
        .filter((a) =>
          templateIds.includes(a.training_template_id || '') &&
          inSeasonRange(a.training_date, start, end)
        )
        .map((a) => `${a.training_template_id}__${a.training_date}`)
    );
    return dates.size;
  }
  function getMatchTotalCount(teamId: string, seasonId = '') {
    const { start, end } = getSeasonBounds(seasonId);
    const teamMatchIds = matches
      .filter((m) => m.team_id === teamId && inSeasonRange(m.match_date, start, end))
      .map((m) => m.id);
    const played = new Set(matchAttendance.filter((a) => teamMatchIds.includes(a.match_id || '')).map((a) => a.match_id));
    return played.size;
  }
  function getMatchPlayerStatsForSeason(playerId: string, seasonId = '') {
    const { start, end } = getSeasonBounds(seasonId);
    const seasonMatchIds = seasonId
      ? matches.filter((m) => inSeasonRange(m.match_date, start, end)).map((m) => m.id)
      : null;
    return matchPlayerStats.filter((s) =>
      s.player_id === playerId && (!seasonMatchIds || seasonMatchIds.includes(s.match_id))
    );
  }
  function getAttendanceStatus(templateId: string, playerId: string, date: string) {
    return trainingAttendance.find(
      (a) => a.training_template_id === templateId && a.player_id === playerId && a.training_date === date
    )?.status || 'unknown';
  }
  function getTrainingCounts(templateId: string, teamId: string, date: string) {
    const tp = getPlayersForTeam(teamId);
    let present = 0, absent = 0, unknown = 0;
    for (const p of tp) {
      const s = getAttendanceStatus(templateId, p.id, date);
      if (s === 'present') present++; else if (s === 'absent') absent++; else unknown++;
    }
    return { present, absent, unknown, total: tp.length };
  }
  function getPreferredUpcomingMatch(matchList: MatchItem[]) {
    if (matchList.length === 0) return null;
    const now = new Date();
    const future = [...matchList].filter((m) => new Date(m.match_date) >= now).sort((a, b) => a.match_date.localeCompare(b.match_date));
    if (future.length > 0) return future[0];
    return [...matchList].sort((a, b) => b.match_date.localeCompare(a.match_date))[0];
  }
  function getMatchAttendanceStatus(matchId: string, playerId: string) {
    return matchAttendance.find((a) => a.match_id === matchId && a.player_id === playerId)?.status || 'unknown';
  }
  function getMatchCounts(matchId: string, teamId: string) {
    const tp = getPlayersForTeam(teamId);
    let present = 0, absent = 0, unknown = 0;
    for (const p of tp) {
      const s = getMatchAttendanceStatus(matchId, p.id);
      if (s === 'present') present++; else if (s === 'absent') absent++; else unknown++;
    }
    return { present, absent, unknown, total: tp.length };
  }
  function renderMatchPresenceOverview(match: MatchItem) {
    const squadIds = getSquadForMatch(match.id);
    const squadDefined = isSquadDefined(match.id);
    const displayPlayers = squadDefined
      ? squadIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[]
      : getPlayersForTeam(match.team_id || '');
    const groups = [
      { key: 'present', label: 'Présents', bg: '#dcfce7', color: '#166534', list: displayPlayers.filter((p) => getMatchAttendanceStatus(match.id, p.id) === 'present') },
      { key: 'absent', label: 'Absents', bg: '#fee2e2', color: '#991b1b', list: displayPlayers.filter((p) => getMatchAttendanceStatus(match.id, p.id) === 'absent') },
      { key: 'unknown', label: 'Sans réponse', bg: '#f1f5f9', color: '#475569', list: displayPlayers.filter((p) => getMatchAttendanceStatus(match.id, p.id) === 'unknown') },
      { key: 'squad', label: 'Convoqués', bg: '#dbeafe', color: '#1e40af', list: squadDefined ? displayPlayers : [] },
    ];
    return (
      <div style={{ ...styles.panelCard, marginBottom: 20, background: '#f8fbff', border: '1px solid #bfdbfe' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1e40af' }}>Présences du match</h4>
        {!squadDefined && (
          <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12, fontWeight: 700 }}>
            Convocation pas encore définie : la liste affiche les joueurs de l'équipe.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
          {groups.map((group) => (
            <div key={group.key} style={{ padding: 12, borderRadius: 14, background: group.bg, border: `1px solid ${group.color}22`, minHeight: 92 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: group.color }}>{group.label}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: group.color }}>{group.list.length}</span>
              </div>
              {group.list.length === 0 ? (
                <div style={{ fontSize: 12, color: group.color, opacity: 0.72, fontStyle: 'italic' }}>Aucun joueur</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.list.sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr')).map((player) => {
                    const isGuest = player.team_id !== match.team_id;
                    const guestTeam = isGuest ? teams.find((t) => t.id === player.team_id) : null;
                    return (
                      <span key={player.id} title={guestTeam?.name || undefined} style={{ padding: '4px 9px', borderRadius: 999, background: 'white', color: group.color, fontSize: 12, fontWeight: 800, border: `1px solid ${group.color}33` }}>
                        {getPlayerName(player)}{isGuest && guestTeam ? ` (${guestTeam.name})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  function getLinkedParentsForPlayer(playerId: string) {
    const ids = parentLinks.filter((l) => l.player_id === playerId).map((l) => l.parent_id);
    return users.filter((u) => (u.role === 'parent' || u.role === 'player') && ids.includes(u.id));
  }
  /**
   * Visibilité des stats individuelles dans la vue "Équipe" :
   * - Mes propres enfants : TOUJOURS visibles (le parent voit ses enfants)
   * - Les autres : JAMAIS visibles côté parent (carte sans stats/grade/OVR)
   * - Si l'équipe a stats_hidden_for_parents = true : même mes enfants sont masqués
   *   (le coach a décidé que personne ne voit les stats de cette équipe)
   * - Coach et admin voient TOUJOURS tout (cette fonction n'est pas utilisée par eux)
   */
  function isPlayerStatsVisibleForParent(player: Player, isMyChild: boolean, seasonId = ''): boolean {
    const team = teams.find((t) => t.id === getPlayerTeamIdForSeason(player, seasonId));
    const teamHidden = team?.stats_hidden_for_parents === true;
    if (teamHidden) return false; // équipe verrouillée par le coach
    return isMyChild; // sinon, visible uniquement pour mon propre enfant
  }
  /**
   * Construit la liste de données nécessaires pour les cartes FIFA d'une équipe,
   * dans l'ordre tel qu'affiché à l'écran (par n° de maillot puis nom).
   * `forParent` = true → applique la règle de visibilité parent.
   * `forParent` = false → coach/admin → tout est visible.
   */
  function buildFifaCardsForTeam(teamId: string, forParent: boolean, seasonId: string = '') {
    const tps = getPlayersForTeamSeason(teamId, seasonId);
    const sorted = [...tps].sort((a, b) => {
      if (a.jersey_number != null && b.jersey_number != null) return a.jersey_number - b.jersey_number;
      if (a.jersey_number != null) return -1;
      if (b.jersey_number != null) return 1;
      return a.last_name.localeCompare(b.last_name);
    });
    return sorted.map((p) => {
      const myChildren = forParent ? parentPlayers : [];
      const isMyChild = myChildren.some((c) => c.id === p.id);
      const trainingPresences = getTrainingPresentCount(p.id, seasonId);
      // Filtrer les stats par saison si fournie
      const playerStats = seasonId
        ? getMatchPlayerStatsForSeason(p.id, seasonId)
        : matchPlayerStats.filter((s) => s.player_id === p.id);
      const goals = playerStats.reduce((sum, s) => sum + (s.goals || 0), 0);
      const shots = playerStats.reduce((sum, s) => sum + (s.shots || 0), 0);
      const matchesPlayed = getMatchPresentCount(p.id, seasonId);
      const hideStats = forParent ? !isPlayerStatsVisibleForParent(p, isMyChild, seasonId) : false;
      return {
        player: p,
        totalTrainingPresences: trainingPresences,
        totalGoals: goals,
        totalShots: shots,
        totalMatches: matchesPlayed,
        isMyChild,
        hideStats,
        age: getPlayerAge(p.birth_date),
      };
    });
  }
  function generateFourDigitPin() { return String(Math.floor(1000 + Math.random() * 9000)); }

  function initMatchResult(match: MatchItem) {
    setMatchResults((prev) => ({
      ...prev,
      [match.id]: {
        score_home: prev[match.id]?.score_home ?? (match.score_home != null ? String(match.score_home) : ''),
        score_away: prev[match.id]?.score_away ?? (match.score_away != null ? String(match.score_away) : ''),
      },
    }));
  }

  function getSquadForMatch(matchId: string) { return matchSquad[matchId] || []; }
  function isSquadDefined(matchId: string) { return !!squadInitialized[matchId]; }
  async function togglePlayerInSquad(matchId: string, playerId: string) {
    const current = matchSquad[matchId] || [];
    const inSquad = current.includes(playerId);

    // Mettre à jour le state local immédiatement
    setSquadInitialized((p) => ({ ...p, [matchId]: true }));
    if (inSquad) {
      setMatchSquad((prev) => ({ ...prev, [matchId]: current.filter((id) => id !== playerId) }));
      await supabase.from('match_squads').delete().eq('match_id', matchId).eq('player_id', playerId);
    } else {
      setMatchSquad((prev) => ({ ...prev, [matchId]: [...current, playerId] }));
      await supabase.from('match_squads').upsert({ match_id: matchId, player_id: playerId }, { onConflict: 'match_id,player_id' });
      // Initialiser la présence à "unknown" si pas encore définie
      const existingAtt = matchAttendance.find((a) => a.match_id === matchId && a.player_id === playerId);
      if (!existingAtt) {
        await supabase.from('match_attendance').upsert({ match_id: matchId, player_id: playerId, status: 'unknown' }, { onConflict: 'match_id,player_id' });
      }
      // Envoi email auto
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          const linkedParentIds = parentLinks.filter((l) => l.player_id === playerId).map((l) => l.parent_id);
          const linkedParents = users.filter((u) => u.role === 'parent' && linkedParentIds.includes(u.id) && u.email);
          if (linkedParents.length > 0) {
            const payload = {
              players: linkedParents.map((par) => ({
                playerName: getPlayerName(player),
                parentEmail: par.email,
                parentName: `${par.first_name || ''} ${par.last_name || ''}`.trim(),
              })),
              match: { opponent: match.opponent, date: match.match_date, location: match.location || '', home_away: match.home_away },
              appUrl: appSettings.app_url,
            };
            supabase.functions.invoke('send-convocation', { body: payload }).catch(console.error);
          }
        }
      }
    }
    await loadDataSilent();
  }

  const [sendingConvocations, setSendingConvocations] = useState(false);
  async function sendAllConvocations(matchId: string) {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;
    const squad = getSquadForMatch(matchId);
    if (squad.length === 0) { alert('Aucun joueur dans la convocation'); return; }
    setSendingConvocations(true);
    try {
      const playersToNotify: { playerName: string; parentEmail: string; parentName: string; }[] = [];
      for (const playerId of squad) {
        const player = players.find((p) => p.id === playerId);
        if (!player) continue;
        const linkedParentIds = parentLinks.filter((l) => l.player_id === playerId).map((l) => l.parent_id);
        const linkedParents = users.filter((u) => u.role === 'parent' && linkedParentIds.includes(u.id) && u.email);
        for (const par of linkedParents) {
          playersToNotify.push({
            playerName: getPlayerName(player),
            parentEmail: par.email,
            parentName: `${par.first_name || ''} ${par.last_name || ''}`.trim(),
          });
        }
      }
      if (playersToNotify.length === 0) { alert('Aucun parent avec email trouvé pour cette convocation'); return; }
      const { data, error } = await supabase.functions.invoke('send-convocation', {
        body: {
          players: playersToNotify,
          match: { opponent: match.opponent, date: match.match_date, location: match.location || '', home_away: match.home_away },
          appUrl: appSettings.app_url,
        },
      });
      if (error) throw error;
      alert(`✅ ${data?.sent || 0} email(s) envoyé(s)${data?.failed > 0 ? `, ${data.failed} échec(s)` : ''}`);
    } catch (e) { console.error(e); alert("Erreur lors de l'envoi des emails"); }
    finally { setSendingConvocations(false); }
  }

  async function sendTrainingManualReminder(template: TrainingTemplate, date: string) {
    const key = `${template.id}-${date}`;
    setSendingTrainingReminder(key);
    try {
      // Collect all parents for this team
      const teamPlayers = players.filter((p) => p.team_id === template.team_id);
      const allParentIds = new Set<string>();
      teamPlayers.forEach((p) => {
        parentLinks.filter((l) => l.player_id === p.id).forEach((l) => allParentIds.add(l.parent_id));
      });
      const recipients = users.filter((u) => u.role === 'parent' && allParentIds.has(u.id) && u.email);
      if (recipients.length === 0) {
        alert('Aucun parent avec email trouvé pour cette équipe.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('send-training-reminder', {
        body: {
          recipients: recipients.map((u) => ({
            email: u.email,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          })),
          training: {
            title: template.title || 'Entraînement',
            date,
            startTime: template.start_time,
            endTime: template.end_time,
            location: template.location || '',
            teamName: getTeamName(template.team_id),
          },
          reminderType: 'manual',
          appUrl: appSettings.app_url,
        },
      });
      if (error) throw error;
      alert(`✅ Rappel envoyé à ${data?.sent || recipients.length} parent(s) !`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'envoi du rappel.");
    } finally {
      setSendingTrainingReminder('');
    }
  }

  function getTrainingParentRecipients(teamId: string) {
    const teamPlayers = players.filter((p) => p.team_id === teamId);
    const allParentIds = new Set<string>();
    teamPlayers.forEach((p) => {
      parentLinks.filter((l) => l.player_id === p.id).forEach((l) => allParentIds.add(l.parent_id));
    });
    return users.filter((u) => u.role === 'parent' && allParentIds.has(u.id) && u.email);
  }

  async function cancelTraining(template: TrainingTemplate, date: string) {
    const existing = getTrainingCancellation(template.id, date);
    if (existing) {
      if (!window.confirm(`Remettre l'entraînement du ${formatDate(date)} comme prévu ?`)) return;
      const { error } = await supabase.from('training_cancellations').delete().eq('id', existing.id);
      if (error) { alert("Erreur lors de la remise au planning"); return; }
      await loadData();
      return;
    }
    const reason = window.prompt(`Raison de l'annulation du ${formatDate(date)} (optionnel)`, '');
    if (reason === null) return;
    if (!window.confirm(`Annuler l'entraînement ${template.title || 'Entraînement'} du ${formatDate(date)} et prévenir les parents par email ?`)) return;
    const key = `${template.id}-${date}`;
    setCancelingTrainingKey(key);
    try {
      const { error } = await supabase.from('training_cancellations').upsert({
        training_template_id: template.id,
        training_date: date,
        reason: reason.trim() || null,
        cancelled_by: connectedCoachId || (isAdmin ? 'admin' : null),
      }, { onConflict: 'training_template_id,training_date' });
      if (error) throw error;

      const recipients = getTrainingParentRecipients(template.team_id);
      if (recipients.length > 0) {
        const body = {
          recipients: recipients.map((u) => ({
            email: u.email,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          })),
          training: {
            title: template.title || 'Entraînement',
            date,
            startTime: template.start_time,
            endTime: template.end_time,
            location: template.location || '',
            teamName: getTeamName(template.team_id),
            reason: reason.trim() || '',
          },
          reminderType: 'cancelled',
          appUrl: appSettings.app_url,
        };
        const { error: mailError } = await supabase.functions.invoke('send-training-cancellation', { body });
        if (mailError) {
          await Promise.all(recipients.map((u) => supabase.functions.invoke('send-message-notification', {
            body: {
              recipientEmail: u.email,
              recipientName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              senderName: 'Le Staff CA Gorcy',
              message: `Entraînement annulé : ${template.title || 'Entraînement'} du ${formatDate(date)} (${template.start_time}-${template.end_time}) à ${template.location || '-'}.${reason.trim() ? ` Raison : ${reason.trim()}` : ''}`,
              appUrl: appSettings.app_url,
            },
          }).catch(console.error)));
        }
      }

      await loadData();
      alert(`✅ Entraînement annulé${recipients.length > 0 ? `, email envoyé à ${recipients.length} parent(s).` : '. Aucun parent avec email trouvé.'}`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'annulation de l'entraînement.");
    } finally {
      setCancelingTrainingKey('');
    }
  }

  async function addTrainingBreak() {
    if (!newBreakTitle.trim() || !newBreakStart || !newBreakEnd) { alert('Titre, début et fin obligatoires.'); return; }
    if (newBreakEnd < newBreakStart) { alert('La date de fin doit être après la date de début.'); return; }
    const targetTeamId = isAdmin ? (newBreakTeamId || null) : (selectedCoachTeamId || null);
    const { error } = await supabase.from('training_breaks').insert({
      team_id: targetTeamId,
      title: newBreakTitle.trim(),
      start_date: newBreakStart,
      end_date: newBreakEnd,
      reason: newBreakReason.trim() || null,
    });
    if (error) { alert("Erreur lors de l'ajout de la période."); return; }
    setNewBreakTitle('Vacances'); setNewBreakStart(''); setNewBreakEnd(''); setNewBreakReason('');
    await loadData();
  }

  async function deleteTrainingBreak(id: string) {
    if (!window.confirm('Supprimer cette période de vacances ?')) return;
    const { error } = await supabase.from('training_breaks').delete().eq('id', id);
    if (error) { alert('Erreur lors de la suppression.'); return; }
    await loadData();
  }

  // ── Actions ──
  async function saveAttendance(templateId: string, playerId: string, trainingDate: string, status: 'present' | 'absent') {
    const { error } = await supabase.from('training_attendance').upsert(
      { training_template_id: templateId, player_id: playerId, training_date: trainingDate, status },
      { onConflict: 'training_template_id,player_id,training_date' }
    );
    if (error) { alert("Erreur lors de l'enregistrement de la présence"); return; }
    await loadData();
  }

  async function saveMatchAttendance(matchId: string, playerId: string, status: 'present' | 'absent' | 'unknown') {
    const { error } = await supabase.from('match_attendance').upsert(
      { match_id: matchId, player_id: playerId, status },
      { onConflict: 'match_id,player_id' }
    );
    if (error) { alert("Erreur lors de l'enregistrement de la présence au match"); return; }
    await loadData();
  }

  async function saveAllMatchStats(matchId: string, rows: PlayerStatRow[]) {
    // Upsert chaque ligne dans match_player_stats
    for (const row of rows) {
      const { error } = await supabase.from('match_player_stats').upsert(
        { match_id: matchId, player_id: row.playerId, goals: row.goals, assists: row.assists, shots: row.shots, saves: row.saves, penalty_scored: row.penalty_scored, two_minutes: row.two_minutes },
        { onConflict: 'match_id,player_id' }
      );
      if (error) { alert("Erreur lors de l'enregistrement des stats pour " + row.playerName); return; }
    }
    // Mettre à jour player_stats global (recalcul depuis match_player_stats)
    for (const row of rows) {
      const { data: allMatchStats } = await supabase.from('match_player_stats').select('goals, assists, shots, saves').eq('player_id', row.playerId);
      if (!allMatchStats) continue;
      const totalGoals = allMatchStats.reduce((s: number, r: any) => s + (r.goals || 0), 0);
      const totalAssists = allMatchStats.reduce((s: number, r: any) => s + (r.assists || 0), 0);
      const totalSaves = allMatchStats.reduce((s: number, r: any) => s + (r.saves || 0), 0);
      const matchesPlayed = allMatchStats.length;
      const { data: existingStat } = await supabase.from('player_stats').select('id').eq('player_id', row.playerId).maybeSingle();
      if (existingStat) {
        await supabase.from('player_stats').update({ goals: totalGoals, assists: totalAssists, saves: totalSaves, matches_played: matchesPlayed }).eq('player_id', row.playerId);
      } else {
        await supabase.from('player_stats').insert({ player_id: row.playerId, goals: totalGoals, assists: totalAssists, saves: totalSaves, matches_played: matchesPlayed });
      }
    }
    await loadData();
  }

  async function saveMatchResult(matchId: string) {
    const result = matchResults[matchId];
    if (!result) return;
    setSavingMatchResult(true);
    try {
      const { error } = await supabase.from('matches').update({
        score_home: result.score_home || null,
        score_away: result.score_away || null,
      }).eq('id', matchId);
      if (error) throw error;
      await loadData();
      alert('Résultat enregistré');
    } catch (e) { console.error(e); alert("Erreur lors de l'enregistrement du résultat"); }
    finally { setSavingMatchResult(false); }
  }

  function resetTrainingTemplateForm() {
    setEditingTrainingTemplateId('');
    setNewTrainingTitle('Entrainement');
    setNewTrainingWeekday('3');
    setNewTrainingStart('18:30');
    setNewTrainingEnd('20:00');
    setNewTrainingLocation('Gymnase de Gorcy');
    setNewTrainingTeamId(visibleTeams[0]?.id || teams[0]?.id || '');
  }

  function startEditTrainingTemplate(template: TrainingTemplate) {
    setEditingTrainingTemplateId(template.id);
    setNewTrainingTeamId(template.team_id);
    setNewTrainingTitle(template.title || 'Entrainement');
    setNewTrainingWeekday(String(template.weekday));
    setNewTrainingStart((template.start_time || '').slice(0, 5));
    setNewTrainingEnd((template.end_time || '').slice(0, 5));
    setNewTrainingLocation(template.location || '');
  }

  async function addTrainingTemplate() {
    if (!newTrainingTeamId || !newTrainingStart || !newTrainingEnd) { alert('Remplir les champs obligatoires'); return; }
    if (editingTrainingTemplateId) {
      const existing = trainingTemplates.find((t) => t.id === editingTrainingTemplateId);
      const targetTeamId = isAdmin ? newTrainingTeamId : (existing?.team_id || newTrainingTeamId);
      if (!isAdmin && !allowedTeamIds.includes(targetTeamId)) { alert("Tu ne peux modifier que les entrainements de tes equipes."); return; }
      setSavingTrainingTemplate(true);
      try {
        const { error } = await supabase.from('training_templates').update({
          team_id: targetTeamId,
          title: newTrainingTitle.trim() || 'Entrainement',
          weekday: Number(newTrainingWeekday),
          start_time: newTrainingStart,
          end_time: newTrainingEnd,
          location: newTrainingLocation.trim() || null,
        }).eq('id', editingTrainingTemplateId);
        if (error) throw error;
        resetTrainingTemplateForm();
        await loadData();
        alert('Entrainement modifie');
      } catch (e) {
        console.error(e);
        alert("Erreur lors de la modification de l'entrainement");
      } finally {
        setSavingTrainingTemplate(false);
      }
      return;
    }
    const { error } = await supabase.from('training_templates').insert({
      team_id: newTrainingTeamId, title: newTrainingTitle,
      weekday: Number(newTrainingWeekday), start_time: newTrainingStart,
      end_time: newTrainingEnd, location: newTrainingLocation, active: true,
    });
    if (error) { alert("Erreur lors de la création de l'entraînement"); return; }
    setNewTrainingTitle('Entraînement'); setNewTrainingWeekday('3');
    setNewTrainingStart('18:30'); setNewTrainingEnd('20:00');
    setNewTrainingLocation('Gymnase de Gorcy');
    setEditingTrainingTemplateId('');
    await loadData();
    alert('Entraînement ajouté');
  }

  async function addMatch() {
    if (!newMatchTeamId || !newMatchOpponent.trim() || !newMatchDate) { alert('Remplir équipe, adversaire et date'); return; }
    const matchSupporterPayload: any = {
      fdm_url: newMatchFdmUrl.trim() || null,
      supporter_summary: newMatchSupporterSummary.trim() || null,
    };
    if (editingMatchId) {
      let { error } = await supabase.from('matches').update({
        team_id: newMatchTeamId, opponent: newMatchOpponent.trim(),
        match_date: newMatchDate, location: newMatchLocation.trim() || null, home_away: newMatchHomeAway,
        ...matchSupporterPayload,
      }).eq('id', editingMatchId);
      if (error && String(error.message || '').includes('fdm_url')) {
        const retry = await supabase.from('matches').update({
          team_id: newMatchTeamId, opponent: newMatchOpponent.trim(),
          match_date: newMatchDate, location: newMatchLocation.trim() || null, home_away: newMatchHomeAway,
        }).eq('id', editingMatchId);
        error = retry.error;
      }
      if (error) { alert("Erreur lors de la modification du match"); return; }
      setEditingMatchId('');
      setNewMatchOpponent(''); setNewMatchDate(''); setNewMatchLocation(''); setNewMatchHomeAway('home'); setNewMatchFdmUrl(''); setNewMatchSupporterSummary('');
      await loadData();
      alert('Match modifié');
    } else {
      let { data: newMatch, error } = await supabase.from('matches').insert({
        team_id: newMatchTeamId, opponent: newMatchOpponent.trim(),
        match_date: newMatchDate, location: newMatchLocation.trim() || null, home_away: newMatchHomeAway,
        ...matchSupporterPayload,
      }).select().single();
      if (error && String(error.message || '').includes('fdm_url')) {
        const retry = await supabase.from('matches').insert({
          team_id: newMatchTeamId, opponent: newMatchOpponent.trim(),
          match_date: newMatchDate, location: newMatchLocation.trim() || null, home_away: newMatchHomeAway,
        }).select().single();
        newMatch = retry.data;
        error = retry.error;
      }
      if (error) { alert("Erreur lors de la création du match"); return; }
      setNewMatchOpponent(''); setNewMatchDate(''); setNewMatchLocation(''); setNewMatchHomeAway('home'); setNewMatchFdmUrl(''); setNewMatchSupporterSummary('');
      await loadData();
      // Notifier les coaches concernés par email
      if (newMatch) {
        const teamCoaches = coachAccessList.filter((ca) => ca.team_id === newMatchTeamId && ca.first_name);
        const coachEmails: string[] = [];
        for (const ca of teamCoaches) {
          // Chercher email coach dans coaches table
          const { data: coachRow } = await supabase.from('coaches').select('email').eq('id', ca.id).maybeSingle();
          if (coachRow?.email) coachEmails.push(coachRow.email);
        }
        if (coachEmails.length > 0) {
          supabase.functions.invoke('send-match-notification', {
            body: {
              emails: coachEmails,
              teamName: teams.find((t) => t.id === newMatchTeamId)?.name || '',
              opponent: newMatchOpponent.trim(),
              matchDate: newMatchDate,
              location: newMatchLocation.trim() || '',
              homeAway: newMatchHomeAway,
              appUrl: appSettings.app_url,
            },
          }).catch(console.error);
        }
      }
      alert('Match ajouté');
    }
  }

  async function deleteMatch(match: MatchItem) {
    if (!window.confirm(`Supprimer le match vs ${match.opponent} du ${formatDate(match.match_date)} ? Toutes les stats seront supprimées.`)) return;
    await supabase.from('match_player_stats').delete().eq('match_id', match.id);
    await supabase.from('match_attendance').delete().eq('match_id', match.id);
    await supabase.from('match_squads').delete().eq('match_id', match.id);
    await supabase.from('matches').delete().eq('id', match.id);
    const affectedPlayerIds = [...new Set(matchPlayerStats.filter((s) => s.match_id === match.id).map((s) => s.player_id))];
    for (const pid of affectedPlayerIds) {
      const { data: allStats } = await supabase.from('match_player_stats').select('goals, assists, shots, saves').eq('player_id', pid);
      if (!allStats) continue;
      const totalGoals = allStats.reduce((s: number, r: any) => s + (r.goals || 0), 0);
      const totalAssists = allStats.reduce((s: number, r: any) => s + (r.assists || 0), 0);
      const totalSaves = allStats.reduce((s: number, r: any) => s + (r.saves || 0), 0);
      await supabase.from('player_stats').update({ goals: totalGoals, assists: totalAssists, saves: totalSaves, matches_played: allStats.length }).eq('player_id', pid);
    }
    await loadData();
    alert('Match supprimé');
  }

  function startEditMatch(match: MatchItem, targetAdminTab = false) {
    setEditingMatchId(match.id);
    setNewMatchTeamId(match.team_id);
    setNewMatchOpponent(match.opponent || '');
    setNewMatchDate(match.match_date ? match.match_date.slice(0, 16) : '');
    setNewMatchLocation(match.location || '');
    setNewMatchHomeAway(match.home_away as 'home' | 'away');
    setNewMatchFdmUrl(match.fdm_url || '');
    setNewMatchSupporterSummary(match.supporter_summary || '');
    if (targetAdminTab) setAdminSubTab('matches');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetMatchForm() {
    setEditingMatchId('');
    setNewMatchOpponent('');
    setNewMatchDate('');
    setNewMatchLocation('');
    setNewMatchHomeAway('home');
    setNewMatchFdmUrl('');
    setNewMatchSupporterSummary('');
  }

  function getMatchPlayerLinkPreview(match: MatchItem) {
    const teamPlayers = players.filter((p) => p.team_id === match.team_id);
    return {
      teamPlayers,
      exactCount: teamPlayers.length,
      method: "Rapprochement prevu : equipe du match + nom/prenom normalises depuis la feuille FFHB. En cas de doute, le coach valide manuellement.",
    };
  }

  async function toggleTemplateActive(template: TrainingTemplate) {
    const { error } = await supabase.from('training_templates').update({ active: !template.active }).eq('id', template.id);
    if (error) { alert('Erreur lors de la mise à jour'); return; }
    await loadData();
  }

  async function savePlayerSeasonAssignment(playerId: string, seasonId: string, teamId: string, status: 'draft' | 'confirmed' = 'draft') {
    if (!playerId || !seasonId) return;
    setSavingSeasonAssignments(true);
    try {
      const existing = getSeasonAssignment(playerId, seasonId);
      if (!teamId) {
        if (existing) {
          const { error } = await supabase.from('player_season_assignments').delete().eq('id', existing.id);
          if (error) throw error;
        }
      } else if (existing) {
        const { error } = await supabase.from('player_season_assignments').update({
          team_id: teamId,
          status,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('player_season_assignments').insert({
          player_id: playerId,
          season_id: seasonId,
          team_id: teamId,
          status,
        });
        if (error) throw error;
      }
      await loadPlayerSeasonAssignments();
    } catch (e: any) {
      alert(e?.message?.includes('player_season_assignments')
        ? "La table Supabase player_season_assignments n'existe pas encore."
        : `Erreur affectation saison : ${e?.message || e}`);
    } finally {
      setSavingSeasonAssignments(false);
    }
  }

  async function confirmSeasonAssignments(seasonId: string) {
    if (!seasonId) { alert('Choisis une saison'); return; }
    const rows = playerSeasonAssignments.filter((a) => a.season_id === seasonId && a.team_id);
    if (rows.length === 0) { alert('Aucune affectation a confirmer pour cette saison.'); return; }
    setSavingSeasonAssignments(true);
    try {
      const { error } = await supabase.from('player_season_assignments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('season_id', seasonId);
      if (error) throw error;
      await loadPlayerSeasonAssignments();
      alert('Affectations confirmees');
    } catch (e: any) {
      alert(`Erreur confirmation : ${e?.message || e}`);
    } finally {
      setSavingSeasonAssignments(false);
    }
  }

  async function switchToSeason(seasonId: string) {
    if (!seasonId) { alert('Choisis une saison'); return; }
    const season = seasons.find((s) => s.id === seasonId);
    const rows = playerSeasonAssignments.filter((a) => a.season_id === seasonId && a.team_id && a.status === 'confirmed');
    if (rows.length === 0) { alert('Aucune affectation confirmee pour cette saison.'); return; }
    if (!window.confirm(`Basculer officiellement vers ${season?.name || 'cette saison'} ? Les equipes actuelles des joueurs seront mises a jour.`)) return;
    setSwitchingSeason(true);
    try {
      for (const row of rows) {
        const { error } = await supabase.from('players').update({ team_id: row.team_id }).eq('id', row.player_id);
        if (error) throw error;
      }
      await loadData();
      await loadPlayerSeasonAssignments();
      setParentSelectedSeasonId(seasonId);
      alert(`Saison basculee : ${rows.length} joueur(s) mis a jour.`);
    } catch (e: any) {
      alert(`Erreur bascule saison : ${e?.message || e}`);
    } finally {
      setSwitchingSeason(false);
    }
  }

  async function addSeason() {
    if (!newSeasonName.trim() || !newSeasonStart || !newSeasonEnd) { alert('Remplir le nom, la date de début et la date de fin'); return; }
    setSavingSeason(true);
    try {
      const { error } = await supabase.from('seasons').insert({ name: newSeasonName.trim(), start_date: newSeasonStart, end_date: newSeasonEnd, team_id: newSeasonTeamId || null });
      if (error) throw error;
      await loadSeasons();
      alert('Saison créée');
    } catch { alert('Erreur lors de la création de la saison'); }
    finally { setSavingSeason(false); }
  }

  async function loadSeasons() {
    const { data } = await supabase.from('seasons').select('*').order('start_date', { ascending: false });
    const list = data || [];
    setSeasons(list);
    // Auto-sélectionner la saison courante pour les licences
    const today = new Date().toISOString().slice(0, 10);
    const cur = list.find((s) => s.start_date <= today && s.end_date >= today) || list[0];
    if (cur) {
      setSelectedLicenseSeasonId(cur.id);
      if (!parentSelectedSeasonId) setParentSelectedSeasonId(cur.id);
    }
  }

  async function loadPlayerSeasonAssignments() {
    const { data, error } = await supabase.from('player_season_assignments').select('*');
    if (error) {
      console.warn('[SeasonAssignments] table unavailable:', error.message);
      setPlayerSeasonAssignments([]);
      return;
    }
    setPlayerSeasonAssignments((data || []) as PlayerSeasonAssignment[]);
  }

  async function loadSettings() {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const map: any = {};
      data.forEach((row: any) => { map[row.id] = row.value || ''; });
      setAppSettings((prev) => ({ ...prev, ...map }));
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      for (const [key, value] of Object.entries(appSettings)) {
        await supabase.from('settings').upsert({ id: key, value, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      }
      alert('✅ Paramètres enregistrés !');
    } catch (e) { console.error(e); alert('Erreur lors de la sauvegarde'); }
    finally { setSavingSettings(false); }
  }

  function parseNotificationEmails(value: string): string[] {
    return value.split(/[\n,;]+/).map((email) => email.trim()).filter(Boolean);
  }

  function getRegistrationNotificationEmails(): string[] {
    const configured = parseNotificationEmails(appSettings.registration_notification_emails || '');
    if (configured.length > 0) return configured;
    return parseNotificationEmails(appSettings.admin_email || '');
  }

  function notifyAdminsNewRegistration(body: { parentName: string; parentEmail: string; childrenNames: string; appUrl: string }) {
    getRegistrationNotificationEmails().forEach((adminEmail) => {
      supabase.functions.invoke('send-admin-new-registration', {
        body: { adminEmail, ...body },
      }).catch(console.error);
    });
  }

  async function resetTrainingAttendance(teamId: string) {
    if (!window.confirm('Réinitialiser TOUTES les présences entraînements de cette équipe ? Cette action est irréversible.')) return;
    setResetingTraining(true);
    try {
      const templateIds = trainingTemplates.filter((t) => t.team_id === teamId).map((t) => t.id);
      if (templateIds.length > 0) {
        const { error } = await supabase.from('training_attendance').delete().in('training_template_id', templateIds);
        if (error) throw error;
      }
      await loadData();
      alert('Présences entraînements réinitialisées.');
    } catch { alert('Erreur lors de la réinitialisation'); }
    finally { setResetingTraining(false); }
  }

  // Messagerie
  async function loadConversations(teamIds: string[]) {
    const q = teamIds.length > 0 ? teamIds : ['00000000-0000-0000-0000-000000000000'];
    const { data } = await supabase.from('conversations').select('*').in('team_id', q).order('updated_at', { ascending: false });
    const list = data || [];
    setConversations(list);
    // Init lastRead = updated_at de la conv pour les NOUVELLES convs (jamais vues).
    // Tout nouveau message remontera updated_at au-dessus → pastille.
    updateMessageReadTimestamps((prev) => {
      const next = { ...prev };
      list.forEach((c) => { if (!next[c.id]) next[c.id] = c.updated_at; });
      return next;
    });
  }

  async function loadConversationsForParent(parentId: string) {
    // Load private convs for this parent
    const { data: privData } = await supabase.from('conversations').select('*').eq('parent_id', parentId).order('updated_at', { ascending: false });
    // Also load group convs for their team(s)
    const myPlayers = parentLinks.filter((l) => l.parent_id === parentId).map((l) => l.player_id);
    const myTeamIds = [...new Set(players.filter((p) => myPlayers.includes(p.id) && p.team_id).map((p) => p.team_id as string))];
    let groupData: any[] = [];
    if (myTeamIds.length > 0) {
      const { data: gd } = await supabase.from('conversations').select('*').in('team_id', myTeamIds).eq('is_group', true).order('updated_at', { ascending: false });
      groupData = gd || [];
    }
    // Merge, deduplicate
    const all = [...(privData || []), ...groupData];
    const seen = new Set<string>();
    const merged = all.filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
    merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setConversations(merged);
    // Init lastRead = updated_at de la conv pour les NOUVELLES convs (jamais vues)
    updateMessageReadTimestamps((prev) => {
      const next = { ...prev };
      merged.forEach((c) => { if (!next[c.id]) next[c.id] = c.updated_at; });
      return next;
    });
  }

  async function ensureParentConversation(parentId: string) {
    // Just load existing conversations — don't auto-create blank ones
    await loadConversationsForParent(parentId);
  }

  async function openParentConversationForTeam(parentId: string, teamId: string) {
    const { data: existing } = await supabase.from('conversations').select('*').eq('parent_id', parentId).eq('team_id', teamId).eq('is_group', false).maybeSingle();
    if (existing) { setParentConvId(existing.id); setSelectedConvId(existing.id); setParentSelectedCoachTeamId(teamId); await loadMessages(existing.id); }
    else {
      const { data: nc } = await supabase.from('conversations').insert({ team_id: teamId, parent_id: parentId, is_group: false, title: null }).select().single();
      if (nc) { setParentConvId(nc.id); setSelectedConvId(nc.id); setParentSelectedCoachTeamId(teamId); await loadMessages(nc.id); }
    }
    await loadConversationsForParent(parentId);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function deleteMessage(msgId: string) {
    await supabase.from('messages').delete().eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function deleteConversation(convId: string) {
    if (!window.confirm('Supprimer cette conversation et tous ses messages ?')) return;
    await supabase.from('messages').delete().eq('conversation_id', convId);
    await supabase.from('conversations').delete().eq('id', convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (selectedConvId === convId) { setSelectedConvId(null); setMessages([]); }
    if (parentConvId === convId) { setParentConvId(null); }
    updateMessageReadTimestamps((prev) => { const n = { ...prev }; delete n[convId]; return n; });
  }

  async function sendMessage(convId: string, senderType: 'coach' | 'parent', senderId: string) {
    if (!newMessage.trim() || !senderId) return;
    setSendingMessage(true);
    const msgContent = newMessage.trim();
    try {
      await supabase.from('messages').insert({ conversation_id: convId, sender_type: senderType, sender_id: senderId, content: msgContent });
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
      setNewMessage('');
      // Mark this conversation as read immediately after sending
      markConversationsRead([convId]);
      await loadMessages(convId);
      if (senderType === 'coach') {
        const tids = isAdmin ? teams.map((t) => t.id) : allowedTeamIds;
        await loadConversations(tids);
        // Envoyer email au parent
        const conv = conversations.find((c) => c.id === convId);
        if (conv?.parent_id) {
          const parent = users.find((u) => u.id === conv.parent_id);
          if (parent?.email) {
            supabase.functions.invoke('send-message-notification', {
              body: {
                recipientEmail: parent.email,
                recipientName: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
                senderName: 'Le Staff CA Gorcy',
                messageContent: msgContent,
                appUrl: appSettings.app_url,
              },
            }).catch(console.error);
          }
        }
      } else {
        await loadConversationsForParent(selectedParentId);
        // Envoyer email aux coachs de l'équipe
        const conv = conversations.find((c) => c.id === convId);
        if (conv?.team_id) {
          const sender = users.find((u) => u.id === senderId);
          const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : 'Parent';
          supabase.functions.invoke('send-message-notification-coach', {
            body: {
              teamId: conv.team_id,
              teamName: getTeamName(conv.team_id),
              senderName,
              messageContent: msgContent,
              appUrl: appSettings.app_url,
            },
          }).catch(console.error);
        }
      }
    } catch (e) { console.error(e); alert('Erreur envoi'); }
    finally { setSendingMessage(false); }
  }

  async function createConversation(teamId: string, parentId: string | null, isGroup: boolean, title: string | null) {
    if (!isGroup && parentId) {
      const ex = conversations.find((c) => c.team_id === teamId && c.parent_id === parentId && !c.is_group);
      if (ex) { setSelectedConvId(ex.id); setShowNewConvForm(false); return; }
    }
    const { data, error } = await supabase.from('conversations').insert({ team_id: teamId, parent_id: parentId, is_group: isGroup, title }).select().single();
    if (error || !data) { alert('Erreur'); return; }
    const tids = isAdmin ? teams.map((t) => t.id) : allowedTeamIds;
    await loadConversations(tids);
    setSelectedConvId(data.id); setShowNewConvForm(false);
    setNewConvTeamId(''); setNewConvParentId(''); setNewConvIsGroup(false);
  }

  // ── Admin — gestion coaches ──
  async function addCoachAccess() {
    if (!newCoachFirstName.trim() || !newCoachLastName.trim()) { alert('Prénom et nom obligatoires'); return; }
    if (newCoachTeamIds.length === 0) { alert('Sélectionne au moins une équipe'); return; }
    if (!editingCoachId && !newCoachEmail.trim()) { alert('Email obligatoire pour créer un coach'); return; }
    if (!editingCoachId && newCoachPassword.trim().length < 8) { alert('Mot de passe minimum 8 caractères'); return; }
    setSavingCoach(true);
    try {
      let coachId: string;
      let authId: string | null = null;

      if (editingCoachId) {
        // Modification d'un coach existant
        coachId = editingCoachId;
        await supabase.from('coaches').update({
          first_name: newCoachFirstName.trim(),
          last_name: newCoachLastName.trim(),
        }).eq('id', coachId);
        await supabase.from('coach_teams').delete().eq('coach_id', coachId);
      } else {
        // Créer le compte Supabase Auth via Admin API
        authId = await createAuthUser(newCoachEmail.trim(), newCoachPassword.trim());

        // Créer le coach dans la table coaches
        const { data: newCoach, error: ce } = await supabase.from('coaches').insert({
          first_name: newCoachFirstName.trim(),
          last_name: newCoachLastName.trim(),
          code: newCoachCode.trim() || null,
          auth_id: authId,
        }).select('id').single();
        if (ce || !newCoach) throw ce || new Error('Impossible de créer le coach');
        coachId = newCoach.id;

        // Créer le rôle dans user_roles
        await supabase.from('user_roles').insert({ auth_id: authId, role: 'coach', ref_id: coachId });
      }

      // Assigner les équipes
      const rows = newCoachTeamIds.map((teamId) => ({ coach_id: coachId, team_id: teamId }));
      await supabase.from('coach_teams').insert(rows);

      // Reset form
      setNewCoachEmail(''); setNewCoachPassword(''); setNewCoachCode('');
      setNewCoachFirstName(''); setNewCoachLastName(''); setNewCoachTeamIds([]);
      setEditingCoachId('');
      await loadData();
      alert(editingCoachId ? 'Coach mis à jour !' : `Coach créé ! Identifiants envoyés à ${newCoachEmail.trim()}`);
    } catch (e: any) { console.error(e); alert('Erreur : ' + (e.message || 'inconnue')); }
    finally { setSavingCoach(false); }
  }

  async function addAdminAccess() {
    const email = newAdminEmail.trim().toLowerCase();
    const password = newAdminPassword.trim();
    if (!email) { alert('Email admin obligatoire'); return; }
    if (password.length < 8) { alert('Mot de passe admin minimum 8 caractères'); return; }
    if (!window.confirm(`Créer un accès administrateur pour ${email} ?`)) return;
    setSavingAdminAccess(true);
    try {
      const authId = await createAuthUser(email, password);
      const { data: existingRoles } = await supabase.from('user_roles').select('*').eq('auth_id', authId);
      const hasAdminRole = (existingRoles || []).some((r: any) => r.role === 'admin');
      if (!hasAdminRole) {
        const { error } = await supabase.from('user_roles').insert({ auth_id: authId, role: 'admin', ref_id: null });
        if (error) throw error;
      }
      alert(`Accès admin créé pour ${email}`);
    } catch (e: any) {
      console.error(e);
      alert('Erreur création admin : ' + (e?.message || 'inconnue'));
    } finally {
      setSavingAdminAccess(false);
    }
  }

  function hasAdminDelegate(targetType: 'user' | 'coach', targetId: string) {
    return adminDelegates.some((d) => d.target_type === targetType && d.target_id === targetId);
  }

  function getCurrentAdminDelegateTarget() {
    if (isAdmin) return null;
    if (activeRole === 'coach' && connectedCoachId && hasAdminDelegate('coach', connectedCoachId)) {
      return { targetType: 'coach' as const, targetId: connectedCoachId };
    }
    if (activeRole === 'parent' && selectedParentId && hasAdminDelegate('user', selectedParentId)) {
      return { targetType: 'user' as const, targetId: selectedParentId };
    }
    return null;
  }

  function enterDelegatedAdminAccess() {
    const delegate = getCurrentAdminDelegateTarget();
    if (!delegate) {
      alert("Acces admin non autorise pour ce compte.");
      return;
    }
    setIsAdmin(true);
    setActiveRole('coach');
    setCoachTab('admin');
    setAdminSubTab('coaches');
    setShowParentMessages(false);
  }

  async function toggleAdminDelegate(targetType: 'user' | 'coach', targetId: string, enabled: boolean) {
    if (!targetId) return;
    const key = `${targetType}-${targetId}`;
    setSavingAdminDelegate(key);
    try {
      if (enabled) {
        const { error } = await supabase.from('admin_delegates').insert({
          target_type: targetType,
          target_id: targetId,
        });
        if (error && !String(error.message || '').toLowerCase().includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('admin_delegates')
          .delete()
          .eq('target_type', targetType)
          .eq('target_id', targetId);
        if (error) throw error;
      }
      const { data } = await supabase.from('admin_delegates').select('*').order('created_at', { ascending: false });
      setAdminDelegates((data || []) as AdminDelegate[]);
    } catch (e: any) {
      console.error(e);
      alert("Erreur acces admin : applique le fichier SQL supabase-admin-delegates.sql puis reessaie.");
    } finally {
      setSavingAdminDelegate('');
    }
  }

  async function deleteCoachAccess(coachId: string, coachName: string) {
    if (!window.confirm(`Supprimer le coach ${coachName} ? Son compte de connexion sera aussi supprimé.`)) return;
    const { data: coach } = await supabase.from('coaches').select('id, auth_id').eq('id', coachId).maybeSingle();
    if (coach) {
      await supabase.from('coach_teams').delete().eq('coach_id', coach.id);
      if (coach.auth_id) {
        await supabase.from('user_roles').delete().eq('auth_id', coach.auth_id);
        // Supprimer le compte Auth via Edge Function
        await deleteAuthUser(coach.auth_id);
      }
      await supabase.from('coaches').delete().eq('id', coach.id);
    }
    await loadData();
  }

  function toggleNewCoachTeam(teamId: string) {
    setNewCoachTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  }

  // ── Admin — joueur ──
  function resetPlayerForm() {
    setEditingPlayerId(''); setPlayerFormFirstName(''); setPlayerFormLastName('');
    setPlayerFormTeamId(teams[0]?.id || ''); setPlayerFormBirthDate(''); setPlayerFormJerseyNumber('');
    setPlayerFormPosition(''); setPlayerFormGender('');
  }
  function startEditPlayer(player: Player) {
    setEditingPlayerId(player.id);
    setPlayerFormFirstName(player.first_name || '');
    setPlayerFormLastName(player.last_name || '');
    setPlayerFormTeamId(player.team_id || teams[0]?.id || '');
    setPlayerFormBirthDate(player.birth_date || '');
    setPlayerFormJerseyNumber(player.jersey_number != null ? String(player.jersey_number) : '');
    setPlayerFormPosition(player.position || '');
    setPlayerFormGender(player.gender || '');
  }
  function isMissingGenderColumnError(error: any) {
    return String(error?.message || error?.details || '').toLowerCase().includes('gender');
  }
  async function savePlayer() {
    if (!playerFormFirstName.trim() || !playerFormLastName.trim() || !playerFormTeamId) { alert('Remplir prénom, nom et équipe'); return; }
    setSavingPlayer(true);
    try {
      if (editingPlayerId) {
        const payload = {
          first_name: playerFormFirstName.trim(), last_name: playerFormLastName.trim(),
          team_id: playerFormTeamId, birth_date: playerFormBirthDate || null,
          jersey_number: playerFormJerseyNumber ? parseInt(playerFormJerseyNumber) : null,
          position: playerFormPosition || null,
          gender: playerFormGender || null,
        };
        let { error } = await supabase.from('players').update(payload).eq('id', editingPlayerId);
        if (error && isMissingGenderColumnError(error)) {
          const { gender, ...payloadWithoutGender } = payload;
          const retry = await supabase.from('players').update(payloadWithoutGender).eq('id', editingPlayerId);
          error = retry.error;
        }
        if (error) throw error;
        alert('Joueur modifié');
      } else {
        if (await playerAlreadyExists(playerFormFirstName, playerFormLastName, playerFormTeamId)) {
          alert(`Le joueur ${playerFormFirstName.trim()} ${playerFormLastName.trim()} existe déjà dans cette équipe.`); return;
        }
        const payload = {
          first_name: playerFormFirstName.trim(), last_name: playerFormLastName.trim(),
          team_id: playerFormTeamId, birth_date: playerFormBirthDate || null,
          jersey_number: playerFormJerseyNumber ? parseInt(playerFormJerseyNumber) : null,
          position: playerFormPosition || null,
          gender: playerFormGender || null,
        };
        let res = await supabase.from('players').insert(payload).select().single();
        if (res.error && isMissingGenderColumnError(res.error)) {
          const { gender, ...payloadWithoutGender } = payload;
          res = await supabase.from('players').insert(payloadWithoutGender).select().single();
        }
        if (res.error || !res.data) throw res.error || new Error('Impossible de créer le joueur');
        await supabase.from('player_stats').insert({ player_id: res.data.id, goals: 0, assists: 0, saves: 0, matches_played: 0 });
        alert('Joueur ajouté');
      }
      resetPlayerForm();
      await loadData();
    } catch (e) { console.error(e); alert("Erreur lors de l'enregistrement du joueur"); }
    finally { setSavingPlayer(false); }
  }
  async function deletePlayer(player: Player) {
    if (!window.confirm(`Supprimer ${getPlayerName(player)} ?`)) return;
    await supabase.from('training_attendance').delete().eq('player_id', player.id);
    await supabase.from('match_attendance').delete().eq('player_id', player.id);
    await supabase.from('match_player_stats').delete().eq('player_id', player.id);
    await supabase.from('parent_player').delete().eq('player_id', player.id);
    await supabase.from('player_stats').delete().eq('player_id', player.id);
    await supabase.from('players').delete().eq('id', player.id);
    if (editingPlayerId === player.id) resetPlayerForm();
    await loadData();
    alert('Joueur supprimé');
  }

  async function linkPlayerToParent() {
    if (!selectedLinkParentId || !selectedLinkPlayerId) { alert('Sélectionne un parent et un joueur'); return; }
    if (parentLinks.some((l) => l.parent_id === selectedLinkParentId && l.player_id === selectedLinkPlayerId)) { alert('Déjà lié'); return; }
    const existingLinks = parentLinks.filter((l) => l.parent_id === selectedLinkParentId);
    if (existingLinks.length >= 2) { alert('Un parent ne peut pas être lié à plus de 2 enfants.'); return; }
    setLinkingPlayer(true);
    try {
      const { error } = await supabase.from('parent_player').insert({ parent_id: selectedLinkParentId, player_id: selectedLinkPlayerId });
      if (error) throw error;
      await loadData();
      // Envoyer email au parent pour confirmer le lien
      const parent = users.find((u) => u.id === selectedLinkParentId);
      const player = players.find((p) => p.id === selectedLinkPlayerId);
      if (parent?.email && player) {
        supabase.functions.invoke('send-parent-pin', {
          body: {
            email: parent.email,
            parentName: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
            pin: '',
            childName: getPlayerName(player),
            appUrl: appSettings.app_url,
          },
        }).catch(console.error);
      }
      alert('Lien ajouté');
    } catch (e) { console.error(e); alert('Erreur lors de la création du lien'); }
    finally { setLinkingPlayer(false); }
  }

  async function removeParentLink(linkId: string) {
    if (!window.confirm('Supprimer ce lien parent / enfant ?')) return;
    const { error } = await supabase.from('parent_player').delete().eq('id', linkId);
    if (error) { alert('Erreur lors de la suppression du lien'); return; }
    await loadData();
  }

  async function saveManagedParent() {
    if (!selectedManagedParentId) { alert('Sélectionne un parent'); return; }
    if (!managedParentFirstName.trim() || !managedParentLastName.trim()) { alert('Remplir le prénom et le nom'); return; }
    if (managedParentPin && !/^\d{4}$/.test(managedParentPin)) { alert('Le code doit contenir 4 chiffres'); return; }
    setSavingManagedParent(true);
    try {
      const { error } = await supabase.from('users').update({
        first_name: managedParentFirstName.trim(), last_name: managedParentLastName.trim(),
        email: managedParentEmail.trim() || null, parent_pin: managedParentPin.trim() || null,
      }).eq('id', selectedManagedParentId);
      if (error) throw error;
      await loadData();
      alert('Parent mis à jour');
    } catch (e) { console.error(e); alert('Erreur lors de la mise à jour'); }
    finally { setSavingManagedParent(false); }
  }

  function startJerseyEdit(player: Player) {
    setJerseyEditId(player.id);
    setJerseyEditValue(player.jersey_number != null ? String(player.jersey_number) : '');
  }

  async function saveJerseyNumber(playerId: string) {
    const trimmed = jerseyEditValue.trim();
    const jerseyNumber = trimmed ? Number(trimmed) : null;
    if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99)) {
      alert('Numéro de maillot entre 1 et 99.');
      return;
    }
    const { error } = await supabase.from('players').update({ jersey_number: jerseyNumber }).eq('id', playerId);
    if (error) { alert('Erreur lors de la mise à jour du numéro.'); return; }
    setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, jersey_number: jerseyNumber } : p));
    setJerseyEditId(null);
    setJerseyEditValue('');
    await loadDataSilent();
  }

  async function togglePlayerCardPower(player: Player, powerId: string) {
    const current = Array.isArray(player.card_powers) ? player.card_powers : [];
    const next = current.includes(powerId)
      ? current.filter((id) => id !== powerId)
      : current.length >= 3
        ? current
        : [...current, powerId];
    if (!current.includes(powerId) && current.length >= 3) {
      alert('Choisis maximum 3 super pouvoirs.');
      return;
    }
    const { error } = await supabase.from('players').update({ card_powers: next }).eq('id', player.id);
    if (error) { alert("Erreur lors de l'enregistrement des super pouvoirs."); return; }
    setPlayers((prev) => prev.map((p) => p.id === player.id ? { ...p, card_powers: next } : p));
  }

  // ── Helper : créer un compte Auth via Edge Function ──
  async function callEdgeFunction(body: object): Promise<any> {
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch('https://zrkixsxexoyicmunzodx.supabase.co/functions/v1/create-auth-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Erreur Edge Function');
    return data;
  }

  async function createAuthUser(email: string, password: string): Promise<string> {
    const data = await callEdgeFunction({ email, password });
    return data.id as string;
  }

  async function deleteAuthUser(authId: string): Promise<void> {
    await callEdgeFunction({ action: 'delete', auth_id: authId });
  }

  async function sendParentPinEmail(parentEmail: string, parentName: string, pin: string, childName: string) {
    try {
      await supabase.functions.invoke('send-parent-pin', { body: { email: parentEmail, parentName, pin, childName, appUrl: appSettings.app_url } });
    } catch (e) { console.error(e); }
  }

  async function createChildAccount() {
    if (!newChildFirstName.trim() || !newChildLastName.trim() || !newChildTeamId || !newParentFirstName.trim() || !newParentLastName.trim()) {
      alert('Remplir les champs obligatoires'); return;
    }
    setCreatingChildAccount(true);
    try {
      let parentId = '';
      const parentEmail = newParentEmail.trim();
      const parentFullName = `${newParentFirstName.trim()} ${newParentLastName.trim()}`.trim();
      const childFullName = `${newChildFirstName.trim()} ${newChildLastName.trim()}`.trim();

      if (!parentEmail) { alert('Email parent obligatoire'); setCreatingChildAccount(false); return; }
      if (!newParentPassword || newParentPassword.length < 8) { alert('Mot de passe parent minimum 8 caractères'); setCreatingChildAccount(false); return; }

      // Vérifier si le parent existe déjà
      const existing = await supabase.from('users').select('*').eq('email', parentEmail).eq('role', 'parent').maybeSingle();
      if (existing.data) {
        parentId = existing.data.id;
        await supabase.from('users').update({ first_name: newParentFirstName.trim(), last_name: newParentLastName.trim() }).eq('id', parentId);
      } else {
        // Créer le compte Auth pour le parent
        const authUserId = await createAuthUser(parentEmail, newParentPassword.trim());

        const res = await supabase.from('users').insert({
          first_name: newParentFirstName.trim(), last_name: newParentLastName.trim(),
          email: parentEmail, role: 'parent', auth_id: authUserId,
        }).select().single();
        if (res.error || !res.data) throw res.error || new Error('Impossible de créer le parent');
        parentId = res.data.id;
        // Créer le rôle
        await supabase.from('user_roles').insert({ auth_id: authUserId, role: 'parent', ref_id: parentId });
      }
      const childPayload = {
        first_name: newChildFirstName.trim(),
        last_name: newChildLastName.trim(),
        team_id: newChildTeamId,
        gender: newChildGender || null,
      };
      let playerRes = await supabase.from('players').insert(childPayload).select().single();
      if (playerRes.error && isMissingGenderColumnError(playerRes.error)) {
        const { gender, ...childPayloadWithoutGender } = childPayload;
        playerRes = await supabase.from('players').insert(childPayloadWithoutGender).select().single();
      }
      if (playerRes.error || !playerRes.data) throw playerRes.error || new Error("Impossible de créer l'enfant");
      const playerId = playerRes.data.id;
      await supabase.from('parent_player').insert({ parent_id: parentId, player_id: playerId });
      await supabase.from('player_stats').insert({ player_id: playerId, goals: 0, assists: 0, saves: 0, matches_played: 0 });
      if (parentEmail) await sendParentPinEmail(parentEmail, parentFullName, newParentPassword.trim(), childFullName);

      setNewChildFirstName(''); setNewChildLastName('');
      setNewParentFirstName(''); setNewParentLastName(''); setNewParentEmail('');
      setNewChildTeamId(teams[0]?.id || '');
      setNewChildGender('');
      setShowCreateChildForm(false);
      await loadData();
      alert(`Compte parent créé pour ${parentEmail}. Email de connexion envoyé.`);
    } catch (e) { console.error(e); alert("Erreur lors de la création du compte enfant"); }
    finally { setCreatingChildAccount(false); }
  }

  // ── Suppression parent (admin) ──
  async function toggleParentAccess(parentId: string, currentActive: boolean) {
    const action = currentActive ? 'désactiver' : 'réactiver';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} l'accès de ce parent ?`)) return;
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', parentId);
    // Si on désactive, supprimer la session Auth
    if (currentActive) {
      const user = users.find(u => u.id === parentId);
      if (user && (user as any).auth_id) {
        await callEdgeFunction({ action: 'delete_session', auth_id: (user as any).auth_id });
      }
    }
    await loadData();
  }

  async function deleteParent(parentId: string) {
    const par = users.find((u) => u.id === parentId);
    if (!par) return;
    if (!window.confirm(`Supprimer le parent ${getUserName(par)} ? Les liens avec ses enfants seront aussi supprimés.`)) return;
    await supabase.from('parent_player').delete().eq('parent_id', parentId);
    await supabase.from('conversations').delete().eq('parent_id', parentId);
    await supabase.from('users').delete().eq('id', parentId);
    await loadData();
    alert('Parent supprimé');
  }

  // ── Catégories "directes" (pas de parent) ──
  async function deleteParentAndAuth(parentId: string) {
    const par = users.find((u) => u.id === parentId);
    if (!par) return;
    if (!window.confirm(`Supprimer le parent ${getUserName(par)} ? Les liens avec ses enfants et son compte de connexion seront aussi supprimés.`)) return;
    try {
      const authId = par.auth_id || null;
      await supabase.from('parent_player').delete().eq('parent_id', parentId);
      await supabase.from('conversations').delete().eq('parent_id', parentId);
      if (authId) {
        await supabase.from('user_presence').delete().eq('auth_id', authId);
        await deleteAuthUser(authId);
        await supabase.from('user_roles').delete().eq('auth_id', authId);
      }
      await supabase.from('users').delete().eq('id', parentId);
      await loadData();
      setSelectedManagedParentId('');
      alert(authId ? 'Parent supprimé, compte Auth supprimé aussi.' : 'Parent supprimé. Aucun compte Auth lié trouvé.');
    } catch (e: any) {
      console.error(e);
      alert(`Erreur lors de la suppression : ${e?.message || 'inconnue'}`);
    }
  }

  function isDirectCategory(teamId: string): boolean {
    const cat = (teams.find((t) => t.id === teamId)?.category || '').toLowerCase();
    const nm = (teams.find((t) => t.id === teamId)?.name || '').toLowerCase();
    const haystack = cat + ' ' + nm;
    return haystack.includes('loisir') || haystack.includes('senior');
  }

  function getSelectedDirectTeamIds() {
    const ids = regDirectTeamIds.length > 0 ? regDirectTeamIds : (regDirectTeamId ? [regDirectTeamId] : []);
    return [...new Set(ids.filter(Boolean))];
  }

  function toggleDirectTeam(teamId: string) {
    setRegDirectTeamIds((prev) => {
      const next = prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId];
      setRegDirectTeamId(next[0] || '');
      return next;
    });
  }

  // Vérifier doublon joueur
  async function playerAlreadyExists(firstName: string, lastName: string, teamId: string): Promise<boolean> {
    const { data } = await supabase.from('players')
      .select('id')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .eq('team_id', teamId);
    return (data || []).length > 0;
  }

  // Générer un code PIN unique (pas déjà utilisé)
  async function generateUniquePin(): Promise<string> {
    for (let i = 0; i < 20; i++) {
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      const { data } = await supabase.from('users').select('id').eq('parent_pin', pin).maybeSingle();
      if (!data) return pin;
    }
    // fallback : générer un pin à 6 chiffres si vraiment pas de place
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Résoudre l'enfant (existant ou nouveau) → retourne { playerId, playerName }
  async function resolveChild(
    mode: 'existing' | 'new',
    existingId: string,
    firstName: string,
    lastName: string,
    teamId: string,
    birthDate: string,
  ): Promise<{ playerId: string; playerName: string } | null> {
    if (mode === 'existing') {
      if (!existingId) return null;
      const p = players.find((x) => x.id === existingId);
      // Mettre à jour la date de naissance si fournie et absente
      if (p && birthDate && !p.birth_date) {
        await supabase.from('players').update({ birth_date: birthDate }).eq('id', existingId);
      }
      return p ? { playerId: p.id, playerName: getPlayerName(p) } : null;
    }
    if (!firstName.trim() || !lastName.trim() || !teamId) return null;
    if (await playerAlreadyExists(firstName, lastName, teamId)) {
      throw new Error(`Le joueur ${firstName.trim()} ${lastName.trim()} existe déjà dans cette équipe.`);
    }
    const { data: np, error } = await supabase.from('players').insert({
      first_name: firstName.trim(), last_name: lastName.trim(),
      team_id: teamId, birth_date: birthDate || null,
    }).select().single();
    if (error || !np) throw error || new Error('Impossible de créer le joueur');
    await supabase.from('player_stats').insert({ player_id: np.id, goals: 0, assists: 0, saves: 0, matches_played: 0 });
    return { playerId: np.id, playerName: `${firstName.trim()} ${lastName.trim()}` };
  }

  // ── Inscription publique — crée une demande en attente ──
  // Soumission directe avec linkedIds déjà connus (évite race condition setState)
  async function submitWithLinked(linkedIds: Record<number, string>) {
    setRegError('');
    setRegSuccess('');
    setRegistering(true);
    try {
      const child1Name = `${regChildFirstName.trim()} ${regChildLastName.trim()}`;
      const child1TeamId = regChildTeamId;
      const child2Name = regHasSecondChild ? `${regChild2FirstName.trim()} ${regChild2LastName.trim()}` : '';
      const child2TeamId = regHasSecondChild ? regChild2TeamId : '';
      const payload = {
        type: 'parent', status: 'pending',
        parent_first_name: regParentFirstName.trim(), parent_last_name: regParentLastName.trim(),
        email: regParentEmail.trim(),
        child1_mode: regChildMode === 'existing' ? 'existing' : (linkedIds[1] ? 'existing' : 'new'),
        child1_existing_id: regChildMode === 'existing' ? regChildExistingId : (linkedIds[1] || null),
        child1_first_name: regChildFirstName.trim(), child1_last_name: regChildLastName.trim(),
        child1_team_id: child1TeamId, child1_birth_date: regChildBirthDate || null,
        child2_mode: regHasSecondChild ? (linkedIds[2] ? 'existing' : 'new') : null,
        child2_existing_id: regHasSecondChild ? (linkedIds[2] || null) : null,
        child2_first_name: regHasSecondChild ? regChild2FirstName.trim() : null,
        child2_last_name: regHasSecondChild ? regChild2LastName.trim() : null,
        child2_team_id: regHasSecondChild ? child2TeamId : null,
        child2_birth_date: regHasSecondChild ? (regChild2BirthDate || null) : null,
        child1_name: child1Name, child2_name: child2Name || null,
        parent_password: regParentPassword.trim(),
      };
      const { error: regErr } = await supabase.from('registrations').insert(payload);
      if (regErr) throw regErr;
      supabase.functions.invoke('send-registration-pending', { body: { email: regParentEmail.trim(), parentName: `${regParentFirstName.trim()} ${regParentLastName.trim()}`, childrenNames: [child1Name, child2Name].filter(Boolean).join(' et '), appUrl: appSettings.app_url } }).catch(console.error);
      notifyAdminsNewRegistration({ parentName: `${regParentFirstName.trim()} ${regParentLastName.trim()}`, parentEmail: regParentEmail.trim(), childrenNames: [child1Name, child2Name].filter(Boolean).join(' et '), appUrl: appSettings.app_url });
      setRegSuccess("✅ Demande envoyée ! Votre compte sera activé après validation par l'administrateur.");
      setRegParentFirstName(''); setRegParentLastName(''); setRegParentEmail('');
      setRegChildFirstName(''); setRegChildLastName(''); setRegChildTeamId(''); setRegChildBirthDate('');
      setRegChildMode('existing'); setRegChildExistingId('');
      setRegChild2FirstName(''); setRegChild2LastName(''); setRegChild2TeamId(''); setRegChild2BirthDate('');
      setRegChild2Mode('existing'); setRegChild2ExistingId('');
      setRegHasFirstChild(false); setRegHasSecondChild(false); setRegAdultIsPlayer(false); setRegParentPassword('');
      setSimilarPlayers([]); setRegChildLinked(false); setRegChild2Linked(false); setRegLinkedPlayerIds({});
      setRegChildMode('existing'); setRegChildExistingId(''); setRegChild2Mode('existing'); setRegChild2ExistingId('');
    } catch (e: any) { setRegError(e?.message || "Erreur lors de l'inscription."); }
    finally { setRegistering(false); }
  }

  // Détection joueur similaire (Levenshtein simplifié)
  function stringSimilar(a: string, b: string): boolean {
    a = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    b = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 2) return false;
    let diff = 0;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) { if (a[i] !== b[i]) diff++; }
    return diff <= 2;
  }

  function findSimilarPlayers(firstName: string, lastName: string): any[] {
    return players.filter((p) =>
      (stringSimilar(p.first_name || '', firstName) && stringSimilar(p.last_name || '', lastName)) ||
      (stringSimilar(p.first_name || '', lastName) && stringSimilar(p.last_name || '', firstName))
    );
  }

  async function handlePublicRegister() {
    setRegError('');
    setRegSuccess('');
    setSimilarPlayers([]);
    if (!regParentFirstName.trim() || !regParentLastName.trim()) { setRegError('Prénom et nom du parent obligatoires.'); return; }
    if (!regParentEmail.trim()) { setRegError("L'email est obligatoire."); return; }
    if (regParentPassword.trim().length < 8) { setRegError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    // Validation enfant 1
    if (regChildMode === 'existing' && !regChildExistingId) { setRegError("Sélectionne un joueur pour l'enfant 1 ou choisis 'Nouveau joueur'."); return; }
    if (regChildMode === 'new' && (!regChildFirstName.trim() || !regChildLastName.trim() || !regChildTeamId)) { setRegError("Informations de l'enfant 1 incomplètes (prénom, nom, équipe)."); return; }
    // Validation enfant 2
    if (regHasSecondChild) {
      if (regChild2Mode === 'existing' && !regChild2ExistingId) { setRegError("Sélectionne un joueur pour l'enfant 2 ou choisis 'Nouveau joueur'."); return; }
      if (regChild2Mode === 'new' && (!regChild2FirstName.trim() || !regChild2LastName.trim() || !regChild2TeamId)) { setRegError("Informations de l'enfant 2 incomplètes."); return; }
    }

    // Détecter joueurs similaires (seulement en mode 'new' et pas encore traité)
    const sim1 = regChildMode === 'new' && !regChildLinked && !regLinkedPlayerIds[1] ? findSimilarPlayers(regChildFirstName.trim(), regChildLastName.trim()) : [];
    const sim2 = regHasSecondChild && regChild2Mode === 'new' && !regChild2Linked && !regLinkedPlayerIds[2] ? findSimilarPlayers(regChild2FirstName.trim(), regChild2LastName.trim()) : [];
    const newSimilar = [];
    if (sim1.length > 0) newSimilar.push({ child: 1 as 1|2, players: sim1 });
    if (sim2.length > 0) newSimilar.push({ child: 2 as 1|2, players: sim2 });
    if (newSimilar.length > 0) {
      setSimilarPlayers(newSimilar);
      setRegError('⚠️ Des joueurs similaires ont été trouvés. Vérifiez ci-dessous puis confirmez ou modifiez.');
      return;
    }
    setRegistering(true);
    try {
      // Récupérer infos enfants (toujours nouveau joueur)
      const child1Name = `${regChildFirstName.trim()} ${regChildLastName.trim()}`;
      const child1TeamId = regChildTeamId;
      const child2Name = regHasSecondChild ? `${regChild2FirstName.trim()} ${regChild2LastName.trim()}` : '';
      const child2TeamId = regHasSecondChild ? regChild2TeamId : '';

      // Stocker la demande en base
      const payload = {
        type: 'parent',
        status: 'pending',
        parent_first_name: regParentFirstName.trim(),
        parent_last_name: regParentLastName.trim(),
        email: regParentEmail.trim(),
        child1_mode: regChildMode === 'existing' ? 'existing' : (regChildLinked ? 'existing' : 'new'),
        child1_existing_id: regChildMode === 'existing' ? regChildExistingId : (regChildLinked ? (regLinkedPlayerIds[1] || null) : null),
        child1_first_name: regChildFirstName.trim(),
        child1_last_name: regChildLastName.trim(),
        child1_team_id: child1TeamId,
        child1_birth_date: regChildBirthDate || null,
        child2_mode: regHasSecondChild ? (regChild2Mode === 'existing' ? 'existing' : (regChild2Linked ? 'existing' : 'new')) : null,
        child2_existing_id: regHasSecondChild ? (regChild2Mode === 'existing' ? regChild2ExistingId : (regChild2Linked ? (regLinkedPlayerIds[2] || null) : null)) : null,
        child2_first_name: regHasSecondChild ? regChild2FirstName.trim() : null,
        child2_last_name: regHasSecondChild ? regChild2LastName.trim() : null,
        child2_team_id: regHasSecondChild ? child2TeamId : null,
        child2_birth_date: regHasSecondChild ? (regChild2BirthDate || null) : null,
        child1_name: child1Name,
        child2_name: child2Name || null,
        parent_password: regParentPassword.trim(),
      };
      const { error: regErr } = await supabase.from('registrations').insert(payload);
      if (regErr) throw regErr;

      // Email au membre : en attente de validation
      supabase.functions.invoke('send-registration-pending', {
        body: {
          email: regParentEmail.trim(),
          parentName: `${regParentFirstName.trim()} ${regParentLastName.trim()}`,
          childrenNames: [child1Name, child2Name].filter(Boolean).join(' et '),
          appUrl: appSettings.app_url,
        },
      }).catch(console.error);

      // Email à l'admin : nouvelle inscription à valider
      notifyAdminsNewRegistration({
        parentName: `${regParentFirstName.trim()} ${regParentLastName.trim()}`,
        parentEmail: regParentEmail.trim(),
        childrenNames: [child1Name, child2Name].filter(Boolean).join(' et '),
        appUrl: appSettings.app_url,
      });

      setRegSuccess('✅ Demande envoyée ! Votre compte sera activé après validation par l\'administrateur. Vous pourrez alors vous connecter avec votre email et mot de passe.');
      setRegParentFirstName(''); setRegParentLastName(''); setRegParentEmail('');
      setRegChildFirstName(''); setRegChildLastName(''); setRegChildTeamId(''); setRegChildBirthDate('');
      setRegChildMode('existing'); setRegChildExistingId('');
      setRegChild2FirstName(''); setRegChild2LastName(''); setRegChild2TeamId(''); setRegChild2BirthDate('');
      setRegChild2Mode('existing'); setRegChild2ExistingId('');
      setRegHasFirstChild(false);
      setRegHasSecondChild(false);
      setRegAdultIsPlayer(false);
      setRegParentPassword('');
      setSimilarPlayers([]);
      setRegChildLinked(false);
      setRegChild2Linked(false);
      setRegLinkedPlayerIds({});
    } catch (e: any) {
      console.error(e);
      setRegError(e?.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally { setRegistering(false); }
  }

  // ── Inscription directe joueur (loisir/senior) — en attente de validation ──
  async function handleDirectRegister() {
    setRegError('');
    setRegSuccess('');
    const selectedDirectTeamIds = getSelectedDirectTeamIds();
    if (!regDirectFirstName.trim() || !regDirectLastName.trim() || selectedDirectTeamIds.length === 0) { setRegError('Tous les champs sont obligatoires.'); return; }
    if (!regDirectEmail.trim()) { setRegError('L\'email est obligatoire.'); return; }
    if (!regDirectPassword || regDirectPassword.length < 8) { setRegError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setRegistering(true);
    try {
      const payload: any = {
        type: 'direct',
        status: 'pending',
        parent_first_name: regDirectFirstName.trim(),
        parent_last_name: regDirectLastName.trim(),
        email: regDirectEmail.trim(),
        child1_first_name: regDirectFirstName.trim(),
        child1_last_name: regDirectLastName.trim(),
        child1_team_id: selectedDirectTeamIds[0],
        direct_team_ids: selectedDirectTeamIds,
        child1_birth_date: regDirectBirthDate || null,
        child1_name: `${regDirectFirstName.trim()} ${regDirectLastName.trim()}`,
        direct_password: regDirectPassword.trim(),
      };
      let { error: regErr } = await supabase.from('registrations').insert(payload);
      if (regErr) {
        // Si la colonne direct_password n'existe pas encore, retry sans
        if (regErr.message?.includes('direct_team_ids')) {
          delete payload.direct_team_ids;
          const fallbackRows = selectedDirectTeamIds.map((teamId) => ({
            ...payload,
            child1_team_id: teamId,
            child1_name: `${regDirectFirstName.trim()} ${regDirectLastName.trim()} - ${getTeamName(teamId)}`,
          }));
          const retry = await supabase.from('registrations').insert(fallbackRows);
          if (retry.error) throw retry.error;
        } else if (regErr.message?.includes('direct_password') || (regErr as any).code === '42703') {
          delete payload.direct_password;
          const retry = await supabase.from('registrations').insert(payload);
          if (retry.error) throw retry.error;
        } else throw regErr;
      }

      supabase.functions.invoke('send-registration-pending', {
        body: {
          email: regDirectEmail.trim(),
          parentName: `${regDirectFirstName.trim()} ${regDirectLastName.trim()}`,
          childrenNames: `${regDirectFirstName.trim()} ${regDirectLastName.trim()}`,
          appUrl: appSettings.app_url,
        },
      }).catch(console.error);

      notifyAdminsNewRegistration({
        parentName: `${regDirectFirstName.trim()} ${regDirectLastName.trim()}`,
        parentEmail: regDirectEmail.trim(),
        childrenNames: `${regDirectFirstName.trim()} ${regDirectLastName.trim()} (${selectedDirectTeamIds.map(getTeamName).join(', ')})`,
        appUrl: appSettings.app_url,
      });

      setRegSuccess('✅ Votre demande a bien été envoyée ! Vous recevrez un email dès que votre accès sera validé par l\'administrateur.');
      setRegDirectFirstName(''); setRegDirectLastName(''); setRegDirectTeamId(''); setRegDirectTeamIds([]); setRegDirectBirthDate(''); setRegDirectEmail(''); setRegDirectPassword('');
    } catch (e: any) { console.error(e); setRegError(e?.message || "Erreur lors de l'inscription. Veuillez réessayer."); }
    finally { setRegistering(false); }
  }

  async function handleUnifiedRegister() {
    setRegError('');
    setRegSuccess('');
    const child1Existing = players.find((p) => p.id === regChildExistingId);
    const child2Existing = players.find((p) => p.id === regChild2ExistingId);
    if (!regParentFirstName.trim() || !regParentLastName.trim()) { setRegError('Prénom et nom obligatoires.'); return; }
    if (!regParentEmail.trim()) { setRegError("L'email est obligatoire."); return; }
    if (regParentPassword.trim().length < 8) { setRegError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    if (!regAdultIsPlayer && !regHasFirstChild && !regHasSecondChild) { setRegError('Coche au moins une option : je suis joueur, un enfant ou deux enfants.'); return; }
    const selectedAdultTeamIds = getSelectedDirectTeamIds();
    if (regAdultIsPlayer && selectedAdultTeamIds.length === 0) { setRegError('Choisis au moins une catégorie du joueur adulte.'); return; }
    if (regHasFirstChild) {
      if (!regChildTeamId) { setRegError("Choisis la catégorie de l'enfant 1."); return; }
      if (regChildMode === 'existing' && !regChildExistingId) { setRegError("Sélectionne l'enfant 1 dans la liste ou coche \"Mon enfant n'est pas dans la liste\"."); return; }
      if (regChildMode === 'existing' && child1Existing && !child1Existing.birth_date && !regChildBirthDate) { setRegError("La date de naissance de l'enfant 1 est obligatoire car elle n'est pas encore renseignée."); return; }
      if (regChildMode === 'new' && (!regChildFirstName.trim() || !regChildLastName.trim() || !regChildBirthDate)) { setRegError("Informations de l'enfant 1 incomplètes (prénom, nom, date de naissance)."); return; }
    }
    if (regHasSecondChild) {
      if (!regChild2TeamId) { setRegError("Choisis la catégorie de l'enfant 2."); return; }
      if (regChild2Mode === 'existing' && !regChild2ExistingId) { setRegError("Sélectionne l'enfant 2 dans la liste ou coche \"Mon enfant n'est pas dans la liste\"."); return; }
      if (regChild2Mode === 'existing' && child2Existing && !child2Existing.birth_date && !regChild2BirthDate) { setRegError("La date de naissance de l'enfant 2 est obligatoire car elle n'est pas encore renseignée."); return; }
      if (regChild2Mode === 'new' && (!regChild2FirstName.trim() || !regChild2LastName.trim() || !regChild2BirthDate)) { setRegError("Informations de l'enfant 2 incomplètes (prénom, nom, date de naissance)."); return; }
    }

    setRegistering(true);
    try {
      const createdNames: string[] = [];
      const parentName = `${regParentFirstName.trim()} ${regParentLastName.trim()}`;

      if (regHasFirstChild || regHasSecondChild) {
        const child1Name = regHasFirstChild ? (regChildMode === 'existing' && child1Existing ? getPlayerName(child1Existing) : `${regChildFirstName.trim()} ${regChildLastName.trim()}`) : '';
        const child2Name = regHasSecondChild ? (regChild2Mode === 'existing' && child2Existing ? getPlayerName(child2Existing) : `${regChild2FirstName.trim()} ${regChild2LastName.trim()}`) : '';
        const payload = {
          type: 'parent',
          status: 'pending',
          parent_first_name: regParentFirstName.trim(),
          parent_last_name: regParentLastName.trim(),
          email: regParentEmail.trim(),
          child1_mode: regHasFirstChild ? regChildMode : null,
          child1_existing_id: regHasFirstChild && regChildMode === 'existing' ? regChildExistingId : null,
          child1_first_name: regHasFirstChild ? (regChildMode === 'existing' && child1Existing ? child1Existing.first_name : regChildFirstName.trim()) : null,
          child1_last_name: regHasFirstChild ? (regChildMode === 'existing' && child1Existing ? child1Existing.last_name : regChildLastName.trim()) : null,
          child1_team_id: regHasFirstChild ? regChildTeamId : null,
          child1_birth_date: regHasFirstChild ? (regChildBirthDate || null) : null,
          child2_mode: regHasSecondChild ? regChild2Mode : null,
          child2_existing_id: regHasSecondChild && regChild2Mode === 'existing' ? regChild2ExistingId : null,
          child2_first_name: regHasSecondChild ? (regChild2Mode === 'existing' && child2Existing ? child2Existing.first_name : regChild2FirstName.trim()) : null,
          child2_last_name: regHasSecondChild ? (regChild2Mode === 'existing' && child2Existing ? child2Existing.last_name : regChild2LastName.trim()) : null,
          child2_team_id: regHasSecondChild ? regChild2TeamId : null,
          child2_birth_date: regHasSecondChild ? (regChild2BirthDate || null) : null,
          child1_name: child1Name || null,
          child2_name: child2Name || null,
          parent_password: regParentPassword.trim(),
        };
        const { error } = await supabase.from('registrations').insert(payload);
        if (error) throw error;
        createdNames.push(...[child1Name, child2Name].filter(Boolean));
      }

      if (regAdultIsPlayer) {
        const playerName = `${regParentFirstName.trim()} ${regParentLastName.trim()}`;
        const payload: any = {
          type: 'direct',
          status: 'pending',
          parent_first_name: regParentFirstName.trim(),
          parent_last_name: regParentLastName.trim(),
          email: regParentEmail.trim(),
          child1_first_name: regParentFirstName.trim(),
          child1_last_name: regParentLastName.trim(),
          child1_team_id: selectedAdultTeamIds[0],
          direct_team_ids: selectedAdultTeamIds,
          child1_birth_date: regDirectBirthDate || null,
          child1_name: playerName,
          direct_password: regParentPassword.trim(),
        };
        let { error } = await supabase.from('registrations').insert(payload);
        if (error && error.message?.includes('direct_team_ids')) {
          delete payload.direct_team_ids;
          const fallbackRows = selectedAdultTeamIds.map((teamId) => ({
            ...payload,
            child1_team_id: teamId,
            child1_name: `${playerName} - ${getTeamName(teamId)}`,
          }));
          const retry = await supabase.from('registrations').insert(fallbackRows);
          error = retry.error;
        } else if (error && (error.message?.includes('direct_password') || (error as any).code === '42703')) {
          delete payload.direct_password;
          const retry = await supabase.from('registrations').insert(payload);
          error = retry.error;
        }
        if (error) throw error;
        createdNames.unshift(playerName);
      }

      const peopleNames = createdNames.join(' et ');
      supabase.functions.invoke('send-registration-pending', {
        body: { email: regParentEmail.trim(), parentName, childrenNames: peopleNames, appUrl: appSettings.app_url },
      }).catch(console.error);
      notifyAdminsNewRegistration({ parentName, parentEmail: regParentEmail.trim(), childrenNames: peopleNames, appUrl: appSettings.app_url });

      setRegSuccess("✅ Demande envoyée ! Votre compte sera activé après validation par l'administrateur.");
      setRegParentFirstName(''); setRegParentLastName(''); setRegParentEmail(''); setRegParentPassword('');
      setRegAdultIsPlayer(false); setRegDirectTeamId(''); setRegDirectTeamIds([]); setRegDirectBirthDate('');
      setRegHasFirstChild(false); setRegChildMode('existing'); setRegChildExistingId(''); setRegChildFirstName(''); setRegChildLastName(''); setRegChildTeamId(''); setRegChildBirthDate('');
      setRegHasSecondChild(false); setRegChild2Mode('existing'); setRegChild2ExistingId(''); setRegChild2FirstName(''); setRegChild2LastName(''); setRegChild2TeamId(''); setRegChild2BirthDate('');
    } catch (e: any) {
      console.error(e);
      setRegError(e?.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally { setRegistering(false); }
  }

  // ── Valider une inscription (admin) ──
  async function approveRegistration(reg: Registration) {
    try {
      if (reg.type === 'parent') {
        // Créer le compte Auth parent
        let parentId = '';
        let authId: string | null = null;

        if (reg.email) {
          // Chercher TOUT user existant avec cet email (parent, player, etc.)
          const { data: existingAny } = await supabase.from('users').select('*').eq('email', reg.email).maybeSingle();
          if (existingAny) {
            parentId = existingAny.id;
            authId = existingAny.auth_id || null;
            // Si c'était un user 'player' qui demande parent → ajouter le rôle parent
            const currentExtras: string[] = ((existingAny as any).roles_extra || []) as string[];
            if (existingAny.role !== 'parent' && !currentExtras.includes('parent')) {
              await supabase.from('users').update({
                roles_extra: [...currentExtras, 'parent'],
                first_name: reg.parent_first_name || existingAny.first_name,
                last_name: reg.parent_last_name || existingAny.last_name,
              }).eq('id', existingAny.id);
              if (authId) {
                const { data: existingRoles } = await supabase.from('user_roles').select('*').eq('auth_id', authId);
                const hasParentRoleRow = (existingRoles || []).some((r: any) => r.role === 'parent');
                if (!hasParentRoleRow) {
                  await supabase.from('user_roles').insert({ auth_id: authId, role: 'parent', ref_id: parentId });
                }
              }
            }
          }
        }
        if (!parentId) {
          // Récupérer le mot de passe stocké dans la registration
          const password = (reg as any).parent_password;
          if (!password) throw new Error('Mot de passe introuvable dans la demande');

          authId = await createAuthUser(reg.email!, password);
          const { data: newPar, error: pe } = await supabase.from('users').insert({
            first_name: reg.parent_first_name, last_name: reg.parent_last_name,
            email: reg.email || null, role: 'parent', auth_id: authId,
          }).select().single();
          if (pe || !newPar) throw pe;
          parentId = newPar.id;
          await supabase.from('user_roles').insert({ auth_id: authId, role: 'parent', ref_id: parentId });
        }
        // Résoudre enfant 1
        const child1 = await resolveChild(
          reg.child1_mode as 'existing' | 'new',
          reg.child1_existing_id || '',
          reg.child1_first_name || '',
          reg.child1_last_name || '',
          reg.child1_team_id || '',
          reg.child1_birth_date || ''
        );
        if (child1) {
          const already = parentLinks.some((l) => l.parent_id === parentId && l.player_id === child1.playerId);
          if (!already) await supabase.from('parent_player').insert({ parent_id: parentId, player_id: child1.playerId });
        }
        // Résoudre enfant 2
        if (reg.child2_mode) {
          const child2 = await resolveChild(
            reg.child2_mode as 'existing' | 'new',
            reg.child2_existing_id || '',
            reg.child2_first_name || '',
            reg.child2_last_name || '',
            reg.child2_team_id || '',
            reg.child2_birth_date || ''
          );
          if (child2) {
            const already2 = parentLinks.some((l) => l.parent_id === parentId && l.player_id === child2.playerId);
            if (!already2) await supabase.from('parent_player').insert({ parent_id: parentId, player_id: child2.playerId });
          }
        }
        // Email de bienvenue (compte déjà créé avec leur propre mot de passe)
        if (reg.email) {
          const childrenNames = [reg.child1_name, reg.child2_name].filter(Boolean).join(' et ');
          supabase.functions.invoke('send-inscription-confirmation', {
            body: {
              email: reg.email,
              parentName: `${reg.parent_first_name} ${reg.parent_last_name}`,
              childrenNames,
              appUrl: appSettings.app_url,
            },
          }).catch(console.error);
        }
      } else {
        // Inscription directe (loisir/senior)
        const directTeamIds = [...new Set(((reg as any).direct_team_ids && Array.isArray((reg as any).direct_team_ids) ? (reg as any).direct_team_ids : [reg.child1_team_id]).filter(Boolean))] as string[];
        if (directTeamIds.length === 0) throw new Error('Aucune catégorie sélectionnée pour cette inscription.');
        for (const teamId of directTeamIds) {
          if (await playerAlreadyExists(reg.child1_first_name || '', reg.child1_last_name || '', teamId)) {
            alert(`Le joueur ${reg.child1_first_name} ${reg.child1_last_name} existe déjà dans ${getTeamName(teamId)}.`); return;
          }
        }
        const createdPlayers: Player[] = [];
        for (const teamId of directTeamIds) {
          const { data: newPlayer, error: pe } = await supabase.from('players').insert({
            first_name: reg.child1_first_name, last_name: reg.child1_last_name,
            team_id: teamId, birth_date: reg.child1_birth_date || null,
          }).select().single();
          if (pe || !newPlayer) throw pe;
          createdPlayers.push(newPlayer as Player);
          await supabase.from('player_stats').insert({ player_id: newPlayer.id, goals: 0, assists: 0, saves: 0, matches_played: 0 });
        }
        const mainPlayer = createdPlayers[0];

        // Si email + password fournis : créer/lier un compte de connexion
        const directPassword = (reg as any).direct_password as string | undefined;
        if (reg.email && directPassword) {
          // Vérifier si un user (parent ou autre) existe déjà avec cet email
          const { data: existingUser } = await supabase.from('users').select('*').eq('email', reg.email).maybeSingle();
          if (existingUser) {
            // Email déjà utilisé : on attache le profil joueur au user existant
            const currentExtras: string[] = ((existingUser as any).roles_extra || []) as string[];
            const newExtras = currentExtras.includes('player') ? currentExtras : [...currentExtras, 'player'];
            await supabase.from('users').update({
              player_id: mainPlayer.id,
              roles_extra: newExtras,
            }).eq('id', existingUser.id);
            for (const player of createdPlayers) {
              const already = parentLinks.some((l) => l.parent_id === existingUser.id && l.player_id === player.id);
              if (!already) await supabase.from('parent_player').insert({ parent_id: existingUser.id, player_id: player.id });
            }
            // S'assurer qu'un rôle 'player' existe dans user_roles si auth_id présent
            if (existingUser.auth_id) {
              const { data: existingRoles } = await supabase.from('user_roles').select('*').eq('auth_id', existingUser.auth_id);
              const hasPlayerRoleRow = (existingRoles || []).some((r: any) => r.role === 'player');
              if (!hasPlayerRoleRow) {
                await supabase.from('user_roles').insert({ auth_id: existingUser.auth_id, role: 'player', ref_id: mainPlayer.id }).then(() => {}, () => {});
              }
            }
          } else {
            // Email nouveau : créer un compte Auth + user
            try {
              const authId = await createAuthUser(reg.email, directPassword);
              const { data: newUser, error: ue } = await supabase.from('users').insert({
                first_name: reg.child1_first_name,
                last_name: reg.child1_last_name,
                email: reg.email,
                role: 'player',
                auth_id: authId,
                player_id: mainPlayer.id,
                roles_extra: ['player'],
              }).select().single();
              if (ue || !newUser) throw ue;
              await supabase.from('user_roles').insert({ auth_id: authId, role: 'player', ref_id: mainPlayer.id });
              for (const player of createdPlayers) {
                await supabase.from('parent_player').insert({ parent_id: newUser.id, player_id: player.id }).then(() => {}, () => {});
              }
            } catch (e: any) {
              console.warn('Auth creation failed for direct registration', e);
              // On laisse le joueur exister même sans compte auth
            }
          }
        }

        // Email de bienvenue
        if (reg.email) {
          supabase.functions.invoke('send-registration-approved-direct', {
            body: {
              email: reg.email,
              playerName: `${reg.child1_first_name} ${reg.child1_last_name}`,
              teamName: directTeamIds.map(getTeamName).join(', '),
              appUrl: appSettings.app_url,
            },
          }).catch(console.error);
        }
      }
      await supabase.from('registrations').update({ status: 'approved' }).eq('id', reg.id);
      await loadData();
      alert('✅ Inscription approuvée et email de bienvenue envoyé !');
    } catch (e: any) { console.error(e); alert('Erreur lors de la validation : ' + (e?.message || e)); }
  }

  async function rejectRegistration(reg: Registration) {
    if (!window.confirm(`Refuser l'inscription de ${reg.parent_first_name} ${reg.parent_last_name} ?`)) return;
    await supabase.from('registrations').update({ status: 'rejected' }).eq('id', reg.id);
    await loadData();
  }


  // ── Computed for coach UI ──
  const parentUsers = useMemo(() => users.filter((u) => u.role === 'parent' || u.role === 'player'), [users]);
  const selectedCoachTemplate = visibleTemplates.find((t) => t.id === selectedTrainingTemplateId) || null;
  const coachTemplateDates = selectedCoachTemplate ? getNextTrainingsForTemplate(selectedCoachTemplate, 8, true).map((t) => t.date) : [];
  const coachTeamPlayers = selectedCoachTeamId ? getPlayersForTeam(selectedCoachTeamId).filter((p) => visibleTeams.some((vt) => vt.id === p.team_id)) : visiblePlayers;
  const coachMatches = (selectedCoachTeamId ? visibleMatches.filter((m) => m.team_id === selectedCoachTeamId) : visibleMatches)
    .slice()
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const coachPlanningMatches = selectedCoachTeamId
    ? visibleMatches.filter((m) => m.team_id === selectedCoachTeamId)
    : visibleMatches.filter((m) => visibleTeams.some((t) => t.id === m.team_id));
  const coachTemplates = selectedCoachTeamId ? visibleTemplates.filter((t) => t.team_id === selectedCoachTeamId) : visibleTemplates;
  const eventPollTeams = isAdmin ? teams : visibleTeams;
  const eventPollTeamIds = eventPollTeams.map((t) => t.id);
  const selectedCoachEventTeamIds = !isAdmin && selectedCoachTeamId ? [selectedCoachTeamId] : eventPollTeamIds;
  const manageableClubEvents = isAdmin ? clubEvents : clubEvents.filter((ev) => !ev.team_ids || ev.team_ids.length === 0 || ev.team_ids.some((tid) => selectedCoachEventTeamIds.includes(tid)));
  const manageablePolls = isAdmin ? polls : polls.filter((poll) => !poll.team_ids || poll.team_ids.length === 0 || poll.team_ids.some((tid) => selectedCoachEventTeamIds.includes(tid)));
  const coachPlayersForSelectedTraining = selectedCoachTemplate?.team_id ? players.filter((p) => p.team_id === selectedCoachTemplate.team_id) : [];

  function chooseCoachTeam(teamId: string) {
    setSelectedCoachTeamId(teamId);
    setCrossCategoryTeamId(teamId);
    const nextTemplate = visibleTemplates.find((t) => t.team_id === teamId);
    setSelectedTrainingTemplateId(nextTemplate?.id || '');
    if (nextTemplate) {
      setSelectedTrainingDate(getNextTrainingsForTemplate(nextTemplate, 1, true)[0]?.date || '');
    }
    const nextMatch = getPreferredUpcomingMatch(visibleMatches.filter((m) => m.team_id === teamId));
    setSelectedMatchId(nextMatch?.id || '');
  }

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;
  const playersForSelectedMatch = selectedMatch?.team_id ? players.filter((p) => p.team_id === selectedMatch.team_id) : [];
  const squadForSelectedMatch = selectedMatchId ? getSquadForMatch(selectedMatchId) : [];

  function getPlayerGender(player: Player): 'male' | 'female' | 'unknown' {
    if (player.gender === 'male' || player.gender === 'female') return player.gender;
    const team = teams.find((t) => t.id === player.team_id);
    const text = `${team?.name || ''} ${team?.category || ''}`.toLowerCase();
    if (text.includes('fille') || text.includes('fémin') || text.includes('feminin') || text.includes('female')) return 'female';
    if (text.includes('garçon') || text.includes('garcon') || text.includes('masculin') || text.includes('male')) return 'male';
    return 'unknown';
  }

  const rosterSummary = useMemo(() => {
    return [...teams]
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((team) => {
        const teamPlayers = players
          .filter((p) => p.team_id === team.id)
          .sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr'));
        return {
          team,
          players: teamPlayers,
          boys: teamPlayers.filter((p) => getPlayerGender(p) === 'male').length,
          girls: teamPlayers.filter((p) => getPlayerGender(p) === 'female').length,
          unknown: teamPlayers.filter((p) => getPlayerGender(p) === 'unknown').length,
        };
      });
  }, [teams, players]);

  const promotionCandidates = useMemo(() => {
    return players
      .filter((p) => p.team_id === promotionSourceTeamId)
      .filter((p) => promotionGenderFilter === 'all' || getPlayerGender(p) === promotionGenderFilter)
      .sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr'));
  }, [players, teams, promotionSourceTeamId, promotionGenderFilter]);

  function togglePromotionPlayer(playerId: string) {
    setPromotionSelectedIds((prev) => prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]);
  }

  async function transferSelectedPlayers() {
    if (!promotionSourceTeamId || !promotionTargetTeamId) { alert('Choisir une catégorie de départ et une catégorie d’arrivée'); return; }
    if (promotionSourceTeamId === promotionTargetTeamId) { alert('Choisir deux catégories différentes'); return; }
    if (promotionSelectedIds.length === 0) { alert('Sélectionner au moins un joueur'); return; }
    const targetName = getTeamName(promotionTargetTeamId);
    if (!window.confirm(`Transférer ${promotionSelectedIds.length} joueur(s) vers ${targetName} ?`)) return;
    setPromotionSaving(true);
    try {
      const { error } = await supabase.from('players').update({ team_id: promotionTargetTeamId }).in('id', promotionSelectedIds);
      if (error) throw error;
      setPromotionSelectedIds([]);
      await loadData();
      alert('Transfert terminé');
    } catch (e) {
      console.error(e);
      alert('Erreur pendant le transfert');
    } finally {
      setPromotionSaving(false);
    }
  }

  const selectedTrainingPresentCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'present').length;
  const selectedTrainingAbsentCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'absent').length;
  const selectedTrainingUnknownCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'unknown').length;

  // Résumé des coaches existants
  const coachSummary = useMemo(() => {
    const map: Record<string, { teamIds: string[], firstName: string, lastName: string, id: string }> = {};
    coachAccessList.forEach((row) => {
      if (!map[row.id]) map[row.id] = { id: row.id, teamIds: [], firstName: row.first_name || '', lastName: row.last_name || '' };
      if (row.team_id) map[row.id].teamIds.push(row.team_id);
    });
    return map;
  }, [coachAccessList]);

  // ── Parent ──
  const linkedPlayerIds = parentLinks.filter((l) => l.parent_id === selectedParentId).map((l) => l.player_id).filter(Boolean) as string[];
  const parentPlayers = players.filter((p) => linkedPlayerIds.includes(p.id));

  // ── RENDER ──
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.loadingBadge}>CA Gorcy Handball</div>
          <h2 style={{ margin: '18px 0 8px 0' }}>Chargement...</h2>
          <p style={{ margin: 0, color: '#5b6472' }}>{"Récupération des données"}</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    // ─── PAGE D'INSCRIPTION ───
    if (showRegisterPage) {
      const directTeams = teams.filter((t) => isDirectCategory(t.id));
      const childTeams = teams.filter((t) => !isDirectCategory(t.id));
      return (
        <div style={styles.page}>
          <div style={{ ...styles.loginCard, maxWidth: 640 }}>
            <div style={styles.topBanner}>
              <img src={CLUB_LOGO} alt="CA Gorcy Handball"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block', border: '3px solid rgba(255,255,255,0.3)' }} />
              <h1 style={{ ...styles.appTitle, fontSize: 22 }}>Inscription — CA Gorcy Handball</h1>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <HandLifeLogo variant="dark" size="sm" />
              </div>
            </div>

            {regSuccess ? (
              <div style={{ marginTop: 24, padding: 20, background: '#dcfce7', borderRadius: 18, border: '1px solid #86efac' }}>
                <p style={{ margin: 0, fontWeight: 800, color: '#166534', fontSize: 16 }}>{regSuccess}</p>
                <button onClick={() => { setRegSuccess(''); setRegStep('parent'); setShowRegisterPage(false); }}
                  style={{ ...styles.primaryButton, marginTop: 16 }}>Retour à l'accueil</button>
              </div>
            ) : (
              <>
                {regStep === 'choose' && (
                  <div style={{ marginTop: 24 }}>
                    <p style={styles.sectionLabel}>Vous souhaitez inscrire :</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button onClick={() => { setRegStep('parent'); setRegError(''); }}
                        style={{ ...styles.roleButton, textAlign: 'left' }}>
                        <div style={styles.roleEmoji}>👪</div>
                        <div style={styles.roleTitle}>Un enfant (U7 à U18)</div>
                        <div style={styles.roleText}>Créer un compte parent et lier votre/vos enfant(s) à votre espace.</div>
                      </button>
                      {directTeams.length > 0 && (
                        <button onClick={() => { const first = directTeams[0]?.id || ''; setRegStep('direct'); setRegDirectTeamId(first); setRegDirectTeamIds(first ? [first] : []); setRegError(''); }}
                          style={{ ...styles.roleButton, textAlign: 'left' }}>
                          <div style={styles.roleEmoji}>🏅</div>
                          <div style={styles.roleTitle}>Loisirs / Senior</div>
                          <div style={styles.roleText}>Inscription directe en tant que joueur adulte ou loisir.</div>
                        </button>
                      )}
                    </div>
                    <button onClick={() => setShowRegisterPage(false)}
                      style={{ ...styles.secondaryOutlineButton, marginTop: 16 }}>← Retour</button>
                  </div>
                )}

                {regStep === 'parent' && (() => {
                  const childTeams = teams.filter((t) => !isDirectCategory(t.id));

                  return (
                    <div style={{ marginTop: 24 }}>
                      <h3 style={{ margin: '0 0 16px 0', color: '#062C5D' }}>Nouvelle inscription</h3>
                      {regError && <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 12, color: '#991b1b', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>{regError}</div>}

                      <div style={{ ...styles.formCard, marginBottom: 16 }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>Informations du parent</h4>
                        <div style={styles.formGrid}>
                          <div><label style={styles.inputLabel}>Prénom *</label><input value={regParentFirstName} onChange={(e) => setRegParentFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                          <div><label style={styles.inputLabel}>Nom *</label><input value={regParentLastName} onChange={(e) => setRegParentLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={styles.inputLabel}>Email * (pour se connecter)</label><input value={regParentEmail} onChange={(e) => setRegParentEmail(e.target.value)} style={styles.input} placeholder="email@exemple.com" type="email" /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={styles.inputLabel}>Choisissez un mot de passe * (min. 8 caractères)</label><input value={regParentPassword} onChange={(e) => setRegParentPassword(e.target.value)} style={styles.input} placeholder="••••••••" type="password" /></div>
                        </div>
                      </div>

                      <div style={{ ...styles.formCard, marginBottom: 16 }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>Profils à rattacher au compte</h4>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#10233b' }}>
                            <input type="checkbox" checked={regAdultIsPlayer} onChange={(e) => setRegAdultIsPlayer(e.target.checked)} />
                            Je suis joueur
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#10233b' }}>
                            <input type="checkbox" checked={regHasFirstChild} onChange={(e) => { setRegHasFirstChild(e.target.checked); if (!e.target.checked) { setRegHasSecondChild(false); setRegChildMode('existing'); setRegChildExistingId(''); setRegChildFirstName(''); setRegChildLastName(''); setRegChildTeamId(''); setRegChildBirthDate(''); setRegChild2Mode('existing'); setRegChild2ExistingId(''); setRegChild2FirstName(''); setRegChild2LastName(''); setRegChild2TeamId(''); setRegChild2BirthDate(''); } }} />
                            J'ai un enfant
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#10233b' }}>
                            <input type="checkbox" checked={regHasSecondChild} onChange={(e) => { setRegHasSecondChild(e.target.checked); if (e.target.checked) setRegHasFirstChild(true); else { setRegChild2Mode('existing'); setRegChild2ExistingId(''); setRegChild2FirstName(''); setRegChild2LastName(''); setRegChild2TeamId(''); setRegChild2BirthDate(''); } }} />
                            J'ai deux enfants
                          </label>
                        </div>
                      </div>

                      {regAdultIsPlayer && (
                        <div style={{ ...styles.formCard, marginBottom: 16 }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>Mon profil joueur</h4>
                          <div style={styles.formGrid}>
                            <div><label style={styles.inputLabel}>Nom</label><input value={regParentLastName} onChange={(e) => setRegParentLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                            <div><label style={styles.inputLabel}>Prénom</label><input value={regParentFirstName} onChange={(e) => setRegParentFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                            <div><label style={styles.inputLabel}>Date de naissance</label><input type="date" value={regDirectBirthDate} onChange={(e) => setRegDirectBirthDate(e.target.value)} style={styles.input} /></div>
                            <div>
                              <label style={styles.inputLabel}>Catégories *</label>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {(directTeams.length > 0 ? directTeams : teams).map((t) => {
                                  const checked = regDirectTeamIds.includes(t.id) || (!regDirectTeamIds.length && regDirectTeamId === t.id);
                                  return (
                                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${checked ? '#0A5FB5' : '#dbe4ef'}`, background: checked ? '#eaf4ff' : 'white', fontWeight: 800, color: '#10233b' }}>
                                      <input type="checkbox" checked={checked} onChange={() => toggleDirectTeam(t.id)} style={{ accentColor: '#0A5FB5' }} />
                                      {t.name}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {regHasFirstChild && (
                        <div style={{ ...styles.formCard, marginBottom: 16 }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>Enfant 1</h4>
                          <div style={styles.formGrid}>
                            <div style={{ gridColumn: '1/-1' }}>
                              <label style={styles.inputLabel}>Catégorie *</label>
                              <select value={regChildTeamId} onChange={(e) => { setRegChildTeamId(e.target.value); setRegChildExistingId(''); setRegChildBirthDate(''); }} style={styles.select}>
                                <option value="">-- Choisir la catégorie --</option>
                                {childTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                            {regChildTeamId && regChildMode === 'existing' && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <label style={styles.inputLabel}>Enfant déjà dans la liste *</label>
                                <select value={regChildExistingId} onChange={(e) => { const p = players.find((x) => x.id === e.target.value); setRegChildExistingId(e.target.value); setRegChildBirthDate(p?.birth_date || ''); }} style={styles.select}>
                                  <option value="">-- Sélectionner l'enfant --</option>
                                  {players.filter((p) => p.team_id === regChildTeamId).sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr')).map((p) => (
                                    <option key={p.id} value={p.id}>{getPlayerName(p)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {regChildTeamId && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#10233b' }}>
                                  <input type="checkbox" checked={regChildMode === 'new'} onChange={(e) => { setRegChildMode(e.target.checked ? 'new' : 'existing'); setRegChildExistingId(''); setRegChildBirthDate(''); }} />
                                  Mon enfant n'est pas dans la liste
                                </label>
                              </div>
                            )}
                            {regChildMode === 'new' && (
                              <>
                                <div><label style={styles.inputLabel}>Nom *</label><input value={regChildLastName} onChange={(e) => setRegChildLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                                <div><label style={styles.inputLabel}>Prénom *</label><input value={regChildFirstName} onChange={(e) => setRegChildFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                              </>
                            )}
                            {(regChildMode === 'new' || regChildExistingId) && (
                              <div style={{ gridColumn: regChildMode === 'new' ? '1/-1' : undefined }}>
                                <label style={styles.inputLabel}>Date de naissance *</label>
                                <input type="date" value={regChildBirthDate} onChange={(e) => setRegChildBirthDate(e.target.value)} style={styles.input} disabled={!!players.find((p) => p.id === regChildExistingId)?.birth_date} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {regHasSecondChild && (
                        <div style={{ ...styles.formCard, marginBottom: 16 }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#0A5FB5' }}>Enfant 2</h4>
                          <div style={styles.formGrid}>
                            <div style={{ gridColumn: '1/-1' }}>
                              <label style={styles.inputLabel}>Catégorie *</label>
                              <select value={regChild2TeamId} onChange={(e) => { setRegChild2TeamId(e.target.value); setRegChild2ExistingId(''); setRegChild2BirthDate(''); }} style={styles.select}>
                                <option value="">-- Choisir la catégorie --</option>
                                {childTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                            {regChild2TeamId && regChild2Mode === 'existing' && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <label style={styles.inputLabel}>Enfant déjà dans la liste *</label>
                                <select value={regChild2ExistingId} onChange={(e) => { const p = players.find((x) => x.id === e.target.value); setRegChild2ExistingId(e.target.value); setRegChild2BirthDate(p?.birth_date || ''); }} style={styles.select}>
                                  <option value="">-- Sélectionner l'enfant --</option>
                                  {players.filter((p) => p.team_id === regChild2TeamId).sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr')).map((p) => (
                                    <option key={p.id} value={p.id}>{getPlayerName(p)}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {regChild2TeamId && (
                              <div style={{ gridColumn: '1/-1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, color: '#10233b' }}>
                                  <input type="checkbox" checked={regChild2Mode === 'new'} onChange={(e) => { setRegChild2Mode(e.target.checked ? 'new' : 'existing'); setRegChild2ExistingId(''); setRegChild2BirthDate(''); }} />
                                  Mon enfant n'est pas dans la liste
                                </label>
                              </div>
                            )}
                            {regChild2Mode === 'new' && (
                              <>
                                <div><label style={styles.inputLabel}>Nom *</label><input value={regChild2LastName} onChange={(e) => setRegChild2LastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                                <div><label style={styles.inputLabel}>Prénom *</label><input value={regChild2FirstName} onChange={(e) => setRegChild2FirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                              </>
                            )}
                            {(regChild2Mode === 'new' || regChild2ExistingId) && (
                              <div style={{ gridColumn: regChild2Mode === 'new' ? '1/-1' : undefined }}>
                                <label style={styles.inputLabel}>Date de naissance *</label>
                                <input type="date" value={regChild2BirthDate} onChange={(e) => setRegChild2BirthDate(e.target.value)} style={styles.input} disabled={!!players.find((p) => p.id === regChild2ExistingId)?.birth_date} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Alerte joueurs similaires */}
                      {similarPlayers.length > 0 && (
                        <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                          <div style={{ fontWeight: 800, color: '#92400e', fontSize: 15, marginBottom: 12 }}>⚠️ Des joueurs similaires existent déjà dans le club :</div>
                          {similarPlayers.map(({ child, players: sims }) => (
                            <div key={child} style={{ marginBottom: 12 }}>
                              <div style={{ fontWeight: 700, color: '#78350f', marginBottom: 8 }}>Pour l'enfant {child} ({child === 1 ? regChildFirstName : regChild2FirstName} {child === 1 ? regChildLastName : regChild2LastName}) :</div>
                              {sims.map((p: any) => {
                                const age = p.birth_date ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
                                const team = teams.find((t) => t.id === p.team_id);
                                const isLinked = child === 1 ? regChildLinked : regChild2Linked;
                                return (
                                  <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: 12, border: '1px solid #fde68a', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800, color: '#062C5D', fontSize: 14 }}>👤 {p.first_name} {p.last_name}</div>
                                    <div style={{ fontSize: 13, color: '#5b6472', marginTop: 3 }}>
                                      🏅 {team?.name || 'Équipe inconnue'} · {team?.category || ''}{age !== null ? ` · ${age} ans` : ' · Âge inconnu'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                      <button onClick={() => {
                                        // Mettre à jour le payload directement et soumettre
                                        const updatedLinked = { ...regLinkedPlayerIds, [child]: p.id };
                                        setRegLinkedPlayerIds(updatedLinked);
                                        if (child === 1) setRegChildLinked(true);
                                        else setRegChild2Linked(true);
                                        setSimilarPlayers([]);
                                        setRegError('');
                                        // Soumettre directement avec les valeurs à jour
                                        setTimeout(() => submitWithLinked(updatedLinked), 50);
                                      }} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                        ✅ C'est bien mon enfant — lier ce joueur
                                      </button>
                                      <button onClick={() => {
                                        setSimilarPlayers([]);
                                        setRegError('');
                                      }} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                        ❌ Ce n'est pas mon enfant — continuer
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={handleUnifiedRegister} disabled={registering} style={{ ...styles.primaryButton, flex: 1 }}>
                          {registering ? 'Inscription en cours...' : "✅ Valider l'inscription"}
                        </button>
                        <button onClick={() => { setShowRegisterPage(false); setRegError(''); setSimilarPlayers([]); }} style={styles.secondaryOutlineButton}>← Retour</button>
                      </div>
                    </div>
                  );
                })()}

                {regStep === 'direct' && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#062C5D' }}>🏅 Inscription Loisirs / Senior</h3>
                    {regError && <div style={{ padding: '10px 14px', background: '#fee2e2', borderRadius: 12, color: '#991b1b', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>{regError}</div>}
                    <div style={styles.formCard}>
                      <div style={styles.formGrid}>
                        <div><label style={styles.inputLabel}>Prénom *</label><input value={regDirectFirstName} onChange={(e) => setRegDirectFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                        <div><label style={styles.inputLabel}>Nom *</label><input value={regDirectLastName} onChange={(e) => setRegDirectLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={styles.inputLabel}>Catégories *</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                            {directTeams.map((t) => {
                              const checked = regDirectTeamIds.includes(t.id) || (!regDirectTeamIds.length && regDirectTeamId === t.id);
                              return (
                                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: `2px solid ${checked ? '#0A5FB5' : '#dbe4ef'}`, background: checked ? '#eaf4ff' : 'white', fontWeight: 900, color: '#10233b' }}>
                                  <input type="checkbox" checked={checked} onChange={() => toggleDirectTeam(t.id)} style={{ accentColor: '#0A5FB5' }} />
                                  {t.name}
                                </label>
                              );
                            })}
                          </div>
                          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: 12 }}>Tu peux cocher plusieurs catégories, par exemple Loisir et Senior masculin.</p>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={styles.inputLabel}>Date de naissance</label>
                          <input type="date" value={regDirectBirthDate} onChange={(e) => setRegDirectBirthDate(e.target.value)} style={styles.input} max="2025-12-31" />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={styles.inputLabel}>Email * (pour se connecter)</label>
                          <input type="email" value={regDirectEmail} onChange={(e) => setRegDirectEmail(e.target.value)} style={styles.input} placeholder="votre@email.fr" />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={styles.inputLabel}>Mot de passe * (min. 8 caractères)</label>
                          <input type="password" value={regDirectPassword} onChange={(e) => setRegDirectPassword(e.target.value)} style={styles.input} placeholder="••••••••" autoComplete="new-password" />
                          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                            Si votre email est déjà utilisé pour un compte parent, votre profil joueur sera ajouté à votre compte existant — vous garderez le même mot de passe.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                      <button onClick={handleDirectRegister} disabled={registering} style={{ ...styles.primaryButton, flex: 1 }}>
                        {registering ? 'Inscription en cours...' : "✅ Valider l'inscription"}
                      </button>
                      <button onClick={() => { setRegStep('choose'); setRegError(''); }} style={styles.secondaryOutlineButton}>← Retour</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    // ─── PAGE CHANGEMENT MOT DE PASSE (depuis lien email) ───
    if (showChangePassword) {
      return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#edf4ff,#dbeaff)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Arial, sans-serif' }}>
          <div style={{ width: '100%', maxWidth: 480, background: 'white', borderRadius: 28, padding: 28, boxShadow: '0 18px 40px rgba(6,44,93,0.15)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', borderRadius: 20, padding: 24, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
              <h2 style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: 22 }}>Nouveau mot de passe</h2>
              <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>CA Gorcy Handball</p>
            </div>

            {changePwSuccess ? (
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: 16, marginBottom: 8 }}>Mot de passe modifié !</div>
                <p style={{ margin: '0 0 16px 0', color: '#166534', fontSize: 14 }}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
                <button onClick={() => { setShowChangePassword(false); setChangePwSuccess(false); }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                  Aller à la connexion →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, color: '#5b6472', fontSize: 14 }}>Choisis un nouveau mot de passe pour ton compte.</p>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#5b6472', display: 'block', marginBottom: 6 }}>Nouveau mot de passe (min. 8 caractères)</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #d5dfeb', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const }}
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#5b6472', display: 'block', marginBottom: 6 }}>Confirmer le mot de passe</label>
                  <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #d5dfeb', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const }}
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} />
                </div>
                {changePwError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                    {changePwError}
                  </div>
                )}
                <button onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !newPassword2}
                  style={{ padding: '14px', borderRadius: 14, border: 'none', background: changePwLoading ? '#94a3b8' : '#0A5FB5', color: 'white', fontWeight: 800, fontSize: 16, cursor: changePwLoading ? 'not-allowed' : 'pointer' }}>
                  {changePwLoading ? '⏳ Enregistrement...' : '✅ Enregistrer le nouveau mot de passe'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ─── PAGE DE LOGIN ───
    if (!authChecked) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4fa' }}>
          <div style={{ fontSize: 40 }}>⏳</div>
        </div>
      );
    }

    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.topBanner}>
            <img src={CLUB_LOGO} alt="CA Gorcy Handball"
              style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block', border: '3px solid rgba(255,255,255,0.3)' }} />
            <h1 style={styles.appTitle}>CA Gorcy Handball</h1>
            <p style={styles.appSubtitle}>Espace de gestion interne</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <HandLifeLogo variant="dark" size="sm" />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button onClick={() => { setShowRegisterPage(true); setRegStep('parent'); setRegSuccess(''); setRegError(''); }}
              style={{ width: '100%', padding: '16px 20px', borderRadius: 18, border: '2px solid #0A5FB5', background: 'linear-gradient(135deg,#eaf4ff,#dbeaff)', color: '#062C5D', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span>Nouvelle inscription</span>
            </button>
          </div>

          <div style={{ margin: '18px 0 0 0', borderTop: '1px solid #dde7f2' }} />

          <div style={{ marginTop: 18 }}>
            {!showResetForm ? (
              <>
                <p style={styles.sectionLabel}>Se connecter</p>
                <LoginForm
                  onSubmit={handleLogin}
                  loading={loginLoading}
                  error={loginError}
                />
                <button
                  onClick={() => { setShowResetForm(true); setLoginError(''); setResetSent(false); setResetEmail(''); }}
                  style={{ marginTop: 14, background: 'none', border: 'none', color: '#0A5FB5', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  Mot de passe oublié ?
                </button>
              </>
            ) : (
              <div>
                <p style={styles.sectionLabel}>Réinitialiser le mot de passe</p>
                {resetSent ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: 15, marginBottom: 6 }}>✅ Email envoyé !</div>
                    <p style={{ margin: 0, color: '#166534', fontSize: 14 }}>
                      Vérifie ta boîte mail ({resetEmail}) et clique sur le lien pour choisir un nouveau mot de passe.
                    </p>
                    <button onClick={() => { setShowResetForm(false); setResetSent(false); setResetEmail(''); }}
                      style={{ marginTop: 14, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                      Retour à la connexion
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#5b6472' }}>
                      Entre ton adresse email — tu recevras un lien pour créer un nouveau mot de passe.
                    </p>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#5b6472', display: 'block', marginBottom: 6 }}>Email</label>
                      <input
                        type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="votre@email.fr" autoComplete="email"
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #d5dfeb', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const }}
                      />
                    </div>
                    {loginError && (
                      <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                        {loginError}
                      </div>
                    )}
                    <button onClick={handleResetPassword} disabled={resetLoading || !resetEmail.trim()}
                      style={{ padding: '14px', borderRadius: 14, border: 'none', background: resetLoading ? '#94a3b8' : '#0A5FB5', color: 'white', fontWeight: 800, fontSize: 16, cursor: resetLoading ? 'not-allowed' : 'pointer' }}>
                      {resetLoading ? '⏳ Envoi...' : '📧 Envoyer le lien de réinitialisation'}
                    </button>
                    <button onClick={() => { setShowResetForm(false); setLoginError(''); }}
                      style={{ background: 'none', border: 'none', color: '#5b6472', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'underline', padding: 0, textAlign: 'left' as const }}>
                      ← Retour à la connexion
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sponsors page connexion */}
          {sponsors.length > 0 && (() => {
            const sponsor = sponsors[currentSponsorIdx % sponsors.length];
            return (
              <div style={{ marginTop: 20, borderTop: '1px solid #e9d5ff', paddingTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#c4b5fd', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>Nos partenaires</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <a href={sponsor.website_url || undefined} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textDecoration: 'none', minHeight: 156 }}>
                    <img src={sponsor.photo_url} alt={sponsor.name}
                      style={{ maxWidth: '100%', maxHeight: 195, width: 'auto', height: 'auto', objectFit: 'contain' }} />
                  </a>
                  {sponsors.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                      {sponsors.map((_, i) => (
                        <div key={i} onClick={() => setCurrentSponsorIdx(i)}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: i === currentSponsorIdx % sponsors.length ? '#9333ea' : '#e9d5ff', cursor: 'pointer', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    );
  }

  // ─── APP CONNECTÉE ─────────────────────────────────────────────────────────
  return (
    <div style={styles.appPage}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: '1 1 300px' }}>
            <img src={CLUB_LOGO} alt="CA Gorcy Handball"
              style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={styles.headerBadge}>CA Gorcy Handball</div>
              <h1 style={{ margin: '8px 0 6px 0', fontSize: 'clamp(28px, 8vw, 46px)', lineHeight: 1.05 }}>
                {activeRole === 'coach' ? (isAdmin ? '👑 Admin' : '🏆 Espace Coach') : '👪 Espace Parent'}
              </h1>
              <p style={{ margin: 0, opacity: 0.92, overflowWrap: 'anywhere' }}>
                {activeRole === 'coach'
                  ? isAdmin ? 'Accès complet à toutes les équipes' : `Vos équipes : ${allowedTeamIds.map(getTeamName).join(', ')}`
                  : 'Présences et infos équipe'}
              </p>
              <div style={{ marginTop: 10 }}>
                <HandLifeLogo variant="dark" size="sm" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
            {/* Photo de profil du coach connecté */}
            {activeRole === 'coach' && !isAdmin && connectedCoachId && (() => {
              const me = coachAccessList.find((c) => c.id === connectedCoachId);
              const initials = `${me?.first_name?.[0] || ''}${me?.last_name?.[0] || ''}`.toUpperCase();
              return (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {me?.photo_url
                    ? <img src={me.photo_url} alt="Ma photo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
                    : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white' }}>
                        {initials || '🏆'}
                      </div>
                  }
                  <label htmlFor="coach-self-photo" style={{ position: 'absolute', bottom: -2, right: -2, background: 'white', color: '#0A5FB5', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} title="Changer ma photo">📷</label>
                  <input id="coach-self-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !connectedCoachId) return;
                    await uploadCoachPhoto(connectedCoachId, file);
                    e.target.value = '';
                  }} />
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', minWidth: 0 }}>
              {activeRole === 'coach' && (() => {
                const online = getOnlineCounts();
                return (
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowHeaderOnline((p) => !p)}
                      style={{ position: 'relative', minWidth: 54, height: 48, padding: '8px 10px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      title="Voir les personnes en ligne">
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: online.total > 0 ? '#22c55e' : '#94a3b8', boxShadow: online.total > 0 ? '0 0 0 3px rgba(34,197,94,0.20)' : 'none', display: 'inline-block' }} />
                      {online.total}
                    </button>
                    {showHeaderOnline && (
                      <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 'min(320px, calc(100vw - 32px))', maxWidth: 'calc(100vw - 32px)', background: 'white', color: '#10233b', borderRadius: 16, boxShadow: '0 18px 40px rgba(15,23,42,0.22)', border: '1px solid #d8e5f2', padding: 12, zIndex: 50, boxSizing: 'border-box' }}>
                        <div style={{ fontWeight: 900, color: '#062C5D', marginBottom: 8 }}>Personnes en ligne</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#1e40af', background: '#dbeafe', borderRadius: 999, padding: '4px 8px' }}>{online.coaches + online.admins} coach/admin</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', background: '#dcfce7', borderRadius: 999, padding: '4px 8px' }}>{online.parents} parent</span>
                          {online.players > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: '#92400e', background: '#fef3c7', borderRadius: 999, padding: '4px 8px' }}>{online.players} joueur</span>}
                        </div>
                        {online.list.length === 0 ? (
                          <div style={{ color: '#64748b', fontSize: 13, padding: '8px 0' }}>Personne en ligne pour le moment.</div>
                        ) : (
                          <div style={{ display: 'grid', gap: 7, maxHeight: 260, overflowY: 'auto' }}>
                            {online.list
                              .slice()
                              .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || '', 'fr'))
                              .map((p) => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: '#f8fbff', border: '1px solid #e2e8f0' }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || 'Utilisateur'}</div>
                                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{p.role}</div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
              {getCurrentAdminDelegateTarget() && (
                <button onClick={enterDelegatedAdminAccess}
                  title="Acces direct admin" aria-label="Acces direct admin"
                  style={{ height: 48, padding: '0 14px', borderRadius: 14, border: 'none', background: '#facc15', color: '#062C5D', fontWeight: 900, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Admin</span>
                </button>
              )}
              {/* Message icon with badge */}
              {(() => {
                const unreadCount = getUnreadMessageConversations().length;
                return (
                  <button onClick={openMessagesPanel} style={{ position: 'relative', padding: '10px 14px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 800, cursor: 'pointer', fontSize: 18 }} title="Messages">
                    💬
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 2, background: '#dc2626', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 900, padding: '1px 5px', minWidth: 16, textAlign: 'center', lineHeight: '14px', display: 'block' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })()}
              <button onClick={() => setShowCalendar(true)} title="Calendrier" aria-label="Calendrier" style={{ width: 48, height: 48, borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: 20 }}>📅</button>
              <button onClick={handleLogout} title="Déconnexion" aria-label="Déconnexion" style={{ width: 48, height: 48, borderRadius: 14, border: 'none', background: 'white', color: '#062C5D', fontWeight: 900, cursor: 'pointer', fontSize: 20 }}>⏻</button>
            </div>
          </div>
        </div>

        {showNewMessagePopup && (
          <div style={{ marginBottom: 16, padding: 16, borderRadius: 18, background: '#eff6ff', border: '1px solid #93c5fd', boxShadow: '0 12px 28px rgba(10,95,181,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, color: '#0A5FB5', fontSize: 16 }}>Nouveau message disponible</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 3 }}>
                {newMessagePopupCount} conversation{newMessagePopupCount > 1 ? 's' : ''} avec un nouveau message.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={openMessagesPanel} style={{ ...styles.primaryButton, padding: '10px 14px' }}>Ouvrir</button>
              <button onClick={() => setShowNewMessagePopup(false)} style={{ ...styles.secondaryOutlineButton, padding: '10px 14px' }}>Plus tard</button>
            </div>
          </div>
        )}

        {showCalendar && (
          <Calendar
            matches={matches}
            teams={teams}
            trainingTemplates={trainingTemplates}
            clubEvents={clubEvents}
            eventAttendance={eventAttendance}
            getTeamName={getTeamName}
            formatDate={formatDate}
            formatTime={formatTime}
            getNextDatesForWeekday={getNextDatesForWeekday}
            onClose={() => setShowCalendar(false)}
            activeRole={activeRole}
            parentPlayers={parentPlayers}
            players={players}
            saveEventAttendance={saveEventAttendance}
            getEventAttendanceStatus={getEventAttendanceStatus}
            getEventCounts={getEventCounts}
          />
        )}

        {/* ─── VUE COACH ─────────────────────────────────────────────────── */}
        {activeRole === 'coach' && (
          <>
            {visibleTeams.length > 0 && (
              <div style={{ ...styles.panelCard, marginBottom: 12, padding: 12, background: '#f8fbff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#0A5FB5', textTransform: 'uppercase', letterSpacing: 0, marginBottom: 8 }}>Catégorie affichée</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))', gap: 8 }}>
                  {visibleTeams.map((team) => {
                    const active = selectedCoachTeamId === team.id;
                    return (
                      <button key={team.id} onClick={() => chooseCoachTeam(team.id)}
                        style={{ minHeight: 44, padding: '9px 12px', borderRadius: 12, border: `2px solid ${active ? '#0A5FB5' : '#d5dfeb'}`, background: active ? '#0A5FB5' : 'white', color: active ? 'white' : '#10233b', fontWeight: 900, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
                        {team.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Menu onglets */}
            <div style={styles.coachMenu}>
              {(['trainings', 'matches', 'stats', 'composition', 'team', 'players', 'users', 'messages', 'licenses', 'events', 'polls', 'password', ...(isAdmin ? ['admin'] : [])] as CoachTab[]).map((tab) => {
                const labels: Record<CoachTab, string> = {
                  trainings: '📅 Entraînements', matches: '⚽ Matchs', stats: '📊 Stats',
                  composition: '🏐 Composition',
                  team: '👕 Mon équipe', players: '👥 Joueurs', users: '🔒 Utilisateurs',
                  messages: '💬 Messages', licenses: '🪪 Licences', password: '🔑 Mot de passe',
                  accessibility: '⚙️ Administration', admin: '⚙️ Administration',
                  events: '🎉 Événements',
                  polls: '📊 Sondages',
                };
                // Badges de notification
                let badgeCount = 0;
                if (tab === 'messages') {
                  badgeCount = getUnreadMessageConversations().length;
                } else if (tab === 'licenses' && isAdmin) {
                  // Licences 'paid' en attente de validation
                  const myPlayerIds = players.map((p) => p.id);
                  badgeCount = licenseStatuses.filter((l) => l.status === 'paid' && myPlayerIds.includes(l.player_id)).length;
                } else if (tab === 'admin' && isAdmin) {
                  badgeCount = registrations.filter((r) => r.status === 'pending').length;
                }
                return (
                  <button key={tab} onClick={() => {
                    setCoachTab(tab);
                    if (tab === 'events' || tab === 'polls') setAdminSubTab(tab);
                    if (tab === 'messages') setShowNewMessagePopup(false);
                  }}
                    style={{ ...styles.menuButton, ...(coachTab === tab ? styles.menuButtonActive : {}), position: 'relative' }}>
                    {labels[tab]}
                    {badgeCount > 0 && (
                      <span style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 900, padding: '2px 6px', minWidth: 18, textAlign: 'center', boxShadow: '0 2px 4px rgba(220,38,38,0.4)' }}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── ENTRAÎNEMENTS ── */}
            {coachTab === 'trainings' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>{"Entraînements"}</h2>
                <p style={styles.blockSubtitle}>{"Les 2 prochaines séances à partir d'aujourd'hui."}</p>

                {/* Filtre équipe */}
                <div style={{ ...styles.filterBar, marginBottom: 20 }}>
                  <label style={styles.inputLabel}>Équipe</label>
                  <select value={selectedCoachTeamId} onChange={(e) => chooseCoachTeam(e.target.value)} style={styles.select}>
                    {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {(() => {
                  // Calculer les 2 prochaines séances toutes templates confondues
                  const today = new Date(); today.setHours(0,0,0,0);
                  const upcoming: { template: TrainingTemplate; date: string; cancelled?: boolean; cancellationReason?: string | null }[] = [];
                  for (const template of coachTemplates) {
                    const trainings = getNextTrainingsForTemplate(template, 4, true);
                    for (const training of trainings) {
                      const d = new Date(training.date); d.setHours(0,0,0,0);
                      if (d >= today) upcoming.push({ template, date: training.date, cancelled: training.cancelled, cancellationReason: training.cancellationReason });
                    }
                  }
                  upcoming.sort((a, b) => a.date.localeCompare(b.date));
                  const next2 = upcoming.slice(0, 2);

                  if (next2.length === 0) return <div style={styles.emptyState}>Aucun entraînement prévu.</div>;

                  return (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {next2.map(({ template, date, cancelled, cancellationReason }) => {
                        const teamPlayers = getPlayersForTeam(template.team_id).filter((p) => visibleTeams.some((vt) => vt.id === p.team_id));
                        const counts = getTrainingCounts(template.id, template.team_id, date);
                        const presentPlayers = teamPlayers.filter((p) => getAttendanceStatus(template.id, p.id, date) === 'present');
                        const absentPlayers = teamPlayers.filter((p) => getAttendanceStatus(template.id, p.id, date) === 'absent');
                        const unknownPlayers = teamPlayers.filter((p) => getAttendanceStatus(template.id, p.id, date) === 'unknown');
                        return (
                          <div key={`${template.id}-${date}`} style={styles.teamCard}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                              <div>
                                <h3 style={{ margin: 0 }}>{template.title || 'Entraînement'} – {getTeamName(template.team_id)}</h3>
                                <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>
                                  📅 {formatDate(date)} · {getWeekdayLabel(template.weekday)} · {template.start_time}–{template.end_time} · 📍 {template.location || '-'}
                                </p>
                                {cancelled && (
                                  <div style={{ marginTop: 8, display: 'inline-flex', padding: '6px 10px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 900 }}>
                                    Annulé{cancellationReason ? ` · ${cancellationReason}` : ''}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ ...styles.statusBadge, ...styles.badgeGreen }}>✅ {counts.present}</span>
                                <span style={{ ...styles.statusBadge, ...styles.badgeRed }}>❌ {counts.absent}</span>
                                <span style={{ ...styles.statusBadge, ...styles.badgeGray }}>❓ {counts.unknown}</span>
                              </div>
                            </div>

                            {/* Présents */}
                            {!cancelled && presentPlayers.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 6 }}>✅ Présents ({presentPlayers.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {presentPlayers.map((p) => (
                                    <span key={p.id} style={{ background: '#e8f7ee', color: '#166534', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{getPlayerName(p)}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Absents */}
                            {!cancelled && absentPlayers.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>❌ Absents ({absentPlayers.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {absentPlayers.map((p) => (
                                    <span key={p.id} style={{ background: '#fdecec', color: '#991b1b', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{getPlayerName(p)}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Sans réponse */}
                            {!cancelled && unknownPlayers.length > 0 && (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#526071', marginBottom: 6 }}>❓ Sans réponse ({unknownPlayers.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {unknownPlayers.map((p) => (
                                    <span key={p.id} style={{ background: '#eef2f7', color: '#526071', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{getPlayerName(p)}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Bouton rappel manuel */}
                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <button
                                onClick={() => sendTrainingManualReminder(template, date)}
                                disabled={cancelled || sendingTrainingReminder === `${template.id}-${date}`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '10px 18px', borderRadius: 12, border: 'none',
                                  background: cancelled || sendingTrainingReminder === `${template.id}-${date}` ? '#94a3b8' : '#f59e0b',
                                  color: 'white', fontWeight: 800, fontSize: 14, cursor: cancelled || sendingTrainingReminder === `${template.id}-${date}` ? 'default' : 'pointer',
                                  transition: 'background 0.15s',
                                }}>
                                {sendingTrainingReminder === `${template.id}-${date}` ? '⏳ Envoi...' : '📧 Envoyer un rappel aux parents'}
                              </button>
                              <button
                                onClick={() => cancelTraining(template, date)}
                                disabled={cancelingTrainingKey === `${template.id}-${date}`}
                                style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: cancelled ? '#16a34a' : '#dc2626', color: 'white', fontWeight: 800, fontSize: 14, cursor: cancelingTrainingKey === `${template.id}-${date}` ? 'default' : 'pointer' }}>
                                {cancelingTrainingKey === `${template.id}-${date}` ? '⏳...' : cancelled ? 'Remettre au planning' : "Annuler l'entraînement"}
                              </button>
                              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                {cancelled ? 'Les parents voient la séance annulée.' : 'Annulation avec email aux parents'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{ ...styles.panelCard, marginTop: 20, background: '#f8fbff', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#062C5D' }}>Creneaux recurrents</h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {coachTemplates.map((template) => (
                      <div key={template.id} style={{ ...styles.linkRow, background: 'white', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <strong>{template.title || 'Entrainement'} - {getTeamName(template.team_id)}</strong>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {getWeekdayLabel(template.weekday)} - {template.start_time} / {template.end_time} - {template.location || '-'}
                          </div>
                        </div>
                        <button onClick={() => startEditTrainingTemplate(template)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '8px 12px' }}>Modifier</button>
                      </div>
                    ))}
                  </div>
                  {editingTrainingTemplateId && coachTemplates.some((t) => t.id === editingTrainingTemplateId) && (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'white', border: '1px solid #dbe4ef' }}>
                      <div style={{ ...styles.miniTitle, marginBottom: 10 }}>Modifier le creneau</div>
                      <div style={styles.formGrid}>
                        <div><label style={styles.inputLabel}>Titre</label><input value={newTrainingTitle} onChange={(e) => setNewTrainingTitle(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Jour</label><select value={newTrainingWeekday} onChange={(e) => setNewTrainingWeekday(e.target.value)} style={styles.select}><option value="1">Lundi</option><option value="2">Mardi</option><option value="3">Mercredi</option><option value="4">Jeudi</option><option value="5">Vendredi</option><option value="6">Samedi</option><option value="0">Dimanche</option></select></div>
                        <div><label style={styles.inputLabel}>Debut</label><input type="time" value={newTrainingStart} onChange={(e) => setNewTrainingStart(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Fin</label><input type="time" value={newTrainingEnd} onChange={(e) => setNewTrainingEnd(e.target.value)} style={styles.input} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>Lieu</label><input value={newTrainingLocation} onChange={(e) => setNewTrainingLocation(e.target.value)} style={styles.input} /></div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={addTrainingTemplate} disabled={savingTrainingTemplate} style={styles.primaryButton}>{savingTrainingTemplate ? 'Enregistrement...' : 'Enregistrer'}</button>
                        <button onClick={resetTrainingTemplateForm} style={styles.secondaryOutlineButton}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ ...styles.panelCard, marginTop: 20, background: '#f8fafc', border: '1px solid #dbe4ef' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#062C5D' }}>Périodes de vacances</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <div><label style={styles.inputLabel}>Titre</label><input value={newBreakTitle} onChange={(e) => setNewBreakTitle(e.target.value)} style={styles.input} placeholder="Vacances scolaires" /></div>
                    <div><label style={styles.inputLabel}>Début</label><input type="date" value={newBreakStart} onChange={(e) => setNewBreakStart(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Fin</label><input type="date" value={newBreakEnd} onChange={(e) => setNewBreakEnd(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Note</label><input value={newBreakReason} onChange={(e) => setNewBreakReason(e.target.value)} style={styles.input} placeholder="Optionnel" /></div>
                  </div>
                  <button onClick={addTrainingBreak} style={{ ...styles.secondaryButton, marginTop: 10, background: '#0A5FB5' }}>Ajouter la période</button>
                  <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                    {trainingBreaks.filter((b) => !b.team_id || b.team_id === selectedCoachTeamId).map((b) => (
                      <div key={b.id} style={{ ...styles.linkRow, background: 'white' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{b.title}</strong>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{formatDate(b.start_date)} au {formatDate(b.end_date)} · {b.team_id ? getTeamName(b.team_id) : 'Toutes les équipes'}{b.reason ? ` · ${b.reason}` : ''}</div>
                        </div>
                        <button onClick={() => deleteTrainingBreak(b.id)} style={{ ...styles.linkRemoveButton, fontSize: 12 }}>Supprimer</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MATCHS ── */}
            {coachTab === 'matches' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>⚽ Matchs</h2>

                {/* Sous-onglets */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>
                  {(['planning', 'convocation'] as const).map((sub) => (
                    <button key={sub} onClick={() => setMatchSubTab(sub)}
                      style={{ padding: '10px 22px', border: 'none', background: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer', color: matchSubTab === sub ? '#0A5FB5' : '#94a3b8', borderBottom: matchSubTab === sub ? '3px solid #0A5FB5' : '3px solid transparent', marginBottom: -2, transition: 'all 0.15s' }}>
                      {sub === 'planning' ? '📋 Planning des matchs' : '📣 Convocations & résultats'}
                    </button>
                  ))}
                </div>

                {/* ── SOUS-ONGLET : PLANNING ── */}
                {matchSubTab === 'planning' && (
                  <>
                    <div style={{ ...styles.formCard, marginBottom: 18 }}>
                      <h3 style={styles.panelTitle}>{editingMatchId ? '✏️ Modifier le match' : '➕ Ajouter un match'}</h3>
                      <div style={styles.formGrid}>
                        <div>
                          <label style={styles.inputLabel}>Équipe</label>
                          <select value={newMatchTeamId} onChange={(e) => setNewMatchTeamId(e.target.value)} style={styles.select}>
                            {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div><label style={styles.inputLabel}>Adversaire</label><input value={newMatchOpponent} onChange={(e) => setNewMatchOpponent(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Date & heure</label><input type="datetime-local" value={newMatchDate} onChange={(e) => setNewMatchDate(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Lieu</label><input value={newMatchLocation} onChange={(e) => setNewMatchLocation(e.target.value)} style={styles.input} /></div>
                        <div>
                          <label style={styles.inputLabel}>Type</label>
                          <select value={newMatchHomeAway} onChange={(e) => setNewMatchHomeAway(e.target.value as 'home' | 'away')} style={styles.select}>
                            <option value="home">Domicile</option><option value="away">Extérieur</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        <div>
                          <label style={styles.inputLabel}>Lien feuille de match FFHB</label>
                          <input value={newMatchFdmUrl} onChange={(e) => setNewMatchFdmUrl(e.target.value)} style={styles.input} placeholder="https://media-ffhb-fdm.ffhandball.fr/fdm/..." />
                        </div>
                        <div>
                          <label style={styles.inputLabel}>Resume supporter</label>
                          <textarea value={newMatchSupporterSummary} onChange={(e) => setNewMatchSupporterSummary(e.target.value)} style={{ ...styles.input, minHeight: 82, resize: 'vertical' }} placeholder="Belle victoire collective, avec une defense solide et une fin de match maitrisee." />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={addMatch} style={styles.primaryButton}>{editingMatchId ? '💾 Enregistrer' : 'Ajouter le match'}</button>
                        {editingMatchId && (
                          <button onClick={resetMatchForm} style={styles.secondaryOutlineButton}>Annuler</button>
                        )}
                      </div>
                    </div>

                    <div style={styles.panelCard}>
                      <h3 style={styles.panelTitle}>📋 Liste des matchs</h3>
                      <div style={{ ...styles.filterBar, marginBottom: 16 }}>
                        <label style={styles.inputLabel}>Catégorie</label>
                        <select value={selectedCoachTeamId} onChange={(e) => chooseCoachTeam(e.target.value)} style={styles.select}>
                          {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      {coachPlanningMatches.length === 0
                        ? <div style={styles.emptyState}>Aucun match.</div>
                        : <div style={{ display: 'grid', gap: 8 }}>
                          {[...coachPlanningMatches].sort((a, b) => b.match_date.localeCompare(a.match_date)).map((m) => (
                            <div key={m.id} style={{ ...styles.linkRow, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1 }}>
                                <strong>{getTeamName(m.team_id)} vs {m.opponent}</strong>
                                <div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{formatDate(m.match_date)} {formatTime(m.match_date)} · {m.location || '-'} · {m.home_away === 'home' ? 'Domicile' : 'Extérieur'}</div>
                                {(() => {
                                  const squad = getSquadForMatch(m.id);
                                  if (squad.length === 0) return null;
                                  return <div style={{ fontSize: 12, color: '#0A5FB5', marginTop: 4, fontWeight: 700 }}>📣 {squad.length} joueur{squad.length > 1 ? 's' : ''} convoqué{squad.length > 1 ? 's' : ''}</div>;
                                })()}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => startEditMatch(m)} style={{ ...styles.secondaryButton, fontSize: 13, padding: '8px 12px' }}>Modifier</button>
                                <button onClick={() => deleteMatch(m)} style={{ ...styles.linkRemoveButton, fontSize: 13 }}>🗑</button>
                              </div>
                            </div>
                          ))}
                        </div>}
                      {selectedCoachTeamId && getTournamentsForTeam(selectedCoachTeamId).length > 0 && (
                        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                          <h4 style={{ margin: '0 0 4px 0', color: '#92400e' }}>🏆 Tournois</h4>
                          {getTournamentsForTeam(selectedCoachTeamId).map((ev) => {
                            const counts = getEventCounts(ev.id);
                            const teamLabel = ev.team_ids?.length > 0 ? ev.team_ids.map(getTeamName).join(', ') : 'Toutes les catégories';
                            return (
                              <div key={ev.id} style={{ ...styles.linkRow, background: '#fffbeb', border: '1px solid #fde68a', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                  <strong>🏆 {ev.title}</strong>
                                  <div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{formatDate(ev.event_date)} {formatTime(ev.event_date)} · {ev.location || '-'} · {teamLabel}</div>
                                  {ev.description && <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{ev.description}</div>}
                                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: 12, fontWeight: 800 }}>
                                    <span style={{ color: '#16a34a' }}>✅ {counts.present} présents</span>
                                    <span style={{ color: '#dc2626' }}>❌ {counts.absent} absents</span>
                                    <span style={{ color: '#64748b' }}>⏳ {counts.pending} sans réponse</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── SOUS-ONGLET : CONVOCATIONS & RÉSULTATS ── */}
                {matchSubTab === 'convocation' && (
                  <div style={styles.panelCard}>
                    <h3 style={styles.panelTitle}>Sélectionner un match</h3>
                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.inputLabel}>Équipe</label>
                        <select value={selectedCoachTeamId} onChange={(e) => chooseCoachTeam(e.target.value)} style={styles.select}>
                          {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Match</label>
                        <select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)} style={styles.select}>
                          <option value="">Choisir un match</option>
                          {coachMatches.map((m) => <option key={m.id} value={m.id}>{getTeamName(m.team_id)} vs {m.opponent || '-'} – {formatDate(m.match_date)}</option>)}
                        </select>
                      </div>
                    </div>

                    {!selectedMatch
                      ? <div style={styles.emptyState}>Choisis un match pour voir le détail.</div>
                      : (
                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ marginTop: 0 }}>{getTeamName(selectedMatch.team_id)} vs {selectedMatch.opponent || '-'}</h4>
                          <p style={{ color: '#5b6472', marginTop: 0 }}>
                            {formatDate(selectedMatch.match_date)} {formatTime(selectedMatch.match_date)} – {selectedMatch.location || '-'} – {selectedMatch.home_away === 'home' ? 'Domicile' : 'Extérieur'}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, margin: '14px 0 18px 0' }}>
                            {([
                              ['convocation', 'Convocation'],
                              ['presence', 'Présence'],
                              ['stats', 'Stats'],
                            ] as const).map(([key, label]) => (
                              <button key={key} onClick={() => setMatchDetailTab(key)}
                                style={{ minHeight: 44, padding: '9px 12px', borderRadius: 12, border: matchDetailTab === key ? '2px solid #0A5FB5' : '1px solid #d6e1ec', background: matchDetailTab === key ? '#0A5FB5' : 'white', color: matchDetailTab === key ? 'white' : '#16304c', fontWeight: 900, cursor: 'pointer' }}>
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Résultat */}
                          {matchDetailTab === 'stats' && (
                          <div style={{ ...styles.panelCard, marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>Résultat du match</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#5b6472', marginBottom: 4 }}>{getTeamName(selectedMatch.team_id)}</div>
                                <input type="number" min={0}
                                  value={matchResults[selectedMatch.id]?.score_home || ''}
                                  onChange={(e) => setMatchResults((prev) => ({ ...prev, [selectedMatch.id]: { ...prev[selectedMatch.id], score_home: e.target.value } }))}
                                  style={{ ...styles.input, width: 80, textAlign: 'center', fontSize: 28, fontWeight: 800, padding: '8px', minHeight: 'auto' }}
                                  placeholder="0" />
                              </div>
                              <div style={{ fontSize: 28, fontWeight: 800, color: '#374151', alignSelf: 'flex-end', paddingBottom: 8 }}>–</div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#5b6472', marginBottom: 4 }}>{selectedMatch.opponent || 'Adversaire'}</div>
                                <input type="number" min={0}
                                  value={matchResults[selectedMatch.id]?.score_away || ''}
                                  onChange={(e) => setMatchResults((prev) => ({ ...prev, [selectedMatch.id]: { ...prev[selectedMatch.id], score_away: e.target.value } }))}
                                  style={{ ...styles.input, width: 80, textAlign: 'center', fontSize: 28, fontWeight: 800, padding: '8px', minHeight: 'auto' }}
                                  placeholder="0" />
                              </div>
                              <button onClick={() => saveMatchResult(selectedMatch.id)}
                                style={{ ...styles.primaryButton, alignSelf: 'flex-end', opacity: savingMatchResult ? 0.7 : 1 }}
                                disabled={savingMatchResult}>
                                {savingMatchResult ? 'Enregistrement...' : 'Enregistrer le score'}
                              </button>
                            </div>
                          </div>
                          )}

                          {matchDetailTab === 'presence' && renderMatchPresenceOverview(selectedMatch)}

                          {/* Convocation */}
                          {matchDetailTab === 'convocation' && (
                          <div style={{ ...styles.panelCard, marginBottom: 20, background: '#f0f7ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                              <h4 style={{ margin: 0 }}>📣 Convocation</h4>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ ...styles.statusBadge, ...styles.badgeGreen }}>
                                  {squadForSelectedMatch.length} joueur{squadForSelectedMatch.length !== 1 ? 's' : ''} convoqué{squadForSelectedMatch.length !== 1 ? 's' : ''}
                                </span>
                                {isSquadDefined(selectedMatch.id) && squadForSelectedMatch.length > 0 && (
                                  <button onClick={() => sendAllConvocations(selectedMatch.id)} disabled={sendingConvocations}
                                    style={{ padding: '8px 14px', borderRadius: 12, border: 'none', background: sendingConvocations ? '#9ca3af' : '#0A5FB5', color: 'white', fontWeight: 700, fontSize: 13, cursor: sendingConvocations ? 'default' : 'pointer' }}>
                                    {sendingConvocations ? '⏳ Envoi...' : '📧 Envoyer les convocations'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gap: 8 }}>
                              {playersForSelectedMatch.length === 0
                                ? <div style={styles.emptyState}>Aucun joueur dans cette équipe.</div>
                                : playersForSelectedMatch.map((player) => {
                                  const inSquad = squadForSelectedMatch.includes(player.id);
                                  return (
                                    <div key={player.id} style={{ ...styles.playerAttendanceRow, background: inSquad ? '#e8f7ee' : '#fff5f5', border: inSquad ? '1px solid #86efac' : '1px solid #fca5a5' }}>
                                      <strong style={{ color: inSquad ? '#166534' : '#64748b' }}>{getPlayerName(player)}</strong>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => { if (!inSquad) togglePlayerInSquad(selectedMatch.id, player.id); else setSquadInitialized((p) => ({ ...p, [selectedMatch.id]: true })); }}
                                          style={{ ...styles.statusButton, minWidth: 70, padding: '8px 14px', background: inSquad ? '#16a34a' : '#f3f4f6', color: inSquad ? 'white' : '#6b7280', border: inSquad ? 'none' : '1px solid #d1d5db', fontWeight: 800 }}>Oui</button>
                                        <button onClick={() => { setSquadInitialized((p) => ({ ...p, [selectedMatch.id]: true })); if (inSquad) togglePlayerInSquad(selectedMatch.id, player.id); }}
                                          style={{ ...styles.statusButton, minWidth: 70, padding: '8px 14px', background: !inSquad && isSquadDefined(selectedMatch.id) ? '#dc2626' : '#f3f4f6', color: !inSquad && isSquadDefined(selectedMatch.id) ? 'white' : '#6b7280', border: !inSquad && isSquadDefined(selectedMatch.id) ? 'none' : '1px solid #d1d5db', fontWeight: 800 }}>Non</button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>

                            {/* ── Convocation cross-catégorie (occasionnel) ── */}
                            {(() => {
                              const matchTeamId = selectedMatch.team_id;
                              // Helper: extract numeric age from category/name
                              function getCategoryAge(teamId: string): number {
                                const t = teams.find((x) => x.id === teamId);
                                const h = ((t?.category || '') + ' ' + (t?.name || '')).toLowerCase();
                                const m = h.match(/u(\d+)/);
                                if (m) return parseInt(m[1], 10);
                                if (h.includes('senior')) return 99;
                                if (h.includes('loisir')) return 100;
                                return 50;
                              }
                              const matchAge = getCategoryAge(matchTeamId);
                              // Joueurs d'autres équipes déjà dans la convocation
                              const guestIds = squadForSelectedMatch.filter((id) => !playersForSelectedMatch.some((p) => p.id === id));
                              // Toutes les équipes sauf celle du match, triées par proximité d'âge inférieur
                              const otherTeams = teams
                                .filter((t) => t.id !== matchTeamId)
                                .sort((a, b) => {
                                  const ageA = getCategoryAge(a.id);
                                  const ageB = getCategoryAge(b.id);
                                  const diffA = matchAge - ageA;
                                  const diffB = matchAge - ageB;
                                  if (diffA > 0 && diffB <= 0) return -1;
                                  if (diffB > 0 && diffA <= 0) return 1;
                                  return Math.abs(diffA) - Math.abs(diffB);
                                });
                              if (otherTeams.length === 0 && guestIds.length === 0) return null;

                              // Équipe sélectionnée dans le dropdown (auto: première catégorie inférieure)
                              const defaultTeam = otherTeams.find((t) => getCategoryAge(t.id) < matchAge) || otherTeams[0];
                              const activeTeamId = crossCategoryTeamId && otherTeams.some((t) => t.id === crossCategoryTeamId)
                                ? crossCategoryTeamId
                                : (defaultTeam?.id || '');
                              const activeTeamPlayers = players
                                .filter((p) => p.team_id === activeTeamId && !squadForSelectedMatch.includes(p.id))
                                .sort((a, b) => a.last_name.localeCompare(b.last_name));

                              return (
                                <div style={{ marginTop: 14, padding: '14px 16px', background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 14 }}>
                                  <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: 14, marginBottom: 12 }}>
                                    🔄 Inviter un joueur d'une autre catégorie
                                  </div>

                                  {/* Joueurs déjà invités */}
                                  {guestIds.length > 0 && (
                                    <div style={{ marginBottom: 12 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Déjà invités :</div>
                                      <div style={{ display: 'grid', gap: 6 }}>
                                        {guestIds.map((gid) => {
                                          const gp = players.find((p) => p.id === gid);
                                          if (!gp) return null;
                                          const gTeam = teams.find((t) => t.id === gp.team_id);
                                          return (
                                            <div key={gid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f3e8ff', borderRadius: 10, border: '1px solid #c4b5fd' }}>
                                              <div>
                                                <span style={{ fontWeight: 700, color: '#5b21b6' }}>{getPlayerName(gp)}</span>
                                                <span style={{ fontSize: 12, color: '#7c3aed', marginLeft: 8, background: '#ede9fe', padding: '2px 6px', borderRadius: 6 }}>{gTeam?.name || 'Équipe'}</span>
                                              </div>
                                              <button onClick={() => togglePlayerInSquad(selectedMatch.id, gid)}
                                                style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                                Retirer
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Dropdown sélection de catégorie */}
                                  {otherTeams.length > 0 && (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                                        <label style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6', flexShrink: 0 }}>Catégorie :</label>
                                        <select
                                          value={activeTeamId}
                                          onChange={(e) => setCrossCategoryTeamId(e.target.value)}
                                          style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #c4b5fd', fontSize: 13, fontWeight: 700, color: '#5b21b6', background: 'white', outline: 'none', cursor: 'pointer' }}>
                                          {otherTeams.map((t) => {
                                            const age = getCategoryAge(t.id);
                                            const label = age < matchAge ? `⬇ ${t.name}` : age > matchAge ? `⬆ ${t.name}` : t.name;
                                            return <option key={t.id} value={t.id}>{label}</option>;
                                          })}
                                        </select>
                                      </div>

                                      {activeTeamPlayers.length === 0 ? (
                                        <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>
                                          {squadForSelectedMatch.some((id) => players.find((p) => p.id === id)?.team_id === activeTeamId)
                                            ? 'Tous les joueurs de cette catégorie sont déjà invités.'
                                            : 'Aucun joueur dans cette catégorie.'}
                                        </div>
                                      ) : (
                                        <div style={{ display: 'grid', gap: 5 }}>
                                          {activeTeamPlayers.map((p) => (
                                            <button key={p.id}
                                              onClick={() => { togglePlayerInSquad(selectedMatch.id, p.id); setSquadInitialized((prev) => ({ ...prev, [selectedMatch.id]: true })); }}
                                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'white', border: '1.5px solid #e9d5ff', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#374151', transition: 'background 0.1s' }}>
                                              <span>{getPlayerName(p)}</span>
                                              <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 800, background: '#f3e8ff', padding: '3px 10px', borderRadius: 20 }}>+ Inviter</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          )}

                          {/* Présences & stats */}
                          {playersForSelectedMatch.length > 0 && (
                            <>
                              {matchDetailTab === 'presence' && (
                                <>
                              <div style={styles.attendanceRow}>
                                {(() => {
                                  const counts = getMatchCounts(selectedMatch.id, selectedMatch.team_id || '');
                                  return (<><span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span><span>Convoqués : {squadForSelectedMatch.length}</span></>);
                                })()}
                              </div>
                              {!isSquadDefined(selectedMatch.id) && (
                                <div style={{ ...styles.panelCard, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 12 }}>
                                  <p style={{ margin: 0, color: '#92400e', fontSize: 13 }}>Définis d'abord la convocation ci-dessus.</p>
                                </div>
                              )}

                              <div style={{ display: 'grid', gap: 8, marginTop: 16, marginBottom: 20 }}>
                                {(() => {
                                  // All squad players including guests
                                  const allSquadPlayersFull = squadForSelectedMatch
                                    .map((id) => players.find((p) => p.id === id))
                                    .filter(Boolean) as Player[];
                                  // Own team first, then guests
                                  const ownPlayers = allSquadPlayersFull.filter((p) => p.team_id === selectedMatch.team_id);
                                  const guestPlayers = allSquadPlayersFull.filter((p) => p.team_id !== selectedMatch.team_id);
                                  const displayPlayers = isSquadDefined(selectedMatch.id)
                                    ? [...ownPlayers, ...guestPlayers]
                                    : playersForSelectedMatch;
                                  return displayPlayers.map((player) => {
                                    const inSquad = !isSquadDefined(selectedMatch.id) || squadForSelectedMatch.includes(player.id);
                                    const status = getMatchAttendanceStatus(selectedMatch.id, player.id);
                                    const isGuest = player.team_id !== selectedMatch.team_id;
                                    const guestTeam = isGuest ? teams.find((t) => t.id === player.team_id) : null;
                                    return (
                                      <div key={player.id} style={{ ...styles.playerAttendanceRow, background: inSquad ? (isGuest ? '#fdf4ff' : '#f8fbff') : '#f9fafb', border: inSquad ? `1px solid ${isGuest ? '#e9d5ff' : '#d8e5f2'}` : '1px dashed #e2e8f0' }}>
                                        <div>
                                          <strong>{getPlayerName(player)}</strong>
                                          {isGuest && guestTeam && <span style={{ marginLeft: 8, fontSize: 12, color: '#7c3aed', fontWeight: 700, background: '#f3e8ff', padding: '2px 8px', borderRadius: 999 }}>🔄 {guestTeam.name}</span>}
                                        </div>
                                        {inSquad
                                          ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button onClick={() => saveMatchAttendance(selectedMatch.id, player.id, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#16a34a' : '#e8f7ee', color: status === 'present' ? 'white' : '#166534' }}>Présent</button>
                                            <button onClick={() => saveMatchAttendance(selectedMatch.id, player.id, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>Absent</button>
                                            <button onClick={() => saveMatchAttendance(selectedMatch.id, player.id, 'unknown' as any)} style={{ ...styles.statusButton, background: status === 'unknown' ? '#64748b' : '#eef2f7', color: status === 'unknown' ? 'white' : '#526071' }}>Sans réponse</button>
                                          </div>
                                          : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 14px', background: '#f1f5f9', borderRadius: 12 }}>
                                            <span style={{ fontSize: 22 }}>😴</span>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Repos</span>
                                          </div>}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                                </>
                              )}

                              {matchDetailTab === 'stats' && isSquadDefined(selectedMatch.id) && squadForSelectedMatch.length > 0 && (
                                <div style={{ ...styles.panelCard, background: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                                  <h4 style={{ margin: '0 0 14px 0', color: '#1e40af' }}>📊 Stats du match — tableau groupé</h4>
                                  {(() => {
                                    // Include all squad players — including guests from other categories
                                    const allSquadPlayers = squadForSelectedMatch
                                      .map((id) => players.find((p) => p.id === id))
                                      .filter(Boolean)
                                      .map((p) => {
                                        const isGuest = p!.team_id !== selectedMatch.team_id;
                                        const guestTeam = isGuest ? teams.find((t) => t.id === p!.team_id) : null;
                                        return {
                                          id: p!.id,
                                          name: getPlayerName(p!) + (isGuest && guestTeam ? ` (${guestTeam.name})` : ''),
                                        };
                                      });
                                    return (
                                      <MatchStatsTable
                                        players={allSquadPlayers}
                                        initialStats={Object.fromEntries(
                                          matchPlayerStats
                                            .filter((s) => s.match_id === selectedMatch.id)
                                            .map((s) => [s.player_id, { goals: s.goals, assists: (s as any).assists || 0, shots: s.shots, saves: s.saves, penalty_scored: s.penalty_scored, two_minutes: s.two_minutes }])
                                        )}
                                        onSaveAll={(rows) => saveAllMatchStats(selectedMatch.id, rows)}
                                        isCoach={true}
                                      />
                                    );
                                  })()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* ── STATS ── */}
            {coachTab === 'stats' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>Stats joueurs</h2>
                <p style={styles.blockSubtitle}>{"Classement par buts – présences entraînements et matchs."}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
                  <div style={styles.filterBar}>
                    <label style={styles.inputLabel}>Équipe</label>
                    <select value={selectedCoachTeamId} onChange={(e) => setSelectedCoachTeamId(e.target.value)} style={styles.select}>
                      {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={{ minWidth: 200 }}>
                    <label style={styles.inputLabel}>🗓 Saison</label>
                    <select value={selectedSeasonId} onChange={(e) => setSelectedSeasonId(e.target.value)} style={styles.select}>
                      <option value="">Toutes les saisons</option>
                      {seasons.filter((s) => s.team_id === selectedCoachTeamId || !s.team_id).map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.start_date} → {s.end_date})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => resetTrainingAttendance(selectedCoachTeamId)}
                    disabled={resetingTraining || !selectedCoachTeamId}
                    style={{ ...styles.smallButton, background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 12, border: '1px solid #fca5a5' }}>
                    {resetingTraining ? 'Réinitialisation...' : '🔄 Reset présences entraînements'}
                  </button>
                </div>
                {coachTeamPlayers.length === 0
                  ? <div style={styles.emptyState}>{"Aucun joueur dans cette équipe."}</div>
                  : (() => {
                    const totalTrainings = getTrainingTotalCount(selectedCoachTeamId, selectedSeasonId);
                    const totalMatches = getMatchTotalCount(selectedCoachTeamId, selectedSeasonId);
                    const sorted = [...coachTeamPlayers].sort((a, b) => {
                      const gA = getMatchPlayerStatsForSeason(a.id, selectedSeasonId).reduce((s, r) => s + (r.goals || 0), 0);
                      const gB = getMatchPlayerStatsForSeason(b.id, selectedSeasonId).reduce((s, r) => s + (r.goals || 0), 0);
                      return gB - gA;
                    });
                    const seasonLabel = selectedSeasonId ? seasons.find(s => s.id === selectedSeasonId)?.name : '';

                    // Stats globales équipe
                    const allTeamStats = coachTeamPlayers.flatMap((p) => getMatchPlayerStatsForSeason(p.id, selectedSeasonId));
                    const teamTotalGoals = allTeamStats.reduce((s, r) => s + (r.goals || 0), 0);
                    const teamTotalShots = allTeamStats.reduce((s, r) => s + (r.shots || 0), 0);
                    const teamTotalSaves = allTeamStats.reduce((s, r) => s + (r.saves || 0), 0);
                    const teamTotalAssists = allTeamStats.reduce((s, r) => s + (r.assists || 0), 0);
                    const teamShootPct = teamTotalShots > 0 ? Math.round((teamTotalGoals / teamTotalShots) * 100) : 0;
                    const teamMatchesPlayed = [...new Set(allTeamStats.map((s) => s.match_id))].length;
                    const avgGoalsPerMatch = teamMatchesPlayed > 0 ? (teamTotalGoals / teamMatchesPlayed).toFixed(1) : '-';

                    return (
                      <div style={{ overflowX: 'auto' }}>
                        {selectedSeasonId && <div style={{ marginBottom: 12, padding: '8px 14px', background: '#eaf4ff', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0A5FB5', display: 'inline-block' }}>📅 Saison : {seasonLabel}</div>}

                        {/* Résumé global équipe */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontWeight: 800, color: '#0f2743', fontSize: 15, marginBottom: 12 }}>📊 Résumé de l'équipe</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 8 }}>
                            {[
                              { label: '⚽ Buts totaux', value: teamTotalGoals, bg: '#dbeafe', color: '#1e40af' },
                              { label: '🎯 Tirs totaux', value: teamTotalShots, bg: '#ede9fe', color: '#5b21b6' },
                              { label: '🥅 % Réussite tir', value: teamTotalShots > 0 ? `${teamShootPct}%` : '-', bg: teamShootPct >= 50 ? '#d1fae5' : '#fef3c7', color: teamShootPct >= 50 ? '#065f46' : '#92400e' },
                              { label: '🧤 Arrêts gardien', value: teamTotalSaves, bg: '#d1fae5', color: '#065f46' },
                              { label: '🤝 Passes déc.', value: teamTotalAssists, bg: '#fef3c7', color: '#92400e' },
                              { label: '📈 Buts/match', value: avgGoalsPerMatch, bg: '#f0fdf4', color: '#15803d' },
                            ].map((stat) => (
                              <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: '14px 12px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                                <div style={{ fontSize: 11, color: stat.color, fontWeight: 700, opacity: 0.85, lineHeight: 1.3 }}>{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <table style={styles.statsTable}>
                          <thead>
                            <tr style={{ background: '#0A5FB5', color: 'white' }}>
                              <th style={{ ...styles.th, width: 32, textAlign: 'center' }}>#</th>
                              <th style={styles.th}>Joueur</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Buts</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Tirs</th>
                              <th style={{ ...styles.th, textAlign: 'center', background: '#7c3aed' }}>% Tir</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Arrêts</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Entraînements</th>
                              <th style={{ ...styles.th, textAlign: 'center' }}>Matchs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sorted.map((player, idx) => {
                              const ss = getMatchPlayerStatsForSeason(player.id, selectedSeasonId);
                              const goals = ss.reduce((s, r) => s + (r.goals || 0), 0);
                              const shots = ss.reduce((s, r) => s + (r.shots || 0), 0);
                              const saves = ss.reduce((s, r) => s + (r.saves || 0), 0);
                              const pct = shots > 0 ? Math.round((goals / shots) * 100) : 0;
                              return (
                                <tr key={player.id} style={{ background: idx % 2 === 0 ? 'white' : '#f5f8fd' }}>
                                  <td style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', fontWeight: 700 }}>{idx + 1}</td>
                                  <td style={{ ...styles.td, fontWeight: 700 }}>{getPlayerName(player)}</td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: '#dbeafe', color: '#1e40af' }}>{goals}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: '#ede9fe', color: '#5b21b6' }}>{shots}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: pct >= 50 ? '#d1fae5' : pct > 0 ? '#fef3c7' : '#f1f5f9', color: pct >= 50 ? '#065f46' : pct > 0 ? '#92400e' : '#94a3b8', fontWeight: 800 }}>{shots > 0 ? `${pct}%` : '-'}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: '#d1fae5', color: '#065f46' }}>{saves}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#0A5FB5' }}>{getTrainingPresentCount(player.id, selectedSeasonId)} / {totalTrainings}</td>
                                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#0A5FB5' }}>{getMatchPresentCount(player.id, selectedSeasonId)} / {totalMatches}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* ── COMPOSITION ── */}
            {coachTab === 'composition' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>🏐 Composition du match</h2>
                <p style={styles.blockSubtitle}>Placez vos joueurs sur le terrain. La composition est sauvegardée par match.</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 }}>
                  <div style={styles.filterBar}>
                    <label style={styles.inputLabel}>Équipe</label>
                    <select value={selectedCoachTeamId} onChange={(e) => setSelectedCoachTeamId(e.target.value)} style={styles.select}>
                      {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <label style={styles.inputLabel}>Match</label>
                    <select value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)} style={styles.select}>
                      <option value="">Choisir un match</option>
                      {coachMatches.map((m) => (
                        <option key={m.id} value={m.id}>
                          {getTeamName(m.team_id)} vs {m.opponent || '-'} – {formatDate(m.match_date)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!selectedMatchId || !selectedCoachTeamId ? (
                  <div style={styles.emptyState}>Sélectionnez une équipe et un match pour définir la composition.</div>
                ) : (
                  <MatchComposition
                    matchId={selectedMatchId}
                    teamId={selectedCoachTeamId}
                    players={coachTeamPlayers}
                    squadIds={matchSquad[selectedMatchId] || []}
                    isCoach={true}
                  />
                )}
              </div>
            )}

            {/* ── JOUEURS ── */}
            {coachTab === 'players' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>Gestion des joueurs</h2>
                <p style={styles.blockSubtitle}>{"Modifier, supprimer un joueur et gérer les liens parent / enfant."}</p>

                <div style={styles.panelCard}>
                  <h3 style={styles.panelTitle}>{editingPlayerId ? 'Modifier un joueur' : 'Modifier un joueur'}</h3>
                  {editingPlayerId ? (
                    <>
                      <div style={styles.formGrid}>
                        <div><label style={styles.inputLabel}>{"Prénom"}</label><input value={playerFormFirstName} onChange={(e) => setPlayerFormFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                        <div><label style={styles.inputLabel}>Nom</label><input value={playerFormLastName} onChange={(e) => setPlayerFormLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                        <div>
                          <label style={styles.inputLabel}>{"Équipe"}</label>
                          <select value={playerFormTeamId} onChange={(e) => setPlayerFormTeamId(e.target.value)} style={styles.select}>
                            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div><label style={styles.inputLabel}>Date de naissance</label><input type="date" value={playerFormBirthDate} onChange={(e) => setPlayerFormBirthDate(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>N° de maillot</label><input type="number" min={1} max={99} value={playerFormJerseyNumber} onChange={(e) => setPlayerFormJerseyNumber(e.target.value)} style={styles.input} placeholder="Ex : 7" /></div>
                        <div>
                          <label style={styles.inputLabel}>Garçon / fille</label>
                          <select value={playerFormGender} onChange={(e) => setPlayerFormGender(e.target.value as 'male' | 'female' | '')} style={styles.select}>
                            <option value="">— Non défini —</option>
                            <option value="male">Garçon</option>
                            <option value="female">Fille</option>
                          </select>
                        </div>
                        <div>
                          <label style={styles.inputLabel}>Poste</label>
                          <select value={playerFormPosition} onChange={(e) => setPlayerFormPosition(e.target.value)} style={styles.select}>
                            <option value="">— Non défini —</option>
                            {POSITIONS.map((pos) => (
                              <option key={pos.code} value={pos.code}>{pos.code} — {pos.full}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button onClick={savePlayer} style={styles.primaryButton} disabled={savingPlayer}>{savingPlayer ? 'Enregistrement...' : 'Enregistrer'}</button>
                        <button onClick={resetPlayerForm} style={styles.secondaryOutlineButton}>Annuler</button>
                      </div>
                    </>
                  ) : (
                    <p style={styles.emptyText}>{"Clique sur Modifier pour éditer un joueur."}</p>
                  )}
                </div>

                <div style={{ ...styles.panelCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>{"Lier un enfant à un parent"}</h3>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>Parent / compte joueur</label>
                      <select value={selectedLinkParentId} onChange={(e) => setSelectedLinkParentId(e.target.value)} style={styles.select}>
                        {parentUsers.map((p) => <option key={p.id} value={p.id}>{getUserName(p)} {p.role === 'player' ? '· joueur' : '· parent'} {p.email ? `(${p.email})` : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Enfant / joueur</label>
                      <select value={selectedLinkPlayerId} onChange={(e) => setSelectedLinkPlayerId(e.target.value)} style={styles.select}>
                        {visiblePlayers.map((p) => <option key={p.id} value={p.id}>{getPlayerName(p)} – {getTeamName(p.team_id)}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={linkPlayerToParent} style={styles.primaryButton} disabled={linkingPlayer}>{linkingPlayer ? 'Liaison...' : 'Lier'}</button>
                </div>

                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                  <div style={{ ...styles.panelCard, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#f8fbff', border: '1px solid #d8e5f2' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <label style={styles.inputLabel}>Rechercher un joueur</label>
                      <input
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        style={styles.input}
                        placeholder="Nom, prénom, équipe, numéro..."
                      />
                    </div>
                    {playerSearch.trim() && (
                      <button onClick={() => setPlayerSearch('')} style={{ ...styles.secondaryOutlineButton, marginTop: 22 }}>Effacer</button>
                    )}
                  </div>
                  {(() => {
                    const query = playerSearch.trim().toLowerCase();
                    const filteredPlayers = !query ? visiblePlayers : visiblePlayers.filter((player) => {
                      const haystack = [
                        getPlayerName(player),
                        player.first_name,
                        player.last_name,
                        getTeamName(player.team_id),
                        getTeamCategory(player.team_id),
                        player.jersey_number != null ? String(player.jersey_number) : '',
                      ].join(' ').toLowerCase();
                      return haystack.includes(query);
                    });
                    if (visiblePlayers.length === 0) return <div style={styles.emptyState}>Aucun joueur.</div>;
                    if (filteredPlayers.length === 0) return <div style={styles.emptyState}>Aucun joueur trouvé pour “{playerSearch}”.</div>;
                    return filteredPlayers.map((player) => {
                      const linkedParents = getLinkedParentsForPlayer(player.id);
                      return (
                        <div key={player.id} style={styles.teamCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ margin: 0 }}>{getPlayerName(player)}</h3>
                              <p style={{ margin: '8px 0 0 0', color: '#5b6472' }}>Équipe : {getTeamName(player.team_id)}</p>
                              <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>Comptes liés : {linkedParents.length > 0 ? linkedParents.map((p) => `${getUserName(p)}${p.role === 'player' ? ' (joueur)' : ''}`).join(', ') : 'Aucun compte lié'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button onClick={() => startEditPlayer(player)} style={styles.secondaryButton}>Modifier</button>
                              <button onClick={() => deletePlayer(player)} style={{ ...styles.smallButton, background: '#fee2e2', color: '#991b1b' }}>Supprimer</button>
                            </div>
                          </div>
                          {linkedParents.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={styles.miniTitle}>Comptes liés</div>
                              <div style={{ display: 'grid', gap: 8 }}>
                                {linkedParents.map((parent) => {
                                  const link = parentLinks.find((l) => l.parent_id === parent.id && l.player_id === player.id);
                                  return (
                                    <div key={parent.id} style={styles.linkRow}>
                                      <span>{getUserName(parent)}{parent.email ? ` – ${parent.email}` : ''}</span>
                                      {link && <button onClick={() => removeParentLink(link.id)} style={styles.linkRemoveButton}>Retirer le lien</button>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* ── UTILISATEURS ── */}
            {coachTab === 'users' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>Gestion des utilisateurs</h2>
                <p style={styles.blockSubtitle}>Gestion des parents, enfants et codes de connexion.</p>

                <div style={styles.formCard}>
                  <h3 style={styles.panelTitle}>Modifier un parent</h3>
                  <div style={styles.formGrid}>
                    <div>
                        <label style={styles.inputLabel}>Parent / compte joueur</label>
                        <select value={selectedManagedParentId} onChange={(e) => setSelectedManagedParentId(e.target.value)} style={styles.select}>
                          {parentUsers.length === 0
                          ? <option value="">Aucun compte</option>
                          : parentUsers.map((p) => <option key={p.id} value={p.id}>{getUserName(p)} · {p.role === 'player' ? 'joueur' : 'parent'}{p.email ? ` – ${p.email}` : ''}</option>)}
                      </select>
                    </div>
                    <div><label style={styles.inputLabel}>{"Prénom"}</label><input value={managedParentFirstName} onChange={(e) => setManagedParentFirstName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Nom</label><input value={managedParentLastName} onChange={(e) => setManagedParentLastName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Email</label><input value={managedParentEmail} onChange={(e) => setManagedParentEmail(e.target.value)} style={styles.input} type="email" /></div>
                    <div>
                      <label style={styles.inputLabel}>Code PIN (obsolète — non utilisé)</label>
                      <input value={managedParentPin} onChange={(e) => setManagedParentPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={styles.input} placeholder="4 chiffres" inputMode="numeric" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={saveManagedParent} style={styles.primaryButton} disabled={savingManagedParent}>{savingManagedParent ? 'Enregistrement...' : 'Enregistrer'}</button>
                    <button onClick={() => setManagedParentPin(generateFourDigitPin())} style={styles.secondaryOutlineButton}>{"Générer nouveau code"}</button>
                    {isAdmin && selectedManagedParentId && (() => {
                      const par = users.find(u => u.id === selectedManagedParentId);
                      const isActive = (par as any)?.is_active !== false;
                      return (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => toggleParentAccess(selectedManagedParentId, isActive)}
                            style={{ ...styles.smallButton, background: isActive ? '#fef9c3' : '#dcfce7', color: isActive ? '#854d0e' : '#166534' }}>
                            {isActive ? "🔒 Désactiver l'accès" : "🔓 Réactiver l'accès"}
                          </button>
                          <button onClick={() => deleteParentAndAuth(selectedManagedParentId)}
                            style={{ ...styles.smallButton, background: '#fee2e2', color: '#991b1b' }}>🗑 Supprimer</button>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={styles.warningBox}>{"Les parents et joueurs se connectent avec leur email et mot de passe. Le code PIN n'est plus utilisé."}</div>
                </div>

                <div style={{ ...styles.panelCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>Enfants / joueurs</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {visiblePlayers.length === 0
                      ? <div style={styles.emptyState}>Aucun joueur.</div>
                      : visiblePlayers.map((player) => {
                        const linkedParents = getLinkedParentsForPlayer(player.id);
                        return (
                          <div key={player.id} style={styles.teamCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                              <div>
                                <h3 style={{ margin: 0 }}>{getPlayerName(player)}</h3>
                                <p style={{ margin: '8px 0 0 0', color: '#5b6472' }}>Équipe : {getTeamName(player.team_id)} – Catégorie : {getTeamCategory(player.team_id)}</p>
                                <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>Comptes liés : {linkedParents.length > 0 ? linkedParents.map((p) => `${getUserName(p)}${p.role === 'player' ? ' (joueur)' : ''}`).join(', ') : 'Aucun compte lié'}</p>
                              </div>
                              <button onClick={() => { setCoachTab('players'); startEditPlayer(player); }} style={styles.secondaryButton}>Modifier</button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ── MESSAGES ── */}
            {coachTab === 'messages' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>💬 Messages</h2>
                <p style={styles.blockSubtitle}>Conversations avec les parents. Cliquez sur une conversation pour l'ouvrir.</p>

                {/* Modale lecture/réponse */}
                {selectedConvId && (() => {
                  const conv = conversations.find((c) => c.id === selectedConvId);
                  const par = conv?.parent_id ? users.find((u) => u.id === conv.parent_id) : null;
                  const tm = conv ? teams.find((t) => t.id === conv.team_id) : null;
                  const myId = coachAccessList.find((ca) => isAdmin || allowedTeamIds.includes(ca.team_id))?.id || '';
                  const convTitle = conv?.is_group ? (conv.title || tm?.name || '') : (par ? par.first_name + ' ' + par.last_name : 'Parent');
                  return (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,44,93,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        {/* Header modale */}
                        <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18 }}>
                              {par?.first_name?.[0]?.toUpperCase() || (conv?.is_group ? '👥' : '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: 'white', fontSize: 15 }}>{convTitle}</div>
                              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{tm?.name || ''}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button onClick={() => deleteConversation(selectedConvId!)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }} title="Supprimer la conversation">🗑</button>
                            <button onClick={() => setSelectedConvId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontWeight: 800, fontSize: 20, cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          </div>
                        </div>
                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, background: '#fafcff' }}>
                          {messages.length === 0
                            ? <div style={{ textAlign: 'center', color: '#5b6472', marginTop: 60, fontSize: 14 }}>Aucun message dans cette conversation.</div>
                            : messages.map((msg) => {
                              const mine = msg.sender_type === 'coach';
                              const who = mine
                                ? (() => { const ca = coachAccessList.find((x) => x.id === msg.sender_id); return ca ? ca.first_name + ' ' + ca.last_name : 'Coach'; })()
                                : (() => { const u = users.find((x) => x.id === msg.sender_id); return u ? u.first_name + ' ' + u.last_name : 'Parent'; })();
                              const time = new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                              return (
                                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, fontWeight: 600 }}>{who} · {time}</div>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: mine ? 'row' : 'row-reverse' }}>
                                    <button onClick={() => { if (window.confirm('Supprimer ce message ?')) deleteMessage(msg.id); }}
                                      style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '2px 4px', color: '#991b1b', flexShrink: 0, lineHeight: 1 }}
                                      title="Supprimer ce message">🗑</button>
                                    <div style={{ maxWidth: '78%', padding: '10px 15px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: mine ? '#0A5FB5' : '#edf2f7', color: mine ? 'white' : '#10233b', fontSize: 15, lineHeight: 1.5, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const }}>
                                      {msg.content}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {/* Zone réponse */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid #d8e5f2', display: 'flex', gap: 10, alignItems: 'flex-end', background: 'white' }}>
                          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(selectedConvId, 'coach', myId); } }}
                            placeholder="Votre réponse..." rows={2}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 16, border: '1px solid #cfd8e3', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Arial, sans-serif', lineHeight: 1.4 }} />
                          <button onClick={() => sendMessage(selectedConvId, 'coach', myId)} disabled={sendingMessage || !newMessage.trim()}
                            style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: newMessage.trim() ? '#0A5FB5' : '#ccd8e8', color: 'white', fontSize: 22, cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Formulaire nouvelle conv */}
                <div style={{ marginBottom: 16 }}>
                  <button onClick={() => setShowNewConvForm((p) => !p)} style={{ ...styles.secondaryButton, marginBottom: showNewConvForm ? 12 : 0 }}>
                    {showNewConvForm ? '✕ Annuler' : '+ Nouvelle conversation'}
                  </button>
                  {showNewConvForm && (
                    <div style={{ ...styles.panelCard, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setNewConvIsGroup(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: !newConvIsGroup ? '#0A5FB5' : '#e5eef8', color: !newConvIsGroup ? 'white' : '#12304f', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>Privé</button>
                        <button onClick={() => setNewConvIsGroup(true)} style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: newConvIsGroup ? '#0A5FB5' : '#e5eef8', color: newConvIsGroup ? 'white' : '#12304f', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>Groupe</button>
                      </div>
                      <select value={newConvTeamId} onChange={(e) => setNewConvTeamId(e.target.value)} style={{ ...styles.select, minHeight: 44, fontSize: 13 }}>
                        <option value="">-- Équipe --</option>
                        {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      {!newConvIsGroup && (
                        <select value={newConvParentId} onChange={(e) => setNewConvParentId(e.target.value)} style={{ ...styles.select, minHeight: 44, fontSize: 13 }}>
                          <option value="">-- Parent --</option>
                          {parentUsers.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                        </select>
                      )}
                      <button onClick={() => {
                        if (!newConvTeamId) { alert('Choisir une équipe'); return; }
                        if (!newConvIsGroup && !newConvParentId) { alert('Choisir un parent'); return; }
                        const t = teams.find((x) => x.id === newConvTeamId);
                        createConversation(newConvTeamId, newConvIsGroup ? null : newConvParentId, newConvIsGroup, newConvIsGroup ? ('👥 ' + (t?.name || '')) : null);
                      }} style={styles.primaryButton}>Créer</button>
                    </div>
                  )}
                </div>

                {/* Liste des conversations */}
                {conversations.length === 0
                  ? <div style={styles.emptyState}>Aucune conversation. Créez-en une avec le bouton ci-dessus.</div>
                  : <div style={{ display: 'grid', gap: 10 }}>
                    {conversations.map((conv) => {
                      const par = conv.parent_id ? users.find((u) => u.id === conv.parent_id) : null;
                      const tm = teams.find((t) => t.id === conv.team_id);
                      const convTitle = conv.is_group ? (conv.title || tm?.name || '') : (par ? par.first_name + ' ' + par.last_name : 'Parent');
                      const lastUpdated = new Date(conv.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                      const lastRead = lastReadConvTimestamps[conv.id];
                      const hasUnread = lastRead && new Date(conv.updated_at) > new Date(lastRead);
                      return (
                        <div key={conv.id} onClick={() => {
                          setSelectedConvId(conv.id);
                          markConversationsRead([conv.id]);
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, border: hasUnread ? '2px solid #0A5FB5' : '1px solid #d8e5f2', background: hasUnread ? '#eaf4ff' : '#f8fbff', cursor: 'pointer', transition: 'box-shadow 0.15s', position: 'relative' }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,95,181,0.12)')}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}>
                          {hasUnread && (
                            <span style={{ position: 'absolute', top: 10, right: 10, background: '#dc2626', borderRadius: '50%', width: 10, height: 10, display: 'block', boxShadow: '0 1px 4px rgba(220,38,38,0.5)' }} />
                          )}
                          <div style={{ position: 'relative', width: 46, height: 46, borderRadius: '50%', background: conv.is_group ? '#fde68a' : '#0A5FB5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: conv.is_group ? 20 : 18, fontWeight: 800, color: conv.is_group ? '#92400e' : 'white', flexShrink: 0 }}>
                            {conv.is_group ? '👥' : (par?.first_name?.[0]?.toUpperCase() || '?')}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: hasUnread ? 900 : 800, fontSize: 15, color: hasUnread ? '#0A5FB5' : '#10233b' }}>{convTitle}</div>
                            <div style={{ fontSize: 12, color: '#5b6472', marginTop: 2 }}>{tm?.name || ''} · {lastUpdated}</div>
                            {hasUnread && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, marginTop: 2 }}>● Nouveau message</div>}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ ...styles.secondaryButton, fontSize: 13, padding: '8px 14px', pointerEvents: 'none', background: hasUnread ? '#0A5FB5' : undefined, color: hasUnread ? 'white' : undefined }}>
                              Ouvrir →
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                              style={{ padding: '8px 10px', borderRadius: 10, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                              title="Supprimer la conversation">🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>}
              </div>
            )}

            {/* ── LICENCES ── */}
            {coachTab === 'licenses' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>🪪 Suivi des licences</h2>
                <p style={styles.blockSubtitle}>
                  {isAdmin
                    ? 'Gérez le statut de licence de tous les joueurs. Validez après réception du paiement.'
                    : 'Statut des licences pour vos équipes.'}
                </p>

                {/* Filtre saison pour licences */}
                <div style={{ marginBottom: 16, maxWidth: 380, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <label style={styles.inputLabel}>🗓 Saison affichée</label>
                    <select value={selectedLicenseSeasonId} onChange={(e) => setSelectedLicenseSeasonId(e.target.value)} style={styles.select}>
                      {seasons.map((s) => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isCurrent = s.start_date <= today && s.end_date >= today;
                        return (
                          <option key={s.id} value={s.id}>{s.name}{isCurrent ? ' ⭐ (en cours)' : ''}</option>
                        );
                      })}
                    </select>
                  </div>
                  {seasons.length > 0 && (() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const cur = seasons.find((s) => s.start_date <= today && s.end_date >= today) || seasons[0];
                    if (cur && selectedLicenseSeasonId !== cur.id) {
                      return (
                        <button onClick={() => setSelectedLicenseSeasonId(cur.id)}
                          style={{ marginTop: 24, padding: '10px 14px', borderRadius: 12, border: '1px solid #0A5FB5', background: 'white', color: '#0A5FB5', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                          ↩ Saison en cours
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Résumé rapide */}
                {(() => {
                  const effectiveSeasonId = selectedLicenseSeasonId || getCurrentSeason()?.id || null;
                  const myPlayers = isAdmin ? players : players.filter((p) => allowedTeamIds.includes(p.team_id));
                  const total = myPlayers.length;
                  const validated = myPlayers.filter((p) => getLicenseStatus(p.id, effectiveSeasonId)?.status === 'validated').length;
                  const paid = myPlayers.filter((p) => getLicenseStatus(p.id, effectiveSeasonId)?.status === 'paid').length;
                  const pending = total - validated - paid;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                      <div style={{ background: '#fee2e2', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#991b1b' }}>{pending}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginTop: 4 }}>⏳ En attente</div>
                      </div>
                      <div style={{ background: '#dbeafe', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#1e40af' }}>{paid}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginTop: 4 }}>💳 Payées</div>
                      </div>
                      <div style={{ background: '#dcfce7', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#166534' }}>{validated}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginTop: 4 }}>✅ Validées</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tableau par équipe */}
                {(() => {
                  const myTeams = isAdmin ? teams : visibleTeams;
                  return myTeams.map((team) => {
                    const teamPlayers = players.filter((p) => p.team_id === team.id);
                    if (teamPlayers.length === 0) return null;
                    return (
                      <div key={team.id} style={{ ...styles.panelCard, marginBottom: 16 }}>
                        <h3 style={{ ...styles.panelTitle, marginBottom: 12 }}>{team.name}</h3>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Joueur</th>
                                <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Statut</th>
                                {isAdmin && <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {[...teamPlayers].sort((a, b) => a.last_name.localeCompare(b.last_name)).map((p) => {
                                const effectiveSeasonId = selectedLicenseSeasonId || getCurrentSeason()?.id || null;
                                const lic = getLicenseStatus(p.id, effectiveSeasonId);
                                const st = lic?.status || 'pending';
                                const badgeStyle: React.CSSProperties = {
                                  display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12,
                                  background: st === 'validated' ? '#dcfce7' : st === 'paid' ? '#dbeafe' : '#fee2e2',
                                  color: st === 'validated' ? '#166534' : st === 'paid' ? '#1e40af' : '#991b1b',
                                };
                                return (
                                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.last_name.toUpperCase()} {p.first_name}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                      <span style={badgeStyle}>
                                        {st === 'validated' ? '✅ Validée' : st === 'paid' ? '💳 Payée' : '⏳ En attente'}
                                      </span>
                                    </td>
                                    {isAdmin && (
                                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                          <button onClick={() => upsertLicenseStatus(p.id, 'pending', effectiveSeasonId || undefined)}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'pending' ? '#dc2626' : '#f3f4f6', color: st === 'pending' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                                            En attente
                                          </button>
                                          <button onClick={() => upsertLicenseStatus(p.id, 'paid', effectiveSeasonId || undefined)}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'paid' ? '#2563eb' : '#f3f4f6', color: st === 'paid' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                                            💳 Payée
                                          </button>
                                          <button onClick={() => upsertLicenseStatus(p.id, 'validated', effectiveSeasonId || undefined)}
                                            style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'validated' ? '#16a34a' : '#f3f4f6', color: st === 'validated' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                                            ✅ Valider
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* ── MON ÉQUIPE ── */}
            {coachTab === 'team' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>👕 Mon équipe</h2>
                <p style={styles.blockSubtitle}>Vue d'ensemble de vos joueurs. Cliquez sur une carte pour la voir en grand.</p>

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.inputLabel}>Équipe</label>
                  <select value={selectedCoachTeamId} onChange={(e) => setSelectedCoachTeamId(e.target.value)} style={{ ...styles.select, maxWidth: 320 }}>
                    {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* ── Toggle visibilité stats pour les parents (coach/admin) ── */}
                {selectedCoachTeamId && (() => {
                  const currentTeam = teams.find((t) => t.id === selectedCoachTeamId);
                  if (!currentTeam) return null;
                  const hidden = currentTeam.stats_hidden_for_parents === true;
                  const toggle = async () => {
                    const newVal = !hidden;
                    const { error } = await supabase.from('teams').update({ stats_hidden_for_parents: newVal }).eq('id', currentTeam.id);
                    if (error) { alert('Erreur lors de la mise à jour : ' + error.message); return; }
                    setTeams((prev) => prev.map((t) => t.id === currentTeam.id ? { ...t, stats_hidden_for_parents: newVal } : t));
                  };
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                      padding: '12px 16px', borderRadius: 14, marginBottom: 20,
                      background: hidden ? '#fef2f2' : '#f0fdf4',
                      border: `1.5px solid ${hidden ? '#fecaca' : '#bbf7d0'}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ fontWeight: 800, color: hidden ? '#991b1b' : '#166534', fontSize: 14 }}>
                          {hidden ? '🔒 Stats masquées pour les parents' : '👁️ Stats visibles pour les parents'}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3, lineHeight: 1.4 }}>
                          {hidden
                            ? "Les parents ne voient PAS les stats individuelles de leur enfant ni des autres. Toi (coach/admin), tu vois tout."
                            : "Les parents voient les stats de LEUR enfant uniquement. Les autres enfants apparaissent sans stats."}
                        </div>
                      </div>
                      <button onClick={toggle}
                        style={{
                          padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: hidden ? '#16a34a' : '#dc2626', color: 'white',
                          fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
                        }}>
                        {hidden ? '👁️ Rendre visible' : '🔒 Masquer'}
                      </button>
                    </div>
                  );
                })()}

                {coachTeamPlayers.length === 0
                  ? <div style={styles.emptyState}>Aucun joueur dans cette équipe.</div>
                  : (
                    <div style={{ overflowX: 'auto', padding: '4px 2px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 22, padding: 4 }}>
                        {(() => {
                          // Coach/admin → forParent=false, donc tout est visible
                          const teamCards = buildFifaCardsForTeam(selectedCoachTeamId, false);
                          return teamCards.map((c, idx) => (
                            <div key={c.player.id} style={{ position: 'relative' }}>
                              <FifaPlayerCard
                                player={c.player}
                                totalTrainingPresences={c.totalTrainingPresences}
                                totalGoals={c.totalGoals}
                                totalShots={c.totalShots}
                                totalMatches={c.totalMatches}
                                isMyChild={false}
                                hideStats={false}
                                age={c.age}
                                clubLogo={CLUB_LOGO}
                                onClick={() => setFullScreenCardData({ cards: teamCards, index: idx })}
                                onJerseyClick={() => startJerseyEdit(c.player)}
                              />
                              {jerseyEditId === c.player.id && (
                                <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: 6, padding: 10, borderRadius: 12, background: 'rgba(255,255,255,0.96)', boxShadow: '0 8px 24px rgba(0,0,0,0.22)', display: 'grid', gap: 8 }}>
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={jerseyEditValue}
                                    onChange={(e) => setJerseyEditValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveJerseyNumber(c.player.id); if (e.key === 'Escape') setJerseyEditId(null); }}
                                    autoFocus
                                    placeholder="N°"
                                    style={{ ...styles.input, minHeight: 34, padding: '6px 10px', textAlign: 'center', fontWeight: 900 }}
                                  />
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => saveJerseyNumber(c.player.id)} style={{ ...styles.secondaryButton, flex: 1, padding: '7px 8px', fontSize: 12, background: '#16a34a' }}>OK</button>
                                    <button onClick={() => setJerseyEditId(null)} style={{ ...styles.linkRemoveButton, flex: 1, padding: '7px 8px', fontSize: 12 }}>Annuler</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                {/* Stats rapides */}
                {coachTeamPlayers.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
                    <div style={{ ...styles.panelCard, flex: 1, minWidth: 120, textAlign: 'center', background: '#eaf4ff' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#0A5FB5' }}>{coachTeamPlayers.length}</div>
                      <div style={{ fontSize: 13, color: '#5b6472', fontWeight: 700 }}>Joueurs</div>
                    </div>
                    <div style={{ ...styles.panelCard, flex: 1, minWidth: 120, textAlign: 'center', background: '#f0fdf4' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#166534' }}>{coachTeamPlayers.filter((p) => p.birth_date).length}</div>
                      <div style={{ fontSize: 13, color: '#5b6472', fontWeight: 700 }}>Âge renseigné</div>
                    </div>
                    {coachTeamPlayers.some((p) => p.birth_date) && (
                      <div style={{ ...styles.panelCard, flex: 1, minWidth: 120, textAlign: 'center', background: '#fefce8' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#854d0e' }}>
                          {Math.round(coachTeamPlayers.filter((p) => p.birth_date).reduce((sum, p) => sum + (getPlayerAge(p.birth_date) || 0), 0) / coachTeamPlayers.filter((p) => p.birth_date).length)}
                        </div>
                        <div style={{ fontSize: 13, color: '#5b6472', fontWeight: 700 }}>Âge moyen</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── MOT DE PASSE COACH ── */}
            {coachTab === 'password' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>🔑 Changer mon mot de passe</h2>
                <p style={styles.blockSubtitle}>Modifiez votre mot de passe de connexion.</p>
                {changePwSuccess ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 16, padding: '20px 24px', textAlign: 'center', maxWidth: 480 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: 16, marginBottom: 8 }}>Mot de passe modifié !</div>
                    <button onClick={() => { setChangePwSuccess(false); setNewPassword(''); setNewPassword2(''); }}
                      style={{ marginTop: 8, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 800, cursor: 'pointer' }}>
                      OK
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
                    <div>
                      <label style={styles.inputLabel}>Nouveau mot de passe (min. 8 caractères)</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••" autoComplete="new-password" style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Confirmer le mot de passe</label>
                      <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                        placeholder="••••••••" autoComplete="new-password" style={styles.input}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} />
                    </div>
                    {changePwError && (
                      <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                        {changePwError}
                      </div>
                    )}
                    <button onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !newPassword2}
                      style={{ ...styles.primaryButton, opacity: changePwLoading || !newPassword || !newPassword2 ? 0.6 : 1 }}>
                      {changePwLoading ? '⏳ Enregistrement...' : '✅ Enregistrer le nouveau mot de passe'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── ACCESSIBILITÉ ── */}
            {(((coachTab === 'accessibility' || coachTab === 'admin') && isAdmin) || (!isAdmin && (coachTab === 'events' || coachTab === 'polls'))) && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>{isAdmin ? "⚙️ Administration" : coachTab === 'events' ? "🎉 Événements" : "📊 Sondages"}</h2>
                <p style={styles.blockSubtitle}>{isAdmin ? "Gestion complète du club." : "Création et suivi pour vos équipes."}</p>

                {/* ── Sous-onglets ── */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>
                  {([
                    ...(isAdmin ? [
                    ['adminAccess', 'Acces admin'],
                    ['coaches', '👤 Coaches'],
                    ['trainings', '📅 Entraînements'],
                    ['matches', '⚽ Matchs'],
                    ['players', '👥 Joueurs'],
                    ['roster', '📋 Effectifs'],
                    ['accounts', '👶 Comptes'],
                    ['seasons', '🗓 Saisons'],
                    ['settings', '⚙️ Paramètres'],
                    ['licenses', '🪪 Licences'],
                    ['registrations', '📝 Inscriptions'],
                    ['events', '🎉 Événements'],
                    ['polls', '📊 Sondages'],
                    ['online', '🟢 En ligne'],
                  ] : [
                    ['events', '🎉 Événements'],
                    ['polls', '📊 Sondages'],
                  ]),
                  ] as [typeof adminSubTab, string][]).map(([key, label]) => {
                    const badge = key === 'registrations'
                      ? registrations.filter((r) => r.status === 'pending').length
                      : key === 'online' ? getOnlineCounts().total : 0;
                    return (
                      <button key={key} onClick={() => setAdminSubTab(key)}
                        style={{ padding: '9px 14px', border: 'none', background: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', color: adminSubTab === key ? '#0A5FB5' : '#94a3b8', borderBottom: adminSubTab === key ? '3px solid #0A5FB5' : '3px solid transparent', marginBottom: -2, transition: 'all 0.15s', whiteSpace: 'nowrap', position: 'relative' }}>
                        {label}{badge > 0 && <span style={{ marginLeft: 5, background: key === 'online' ? '#16a34a' : '#dc2626', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 900, padding: '1px 5px' }}>{badge}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* ── COACHES ── */}
                {adminSubTab === 'adminAccess' && (
                  <div style={{ display: 'grid', gap: 18 }}>
                    <div style={{ ...styles.formCard, background: '#f8fbff', border: '1px solid #bfdbfe' }}>
                      <h3 style={{ margin: '0 0 6px 0', color: '#0A5FB5' }}>Acces direct au compte admin</h3>
                      <p style={{ margin: '0 0 14px 0', color: '#475569', fontSize: 14 }}>
                        Choisis les parents, joueurs ou coachs qui verront un bouton Admin dans le header apres connexion.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={styles.miniTitle}>Utilisateurs</div>
                          {parentUsers.length === 0 ? (
                            <div style={styles.emptyState}>Aucun utilisateur parent/joueur.</div>
                          ) : parentUsers.map((u) => {
                            const allowed = hasAdminDelegate('user', u.id);
                            const key = `user-${u.id}`;
                            return (
                              <div key={u.id} style={{ ...styles.linkRow, alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 900, color: '#062C5D' }}>{u.first_name} {u.last_name}</div>
                                  <div style={{ fontSize: 12, color: '#64748b', overflowWrap: 'anywhere' }}>{u.email || 'Email non renseigne'} - {u.role}</div>
                                </div>
                                <button
                                  onClick={() => toggleAdminDelegate('user', u.id, !allowed)}
                                  disabled={savingAdminDelegate === key}
                                  style={{ ...(allowed ? styles.linkRemoveButton : styles.secondaryButton), fontSize: 12, padding: '8px 12px', flexShrink: 0 }}>
                                  {savingAdminDelegate === key ? '...' : allowed ? 'Retirer' : 'Donner acces'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <div style={styles.miniTitle}>Coachs</div>
                          {Object.keys(coachSummary).length === 0 ? (
                            <div style={styles.emptyState}>Aucun coach cree.</div>
                          ) : Object.entries(coachSummary).map(([coachId, info]) => {
                            const allowed = hasAdminDelegate('coach', coachId);
                            const key = `coach-${coachId}`;
                            return (
                              <div key={coachId} style={{ ...styles.linkRow, alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 900, color: '#062C5D' }}>{info.firstName} {info.lastName}</div>
                                  <div style={{ fontSize: 12, color: '#64748b' }}>Equipes : {info.teamIds.map(getTeamName).join(', ') || 'Aucune'}</div>
                                </div>
                                <button
                                  onClick={() => toggleAdminDelegate('coach', coachId, !allowed)}
                                  disabled={savingAdminDelegate === key}
                                  style={{ ...(allowed ? styles.linkRemoveButton : styles.secondaryButton), fontSize: 12, padding: '8px 12px', flexShrink: 0 }}>
                                  {savingAdminDelegate === key ? '...' : allowed ? 'Retirer' : 'Donner acces'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === 'coaches' && <>
                  <div style={{ ...styles.formCard, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#991b1b' }}>Accès admin partagé</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#7f1d1d', fontSize: 14 }}>Crée un compte administrateur complet, utilisable par plusieurs personnes.</p>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>Email admin</label><input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} style={styles.input} placeholder="admin@cag.fr" /></div>
                      <div><label style={styles.inputLabel}>Mot de passe</label><input type="password" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} style={styles.input} placeholder="Mot de passe" /></div>
                    </div>
                    <button onClick={addAdminAccess} disabled={savingAdminAccess} style={{ ...styles.primaryButton, background: '#dc2626', marginTop: 10 }}>
                      {savingAdminAccess ? 'Création...' : 'Créer accès admin'}
                    </button>
                  </div>
                  <div style={{ ...styles.formCard, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#92400e' }}>{editingCoachId ? '✏️ Modifier le coach' : '👤 Créer un compte Coach'}</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#9a3412', fontSize: 14 }}>{editingCoachId ? 'Modifie les équipes assignées.' : 'Le coach recevra un email + mot de passe pour se connecter.'}</p>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>{"Prénom coach"}</label><input value={newCoachFirstName} onChange={(e) => setNewCoachFirstName(e.target.value)} style={styles.input} placeholder="Prénom" /></div>
                      <div><label style={styles.inputLabel}>Nom coach</label><input value={newCoachLastName} onChange={(e) => setNewCoachLastName(e.target.value)} style={styles.input} placeholder="Nom" /></div>
                      {!editingCoachId && <>
                        <div><label style={styles.inputLabel}>Email coach</label><input type="email" value={newCoachEmail} onChange={(e) => setNewCoachEmail(e.target.value)} style={styles.input} placeholder="coach@email.fr" /></div>
                        <div><label style={styles.inputLabel}>Mot de passe (min. 8 car.)</label><input type="password" value={newCoachPassword} onChange={(e) => setNewCoachPassword(e.target.value)} style={styles.input} placeholder="••••••••" /></div>
                      </>}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={styles.inputLabel}>{"Équipes assignées"}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 8 }}>
                        {teams.map((t) => (
                          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: `2px solid ${newCoachTeamIds.includes(t.id) ? '#0A5FB5' : '#d5dfeb'}`, background: newCoachTeamIds.includes(t.id) ? '#eaf4ff' : '#f8fbff', cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={newCoachTeamIds.includes(t.id)} onChange={() => toggleNewCoachTeam(t.id)} style={{ width: 18, height: 18, accentColor: '#0A5FB5' }} />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      <div>
                        <label style={styles.inputLabel}>Lien feuille de match FFHB</label>
                        <input value={newMatchFdmUrl} onChange={(e) => setNewMatchFdmUrl(e.target.value)} style={styles.input} placeholder="https://media-ffhb-fdm.ffhandball.fr/fdm/..." />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Resume supporter</label>
                        <textarea value={newMatchSupporterSummary} onChange={(e) => setNewMatchSupporterSummary(e.target.value)} style={{ ...styles.input, minHeight: 82, resize: 'vertical' }} placeholder="Resume visible dans le futur espace Supporter." />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      <div>
                        <label style={styles.inputLabel}>Lien feuille de match FFHB</label>
                        <input value={newMatchFdmUrl} onChange={(e) => setNewMatchFdmUrl(e.target.value)} style={styles.input} placeholder="https://media-ffhb-fdm.ffhandball.fr/fdm/..." />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Resume supporter</label>
                        <textarea value={newMatchSupporterSummary} onChange={(e) => setNewMatchSupporterSummary(e.target.value)} style={{ ...styles.input, minHeight: 82, resize: 'vertical' }} placeholder="Resume visible dans le futur espace Supporter." />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      <div>
                        <label style={styles.inputLabel}>Lien feuille de match FFHB</label>
                        <input value={newMatchFdmUrl} onChange={(e) => setNewMatchFdmUrl(e.target.value)} style={styles.input} placeholder="https://media-ffhb-fdm.ffhandball.fr/fdm/..." />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Resume supporter</label>
                        <textarea value={newMatchSupporterSummary} onChange={(e) => setNewMatchSupporterSummary(e.target.value)} style={{ ...styles.input, minHeight: 82, resize: 'vertical' }} placeholder="Resume visible dans le futur espace Supporter." />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={addCoachAccess} style={styles.primaryButton} disabled={savingCoach}>{savingCoach ? '⏳...' : editingCoachId ? '💾 Enregistrer' : '➕ Créer le coach'}</button>
                      {editingCoachId && <button onClick={() => { setEditingCoachId(''); setNewCoachFirstName(''); setNewCoachLastName(''); setNewCoachEmail(''); setNewCoachPassword(''); setNewCoachTeamIds([]); }} style={styles.secondaryOutlineButton}>Annuler</button>}
                    </div>
                  </div>
                  <div style={{ ...styles.panelCard, marginTop: 18 }}>
                    <h3 style={styles.panelTitle}>Coaches existants</h3>
                    {Object.keys(coachSummary).length === 0
                      ? <div style={styles.emptyState}>{"Aucun coach créé."}</div>
                      : <div style={{ display: 'grid', gap: 10 }}>
                          {Object.entries(coachSummary).map(([coachId, info]) => {
                            const coachEntry = coachAccessList.find((c) => c.id === coachId);
                            const initials = `${info.firstName?.[0] || ''}${info.lastName?.[0] || ''}`.toUpperCase();
                            return (
                              <div key={coachId} style={{ ...styles.linkRow, alignItems: 'center', gap: 14 }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  {coachEntry?.photo_url
                                    ? <img src={coachEntry.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0A5FB5' }} />
                                    : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white' }}>{initials || '🏆'}</div>}
                                  {coachEntry && (<>
                                    <label htmlFor={`cp-${coachId}`} style={{ position: 'absolute', bottom: -2, right: -2, background: '#0A5FB5', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: 'pointer' }}>📷</label>
                                    <input id={`cp-${coachId}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; await uploadCoachPhoto(coachId, file); e.target.value = ''; }} />
                                  </>)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 800, fontSize: 15, color: '#062C5D' }}>{info.firstName} {info.lastName}</div>
                                  <div style={{ color: '#5b6472', fontSize: 14, marginTop: 4 }}>Équipes : {info.teamIds.map(getTeamName).join(', ') || 'Aucune'}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => {
                                    setEditingCoachId(coachId);
                                    setNewCoachFirstName(info.firstName || '');
                                    setNewCoachLastName(info.lastName || '');
                                    setNewCoachTeamIds([...info.teamIds]);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px' }}>✏️ Modifier</button>
                                  <button onClick={() => deleteCoachAccess(coachId, `${info.firstName} ${info.lastName}`)}
                                    style={styles.linkRemoveButton}>🗑 Supprimer</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>}
                  </div>
                </>}

                {/* ── ENTRAÎNEMENTS ── */}
                {adminSubTab === 'trainings' && <div style={styles.formCard}>
                  <h3 style={styles.panelTitle}>{"Ajouter un entraînement récurrent"}</h3>
                  <div style={styles.formGrid}>
                    <div><label style={styles.inputLabel}>{"Équipe"}</label><select value={newTrainingTeamId} onChange={(e) => setNewTrainingTeamId(e.target.value)} style={styles.select}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div><label style={styles.inputLabel}>Titre</label><input value={newTrainingTitle} onChange={(e) => setNewTrainingTitle(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Jour</label><select value={newTrainingWeekday} onChange={(e) => setNewTrainingWeekday(e.target.value)} style={styles.select}><option value="1">Lundi</option><option value="2">Mardi</option><option value="3">Mercredi</option><option value="4">Jeudi</option><option value="5">Vendredi</option><option value="6">Samedi</option><option value="0">Dimanche</option></select></div>
                    <div><label style={styles.inputLabel}>{"Début"}</label><input type="time" value={newTrainingStart} onChange={(e) => setNewTrainingStart(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Fin</label><input type="time" value={newTrainingEnd} onChange={(e) => setNewTrainingEnd(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Lieu</label><input value={newTrainingLocation} onChange={(e) => setNewTrainingLocation(e.target.value)} style={styles.input} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={addTrainingTemplate} disabled={savingTrainingTemplate} style={styles.primaryButton}>
                      {savingTrainingTemplate ? 'Enregistrement...' : editingTrainingTemplateId ? "Modifier l'entrainement" : "Ajouter l'entrainement"}
                    </button>
                    {editingTrainingTemplateId && <button onClick={resetTrainingTemplateForm} style={styles.secondaryOutlineButton}>Annuler</button>}
                  </div>

                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #dbe4ef' }}>
                    <h3 style={{ ...styles.panelTitle, fontSize: 18 }}>Creneaux recurrents</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {trainingTemplates.length === 0 ? (
                        <div style={styles.emptyState}>Aucun entrainement recurrent.</div>
                      ) : trainingTemplates.map((template) => (
                        <div key={template.id} style={{ ...styles.linkRow, background: 'white', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 220 }}>
                            <strong>{template.title || 'Entrainement'} - {getTeamName(template.team_id)}</strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              {getWeekdayLabel(template.weekday)} - {template.start_time} / {template.end_time} - {template.location || '-'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => startEditTrainingTemplate(template)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '8px 12px' }}>Modifier</button>
                            <button onClick={() => toggleTemplateActive(template)} style={{ ...(template.active ? styles.linkRemoveButton : styles.secondaryButton), fontSize: 12, padding: '8px 12px' }}>
                              {template.active ? 'Desactiver' : 'Reactiver'}
                            </button>
                          </div>
                        </div>
                    )}
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #dbe4ef' }}>
                    <h3 style={{ ...styles.panelTitle, fontSize: 18 }}>Périodes de vacances entraînement</h3>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>Équipe</label><select value={newBreakTeamId} onChange={(e) => setNewBreakTeamId(e.target.value)} style={styles.select}><option value="">Toutes les équipes</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label style={styles.inputLabel}>Titre</label><input value={newBreakTitle} onChange={(e) => setNewBreakTitle(e.target.value)} style={styles.input} placeholder="Vacances scolaires" /></div>
                      <div><label style={styles.inputLabel}>Début</label><input type="date" value={newBreakStart} onChange={(e) => setNewBreakStart(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Fin</label><input type="date" value={newBreakEnd} onChange={(e) => setNewBreakEnd(e.target.value)} style={styles.input} /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>Note</label><input value={newBreakReason} onChange={(e) => setNewBreakReason(e.target.value)} style={styles.input} placeholder="Optionnel" /></div>
                    </div>
                    <button onClick={addTrainingBreak} style={{ ...styles.secondaryButton, background: '#0A5FB5' }}>Ajouter la période</button>
                    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                      {trainingBreaks.map((b) => (
                        <div key={b.id} style={{ ...styles.linkRow, background: 'white' }}>
                          <div style={{ flex: 1 }}>
                            <strong>{b.title}</strong>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{formatDate(b.start_date)} au {formatDate(b.end_date)} · {b.team_id ? getTeamName(b.team_id) : 'Toutes les équipes'}{b.reason ? ` · ${b.reason}` : ''}</div>
                          </div>
                          <button onClick={() => deleteTrainingBreak(b.id)} style={{ ...styles.linkRemoveButton, fontSize: 12 }}>Supprimer</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>}

                {/* ── MATCHS ── */}
                {adminSubTab === 'matches' && <>
                  <div style={styles.formCard}>
                    <h3 style={styles.panelTitle}>{editingMatchId ? '✏️ Modifier le match' : '➕ Ajouter un match'}</h3>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>{"Équipe"}</label><select value={newMatchTeamId} onChange={(e) => setNewMatchTeamId(e.target.value)} style={styles.select}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label style={styles.inputLabel}>Adversaire</label><input value={newMatchOpponent} onChange={(e) => setNewMatchOpponent(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Date & heure</label><input type="datetime-local" value={newMatchDate} onChange={(e) => setNewMatchDate(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Lieu</label><input value={newMatchLocation} onChange={(e) => setNewMatchLocation(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Type</label><select value={newMatchHomeAway} onChange={(e) => setNewMatchHomeAway(e.target.value as 'home' | 'away')} style={styles.select}><option value="home">Domicile</option><option value="away">{"Extérieur"}</option></select></div>
                    </div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                      <div>
                        <label style={styles.inputLabel}>Lien feuille de match FFHB</label>
                        <input value={newMatchFdmUrl} onChange={(e) => setNewMatchFdmUrl(e.target.value)} style={styles.input} placeholder="https://media-ffhb-fdm.ffhandball.fr/fdm/..." />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Resume supporter</label>
                        <textarea value={newMatchSupporterSummary} onChange={(e) => setNewMatchSupporterSummary(e.target.value)} style={{ ...styles.input, minHeight: 82, resize: 'vertical' }} placeholder="Resume visible dans le futur espace Supporter." />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={addMatch} style={styles.primaryButton}>{editingMatchId ? '💾 Enregistrer' : 'Ajouter le match'}</button>
                      {editingMatchId && <button onClick={resetMatchForm} style={styles.secondaryOutlineButton}>Annuler</button>}
                    </div>
                  </div>
                  {/* Liste déroulante matchs */}
                  <div style={{ ...styles.panelCard, marginTop: 18 }}>
                    <div onClick={() => setMatchesExpanded(p => !p)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                      <h3 style={{ margin: 0 }}>📋 Matchs existants ({matches.length})</h3>
                      <span style={{ fontSize: 20, color: '#0A5FB5', fontWeight: 900 }}>{matchesExpanded ? '▲' : '▼'}</span>
                    </div>
                    {matchesExpanded && (matches.length === 0
                      ? <div style={{ ...styles.emptyState, marginTop: 12 }}>Aucun match.</div>
                      : <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                          {[...matches].sort((a, b) => b.match_date.localeCompare(a.match_date)).map((m) => (
                            <div key={m.id} style={{ ...styles.linkRow, flexWrap: 'wrap' }}>
                              <div style={{ flex: 1 }}>
                                <strong>{getTeamName(m.team_id)} vs {m.opponent}</strong>
                                <div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{formatDate(m.match_date)} {formatTime(m.match_date)} · {m.location || '-'} · {m.home_away === 'home' ? 'Domicile' : 'Extérieur'}</div>
                                {m.score_home !== null && m.score_home !== '' && <div style={{ fontSize: 13, fontWeight: 700, color: '#0A5FB5', marginTop: 2 }}>Score : {m.score_home} – {m.score_away}</div>}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                <button onClick={() => startEditMatch(m, true)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px' }}>Modifier</button>
                                <button onClick={() => deleteMatch(m)} style={{ ...styles.linkRemoveButton, fontSize: 12 }}>🗑</button>
                              </div>
                            </div>
                          ))}
                        </div>
                    )}
                  </div>
                </>}

                {/* ── JOUEURS ── */}
                {adminSubTab === 'players' && <div style={styles.formCard}>
                  <h3 style={styles.panelTitle}>Ajouter / modifier un joueur</h3>
                  <div style={styles.formGrid}>
                    <div><label style={styles.inputLabel}>{"Prénom"}</label><input value={playerFormFirstName} onChange={(e) => setPlayerFormFirstName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Nom</label><input value={playerFormLastName} onChange={(e) => setPlayerFormLastName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>{"Équipe"}</label><select value={playerFormTeamId} onChange={(e) => setPlayerFormTeamId(e.target.value)} style={styles.select}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div><label style={styles.inputLabel}>Garçon / fille</label><select value={playerFormGender} onChange={(e) => setPlayerFormGender(e.target.value as 'male' | 'female' | '')} style={styles.select}><option value="">— Non défini —</option><option value="male">Garçon</option><option value="female">Fille</option></select></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={savePlayer} style={styles.primaryButton} disabled={savingPlayer}>{savingPlayer ? 'Enregistrement...' : editingPlayerId ? 'Modifier le joueur' : 'Ajouter le joueur'}</button>
                    <button onClick={resetPlayerForm} style={styles.secondaryOutlineButton}>{"Réinitialiser"}</button>
                  </div>
                </div>}

                {/* ── EFFECTIFS ── */}
                {adminSubTab === 'roster' && <div style={{ display: 'grid', gap: 18 }}>
                  <div style={styles.formCard}>
                    <h3 style={styles.panelTitle}>Récapitulatif des effectifs</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
                      <div style={{ padding: 14, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8' }}>Total club</div><div style={{ fontSize: 26, fontWeight: 900, color: '#062C5D' }}>{players.length}</div></div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>Garçons</div><div style={{ fontSize: 26, fontWeight: 900, color: '#14532d' }}>{players.filter((p) => getPlayerGender(p) === 'male').length}</div></div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#fdf2f8', border: '1px solid #fbcfe8' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#be185d' }}>Filles</div><div style={{ fontSize: 26, fontWeight: 900, color: '#831843' }}>{players.filter((p) => getPlayerGender(p) === 'female').length}</div></div>
                      <div style={{ padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>Non renseignés</div><div style={{ fontSize: 26, fontWeight: 900, color: '#334155' }}>{players.filter((p) => getPlayerGender(p) === 'unknown').length}</div></div>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {rosterSummary.map(({ team, players: teamPlayers, boys, girls, unknown }) => (
                        <div key={team.id} style={{ padding: 14, borderRadius: 12, border: '1px solid #dbe4ef', background: 'white' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                            <div><strong style={{ color: '#062C5D' }}>{team.name}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{team.category || 'Catégorie'}</div></div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, fontWeight: 800 }}>
                              <span style={{ ...styles.statusBadge, background: '#dbeafe', color: '#1d4ed8' }}>{teamPlayers.length} joueur{teamPlayers.length > 1 ? 's' : ''}</span>
                              <span style={{ ...styles.statusBadge, ...styles.badgeGreen }}>{boys} garçon{boys > 1 ? 's' : ''}</span>
                              <span style={{ ...styles.statusBadge, background: '#fce7f3', color: '#be185d' }}>{girls} fille{girls > 1 ? 's' : ''}</span>
                              {unknown > 0 && <span style={{ ...styles.statusBadge, background: '#f1f5f9', color: '#475569' }}>{unknown} à définir</span>}
                            </div>
                          </div>
                          {teamPlayers.length === 0
                            ? <div style={styles.emptyState}>Aucun joueur dans cette catégorie.</div>
                            : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {teamPlayers.map((p) => {
                                const gender = getPlayerGender(p);
                                return (
                                  <span key={p.id} style={{ padding: '5px 9px', borderRadius: 999, fontSize: 12, fontWeight: 800, background: gender === 'female' ? '#fce7f3' : gender === 'male' ? '#dcfce7' : '#f1f5f9', color: gender === 'female' ? '#be185d' : gender === 'male' ? '#166534' : '#475569' }}>
                                    {getPlayerName(p)}
                                  </span>
                                );
                              })}
                            </div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...styles.formCard, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#92400e' }}>Passage de catégorie</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#9a3412', fontSize: 14 }}>Sélectionne les joueurs à transférer vers la catégorie supérieure.</p>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>Catégorie actuelle</label><select value={promotionSourceTeamId} onChange={(e) => { setPromotionSourceTeamId(e.target.value); setPromotionSelectedIds([]); }} style={styles.select}><option value="">Choisir...</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label style={styles.inputLabel}>Nouvelle catégorie</label><select value={promotionTargetTeamId} onChange={(e) => setPromotionTargetTeamId(e.target.value)} style={styles.select}><option value="">Choisir...</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label style={styles.inputLabel}>Filtre</label><select value={promotionGenderFilter} onChange={(e) => { setPromotionGenderFilter(e.target.value as 'all' | 'male' | 'female' | 'unknown'); setPromotionSelectedIds([]); }} style={styles.select}><option value="all">Tous</option><option value="male">Garçons</option><option value="female">Filles</option><option value="unknown">Non renseignés</option></select></div>
                    </div>
                    {promotionSourceTeamId && <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <strong>{promotionCandidates.length} joueur{promotionCandidates.length > 1 ? 's' : ''} disponible{promotionCandidates.length > 1 ? 's' : ''}</strong>
                        <button type="button" onClick={() => setPromotionSelectedIds(promotionSelectedIds.length === promotionCandidates.length ? [] : promotionCandidates.map((p) => p.id))} style={styles.secondaryOutlineButton}>
                          {promotionSelectedIds.length === promotionCandidates.length ? 'Tout décocher' : 'Tout sélectionner'}
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                        {promotionCandidates.map((p) => (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${promotionSelectedIds.includes(p.id) ? '#0A5FB5' : '#d5dfeb'}`, background: promotionSelectedIds.includes(p.id) ? '#eff6ff' : 'white', cursor: 'pointer', fontWeight: 700 }}>
                            <input type="checkbox" checked={promotionSelectedIds.includes(p.id)} onChange={() => togglePromotionPlayer(p.id)} style={{ width: 18, height: 18, accentColor: '#0A5FB5' }} />
                            <span>{getPlayerName(p)}</span>
                          </label>
                        ))}
                      </div>
                      <button onClick={transferSelectedPlayers} disabled={promotionSaving || promotionSelectedIds.length === 0} style={{ ...styles.primaryButton, marginTop: 14, background: '#ea580c', opacity: promotionSaving || promotionSelectedIds.length === 0 ? 0.65 : 1 }}>
                        {promotionSaving ? 'Transfert...' : `Transférer ${promotionSelectedIds.length} joueur(s)`}
                      </button>
                    </div>}
                  </div>
                </div>}

                {/* ── COMPTES ENFANTS ── */}
                {adminSubTab === 'accounts' && <div style={styles.formCard}>
                  <div style={styles.createAccountHeader}>
                    <div><h3 style={{ margin: 0 }}>Nouveau compte enfant</h3><p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{"Crée un enfant et son parent avec un compte email + mot de passe."}</p></div>
                    <button onClick={() => setShowCreateChildForm((p) => !p)} style={styles.secondaryOutlineButton}>{showCreateChildForm ? 'Fermer' : 'Créer'}</button>
                  </div>
                  {showCreateChildForm && <div style={{ marginTop: 18 }}>
                    <div style={styles.formGrid}>
                      <div><label style={styles.inputLabel}>{"Prénom enfant"}</label><input value={newChildFirstName} onChange={(e) => setNewChildFirstName(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Nom enfant</label><input value={newChildLastName} onChange={(e) => setNewChildLastName(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>{"Équipe"}</label><select value={newChildTeamId} onChange={(e) => setNewChildTeamId(e.target.value)} style={styles.select}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <div><label style={styles.inputLabel}>Garçon / fille</label><select value={newChildGender} onChange={(e) => setNewChildGender(e.target.value as 'male' | 'female' | '')} style={styles.select}><option value="">— Non défini —</option><option value="male">Garçon</option><option value="female">Fille</option></select></div>
                      <div><label style={styles.inputLabel}>{"Prénom parent"}</label><input value={newParentFirstName} onChange={(e) => setNewParentFirstName(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Nom parent</label><input value={newParentLastName} onChange={(e) => setNewParentLastName(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Email parent</label><input value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} style={styles.input} type="email" /></div>
                      <div><label style={styles.inputLabel}>Mot de passe parent (min. 8 car.)</label><input value={newParentPassword} onChange={(e) => setNewParentPassword(e.target.value)} style={styles.input} type="password" placeholder="••••••••" /></div>
                    </div>
                    <button onClick={createChildAccount} style={{ ...styles.primaryButton, width: '100%', opacity: creatingChildAccount ? 0.7 : 1 }} disabled={creatingChildAccount}>{creatingChildAccount ? 'Création...' : 'Créer le compte enfant'}</button>
                  </div>}
                </div>}

                {/* ── SAISONS ── */}
                {adminSubTab === 'seasons' && <div style={{ ...styles.formCard, background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#14532d' }}>🗓 Gestion des saisons</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#166534', fontSize: 14 }}>Créez des saisons pour organiser les stats par période.</p>
                  <div style={styles.formGrid}>
                    <div><label style={styles.inputLabel}>Équipe</label><select value={newSeasonTeamId} onChange={(e) => setNewSeasonTeamId(e.target.value)} style={styles.select}><option value="">-- Toutes équipes --</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div><label style={styles.inputLabel}>Nom de la saison</label><input value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} style={styles.input} placeholder="Ex: 2025/2026" /></div>
                    <div><label style={styles.inputLabel}>Date début</label><input type="date" value={newSeasonStart} onChange={(e) => setNewSeasonStart(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Date fin</label><input type="date" value={newSeasonEnd} onChange={(e) => setNewSeasonEnd(e.target.value)} style={styles.input} /></div>
                  </div>
                  <button onClick={addSeason} style={{ ...styles.primaryButton, background: '#16a34a' }} disabled={savingSeason}>{savingSeason ? 'Création...' : '+ Créer la saison'}</button>
                  {seasons.length > 0 && <div style={{ marginTop: 16 }}>
                    <div style={styles.miniTitle}>Saisons existantes</div>
                    <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                      {seasons.map((s) => (
                        <div key={s.id} style={{ ...styles.linkRow, background: '#f0fdf4', border: '1px solid #86efac' }}>
                          <div><strong style={{ color: '#14532d' }}>{s.name}</strong><div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{s.start_date} → {s.end_date} · {s.team_id ? (teams.find(t => t.id === s.team_id)?.name || 'Équipe inconnue') : 'Toutes équipes'}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>}
                </div>}

                {adminSubTab === 'seasons' && (
                  <div style={{ ...styles.formCard, marginTop: 18, background: '#f8fbff', border: '1px solid #bfdbfe' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#1e40af' }}>Preparation saison suivante</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#1e40af', fontSize: 14 }}>
                      Prepare les prochaines equipes sans modifier la saison actuelle. La bascule officielle reste manuelle.
                    </p>
                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.inputLabel}>Saison a preparer</label>
                        <select value={planningSeasonId} onChange={(e) => setPlanningSeasonId(e.target.value)} style={styles.select}>
                          <option value="">-- Choisir une saison --</option>
                          {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Actions</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => confirmSeasonAssignments(planningSeasonId)} disabled={!planningSeasonId || savingSeasonAssignments}
                            style={{ ...styles.secondaryButton, background: '#16a34a', opacity: !planningSeasonId || savingSeasonAssignments ? 0.6 : 1 }}>
                            Confirmer les affectations
                          </button>
                          <button onClick={() => switchToSeason(planningSeasonId)} disabled={!planningSeasonId || switchingSeason}
                            style={{ ...styles.secondaryButton, background: '#dc2626', opacity: !planningSeasonId || switchingSeason ? 0.6 : 1 }}>
                            {switchingSeason ? 'Bascule...' : 'Basculer manuellement'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {planningSeasonId ? (() => {
                      const seasonRows = playerSeasonAssignments.filter((a) => a.season_id === planningSeasonId);
                      const confirmed = seasonRows.filter((a) => a.status === 'confirmed').length;
                      return (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, margin: '14px 0' }}>
                            <div style={{ background: '#eaf4ff', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #bfdbfe' }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: '#1e40af' }}>{seasonRows.length}</div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#1e40af' }}>Affectations</div>
                            </div>
                            <div style={{ background: '#dcfce7', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #86efac' }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: '#166534' }}>{confirmed}</div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>Confirmees</div>
                            </div>
                            <div style={{ background: '#fef3c7', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #fde68a' }}>
                              <div style={{ fontSize: 22, fontWeight: 900, color: '#92400e' }}>{seasonRows.length - confirmed}</div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e' }}>Brouillons</div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 8, maxHeight: 520, overflowY: 'auto', paddingRight: 2 }}>
                            {[...players].sort((a, b) => `${getTeamName(a.team_id)} ${a.last_name}`.localeCompare(`${getTeamName(b.team_id)} ${b.last_name}`, 'fr')).map((p) => {
                              const assignment = getSeasonAssignment(p.id, planningSeasonId);
                              const nextTeamId = assignment?.team_id || '';
                              return (
                                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'white', border: '1px solid #d8e5f2', borderRadius: 12 }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 900, color: '#10233b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getPlayerName(p)}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.birth_date ? `${getPlayerAge(p.birth_date)} ans` : 'Age non renseigne'}</div>
                                  </div>
                                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Actuel : {getTeamName(p.team_id)}</div>
                                  <select value={nextTeamId} onChange={(e) => savePlayerSeasonAssignment(p.id, planningSeasonId, e.target.value, 'draft')} style={{ ...styles.select, minHeight: 38, padding: '8px 10px' }}>
                                    <option value="">-- Non affecte --</option>
                                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                  <span style={{ justifySelf: 'end', background: assignment?.status === 'confirmed' ? '#dcfce7' : assignment ? '#fef3c7' : '#f1f5f9', color: assignment?.status === 'confirmed' ? '#166534' : assignment ? '#92400e' : '#64748b', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' }}>
                                    {assignment?.status === 'confirmed' ? 'Confirme' : assignment ? 'Brouillon' : 'Aucun'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })() : (
                      <div style={styles.emptyState}>Choisis une saison pour preparer les affectations.</div>
                    )}
                  </div>
                )}

                {/* ── PARAMÈTRES ── */}
                {adminSubTab === 'settings' && <>
                  <div style={{ ...styles.formCard, background: '#f0f4ff', border: '1px solid #c7d2fe' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#3730a3' }}>⚙️ Paramètres de l'application</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#4338ca', fontSize: 14 }}>URL de l'app et liens championnat affichés aux parents.</p>
                    <div style={styles.formGrid}>
                      <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>🔗 URL de l'application</label><input value={appSettings.app_url} onChange={(e) => setAppSettings((p) => ({ ...p, app_url: e.target.value }))} style={styles.input} placeholder="https://..." /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>📧 Email admin</label><input type="email" value={appSettings.admin_email} onChange={(e) => setAppSettings((p) => ({ ...p, admin_email: e.target.value }))} style={styles.input} placeholder="admin@cagorcy.fr" /></div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.inputLabel}>📬 Emails qui reçoivent les nouvelles inscriptions</label>
                        <textarea
                          value={appSettings.registration_notification_emails}
                          onChange={(e) => setAppSettings((p) => ({ ...p, registration_notification_emails: e.target.value }))}
                          style={{ ...styles.input, minHeight: 88, resize: 'vertical' }}
                          placeholder="president@cag.fr&#10;secretariat@cag.fr&#10;admin@cag.fr"
                        />
                        <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: 12 }}>Une adresse par ligne, ou séparées par virgule/point-virgule. Si vide, l'email admin ci-dessus sera utilisé.</p>
                      </div>
                      {([['championship_u9','🏆 U9'],['championship_u11_garcon','🏆 U11 Garçon'],['championship_u11_fille','🏆 U11 Fille'],['championship_u13_garcon','🏆 U13 Garçon'],['championship_u13_fille','🏆 U13 Fille'],['championship_u15','🏆 U15'],['championship_u17','🏆 U17'],['championship_u18','🏆 U18'],['championship_senior','🏆 Senior Garçon'],['championship_senior_fille','🏆 Senior Fille']] as [keyof AppSettings, string][]).map(([key, label]) => (<div key={key}><label style={styles.inputLabel}>{label}</label><input value={appSettings[key]} onChange={(e) => setAppSettings((p) => ({ ...p, [key]: e.target.value }))} style={styles.input} placeholder="https://..." /></div>))}
                    </div>
                    <button onClick={saveSettings} style={{ ...styles.primaryButton, background: '#4338ca', marginTop: 8 }} disabled={savingSettings}>{savingSettings ? 'Enregistrement...' : '💾 Enregistrer les paramètres'}</button>
                  </div>
                  <div style={{ ...styles.formCard, marginTop: 18, background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#166534' }}>🪪 Liens de paiement — Licences</h3>
                    <p style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: 14 }}>Liens visibles dans l'espace parent pour payer la licence.</p>
                    <div style={styles.formGrid}>
                      {([['license_url_u9','U9'],['license_url_u11_garcon','U11 Garçon'],['license_url_u11_fille','U11 Fille'],['license_url_u13_garcon','U13 Garçon'],['license_url_u13_fille','U13 Fille'],['license_url_u15','U15'],['license_url_u17','U17'],['license_url_u18','U18'],['license_url_senior','Senior Garçon'],['license_url_senior_fille','Senior Fille'],['license_url_loisir','Loisir']] as [keyof AppSettings, string][]).map(([key, label]) => (<div key={key}><label style={styles.inputLabel}>🪪 {label}</label><input value={appSettings[key]} onChange={(e) => setAppSettings((p) => ({ ...p, [key]: e.target.value }))} style={styles.input} placeholder="https://..." /></div>))}
                    </div>
                    <button onClick={saveSettings} style={{ ...styles.primaryButton, background: '#16a34a', marginTop: 8 }} disabled={savingSettings}>{savingSettings ? 'Enregistrement...' : '💾 Enregistrer les liens'}</button>
                  </div>

                  {/* Gestion Sponsors */}
                  <div style={{ ...styles.formCard, marginTop: 18, background: '#fef9ff', border: '1px solid #e9d5ff' }}>
                    <h3 style={{ margin: '0 0 6px 0', color: '#7e22ce' }}>🏆 Sponsors du club</h3>
                    <p style={{ margin: '0 0 14px 0', color: '#9333ea', fontSize: 14 }}>Les sponsors actifs s'affichent en rotation dans l'espace parent.</p>
                    <div style={styles.formGrid}>
                      <div>
                        <label style={styles.inputLabel}>Nom du sponsor</label>
                        <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} style={styles.input} placeholder="Ex: Mairie de Gorcy" />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Site web (optionnel)</label>
                        <input value={sponsorWebsite} onChange={(e) => setSponsorWebsite(e.target.value)} style={styles.input} placeholder="https://..." />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Logo (upload photo)</label>
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!sponsorName.trim()) { alert('Entrez d\'abord le nom du sponsor'); return; }
                          setUploadingSponsorPhoto(true);
                          try {
                            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                            const path = `sponsors/${Date.now()}.${ext}`;
                            const { error: upErr } = await supabase.storage.from('player-photos').upload(path, file, { upsert: true, contentType: file.type });
                            if (upErr) { alert(`Erreur upload: ${upErr.message}`); return; }
                            const { data: urlData } = supabase.storage.from('player-photos').getPublicUrl(path);
                            const publicUrl = urlData.publicUrl;
                            await supabase.from('sponsors').insert({
                              name: sponsorName.trim(), photo_url: publicUrl,
                              website_url: sponsorWebsite.trim() || null,
                              display_order: sponsors.length, active: true,
                            });
                            setSponsorName(''); setSponsorWebsite('');
                            const { data } = await supabase.from('sponsors').select('*').eq('active', true).order('display_order');
                            setSponsors(data as Sponsor[] || []);
                            alert('✅ Sponsor ajouté !');
                          } catch (err) { console.error(err); alert('Erreur upload sponsor'); }
                          finally { setUploadingSponsorPhoto(false); }
                        }} style={{ ...styles.input, padding: '10px' }} />
                        {uploadingSponsorPhoto && <div style={{ color: '#9333ea', fontSize: 13, marginTop: 4 }}>⏳ Upload en cours...</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
                      {sponsors.map((s) => (
                        <div key={s.id} style={{ border: '1px solid #e9d5ff', borderRadius: 14, padding: 12, background: 'white', display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                          <img src={s.photo_url} alt={s.name} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #f3e8ff' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{s.name}</div>
                            {s.website_url && <div style={{ fontSize: 11, color: '#9333ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.website_url}</div>}
                          </div>
                          <button onClick={async () => {
                            await supabase.from('sponsors').update({ active: false }).eq('id', s.id);
                            setSponsors((prev) => prev.filter((x) => x.id !== s.id));
                          }} style={{ border: 'none', background: '#fee2e2', color: '#991b1b', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🗑</button>
                        </div>
                      ))}
                      {sponsors.length === 0 && <div style={{ color: '#9ca3af', fontSize: 14, fontStyle: 'italic' }}>Aucun sponsor actif.</div>}
                    </div>
                  </div>
                </>}

                {/* ── LICENCES ── */}
                {adminSubTab === 'licenses' && <div style={{ ...styles.formCard, background: '#fefce8', border: '1px solid #fde047' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#854d0e' }}>📋 Suivi des licences</h3>
                  <p style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: 14 }}>Validez manuellement après réception du paiement.</p>

                  {/* Sélecteur de saison dans le panneau admin */}
                  {seasons.length > 0 && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <label style={{ fontWeight: 700, fontSize: 13, color: '#92400e' }}>🗓 Saison :</label>
                      <select
                        value={selectedLicenseSeasonId}
                        onChange={(e) => setSelectedLicenseSeasonId(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #fde047', fontSize: 13, fontWeight: 700, color: '#78350f', background: 'white', outline: 'none', cursor: 'pointer' }}>
                        {seasons.map((s) => {
                          const today = new Date().toISOString().slice(0, 10);
                          const isCurrent = s.start_date <= today && s.end_date >= today;
                          return <option key={s.id} value={s.id}>{s.name}{isCurrent ? ' ⭐' : ''}</option>;
                        })}
                      </select>
                      {!selectedLicenseSeasonId && (
                        <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700 }}>⚠ Sélectionnez une saison pour pouvoir modifier les statuts</span>
                      )}
                    </div>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead><tr style={{ background: '#fef9c3' }}>
                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#78350f', borderBottom: '2px solid #fde047' }}>Joueur</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: '#78350f', borderBottom: '2px solid #fde047' }}>Équipe</th>
                        <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: '#78350f', borderBottom: '2px solid #fde047' }}>Statut</th>
                        <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: '#78350f', borderBottom: '2px solid #fde047' }}>Actions</th>
                      </tr></thead>
                      <tbody>
                        {[...players].sort((a, b) => a.last_name.localeCompare(b.last_name)).map((p) => {
                          const effectiveSeasonId = selectedLicenseSeasonId || getCurrentSeason()?.id || null;
                          const lic = getLicenseStatus(p.id, effectiveSeasonId);
                          const st = lic?.status || 'pending';
                          const bs: React.CSSProperties = { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12, background: st === 'validated' ? '#dcfce7' : st === 'paid' ? '#dbeafe' : '#fee2e2', color: st === 'validated' ? '#166534' : st === 'paid' ? '#1e40af' : '#991b1b' };
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #fde68a' }}>
                              <td style={{ padding: '10px 12px' }}>{p.last_name.toUpperCase()} {p.first_name}</td>
                              <td style={{ padding: '10px 12px', color: '#5b6472' }}>{getTeamName(p.team_id)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={bs}>{st === 'validated' ? '✅ Validée' : st === 'paid' ? '💳 Payée' : '⏳ En attente'}</span></td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                  <button onClick={() => upsertLicenseStatus(p.id, 'pending', effectiveSeasonId || undefined)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'pending' ? '#dc2626' : '#f3f4f6', color: st === 'pending' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>En attente</button>
                                  <button onClick={() => upsertLicenseStatus(p.id, 'paid', effectiveSeasonId || undefined)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'paid' ? '#2563eb' : '#f3f4f6', color: st === 'paid' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Payée</button>
                                  <button onClick={() => upsertLicenseStatus(p.id, 'validated', effectiveSeasonId || undefined)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: st === 'validated' ? '#16a34a' : '#f3f4f6', color: st === 'validated' ? 'white' : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✅ Valider</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>}

                {/* ── INSCRIPTIONS ── */}
                {adminSubTab === 'registrations' && <>
                  {(() => {
                    const pending = registrations.filter((r) => r.status === 'pending');
                    const approved = registrations.filter((r) => r.status === 'approved');
                    const rejected = registrations.filter((r) => r.status === 'rejected');
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                        <div style={{ background: '#fef9c3', borderRadius: 14, padding: '14px 16px', textAlign: 'center', border: '1px solid #fde047' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#854d0e' }}>{pending.length}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', marginTop: 4 }}>⏳ En attente</div></div>
                        <div style={{ background: '#dcfce7', borderRadius: 14, padding: '14px 16px', textAlign: 'center', border: '1px solid #86efac' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#166534' }}>{approved.length}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginTop: 4 }}>✅ Autorisés</div></div>
                        <div style={{ background: '#fee2e2', borderRadius: 14, padding: '14px 16px', textAlign: 'center', border: '1px solid #fca5a5' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#991b1b' }}>{rejected.length}</div><div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginTop: 4 }}>❌ Refusés</div></div>
                      </div>
                    );
                  })()}
                  {['pending', 'approved', 'rejected'].map((status) => {
                    const list = registrations.filter((r) => r.status === status);
                    if (list.length === 0) return null;
                    const statusLabel = status === 'pending' ? '⏳ En attente' : status === 'approved' ? '✅ Autorisés' : '❌ Refusés';
                    const statusColor = status === 'pending' ? '#854d0e' : status === 'approved' ? '#166534' : '#991b1b';
                    const statusBg = status === 'pending' ? '#fefce8' : status === 'approved' ? '#f0fdf4' : '#fff5f5';
                    return (
                      <div key={status} style={{ ...styles.panelCard, marginBottom: 16, background: statusBg }}>
                        <h3 style={{ margin: '0 0 14px 0', color: statusColor }}>{statusLabel}</h3>
                        <div style={{ display: 'grid', gap: 12 }}>
                          {list.map((reg) => {
                            const childrenNames = [reg.child1_name, reg.child2_name].filter(Boolean).join(' et ');
                            const directTeamIds = Array.isArray((reg as any).direct_team_ids) ? (reg as any).direct_team_ids.filter(Boolean) : [];
                            const teamName = directTeamIds.length > 0 ? directTeamIds.map(getTeamName).join(', ') : (reg.child1_team_id ? getTeamName(reg.child1_team_id) : '-');
                            const date = new Date(reg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={reg.id} style={{ background: 'white', borderRadius: 14, padding: 16, border: `1px solid ${status === 'pending' ? '#fde047' : status === 'approved' ? '#86efac' : '#fca5a5'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 16, color: '#062C5D' }}>{reg.type === 'parent' ? '👪' : '🏅'} {reg.parent_first_name} {reg.parent_last_name}</div>
                                    <div style={{ fontSize: 13, color: '#5b6472', marginTop: 4 }}>📧 {reg.email || "Pas d'email"}</div>
                                    <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>👶 {childrenNames} — {teamName}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{reg.type === 'parent' ? 'Inscription parent' : 'Inscription directe'} · {date}</div>
                                  </div>
                                  {status === 'pending' && (
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                      <button onClick={() => approveRegistration(reg)} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#16a34a', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>✅ Autoriser</button>
                                      <button onClick={() => rejectRegistration(reg)} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#dc2626', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>❌ Refuser</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {registrations.length === 0 && <div style={styles.emptyState}>Aucune demande d'inscription pour le moment.</div>}
                </>}

                {/* ── ÉVÉNEMENTS ── */}
                {adminSubTab === 'events' && <>
                  <div style={styles.formCard}>
                    <h3 style={styles.panelTitle}>{editingEventId ? '✏️ Modifier l\'événement' : '➕ Créer un événement'}</h3>
                    <div style={styles.formGrid}>
                      <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>Titre</label><input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={styles.input} placeholder="Ex: Assemblée générale, Sortie Walibi..." /></div>
                      <div style={{ gridColumn: '1 / -1' }}><label style={styles.inputLabel}>Description</label><textarea value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} style={{ ...styles.input, minHeight: 80, resize: 'vertical' }} placeholder="Détails, informations supplémentaires..." /></div>
                      <div><label style={styles.inputLabel}>Date & heure début</label><input type="datetime-local" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Date & heure fin (optionnel)</label><input type="datetime-local" value={newEventEndDate} onChange={(e) => setNewEventEndDate(e.target.value)} style={styles.input} /></div>
                      <div><label style={styles.inputLabel}>Lieu</label><input value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} style={styles.input} placeholder="Lieu de l'événement" /></div>
                      <div>
                        <label style={styles.inputLabel}>Type</label>
                        <select value={newEventType} onChange={(e) => setNewEventType(e.target.value)} style={styles.select}>
                          <option value="event">📅 Événement</option>
                          <option value="assembly">🏛️ Assemblée générale</option>
                          <option value="outing">🎢 Sortie</option>
                          <option value="tournament">🏆 Tournoi</option>
                          <option value="other">📌 Autre</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.inputLabel}>💳 Lien de paiement (optionnel)</label>
                        <input value={newEventPaymentLink} onChange={(e) => setNewEventPaymentLink(e.target.value)} style={styles.input} placeholder="https://... (HelloAsso, PayPal, etc.)" />
                        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#94a3b8' }}>Si renseigné, un bouton de paiement sera affiché aux parents.</p>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={styles.inputLabel}>Catégories concernées (vide = {isAdmin ? 'toutes' : 'vos équipes'})</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
                        {eventPollTeams.map((t) => (
                          <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `2px solid ${newEventTeamIds.includes(t.id) ? '#0A5FB5' : '#d5dfeb'}`, background: newEventTeamIds.includes(t.id) ? '#eaf4ff' : '#f8fbff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                            <input type="checkbox" checked={newEventTeamIds.includes(t.id)} onChange={() => setNewEventTeamIds((p) => p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id])} style={{ accentColor: '#0A5FB5' }} />
                            {t.name}
                          </label>
                        ))}
                      </div>
                      {newEventTeamIds.length === 0 && <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#94a3b8' }}>Aucune sélection = visible par {isAdmin ? 'tous' : 'vos équipes'}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={saveEvent} style={styles.primaryButton} disabled={savingEvent}>{savingEvent ? 'Enregistrement...' : editingEventId ? '💾 Modifier' : '➕ Créer l\'événement'}</button>
                      {editingEventId && <button onClick={() => { setEditingEventId(''); setNewEventTitle(''); setNewEventDesc(''); setNewEventDate(''); setNewEventEndDate(''); setNewEventLocation(''); setNewEventType('event'); setNewEventTeamIds([]); setNewEventPaymentLink(''); }} style={styles.secondaryOutlineButton}>Annuler</button>}
                    </div>
                  </div>

                  <div style={{ ...styles.panelCard, marginTop: 18 }}>
                    <h3 style={styles.panelTitle}>🎉 Événements créés ({manageableClubEvents.length})</h3>
                    {manageableClubEvents.length === 0
                      ? <div style={styles.emptyState}>Aucun événement créé.</div>
                      : <div style={{ display: 'grid', gap: 10 }}>
                          {[...manageableClubEvents].sort((a, b) => a.event_date.localeCompare(b.event_date)).map((ev) => {
                            const d = new Date(ev.event_date);
                            const isPast = d < new Date();
                            const counts = getEventCounts(ev.id);
                            const typeLabel: Record<string, string> = { event: '📅', assembly: '🏛️', outing: '🎢', tournament: '🏆', other: '📌' };
                            const teamLabel = ev.team_ids?.length > 0 ? ev.team_ids.map(getTeamName).join(', ') : 'Tous';
                            return (
                              <div key={ev.id} style={{ padding: '14px 16px', borderRadius: 16, background: isPast ? '#f8f9fb' : '#f0f7ff', border: `1px solid ${isPast ? '#e2e8f0' : '#bfdbfe'}`, opacity: isPast ? 0.8 : 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 15, color: '#062C5D' }}>{typeLabel[ev.type] || '📅'} {ev.title}</div>
                                    <div style={{ fontSize: 13, color: '#5b6472', marginTop: 4 }}>{formatDate(ev.event_date)} {formatTime(ev.event_date)}{ev.location ? ` · ${ev.location}` : ''}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Catégories : {teamLabel}</div>
                                    {ev.description && <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{ev.description}</div>}
                                    {ev.payment_link && <div style={{ marginTop: 4 }}><a href={ev.payment_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0A5FB5', fontWeight: 700 }}>💳 Lien de paiement</a></div>}
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, fontWeight: 700 }}>
                                      <span style={{ color: '#16a34a' }}>✅ {counts.present} présents</span>
                                      <span style={{ color: '#dc2626' }}>❌ {counts.absent} absents</span>
                                      <span style={{ color: '#94a3b8' }}>⏳ {counts.pending} sans réponse</span>
                                    </div>
                                    {renderEventVoters(ev.id)}
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => {
                                      const existing = getQuestionsForEvent(ev.id);
                                      setEditingEventFormId(ev.id);
                                      setDraftFormQuestions(existing.map((q) => ({
                                        tempId: q.id, question: q.question, type: q.type,
                                        choices: q.choices || [], required: q.required,
                                      })));
                                    }} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 10px', background: '#7c3aed' }} title="Formulaire">📝</button>
                                    <button onClick={() => setViewingEventFormResultsId(ev.id === viewingEventFormResultsId ? '' : ev.id)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 10px', background: '#0891b2' }} title="Voir les réponses">📋</button>
                                    <button onClick={() => { setEditingEventId(ev.id); setNewEventTitle(ev.title); setNewEventDesc(ev.description || ''); setNewEventDate(ev.event_date.slice(0, 16)); setNewEventEndDate(ev.end_date?.slice(0, 16) || ''); setNewEventLocation(ev.location || ''); setNewEventType(ev.type); setNewEventTeamIds(ev.team_ids || []); setNewEventPaymentLink(ev.payment_link || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px' }}>✏️</button>
                                    <button onClick={() => deleteEvent(ev)} style={{ ...styles.linkRemoveButton, fontSize: 12 }}>🗑</button>
                                  </div>
                                </div>
                                {/* Affichage du nb de questions du formulaire */}
                                {(() => {
                                  const qs = getQuestionsForEvent(ev.id);
                                  if (qs.length === 0) return null;
                                  return <div style={{ marginTop: 6, fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>📝 {qs.length} question{qs.length > 1 ? 's' : ''} dans le formulaire</div>;
                                })()}
                                {/* Résultats du formulaire pour cet event */}
                                {viewingEventFormResultsId === ev.id && (() => {
                                  const qs = getQuestionsForEvent(ev.id);
                                  if (qs.length === 0) return <div style={{ marginTop: 12, padding: 12, background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, fontSize: 13, color: '#92400e' }}>Aucune question dans ce formulaire.</div>;
                                  return (
                                    <div style={{ marginTop: 12, padding: 12, background: 'white', border: '1px solid #bae6fd', borderRadius: 12 }}>
                                      <div style={{ fontWeight: 800, color: '#0c4a6e', marginBottom: 10 }}>📋 Réponses au formulaire</div>
                                      {qs.map((q) => {
                                        const responses = eventFormResponses.filter((r) => r.question_id === q.id);
                                        return (
                                          <div key={q.id} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #e0f2fe' }}>
                                            <div style={{ fontWeight: 700, color: '#0c4a6e', fontSize: 13, marginBottom: 6 }}>{q.question} <span style={{ color: '#94a3b8', fontSize: 11 }}>({q.type})</span></div>
                                            {responses.length === 0
                                              ? <div style={{ fontSize: 12, color: '#94a3b8' }}>Aucune réponse</div>
                                              : <div style={{ display: 'grid', gap: 4 }}>
                                                  {responses.map((r) => {
                                                    const player = players.find((p) => p.id === r.player_id);
                                                    return <div key={r.id} style={{ fontSize: 12, color: '#374151', padding: '4px 8px', background: '#f0f9ff', borderRadius: 6 }}>
                                                      <strong>{player ? getPlayerName(player) : '?'}</strong> : {formatEventFormAnswer(r.answer)} {r.responder_label && <span style={{ color: '#94a3b8' }}>— par {r.responder_label}</span>}
                                                    </div>;
                                                  })}
                                                </div>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>}
                  </div>

                  {/* ── Édition du formulaire de l'événement ── */}
                  {editingEventFormId && (() => {
                    const ev = clubEvents.find((e) => e.id === editingEventFormId);
                    return (
                      <div style={{ ...styles.formCard, marginTop: 18, background: '#f5f3ff', border: '1px solid #c4b5fd' }}>
                        <h3 style={{ ...styles.panelTitle, color: '#5b21b6' }}>📝 Formulaire pour : {ev?.title}</h3>
                        <p style={{ margin: '0 0 14px 0', fontSize: 13, color: '#6d28d9' }}>Ajoute des questions auxquelles les parents pourront répondre depuis l'événement.</p>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                          {draftFormQuestions.map((q, idx) => (
                            <div key={q.tempId} style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: 12, padding: 12 }}>
                              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#5b21b6', fontSize: 13 }}>Q{idx + 1}</span>
                                <input value={q.question} onChange={(e) => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, question: e.target.value } : x))} placeholder="Votre question" style={{ ...styles.input, padding: '8px 12px', minHeight: 38, fontSize: 14, flex: 1 }} />
                                <button onClick={() => setDraftFormQuestions((p) => p.filter((_, i) => i !== idx))} style={{ ...styles.linkRemoveButton, padding: '6px 10px', fontSize: 12 }}>🗑</button>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select value={q.type} onChange={(e) => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, type: e.target.value as any } : x))} style={{ ...styles.select, padding: '6px 12px', minHeight: 36, fontSize: 13, maxWidth: 180 }}>
                                  <option value="text">Texte libre</option>
                                  <option value="yesno">Oui / Non</option>
                                  <option value="choice">Choix unique</option>
                                  <option value="multi">Cases à cocher</option>
                                </select>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#5b21b6' }}>
                                  <input type="checkbox" checked={q.required} onChange={(e) => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} /> Obligatoire
                                </label>
                              </div>
                              {(q.type === 'choice' || q.type === 'multi') && (
                                <div style={{ marginTop: 8 }}>
                                  <label style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', display: 'block', marginBottom: 4 }}>Choix proposés :</label>
                                  {q.choices.map((c, ci) => (
                                    <div key={ci} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                                      <input value={c} onChange={(e) => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, choices: x.choices.map((cc, cci) => cci === ci ? e.target.value : cc) } : x))} placeholder={`Choix ${ci + 1}`} style={{ ...styles.input, padding: '6px 10px', minHeight: 34, fontSize: 13, flex: 1 }} />
                                      <button onClick={() => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, choices: x.choices.filter((_, cci) => cci !== ci) } : x))} style={{ ...styles.linkRemoveButton, padding: '4px 8px', fontSize: 11 }}>✕</button>
                                    </div>
                                  ))}
                                  <button onClick={() => setDraftFormQuestions((p) => p.map((x, i) => i === idx ? { ...x, choices: [...x.choices, ''] } : x))} style={{ ...styles.secondaryOutlineButton, fontSize: 12, padding: '6px 12px', marginTop: 4 }}>+ Ajouter un choix</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => setDraftFormQuestions((p) => [...p, { tempId: 'new-' + Date.now(), question: '', type: 'text', choices: [], required: false }])}
                            style={{ ...styles.secondaryOutlineButton, fontSize: 13 }}>+ Ajouter une question</button>
                          <button onClick={() => saveEventForm(editingEventFormId)} disabled={savingEventForm}
                            style={{ ...styles.primaryButton, background: '#7c3aed', fontSize: 13 }}>
                            {savingEventForm ? '...' : '💾 Enregistrer le formulaire'}
                          </button>
                          <button onClick={() => { setEditingEventFormId(''); setDraftFormQuestions([]); }}
                            style={{ ...styles.secondaryOutlineButton, fontSize: 13 }}>Annuler</button>
                        </div>
                      </div>
                    );
                  })()}
                </>}

                {/* ── SONDAGES ── */}
                {adminSubTab === 'polls' && <>
                  <div style={{ ...styles.formCard, background: '#fef3c7', border: '1px solid #fcd34d' }}>
                    <h3 style={{ ...styles.panelTitle, color: '#92400e' }}>{editingPollId ? '✏️ Modifier le sondage' : '📊 Créer un sondage'}</h3>
                    <p style={{ margin: '0 0 14px 0', fontSize: 13, color: '#92400e' }}>Le sondage sera visible par les catégories sélectionnées (parents et joueurs).</p>
                    <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                      <div>
                        <label style={styles.inputLabel}>Titre du sondage</label>
                        <input value={newPollQuestion} onChange={(e) => setNewPollQuestion(e.target.value)} style={styles.input} placeholder="Ex : Organisation tournoi de mai" />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Description (optionnel)</label>
                        <textarea value={newPollDescription} onChange={(e) => setNewPollDescription(e.target.value)} style={{ ...styles.input, minHeight: 60, resize: 'vertical' }} placeholder="Précisions sur le sondage" />
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Lien vers un sondage externe (optionnel)</label>
                        <input value={newPollExternalUrl} onChange={(e) => setNewPollExternalUrl(e.target.value)} style={styles.input} placeholder="https://forms.gle/..." />
                      </div>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <label style={styles.inputLabel}>Questions du sondage</label>
                        {newPollQuestions.map((q, qIdx) => (
                          <div key={q.id} style={{ padding: 12, borderRadius: 14, background: 'white', border: '1px solid #fde68a', display: 'grid', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input value={q.question} onChange={(e) => setNewPollQuestions((p) => p.map((x, i) => i === qIdx ? { ...x, question: e.target.value } : x))} placeholder={`Question ${qIdx + 1}`} style={{ ...styles.input, flex: 1 }} />
                              {newPollQuestions.length > 1 && (
                                <button onClick={() => setNewPollQuestions((p) => p.filter((_, i) => i !== qIdx))} style={{ ...styles.linkRemoveButton, padding: '6px 12px' }}>✕</button>
                              )}
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                              {q.options.map((opt, optIdx) => (
                                <div key={`${q.id}-${optIdx}`} style={{ display: 'flex', gap: 6 }}>
                                  <input value={opt} onChange={(e) => setNewPollQuestions((p) => p.map((x, i) => i === qIdx ? { ...x, options: x.options.map((o, oi) => oi === optIdx ? e.target.value : o) } : x))} placeholder={`Option ${optIdx + 1}`} style={{ ...styles.input, flex: 1 }} />
                                  {q.options.length > 2 && (
                                    <button onClick={() => setNewPollQuestions((p) => p.map((x, i) => i === qIdx ? { ...x, options: x.options.filter((_, oi) => oi !== optIdx) } : x))} style={{ ...styles.linkRemoveButton, padding: '6px 12px' }}>✕</button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                              <button onClick={() => setNewPollQuestions((p) => p.map((x, i) => i === qIdx ? { ...x, options: [...x.options, ''] } : x))} style={{ ...styles.secondaryOutlineButton, fontSize: 12, padding: '8px 14px' }}>+ Ajouter une option</button>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                                <input type="checkbox" checked={q.multiple_choice} onChange={(e) => setNewPollQuestions((p) => p.map((x, i) => i === qIdx ? { ...x, multiple_choice: e.target.checked } : x))} /> Plusieurs choix
                              </label>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => setNewPollQuestions((p) => [...p, { id: `q-${Date.now()}`, question: '', options: ['', ''], multiple_choice: false }])} style={{ ...styles.secondaryOutlineButton, fontSize: 13 }}>+ Ajouter une question</button>
                      </div>
                      <div>
                        <label style={styles.inputLabel}>Catégories concernées (vide = {isAdmin ? 'toutes' : 'vos équipes'})</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginTop: 8 }}>
                          {eventPollTeams.map((t) => (
                            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `2px solid ${newPollTeamIds.includes(t.id) ? '#92400e' : '#fde68a'}`, background: newPollTeamIds.includes(t.id) ? '#fde68a' : '#fffbeb', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                              <input type="checkbox" checked={newPollTeamIds.includes(t.id)} onChange={() => setNewPollTeamIds((p) => p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id])} style={{ accentColor: '#92400e' }} />
                              {t.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={addPoll} disabled={savingPoll} style={{ ...styles.primaryButton, background: '#92400e' }}>{savingPoll ? '...' : editingPollId ? '💾 Enregistrer' : '➕ Envoyer le sondage'}</button>
                      {editingPollId && (
                        <button onClick={resetPollForm} style={styles.secondaryOutlineButton}>Annuler</button>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.panelCard, marginTop: 18 }}>
                    <h3 style={styles.panelTitle}>📋 Sondages créés ({manageablePolls.length})</h3>
                    {manageablePolls.length === 0
                      ? <div style={styles.emptyState}>Aucun sondage créé.</div>
                      : <div style={{ display: 'grid', gap: 10 }}>
                          {manageablePolls.map((poll) => {
                            const pollQuestions = normalizePollQuestions(poll);
                            const totalVotes = pollVotes.filter((v) => v.poll_id === poll.id).length;
                            const targetTeams = poll.team_ids.length === 0 ? 'Toutes' : poll.team_ids.map(getTeamName).join(', ');
                            const showResults = viewingPollResultsId === poll.id;
                            return (
                              <div key={poll.id} style={{ padding: '14px 16px', borderRadius: 16, background: poll.closed ? '#f8f9fb' : '#fffbeb', border: `1px solid ${poll.closed ? '#e2e8f0' : '#fcd34d'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 900, fontSize: 15, color: '#062C5D' }}>{poll.question}</div>
                                    {poll.description && <div style={{ fontSize: 13, color: '#5b6472', marginTop: 4 }}>{poll.description}</div>}
                                    {poll.external_url && <a href={poll.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 800, color: '#0A5FB5' }}>Ouvrir le sondage externe</a>}
                                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Catégories : {targetTeams} · {pollQuestions.length} question{pollQuestions.length > 1 ? 's' : ''} · {totalVotes} vote{totalVotes > 1 ? 's' : ''}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => setViewingPollResultsId(showResults ? '' : poll.id)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px', background: '#0891b2' }}>{showResults ? '🔽' : '📊'}</button>
                                    <button onClick={() => togglePollClosed(poll.id, poll.closed)} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px', background: poll.closed ? '#16a34a' : '#dc2626' }}>{poll.closed ? '🔓' : '🔒'}</button>
                                    <button onClick={() => {
                                      setEditingPollId(poll.id); setNewPollQuestion(poll.question); setNewPollDescription(poll.description || '');
                                      setNewPollExternalUrl(poll.external_url || '');
                                      setNewPollQuestions(normalizePollQuestions(poll).map((q, idx) => ({ ...q, id: q.id || `q-${idx + 1}`, options: q.options.length >= 2 ? q.options : ['', ''] })));
                                      setNewPollOptions(pollOptions.filter((o) => o.poll_id === poll.id).map((o) => o.label)); setNewPollTeamIds(poll.team_ids || []); setNewPollMultiple(poll.multiple_choice);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} style={{ ...styles.secondaryButton, fontSize: 12, padding: '7px 12px' }}>✏️</button>
                                    <button onClick={() => deletePoll(poll.id)} style={{ ...styles.linkRemoveButton, fontSize: 12 }}>🗑</button>
                                  </div>
                                </div>
                                {showResults && (
                                  <div style={{ marginTop: 12, padding: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                                    {pollQuestions.map((q) => {
                                      const qOptions = getPollOptionsForQuestion(poll.id, q.id);
                                      const qVotes = pollVotes.filter((v) => qOptions.some((o) => o.id === v.option_id));
                                      const qTotal = qVotes.length;
                                      return (
                                        <div key={q.id} style={{ marginBottom: 14 }}>
                                          <div style={{ fontWeight: 900, color: '#062C5D', marginBottom: 8 }}>{q.question}</div>
                                          {qOptions.map((o) => {
                                            const optVotes = qVotes.filter((v) => v.option_id === o.id);
                                            const percent = qTotal > 0 ? Math.round((optVotes.length / qTotal) * 100) : 0;
                                            return (
                                              <div key={o.id} style={{ marginBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#10233b', marginBottom: 4 }}>
                                                  <span>{o.label}</span>
                                                  <span>{optVotes.length} ({percent}%)</span>
                                                </div>
                                                <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                                  <div style={{ width: `${percent}%`, height: '100%', background: '#0A5FB5' }} />
                                                </div>
                                                {optVotes.length > 0 && (
                                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                                                    {optVotes.map((v) => v.voter_label || '?').join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>}
                  </div>
                </>}

                {/* ── EN LIGNE ── */}
                {adminSubTab === 'online' && (() => {
                  const counts = getOnlineCounts();
                  const connectionStats = getConnectionStats();
                  return <>
                    {presenceHistoryError && (
                      <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 14, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 13, fontWeight: 700 }}>
                        Historique Supabase non enregistré : {presenceHistoryError}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 10, marginBottom: 12 }}>
                      {[
                        { label: '🟢 En ligne maintenant', value: counts.total, bg: '#dcfce7', color: '#166534' },
                        { label: '👪 Parents en ligne', value: counts.parents, bg: '#dbeafe', color: '#1e40af' },
                        { label: '🤾 Joueurs en ligne', value: counts.players, bg: '#ede9fe', color: '#5b21b6' },
                        { label: '🏆 Coachs en ligne', value: counts.coaches, bg: '#fef3c7', color: '#92400e' },
                        { label: '⚙️ Admins en ligne', value: counts.admins, bg: '#fee2e2', color: '#991b1b' },
                      ].map((s) => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid rgba(0,0,0,0.04)', minWidth: 0 }}>
                          <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginTop: 4, opacity: 0.85, lineHeight: 1.2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(118px,1fr))', gap: 10, marginBottom: 18 }}>
                      {[
                        { label: '📊 Connexions totales', value: connectionStats.totals.total, bg: '#f1f5f9', color: '#334155' },
                        { label: '👪 Connexions parents', value: connectionStats.totals.parents, bg: '#eff6ff', color: '#1e40af' },
                        { label: '🤾 Connexions joueurs', value: connectionStats.totals.players, bg: '#f5f3ff', color: '#5b21b6' },
                        { label: '🏆 Connexions coachs', value: connectionStats.totals.coaches, bg: '#fffbeb', color: '#92400e' },
                        { label: '⚙️ Connexions admins', value: connectionStats.totals.admins, bg: '#fef2f2', color: '#991b1b' },
                      ].map((s) => (
                        <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: 12, textAlign: 'center', border: '1px solid rgba(0,0,0,0.04)', minWidth: 0 }}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginTop: 4, opacity: 0.85, lineHeight: 1.2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ ...styles.panelCard, marginBottom: 16 }}>
                      <h3 style={styles.panelTitle}>📈 Connexions sur 7 jours</h3>
                      {connectionStats.daily.length === 0 ? (
                        <div style={styles.emptyState}>Pas encore d'historique de connexion.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {connectionStats.daily.map((day) => (
                            <div key={day.day} style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                              <div style={{ fontWeight: 900, color: '#10233b', fontSize: 12, textTransform: 'capitalize' }}>{day.day}</div>
                              <div style={{ height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(8, Math.min(100, day.total * 12))}%`, height: '100%', background: '#0A5FB5', borderRadius: 999 }} />
                              </div>
                              <div style={{ fontWeight: 900, color: '#0A5FB5', fontSize: 12, whiteSpace: 'nowrap' }}>{day.users} pers.</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ ...styles.panelCard, marginBottom: 16 }}>
                      <h3 style={styles.panelTitle}>👥 Utilisateurs actuellement connectés</h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#94a3b8' }}>Considéré "en ligne" si vu il y a moins de 2 minutes.</p>
                      {counts.list.length === 0
                        ? <div style={styles.emptyState}>Personne n'est en ligne pour le moment.</div>
                        : <div style={{ display: 'grid', gap: 6 }}>
                            {counts.list.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()).map((p) => {
                              const roleColor = p.role === 'admin' ? '#dc2626' : p.role === 'coach' ? '#92400e' : p.role === 'player' ? '#5b21b6' : '#1e40af';
                              const roleBg = p.role === 'admin' ? '#fee2e2' : p.role === 'coach' ? '#fef3c7' : p.role === 'player' ? '#ede9fe' : '#dbeafe';
                              const ago = Math.floor((Date.now() - new Date(p.last_seen).getTime()) / 1000);
                              return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#10233b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || 'Utilisateur sans nom'}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Vu il y a {ago < 60 ? `${ago}s` : `${Math.floor(ago / 60)}min`}</div>
                                  </div>
                                  <span style={{ background: roleBg, color: roleColor, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{p.role}</span>
                                </div>
                              );
                            })}
                          </div>}
                    </div>
                    <div style={styles.panelCard}>
                      <h3 style={styles.panelTitle}>🕘 Historique récent</h3>
                      <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#94a3b8' }}>Conservé sur les derniers jours. Si Supabase bloque l'historique, l'app garde un secours local sur cet appareil et affiche l'erreur au-dessus.</p>
                      {connectionStats.history.length === 0 ? (
                        <div style={styles.emptyState}>Aucune activité récente.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 6, maxHeight: 360, overflowY: 'auto', paddingRight: 2 }}>
                          {connectionStats.history.slice(0, 120).map((p, idx) => {
                            const roleColor = p.role === 'admin' ? '#dc2626' : p.role === 'coach' ? '#92400e' : p.role === 'player' ? '#5b21b6' : '#1e40af';
                            const roleBg = p.role === 'admin' ? '#fee2e2' : p.role === 'coach' ? '#fef3c7' : p.role === 'player' ? '#ede9fe' : '#dbeafe';
                            return (
                              <div key={`${p.auth_id}-${p.seen_at}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, minWidth: 0 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 900, fontSize: 13, color: '#10233b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || 'Utilisateur sans nom'}</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{new Date(p.seen_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <span style={{ background: roleBg, color: roleColor, padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.role}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>;
                })()}

              </div>
            )}
          </>
        )}

        {/* Modale plein écran de carte FIFA — partagée parent + coach */}
        {fullScreenCardData && (
          <FullScreenCard
            cards={fullScreenCardData.cards}
            initialIndex={fullScreenCardData.index}
            onClose={() => setFullScreenCardData(null)}
            clubLogo={CLUB_LOGO}
          />
        )}

        {/* ─── VUE PARENT ───────────────────────────────────────────────────── */}
        {activeRole === 'parent' && sponsors.length > 0 && (() => {
          const sponsor = sponsors[currentSponsorIdx % sponsors.length];
          return (
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e9d5ff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 3px 16px rgba(147,51,234,0.10)', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#c4b5fd', letterSpacing: 1, textTransform: 'uppercase' as const, flexShrink: 0, writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)' }}>Partenaire</div>
              <a href={sponsor.website_url || undefined} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textDecoration: 'none' }}>
                <img src={sponsor.photo_url} alt={sponsor.name}
                  style={{ width: '100%', maxWidth: 340, height: 'auto', objectFit: 'contain' }} />
              </a>
              {sponsors.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {sponsors.map((_, i) => (
                    <div key={i} onClick={() => setCurrentSponsorIdx(i)}
                      style={{ width: 7, height: 7, borderRadius: '50%', background: i === currentSponsorIdx % sponsors.length ? '#9333ea' : '#e9d5ff', cursor: 'pointer', transition: 'background 0.2s' }} />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        {activeRole === 'parent' && parentPlayers.length > 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(116px, 1fr))',
            gap: 10,
            marginBottom: 14,
            padding: 10,
            borderRadius: 20,
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid #dbe6f2',
            boxShadow: '0 8px 20px rgba(16,35,59,0.08)',
          }}>
            {parentPlayers.map((child) => {
              const activeChildId = parentChildTab || parentPlayers[0]?.id;
              const isActive = child.id === activeChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => setParentChildTab(child.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: 48,
                    padding: '8px 10px',
                    borderRadius: 14,
                    border: isActive ? '2px solid #0A5FB5' : '1px solid #d8e5f2',
                    background: isActive ? '#eaf4ff' : '#f8fbff',
                    color: isActive ? '#0A5FB5' : '#475569',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {child.photo_url
                    ? <img src={child.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ fontSize: 18 }}>👤</span>}
                  <span>{child.first_name || getPlayerName(child)}</span>
                </button>
              );
            })}
          </div>
        )}
        {activeRole === 'parent' && (
          <div style={styles.contentCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <h2 style={{ ...styles.blockTitle, margin: 0 }}>Espace Parent</h2>
              <button
                onClick={() => setParentTab('password')}
                title="Changer le mot de passe"
                aria-label="Changer le mot de passe"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: '1px solid #dbe6f2',
                  background: parentTab === 'password' ? '#eaf4ff' : '#f8fbff',
                  color: '#0A5FB5',
                  fontSize: 17,
                  cursor: 'pointer',
                  boxShadow: parentTab === 'password' ? '0 4px 12px rgba(10,95,181,0.12)' : 'none',
                }}
              >
                🔑
              </button>
            </div>

            {/* Boutons parent */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))', gap: 10, marginBottom: 20 }}>
              {(() => {
                const tabs: { key: 'home' | 'team' | 'trainings' | 'matches' | 'events' | 'polls'; label: string }[] = [
                  { key: 'home', label: '👪 Mon espace' },
                  { key: 'team', label: '👕 Mon équipe' },
                  { key: 'trainings', label: '🏃 Entraînements' },
                  { key: 'matches', label: '⚽ Matchs' },
                  { key: 'events', label: '🎉 Événements' },
                ];
                // Onglet sondages si au moins un sondage me concerne
                const myTeamIds = [...new Set(parentPlayers.map((p) => getPlayerTeamIdForSeason(p, parentSelectedSeasonId)).filter(Boolean) as string[])];
                if (linkedPlayerId) {
                  const me = players.find((p) => p.id === linkedPlayerId);
                  if (me?.team_id) myTeamIds.push(getPlayerTeamIdForSeason(me, parentSelectedSeasonId));
                }
                const visiblePolls = getPollsVisibleFor([...new Set(myTeamIds)]);
                if (visiblePolls.length > 0) tabs.push({ key: 'polls', label: '📊 Sondages' });
                return tabs.map(({ key: tab, label }) => {
                  const hasUnread = tab === 'home' && getUnreadMessageConversations().length > 0;
                  // Pastille sondages : nb sondages où je n'ai pas voté
                  const pollBadge = tab === 'polls' && (() => {
                    const playerId = linkedPlayerId;
                    return visiblePolls.filter((p) => {
                      if (p.closed) return false;
                      const myVotes = getMyVotesForPoll(p.id, selectedParentId, playerId);
                      return normalizePollQuestions(p).some((q) => {
                        const qOptions = getPollOptionsForQuestion(p.id, q.id);
                        return !qOptions.some((o) => myVotes.includes(o.id));
                      });
                    }).length;
                  })();
                  return (
                    <button key={tab} onClick={() => setParentTab(tab)}
                      style={{ minHeight: 48, padding: '10px 12px', borderRadius: 14, border: parentTab === tab ? '2px solid #0A5FB5' : '1px solid #d6e1ec', background: parentTab === tab ? '#0A5FB5' : 'white', fontWeight: 900, fontSize: 14, cursor: 'pointer', color: parentTab === tab ? 'white' : '#16304c', boxShadow: parentTab === tab ? '0 8px 18px rgba(10,95,181,0.18)' : 'none', transition: 'all 0.15s', position: 'relative', whiteSpace: 'normal', lineHeight: 1.15 }}>
                      {label}
                      {hasUnread && (
                        <span style={{ position: 'absolute', top: 4, right: 4, background: '#dc2626', borderRadius: '50%', width: 10, height: 10, display: 'inline-block', boxShadow: '0 1px 4px rgba(220,38,38,0.5)' }} />
                      )}
                      {!!pollBadge && pollBadge > 0 && (
                        <span style={{ position: 'absolute', top: 2, right: 2, background: '#dc2626', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 900, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>{pollBadge}</span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* ── MON ÉQUIPE côté parent ── */}
            {parentTab === 'team' && (() => {
              // Récupérer toutes les équipes des enfants liés
              const parentTeamIds = [...new Set(parentPlayers.map((p) => getPlayerTeamIdForSeason(p, parentSelectedSeasonId)))];
              const seasonForFilter = parentSelectedSeasonId;
              return (
                <div style={{ display: 'grid', gap: 24 }}>
                  {parentTeamIds.map((teamId) => {
                    const team = teams.find((t) => t.id === teamId);
                    const teamPlayers = getPlayersForTeamSeason(teamId, seasonForFilter);
                    if (!team || teamPlayers.length === 0) return null;
                    return (
                      <div key={teamId}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <h3 style={{ margin: 0, color: '#062C5D', fontSize: 18, fontWeight: 800 }}>{team.name}</h3>
                          <button onClick={() => setShowGradeModal(true)}
                            style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid #a855f7', background: '#f5f3ff', color: '#7c3aed', fontWeight: 900, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            title="Voir les grades">?</button>
                        </div>

                        {/* ── Stats globales équipe ── */}
                        {(() => {
                          const tmStats = seasonForFilter
                            ? teamPlayers.flatMap((p) => getMatchPlayerStatsForSeason(p.id, seasonForFilter))
                            : matchPlayerStats.filter((s) => teamPlayers.some((p) => p.id === s.player_id));
                          const tmGoals  = tmStats.reduce((a, s) => a + (s.goals  || 0), 0);
                          const tmShots  = tmStats.reduce((a, s) => a + (s.shots  || 0), 0);
                          const tmMatchIds = [...new Set(tmStats.map((s) => s.match_id))].length;
                          const tmPct    = tmShots > 0 ? Math.round((tmGoals / tmShots) * 100) : 0;
                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 10, marginBottom: 18 }}>
                              {[
                                { label: '⚽ Matchs joués', value: tmMatchIds, bg: '#dbeafe', color: '#1e40af' },
                                { label: '🎯 Buts marqués', value: tmGoals,    bg: '#dcfce7', color: '#166534' },
                                { label: '🏹 Tirs tentés',  value: tmShots,    bg: '#ede9fe', color: '#5b21b6' },
                                { label: '📊 % Réussite',   value: tmShots > 0 ? `${tmPct}%` : '-', bg: tmPct >= 50 ? '#dcfce7' : '#fef3c7', color: tmPct >= 50 ? '#166534' : '#92400e' },
                              ].map((stat) => (
                                <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: stat.color, opacity: 0.8, lineHeight: 1.3, marginTop: 3 }}>{stat.label}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {(() => {
                          const teamCards = buildFifaCardsForTeam(teamId, true, seasonForFilter);
                          const activeChildId = parentChildTab || parentPlayers[0]?.id;
                          const selectedCardIndex = Math.max(0, teamCards.findIndex((c) => c.player.id === activeChildId));
                          const selectedCard = teamCards[selectedCardIndex] || teamCards[0];
                          if (!selectedCard) return null;
                          return (
                            <>
                              <div style={{ ...styles.panelCard, marginBottom: 14, background: '#fffdf4', border: '1px solid #fde68a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, color: '#062C5D', fontSize: 16 }}>Carte joueur</h4>
                                  <span style={{ fontSize: 12, color: '#92400e', fontWeight: 800 }}>Clique sur la carte pour voir toute l'équipe</span>
                                </div>
                                <div style={{ width: 'min(100%, 320px)', margin: '0 auto' }}>
                                  <FifaPlayerCard
                                    player={selectedCard.player}
                                    totalTrainingPresences={selectedCard.totalTrainingPresences}
                                    totalGoals={selectedCard.totalGoals}
                                    totalShots={selectedCard.totalShots}
                                    totalMatches={selectedCard.totalMatches}
                                    isMyChild={selectedCard.isMyChild}
                                    hideStats={selectedCard.hideStats}
                                    age={selectedCard.age}
                                    clubLogo={CLUB_LOGO}
                                    onClick={() => setFullScreenCardData({ cards: teamCards, index: selectedCardIndex })}
                                  />
                                </div>
                                {selectedCard.isMyChild && (
                                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #fde68a' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                                      <strong style={{ color: '#062C5D', fontSize: 14 }}>Mes 3 super pouvoirs</strong>
                                      <span style={{ color: '#92400e', fontSize: 12, fontWeight: 800 }}>{(selectedCard.player.card_powers || []).length}/3</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                                      {HANDBALL_POWERS.map((power) => {
                                        const selected = (selectedCard.player.card_powers || []).includes(power.id);
                                        return (
                                          <button key={power.id} onClick={() => togglePlayerCardPower(selectedCard.player, power.id)}
                                            style={{ minHeight: 42, padding: '8px 10px', borderRadius: 12, border: `2px solid ${selected ? '#0A5FB5' : '#dbe4ef'}`, background: selected ? '#eaf4ff' : 'white', color: '#10233b', fontWeight: 900, fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                                            <span style={{ fontSize: 15, marginRight: 5 }}>{power.icon}</span>{power.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div style={{ ...styles.panelCard, marginTop: 10 }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#062C5D', fontSize: 16 }}>Liste de l'équipe</h4>
                                <div style={{ display: 'grid', gap: 10 }}>
                                  {teamPlayers
                                    .slice()
                                    .sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr'))
                                    .map((player) => {
                                      const isMyChild = parentPlayers.some((child) => child.id === player.id);
                                      const initials = `${player.first_name?.[0] || ''}${player.last_name?.[0] || ''}`.toUpperCase();
                                      return (
                                        <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, background: isMyChild ? '#eaf4ff' : 'white', border: isMyChild ? '2px solid #0A5FB5' : '1px solid #d8e5f2' }}>
                                          {player.photo_url
                                            ? <img src={player.photo_url} alt={getPlayerName(player)} style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 1px 6px rgba(16,35,59,0.16)' }} />
                                            : <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{initials || '👤'}</div>}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 900, color: '#10233b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {player.first_name} {player.last_name?.toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                              {player.position || 'Poste non défini'}{player.jersey_number != null ? ` · #${player.jersey_number}` : ''}
                                            </div>
                                          </div>
                                          {isMyChild && <span style={{ fontSize: 11, fontWeight: 900, color: '#0A5FB5', background: 'white', borderRadius: 999, padding: '4px 8px' }}>Mon enfant</span>}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── MODALE GRADES ── */}
            {showGradeModal && <GradeModal onClose={() => setShowGradeModal(false)} />}

            {/* ── MON PROFIL JOUEUR (si user est aussi joueur) ── */}
            {parentTab === 'player' && hasPlayerRole && (() => {
              const me = linkedPlayerId ? players.find((p) => p.id === linkedPlayerId) : null;
              if (!me) {
                return (
                  <div style={styles.emptyState}>
                    Aucun profil joueur n'est rattaché à ton compte. Contacte l'administrateur.
                  </div>
                );
              }
              const myTeamIdForSeason = getPlayerTeamIdForSeason(me, parentSelectedSeasonId);
              const myMatches = matches
                .filter((m) => (m.team_id === myTeamIdForSeason || (matchSquad[m.id] || []).includes(me.id)) && isFutureOrToday(m.match_date))
                .sort((a, b) => (a.match_date || '').localeCompare(b.match_date || ''))
                .slice(0, 5);
              const myStatsRows = getMatchPlayerStatsForSeason(me.id, parentSelectedSeasonId);
              const totalGoals = myStatsRows.reduce((acc, s) => acc + (s.goals || 0), 0);
              const totalShots = myStatsRows.reduce((acc, s) => acc + (s.shots || 0), 0);
              const totalSaves = myStatsRows.reduce((acc, s) => acc + (s.saves || 0), 0);
              const totalMatches = new Set(myStatsRows.map((s) => s.match_id)).size;
              const trainingPresences = getTrainingPresentCount(me.id, parentSelectedSeasonId);
              const totalTrainings = myTeamIdForSeason ? getTrainingTotalCount(myTeamIdForSeason, parentSelectedSeasonId) : 0;
              return (
                <div style={{ display: 'grid', gap: 18 }}>
                  <div style={styles.profileCard}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {me.photo_url
                        ? <img src={me.photo_url} alt={getPlayerName(me)} style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0A5FB5' }} />
                        : <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', fontWeight: 800 }}>
                            {`${me.first_name?.[0] || ''}${me.last_name?.[0] || ''}`.toUpperCase()}
                          </div>}
                      {me.jersey_number != null && (
                        <div style={{ position: 'absolute', bottom: -4, left: -4, width: 26, height: 26, borderRadius: '50%', background: '#062C5D', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white' }}>
                          {me.jersey_number}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0' }}>{getPlayerName(me)}</h3>
                      <p style={{ margin: 0, color: '#5b6472' }}>Équipe : <strong>{getPlayerSeasonTeamName(me, parentSelectedSeasonId)}</strong></p>
                      {me.birth_date && <p style={{ margin: '4px 0 0 0', color: '#5b6472', fontSize: 13 }}>🎂 {getPlayerAge(me.birth_date)} ans</p>}
                    </div>
                  </div>

                  <div style={{ ...styles.panelCard }}>
                    <h3 style={styles.panelTitle}>📊 Mes statistiques</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10 }}>
                      {[
                        ['🏃 Présences entraînement', `${trainingPresences} / ${totalTrainings}`],
                        ['⚽ Matchs joués', String(totalMatches)],
                        ['🎯 Buts', String(totalGoals)],
                        ['🏹 Tirs', String(totalShots)],
                        ['🧤 Arrêts', String(totalSaves)],
                      ].map(([lab, val]) => (
                        <div key={lab} style={{ background: '#f0f7ff', borderRadius: 14, padding: '12px 10px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#1e40af' }}>{val}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#1e40af', opacity: 0.85, marginTop: 3 }}>{lab}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...styles.panelCard }}>
                    <h3 style={styles.panelTitle}>📅 Mes prochains matchs</h3>
                    {myMatches.length === 0
                      ? <div style={styles.emptyStateSmall}>Aucun match prévu.</div>
                      : <div style={{ display: 'grid', gap: 8 }}>
                          {myMatches.map((m) => {
                            const inSquad = (matchSquad[m.id] || []).includes(me.id);
                            return (
                              <div key={m.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'white', border: `1px solid ${inSquad ? '#bfdbfe' : '#dde7f2'}` }}>
                                <div style={{ fontWeight: 800, color: '#062C5D' }}>vs {m.opponent}</div>
                                <div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{formatDate(m.match_date)} {formatTime(m.match_date)} · {m.location || '-'}</div>
                                {inSquad && <div style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, marginTop: 4 }}>📣 Tu es convoqué !</div>}
                              </div>
                            );
                          })}
                        </div>}
                  </div>
                </div>
              );
            })()}

            {/* ── SONDAGES côté parent/joueur ── */}
            {parentTab === 'polls' && (() => {
              const myTeamIds: string[] = [...new Set(parentPlayers.map((p) => getPlayerTeamIdForSeason(p, parentSelectedSeasonId)).filter(Boolean) as string[])];
              if (linkedPlayerId) {
                const me = players.find((p) => p.id === linkedPlayerId);
                if (me?.team_id) myTeamIds.push(getPlayerTeamIdForSeason(me, parentSelectedSeasonId));
              }
              const visiblePolls = getPollsVisibleFor([...new Set(myTeamIds)]);
              const voterUserId = selectedParentId;
              const voterPlayerId = linkedPlayerId;
              const voterLabel = (() => {
                const u = users.find((x) => x.id === selectedParentId);
                if (u) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
                if (linkedPlayerId) {
                  const p = players.find((x) => x.id === linkedPlayerId);
                  if (p) return getPlayerName(p);
                }
                return 'Anonyme';
              })();
              return (
                <div style={{ display: 'grid', gap: 14 }}>
                  {visiblePolls.length === 0
                    ? <div style={styles.emptyState}>Aucun sondage disponible pour le moment.</div>
                    : visiblePolls.map((poll) => {
                        const pollQuestions = normalizePollQuestions(poll);
                        const myVotes = getMyVotesForPoll(poll.id, voterUserId, voterPlayerId);
                        const totalVotes = pollVotes.filter((v) => v.poll_id === poll.id).length;
                        const hasVoted = myVotes.length > 0;
                        return (
                          <div key={poll.id} style={{ ...styles.panelCard, background: poll.closed ? '#f8f9fb' : 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <h3 style={{ margin: '0 0 4px 0', color: '#062C5D' }}>{poll.question}</h3>
                                {poll.description && <p style={{ margin: 0, color: '#5b6472', fontSize: 13 }}>{poll.description}</p>}
                                {poll.external_url && (
                                  <a href={poll.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, padding: '8px 12px', borderRadius: 10, background: '#0A5FB5', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 900 }}>
                                    Ouvrir le sondage externe
                                  </a>
                                )}
                              </div>
                              {poll.closed && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>FERMÉ</span>}
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                              {pollQuestions.map((q) => {
                                const qOptions = getPollOptionsForQuestion(poll.id, q.id);
                                const qVotes = pollVotes.filter((v) => qOptions.some((o) => o.id === v.option_id));
                                const qTotal = qVotes.length;
                                return (
                                  <div key={q.id} style={{ display: 'grid', gap: 8, padding: pollQuestions.length > 1 ? 12 : 0, borderRadius: 14, background: pollQuestions.length > 1 ? '#f8fafc' : 'transparent' }}>
                                    <div style={{ fontWeight: 900, color: '#062C5D', fontSize: 15 }}>{q.question}</div>
                                    {qOptions.map((o) => {
                                      const optVotes = qVotes.filter((v) => v.option_id === o.id).length;
                                      const pct = qTotal > 0 ? Math.round((optVotes / qTotal) * 100) : 0;
                                      const selected = myVotes.includes(o.id);
                                      const selectedInQuestion = myVotes.filter((id) => qOptions.some((qo) => qo.id === id));
                                      return (
                                        <button key={o.id} disabled={poll.closed}
                                          onClick={async () => {
                                            if (poll.closed) return;
                                            let next: string[] = [];
                                            if (q.multiple_choice) {
                                              next = selected ? selectedInQuestion.filter((x) => x !== o.id) : [...selectedInQuestion, o.id];
                                            } else {
                                              next = selected ? [] : [o.id];
                                            }
                                            await votePollQuestion(poll.id, next, qOptions.map((qo) => qo.id), voterUserId || null, voterPlayerId || null, voterLabel);
                                          }}
                                          style={{ position: 'relative', textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: `2px solid ${selected ? '#0A5FB5' : '#cfd8e3'}`, background: selected ? '#eaf4ff' : 'white', cursor: poll.closed ? 'not-allowed' : 'pointer', overflow: 'hidden', fontWeight: 700, color: '#10233b' }}>
                                          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${selected ? '#bfdbfe' : '#e0eaf5'} ${pct}%, transparent ${pct}%)`, opacity: selectedInQuestion.length > 0 ? 0.45 : 0, transition: 'opacity 0.2s' }} />
                                          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                            <span>{selected ? '✅ ' : ''}{o.label}</span>
                                            {selectedInQuestion.length > 0 && <span style={{ fontSize: 13, color: '#5b6472', fontWeight: 800 }}>{pct}% ({optVotes})</span>}
                                          </div>
                                        </button>
                                      );
                                    })}
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                                      {qTotal} réponse{qTotal > 1 ? 's' : ''}{q.multiple_choice ? ' · plusieurs choix possibles' : ''}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: '#5b6472' }}>
                              {totalVotes} vote{totalVotes > 1 ? 's' : ''} au total
                            </div>
                          </div>
                        );
                      })}
                </div>
              );
            })()}

            {/* ── MOT DE PASSE PARENT ── */}
            {parentTab === 'password' && (
              <div style={{ maxWidth: 480 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#10233b' }}>🔑 Changer mon mot de passe</h3>
                <p style={{ margin: '0 0 18px 0', color: '#5b6472', fontSize: 14 }}>Modifiez le mot de passe de votre compte.</p>
                {changePwSuccess ? (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: 15, marginBottom: 8 }}>Mot de passe modifié !</div>
                    <button onClick={() => { setChangePwSuccess(false); setNewPassword(''); setNewPassword2(''); }}
                      style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 800, cursor: 'pointer' }}>OK</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={styles.inputLabel}>Nouveau mot de passe (min. 8 caractères)</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••" autoComplete="new-password" style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Confirmer le mot de passe</label>
                      <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}
                        placeholder="••••••••" autoComplete="new-password" style={styles.input}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()} />
                    </div>
                    {changePwError && (
                      <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontWeight: 700, fontSize: 14 }}>
                        {changePwError}
                      </div>
                    )}
                    <button onClick={handleChangePassword} disabled={changePwLoading || !newPassword || !newPassword2}
                      style={{ ...styles.primaryButton, opacity: changePwLoading || !newPassword || !newPassword2 ? 0.6 : 1 }}>
                      {changePwLoading ? '⏳ Enregistrement...' : '✅ Enregistrer le nouveau mot de passe'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── MON ESPACE / ENTRAÎNEMENTS / MATCHS / ÉVÉNEMENTS ── */}
            {(['home', 'trainings', 'matches', 'events'] as const).includes(parentTab as any) && (
            <>{parentPlayers.length === 0
              ? <div style={styles.emptyState}>{"Aucun enfant lié à ce compte parent."}</div>
              : (
                <>
                  <div style={{ display: 'grid', gap: 18 }}>
                  {parentPlayers
                    .filter((child) => parentPlayers.length <= 1 || child.id === (parentChildTab || parentPlayers[0].id))
                    .map((child) => {
                    const childTeamIdForSeason = getPlayerTeamIdForSeason(child, parentSelectedSeasonId);
                    const childTeam = teams.find((t) => t.id === childTeamIdForSeason) || null;
                    // Include own team matches + guest matches where child is convoqued
                    const ownMatches = matches.filter((m) => m.team_id === childTeamIdForSeason && isFutureOrToday(m.match_date));
                    const guestMatches = matches.filter((m) => m.team_id !== childTeamIdForSeason && isFutureOrToday(m.match_date) && (matchSquad[m.id] || []).includes(child.id));
                    const childMatches = [...ownMatches, ...guestMatches].sort((a, b) => (a.match_date || '').localeCompare(b.match_date || '')).slice(0, 3);
                    const childTournaments = getTournamentsForTeam(childTeamIdForSeason).slice(0, 3);
                    const childTemplates = trainingTemplates.filter((t) => t.team_id === childTeamIdForSeason && t.active !== false);
                    const childUpcomingTrainings: UpcomingTraining[] = childTemplates.flatMap((template) =>
                      getNextTrainingsForTemplate(template, 6, true)
                    ).sort((a, b) => a.date.localeCompare(b.date));

                    return (
                      <div key={child.id} style={styles.childSection}>
                        {parentTab === 'home' && (
                          <>
                        <div style={styles.profileCard}>
                          {/* Photo de profil avec upload */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {child.photo_url
                              ? <img src={child.photo_url} alt={getPlayerName(child)} style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0A5FB5' }} />
                              : <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', fontWeight: 800 }}>
                                  {`${child.first_name?.[0] || ''}${child.last_name?.[0] || ''}`.toUpperCase()}
                                </div>
                            }
                            {/* Badge numéro de maillot */}
                            {child.jersey_number != null && (
                              <div style={{ position: 'absolute', bottom: -4, left: -4, width: 26, height: 26, borderRadius: '50%', background: '#062C5D', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>
                                {child.jersey_number}
                              </div>
                            )}
                            <label htmlFor={`photo-${child.id}`} style={{ position: 'absolute', bottom: -2, right: -2, background: '#0A5FB5', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} title="Changer la photo">📷</label>
                            <input id={`photo-${child.id}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingPhoto(true);
                              await uploadPlayerPhoto(child.id, file);
                              setUploadingPhoto(false);
                              e.target.value = ''; // reset input
                            }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0' }}>{getPlayerName(child)}</h3>
                            <p style={{ margin: 0, color: '#5b6472' }}>Équipe : <strong>{getPlayerSeasonTeamName(child, parentSelectedSeasonId)}</strong></p>
                            {child.birth_date && <p style={{ margin: '4px 0 0 0', color: '#5b6472', fontSize: 13 }}>🎂 {getPlayerAge(child.birth_date)} ans</p>}
                            {uploadingPhoto && <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#0A5FB5' }}>⏳ Upload en cours...</p>}
                            {/* ── Niveau & étoiles ── (masqué si l'équipe a verrouillé les stats) */}
                            {!childTeam?.stats_hidden_for_parents && (() => {
                              const childPresences = getTrainingPresentCount(child.id, parentSelectedSeasonId);
                              const childGoals = getMatchPlayerStatsForSeason(child.id, parentSelectedSeasonId).reduce((sum, s) => sum + (s.goals || 0), 0);
                              const childMatchesPlayed = getMatchPresentCount(child.id, parentSelectedSeasonId);
                              const { grade, starsInLevel, isRainbow } = computeGrade(childPresences, childGoals, childMatchesPlayed);
                              const rainbowColors = ['#f59e0b','#10b981','#3b82f6','#a855f7','#ef4444'];
                              const starColor = isRainbow ? undefined : grade.color;
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                  {/* Badge niveau */}
                                  <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    background: isRainbow ? 'linear-gradient(135deg,#f59e0b22,#a855f722)' : grade.color + '18',
                                    border: `1.5px solid ${isRainbow ? '#a855f7' : grade.color}`,
                                    borderRadius: 999, padding: '3px 10px',
                                    boxShadow: grade.glow ? `0 1px 8px ${isRainbow ? 'rgba(168,85,247,0.25)' : grade.color + '44'}` : 'none',
                                  }}>
                                    <span style={{ fontSize: 10, fontWeight: 900, color: isRainbow ? '#7c3aed' : grade.color, letterSpacing: 0.3 }}>
                                      {grade.lvLabel}
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: isRainbow ? '#7c3aed' : grade.color, textTransform: 'uppercase' }}>
                                      {grade.name}
                                    </span>
                                  </div>
                                  {/* Étoiles */}
                                  <div style={{ display: 'flex', gap: 3 }}>
                                    {[1,2,3,4,5].map((i) => (
                                      <span key={i} style={{
                                        fontSize: 14,
                                        color: i <= starsInLevel ? (isRainbow ? rainbowColors[i-1] : starColor) : '#d1d5db',
                                        opacity: i <= starsInLevel ? 1 : 0.3,
                                        transition: 'color 0.2s',
                                      }}>★</span>
                                    ))}
                                  </div>
                                  {/* Mini stats source */}
                                  <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                                    🏃{childPresences} · ⚽{childMatchesPlayed} match{childMatchesPlayed > 1 ? 's' : ''} · {childGoals} but{childGoals > 1 ? 's' : ''}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* ── Personnalisation parent : poste préféré ── */}
                        <div style={{ ...styles.panelCard, marginBottom: 16, background: '#fdfcfb', border: '1px solid #e7e5e4' }}>
                          <h3 style={{ ...styles.panelTitle, marginBottom: 4 }}>🎮 Carte de {child.first_name}</h3>
                          <p style={{ margin: '0 0 14px 0', fontSize: 12, color: '#6b7280' }}>
                            Choisis le poste préféré qui s'affichera sur sa carte.
                          </p>
                          <div>
                            <label style={styles.inputLabel}>Poste préféré</label>
                            <select
                              value={child.position || ''}
                              onChange={async (e) => {
                                const newPos = e.target.value || null;
                                await supabase.from('players').update({ position: newPos }).eq('id', child.id);
                                setPlayers((prev) => prev.map((x) => x.id === child.id ? { ...x, position: newPos } : x));
                              }}
                              style={{ ...styles.select, maxWidth: 320 }}>
                              <option value="">— Choisir un poste —</option>
                              {POSITIONS.map((pos) => (
                                <option key={pos.code} value={pos.code}>{pos.code} — {pos.full}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* ── Carte Mon Coach ── */}
                        {(() => {
                          const teamCoaches = [...new Map(
                            coachAccessList.filter((c) => c.team_id === childTeamIdForSeason && (c.first_name || c.last_name))
                              .map((c) => [c.id, c])
                          ).values()];
                          if (teamCoaches.length === 0) return null;
                          return (
                            <div style={{ ...styles.panelCard, marginBottom: 16, background: 'linear-gradient(135deg,#f0f7ff,#eaf4ff)', border: '1px solid #bfdbfe' }}>
                              <h3 style={{ ...styles.panelTitle, color: '#1e40af', marginBottom: 14 }}>🏆 {teamCoaches.length > 1 ? 'Mes coachs' : 'Mon coach'}</h3>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {teamCoaches.map((coach) => {
                                  const initials = `${coach.first_name?.[0] || ''}${coach.last_name?.[0] || ''}`.toUpperCase();
                                  return (
                                    <div key={coach.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      {/* Photo coach */}
                                      {coach.photo_url
                                        ? <img src={coach.photo_url} alt={`${coach.first_name} ${coach.last_name}`}
                                            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '3px solid #0A5FB5', boxShadow: '0 2px 8px rgba(10,95,181,0.2)' }} />
                                        : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'white', boxShadow: '0 2px 8px rgba(10,95,181,0.2)', flexShrink: 0 }}>
                                            {initials || '🏆'}
                                          </div>
                                      }
                                      <div>
                                        <div style={{ fontWeight: 900, fontSize: 15, color: '#062C5D' }}>{coach.first_name} {coach.last_name}</div>
                                        <div style={{ fontSize: 12, color: '#5b6472', marginTop: 2, fontWeight: 600 }}>Coach — {childTeam?.name}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {childTeam?.stats_hidden_for_parents ? (
                          <div style={{
                            ...styles.panelCard, marginBottom: 16,
                            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                            border: '1px solid #fecaca',
                            display: 'flex', alignItems: 'center', gap: 14,
                          }}>
                            <div style={{ fontSize: 38, flexShrink: 0 }}>🔒</div>
                            <div>
                              <h3 style={{ ...styles.panelTitle, margin: 0, color: '#991b1b' }}>Statistiques masquées</h3>
                              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#7f1d1d', lineHeight: 1.4 }}>
                                Le coach a choisi de ne pas afficher les statistiques individuelles pour cette équipe. Demande-lui pour plus d'infos.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ ...styles.panelCard, marginBottom: 16 }}>
                            <h3 style={styles.panelTitle}>{"⭐ Statistiques du joueur"}</h3>
                            <div style={styles.statsGrid}>
                              {((() => {
                                const seasonStats = getMatchPlayerStatsForSeason(child.id, parentSelectedSeasonId);
                                const totalShots = seasonStats.reduce((sum, s) => sum + (s.shots || 0), 0);
                                const goals = seasonStats.reduce((sum, s) => sum + (s.goals || 0), 0);
                                const shootPct = totalShots > 0 ? Math.round((goals / totalShots) * 100) : null;
                                return [
                                  ['Entraînements', `${getTrainingPresentCount(child.id, parentSelectedSeasonId)} / ${childTeamIdForSeason ? getTrainingTotalCount(childTeamIdForSeason, parentSelectedSeasonId) : 0}`],
                                  ['Matchs', `${getMatchPresentCount(child.id, parentSelectedSeasonId)} / ${childTeamIdForSeason ? getMatchTotalCount(childTeamIdForSeason, parentSelectedSeasonId) : 0}`],
                                  ['Buts', goals],
                                  ['Tirs', totalShots],
                                  ['% Tirs', shootPct !== null ? `${shootPct}%` : '-'],
                                  ['Arrêts', seasonStats.reduce((sum, s) => sum + (s.saves || 0), 0)],
                                ] as [string, string | number][];
                              })()).map(([label, val]) => (
                                <div key={label} style={styles.statBox}>
                                  <div style={styles.statValue}>{val}</div>
                                  <div style={styles.statLabel}>{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Licence ── */}
                        {(() => {
                          const lic = getLicenseStatus(child.id, getCurrentSeason()?.id || null);
                          const st = lic?.status || 'pending';
                          const licUrl = getLicenseUrl(childTeamIdForSeason);
                          const badgeColor = st === 'validated' ? { bg: '#dcfce7', color: '#166534', border: '#86efac' } : st === 'paid' ? { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' } : { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
                          return (
                            <div style={{ ...styles.panelCard, background: badgeColor.bg, border: `1px solid ${badgeColor.border}`, marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontSize: 28 }}>🪪</span>
                                  <div>
                                    <div style={{ fontWeight: 800, color: badgeColor.color, fontSize: 15 }}>
                                      {st === 'validated' ? '✅ Licence validée' : st === 'paid' ? '💳 Paiement reçu — en cours de validation' : '⏳ Licence non réglée'}
                                    </div>
                                    <div style={{ fontSize: 13, color: badgeColor.color, opacity: 0.8, marginTop: 2 }}>
                                      {st === 'validated' ? 'Votre licence est confirmée pour cette saison.' : st === 'paid' ? 'Votre paiement a bien été reçu, la validation est en cours.' : 'Cliquez sur le bouton pour régler la licence en ligne.'}
                                    </div>
                                  </div>
                                </div>
                                {st !== 'validated' && (
                                  licUrl ? (
                                    <a href={licUrl} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 12, background: '#0A5FB5', color: 'white', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                                      💳 Payer la licence
                                    </a>
                                  ) : (
                                    <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', maxWidth: 160, textAlign: 'center' }}>
                                      Contactez le club pour le paiement
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })()}

                          </>
                        )}

                        {parentTab === 'trainings' && (
                        <div style={styles.panelCard}>
                          <h3 style={styles.panelTitle}>{"2 prochains entraînements"}</h3>
                          {childUpcomingTrainings.slice(0, 2).length === 0
                            ? <p style={styles.emptyText}>{"Aucun entraînement programmé."}</p>
                            : <div style={{ display: 'grid', gap: 12 }}>
                              {childUpcomingTrainings.slice(0, 2).map((training) => {
                                const status = getAttendanceStatus(training.templateId, child.id, training.date);
                                const counts = getTrainingCounts(training.templateId, training.teamId || '', training.date);
                                return (
                                  <div key={`${training.templateId}-${training.date}-${child.id}`} style={{ ...styles.trainingCard, background: training.cancelled ? '#f8fafc' : 'white', border: training.cancelled ? '1px solid #fecaca' : styles.trainingCard.border }}>
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ margin: '0 0 6px 0' }}>{training.title || 'Entraînement'}</h4>
                                      <p style={{ margin: 0, color: '#5b6472' }}>{formatDate(training.date)} – {getWeekdayLabel(training.weekday)} – {training.startTime}–{training.endTime}</p>
                                      <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{training.location || '-'}</p>
                                      {training.cancelled ? (
                                        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', fontWeight: 900 }}>
                                          Entraînement annulé{training.cancellationReason ? ` · ${training.cancellationReason}` : ''}
                                        </div>
                                      ) : (
                                        <div style={{ ...styles.attendanceRow, marginTop: 10, marginBottom: 0 }}>
                                          <span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span>
                                        </div>
                                      )}
                                      {/* Liste des joueurs présents à l'entraînement */}
                                      {!training.cancelled && counts.present > 0 && (() => {
                                        const presentPlayers = players.filter((p) =>
                                          p.team_id === training.teamId &&
                                          getAttendanceStatus(training.templateId, p.id, training.date) === 'present'
                                        ).sort((a, b) => getPlayerName(a).localeCompare(getPlayerName(b), 'fr'));
                                        if (presentPlayers.length === 0) return null;
                                        return (
                                          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, color: '#166534', marginBottom: 6 }}>✅ Joueurs présents ({presentPlayers.length})</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                              {presentPlayers.map((p) => (
                                                <span key={p.id} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#166534' }}>
                                                  {p.first_name} {p.last_name.toUpperCase()}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    {!training.cancelled && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#16a34a' : '#e8f7ee', color: status === 'present' ? 'white' : '#166534' }}>{"Présent"}</button>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>Absent</button>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'unknown' as any)} style={{ ...styles.statusButton, background: status === 'unknown' ? '#64748b' : '#eef2f7', color: status === 'unknown' ? 'white' : '#526071' }}>Sans réponse</button>
                                    </div>}
                                  </div>
                                );
                              })}
                            </div>}
                        </div>
                        )}

                        {parentTab === 'matches' && (
                        <div style={{ ...styles.panelCard, marginTop: 16 }}>
                          <h3 style={styles.panelTitle}>Matchs & tournois</h3>
                          {childMatches.length === 0 && childTournaments.length === 0
                            ? <p style={styles.emptyText}>{"Aucun match ou tournoi programmé."}</p>
                            : <div style={{ display: 'grid', gap: 12 }}>
                              {childMatches.map((match) => {
                                const squad = getSquadForMatch(match.id);
                                const isConvoked = !isSquadDefined(match.id) || squad.includes(child.id);
                                const status = getMatchAttendanceStatus(match.id, child.id);
                                const counts = getMatchCounts(match.id, match.team_id || '');
                                const isGuestMatch = match.team_id !== childTeamIdForSeason;
                                const guestMatchTeam = isGuestMatch ? teams.find((t) => t.id === match.team_id) : null;
                                return (
                                  <div key={`${match.id}-${child.id}`} style={styles.trainingCard}>
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ margin: '0 0 6px 0' }}>
                                        vs {match.opponent || '-'}
                                        {isGuestMatch && guestMatchTeam && (
                                          <span style={{ marginLeft: 8, fontSize: 12, color: '#7c3aed', fontWeight: 700, background: '#f3e8ff', padding: '2px 8px', borderRadius: 999 }}>
                                            🔄 Invité {guestMatchTeam.name}
                                          </span>
                                        )}
                                      </h4>
                                      <p style={{ margin: 0, color: '#5b6472' }}>{formatDate(match.match_date)} {formatTime(match.match_date)} – {match.location || '-'}</p>
                                      <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{match.home_away === 'home' ? 'Domicile' : 'Extérieur'}</p>
                                      {match.score_home !== null && match.score_home !== undefined && match.score_home !== '' && (
                                        <p style={{ margin: '6px 0 0 0', fontWeight: 800, color: '#0A5FB5', fontSize: 16 }}>Score : {match.score_home} – {match.score_away}</p>
                                      )}
                                      <div style={{ ...styles.attendanceRow, marginTop: 10, marginBottom: 0 }}>
                                        <span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span>
                                      </div>
                                      {/* Bouton voir composition */}
                                      {isSquadDefined(match.id) && squad.length > 0 && (
                                        <ParentCompositionButton matchId={match.id} teamId={match.team_id} players={players} squadIds={squad} />
                                      )}
                                      {/* Liste des joueurs convoqués */}
                                      {isSquadDefined(match.id) && squad.length > 0 && (
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#eaf4ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1e40af', marginBottom: 6 }}>📣 Joueurs convoqués ({squad.length})</div>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {squad.map((pid) => {
                                              const p = players.find((x) => x.id === pid);
                                              if (!p) return null;
                                              const att = getMatchAttendanceStatus(match.id, pid);
                                              return (
                                                <span key={pid} style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: att === 'present' ? '#dcfce7' : att === 'absent' ? '#fee2e2' : '#f1f5f9', color: att === 'present' ? '#166534' : att === 'absent' ? '#991b1b' : '#374151' }}>
                                                  {p.first_name} {p.last_name.toUpperCase()}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {!isSquadDefined(match.id)
                                      ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
                                        <span style={{ fontSize: 22 }}>⏳</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', textAlign: 'center' }}>Convocation pas encore disponible</span>
                                      </div>
                                      : !isConvoked
                                      ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 14px', background: '#f1f5f9', borderRadius: 12 }}>
                                        <span style={{ fontSize: 26 }}>{"😴"}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Repos</span>
                                      </div>
                                      : <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button onClick={() => saveMatchAttendance(match.id, child.id, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#16a34a' : '#e8f7ee', color: status === 'present' ? 'white' : '#166534' }}>{"Présent"}</button>
                                        <button onClick={() => saveMatchAttendance(match.id, child.id, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>Absent</button>
                                        <button onClick={() => saveMatchAttendance(match.id, child.id, 'unknown')} style={{ ...styles.statusButton, background: status === 'unknown' ? '#64748b' : '#eef2f7', color: status === 'unknown' ? 'white' : '#526071' }}>Sans réponse</button>
                                      </div>}
                                  </div>
                                );
                              })}
                              {childTournaments.map((ev) => {
                                const status = getEventAttendanceStatus(ev.id, child.id);
                                const counts = getEventCounts(ev.id);
                                return (
                                  <div key={`tournament-${ev.id}-${child.id}`} style={{ ...styles.trainingCard, background: '#fffbeb', border: '1px solid #fde68a' }}>
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ margin: '0 0 6px 0', color: '#92400e' }}>🏆 {ev.title}</h4>
                                      <p style={{ margin: 0, color: '#5b6472' }}>{formatDate(ev.event_date)} {formatTime(ev.event_date)} · {ev.location || '-'}</p>
                                      {ev.description && <p style={{ margin: '6px 0 0 0', color: '#374151', fontSize: 13 }}>{ev.description}</p>}
                                      <div style={{ ...styles.attendanceRow, marginTop: 10, marginBottom: 0 }}>
                                        <span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.pending}</span>
                                      </div>
                                      {renderEventVoters(ev.id)}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                      <button onClick={() => saveEventAttendance(ev.id, child.id, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#16a34a' : '#e8f7ee', color: status === 'present' ? 'white' : '#166534' }}>Présent</button>
                                      <button onClick={() => saveEventAttendance(ev.id, child.id, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>Absent</button>
                                      <button onClick={() => saveEventAttendance(ev.id, child.id, 'pending')} style={{ ...styles.statusButton, background: status === 'pending' ? '#64748b' : '#eef2f7', color: status === 'pending' ? 'white' : '#526071' }}>Sans réponse</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>}
                        </div>
                        )}

                        {/* ── Événements du club ── */}
                        {parentTab === 'events' && (() => {
                          const childTeamId = childTeamIdForSeason;
                          const relevantEvents = clubEvents.filter((ev) => {
                            const future = new Date(ev.event_date) >= new Date(new Date().setHours(0,0,0,0));
                            const forThisTeam = !ev.team_ids || ev.team_ids.length === 0 || ev.team_ids.includes(childTeamId);
                            return future && forThisTeam;
                          }).slice(0, 5);
                          if (relevantEvents.length === 0) return null;
                          const typeLabel: Record<string, string> = { event: '📅', assembly: '🏛️', outing: '🎢', tournament: '🏆', other: '📌' };
                          return (
                            <div style={{ ...styles.panelCard, marginTop: 16, background: '#fdf4ff', border: '1px solid #e9d5ff' }}>
                              <h3 style={{ ...styles.panelTitle, color: '#7c3aed' }}>🎉 Événements du club</h3>
                              <div style={{ display: 'grid', gap: 10 }}>
                                {relevantEvents.map((ev) => {
                                  const status = getEventAttendanceStatus(ev.id, child.id);
                                  const counts = getEventCounts(ev.id);
                                  return (
                                    <div key={ev.id} style={{ background: 'white', borderRadius: 14, padding: 14, border: '1px solid #e9d5ff' }}>
                                      <div style={{ fontWeight: 800, fontSize: 14, color: '#5b21b6' }}>{typeLabel[ev.type] || '📅'} {ev.title}</div>
                                      <div style={{ fontSize: 13, color: '#5b6472', marginTop: 3 }}>{formatDate(ev.event_date)} {formatTime(ev.event_date)}{ev.location ? ` · ${ev.location}` : ''}</div>
                                      {ev.description && <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>{ev.description}</div>}
                                      {ev.payment_link && (
                                        <div style={{ marginTop: 8 }}>
                                          <a href={ev.payment_link} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: '#7c3aed', color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                                            💳 Payer en ligne
                                          </a>
                                        </div>
                                      )}
                                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>✅ {counts.present} · ❌ {counts.absent} · ⏳ {counts.pending}</div>
                                      {renderEventVoters(ev.id)}
                                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                                        <button onClick={() => saveEventAttendance(ev.id, child.id, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#7c3aed' : '#f3e8ff', color: status === 'present' ? 'white' : '#7c3aed' }}>✅ Présent</button>
                                        <button onClick={() => saveEventAttendance(ev.id, child.id, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>❌ Absent</button>
                                        <button onClick={() => saveEventAttendance(ev.id, child.id, 'pending')} style={{ ...styles.statusButton, background: status === 'pending' ? '#64748b' : '#eef2f7', color: status === 'pending' ? 'white' : '#526071' }}>⏳ Sans réponse</button>
                                      </div>
                                      {/* ── Formulaire de l'événement ── */}
                                      {(() => {
                                        const formQuestions = getQuestionsForEvent(ev.id);
                                        if (formQuestions.length === 0) return null;
                                        const me = users.find((u) => u.id === selectedParentId);
                                        const responderLabel = me ? `${me.first_name || ''} ${me.last_name || ''}`.trim() : 'Parent';
                                        return (
                                          <div style={{ marginTop: 12, padding: 12, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12 }}>
                                            <div style={{ fontWeight: 800, color: '#5b21b6', fontSize: 13, marginBottom: 10 }}>📝 Formulaire à remplir pour {child.first_name}</div>
                                            <div style={{ display: 'grid', gap: 10 }}>
                                              {formQuestions.map((q) => {
                                                const existing = getResponseForQuestion(q.id, child.id);
                                                const value = existing?.answer || '';
                                                const multiValues = q.type === 'multi' ? parseMultiAnswer(value) : [];
                                                return (
                                                  <div key={q.id}>
                                                    <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#5b21b6', marginBottom: 4 }}>
                                                      {q.question}{q.required && <span style={{ color: '#dc2626' }}> *</span>}
                                                    </label>
                                                    {q.type === 'text' && (
                                                      <input value={value}
                                                        onChange={(e) => submitEventFormResponse(ev.id, q.id, child.id, e.target.value, selectedParentId || null, responderLabel)}
                                                        style={{ ...styles.input, padding: '8px 12px', minHeight: 38, fontSize: 14 }} placeholder="Votre réponse..." />
                                                    )}
                                                    {q.type === 'yesno' && (
                                                      <div style={{ display: 'flex', gap: 8 }}>
                                                        {['Oui', 'Non'].map((opt) => (
                                                          <button key={opt}
                                                            onClick={() => submitEventFormResponse(ev.id, q.id, child.id, opt, selectedParentId || null, responderLabel)}
                                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `2px solid ${value === opt ? '#7c3aed' : '#ddd6fe'}`, background: value === opt ? '#7c3aed' : 'white', color: value === opt ? 'white' : '#5b21b6', fontWeight: 800, cursor: 'pointer' }}>
                                                            {opt}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                    {q.type === 'choice' && (q.choices || []).length > 0 && (
                                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {(q.choices || []).map((c) => (
                                                          <button key={c}
                                                            onClick={() => submitEventFormResponse(ev.id, q.id, child.id, c, selectedParentId || null, responderLabel)}
                                                            style={{ padding: '7px 14px', borderRadius: 999, border: `2px solid ${value === c ? '#7c3aed' : '#ddd6fe'}`, background: value === c ? '#7c3aed' : 'white', color: value === c ? 'white' : '#5b21b6', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                                            {c}
                                                          </button>
                                                        ))}
                                                      </div>
                                                    )}
                                                    {q.type === 'multi' && (q.choices || []).length > 0 && (
                                                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {(q.choices || []).map((c) => {
                                                          const checked = multiValues.includes(c);
                                                          return (
                                                            <button key={c}
                                                              onClick={() => {
                                                                const next = checked ? multiValues.filter((v) => v !== c) : [...multiValues, c];
                                                                submitEventFormResponse(ev.id, q.id, child.id, JSON.stringify(next), selectedParentId || null, responderLabel);
                                                              }}
                                                              style={{ padding: '7px 14px', borderRadius: 999, border: `2px solid ${checked ? '#7c3aed' : '#ddd6fe'}`, background: checked ? '#7c3aed' : 'white', color: checked ? 'white' : '#5b21b6', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                                              {checked ? '[x] ' : ''}{c}
                                                            </button>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                    {existing && existing.responder_label && existing.responder_label !== responderLabel && (
                                                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontStyle: 'italic' }}>Répondu par {existing.responder_label}</div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Lien championnat */}
                        {parentTab === 'matches' && (() => {
                          const cat = childTeam?.category?.toLowerCase() || childTeam?.name?.toLowerCase() || '';
                          const link =
                            cat.includes('u9') ? appSettings.championship_u9 :
                            cat.includes('u11') && cat.includes('fill') ? appSettings.championship_u11_fille :
                            cat.includes('u11') ? appSettings.championship_u11_garcon :
                            cat.includes('u13') && cat.includes('fill') ? appSettings.championship_u13_fille :
                            cat.includes('u13') ? appSettings.championship_u13_garcon :
                            cat.includes('u15') ? appSettings.championship_u15 :
                            cat.includes('u17') ? appSettings.championship_u17 :
                            cat.includes('u18') ? appSettings.championship_u18 :
                            cat.includes('senior') && (cat.includes('fill') || cat.includes('fémin') || cat.includes('femin')) ? appSettings.championship_senior_fille :
                            cat.includes('senior') ? appSettings.championship_senior : '';
                          if (!link) return null;
                          return (
                            <div style={{ ...styles.panelCard, marginTop: 16, background: '#fef9c3', border: '1px solid #fde047' }}>
                              <h3 style={{ ...styles.panelTitle, color: '#854d0e' }}>🏆 Classement du championnat</h3>
                              <a href={link} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-block', padding: '12px 20px', background: '#ca8a04', color: 'white', borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
                                📊 Voir le classement
                              </a>
                            </div>
                          );
                        })()}

                      </div>
                    );
                  })}
                  </div>
                </>
              )}
            </>
            )}
            {seasons.length > 0 && (
              <div style={{ ...styles.panelCard, background: '#f0f7ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
                <span style={{ fontWeight: 800, color: '#1e40af', fontSize: 14 }}>Saison :</span>
                <select value={parentSelectedSeasonId} onChange={(e) => setParentSelectedSeasonId(e.target.value)}
                  style={{ ...styles.select, maxWidth: 260, minHeight: 44, padding: '10px 14px' }}>
                  {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <span style={{ fontSize: 12, color: '#5b6472' }}>
                  L'équipe affichée suit les affectations préparées pour la saison choisie.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Parent messages modal — full conversation panel */}
        {activeRole === 'parent' && showParentMessages && (() => {
          const myPlayerIds = parentLinks.filter((l) => l.parent_id === selectedParentId).map((l) => l.player_id);
          const myTeamIdsSet = new Set(players.filter((p) => myPlayerIds.includes(p.id) && p.team_id).map((p) => p.team_id as string));
          const myTeamIds = Array.from(myTeamIdsSet);
          const parentConversations = conversations.filter((c) => c.parent_id === selectedParentId || myTeamIds.includes(c.team_id as string));
          const activeConvId = selectedConvId || parentConvId;
          const activeConv = activeConvId ? conversations.find((c) => c.id === activeConvId) : null;
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,44,93,0.55)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }}>
                {/* Modal header */}
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,#0A5FB5,#062C5D)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'white', fontWeight: 900, fontSize: 17 }}>💬 Mes messages</div>
                  <button onClick={() => { setShowParentMessages(false); setSelectedConvId(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontWeight: 800, fontSize: 18, cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>

                {activeConv ? (
                  /* ── Open conversation view ── */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #d8e5f2', background: '#f0f7ff', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => { setSelectedConvId(null); setParentConvId(null); }} style={{ background: 'none', border: 'none', color: '#0A5FB5', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>← Retour</button>
                      <strong style={{ flex: 1 }}>{activeConv.is_group ? (activeConv.title || `👥 Canal ${teams.find((t) => t.id === activeConv.team_id)?.name || 'Groupe'}`) : activeConv.title ? `👤 ${activeConv.title}` : `${teams.find((t) => t.id === activeConv.team_id)?.name || ''} — Staff`}</strong>
                      <button onClick={() => deleteConversation(activeConvId!)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>🗑 Supprimer</button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: '#fafcff' }}>
                      {messages.length === 0
                        ? <div style={{ textAlign: 'center', color: '#5b6472', marginTop: 40, fontSize: 14 }}>Aucun message. Envoyez un message !</div>
                        : messages.map((msg) => {
                          const mine = msg.sender_type === 'parent';
                          const senderLabel = mine ? 'Moi' : (() => {
                            const ca = coachAccessList.find((x) => x.id === msg.sender_id);
                            return ca ? `${ca.first_name} ${ca.last_name}` : 'Coach';
                          })();
                          return (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{senderLabel} · {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flexDirection: mine ? 'row' : 'row-reverse' }}>
                                {mine && <button onClick={() => { if (window.confirm('Supprimer ?')) deleteMessage(msg.id); }} style={{ opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '1px 3px', color: '#991b1b' }} title="Supprimer">🗑</button>}
                                <div style={{ maxWidth: '72%', padding: '9px 13px', borderRadius: mine ? '16px 16px 3px 16px' : '16px 16px 16px 3px', background: mine ? '#0A5FB5' : '#edf2f7', color: mine ? 'white' : '#10233b', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' as const }}>{msg.content}</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div style={{ padding: '10px 14px', borderTop: '1px solid #d8e5f2', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (activeConvId) sendMessage(activeConvId, 'parent', selectedParentId); } }}
                        placeholder="Message..." rows={1}
                        style={{ flex: 1, padding: '9px 13px', borderRadius: 18, border: '1px solid #cfd8e3', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Arial, sans-serif', lineHeight: 1.4 }} />
                      <button onClick={() => { if (activeConvId) sendMessage(activeConvId, 'parent', selectedParentId); }} disabled={sendingMessage || !newMessage.trim()}
                        style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: newMessage.trim() ? '#0A5FB5' : '#ccd8e8', color: 'white', fontSize: 20, cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>→</button>
                    </div>
                  </div>
                ) : (
                  /* ── Conversation list + new conv form ── */
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* New conversation */}
                    <div style={{ background: '#f0f7ff', borderRadius: 16, padding: 14, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontWeight: 800, color: '#1e40af', marginBottom: 12, fontSize: 14 }}>+ Démarrer une conversation</div>

                      {myTeamIds.map((tid: string) => {
                        const team = teams.find((t) => t.id === tid);
                        if (!team) return null;
                        const teamCoaches = coachAccessList.filter((c) => c.team_id === tid);
                        // Check if group conv already exists for this team
                        const groupConv = conversations.find((c) => c.team_id === tid && c.is_group);
                        return (
                          <div key={tid} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{team.name}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {/* Canal de groupe */}
                              {groupConv ? (
                                <button onClick={() => { setSelectedConvId(groupConv.id); markConversationsRead([groupConv.id]); loadMessages(groupConv.id); }}
                                  style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #93c5fd', background: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#1e40af' }}>
                                  👥 Canal {team.name}
                                </button>
                              ) : null}

                              {/* Conversation privée par coach — une conv distincte par coach via title = coachName */}
                              {teamCoaches.length > 0
                                ? teamCoaches.map((coach) => {
                                  const coachName = `${coach.first_name || ''} ${coach.last_name || ''}`.trim();
                                  // Match by title = coachName (unique per parent+team+coach)
                                  const alreadyExists = conversations.find((c) =>
                                    c.parent_id === selectedParentId && c.team_id === tid && !c.is_group && c.title === coachName
                                  );
                                  return (
                                    <button key={coach.id} onClick={async () => {
                                      if (alreadyExists) {
                                        setSelectedConvId(alreadyExists.id);
                                        setParentConvId(alreadyExists.id);
                                        markConversationsRead([alreadyExists.id]);
                                        loadMessages(alreadyExists.id);
                                      } else {
                                        // Check DB for existing conv with this title
                                        const { data: ex } = await supabase.from('conversations').select('*')
                                          .eq('parent_id', selectedParentId).eq('team_id', tid).eq('is_group', false).eq('title', coachName).maybeSingle();
                                        if (ex) {
                                          setSelectedConvId(ex.id); setParentConvId(ex.id);
                                          markConversationsRead([ex.id]);
                                          loadMessages(ex.id);
                                        } else {
                                          // Create new conv with title = coachName
                                          const { data: nc } = await supabase.from('conversations')
                                            .insert({ team_id: tid, parent_id: selectedParentId, is_group: false, title: coachName })
                                            .select().single();
                                          if (nc) { setSelectedConvId(nc.id); setParentConvId(nc.id); loadMessages(nc.id); }
                                        }
                                      }
                                      await loadConversationsForParent(selectedParentId);
                                    }}
                                      style={{ padding: '7px 14px', borderRadius: 10, border: alreadyExists ? '2px solid #4338ca' : '1px solid #c7d2fe', background: alreadyExists ? '#eef2ff' : 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#4338ca' }}>
                                      👤 {coachName || 'Coach'}
                                    </button>
                                  );
                                })
                                : (
                                  <button onClick={() => openParentConversationForTeam(selectedParentId, tid)}
                                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #93c5fd', background: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#1e40af' }}>
                                    💬 Staff {team.name}
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Conversations list */}
                    <div style={{ fontWeight: 700, color: '#374151', fontSize: 13, marginTop: 4 }}>Mes conversations :</div>
                    {parentConversations.length === 0 ? (
                      <div style={styles.emptyState}>Aucune conversation. Commencez par contacter votre équipe ci-dessus.</div>
                    ) : parentConversations.map((conv) => {
                      const tm = teams.find((t) => t.id === conv.team_id);
                      const lastUpdated = new Date(conv.updated_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                      const lastRead = lastReadConvTimestamps[conv.id];
                      const hasUnread = lastRead && new Date(conv.updated_at) > new Date(lastRead);
                      let title = '';
                      let icon = '💬';
                      if (conv.is_group) {
                        title = conv.title || `👥 Canal ${tm?.name || 'Groupe'}`;
                        icon = '👥';
                      } else if (conv.title) {
                        title = `👤 ${conv.title}`;
                        icon = '👤';
                      } else {
                        title = `${tm?.name || ''} — Staff`;
                        icon = '💬';
                      }
                      return (
                        <div key={conv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: hasUnread ? '2px solid #0A5FB5' : '1px solid #d8e5f2', background: hasUnread ? '#eaf4ff' : '#f8fbff', cursor: 'pointer', position: 'relative' }}
                          onClick={() => { setSelectedConvId(conv.id); markConversationsRead([conv.id]); loadMessages(conv.id); }}>
                          {hasUnread && <span style={{ position: 'absolute', top: 8, right: 48, background: '#dc2626', borderRadius: '50%', width: 8, height: 8, display: 'block' }} />}
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: conv.is_group ? '#fde68a' : '#0A5FB5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: conv.is_group ? '#92400e' : 'white', flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: hasUnread ? 900 : 700, color: hasUnread ? '#0A5FB5' : '#10233b', fontSize: 14 }}>{title}</div>
                            <div style={{ fontSize: 12, color: '#5b6472', marginTop: 2 }}>{tm?.name || ''} · {lastUpdated}</div>
                            {hasUnread && <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, marginTop: 2 }}>● Nouveau message</div>}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>🗑</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, #edf4ff 0%, #dbeaff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Arial, sans-serif' },
  appPage: { minHeight: '100vh', background: '#edf4ff', padding: 20, fontFamily: 'Arial, sans-serif', overflowX: 'hidden', boxSizing: 'border-box' },
  container: { maxWidth: 1150, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  loginCard: { width: '100%', maxWidth: 560, background: 'rgba(255,255,255,0.95)', borderRadius: 28, padding: 28, boxShadow: '0 18px 40px rgba(6,44,93,0.15)' },
  loadingCard: { width: '100%', maxWidth: 420, background: 'white', borderRadius: 24, padding: 30, textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.10)' },
  loadingBadge: { display: 'inline-block', background: '#0A5FB5', color: 'white', padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 14 },
  topBanner: { background: 'linear-gradient(135deg, #0A5FB5, #062C5D)', color: 'white', borderRadius: 24, padding: 24, textAlign: 'center' },
  appTitle: { margin: 0, fontSize: 30, fontWeight: 800 },
  appSubtitle: { margin: '8px 0 0 0', opacity: 0.92, fontSize: 15 },
  sectionLabel: { margin: '0 0 10px 0', fontWeight: 700, fontSize: 15, color: '#1b2430' },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  roleButton: { border: '2px solid #d5dfeb', borderRadius: 20, padding: 18, background: '#f8fbff', cursor: 'pointer', textAlign: 'left' },
  roleButtonActive: { border: '2px solid #0A5FB5', background: '#eaf4ff', boxShadow: '0 10px 24px rgba(10,95,181,0.12)' },
  roleEmoji: { fontSize: 28, marginBottom: 10 },
  roleTitle: { fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#10233b' },
  roleText: { fontSize: 14, color: '#5b6472', lineHeight: 1.4 },
  select: { padding: '14px 16px', paddingRight: 42, borderRadius: 14, border: '1px solid #cfd8e3', fontSize: 16, lineHeight: 1.35, minHeight: 56, outline: 'none', background: 'white', color: '#1b2430', width: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' },
  input: { padding: '14px 16px', borderRadius: 14, border: '1px solid #cfd8e3', fontSize: 16, lineHeight: 1.35, minHeight: 56, outline: 'none', background: 'white', color: '#1b2430', caretColor: '#0A5FB5', width: '100%', boxSizing: 'border-box' },
  header: { background: 'linear-gradient(135deg, #0A5FB5, #062C5D)', color: 'white', borderRadius: 28, padding: 24, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', width: '100%', boxSizing: 'border-box', overflow: 'visible' },
  headerBadge: { display: 'inline-block', padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', fontSize: 13, fontWeight: 700 },
  logoutButton: { padding: '12px 16px', borderRadius: 14, border: 'none', background: 'white', color: '#062C5D', fontWeight: 800, cursor: 'pointer' },
  coachMenu: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 },
  menuButton: { padding: '12px 16px', borderRadius: 14, border: '1px solid #d6e1ec', background: 'white', cursor: 'pointer', fontWeight: 700, color: '#16304c' },
  menuButtonActive: { background: '#0A5FB5', color: 'white', border: '1px solid #0A5FB5' },
  contentCard: { background: 'white', borderRadius: 24, padding: 22, boxShadow: '0 14px 30px rgba(16,35,59,0.08)' },
  blockTitle: { margin: '0 0 8px 0', fontSize: 26 },
  blockSubtitle: { margin: '0 0 20px 0', color: '#5b6472' },
  formCard: { border: '1px solid #d8e5f2', borderRadius: 20, padding: 18, background: '#f8fbff' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 },
  inputLabel: { display: 'block', marginBottom: 6, fontWeight: 700, color: '#1b2430' },
  primaryButton: { padding: '14px 18px', borderRadius: 14, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 800, cursor: 'pointer' },
  secondaryButton: { padding: '10px 14px', borderRadius: 12, border: 'none', background: '#0A5FB5', color: 'white', fontWeight: 700, cursor: 'pointer' },
  smallButton: { padding: '10px 14px', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer' },
  teamCard: { border: '1px solid #d8e5f2', borderRadius: 20, padding: 18, background: '#f8fbff' },
  miniTitle: { fontWeight: 800, marginBottom: 8, color: '#0f2743' },
  list: { margin: 0, paddingLeft: 18, lineHeight: 1.7 },
  emptyText: { margin: 0, color: '#6c7684' },
  emptyState: { border: '1px dashed #c9d8e8', borderRadius: 18, padding: 22, background: '#f8fbff', color: '#556273' },
  emptyStateSmall: { border: '1px dashed #c9d8e8', borderRadius: 14, padding: 14, background: 'white', color: '#556273' },
  profileCard: { display: 'flex', alignItems: 'center', gap: 14, border: '1px solid #d8e5f2', borderRadius: 20, padding: 18, background: '#f8fbff', marginBottom: 18 },
  profileAvatar: { width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 },
  panelCard: { border: '1px solid #d8e5f2', borderRadius: 20, padding: 18, background: '#f8fbff' },
  panelTitle: { marginTop: 0, marginBottom: 12 },
  trainingCard: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', border: '1px solid #dbe6f2', borderRadius: 16, padding: 14, background: 'white' },
  statusButton: { padding: '10px 14px', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer', minWidth: 100 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 },
  statBox: { background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid #dde7f2' },
  statValue: { fontSize: 28, fontWeight: 800, color: '#0A5FB5', marginBottom: 6 },
  statLabel: { fontSize: 14, color: '#5b6472', fontWeight: 700 },
  attendanceRow: { display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12, background: 'white', border: '1px solid #dde7f2', marginBottom: 8 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 12 },
  summaryBox: { background: 'white', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid #dde7f2' },
  summaryValue: { fontSize: 26, fontWeight: 800, color: '#0A5FB5', marginBottom: 6 },
  summaryLabel: { fontSize: 14, fontWeight: 700, color: '#5b6472' },
  playerAttendanceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 14, background: 'white', border: '1px solid #dde7f2' },
  statusBadge: { padding: '8px 12px', borderRadius: 999, fontWeight: 800, fontSize: 13 },
  badgeGreen: { background: '#e8f7ee', color: '#166534' },
  badgeRed: { background: '#fdecec', color: '#991b1b' },
  badgeGray: { background: '#eef2f7', color: '#526071' },
  filterBar: { marginBottom: 16, maxWidth: 320 },
  createAccountHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  secondaryOutlineButton: { padding: '10px 14px', borderRadius: 12, border: '1px solid #0A5FB5', background: 'white', color: '#0A5FB5', fontWeight: 700, cursor: 'pointer' },
  linkRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 14, background: 'white', border: '1px solid #dde7f2' },
  linkRemoveButton: { padding: '10px 12px', borderRadius: 12, border: 'none', background: '#fee2e2', color: '#991b1b', fontWeight: 700, cursor: 'pointer' },
  pinCard: { marginTop: 12, border: '1px solid #d8e5f2', borderRadius: 20, padding: 16, background: '#f8fbff' },
  pinDotsRow: { display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20, alignItems: 'center', padding: '8px 0' },
  pinDot: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #cfd8e3', background: 'white', transition: 'background 0.15s, border-color 0.15s' },
  pinPad: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(70px, 1fr))', gap: 10 },
  pinPadButton: { minHeight: 56, borderRadius: 14, border: '1px solid #cfd8e3', background: 'white', color: '#12304f', fontSize: 22, fontWeight: 800, cursor: 'pointer' },
  pinPadButtonAlt: { minHeight: 56, borderRadius: 14, border: '1px solid #cfd8e3', background: '#eaf4ff', color: '#0A5FB5', fontSize: 20, fontWeight: 800, cursor: 'pointer' },
  warningBox: { marginTop: 14, padding: '12px 14px', borderRadius: 14, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600 },
  childSection: { border: '1px solid #d8e5f2', borderRadius: 24, padding: 18, background: '#fbfdff' },
  statsTable: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', fontSize: 15 },
  th: { padding: '12px 16px', fontWeight: 700, fontSize: 13, textAlign: 'left' as const, borderBottom: '2px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' as const },
  td: { padding: '11px 16px', borderBottom: '1px solid #e8eef5', fontSize: 14 },
  statPill: { display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: 14 },
};
