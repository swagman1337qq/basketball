// The owner's year-end letter (shown when the playoffs end; past letters reopen from the
// Owner screen). One letter per franchise you run.
import { useState } from 'react';
import type { VM } from '../vm';
import { Kicker, muted } from '../kit';

const VERDICT: Record<string, [string, string]> = { extend: ['Full confidence', 'var(--gm-good)'], stay: ['Staying on', 'var(--color-text)'], warning: ['Final warning', 'var(--color-accent-700)'], fired: ['Fired', 'var(--gm-bad)'] };

export function OwnerLetterModal({ vm }: { vm: VM }) {
  const { gm, s, T, logo } = vm.ctx;
  const letters = (s.letters || {})[s.letterOpen] || [];
  const [i, setI] = useState(0);
  if (!letters.length) return null;
  const L = letters[Math.min(i, letters.length - 1)], t = T[L.tid], [vl, vc] = VERDICT[L.verdict];
  const close = () => gm.setState({ letterOpen: null });
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 55%, transparent)', zIndex: 30, padding: '20px' }} onClick={close}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 'min(720px, 100%)', maxHeight: '92vh', overflowY: 'auto', padding: '26px 30px', gap: '12px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        {letters.length > 1 && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{letters.map((x, k) => <button key={x.tid} className="btn btn-ghost" onClick={() => setI(k)} style={{ fontSize: '12px', padding: '3px 8px', gap: '6px', boxShadow: k === i ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}>{logo(x.tid, 16)}{T[x.tid].abbr}</button>)}</div>}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {logo(L.tid, 48)}
          <div style={{ flex: 1 }}>
            <Kicker accent>From the desk of the owner · {L.season - 1}–{String(L.season).slice(2)} season</Kicker>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}>{L.owner}</div>
            <div style={{ ...muted, fontSize: '12px' }}>{t.region} {t.name} · {L.arch} · {L.record} · {L.fin}</div>
          </div>
          <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: vc }}>{vl}</div><div style={{ ...muted, fontSize: '11.5px' }}>Job security {L.sec}</div></div>
        </div>
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-heading)', fontSize: '17px', lineHeight: 1.45 }}>Dear {s.gm?.name ? s.gm.name.split(' ')[0] : 'GM'},</p>
        <div>
          <Kicker>What you did right</Kicker>
          <ul style={{ margin: '4px 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>{L.right.map((x, k) => <li key={k} style={{ color: 'var(--color-text)' }}><span style={{ color: 'var(--gm-good)' }}>✓ </span>{x}</li>)}</ul>
        </div>
        <div>
          <Kicker>What you did wrong</Kicker>
          <ul style={{ margin: '4px 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>{L.wrong.map((x, k) => <li key={k}><span style={{ color: 'var(--gm-bad)' }}>✗ </span>{x}</li>)}</ul>
        </div>
        <div>
          <Kicker>How I feel about what you’re doing here</Kicker>
          <p style={{ margin: '4px 0 0', lineHeight: 1.55, fontSize: '14px' }}>{L.feel}</p>
        </div>
        {!!L.contract && <div><Kicker>About your contract</Kicker><p style={{ margin: '4px 0 0', lineHeight: 1.55, fontSize: '14px' }}>{L.contract}</p>{s.gmOffer && s.gmOffer.tid === L.tid && <p style={{ ...muted, fontSize: '12px', margin: '4px 0 0' }}>Answer the offer on the Career screen{s.gmOffer.kind === 'expiring' ? ' before free agency opens' : ''}.</p>}</div>}
        {L.next.length > 0 && <div><Kicker>Next season I expect</Kicker><ul style={{ margin: '4px 0 0', paddingLeft: '18px', lineHeight: 1.5 }}>{L.next.map((x, k) => <li key={k}>{x}</li>)}</ul></div>}
        <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-heading)', fontSize: '17px', fontStyle: 'italic' }}>— {L.owner}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {L.verdict === 'fired' && <span style={{ ...muted, fontSize: '12px', alignSelf: 'center' }}>This takes effect when you end the season.</span>}
          <button className="btn btn-primary" onClick={close}>Close letter</button>
        </div>
      </div>
    </div>
  );
}
