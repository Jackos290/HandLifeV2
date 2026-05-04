import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';

type Team = {
id: string;
name: string;
category: string;
};

type Player = {
id: string;
first_name: string;
last_name: string;
team_id: string;
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
};

type CoachAccess = {
id: string;
coach_code: string;
first_name: string;
last_name: string;
team_id: string;
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
};

type UserItem = {
id: string;
first_name: string;
last_name: string;
email: string;
role: string;
parent_pin: string;
};

type ParentPlayerLink = {
id: string;
parent_id: string;
player_id: string;
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

type UpcomingTraining = {
templateId: string;
teamId: string;
title: string;
weekday: number;
startTime: string;
endTime: string;
location: string;
date: string;
};

// CoachTab — 'admin' seulement visible pour isAdmin
type CoachTab = 'trainings' | 'matches' | 'stats' | 'players' | 'users' | 'messages' | 'admin';

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

const ADMIN_CODE = '1965';
const MAX_MATCH_PLAYERS = 12;

const CLUB_LOGO = `data:image/png;base64,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`;

// ─── MatchStatsTable ─ tableau groupé avec validation globale ────────────────────
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
const shootPct = row.shots > 0 ? Math.round((row.goals / row.shots) _ 100) : 0;
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
{totals['shots'] > 0 ? `${Math.round((totals['goals'] / totals['shots']) _ 100)}%` : '-'}
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

// ─── PinPad ───────────────────────────────────────────────────────────────────
function PinPad({
value,
onChange,
label,
onComplete,
}: {
value: string;
onChange: (v: string) => void;
label?: string;
onComplete?: (pin: string) => void;
}) {
function addDigit(digit: string) {
if (value.length >= 4) return;
const next = value + digit;
onChange(next);
if (next.length === 4 && onComplete) {
setTimeout(() => onComplete(next), 120);
}
}
function removeLast() { onChange(value.slice(0, -1)); }
function clear() { onChange(''); }

return (

<div style={styles.pinCard}>
{label && <label style={styles.sectionLabel}>{label}</label>}
<div style={styles.pinDotsRow}>
{[0, 1, 2, 3].map((i) => (
<div key={i} style={{
            ...styles.pinDot,
            background: value[i] ? '#0A5FB5' : 'white',
            border: value[i] ? '2px solid #0A5FB5' : '2px solid #cfd8e3',
          }} />
))}
</div>
<div style={styles.pinPad}>
{['1','2','3','4','5','6','7','8','9'].map((d) => (
<button key={d} type="button" onClick={() => addDigit(d)} style={styles.pinPadButton}>{d}</button>
))}
<button type="button" onClick={clear} style={styles.pinPadButtonAlt}>C</button>
<button type="button" onClick={() => addDigit('0')} style={styles.pinPadButton}>0</button>
<button type="button" onClick={removeLast} style={styles.pinPadButtonAlt}>DEL</button>
</div>
</div>
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
const [coachAccessList, setCoachAccessList] = useState<CoachAccess[]>([]);

// ── Auth ──
const [loginRole, setLoginRole] = useState<'coach' | 'parent'>('parent');
const [coachPinInput, setCoachPinInput] = useState('');
const [parentPinInput, setParentPinInput] = useState('');
const [loggedIn, setLoggedIn] = useState(false);
const [activeRole, setActiveRole] = useState<'coach' | 'parent'>('parent');
const [isAdmin, setIsAdmin] = useState(false);
// équipes visibles pour ce coach (vide = toutes si admin)
const [allowedTeamIds, setAllowedTeamIds] = useState<string[]>([]);
const [selectedParentId, setSelectedParentId] = useState('');
const [loading, setLoading] = useState(true);

// ── UI states ──
const [coachTab, setCoachTab] = useState<CoachTab>('trainings');
const [selectedCoachTeamId, setSelectedCoachTeamId] = useState('');
const [selectedTrainingTemplateId, setSelectedTrainingTemplateId] = useState('');
const [selectedTrainingDate, setSelectedTrainingDate] = useState('');
const [selectedMatchId, setSelectedMatchId] = useState('');

// Admin — gestion coaches
const [newCoachCode, setNewCoachCode] = useState('');
const [newCoachFirstName, setNewCoachFirstName] = useState('');
const [newCoachLastName, setNewCoachLastName] = useState('');
const [newCoachTeamIds, setNewCoachTeamIds] = useState<string[]>([]);
const [savingCoach, setSavingCoach] = useState(false);

// Messagerie
const [conversations, setConversations] = useState<Conversation[]>([]);
const [messages, setMessages] = useState<Message[]>([]);
const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
const [newMessage, setNewMessage] = useState('');
const [sendingMessage, setSendingMessage] = useState(false);
const [showNewConvForm, setShowNewConvForm] = useState(false);
const [newConvParentId, setNewConvParentId] = useState('');
const [newConvTeamId, setNewConvTeamId] = useState('');
const [newConvIsGroup, setNewConvIsGroup] = useState(false);
const [parentConvId, setParentConvId] = useState<string | null>(null);
const [realtimeSub, setRealtimeSub] = useState<any>(null);

// Admin — entraînement
const [newTrainingTeamId, setNewTrainingTeamId] = useState('');
const [newTrainingTitle, setNewTrainingTitle] = useState('Entraînement');
const [newTrainingWeekday, setNewTrainingWeekday] = useState('3');
const [newTrainingStart, setNewTrainingStart] = useState('18:30');
const [newTrainingEnd, setNewTrainingEnd] = useState('20:00');
const [newTrainingLocation, setNewTrainingLocation] = useState('Gymnase de Gorcy');

// Admin — match
const [newMatchTeamId, setNewMatchTeamId] = useState('');
const [newMatchOpponent, setNewMatchOpponent] = useState('');
const [newMatchDate, setNewMatchDate] = useState('');
const [newMatchLocation, setNewMatchLocation] = useState('');
const [newMatchHomeAway, setNewMatchHomeAway] = useState<'home' | 'away'>('home');

// Admin — joueur
const [playerFormFirstName, setPlayerFormFirstName] = useState('');
const [playerFormLastName, setPlayerFormLastName] = useState('');
const [playerFormTeamId, setPlayerFormTeamId] = useState('');
const [editingPlayerId, setEditingPlayerId] = useState('');
const [savingPlayer, setSavingPlayer] = useState(false);

// Admin — compte enfant
const [showCreateChildForm, setShowCreateChildForm] = useState(false);
const [newChildFirstName, setNewChildFirstName] = useState('');
const [newChildLastName, setNewChildLastName] = useState('');
const [newChildTeamId, setNewChildTeamId] = useState('');
const [newParentFirstName, setNewParentFirstName] = useState('');
const [newParentLastName, setNewParentLastName] = useState('');
const [newParentEmail, setNewParentEmail] = useState('');
const [creatingChildAccount, setCreatingChildAccount] = useState(false);

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
const [newSeasonName, setNewSeasonName] = useState('2025/2026');
const [newSeasonStart, setNewSeasonStart] = useState('');
const [newSeasonEnd, setNewSeasonEnd] = useState('');
const [newSeasonTeamId, setNewSeasonTeamId] = useState('');
const [savingSeason, setSavingSeason] = useState(false);
const [resetingTraining, setResetingTraining] = useState(false);

// Paramètres (settings)
type AppSettings = {
app_url: string;
championship_u9: string;
championship_u11_garcon: string;
championship_u11_fille: string;
championship_u13_garcon: string;
championship_u13_fille: string;
championship_u15: string;
championship_u17: string;
championship_u18: string;
championship_senior: string;
};
const [appSettings, setAppSettings] = useState<AppSettings>({
app_url: '', championship_u9: '', championship_u11_garcon: '', championship_u11_fille: '',
championship_u13_garcon: '', championship_u13_fille: '', championship_u15: '',
championship_u17: '', championship_u18: '', championship_senior: '',
});
const [savingSettings, setSavingSettings] = useState(false);

// Message modal — reserved for future use

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

// ── Load ──
useEffect(() => { loadData(); loadSeasons(); loadSettings(); }, []);

// Auto-refresh toutes les 30 secondes pour les données générales
useEffect(() => {
if (!loggedIn) return;
const interval = setInterval(() => { loadDataSilent(); }, 30000);
return () => clearInterval(interval);
}, [loggedIn]);

// Realtime — présences match, présences entraînement, convocations
useEffect(() => {
if (!loggedIn) return;

    const ch = supabase.channel('realtime-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_attendance' },
        () => { loadDataSilent(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance' },
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
ensureParentConversation(selectedParentId);
}
}, [loggedIn, activeRole, isAdmin, allowedTeamIds, selectedParentId, teams]);

useEffect(() => {
if (!selectedConvId) return;
loadMessages(selectedConvId);
const ch = supabase.channel('msgs-' + selectedConvId)
.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + selectedConvId },
(payload: any) => { setMessages((prev) => prev.find((m) => m.id === payload.new.id) ? prev : [...prev, payload.new as Message]); }
).subscribe();
setRealtimeSub(ch);
return () => { supabase.removeChannel(ch); };
}, [selectedConvId]);

useEffect(() => {
if (visibleTeams.length > 0 && !selectedCoachTeamId) setSelectedCoachTeamId(visibleTeams[0].id);
}, [visibleTeams]);

useEffect(() => {
if (teams.length > 0 && !newTrainingTeamId) setNewTrainingTeamId(teams[0].id);
if (teams.length > 0 && !newMatchTeamId) setNewMatchTeamId(teams[0].id);
if (teams.length > 0 && !playerFormTeamId) setPlayerFormTeamId(teams[0].id);
if (teams.length > 0 && !newChildTeamId) setNewChildTeamId(teams[0].id);
}, [teams]);

useEffect(() => {
if (visibleTemplates.length > 0 && !selectedTrainingTemplateId) {
setSelectedTrainingTemplateId(visibleTemplates[0].id);
setSelectedTrainingDate(getNextDatesForWeekday(visibleTemplates[0].weekday, 1)[0] || '');
}
}, [visibleTemplates]);

useEffect(() => {
if (visibleMatches.length > 0 && !selectedMatchId) {
const today = new Date(); today.setHours(0,0,0,0);
const next = visibleMatches.find((m) => new Date(m.match_date) >= today) || visibleMatches[visibleMatches.length - 1];
setSelectedMatchId(next.id);
}
}, [visibleMatches]);

useEffect(() => {
if (!selectedTrainingTemplateId) return;
const t = trainingTemplates.find((x) => x.id === selectedTrainingTemplateId);
if (t) setSelectedTrainingDate(getNextDatesForWeekday(t.weekday, 1)[0] || '');
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
usersRes, linksRes, templatesRes, attendanceRes, matchStatsRes, coachesRes, coachTeamsRes, squadsRes,
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
supabase.from('coaches').select('id, code, first_name, last_name'),
supabase.from('coach_teams').select('*'),
supabase.from('match_squads').select('*'),
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
coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: '' });
} else {
for (const ct of cTeams) {
coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: ct.team_id });
}
}
}
setCoachAccessList(coachRows);
}

