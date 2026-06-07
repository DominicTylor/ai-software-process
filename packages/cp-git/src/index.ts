import { simpleGit, type SimpleGit } from 'simple-git';
import type { BranchFacts, BehavioralCommit } from '@canon/cp-contracts';

const REQUIRED_SECTIONS = ['Why:', 'Considered:', 'Chose:', 'Affects:'];

export interface RepoReader {
  branches: BranchFacts[];
  readFileAtRef(ref: string, path: string): Promise<string | null>;
}

function parseBehavioral(sha: string, message: string): BehavioralCommit | null {
  const subject = message.split('\n')[0] ?? '';
  if (!subject.startsWith('behavior:')) return null;
  const missing = REQUIRED_SECTIONS.filter((s) => !message.includes(s));
  return { sha, subject, wellFormed: missing.length === 0, missingSections: missing };
}

async function branchFacts(g: SimpleGit, branch: string, main: string): Promise<BranchFacts> {
  const mergedList = await g.raw(['branch', '--merged', main, '--format=%(refname:short)']);
  const merged = mergedList.split('\n').map((s) => s.trim()).includes(branch);

  const diff = branch === main
    ? ''
    : await g.raw(['diff', '--name-only', `${main}...${branch}`]);
  const diffPaths = diff.split('\n').map((s) => s.trim()).filter(Boolean);

  const log = branch === main
    ? { all: [] as { hash: string; message: string; body: string }[] }
    : await g.log({ from: main, to: branch, format: { hash: '%H', message: '%s', body: '%b' } as Record<string, string> }) as unknown as { all: { hash: string; message: string; body: string }[] };
  const behavioralCommits = log.all
    .map((c) => parseBehavioral(c.hash, `${c.message}\n\n${c.body}`))
    .filter((c): c is BehavioralCommit => c !== null);

  return {
    branch,
    merged,
    diffPaths,
    behavioralCommits,
    frameworksTouched: diffPaths.some((p) => p.startsWith('frameworks/')),
    constitutionTouched: diffPaths.includes('constitution.md'),
  };
}

export async function readRepo(repoPath: string, main = 'main'): Promise<RepoReader> {
  const g = simpleGit(repoPath);
  const summary = await g.branchLocal();
  const names = summary.all.filter((n) => n !== main);
  const branches = await Promise.all(names.map((n) => branchFacts(g, n, main)));
  return {
    branches,
    async readFileAtRef(ref, path) {
      try {
        return await g.show([`${ref}:${path}`]);
      } catch {
        return null;
      }
    },
  };
}
