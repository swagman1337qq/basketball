// Literal-name matching without compiling thousands of regular-expression alternatives.
// Longest names win, and names embedded in another word do not become links.
type Node = { next: Map<string, Node>; name?: string };
const word = /[\p{L}\p{N}_]/u;
const at = (text: string, index: number) => String.fromCodePoint(text.codePointAt(index) ?? 32);
const before = (text: string, index: number) =>
  index > 1 && /[\uDC00-\uDFFF]/.test(text[index - 1]) ? text.slice(index - 2, index) : text[index - 1] || ' ';
export function entityNameIndex(names: string[]) {
  const root: Node = { next: new Map() };
  for (const name of names) {
    if (!name) continue;
    let node = root;
    for (let i = 0; i < name.length; i++) {
      let child = node.next.get(name[i]);
      if (!child) node.next.set(name[i], (child = { next: new Map() }));
      node = child;
    }
    node.name = name;
  }
  return (text: string): { start: number; name: string }[] => {
    const matches: { start: number; name: string }[] = [];
    for (let start = 0; start < text.length; start++) {
      if (word.test(before(text, start))) continue;
      let node = root,
        found: string | undefined;
      for (let end = start; end < text.length; end++) {
        const next = node.next.get(text[end]);
        if (!next) break;
        node = next;
        if (node.name && !word.test(at(text, end + 1))) found = node.name;
      }
      if (found) {
        matches.push({ start, name: found });
        start += found.length - 1;
      }
    }
    return matches;
  };
}
