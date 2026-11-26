import type { Game } from './Game';
import { addNotice, type Notice } from './preFA';

export type PlayerTradeStatus = 'untouchable' | 'block';
export function playerTradeStatus(p: any, tid: number): PlayerTradeStatus | null {
  return p?.tradeStatus?.tid === tid && ['untouchable', 'block'].includes(p.tradeStatus.mode) ? p.tradeStatus.mode : null;
}

// A declined offer is still a complete, readable mailbox message. It has no
// offerId, so neither the Mailbox nor a stale Accept button can execute it.
export function protectedOfferNotice(g: Game, s: any, offer: any): Omit<Notice, 'id'> | null {
  const tid = offer.b ?? s.me;
  if (!g.isUser(s, tid)) return null;
  const protectedIds = (offer.bP || []).filter(
    (id: number) => (s.rosters[tid] || []).includes(id) && playerTradeStatus(g.db.P[id], tid) === 'untouchable',
  );
  if (!protectedIds.length) return null;
  const names = (ids: number[], picks: string[]) =>
    [
      ...ids.map(id => g.db.P[id]?.name || 'a player'),
      ...picks.map(id => {
        const asset = (s.assets || []).find((k: any) => k.id === id);
        return asset ? g.pickLabel(asset, s.teams) + ' pick' : 'a draft pick';
      }),
    ].join(', ') || 'nothing';
  const team = s.teams[offer.a];
  return {
    tone: 'info',
    title: 'Trade offer automatically rejected',
    lines: [
      (team ? team.region + ' ' + team.name : 'Another team') +
        ' offered ' +
        names(offer.aP || [], offer.aK || []) +
        ' for ' +
        names(offer.bP || [], offer.bK || []) +
        '.',
      'Automatically rejected: ' +
        protectedIds.map((id: number) => g.db.P[id].name).join(', ') +
        (protectedIds.length === 1 ? ' is' : ' are') +
        ' marked Untouchable.',
    ],
    pids: [...(offer.aP || []), ...(offer.bP || [])],
  };
}

export function setPlayerTradeStatus(g: Game, pid: number, mode: PlayerTradeStatus | null) {
  if (mode != null && mode !== 'untouchable' && mode !== 'block') return;
  g.setState(s => {
    const p = g.db.P[pid],
      tid = g.tidOf(s.rosters, pid);
    if (!p || tid < 0 || !g.isUser(s, tid)) return null;
    if (playerTradeStatus(p, tid) === mode) return null;
    if (mode) p.tradeStatus = { tid, mode };
    else delete p.tradeStatus;
    let notices = s.notices || [];
    const inOffers = (s.inOffers || []).filter((offer: any) => {
      const rejected = protectedOfferNotice(g, s, offer);
      if (!rejected) return true;
      notices = addNotice({ ...s, notices }, rejected);
      return false;
    });
    return {
      tradeStatusRevision: (s.tradeStatusRevision || 0) + 1,
      ...(inOffers.length !== (s.inOffers || []).length ? { inOffers, notices } : {}),
    };
  });
}
