import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

export function NavBar() {
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-2xl px-4 lg:px-8 py-2.5 transition-all"
      data-purpose="primary-navigation"
    >
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Engine Stamp */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="font-display font-black text-xl tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] group-hover:text-cyan-300 transition-colors">
              ADAPTIVE
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-cyan-400/30 bg-cyan-950/40 text-cyan-400 text-[10px] font-mono tracking-wider font-semibold shadow-glow-cyan-sm">
              [SYS.V0.1]
            </span>
          </Link>
          <span className="hidden md:inline-block text-slate-500 text-xs tracking-widest font-mono">
            IR_3P // VOICE_ENGINE_ACTV
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-mono uppercase tracking-wider">
          <NavLink
            to="/assess"
            className={({ isActive }) =>
              isActive
                ? 'flex items-center space-x-1.5 px-3 py-1.5 text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-400/40 rounded shadow-glow-cyan-sm transition'
                : 'flex items-center space-x-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition'
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="inline-block w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse rounded-full" />
                )}
                <span>ASSESS</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/skills"
            className={({ isActive }) =>
              isActive
                ? 'flex items-center space-x-1.5 px-3 py-1.5 text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-400/40 rounded shadow-glow-cyan-sm transition'
                : 'px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition'
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="inline-block w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse rounded-full" />
                )}
                <span>PROFILE</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/report"
            className={({ isActive }) =>
              isActive
                ? 'flex items-center space-x-1.5 px-3 py-1.5 text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-400/40 rounded shadow-glow-cyan-sm transition'
                : 'px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition'
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="inline-block w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse rounded-full" />
                )}
                <span>REPORTS</span>
              </>
            )}
          </NavLink>

          <a
            href="#telemetry"
            className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition"
          >
            TELEMETRY
          </a>
        </nav>

        {/* Sync Status & Header CTA */}
        <div className="flex items-center space-x-5 text-xs font-mono">
          <div className="hidden xl:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              SYNC STATUS: 01
            </span>
            <span className="text-cyan-400 font-semibold tracking-wider">
              {utcTime || '16:45:18 UTC'}
            </span>
          </div>
          <button
            onClick={() => navigate('/assess')}
            className="relative group overflow-hidden px-4 py-2 bg-white text-black font-tech font-bold text-xs uppercase tracking-wider rounded border border-white hover:bg-cyan-300 hover:border-cyan-300 hover:text-black transition duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-glow-cyan flex items-center space-x-2"
            type="button"
          >
            <span>START ASSESSMENT</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
