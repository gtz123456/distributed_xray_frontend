"use client";

import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { AttachAddon } from "xterm-addon-attach";
import "xterm/css/xterm.css";

interface TerminalModalProps {
  serviceId: string;
  regkey: string;
  onClose: () => void;
}

export default function TerminalModal({ serviceId, regkey, onClose }: TerminalModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#0d001f",
        foreground: "#f8f8f2",
        cursor: "#f8f8f2",
      },
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();

    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    // Replace http(s) with ws(s)
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/admin/nodes/${serviceId}/shell?regkey=${encodeURIComponent(regkey)}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      const attachAddon = new AttachAddon(ws);
      term.loadAddon(attachAddon);
      term.focus();
    };

    ws.onerror = () => {
      setError("Failed to connect to node shell.");
      term.write("\r\n\x1b[31mConnection error.\x1b[0m\r\n");
    };

    ws.onclose = () => {
      term.write("\r\n\x1b[33mConnection closed.\x1b[0m\r\n");
    };

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [serviceId, regkey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl h-[70vh] bg-[#0d001f] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-sm font-mono text-white/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {serviceId} - Terminal
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            ✕
          </button>
        </div>
        
        {/* Terminal Container */}
        <div className="flex-1 p-2 overflow-hidden relative">
          {error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <span className="text-red-400 bg-black/80 px-4 py-2 rounded border border-red-500/30">
                {error}
              </span>
            </div>
          )}
          <div ref={terminalRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
