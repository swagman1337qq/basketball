// The Mailbox: everything that crossed your desk, newest first, so nothing is lost when several days
// are simmed at once. Every pop-up (s.mail, archived by Game.setState): trade offers (with whether each
// is still on the table), signings, offer outcomes, options and the rest; your owner's year-end letters;
// offer sheets on your restricted free agents (match or decline right here); every move made by players
// on your shortlists; and this season's and last season's retirements (the notable ones one by one).
import { useEffect, useState, type ReactNode } from 'react';
import type { VM } from '../vm';
import { Link, muted } from '../kit';
import { answerAgentCall, answerOfferSheet, callFits } from '../../engine/cbaFlow';
import { fmtMoney } from '../../engine/capModel';

type Kind = 'agent' | 'trade' | 'owner' | 'sheet' | 'shortlist' | 'retire' | 'update';
interface Item { key: string; kind: Kind; ms: number; date: string; title: ReactNode; lines: ReactNode[]; pids?: number[]; actions?: { label: string; go: () => void; primary?: boolean }[]; status?: [string, string]; isNew?: boolean }
const KINDS: [Kind | 'all', string][] = [['all', 'Everything'], ['agent', 'Agent calls'], ['trade', 'Trade offers'], ['owner', 'Owner'], ['sheet', 'Offer sheets'], ['shortlist', 'Shortlist moves'], ['retire', 'Retirements'], ['update', 'Other updates']];
const TAG: Record<Kind, string> = { agent: 'Agent call', trade: 'Trade offer', owner: 'Owner', sheet: 'Offer sheet', shortlist: 'Shortlist', retire: 'Retirement', update: 'Update' };
const when = (d: string, season: number) => { const t = Date.parse(d); return isFinite(t) ? t : Date.parse('Jul 1, ' + season); };

