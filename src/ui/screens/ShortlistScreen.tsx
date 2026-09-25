import type { VM } from '../vm';

export function ShortlistScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px" }}>
        <input className="input" value={vm.newList} onChange={vm.onNewList} placeholder="New category, e.g. Only if under $3M" style={{ maxWidth: "360px", minHeight: "34px", fontSize: "13px" }} />
        <button className="btn btn-primary" onClick={vm.addList} disabled={vm.noNewList} style={{ whiteSpace: "nowrap" }}>
          Add category
        </button>
        <span style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
          Add players from any player page.
        </span>
      </div>
      {!!vm.noLists && (<>
        <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)" }}>
          No categories yet. Create one above.
        </p>
      </>)}
      {(vm.shortlists || []).map((l: any, i: number) => (
        <section key={i} style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", borderBottom: "1px solid var(--color-text)", paddingBottom: "3px" }}>
            <h4 style={{ margin: "0", fontSize: "19px" }}>
              {l.name}
            </h4>
            <span style={{ flex: "1", color: "var(--color-neutral-700)" }}>
              {l.count}
            </span>
            <button className="btn btn-ghost" onClick={l.del} style={{ fontSize: "12px" }}>
              Delete category
            </button>
          </div>
          {!!l.empty && (<>
            <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)", margin: "8px 0" }}>
              Nobody here yet. Open a player and tap this category.
            </p>
          </>)}
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(l.rows || []).map((p: any, i: number) => (
                <tr key={i} onClick={p.open} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "5px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <span style={{ color: "var(--color-accent-700)" }}>
                        {p.name}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "5px 8px" }}>
                    <button className="hv4" onClick={p.openT} style={{ all: "unset", cursor: "pointer" }}>
                      {p.team}
                    </button>
                  </td>
                  <td style={{ padding: "5px 8px" }}>
                    {p.pos}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: p.ptone }}>
                    {p.pot}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    {p.money}
                  </td>
                  <td style={{ padding: "3px 8px", textAlign: "right" }}>
                    <button className="btn btn-ghost" onClick={p.remove} style={{ fontSize: "12px" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
