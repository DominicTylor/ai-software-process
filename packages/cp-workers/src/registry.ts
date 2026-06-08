import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { RunType, RunStatus, RunSummary } from '@canon/cp-contracts';
import { Runner } from './runner';

const MAX_BUFFER = 512 * 1024;

export interface StartSpec { type: RunType; file: string; args: string[]; label: string; cols?: number; rows?: number; }

interface Run {
  id: string; type: RunType; label: string;
  status: RunStatus; exitCode: number | null;
  chunks: string[]; size: number; runner: Runner;
}

export class RunRegistry extends EventEmitter {
  private runs = new Map<string, Run>();
  constructor(private cwd: string) { super(); this.setMaxListeners(0); }

  start(spec: StartSpec): string {
    const id = randomUUID();
    const runner = new Runner({ file: spec.file, args: spec.args, cwd: this.cwd, cols: spec.cols, rows: spec.rows });
    const run: Run = { id, type: spec.type, label: spec.label, status: 'running', exitCode: null, chunks: [], size: 0, runner };
    this.runs.set(id, run);
    runner.on('data', (d: string) => {
      run.chunks.push(d); run.size += d.length;
      while (run.size > MAX_BUFFER && run.chunks.length > 1) { run.size -= run.chunks.shift()!.length; }
      this.emit('data', { id, data: d });
    });
    runner.on('exit', (code: number | null) => {
      run.status = 'exited'; run.exitCode = code;
      this.emit('exit', { id, exitCode: code });
    });
    return id;
  }

  write(id: string, data: string) { this.runs.get(id)?.runner.write(data); }
  resize(id: string, cols: number, rows: number) { this.runs.get(id)?.runner.resize(cols, rows); }
  stop(id: string) { this.runs.get(id)?.runner.kill(); }

  get(id: string): (RunSummary & { buffer: () => string }) | undefined {
    const r = this.runs.get(id);
    if (!r) return undefined;
    return { id: r.id, type: r.type, label: r.label, status: r.status, exitCode: r.exitCode, buffer: () => r.chunks.join('') };
  }

  list(): RunSummary[] {
    return [...this.runs.values()].map((r) => ({ id: r.id, type: r.type, label: r.label, status: r.status, exitCode: r.exitCode }));
  }
}
