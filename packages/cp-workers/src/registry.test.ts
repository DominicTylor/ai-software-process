import { describe, it, expect } from 'vitest';
import { RunRegistry } from './index';

function waitForExit(reg: RunRegistry, id: string): Promise<number | null> {
  return new Promise((resolve) => {
    const run = reg.get(id)!;
    if (run.status === 'exited') return resolve(run.exitCode);
    reg.on('exit', (e) => { if (e.id === id) resolve(e.exitCode); });
  });
}

describe('RunRegistry', () => {
  it('starts a command run, buffers output, records exit code', async () => {
    const reg = new RunRegistry(process.cwd());
    const id = reg.start({ type: 'custom', file: process.execPath, args: ['-e', "process.stdout.write('hello-run'); process.exit(0)"], label: 'echo' });
    const code = await waitForExit(reg, id);
    expect(code).toBe(0);
    const run = reg.get(id)!;
    expect(run.status).toBe('exited');
    expect(run.buffer()).toContain('hello-run');
  });

  it('propagates a non-zero exit code', async () => {
    const reg = new RunRegistry(process.cwd());
    const id = reg.start({ type: 'custom', file: process.execPath, args: ['-e', 'process.exit(3)'], label: 'fail' });
    const code = await waitForExit(reg, id);
    expect(code).toBe(3);
  });

  it('echoes written stdin back through the pty', async () => {
    const reg = new RunRegistry(process.cwd());
    const id = reg.start({ type: 'custom', file: 'cat', args: [], label: 'cat' });
    await new Promise((r) => setTimeout(r, 150));
    reg.write(id, 'ping-123\n');
    await new Promise((r) => setTimeout(r, 200));
    expect(reg.get(id)!.buffer()).toContain('ping-123');
    reg.stop(id);
    await waitForExit(reg, id);
  });

  it('lists run summaries', async () => {
    const reg = new RunRegistry(process.cwd());
    const id = reg.start({ type: 'typecheck', file: process.execPath, args: ['-e', ''], label: 'noop' });
    await waitForExit(reg, id);
    const list = reg.list();
    expect(list.find((r) => r.id === id)).toMatchObject({ type: 'typecheck', label: 'noop' });
  });
});
