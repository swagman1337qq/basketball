// The crash safety net (2026-11-01): if a screen hits a bug while drawing, show what happened and a way out instead of
// a blank page. Your league is safe: it's saved as you play, and drawing a screen never changes it. `resetKey`
// clears the error when you move to another screen; `quiet` hides a small piece (a hover card) instead.
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; resetKey?: string; quiet?: boolean; onHome?: () => void; full?: boolean }
export class ErrorBoundary extends Component<Props, { err: Error | null; key?: string }> {
  state: { err: Error | null; key?: string } = { err: null, key: this.props.resetKey };
  static getDerivedStateFromError(err: Error) { return { err }; }
  static getDerivedStateFromProps(p: Props, s: { err: Error | null; key?: string }) { return p.resetKey !== s.key ? { err: null, key: p.resetKey } : null; }
  componentDidCatch(err: Error) { console.error('Screen error:', err); }
  render() {
    const { err } = this.state, { quiet, onHome, full, children } = this.props;
    if (!err) return children;
    if (quiet) return null;
    const box = { maxWidth: 560, margin: full ? '12vh auto' : '24px 0', padding: '18px 20px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' };
    return (
      <div style={box} role="alert">
        <h3 style={{ margin: '0 0 6px', fontSize: '19px' }}>Something went wrong {full ? 'in the game' : 'on this screen'}</h3>
        <p style={{ margin: '0 0 10px', fontSize: '13.5px' }}>Your league is safe: it's saved as you play, and this didn't change it. {full ? 'Reload to carry on.' : 'Go back to the Dashboard, or reload the game.'}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {onHome && <button className="btn btn-primary" onClick={() => { this.setState({ err: null }); onHome(); }}>Back to the Dashboard</button>}
          <button className={onHome ? 'btn btn-secondary' : 'btn btn-primary'} onClick={() => window.location.reload()}>Reload the game</button>
        </div>
        <details style={{ fontSize: '11.5px', color: 'var(--color-neutral-600)' }}><summary style={{ cursor: 'pointer' }}>What happened (for a bug report)</summary><code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(err.message || err)}{'\n'}{(err.stack || '').split('\n').slice(1, 4).join('\n')}</code></details>
      </div>);
  }
}
