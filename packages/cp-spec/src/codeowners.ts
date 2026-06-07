import picomatch from 'picomatch';

export interface OwnerRule { pattern: string; owners: string[]; match: (p: string) => boolean; }

function toGlob(pattern: string): string {
  // CODEOWNERS: leading '/' anchors at root; trailing '/' means a directory subtree.
  let p = pattern;
  if (p.startsWith('/')) p = p.slice(1);
  if (p.endsWith('/')) p = `${p}**`;
  return p;
}

export function parseCodeowners(text: string): OwnerRule[] {
  const rules: OwnerRule[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (!pattern || owners.length === 0) continue;
    const glob = toGlob(pattern);
    const isMatch = picomatch(glob, { dot: true });
    rules.push({ pattern, owners, match: (p) => isMatch(p) });
  }
  return rules;
}

export function ownersForPaths(paths: string[], rules: OwnerRule[]): string[] {
  const set = new Set<string>();
  for (const path of paths) {
    // Last matching rule wins (CODEOWNERS semantics).
    for (let i = rules.length - 1; i >= 0; i--) {
      if (rules[i]!.match(path)) {
        for (const o of rules[i]!.owners) set.add(o);
        break;
      }
    }
  }
  return [...set];
}
