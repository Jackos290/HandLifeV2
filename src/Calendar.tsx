import React, { useState, useMemo } from 'react';

type MatchItem = {
  id: string; team_id: string; opponent: string; match_date: string;
  location: string; home_away: string;
  score_home: string | number | null; score_away: string | number | null;
};
type Team = { id: string; name: string; category: string; };
type TrainingTemplate = {
  id: string; team_id: string; title: string; weekday: number;
  start_time: string; end_time: string; location: string; active?: boolean;
};
type ClubEvent = {
  id: string; title: string; description: string | null;
  event_date: string; end_date: string | null; location: string | null;
  type: string; team_ids: string[]; created_at: string;
};
type EventAttendance = {
  id: string; event_id: string; player_id: string;
  status: 'present' | 'absent' | 'pending';
  responded_by: string; responded_at: string | null;
};
type Player = { id: string; first_name: string; last_name: string; team_id: string; };

type CalItem = {
  kind: 'match' | 'training' | 'event';
  date: string;
  teamId: string; teamName: string;
  label: string; detail: string;
  score: string | null;
  color: string; bg: string; border: string;
  isPast: boolean;
  rawEvent?: ClubEvent;
};

type Props = {
  matches: MatchItem[];
  teams: Team[];
  trainingTemplates: TrainingTemplate[];
  clubEvents: ClubEvent[];
  eventAttendance: EventAttendance[];
  getTeamName: (id: string) => string;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
  getNextDatesForWeekday: (weekday: number, count: number) => string[];
  onClose: () => void;
  activeRole: string;
  parentPlayers: Player[];
  players: Player[];
  saveEventAttendance: (eventId: string, playerId: string, status: 'present' | 'absent' | 'pending') => void;
  getEventAttendanceStatus: (eventId: string, playerId: string) => 'present' | 'absent' | 'pending';
  getEventCounts: (eventId: string) => { present: number; absent: number; pending: number };
};

const WEEKDAYS_S = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const WEEKDAYS_L = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const MONTHS_S = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const MONTHS_L = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const COLORS: Record<string, {color:string;bg:string;border:string}> = {
  match:      {color:'#0A5FB5',bg:'#eaf4ff',border:'#bfdbfe'},
  training:   {color:'#16a34a',bg:'#f0fdf4',border:'#86efac'},
  event:      {color:'#7c3aed',bg:'#fdf4ff',border:'#e9d5ff'},
  assembly:   {color:'#b45309',bg:'#fffbeb',border:'#fde68a'},
  outing:     {color:'#0891b2',bg:'#ecfeff',border:'#a5f3fc'},
  tournament: {color:'#be185d',bg:'#fdf2f8',border:'#fbcfe8'},
  other:      {color:'#6b7280',bg:'#f9fafb',border:'#e5e7eb'},
};
const TYPE_ICON: Record<string,string> = {
  match:'⚽',training:'🏋️',event:'📅',assembly:'🏛️',outing:'🎢',tournament:'🏆',other:'📌',
};

function isoDate(d: Date) { return d.toISOString().slice(0,10); }

