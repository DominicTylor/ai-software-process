import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io, type Socket } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

export function Terminal({ runId, onExit }: { runId: string; onExit?: (code: number | null) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const term = new XTerm({ convertEol: true, fontSize: 12, cols: 120, rows: 30 });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(hostRef.current);
    try { fit.fit(); } catch { /* not measured yet */ }

    const socket: Socket = io('/', { query: { run: runId } });
    socket.on('output', (d: string) => term.write(d));
    socket.on('exit', (code: number | null) => { term.write(`\r\n[exited: ${code}]\r\n`); onExit?.(code); });
    socket.on('error-msg', (m: string) => term.write(`\r\n[error: ${m}]\r\n`));

    const dataSub = term.onData((d) => socket.emit('input', d));
    const onResize = () => { try { fit.fit(); socket.emit('resize', { cols: term.cols, rows: term.rows }); } catch { /* noop */ } };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      window.removeEventListener('resize', onResize);
      dataSub.dispose();
      socket.close();
      term.dispose();
    };
  }, [runId, onExit]);

  return <div ref={hostRef} className="h-80 w-full overflow-hidden rounded-md border bg-black p-1" data-testid={`term-${runId}`} />;
}
