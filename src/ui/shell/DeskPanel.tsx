import type { VM } from '../vm';

export function DeskPanel({ vm }: { vm: VM }) {
  return (
    <>
      <aside style={{ width: "280px", flex: "none", borderLeft: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", overflow: "auto" }}>
        <section style={{ padding: "18px 18px 16px", borderBottom: "1px solid var(--color-divider)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Next · {vm.next.when}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "600", lineHeight: "1.15" }}>
            {vm.next.vs}{" "}
            <button className="hv4" onClick={vm.next.openT} style={{ all: "unset", cursor: "pointer" }}>
              {vm.next.oppName}
            </button>
          </div>
          <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
            {vm.next.oppRec} · {vm.next.line}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-primary" onClick={vm.play1} style={{ flex: "1" }}>
              Play game
            </button>
            <button className="btn btn-secondary" onClick={vm.play7}>
              Week
            </button>
          </div>
        </section>
        <section style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: "6px" }}>
            Books
          </div>
          {(vm.books || []).map((b: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
              <span style={{ color: "var(--color-neutral-700)" }}>
                {b.k}
              </span>
              <span>
                {b.v}
              </span>
            </div>
          ))}
        </section>
        <section style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: "6px" }}>
            Transactions
          </div>
          {!!vm.noLog && (<>
            <div style={{ color: "var(--color-neutral-600)", fontStyle: "italic" }}>
              Nothing yet this session.
            </div>
          </>)}
          {(vm.log || []).map((l: any, i: number) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                {l.date}
              </div>
              <div>
                {l.text}
              </div>
            </div>
          ))}
        </section>
      </aside>
    </>
  );
}