export default function Calendar({
  matches, teams, trainingTemplates, clubEvents,
  getTeamName, formatTime,
  getNextDatesForWeekday, onClose,
  activeRole, parentPlayers, players,
  saveEventAttendance, getEventAttendanceStatus, getEventCounts,
}: Props) {

  const today = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const [view, setView] = useState<'list'|'month'>('list');
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterKind, setFilterKind] = useState<'all'|'match'|'training'|'event'>('all');
  const [showPast, setShowPast] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string|null>(null);

  // Build all items
  const allItems = useMemo(():CalItem[] => {
    const items:CalItem[] = [];

    matches.forEach((m) => {
      const c = COLORS.match;
      items.push({ kind:'match', date:m.match_date, teamId:m.team_id, teamName:getTeamName(m.team_id),
        label:`⚽ vs ${m.opponent}`,
        detail:`${m.home_away==='home'?'🏠 Domicile':'✈️ Extérieur'}${m.location?' · '+m.location:''}`,
        score:(m.score_home!==null&&m.score_home!=='')?`${m.score_home} – ${m.score_away}`:null,
        ...c, isPast:new Date(m.match_date)<today });
    });

    trainingTemplates.filter(t=>t.active!==false).forEach((t) => {
      const c = COLORS.training;
      getNextDatesForWeekday(t.weekday, 10).forEach((date) => {
        items.push({ kind:'training', date, teamId:t.team_id, teamName:getTeamName(t.team_id),
          label:`🏋️ ${t.title||'Entraînement'}`,
          detail:`${t.start_time}–${t.end_time}${t.location?' · '+t.location:''}`,
          score:null, ...c, isPast:new Date(date)<today });
      });
    });

    clubEvents.forEach((ev) => {
      const c = COLORS[ev.type]||COLORS.event;
      items.push({ kind:'event', date:ev.event_date,
        teamId:ev.team_ids?.[0]||'all',
        teamName:ev.team_ids?.length?ev.team_ids.map(getTeamName).join(', '):'Tous',
        label:`${TYPE_ICON[ev.type]||'📅'} ${ev.title}`,
        detail:`${ev.location||''}${ev.description?(ev.location?' · ':'')+ev.description:''}`,
        score:null, ...c, isPast:new Date(ev.event_date)<today, rawEvent:ev });
    });

    return items.sort((a,b)=>a.date.localeCompare(b.date));
  },[matches,trainingTemplates,clubEvents,today]);

  const filtered = useMemo(()=>allItems.filter((e)=>{
    if(!showPast&&e.isPast) return false;
    if(filterKind!=='all'&&e.kind!==filterKind) return false;
    if(filterTeam!=='all'){
      if(e.kind==='event'){
        const ev=e.rawEvent;
        if(ev?.team_ids?.length&&!ev.team_ids.includes(filterTeam)) return false;
      } else if(e.teamId!==filterTeam) return false;
    }
    return true;
  }),[allItems,showPast,filterKind,filterTeam]);

  const byDate = useMemo(()=>{
    const m:Record<string,CalItem[]>={};
    filtered.forEach((e)=>{ const k=e.date.slice(0,10); if(!m[k])m[k]=[]; m[k].push(e); });
    return m;
  },[filtered]);

  // Month grid (Mon-first)
  const monthGrid = useMemo(()=>{
    const first=new Date(calYear,calMonth,1);
    const last=new Date(calYear,calMonth+1,0);
    const startDow=(first.getDay()+6)%7;
    const days:(Date|null)[]=[];
    for(let i=0;i<startDow;i++) days.push(null);
    for(let d=1;d<=last.getDate();d++) days.push(new Date(calYear,calMonth,d));
    while(days.length%7!==0) days.push(null);
    return days;
  },[calYear,calMonth]);

  // Item card component
  function ItemCard({e,compact=false}:{e:CalItem;compact?:boolean}) {
    const d=new Date(e.date);
    const hasTime=e.date.length>10;
    const isEvent=e.kind==='event';
    const ev=e.rawEvent;
    const canRespond=isEvent&&(activeRole==='parent'||activeRole==='player');
    const respondPlayers=activeRole==='parent'?parentPlayers:
      (activeRole==='player'?players.slice(0,1):[]);

    return (
      <div style={{display:'flex',gap:compact?10:14,alignItems:'flex-start',
        padding:compact?'10px 12px':'14px 16px', borderRadius:compact?12:18,
        background:e.isPast?'#f8f9fb':e.bg, border:`1px solid ${e.isPast?'#e2e8f0':e.border}`,
        opacity:e.isPast?0.75:1}}>

        {!compact&&<div style={{minWidth:52,textAlign:'center',flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:800,color:e.isPast?'#94a3b8':e.color,textTransform:'uppercase',letterSpacing:1}}>
            {WEEKDAYS_S[d.getDay()]}
          </div>
          <div style={{fontSize:24,fontWeight:900,color:e.isPast?'#94a3b8':e.color,lineHeight:1.1}}>
            {d.getDate()}
          </div>
          <div style={{fontSize:11,fontWeight:700,color:'#9ca3af'}}>{MONTHS_S[d.getMonth()]}</div>
          {hasTime&&<div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{formatTime(e.date)}</div>}
        </div>}

        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:compact?13:15,color:e.isPast?'#6b7280':'#10233b'}}>
            {e.label}
          </div>
          {e.detail&&!compact&&<div style={{fontSize:13,color:'#5b6472',marginTop:2}}>{e.detail}</div>}
          {!compact&&<div style={{fontSize:12,color:'#9ca3af',marginTop:2,fontWeight:600}}>{e.teamName}</div>}
          {e.score&&<div style={{marginTop:6,display:'inline-block',padding:'3px 10px',borderRadius:999,background:e.color,color:'white',fontWeight:900,fontSize:13}}>{e.score}</div>}

          {canRespond&&ev&&respondPlayers.map((player)=>{
            const status=getEventAttendanceStatus(ev.id,player.id);
            const counts=getEventCounts(ev.id);
            return (
              <div key={player.id} style={{marginTop:10}}>
                {respondPlayers.length>1&&<div style={{fontSize:12,fontWeight:700,color:'#5b6472',marginBottom:4}}>👤 {player.first_name}</div>}
                <div style={{fontSize:12,color:'#94a3b8',marginBottom:6}}>✅ {counts.present} · ❌ {counts.absent} · ⏳ {counts.pending}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <button onClick={()=>saveEventAttendance(ev.id,player.id,'present')} style={{padding:'6px 12px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:status==='present'?e.color:'#f3e8ff',color:status==='present'?'white':e.color}}>✅ Présent</button>
                  <button onClick={()=>saveEventAttendance(ev.id,player.id,'absent')} style={{padding:'6px 12px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:status==='absent'?'#dc2626':'#fdecec',color:status==='absent'?'white':'#991b1b'}}>❌ Absent</button>
                  <button onClick={()=>saveEventAttendance(ev.id,player.id,'pending')} style={{padding:'6px 12px',borderRadius:8,border:'none',fontWeight:700,fontSize:12,cursor:'pointer',background:status==='pending'?'#64748b':'#eef2f7',color:status==='pending'?'white':'#526071'}}>⏳ Sans réponse</button>
                </div>
              </div>
            );
          })}
        </div>

        {!compact&&<div style={{flexShrink:0}}>
          <span style={{display:'inline-block',padding:'4px 10px',borderRadius:999,fontSize:11,fontWeight:800,background:e.isPast?'#e2e8f0':e.color,color:e.isPast?'#6b7280':'white'}}>
            {e.kind==='match'?'Match':e.kind==='training'?'Entraîn.':'Événement'}
          </span>
        </div>}
      </div>
    );
  }

  // Month view
  function MonthView() {
    const prev=()=>{ if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
    const next=()=>{ if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };
    const selItems=selectedDay?(byDate[selectedDay]||[]):[];

    return (
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:'1px solid #e5e7eb'}}>
          <button onClick={prev} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#0A5FB5',fontWeight:900,padding:'4px 12px'}}>‹</button>
          <div style={{fontWeight:900,fontSize:18,color:'#062C5D'}}>{MONTHS_L[calMonth]} {calYear}</div>
          <button onClick={next} style={{background:'none',border:'none',fontSize:24,cursor:'pointer',color:'#0A5FB5',fontWeight:900,padding:'4px 12px'}}>›</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'#f0f7ff'}}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>(
            <div key={d} style={{textAlign:'center',padding:'8px 2px',fontSize:11,fontWeight:800,color:'#5b6472',textTransform:'uppercase'}}>{d}</div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',border:'1px solid #e5e7eb',borderTop:'none'}}>
          {monthGrid.map((day,i)=>{
            if(!day) return <div key={i} style={{minHeight:72,background:'#fafafa',borderRight:'1px solid #e5e7eb',borderBottom:'1px solid #e5e7eb'}}/>;
            const key=isoDate(day);
            const di=byDate[key]||[];
            const isToday=isoDate(day)===isoDate(today);
            const isSel=selectedDay===key;
            const isPast=day<today;
            return (
              <div key={i} onClick={()=>setSelectedDay(isSel?null:key)}
                style={{minHeight:72,padding:'6px 4px',cursor:di.length?'pointer':'default',
                  background:isSel?'#eaf4ff':isToday?'#f0f7ff':isPast?'#fafafa':'white',
                  borderRight:'1px solid #e5e7eb',borderBottom:'1px solid #e5e7eb'}}>
                <div style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  background:isToday?'#0A5FB5':'transparent',
                  color:isToday?'white':isPast?'#94a3b8':'#374151',
                  fontWeight:isToday?900:600,fontSize:13,marginBottom:4}}>
                  {day.getDate()}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:2}}>
                  {di.slice(0,3).map((e,idx)=>(
                    <div key={idx} style={{width:7,height:7,borderRadius:'50%',background:e.isPast?'#cbd5e1':e.color}} title={e.label}/>
                  ))}
                  {di.length>3&&<div style={{fontSize:9,color:'#94a3b8',fontWeight:700,lineHeight:'7px'}}>+{di.length-3}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {selectedDay&&selItems.length>0&&(
          <div style={{padding:'16px 20px',borderTop:'2px solid #0A5FB5',background:'#f0f7ff'}}>
            <h4 style={{margin:'0 0 12px 0',color:'#062C5D',fontSize:15,fontWeight:900}}>
              {WEEKDAYS_L[new Date(selectedDay+'T12:00').getDay()]} {new Date(selectedDay+'T12:00').getDate()} {MONTHS_L[new Date(selectedDay+'T12:00').getMonth()]}
            </h4>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {selItems.map((e,i)=><ItemCard key={i} e={e}/>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // List view
  function ListView() {
    const upcoming=filtered.filter(e=>!e.isPast);
    const past=filtered.filter(e=>e.isPast).reverse();
    return (
      <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:0}}>
        <div style={{marginBottom:24}}>
          <h3 style={{margin:'0 0 14px 0',fontSize:17,fontWeight:900,color:'#062C5D',display:'flex',alignItems:'center',gap:8}}>
            🔜 À venir
            <span style={{background:'#0A5FB5',color:'white',borderRadius:999,fontSize:12,padding:'2px 8px',fontWeight:800}}>{upcoming.length}</span>
          </h3>
          {upcoming.length===0
            ?<div style={{textAlign:'center',color:'#9ca3af',padding:'30px 0',fontSize:15}}>Aucun événement à venir.</div>
            :<div style={{display:'flex',flexDirection:'column',gap:10}}>
              {upcoming.map((e,i)=><ItemCard key={i} e={e}/>)}
            </div>}
        </div>
        {showPast&&past.length>0&&(
          <div>
            <h3 style={{margin:'0 0 14px 0',fontSize:17,fontWeight:900,color:'#6b7280',display:'flex',alignItems:'center',gap:8}}>
              🕐 Passés
              <span style={{background:'#e5e7eb',color:'#6b7280',borderRadius:999,fontSize:12,padding:'2px 8px',fontWeight:800}}>{past.length}</span>
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {past.map((e,i)=><ItemCard key={i} e={e}/>)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(6,44,93,0.55)',backdropFilter:'blur(4px)',
      display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'16px',overflowY:'auto'}}>
      <div style={{width:'100%',maxWidth:780,background:'white',borderRadius:28,
        boxShadow:'0 24px 64px rgba(6,44,93,0.22)',overflow:'hidden',marginTop:16,marginBottom:32}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#062C5D,#0A5FB5)',padding:'20px 24px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{margin:0,color:'white',fontWeight:900,fontSize:22}}>📅 Calendrier du club</h2>
            <p style={{margin:'4px 0 0 0',color:'rgba(255,255,255,0.75)',fontSize:14}}>
              CA Gorcy Handball — matchs, entraînements & événements
            </p>
          </div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',
            borderRadius:12,padding:'10px 18px',fontWeight:800,fontSize:15,cursor:'pointer'}}>✕ Fermer</button>
        </div>

        {/* Filters */}
        <div style={{padding:'12px 20px',background:'#f8fbff',borderBottom:'1px solid #e5e7eb',
          display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>

          {/* View toggle */}
          <div style={{display:'flex',background:'#e5e7eb',borderRadius:10,padding:3,gap:2}}>
            {([['list','☰ Liste'],['month','📆 Mois']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{padding:'7px 14px',borderRadius:8,border:'none',fontWeight:800,fontSize:12,cursor:'pointer',
                  background:view===v?'white':'transparent',color:view===v?'#062C5D':'#6b7280',
                  boxShadow:view===v?'0 1px 4px rgba(0,0,0,0.1)':'none',transition:'all 0.15s'}}>
                {l}
              </button>
            ))}
          </div>

          {/* Team filter */}
          <select value={filterTeam} onChange={e=>setFilterTeam(e.target.value)}
            style={{padding:'7px 12px',borderRadius:10,border:'1px solid #d5dfeb',fontWeight:700,fontSize:12,background:'white',cursor:'pointer',color:'#062C5D'}}>
            <option value="all">Toutes équipes</option>
            {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {/* Kind filter */}
          <div style={{display:'flex',background:'#e5e7eb',borderRadius:10,padding:2,gap:2}}>
            {([['all','Tout'],['match','⚽ Matchs'],['training','🏋️ Entraîn.'],['event','🎉 Événements']] as const).map(([val,lbl])=>(
              <button key={val} onClick={()=>setFilterKind(val)}
                style={{padding:'6px 10px',borderRadius:8,border:'none',fontWeight:700,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',
                  background:filterKind===val?'white':'transparent',color:filterKind===val?'#062C5D':'#6b7280',
                  boxShadow:filterKind===val?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
                {lbl}
              </button>
            ))}
          </div>

          <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontWeight:700,fontSize:12,color:'#5b6472',marginLeft:'auto'}}>
            <input type="checkbox" checked={showPast} onChange={e=>setShowPast(e.target.checked)} style={{width:15,height:15,accentColor:'#0A5FB5'}}/>
            Passés
          </label>
        </div>

        {view==='month'?<MonthView/>:<ListView/>}
      </div>
    </div>
  );
}