async function loadData() {
setLoading(true);
const [
teamsRes, playersRes, matchesRes, matchAttRes, statsRes,
usersRes, linksRes, templatesRes, attendanceRes, matchStatsRes, coachesRes, coachTeamsRes, squadsRes,
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
supabase.from('coaches').select('id, code, first_name, last_name'),
supabase.from('coach_teams').select('*'),
supabase.from('match_squads').select('*'),
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
        coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: '' });
      } else {
        for (const ct of cTeams) {
          coachRows.push({ id: coach.id, coach_code: coach.code, first_name: coach.first_name || '', last_name: coach.last_name || '', team_id: ct.team_id });
        }
      }
    }
    setCoachAccessList(coachRows);

    const parentUsrs = (usersRes.data || []).filter((u: UserItem) => u.role === 'parent');
    if (parentUsrs.length > 0 && !selectedManagedParentId) setSelectedManagedParentId(parentUsrs[0].id);
    if (parentUsrs.length > 0 && !selectedLinkParentId) setSelectedLinkParentId(parentUsrs[0].id);
    if ((playersRes.data || []).length > 0 && !selectedLinkPlayerId) setSelectedLinkPlayerId((playersRes.data || [])[0].id);

    setLoading(false);

}

// ── Auth ──
async function handleLogin(pin: string) {
if (loginRole === 'coach') {
const code = pin || coachPinInput;

      // ── ADMIN ──
      if (code === ADMIN_CODE) {
        setIsAdmin(true);
        setAllowedTeamIds([]);
        setActiveRole('coach');
        setLoggedIn(true);
        return;
      }

      // ── Coach normal ──
      const { data: coachData } = await supabase.from('coaches').select('id, code').eq('code', code).maybeSingle();
      if (coachData) {
        const { data: ctData } = await supabase.from('coach_teams').select('team_id').eq('coach_id', coachData.id);
        const teamIds = (ctData || []).map((ct: any) => ct.team_id);
        setIsAdmin(false);
        setAllowedTeamIds(teamIds);
        setActiveRole('coach');
        setLoggedIn(true);
        return;
      }

      alert('Code invalide');
      setCoachPinInput('');
      return;
    }

    // ── Parent ──
    if (loginRole === 'parent') {
      const code = pin || parentPinInput;
      if (code.length !== 4) { alert('Entre ton code à 4 chiffres'); return; }
      const found = users.find((u) => u.role === 'parent' && u.parent_pin === code);
      if (!found) { alert('Code incorrect'); setParentPinInput(''); return; }
      setSelectedParentId(found.id);
      setActiveRole('parent');
      setLoggedIn(true);
    }

}

function handleLogout() {
setLoggedIn(false);
setIsAdmin(false);
setAllowedTeamIds([]);
setCoachPinInput('');
setParentPinInput('');
setSelectedParentId('');
setSelectedCoachTeamId('');
setSelectedTrainingTemplateId('');
setSelectedMatchId('');
}

// ── Helpers ──
function getPlayerName(p: Partial<Player>) { return `${p.first_name || ''} ${p.last_name || ''}`.trim(); }
function getUserName(u: Partial<UserItem>) { return `${u.first_name || ''} ${u.last_name || ''}`.trim(); }
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
function getStatForPlayer(playerId: string) { return stats.find((s) => s.player_id === playerId); }
function getMatchPlayerStat(matchId: string, playerId: string) {
return matchPlayerStats.find((s) => s.match_id === matchId && s.player_id === playerId);
}
function getNextDatesForWeekday(weekday: number, count = 6) {
const result: string[] = [];
const current = new Date(); current.setHours(0, 0, 0, 0);
for (let i = 0; result.length < count && i < 90; i++) {
const t = new Date(current); t.setDate(current.getDate() + i);
if (t.getDay() === weekday) result.push(t.toISOString().slice(0, 10));
}
return result;
}
function isFutureOrToday(date: string) {
if (!date) return false;
const today = new Date(); today.setHours(0, 0, 0, 0);
const test = new Date(date); test.setHours(0, 0, 0, 0);
return test >= today;
}
function getTrainingPresentCount(playerId: string) {
return trainingAttendance.filter((a) => a.player_id === playerId && a.status === 'present').length;
}
function getMatchPresentCount(playerId: string) {
return matchAttendance.filter((a) => a.player_id === playerId && a.status === 'present').length;
}
function getTrainingTotalCount(teamId: string) {
const templateIds = trainingTemplates.filter((t) => t.team_id === teamId).map((t) => t.id);
const dates = new Set(
trainingAttendance
.filter((a) => templateIds.includes(a.training_template_id || ''))
.map((a) => `${a.training_template_id}__${a.training_date}`)
);
return dates.size;
}
function getMatchTotalCount(teamId: string) {
const teamMatchIds = matches.filter((m) => m.team_id === teamId).map((m) => m.id);
const played = new Set(matchAttendance.filter((a) => teamMatchIds.includes(a.match_id || '')).map((a) => a.match_id));
return played.size;
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
function getLinkedParentsForPlayer(playerId: string) {
const ids = parentLinks.filter((l) => l.player_id === playerId).map((l) => l.parent_id);
return users.filter((u) => u.role === 'parent' && ids.includes(u.id));
}
function generateFourDigitPin() { return String(Math.floor(1000 + Math.random() \* 9000)); }

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
      if (current.length >= MAX_MATCH_PLAYERS) { alert(`Maximum ${MAX_MATCH_PLAYERS} joueurs par match`); return; }
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
                parentPin: par.parent_pin || '',
              })),
              match: { opponent: match.opponent, date: match.match_date, location: match.location || '', home_away: match.home_away },
              appUrl: appSettings.app_url,
            };
            supabase.functions.invoke('send-convocation', { body: payload }).catch(console.error);
          }
        }
      }
    }
    await loadData();

}

