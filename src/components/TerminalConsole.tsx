import { useWelfare } from '@/context/WelfareContext';
import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const TerminalConsole = () => {
  const { terminalLogs } = useWelfare();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  return (
    <div className="rounded-2xl border bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/50">
        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground tracking-wide">AGENT LOG</span>
      </div>
      <div ref={scrollRef} className="h-28 overflow-y-auto px-4 py-2 space-y-0.5">
        {terminalLogs.map((log, i) => (
          <p key={i} className="text-xs font-mono leading-relaxed text-accent-foreground bg-accent/60 px-2 py-0.5 rounded-md">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};

export default TerminalConsole;