export function MailboxScreen({ vm }: { vm: VM }) {
  const { gm, s, T, open } = vm.ctx, P = gm.db.P, Y = gm.Y;
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [readTo] = useState<number>(() => s.mailRead || 0); // what was new when you opened the Mailbox stays marked
  useEffect(() => { if ((s.mailSeq || 0) > (s.mailRead || 0)) gm.setState({ mailRead: s.mailSeq || 0 }); }, [s.mailSeq]);
  const abbr = (tid?: number) => (tid != null && T[tid] ? T[tid].abbr : '—'), items: Item[] = [];

  // Pop-ups, archived.
  for (const m of s.mail || []) {
    if (m.callId) { // an agent's last call on one of your free agents: answer it here while it's open
      const c = (s.agentCalls || []).find((x: any) => x.id === m.callId), p = c ? P[c.pid] : null;
      items.push({ key: 'm' + m.id, kind: 'agent', ms: when(m.date, m.season), date: m.date, title: m.title, lines: m.lines || [], pids: m.pids, isNew: (m.seq || 0) > readTo || !!c,
        status: c ? ['Waiting on you', 'var(--accent-ink)'] : ['Answered', 'var(--color-neutral-600)'],
        actions: c && p ? [{ label: 'Keep him: ' + fmtMoney(c.ask.amt) + ' × ' + c.ask.years + (callFits(gm, s, c) ? '' : ' (doesn’t fit your cap)'), primary: true, go: () => answerAgentCall(gm, c.id, true) }, { label: 'Let him go', go: () => answerAgentCall(gm, c.id, false) }] : [] });
      continue;
    }
    const live = m.offerId ? vm.inOffersV.has(m.offerId) : false;
    items.push({ key: 'm' + m.id, kind: m.offerId ? 'trade' : 'update', ms: when(m.date, m.season), date: m.date, title: m.title, lines: m.lines || [], pids: m.pids, isNew: (m.seq || 0) > readTo,
      ...(m.offerId ? { status: live ? ['On the table', 'var(--gm-good)'] as [string, string] : ['No longer on the table', 'var(--color-neutral-600)'] as [string, string], actions: live ? [{ label: 'View trade offer', go: () => vm.inOffersV.openId(m.offerId), primary: true }] : [] } : {}) });
  }
  // The owner's year-end letters.
  Object.keys(s.letters || {}).map(Number).forEach(y => items.push({ key: 'l' + y, kind: 'owner', ms: Date.parse('Jun 20, ' + y), date: 'Jun ' + y, title: 'Your owner’s letter on the ' + (y - 1) + '–' + String(y).slice(2) + ' season', lines: ['The year-end review: how the season went, what the owner thinks of your work, and what comes next.'],
    isNew: s.letterUnread === y, status: s.letterUnread === y ? ['Unread', 'var(--accent-ink)'] : undefined, actions: [{ label: 'Read the letter', primary: s.letterUnread === y, go: () => gm.setState((st: any) => ({ letterOpen: y, letterUnread: st.letterUnread === y ? null : st.letterUnread })) }] }));
  // Offer sheets on your restricted free agents.
  (s.offerSheets || []).filter((o: any) => s.managed.includes(o.to) && P[o.pid]).forEach((o: any) => { const p = P[o.pid];
    items.push({ key: 's' + o.id, kind: 'sheet', ms: Date.now(), date: 'Now', isNew: true, pids: [p.id], title: p.name + ' signed an offer sheet with the ' + T[o.from].region + ' ' + T[o.from].name,
      lines: [fmtMoney(o.terms.amt) + ' × ' + o.terms.years + ' years' + (o.terms.opt ? ', ' + o.terms.opt + ' option' : '') + '. Match with Bird rights and he stays on those exact terms; decline and he leaves.'],
      status: ['Waiting on you', 'var(--accent-ink)'], actions: [{ label: 'Match', primary: true, go: () => answerOfferSheet(gm, o.id, true) }, { label: 'Decline', go: () => answerOfferSheet(gm, o.id, false) }] }); });
  // Moves by players on your shortlists (this season and last).
  const listed = new Map<number, string[]>(); (s.lists || []).forEach((l: any) => l.ids.forEach((id: number) => listed.set(id, [...(listed.get(id) || []), l.name])));
  const txText = (e: any) => e.text || (e.k === 'trade' ? 'Traded from ' + abbr(e.from) + ' to ' + abbr(e.to) : e.k === 'expansion' ? 'Taken by ' + abbr(e.to) + ' in the expansion draft' : e.k === 'draft' ? 'Drafted No. ' + e.n + ' by ' + abbr(e.tid) : e.k);
  listed.forEach((lists, id) => { const p = P[id]; if (!p) return;
    (p.tx || []).forEach((e: any, i: number) => { if (e.season < Y - 1 || e.k === 'god') return;
      items.push({ key: 'x' + id + '-' + i, kind: 'shortlist', ms: when(e.date, e.season) + i, date: e.date, pids: [id], title: <><Link onClick={() => open(id)}>{p.name}</Link>: {txText(e)}</>,
        lines: [<span key="l" style={muted}>On your shortlist{lists.length > 1 ? 's' : ''}: {lists.join(', ')}</span>] }); }); });
  // Retirements: this season's and last season's; the notable ones (55+, yours, shortlisted) one by one, the rest together.
  const recent = (Object.values(P) as any[]).filter(p => p.retired && !p.retired.legacy && p.retired.season >= Y - 1);
  const mine = (p: any) => s.managed.includes(p.retired.tid) || (p.stats || []).some((r: any) => s.managed.includes(r.tid) && r.season === p.retired.season);
  const notable = (p: any) => p.ovr >= 55 || listed.has(p.id) || mine(p) || (s.hof || []).some((h: any) => h.pid === p.id);
  const rDate = (p: any) => (p.tx || []).slice().reverse().find((e: any) => e.k === 'retire')?.date || 'Jun ' + p.retired.season;
  recent.filter(notable).forEach(p => { const yrs = new Set((p.stats || []).filter((r: any) => !r.po).map((r: any) => r.season)).size;
    items.push({ key: 'r' + p.id, kind: 'retire', ms: when(rDate(p), p.retired.season), date: rDate(p), pids: [p.id], title: <><Link onClick={() => open(p.id)}>{p.name}</Link> {p.retired.why === 'Retired' ? 'retired' : p.retired.why.toLowerCase()} at {p.retired.age}</>,
      lines: [p.pos + ' · ' + p.ovr + ' overall' + (yrs ? ' · ' + yrs + ' season' + (yrs === 1 ? '' : 's') + ' in the league' : '') + (mine(p) ? ' · on your team' : listed.has(p.id) ? ' · on your shortlist' : '')] }); });
  [Y, Y - 1].forEach(y => { const rest = recent.filter(p => p.retired.season === y && !notable(p)).sort((a, b) => b.ovr - a.ovr); if (!rest.length) return;
    items.push({ key: 'rr' + y, kind: 'retire', ms: Date.parse('Jun 30, ' + y), date: 'Summer ' + y, title: rest.length + ' more player' + (rest.length === 1 ? '' : 's') + ' left the league in ' + y,
      lines: [<span key="n">{rest.slice(0, 25).map((p, i) => <span key={p.id}>{i ? ', ' : ''}<Link onClick={() => open(p.id)}>{p.name}</Link> <span style={muted}>({p.ovr}, {p.retired.age})</span></span>)}{rest.length > 25 ? <span style={muted}> and {rest.length - 25} more</span> : null}</span>] }); });

  items.sort((a, b) => b.ms - a.ms);
  const shown = kind === 'all' ? items : items.filter(x => x.kind === kind), count = (k: Kind | 'all') => (k === 'all' ? items.length : items.filter(x => x.kind === k).length);
  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {KINDS.map(([k, label]) => <button key={k} className={kind === k ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12.5px' }} onClick={() => setKind(k)}>{label} · {count(k)}</button>)}
      </div>
      {!!s.offerMsg && <p style={{ color: 'var(--gm-bad)', margin: '0 0 10px' }}>{s.offerMsg}</p>}
      {!shown.length && <p style={{ ...muted, fontStyle: 'italic' }}>Nothing here yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.slice(0, 200).map(x => (
          <div key={x.key} className="card" style={{ padding: '10px 14px', gap: 4, borderLeft: '3px solid ' + (x.isNew ? 'var(--color-accent)' : 'var(--color-divider)') }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', fontSize: '11.5px', ...muted }}>
              <span style={{ letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}>{TAG[x.kind]}</span><span>{x.date}</span>
              {x.isNew && <b style={{ color: 'var(--accent-ink)' }}>New</b>}
              {x.status && <b style={{ marginLeft: 'auto', color: x.status[1] }}>{x.status[0]}</b>}
            </div>
            <div style={{ fontWeight: 600 }}>{x.title}</div>
            {x.lines.length > 0 && <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{x.lines.map((l, i) => <div key={i}>{l}</div>)}</div>}
            {(x.kind === 'trade' || x.kind === 'update' || x.kind === 'agent') && (x.pids || []).some(id => P[id] && !P[id].gone) && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '12px' }}><span style={muted}>Profile:</span>{(x.pids || []).filter(id => P[id] && !P[id].gone).map(id => <Link key={id} onClick={() => open(id)}>{P[id].name}</Link>)}</div>}
            {!!x.actions?.length && <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>{x.actions.map(a => <button key={a.label} className={a.primary ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12px', padding: '3px 10px' }} onClick={a.go}>{a.label}</button>)}</div>}
          </div>))}
      </div>
      {shown.length > 200 && <p style={{ ...muted, fontSize: '12px' }}>Showing the newest 200 of {shown.length}.</p>}
      <p style={{ ...muted, fontSize: '12px', marginTop: 12 }}>Every pop-up lands here too (the last 250), with trade offers marked as still on the table or not. Add players to a shortlist (on their profile) to follow their moves here.</p>
    </>
  );
}