const [sendingConvocations, setSendingConvocations] = useState(false);
async function sendAllConvocations(matchId: string) {
const match = matches.find((m) => m.id === matchId);
if (!match) return;
const squad = getSquadForMatch(matchId);
if (squad.length === 0) { alert('Aucun joueur dans la convocation'); return; }
setSendingConvocations(true);
try {
const playersToNotify: { playerName: string; parentEmail: string; parentName: string; parentPin: string; }[] = [];
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
parentPin: par.parent_pin || '',
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

async function addTrainingTemplate() {
if (!newTrainingTeamId || !newTrainingStart || !newTrainingEnd) { alert('Remplir les champs obligatoires'); return; }
const { error } = await supabase.from('training_templates').insert({
team_id: newTrainingTeamId, title: newTrainingTitle,
weekday: Number(newTrainingWeekday), start_time: newTrainingStart,
end_time: newTrainingEnd, location: newTrainingLocation, active: true,
});
if (error) { alert("Erreur lors de la création de l'entraînement"); return; }
setNewTrainingTitle('Entraînement'); setNewTrainingWeekday('3');
setNewTrainingStart('18:30'); setNewTrainingEnd('20:00');
setNewTrainingLocation('Gymnase de Gorcy');
await loadData();
alert('Entraînement ajouté');
}

async function addMatch() {
if (!newMatchTeamId || !newMatchOpponent.trim() || !newMatchDate) { alert('Remplir équipe, adversaire et date'); return; }
const { error } = await supabase.from('matches').insert({
team_id: newMatchTeamId, opponent: newMatchOpponent.trim(),
match_date: newMatchDate, location: newMatchLocation.trim() || null, home_away: newMatchHomeAway,
});
if (error) { alert("Erreur lors de la création du match"); return; }
setNewMatchOpponent(''); setNewMatchDate(''); setNewMatchLocation(''); setNewMatchHomeAway('home');
await loadData();
alert('Match ajouté');
}

async function toggleTemplateActive(template: TrainingTemplate) {
const { error } = await supabase.from('training_templates').update({ active: !template.active }).eq('id', template.id);
if (error) { alert('Erreur lors de la mise à jour'); return; }
await loadData();
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
const { data } = await supabase.from('seasons').select('\*').order('start_date', { ascending: false });
setSeasons(data || []);
}

async function loadSettings() {
const { data } = await supabase.from('settings').select('\*');
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
const { data } = await supabase.from('conversations').select('\*').in('team_id', q).order('updated_at', { ascending: false });
setConversations(data || []);
}

async function loadConversationsForParent(parentId: string) {
const { data } = await supabase.from('conversations').select('\*').eq('parent_id', parentId).order('updated_at', { ascending: false });
setConversations(data || []);
}

async function ensureParentConversation(parentId: string) {
const myPlayers = parentLinks.filter((l) => l.parent_id === parentId).map((l) => l.player_id);
const myTeamId = players.find((p) => myPlayers.includes(p.id))?.team_id;
if (!myTeamId) return;
const { data: ex } = await supabase.from('conversations').select('\*').eq('parent_id', parentId).eq('team_id', myTeamId).eq('is_group', false).maybeSingle();
if (ex) { setParentConvId(ex.id); setSelectedConvId(ex.id); await loadConversationsForParent(parentId); }
else {
const { data: nc } = await supabase.from('conversations').insert({ team_id: myTeamId, parent_id: parentId, is_group: false, title: null }).select().single();
if (nc) { setParentConvId(nc.id); setSelectedConvId(nc.id); await loadConversationsForParent(parentId); }
}
}

async function loadMessages(convId: string) {
const { data } = await supabase.from('messages').select('\*').eq('conversation_id', convId).order('created_at', { ascending: true });
setMessages(data || []);
}

async function sendMessage(convId: string, senderType: 'coach' | 'parent', senderId: string) {
if (!newMessage.trim() || !senderId) return;
setSendingMessage(true);
try {
await supabase.from('messages').insert({ conversation_id: convId, sender_type: senderType, sender_id: senderId, content: newMessage.trim() });
await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
setNewMessage('');
await loadMessages(convId);
if (senderType === 'coach') { const tids = isAdmin ? teams.map((t) => t.id) : allowedTeamIds; await loadConversations(tids); }
else await loadConversationsForParent(selectedParentId);
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
if (!newCoachCode.trim()) { alert('Entre un code coach'); return; }
if (newCoachTeamIds.length === 0) { alert('Sélectionne au moins une équipe'); return; }
if (newCoachCode.trim() === ADMIN_CODE) { alert("Ce code est réservé à l'administrateur"); return; }
setSavingCoach(true);
try {
// Chercher si ce code existe déjà
const { data: existing } = await supabase.from('coaches').select('id').eq('code', newCoachCode.trim()).maybeSingle();
let coachId: string;
if (existing) {
coachId = existing.id;
await supabase.from('coaches').update({
first_name: newCoachFirstName.trim() || null,
last_name: newCoachLastName.trim() || null,
}).eq('id', coachId);
await supabase.from('coach_teams').delete().eq('coach_id', coachId);
} else {
const { data: newCoach, error: ce } = await supabase.from('coaches').insert({
code: newCoachCode.trim(),
first_name: newCoachFirstName.trim() || null,
last_name: newCoachLastName.trim() || null,
}).select('id').single();
if (ce || !newCoach) throw ce || new Error('Impossible de créer le coach');
coachId = newCoach.id;
}
const rows = newCoachTeamIds.map((teamId) => ({ coach_id: coachId, team_id: teamId }));
const { error } = await supabase.from('coach_teams').insert(rows);
if (error) throw error;
setNewCoachCode('');
setNewCoachFirstName('');
setNewCoachLastName('');
setNewCoachTeamIds([]);
await loadData();
alert(`Coach créé / mis à jour avec le code ${newCoachCode.trim()}`);
} catch (e) { console.error(e); alert('Erreur lors de la création du coach'); }
finally { setSavingCoach(false); }
}

async function deleteCoachAccess(code: string) {
if (!window.confirm(`Supprimer le coach avec le code ${code} ?`)) return;
const { data: coach } = await supabase.from('coaches').select('id').eq('code', code).maybeSingle();
if (coach) {
await supabase.from('coach_teams').delete().eq('coach_id', coach.id);
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
setPlayerFormTeamId(teams[0]?.id || '');
}
function startEditPlayer(player: Player) {
setEditingPlayerId(player.id);
setPlayerFormFirstName(player.first_name || '');
setPlayerFormLastName(player.last_name || '');
setPlayerFormTeamId(player.team_id || teams[0]?.id || '');
}
async function savePlayer() {
if (!playerFormFirstName.trim() || !playerFormLastName.trim() || !playerFormTeamId) { alert('Remplir prénom, nom et équipe'); return; }
setSavingPlayer(true);
try {
if (editingPlayerId) {
const { error } = await supabase.from('players').update({
first_name: playerFormFirstName.trim(), last_name: playerFormLastName.trim(), team_id: playerFormTeamId,
}).eq('id', editingPlayerId);
if (error) throw error;
alert('Joueur modifié');
} else {
const res = await supabase.from('players').insert({
first_name: playerFormFirstName.trim(), last_name: playerFormLastName.trim(), team_id: playerFormTeamId,
}).select().single();
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
setLinkingPlayer(true);
try {
const { error } = await supabase.from('parent_player').insert({ parent_id: selectedLinkParentId, player_id: selectedLinkPlayerId });
if (error) throw error;
await loadData();
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

async function sendParentPinEmail(parentEmail: string, parentName: string, pin: string, childName: string) {
try {
await supabase.functions.invoke('send-parent-pin', { body: { email: parentEmail, parentName, pin, childName } });
} catch (e) { console.error(e); }
}

async function createChildAccount() {
if (!newChildFirstName.trim() || !newChildLastName.trim() || !newChildTeamId || !newParentFirstName.trim() || !newParentLastName.trim()) {
alert('Remplir les champs obligatoires'); return;
}
setCreatingChildAccount(true);
try {
let parentId = '';
const parentPin = generateFourDigitPin();
const parentEmail = newParentEmail.trim();
const parentFullName = `${newParentFirstName.trim()} ${newParentLastName.trim()}`.trim();
const childFullName = `${newChildFirstName.trim()} ${newChildLastName.trim()}`.trim();

      if (parentEmail) {
        const existing = await supabase.from('users').select('*').eq('email', parentEmail).eq('role', 'parent').maybeSingle();
        if (existing.data) {
          parentId = existing.data.id;
          await supabase.from('users').update({ first_name: newParentFirstName.trim(), last_name: newParentLastName.trim(), parent_pin: parentPin }).eq('id', parentId);
        }
      }
      if (!parentId) {
        const res = await supabase.from('users').insert({
          first_name: newParentFirstName.trim(), last_name: newParentLastName.trim(),
          email: parentEmail || null, role: 'parent', parent_pin: parentPin,
        }).select().single();
        if (res.error || !res.data) throw res.error || new Error('Impossible de créer le parent');
        parentId = res.data.id;
      }
      const playerRes = await supabase.from('players').insert({
        first_name: newChildFirstName.trim(), last_name: newChildLastName.trim(), team_id: newChildTeamId,
      }).select().single();
      if (playerRes.error || !playerRes.data) throw playerRes.error || new Error("Impossible de créer l'enfant");
      const playerId = playerRes.data.id;
      await supabase.from('parent_player').insert({ parent_id: parentId, player_id: playerId });
      await supabase.from('player_stats').insert({ player_id: playerId, goals: 0, assists: 0, saves: 0, matches_played: 0 });
      if (parentEmail) await sendParentPinEmail(parentEmail, parentFullName, parentPin, childFullName);

      setNewChildFirstName(''); setNewChildLastName('');
      setNewParentFirstName(''); setNewParentLastName(''); setNewParentEmail('');
      setNewChildTeamId(teams[0]?.id || '');
      setShowCreateChildForm(false);
      await loadData();
      alert(`Compte créé. Code parent : ${parentPin}${parentEmail ? '. Email envoyé.' : ''}`);
    } catch (e) { console.error(e); alert("Erreur lors de la création du compte enfant"); }
    finally { setCreatingChildAccount(false); }

}

// ── Computed for coach UI ──
const parentUsers = useMemo(() => users.filter((u) => u.role === 'parent'), [users]);
const selectedCoachTemplate = visibleTemplates.find((t) => t.id === selectedTrainingTemplateId) || null;
const coachTemplateDates = selectedCoachTemplate ? getNextDatesForWeekday(selectedCoachTemplate.weekday, 8) : [];
const coachTeamPlayers = selectedCoachTeamId ? getPlayersForTeam(selectedCoachTeamId).filter((p) => visibleTeams.some((vt) => vt.id === p.team_id)) : visiblePlayers;
const coachMatches = selectedCoachTeamId ? visibleMatches.filter((m) => m.team_id === selectedCoachTeamId) : visibleMatches;
const coachTemplates = selectedCoachTeamId ? visibleTemplates.filter((t) => t.team_id === selectedCoachTeamId) : visibleTemplates;
const coachPlayersForSelectedTraining = selectedCoachTemplate?.team_id ? players.filter((p) => p.team_id === selectedCoachTemplate.team_id) : [];

const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;
const playersForSelectedMatch = selectedMatch?.team_id ? players.filter((p) => p.team_id === selectedMatch.team_id) : [];
const squadForSelectedMatch = selectedMatchId ? getSquadForMatch(selectedMatchId) : [];

const selectedTrainingPresentCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'present').length;
const selectedTrainingAbsentCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'absent').length;
const selectedTrainingUnknownCount = coachPlayersForSelectedTraining.filter((p) => selectedCoachTemplate && selectedTrainingDate && getAttendanceStatus(selectedCoachTemplate.id, p.id, selectedTrainingDate) === 'unknown').length;

// Résumé des coaches existants
const coachSummary = useMemo(() => {
const map: Record<string, { teamIds: string[], firstName: string, lastName: string }> = {};
coachAccessList.forEach((row) => {
if (!map[row.coach_code]) map[row.coach_code] = { teamIds: [], firstName: row.first_name || '', lastName: row.last_name || '' };
if (row.team_id) map[row.coach_code].teamIds.push(row.team_id);
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
return (

<div style={styles.page}>
<div style={styles.loginCard}>
<div style={styles.topBanner}>
<img src={CLUB_LOGO} alt="CA Gorcy Handball"
style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px auto', display: 'block', border: '3px solid rgba(255,255,255,0.3)' }} />
<h1 style={styles.appTitle}>CA Gorcy Handball</h1>
<p style={styles.appSubtitle}>Espace de gestion interne</p>
</div>

          <div style={{ marginTop: 24 }}>
            <p style={styles.sectionLabel}>Choisir un espace</p>
            <div style={styles.roleGrid}>
              <button onClick={() => { setLoginRole('parent'); setParentPinInput(''); setCoachPinInput(''); }}
                style={{ ...styles.roleButton, ...(loginRole === 'parent' ? styles.roleButtonActive : {}) }}>
                <div style={styles.roleEmoji}>{"👪"}</div>
                <div style={styles.roleTitle}>Parent</div>
                <div style={styles.roleText}>{"Présences et infos équipe"}</div>
              </button>
              <button onClick={() => { setLoginRole('coach'); setParentPinInput(''); setCoachPinInput(''); }}
                style={{ ...styles.roleButton, ...(loginRole === 'coach' ? styles.roleButtonActive : {}) }}>
                <div style={styles.roleEmoji}>{"🏆"}</div>
                <div style={styles.roleTitle}>Coach</div>
                <div style={styles.roleText}>Gestion du club</div>
              </button>
            </div>

            <div style={{ marginTop: 20 }}>
              {loginRole === 'coach' && (
                <PinPad value={coachPinInput} onChange={setCoachPinInput} label="Code coach" onComplete={(pin) => handleLogin(pin)} />
              )}
              {loginRole === 'parent' && (
                <PinPad value={parentPinInput} onChange={setParentPinInput} label="Code parent" onComplete={(pin) => handleLogin(pin)} />
              )}
            </div>
          </div>
        </div>
      </div>
    );

}

// ─── APP CONNECTÉE ─────────────────────────────────────────────────────────
return (

<div style={styles.appPage}>
<div style={styles.container}>
{/_ Header _/}
<div style={styles.header}>
<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
<img src={CLUB_LOGO} alt="CA Gorcy Handball"
style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }} />
<div>
<div style={styles.headerBadge}>CA Gorcy Handball</div>
<h1 style={{ margin: '8px 0 6px 0' }}>
{activeRole === 'coach' ? (isAdmin ? '👑 Admin' : '🏆 Espace Coach') : '👪 Espace Parent'}
</h1>
<p style={{ margin: 0, opacity: 0.92 }}>
{activeRole === 'coach'
? isAdmin ? 'Accès complet à toutes les équipes' : `Vos équipes : ${allowedTeamIds.map(getTeamName).join(', ')}`
: 'Présences et infos équipe'}
</p>
</div>
</div>
<button onClick={handleLogout} style={styles.logoutButton}>{"Déconnexion"}</button>
</div>

        {/* ─── VUE COACH ─────────────────────────────────────────────────── */}
        {activeRole === 'coach' && (
          <>
            {/* Menu onglets */}
            <div style={styles.coachMenu}>
              {(['trainings', 'matches', 'stats', 'players', 'users', 'messages', ...(isAdmin ? ['admin'] : [])] as CoachTab[]).map((tab) => {
                const labels: Record<CoachTab, string> = {
                  trainings: '📅 Entraînements', matches: '⚽ Matchs', stats: '📊 Stats',
                  players: '👥 Joueurs', users: '🔒 Utilisateurs',
                  messages: '💬 Messages', admin: '⚙️ Administration',
                };
                return (
                  <button key={tab} onClick={() => setCoachTab(tab)}
                    style={{ ...styles.menuButton, ...(coachTab === tab ? styles.menuButtonActive : {}) }}>
                    {labels[tab]}
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
                  <select value={selectedCoachTeamId} onChange={(e) => setSelectedCoachTeamId(e.target.value)} style={styles.select}>
                    {visibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {(() => {
                  // Calculer les 2 prochaines séances toutes templates confondues
                  const today = new Date(); today.setHours(0,0,0,0);
                  const upcoming: { template: TrainingTemplate; date: string }[] = [];
                  for (const template of coachTemplates) {
                    const dates = getNextDatesForWeekday(template.weekday, 4);
                    for (const date of dates) {
                      const d = new Date(date); d.setHours(0,0,0,0);
                      if (d >= today) upcoming.push({ template, date });
                    }
                  }
                  upcoming.sort((a, b) => a.date.localeCompare(b.date));
                  const next2 = upcoming.slice(0, 2);

                  if (next2.length === 0) return <div style={styles.emptyState}>Aucun entraînement prévu.</div>;

                  return (
                    <div style={{ display: 'grid', gap: 20 }}>
                      {next2.map(({ template, date }) => {
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
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ ...styles.statusBadge, ...styles.badgeGreen }}>✅ {counts.present}</span>
                                <span style={{ ...styles.statusBadge, ...styles.badgeRed }}>❌ {counts.absent}</span>
                                <span style={{ ...styles.statusBadge, ...styles.badgeGray }}>❓ {counts.unknown}</span>
                              </div>
                            </div>

                            {/* Présents */}
                            {presentPlayers.length > 0 && (
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
                            {absentPlayers.length > 0 && (
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
                            {unknownPlayers.length > 0 && (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#526071', marginBottom: 6 }}>❓ Sans réponse ({unknownPlayers.length})</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {unknownPlayers.map((p) => (
                                    <span key={p.id} style={{ background: '#eef2f7', color: '#526071', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>{getPlayerName(p)}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── MATCHS ── */}
            {coachTab === 'matches' && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>Matchs</h2>
                <p style={styles.blockSubtitle}>Convocation (max {MAX_MATCH_PLAYERS} joueurs), résultat, présences et stats.</p>

                <div style={styles.panelCard}>
                  <h3 style={styles.panelTitle}>{"Sélectionner un match"}</h3>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>{"Équipe"}</label>
                      <select value={selectedCoachTeamId} onChange={(e) => setSelectedCoachTeamId(e.target.value)} style={styles.select}>
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
                    ? <div style={styles.emptyState}>{"Choisis un match pour voir le détail."}</div>
                    : (
                      <div style={{ marginTop: 16 }}>
                        <h4 style={{ marginTop: 0 }}>{getTeamName(selectedMatch.team_id)} vs {selectedMatch.opponent || '-'}</h4>
                        <p style={{ color: '#5b6472', marginTop: 0 }}>
                          {formatDate(selectedMatch.match_date)} {formatTime(selectedMatch.match_date)} – {selectedMatch.location || '-'} – {selectedMatch.home_away === 'home' ? 'Domicile' : 'Extérieur'}
                        </p>

                        {/* Résultat */}
                        <div style={{ ...styles.panelCard, marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <h4 style={{ margin: '0 0 12px 0', color: '#92400e' }}>{"Résultat du match"}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#5b6472', marginBottom: 4 }}>{getTeamName(selectedMatch.team_id)}</div>
                              <input type="number" min={0}
                                value={matchResults[selectedMatch.id]?.score_home || ''}
                                onChange={(e) => setMatchResults((prev) => ({ ...prev, [selectedMatch.id]: { ...prev[selectedMatch.id], score_home: e.target.value } }))}
                                style={{ ...styles.input, width: 80, textAlign: 'center', fontSize: 28, fontWeight: 800, padding: '8px', minHeight: 'auto' }}
                                placeholder="0" />
                            </div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#374151', alignSelf: 'flex-end', paddingBottom: 8 }}>{"–"}</div>
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

                        {/* Convocation */}
                        <div style={{ ...styles.panelCard, marginBottom: 20, background: '#f0f7ff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <h4 style={{ margin: 0 }}>Convocation</h4>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ ...styles.statusBadge, ...(squadForSelectedMatch.length >= MAX_MATCH_PLAYERS ? styles.badgeRed : styles.badgeGreen) }}>
                                {squadForSelectedMatch.length} / {MAX_MATCH_PLAYERS} joueurs
                              </span>
                              {isSquadDefined(selectedMatch.id) && squadForSelectedMatch.length > 0 && (
                                <button
                                  onClick={() => sendAllConvocations(selectedMatch.id)}
                                  disabled={sendingConvocations}
                                  style={{ padding: '8px 14px', borderRadius: 12, border: 'none', background: sendingConvocations ? '#9ca3af' : '#0A5FB5', color: 'white', fontWeight: 700, fontSize: 13, cursor: sendingConvocations ? 'default' : 'pointer' }}>
                                  {sendingConvocations ? '⏳ Envoi...' : '📧 Envoyer les convocations'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {playersForSelectedMatch.length === 0
                              ? <div style={styles.emptyState}>{"Aucun joueur dans cette équipe."}</div>
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
                        </div>

                        {/* Présences & stats */}
                        {playersForSelectedMatch.length === 0
                          ? <div style={styles.emptyState}>{"Aucun joueur dans cette équipe."}</div>
                          : (
                            <>
                              <div style={styles.attendanceRow}>
                                {(() => {
                                  const counts = getMatchCounts(selectedMatch.id, selectedMatch.team_id || '');
                                  return (<><span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span><span>Convoqués : {squadForSelectedMatch.length}</span></>);
                                })()}
                              </div>
                              {!isSquadDefined(selectedMatch.id) && (
                                <div style={{ ...styles.panelCard, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 12 }}>
                                  <p style={{ margin: 0, color: '#92400e', fontSize: 13 }}>{"Définis d'abord la convocation ci-dessus."}</p>
                                </div>
                              )}

                              {/* Présences individuelles */}
                              <div style={{ display: 'grid', gap: 8, marginTop: 16, marginBottom: 20 }}>
                                {playersForSelectedMatch.map((player) => {
                                  const inSquad = !isSquadDefined(selectedMatch.id) || squadForSelectedMatch.includes(player.id);
                                  const status = getMatchAttendanceStatus(selectedMatch.id, player.id);
                                  return (
                                    <div key={player.id} style={{ ...styles.playerAttendanceRow, background: inSquad ? '#f8fbff' : '#f9fafb', border: inSquad ? '1px solid #d8e5f2' : '1px dashed #e2e8f0' }}>
                                      <strong>{getPlayerName(player)}</strong>
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
                                })}
                              </div>

                              {/* Tableau des stats groupé */}
                              {isSquadDefined(selectedMatch.id) && squadForSelectedMatch.length > 0 && (
                                <div style={{ ...styles.panelCard, background: '#f0f7ff', border: '1px solid #bfdbfe' }}>
                                  <h4 style={{ margin: '0 0 14px 0', color: '#1e40af' }}>📊 Stats du match — tableau groupé</h4>
                                  <MatchStatsTable
                                    players={playersForSelectedMatch
                                      .filter((p) => squadForSelectedMatch.includes(p.id))
                                      .map((p) => ({ id: p.id, name: getPlayerName(p) }))}
                                    initialStats={Object.fromEntries(
                                      matchPlayerStats
                                        .filter((s) => s.match_id === selectedMatch.id)
                                        .map((s) => [s.player_id, { goals: s.goals, assists: (s as any).assists || 0, shots: s.shots, saves: s.saves, penalty_scored: s.penalty_scored, two_minutes: s.two_minutes }])
                                    )}
                                    onSaveAll={(rows) => saveAllMatchStats(selectedMatch.id, rows)}
                                    isCoach={true}
                                  />
                                </div>
                              )}
                            </>
                          )}
                      </div>
                    )}
                </div>
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
                    const totalTrainings = getTrainingTotalCount(selectedCoachTeamId);
                    const totalMatches = getMatchTotalCount(selectedCoachTeamId);
                    const sorted = [...coachTeamPlayers].sort((a, b) => (getStatForPlayer(b.id)?.goals || 0) - (getStatForPlayer(a.id)?.goals || 0));
                    return (
                      <div style={{ overflowX: 'auto' }}>
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
                              const ps = getStatForPlayer(player.id);
                              return (
                                <tr key={player.id} style={{ background: idx % 2 === 0 ? 'white' : '#f5f8fd' }}>
                                  <td style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', fontWeight: 700 }}>{idx + 1}</td>
                                  <td style={{ ...styles.td, fontWeight: 700 }}>{getPlayerName(player)}</td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: '#dbeafe', color: '#1e40af' }}>{ps?.goals || 0}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}>{(() => { const totalShots = matchPlayerStats.filter((s) => s.player_id === player.id).reduce((sum, s) => sum + (s.shots || 0), 0); return <span style={{ ...styles.statPill, background: '#ede9fe', color: '#5b21b6' }}>{totalShots}</span>; })()}</td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}>{(() => { const totalShots = matchPlayerStats.filter((s) => s.player_id === player.id).reduce((sum, s) => sum + (s.shots || 0), 0); const goals = ps?.goals || 0; const pct = totalShots > 0 ? Math.round((goals / totalShots) * 100) : 0; return <span style={{ ...styles.statPill, background: pct >= 50 ? '#d1fae5' : pct > 0 ? '#fef3c7' : '#f1f5f9', color: pct >= 50 ? '#065f46' : pct > 0 ? '#92400e' : '#94a3b8', fontWeight: 800 }}>{totalShots > 0 ? `${pct}%` : '-'}</span>; })()}</td>
                                  <td style={{ ...styles.td, textAlign: 'center' }}><span style={{ ...styles.statPill, background: '#d1fae5', color: '#065f46' }}>{ps?.saves || 0}</span></td>
                                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#0A5FB5' }}>{getTrainingPresentCount(player.id)} / {totalTrainings}</td>
                                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: '#0A5FB5' }}>{getMatchPresentCount(player.id)} / {totalMatches}</td>
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
                      <label style={styles.inputLabel}>Parent</label>
                      <select value={selectedLinkParentId} onChange={(e) => setSelectedLinkParentId(e.target.value)} style={styles.select}>
                        {parentUsers.map((p) => <option key={p.id} value={p.id}>{getUserName(p)} {p.email ? `(${p.email})` : ''}</option>)}
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
                  {visiblePlayers.length === 0
                    ? <div style={styles.emptyState}>Aucun joueur.</div>
                    : visiblePlayers.map((player) => {
                      const linkedParents = getLinkedParentsForPlayer(player.id);
                      return (
                        <div key={player.id} style={styles.teamCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                              <h3 style={{ margin: 0 }}>{getPlayerName(player)}</h3>
                              <p style={{ margin: '8px 0 0 0', color: '#5b6472' }}>Équipe : {getTeamName(player.team_id)}</p>
                              <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>Parents : {linkedParents.length > 0 ? linkedParents.map((p) => getUserName(p)).join(', ') : 'Aucun parent lié'}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button onClick={() => startEditPlayer(player)} style={styles.secondaryButton}>Modifier</button>
                              <button onClick={() => deletePlayer(player)} style={{ ...styles.smallButton, background: '#fee2e2', color: '#991b1b' }}>Supprimer</button>
                            </div>
                          </div>
                          {linkedParents.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div style={styles.miniTitle}>Liens parents</div>
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
                    })}
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
                      <label style={styles.inputLabel}>Parent</label>
                      <select value={selectedManagedParentId} onChange={(e) => setSelectedManagedParentId(e.target.value)} style={styles.select}>
                        {parentUsers.length === 0
                          ? <option value="">Aucun parent</option>
                          : parentUsers.map((p) => <option key={p.id} value={p.id}>{getUserName(p)}{p.email ? ` – ${p.email}` : ''}</option>)}
                      </select>
                    </div>
                    <div><label style={styles.inputLabel}>{"Prénom"}</label><input value={managedParentFirstName} onChange={(e) => setManagedParentFirstName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Nom</label><input value={managedParentLastName} onChange={(e) => setManagedParentLastName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Email</label><input value={managedParentEmail} onChange={(e) => setManagedParentEmail(e.target.value)} style={styles.input} type="email" /></div>
                    <div>
                      <label style={styles.inputLabel}>Code PIN parent</label>
                      <input value={managedParentPin} onChange={(e) => setManagedParentPin(e.target.value.replace(/\D/g, '').slice(0, 4))} style={styles.input} placeholder="4 chiffres" inputMode="numeric" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={saveManagedParent} style={styles.primaryButton} disabled={savingManagedParent}>{savingManagedParent ? 'Enregistrement...' : 'Enregistrer'}</button>
                    <button onClick={() => setManagedParentPin(generateFourDigitPin())} style={styles.secondaryOutlineButton}>{"Générer nouveau code"}</button>
                  </div>
                  <div style={styles.warningBox}>{"Les codes PIN parents sont utilisés pour se connecter à l'espace parent."}</div>
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
                                <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>Parents : {linkedParents.length > 0 ? linkedParents.map((p) => getUserName(p)).join(', ') : 'Aucun parent lié'}</p>
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
                          <button onClick={() => setSelectedConvId(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontWeight: 800, fontSize: 20, cursor: 'pointer', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
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
                                  <div style={{ maxWidth: '78%', padding: '10px 15px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: mine ? '#0A5FB5' : '#edf2f7', color: mine ? 'white' : '#10233b', fontSize: 15, lineHeight: 1.5, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const }}>
                                    {msg.content}
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
                      return (
                        <div key={conv.id} onClick={() => setSelectedConvId(conv.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, border: '1px solid #d8e5f2', background: '#f8fbff', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,95,181,0.12)')}
                          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}>
                          <div style={{ width: 46, height: 46, borderRadius: '50%', background: conv.is_group ? '#fde68a' : '#0A5FB5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: conv.is_group ? 20 : 18, fontWeight: 800, color: conv.is_group ? '#92400e' : 'white', flexShrink: 0 }}>
                            {conv.is_group ? '👥' : (par?.first_name?.[0]?.toUpperCase() || '?')}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: '#10233b' }}>{convTitle}</div>
                            <div style={{ fontSize: 12, color: '#5b6472', marginTop: 2 }}>{tm?.name || ''} · {lastUpdated}</div>
                          </div>
                          <div style={{ ...styles.secondaryButton, fontSize: 13, padding: '8px 14px', flexShrink: 0, pointerEvents: 'none' }}>
                            Ouvrir →
                          </div>
                        </div>
                      );
                    })}
                  </div>}
              </div>
            )}

            {coachTab === 'admin' && isAdmin && (
              <div style={styles.contentCard}>
                <h2 style={styles.blockTitle}>{"⚙️ Administration"}</h2>
                <p style={styles.blockSubtitle}>{"Gestion des comptes coach, entraînements, matchs et joueurs."}</p>

                {/* Gestion des comptes coach */}
                <div style={{ ...styles.formCard, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#92400e' }}>{"👤 Créer / modifier un compte Coach"}</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#9a3412', fontSize: 14 }}>
                    Chaque coach a un code unique et peut voir une ou plusieurs équipes.
                  </p>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>{"Prénom coach"}</label>
                      <input
                        value={newCoachFirstName}
                        onChange={(e) => setNewCoachFirstName(e.target.value)}
                        style={styles.input}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Nom coach</label>
                      <input
                        value={newCoachLastName}
                        onChange={(e) => setNewCoachLastName(e.target.value)}
                        style={styles.input}
                        placeholder="Nom"
                      />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Code coach (4 chiffres)</label>
                      <input
                        value={newCoachCode}
                        onChange={(e) => setNewCoachCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        style={styles.input}
                        placeholder="Ex : 4521"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={styles.inputLabel}>{"Équipes assignées (une ou plusieurs)"}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
                      {teams.map((t) => (
                        <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: `2px solid ${newCoachTeamIds.includes(t.id) ? '#0A5FB5' : '#d5dfeb'}`, background: newCoachTeamIds.includes(t.id) ? '#eaf4ff' : '#f8fbff', cursor: 'pointer', fontWeight: 600 }}>
                          <input
                            type="checkbox"
                            checked={newCoachTeamIds.includes(t.id)}
                            onChange={() => toggleNewCoachTeam(t.id)}
                            style={{ width: 18, height: 18, accentColor: '#0A5FB5' }}
                          />
                          {t.name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <button onClick={addCoachAccess} style={styles.primaryButton} disabled={savingCoach}>
                    {savingCoach ? 'Création...' : '➕ Créer / mettre à jour le coach'}
                  </button>
                </div>

                {/* Liste des coaches existants */}
                <div style={{ ...styles.panelCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>Coaches existants</h3>
                  {Object.keys(coachSummary).length === 0
                    ? <div style={styles.emptyState}>{"Aucun coach créé."}</div>
                    : <div style={{ display: 'grid', gap: 10 }}>
                      {Object.entries(coachSummary).map(([code, info]) => (
                        <div key={code} style={styles.linkRow}>
                          <div>
                            <strong style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 2 }}>🔒 {code}</strong>
                            {(info.firstName || info.lastName) && (
                              <div style={{ fontWeight: 700, marginTop: 2 }}>{info.firstName} {info.lastName}</div>
                            )}
                            <div style={{ color: '#5b6472', fontSize: 14, marginTop: 4 }}>
                              Équipes : {info.teamIds.map(getTeamName).join(', ') || 'Aucune'}
                            </div>
                          </div>
                          <button onClick={() => deleteCoachAccess(code)} style={styles.linkRemoveButton}>Supprimer</button>
                        </div>
                      ))}
                    </div>}
                </div>

                {/* Entraînements */}
                <div style={{ ...styles.formCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>{"Ajouter un entraînement récurrent"}</h3>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>{"Équipe"}</label>
                      <select value={newTrainingTeamId} onChange={(e) => setNewTrainingTeamId(e.target.value)} style={styles.select}>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div><label style={styles.inputLabel}>Titre</label><input value={newTrainingTitle} onChange={(e) => setNewTrainingTitle(e.target.value)} style={styles.input} /></div>
                    <div>
                      <label style={styles.inputLabel}>Jour</label>
                      <select value={newTrainingWeekday} onChange={(e) => setNewTrainingWeekday(e.target.value)} style={styles.select}>
                        <option value="1">Lundi</option><option value="2">Mardi</option><option value="3">Mercredi</option>
                        <option value="4">Jeudi</option><option value="5">Vendredi</option><option value="6">Samedi</option><option value="0">Dimanche</option>
                      </select>
                    </div>
                    <div><label style={styles.inputLabel}>{"Début"}</label><input type="time" value={newTrainingStart} onChange={(e) => setNewTrainingStart(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Fin</label><input type="time" value={newTrainingEnd} onChange={(e) => setNewTrainingEnd(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Lieu</label><input value={newTrainingLocation} onChange={(e) => setNewTrainingLocation(e.target.value)} style={styles.input} /></div>
                  </div>
                  <button onClick={addTrainingTemplate} style={styles.primaryButton}>{"Ajouter l'entraînement"}</button>
                </div>

                {/* Match */}
                <div style={{ ...styles.formCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>Ajouter un match</h3>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>{"Équipe"}</label>
                      <select value={newMatchTeamId} onChange={(e) => setNewMatchTeamId(e.target.value)} style={styles.select}>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div><label style={styles.inputLabel}>Adversaire</label><input value={newMatchOpponent} onChange={(e) => setNewMatchOpponent(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Date & heure</label><input type="datetime-local" value={newMatchDate} onChange={(e) => setNewMatchDate(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Lieu</label><input value={newMatchLocation} onChange={(e) => setNewMatchLocation(e.target.value)} style={styles.input} /></div>
                    <div>
                      <label style={styles.inputLabel}>Type</label>
                      <select value={newMatchHomeAway} onChange={(e) => setNewMatchHomeAway(e.target.value as 'home' | 'away')} style={styles.select}>
                        <option value="home">Domicile</option><option value="away">{"Extérieur"}</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={addMatch} style={styles.primaryButton}>Ajouter le match</button>
                </div>

                {/* Joueur */}
                <div style={{ ...styles.formCard, marginTop: 18 }}>
                  <h3 style={styles.panelTitle}>Ajouter un joueur</h3>
                  <div style={styles.formGrid}>
                    <div><label style={styles.inputLabel}>{"Prénom"}</label><input value={playerFormFirstName} onChange={(e) => setPlayerFormFirstName(e.target.value)} style={styles.input} /></div>
                    <div><label style={styles.inputLabel}>Nom</label><input value={playerFormLastName} onChange={(e) => setPlayerFormLastName(e.target.value)} style={styles.input} /></div>
                    <div>
                      <label style={styles.inputLabel}>{"Équipe"}</label>
                      <select value={playerFormTeamId} onChange={(e) => setPlayerFormTeamId(e.target.value)} style={styles.select}>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={savePlayer} style={styles.primaryButton} disabled={savingPlayer}>{savingPlayer ? 'Enregistrement...' : 'Ajouter le joueur'}</button>
                    <button onClick={resetPlayerForm} style={styles.secondaryOutlineButton}>{"Réinitialiser"}</button>
                  </div>
                </div>

                {/* Compte enfant */}
                <div style={{ ...styles.formCard, marginTop: 18 }}>
                  <div style={styles.createAccountHeader}>
                    <div>
                      <h3 style={{ margin: 0 }}>Nouveau compte enfant</h3>
                      <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{"Crée un enfant et son parent avec un code PIN automatique."}</p>
                    </div>
                    <button onClick={() => setShowCreateChildForm((p) => !p)} style={styles.secondaryOutlineButton}>
                      {showCreateChildForm ? 'Fermer' : 'Créer'}
                    </button>
                  </div>
                  {showCreateChildForm && (
                    <div style={{ marginTop: 18 }}>
                      <div style={styles.formGrid}>
                        <div><label style={styles.inputLabel}>{"Prénom enfant"}</label><input value={newChildFirstName} onChange={(e) => setNewChildFirstName(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Nom enfant</label><input value={newChildLastName} onChange={(e) => setNewChildLastName(e.target.value)} style={styles.input} /></div>
                        <div>
                          <label style={styles.inputLabel}>{"Équipe"}</label>
                          <select value={newChildTeamId} onChange={(e) => setNewChildTeamId(e.target.value)} style={styles.select}>
                            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                        <div><label style={styles.inputLabel}>{"Prénom parent"}</label><input value={newParentFirstName} onChange={(e) => setNewParentFirstName(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Nom parent</label><input value={newParentLastName} onChange={(e) => setNewParentLastName(e.target.value)} style={styles.input} /></div>
                        <div><label style={styles.inputLabel}>Email parent</label><input value={newParentEmail} onChange={(e) => setNewParentEmail(e.target.value)} style={styles.input} type="email" /></div>
                      </div>
                      <button onClick={createChildAccount} style={{ ...styles.primaryButton, width: '100%', opacity: creatingChildAccount ? 0.7 : 1 }} disabled={creatingChildAccount}>
                        {creatingChildAccount ? 'Création...' : 'Créer le compte enfant'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Saisons */}
                <div style={{ ...styles.formCard, marginTop: 18, background: '#f0fdf4', border: '1px solid #86efac' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#14532d' }}>🗓 Gestion des saisons</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#166534', fontSize: 14 }}>Créez des saisons pour organiser les stats par période (ex: 2025/2026).</p>
                  <div style={styles.formGrid}>
                    <div>
                      <label style={styles.inputLabel}>Équipe</label>
                      <select value={newSeasonTeamId} onChange={(e) => setNewSeasonTeamId(e.target.value)} style={styles.select}>
                        <option value="">-- Toutes équipes --</option>
                        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Nom de la saison</label>
                      <input value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} style={styles.input} placeholder="Ex: 2025/2026" />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Date début</label>
                      <input type="date" value={newSeasonStart} onChange={(e) => setNewSeasonStart(e.target.value)} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.inputLabel}>Date fin</label>
                      <input type="date" value={newSeasonEnd} onChange={(e) => setNewSeasonEnd(e.target.value)} style={styles.input} />
                    </div>
                  </div>
                  <button onClick={addSeason} style={{ ...styles.primaryButton, background: '#16a34a' }} disabled={savingSeason}>
                    {savingSeason ? 'Création...' : '+ Créer la saison'}
                  </button>
                  {seasons.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={styles.miniTitle}>Saisons existantes</div>
                      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                        {seasons.map((s) => (
                          <div key={s.id} style={{ ...styles.linkRow, background: '#f0fdf4', border: '1px solid #86efac' }}>
                            <div>
                              <strong style={{ color: '#14532d' }}>{s.name}</strong>
                              <div style={{ fontSize: 13, color: '#5b6472', marginTop: 2 }}>{s.start_date} → {s.end_date} · {s.team_id ? (teams.find(t => t.id === s.team_id)?.name || 'Équipe inconnue') : 'Toutes équipes'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Paramètres */}
                <div style={{ ...styles.formCard, marginTop: 18, background: '#f0f4ff', border: '1px solid #c7d2fe' }}>
                  <h3 style={{ margin: '0 0 6px 0', color: '#3730a3' }}>⚙️ Paramètres de l'application</h3>
                  <p style={{ margin: '0 0 16px 0', color: '#4338ca', fontSize: 14 }}>URL de l'app et liens championnat affichés aux parents.</p>
                  <div style={styles.formGrid}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={styles.inputLabel}>🔗 URL de l'application</label>
                      <input value={appSettings.app_url} onChange={(e) => setAppSettings((p) => ({ ...p, app_url: e.target.value }))} style={styles.input} placeholder="https://..." />
                    </div>
                    {([
                      ['championship_u9', '🏆 Lien championnat U9'],
                      ['championship_u11_garcon', '🏆 Lien championnat U11 Garçon'],
                      ['championship_u11_fille', '🏆 Lien championnat U11 Fille'],
                      ['championship_u13_garcon', '🏆 Lien championnat U13 Garçon'],
                      ['championship_u13_fille', '🏆 Lien championnat U13 Fille'],
                      ['championship_u15', '🏆 Lien championnat U15'],
                      ['championship_u17', '🏆 Lien championnat U17'],
                      ['championship_u18', '🏆 Lien championnat U18'],
                      ['championship_senior', '🏆 Lien championnat Senior'],
                    ] as [keyof AppSettings, string][]).map(([key, label]) => (
                      <div key={key}>
                        <label style={styles.inputLabel}>{label}</label>
                        <input value={appSettings[key]} onChange={(e) => setAppSettings((p) => ({ ...p, [key]: e.target.value }))} style={styles.input} placeholder="https://..." />
                      </div>
                    ))}
                  </div>
                  <button onClick={saveSettings} style={{ ...styles.primaryButton, background: '#4338ca', marginTop: 8 }} disabled={savingSettings}>
                    {savingSettings ? 'Enregistrement...' : '💾 Enregistrer les paramètres'}
                  </button>
                </div>

              </div>
            )}
          </>
        )}

        {/* ─── VUE PARENT ───────────────────────────────────────────────────── */}
        {activeRole === 'parent' && (
          <div style={styles.contentCard}>
            <h2 style={styles.blockTitle}>Espace Parent</h2>
            {parentPlayers.length === 0
              ? <div style={styles.emptyState}>{"Aucun enfant lié à ce compte parent."}</div>
              : (
                <div style={{ display: 'grid', gap: 18 }}>
                  {parentPlayers.map((child) => {
                    const childTeam = teams.find((t) => t.id === child.team_id) || null;
                    const childMatches = matches.filter((m) => m.team_id === child.team_id && isFutureOrToday(m.match_date)).sort((a, b) => (a.match_date || '').localeCompare(b.match_date || '')).slice(0, 2);
                    const childStats = stats.find((s) => s.player_id === child.id) || null;
                    const childTemplates = trainingTemplates.filter((t) => t.team_id === child.team_id && t.active !== false);
                    const childUpcomingTrainings: UpcomingTraining[] = childTemplates.flatMap((template) =>
                      getNextDatesForWeekday(template.weekday, 6).map((date) => ({
                        templateId: template.id, teamId: template.team_id, title: template.title,
                        weekday: template.weekday, startTime: template.start_time, endTime: template.end_time,
                        location: template.location, date,
                      }))
                    ).sort((a, b) => a.date.localeCompare(b.date));

                    return (
                      <div key={child.id} style={styles.childSection}>
                        <div style={styles.profileCard}>
                          <div style={styles.profileAvatar}>{"⚽"}</div>
                          <div>
                            <h3 style={{ margin: '0 0 6px 0' }}>{getPlayerName(child)}</h3>
                            <p style={{ margin: 0, color: '#5b6472' }}>{"Équipe : "}<strong>{childTeam?.name || 'Non définie'}</strong></p>
                          </div>
                        </div>

                        <div style={{ ...styles.panelCard, marginBottom: 16 }}>
                          <h3 style={styles.panelTitle}>{"Statistiques de présence"}</h3>
                          <div style={styles.statsGrid}>
                            {([
                              ['Entraînements', `${getTrainingPresentCount(child.id)} / ${child.team_id ? getTrainingTotalCount(child.team_id) : 0}`],
                              ['Matchs', `${getMatchPresentCount(child.id)} / ${child.team_id ? getMatchTotalCount(child.team_id) : 0}`],
                              ['Buts', childStats?.goals || 0],
                              ['Passes', childStats?.assists || 0],
                              ['Arrêts', childStats?.saves || 0],
                            ] as [string, string | number][]).map(([label, val]) => (
                              <div key={label} style={styles.statBox}>
                                <div style={styles.statValue}>{val}</div>
                                <div style={styles.statLabel}>{label}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={styles.panelCard}>
                          <h3 style={styles.panelTitle}>{"2 prochains entraînements"}</h3>
                          {childUpcomingTrainings.slice(0, 2).length === 0
                            ? <p style={styles.emptyText}>{"Aucun entraînement programmé."}</p>
                            : <div style={{ display: 'grid', gap: 12 }}>
                              {childUpcomingTrainings.slice(0, 2).map((training) => {
                                const status = getAttendanceStatus(training.templateId, child.id, training.date);
                                const counts = getTrainingCounts(training.templateId, training.teamId || '', training.date);
                                return (
                                  <div key={`${training.templateId}-${training.date}-${child.id}`} style={styles.trainingCard}>
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ margin: '0 0 6px 0' }}>{training.title || 'Entraînement'}</h4>
                                      <p style={{ margin: 0, color: '#5b6472' }}>{formatDate(training.date)} – {getWeekdayLabel(training.weekday)} – {training.startTime}–{training.endTime}</p>
                                      <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{training.location || '-'}</p>
                                      <div style={{ ...styles.attendanceRow, marginTop: 10, marginBottom: 0 }}>
                                        <span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'present')} style={{ ...styles.statusButton, background: status === 'present' ? '#16a34a' : '#e8f7ee', color: status === 'present' ? 'white' : '#166534' }}>{"Présent"}</button>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'absent')} style={{ ...styles.statusButton, background: status === 'absent' ? '#dc2626' : '#fdecec', color: status === 'absent' ? 'white' : '#991b1b' }}>Absent</button>
                                      <button onClick={() => saveAttendance(training.templateId, child.id, training.date, 'unknown' as any)} style={{ ...styles.statusButton, background: status === 'unknown' ? '#64748b' : '#eef2f7', color: status === 'unknown' ? 'white' : '#526071' }}>Sans réponse</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>}
                        </div>

                        <div style={{ ...styles.panelCard, marginTop: 16 }}>
                          <h3 style={styles.panelTitle}>2 prochains matchs</h3>
                          {childMatches.length === 0
                            ? <p style={styles.emptyText}>{"Aucun match programmé."}</p>
                            : <div style={{ display: 'grid', gap: 12 }}>
                              {childMatches.map((match) => {
                                const squad = getSquadForMatch(match.id);
                                const isConvoked = !isSquadDefined(match.id) || squad.includes(child.id);
                                const status = getMatchAttendanceStatus(match.id, child.id);
                                const counts = getMatchCounts(match.id, match.team_id || '');
                                return (
                                  <div key={`${match.id}-${child.id}`} style={styles.trainingCard}>
                                    <div style={{ flex: 1 }}>
                                      <h4 style={{ margin: '0 0 6px 0' }}>vs {match.opponent || '-'}</h4>
                                      <p style={{ margin: 0, color: '#5b6472' }}>{formatDate(match.match_date)} {formatTime(match.match_date)} – {match.location || '-'}</p>
                                      <p style={{ margin: '6px 0 0 0', color: '#5b6472' }}>{match.home_away === 'home' ? 'Domicile' : 'Extérieur'}</p>
                                      {match.score_home !== null && match.score_home !== undefined && match.score_home !== '' && (
                                        <p style={{ margin: '6px 0 0 0', fontWeight: 800, color: '#0A5FB5', fontSize: 16 }}>Score : {match.score_home} – {match.score_away}</p>
                                      )}
                                      <div style={{ ...styles.attendanceRow, marginTop: 10, marginBottom: 0 }}>
                                        <span>Présents : {counts.present}</span><span>Absents : {counts.absent}</span><span>Sans réponse : {counts.unknown}</span>
                                      </div>
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
                            </div>}
                        </div>

                        {/* Lien championnat */}
                        {(() => {
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
              )}
          </div>
        )}
      </div>
        {/* Parent messages */}
        {activeRole === 'parent' && (selectedConvId || parentConvId) && (
          <div style={{ ...styles.contentCard, marginTop: 20 }}>
            <h2 style={styles.blockTitle}>{"💬 Messages"}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', height: 440, border: '1px solid #d8e5f2', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #d8e5f2', background: '#f0f7ff' }}>
                <strong>{"Conversation avec le staff"}</strong>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: '#fafcff' }}>
                {messages.length === 0
                  ? <div style={{ textAlign: 'center', color: '#5b6472', marginTop: 40, fontSize: 14 }}>{"Aucun message. Envoyez un message au coach !"}</div>
                  : messages.map((msg) => {
                    const mine = msg.sender_type === 'parent';
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{mine ? 'Moi' : 'Coach'}</div>
                        <div style={{ maxWidth: '70%', padding: '9px 13px', borderRadius: mine ? '16px 16px 3px 16px' : '16px 16px 16px 3px', background: mine ? '#0A5FB5' : '#edf2f7', color: mine ? 'white' : '#10233b', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' as const }}>{msg.content}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid #d8e5f2', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const cid = selectedConvId || parentConvId; if (cid) sendMessage(cid, 'parent', selectedParentId); } }}
                  placeholder={"Message..."} rows={1}
                  style={{ flex: 1, padding: '9px 13px', borderRadius: 18, border: '1px solid #cfd8e3', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'Arial, sans-serif', lineHeight: 1.4 }} />
                <button onClick={() => { const cid = selectedConvId || parentConvId; if (cid) sendMessage(cid, 'parent', selectedParentId); }} disabled={sendingMessage || !newMessage.trim()}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: newMessage.trim() ? '#0A5FB5' : '#ccd8e8', color: 'white', fontSize: 20, cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>
                  {'→'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>

);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
page: { minHeight: '100vh', background: 'linear-gradient(180deg, #edf4ff 0%, #dbeaff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Arial, sans-serif' },
appPage: { minHeight: '100vh', background: '#edf4ff', padding: 20, fontFamily: 'Arial, sans-serif' },
container: { maxWidth: 1150, margin: '0 auto' },
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
header: { background: 'linear-gradient(135deg, #0A5FB5, #062C5D)', color: 'white', borderRadius: 28, padding: 24, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
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
