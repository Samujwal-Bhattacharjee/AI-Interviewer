import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function SystemFooter() {
  const [latency, setLatency] = useState(180);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(175 + Math.random() * 18));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="text-white font-mono text-xs border-t border-glass bg-slate-950/60 backdrop-blur-xl mt-auto" id="telemetry">
      <div className="max-w-[1720px] mx-auto p-6 sm:p-10">
        {/* Footer Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-glass uppercase">
          <div>
            <span className="text-neutral-400 block mb-1 text-[10px] tracking-widest">SYSTEM LATENCY</span>
            <span className="font-bold text-white text-sm">{latency}MS [P99]</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1 text-[10px] tracking-widest">PSYCHOMETRIC MODEL</span>
            <span className="font-bold text-white text-sm">IRT 3-PARAMETER</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1 text-[10px] tracking-widest">INTERVIEW ENGINE</span>
            <span className="font-bold text-white text-sm">VOICE-STREAM V2</span>
          </div>
          <div>
            <span className="text-neutral-400 block mb-1 text-[10px] tracking-widest">SYSTEM STATUS</span>
            <span className="font-bold text-hyperBlue text-sm flex items-center gap-1.5 drop-shadow-[0_0_6px_#38BDF8]">
              <span className="w-2 h-2 bg-hyperBlue inline-block shadow-[0_0_6px_#38BDF8] animate-pulse"></span>
              ALL ENGINES ONLINE
            </span>
          </div>
        </div>

        {/* Footer Bottom Copyright & Legal */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="font-headline text-lg text-white">ADAPTIVE</span>
            <span>© 2025 ADAPTIVE ASSESSMENT SYSTEMS INC. RAW BLOCK ARCHITECTURE.</span>
          </div>
          <div className="flex items-center gap-6 font-bold uppercase text-neutral-300">
            <Link to="/skills" className="hover:text-hyperBlue transition-colors">
              TELEMETRY
            </Link>
            <a href="#privacy" className="hover:text-hyperBlue transition-colors">
              PRIVACY PROTOCOL
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-hyperBlue transition-colors"
            >
              API DOCUMENTATION
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
