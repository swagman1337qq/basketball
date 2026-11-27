// Analytics reports (2026-11-27): the Analytics screen's full report on a player your department covers
// (analytics.ts anRequests / anCovered): the department's level now, next season and ceiling with each analyst's own,
// the numbers behind it, what his contract is worth by them, how he fits your needs, and their calls where the
// numbers disagree with his rating, his pay or your scouts.
import type { Game } from './Game';
import {
  anCovered,
  anKind,
  anRequests,
  contractValue,
  deptView,
  fitWith,
  numsOf,
  type AnKind,
  type DeptView,
  type ReqBy,
} from './analytics';
import { fmtMoney as money } from './capModel';

export type AnStatus = 'covered' | 'queued' | 'nonums';
export interface AnRow {
  pid: number;
  by: ReqBy[];
  kind: AnKind;
  status: AnStatus;
  queue: number; // place in line when queued (1 = next)
}
// Everyone requested, in the order the department takes them, with whether they're covered.
export function anRows(g: Game, s: any): AnRow[] {
  const cov = anCovered(g, s);
  let q = 0;
  return anRequests(g, s).map(r => {
    const p = g.db.P[r.pid],
      none = numsOf(g, p).kind === 'none',
      status: AnStatus = cov.has(r.pid) ? 'covered' : none ? 'nonums' : 'queued';
    return { ...r, kind: anKind(g, s, p)!, status, queue: status === 'queued' ? ++q : 0 };
  });
}

export interface AnReport {
  v: DeptView;
  sample: { kind: 'nba' | 'am'; per: number; min: number; minS: number; line: { k: string; label: string; v: string }[] };
  sal: number | null;
  asks: boolean;
  cv: { worth: number; surplus: number } | null;
  fit: { fills: string[]; needs: { label: string; rank: number }[] } | null;
  calls: { tone: 'good' | 'bad' | 'info'; text: string }[];
  warn: string[];
  spread: number;
}
// scoutsPot: your scouts' read of his ceiling (your coaches' for your own players), as your screens show it.
export function anReport(g: Game, s: any, pid: number, scoutsPot: number): AnReport | null {
  const p = g.db.P[pid],
    v = p ? deptView(g, s, s.me, p) : null;
  if (!p || !v) return null;
  const n = numsOf(g, p),
    kind = anKind(g, s, p),
    own = kind === 'mine',
    inFa = kind === 'fa',
    sal = kind === 'prospect' ? null : inFa ? g.askFor(p, s) : p.amt || 0,
    cv = v.kind === 'nba' && sal != null && sal > 0 ? contractValue(g, v, sal) : null,
    fit = fitWith(g, s, s.me, p);
  const x = n.x,
    f1 = (k: string) => (x[k] ?? 0).toFixed(1);
  const line: { k: string; label: string; v: string }[] = [
    { k: 'mpg', label: 'MPG', v: f1('mpg') },
    { k: 'pts', label: 'PTS', v: f1('pts') },
    { k: 'reb', label: 'REB', v: ((x.orb ?? 0) + (x.drb ?? 0)).toFixed(1) },
    { k: 'ast', label: 'AST', v: f1('ast') },
    { k: 'stl', label: 'STL', v: f1('stl') },
    { k: 'blk', label: 'BLK', v: f1('blk') },
    { k: 'tov', label: 'TOV', v: f1('tov') },
    { k: 'tpm', label: '3PM', v: f1('tpm') },
    { k: 'ts', label: 'TS%', v: ((x.ts ?? 0) * 100).toFixed(1) },
    ...(n.kind === 'am' ? [{ k: 'bpm', label: 'BPM', v: (x.bpm ?? 0).toFixed(1) }] : []),
  ];
  const calls: AnReport['calls'] = [],
    warn: string[] = [];
  if (cv)
    calls.push(
      cv.surplus >= 2
        ? {
            tone: 'good',
            text:
              'Undervalued: worth about ' +
              money(cv.worth) +
              ' a year by the numbers; he ' +
              (inFa ? 'asks ' : 'is paid ') +
              money(sal!) +
              '.',
          }
        : cv.surplus <= -2
          ? {
              tone: 'bad',
              text:
                (inFa ? 'Asks too much: ' : 'Overpaid: ') +
                'worth about ' +
                money(Math.max(0, cv.worth)) +
                ' a year by the numbers; he ' +
                (inFa ? 'asks ' : 'is paid ') +
                money(sal!) +
                '.',
            }
          : {
              tone: 'info',
              text: 'Fairly ' + (inFa ? 'priced' : 'paid') + ': worth about ' + money(Math.max(0, cv.worth)) + ' a year by the numbers.',
            },
    );
  if (v.kind === 'nba') {
    const d = v.next - p.ovr;
    if (d >= 4 && p.age <= 26)
      calls.push({
        tone: 'good',
        text: 'Breakout candidate: they have him at ' + Math.round(v.next) + ' next season, rated ' + p.ovr + ' now.',
      });
    else if (d >= 4)
      calls.push({
        tone: 'good',
        text: 'Better than his rating: ' + Math.round(v.next) + ' next season by the numbers, rated ' + p.ovr + '.',
      });
    else if (d <= -4)
      calls.push({
        tone: 'bad',
        text:
          (p.age >= 30 ? 'Decline coming: ' : 'Worse than his rating: ') +
          Math.round(v.next) +
          ' next season by the numbers, rated ' +
          p.ovr +
          '.',
      });
  }
  const gap = v.peak - scoutsPot,
    who = own ? 'your coaches' : 'your scouts';
  if (gap >= 4)
    calls.push({
      tone: 'good',
      text: 'The numbers see more than ' + who + ': ceiling ' + Math.round(v.peak) + ' against ' + scoutsPot + '.',
    });
  else if (gap <= -4)
    calls.push({
      tone: 'bad',
      text: 'The numbers see less than ' + who + ': ceiling ' + Math.round(v.peak) + ' against ' + scoutsPot + '.',
    });
  if (fit?.fills.length) calls.push({ tone: 'good', text: 'Fills your needs: ' + fit.fills.join(', ') + '.' });
  if (!calls.length) calls.push({ tone: 'info', text: 'No surprises: the numbers agree with his rating, his pay and ' + who + '.' });
  if (v.conf === 'Low')
    warn.push(
      'Small sample: ' +
        Math.round(n.min) +
        ' minutes behind it' +
        (n.kind === 'am' ? ' (college or club)' : '') +
        '. Treat it as a first look.',
    );
  const spread = v.by.length > 1 ? Math.max(...v.by.map(b => b.v.peak)) - Math.min(...v.by.map(b => b.v.peak)) : 0;
  if (spread >= 5)
    warn.push(
      'The department is split on his ceiling: ' +
        Math.round(Math.min(...v.by.map(b => b.v.peak))) +
        ' to ' +
        Math.round(Math.max(...v.by.map(b => b.v.peak))) +
        '.',
    );
  if (n.kind === 'am') warn.push('College or club numbers: no NBA minutes yet, so the ceiling is the least certain part.');
  return {
    v,
    sample: { kind: n.kind as 'nba' | 'am', per: n.kind === 'am' ? 40 : 36, min: Math.round(n.min), minS: Math.round(n.minS), line },
    sal,
    asks: inFa,
    cv,
    fit,
    calls,
    warn,
    spread,
  };
}
