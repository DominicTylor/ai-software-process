import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ForgeFacts } from '@canon/cp-contracts';
import { parseForge } from './parse';

const run = promisify(execFile);
const FIELDS = 'headRefName,number,state,isDraft,reviewDecision,statusCheckRollup,url';

export async function fetchForge(cwd: string): Promise<Map<string, ForgeFacts>> {
  try {
    const { stdout } = await run('gh', ['pr', 'list', '--state', 'all', '--limit', '100', '--json', FIELDS], { cwd, maxBuffer: 10 * 1024 * 1024 });
    return parseForge(stdout);
  } catch {
    return new Map();
  }
}
