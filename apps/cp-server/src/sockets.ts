import type { Server as HttpServer } from 'node:http';
import { Server as IOServer } from 'socket.io';
import type { RunRegistry } from '@canon/cp-workers';

export function attachRunSockets(httpServer: HttpServer, registry: RunRegistry): IOServer {
  const io = new IOServer(httpServer, { cors: { origin: true } });

  io.on('connection', (socket) => {
    const runId = String(socket.handshake.query.run ?? '');
    const run = registry.get(runId);
    if (!run) { socket.emit('error-msg', 'run not found'); socket.disconnect(true); return; }

    const onData = (e: { id: string; data: string }) => { if (e.id === runId) socket.emit('output', e.data); };
    const onExit = (e: { id: string; exitCode: number | null }) => { if (e.id === runId) socket.emit('exit', e.exitCode); };
    registry.on('data', onData);
    registry.on('exit', onExit);

    // Replay buffered output and exit state after registering listeners so we
    // don't miss any events. Re-fetch the run to get the latest status/exitCode.
    setImmediate(() => {
      const current = registry.get(runId);
      if (!current) return;
      socket.emit('output', current.buffer());
      if (current.status === 'exited') socket.emit('exit', current.exitCode);
    });

    socket.on('input', (data: string) => registry.write(runId, data));
    socket.on('resize', (size: { cols: number; rows: number }) => registry.resize(runId, size.cols, size.rows));
    socket.on('disconnect', () => { registry.off('data', onData); registry.off('exit', onExit); });
  });

  return io;
}
