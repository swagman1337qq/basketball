import type { Game } from './Game';
import { dateOf } from './txlog';

// Dashboard decisions used to live outside the Mailbox. Keep their original
// records for the dashboard, but deliver each one through the same numbered mail
// stream that holds simulation. The marker survives save/load and archive limits.
export function archiveDashboardMail(g: Game, state: any, backfill = false) {
  if (state.spectator || !state.managed?.length) return state;
  let next = state;
  const mail = state.mail || [],
    byId = new Map<string, any>(mail.map((m: any) => [m.id, m])),
    used = new Set(byId.keys()),
    updates = new Map<string, any>(),
    added: any[] = [];
  let seq = state.mailSeq || 0;
  for (const tid of state.managed) for (const x of g.clubOf(state, tid)?.inbox || []) if (x.mailId) used.add(x.mailId);
  for (const tid of state.managed) {
    const club = g.clubOf(next, tid);
    if (!club?.inbox?.length) continue;
    let inbox = club.inbox;
    // Assign increasing sequence numbers from the oldest to the newest item.
    for (let i = inbox.length - 1; i >= 0; i--) {
      const original = club.inbox[i];
      if (original.mailId) {
        const archived = byId.get(original.mailId);
        if (archived && archived.inboxItem !== original) updates.set(original.mailId, { ...archived, inboxItem: original });
        continue;
      }
      // A new payroll order can reuse a previous order's domain ID. Delivery has
      // its own identity, stored on that exact item rather than inferred from ID.
      const base = 'dashboard:' + tid + ':' + original.id;
      let id = base,
        suffix = 0;
      while (used.has(id)) id = base + ':' + ++suffix;
      used.add(id);
      const x = { ...original, mailId: id };
      if (inbox === club.inbox) inbox = club.inbox.slice();
      inbox[i] = x;
      const season = x.season ?? g.Y,
        pending = !x.done || (x.kind === 'mandate' && !x.resolved);
      added.unshift({
        id,
        tone: x.kind === 'firesale' ? 'bad' : 'info',
        title: x.title,
        lines: [x.text],
        ...(x.pid != null ? { pids: [x.pid] } : {}),
        season,
        date: season === g.Y ? dateOf(g, { ...state, day: x.day ?? state.day }) : 'Jun ' + season,
        seq: backfill && !pending ? state.mailRead || 0 : ++seq,
        inboxTid: tid,
        inboxItem: x,
      });
    }
    if (inbox !== club.inbox) next = { ...next, ...g.clubPatch(next, tid, { inbox }) };
  }
  if (added.length || updates.size)
    next = { ...next, mail: [...added, ...mail.map((m: any) => updates.get(m.id) || m)].slice(0, 250), mailSeq: seq };
  return next;
}
