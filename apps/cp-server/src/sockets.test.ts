import { describe, it, expect, afterEach } from 'vitest';
import { io as ioClient, type Socket } from 'socket.io-client';
import { RunRegistry } from '@canon/cp-workers';
import { buildApp } from './app';
import { attachRunSockets } from './sockets';

let client: Socket | undefined;
afterEach(() => client?.close());

describe('run sockets', () => {
  it('streams output and exit for a run', async () => {
    const reg = new RunRegistry(process.cwd());
    const app = buildApp(process.cwd(), 'main', reg);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    attachRunSockets(app.server, reg);

    const id = reg.start({ type: 'custom', file: process.execPath, args: ['-e', "process.stdout.write('streamed!'); process.exit(0)"], label: 't' });

    const received = await new Promise<{ out: string; code: number | null }>((resolve) => {
      let out = '';
      client = ioClient(`http://127.0.0.1:${port}`, { query: { run: id } });
      client.on('output', (d: string) => { out += d; });
      client.on('exit', (code: number | null) => resolve({ out, code }));
    });

    expect(received.out).toContain('streamed!');
    expect(received.code).toBe(0);
    client?.close();
    await app.close();
  });
});
