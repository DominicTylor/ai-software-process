import { spawn, type IPty } from 'node-pty';
import { EventEmitter } from 'node:events';

export interface RunnerSpec { file: string; args: string[]; cwd: string; cols?: number; rows?: number; }

export class Runner extends EventEmitter {
  private pty: IPty;
  constructor(spec: RunnerSpec) {
    super();
    this.pty = spawn(spec.file, spec.args, {
      name: 'xterm-color',
      cols: spec.cols ?? 120,
      rows: spec.rows ?? 30,
      cwd: spec.cwd,
      env: process.env as Record<string, string>,
    });
    this.pty.onData((d) => this.emit('data', d));
    this.pty.onExit((e) => this.emit('exit', e.exitCode));
  }
  write(data: string) { this.pty.write(data); }
  resize(cols: number, rows: number) { try { this.pty.resize(cols, rows); } catch { /* exited */ } }
  kill() { try { this.pty.kill(); } catch { /* already gone */ } }
}
