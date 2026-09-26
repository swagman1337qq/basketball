// A small, safe expression compiler for award formulas (Basketball GM syntax):
// numbers, variables (letters, digits, dots: `numWon.MVP`), + - * / ^, parentheses,
// and the functions max, min, abs, sqrt, log, exp, floor, ceil, round.
// No eval: the formula is parsed into closures. Unknown variables read as 0.

export type Vars = Record<string, number>;
export type Compiled = { run: (v: Vars) => number; vars: string[] };

const FN: Record<string, (...a: number[]) => number> = { max: Math.max, min: Math.min, abs: Math.abs, sqrt: Math.sqrt, log: Math.log, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round };

export function compileFormula(src: string): Compiled {
  const toks: string[] = [];
  const re = /\s*(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[A-Za-z_][A-Za-z0-9_.]*|[-+*/^(),])/y;
  let i = 0;
  while (i < src.length) {
    if (/\s/.test(src[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(src);
    if (!m) throw new Error('Unexpected “' + src[i] + '” at position ' + (i + 1));
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0; const vars = new Set<string>();
  const peek = () => toks[p], eat = (t?: string) => { const x = toks[p++]; if (t && x !== t) throw new Error('Expected “' + t + '”' + (x ? ' but found “' + x + '”' : ' at the end')); return x; };
  type N = (v: Vars) => number;
  const expr = (): N => { let a = term(); while (peek() === '+' || peek() === '-') { const op = eat(), b = term(), l = a; a = op === '+' ? v => l(v) + b(v) : v => l(v) - b(v); } return a; };
  const term = (): N => { let a = unary(); while (peek() === '*' || peek() === '/') { const op = eat(), b = unary(), l = a; a = op === '*' ? v => l(v) * b(v) : v => { const d = b(v); return d === 0 ? 0 : l(v) / d; }; } return a; };
  const unary = (): N => { if (peek() === '-') { eat(); const a = unary(); return v => -a(v); } if (peek() === '+') { eat(); return unary(); } return power(); };
  const power = (): N => { const a = primary(); if (peek() === '^') { eat(); const b = unary(); return v => { const r = Math.pow(a(v), b(v)); return isFinite(r) ? r : 0; }; } return a; };
  const primary = (): N => {
    const t = eat();
    if (t === undefined) throw new Error('The formula ends too early');
    if (t === '(') { const a = expr(); eat(')'); return a; }
    if (/^[\d.]/.test(t)) { const n = +t; return () => n; }
    if (/^[A-Za-z_]/.test(t)) {
      if (peek() === '(') {
        const f = FN[t]; if (!f) throw new Error('Unknown function “' + t + '”');
        eat('('); const args: N[] = [];
        if (peek() !== ')') { args.push(expr()); while (peek() === ',') { eat(); args.push(expr()); } }
        eat(')'); return v => f(...args.map(a => a(v)));
      }
      vars.add(t); return v => v[t] ?? 0;
    }
    throw new Error('Unexpected “' + t + '”');
  };
  const root = expr();
  if (p < toks.length) throw new Error('Unexpected “' + toks[p] + '”');
  return { run: v => { const r = root(v); return isFinite(r) ? r : 0; }, vars: [...vars] };
}
