import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';

export function NavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [utcTime, setUtcTime] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const isFaculty = user?.role === 'faculty';

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

        {/* Role-Specific Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-mono uppercase tracking-wider">
          {isFaculty ? (
            /* Faculty Navigation: ASSESSMENTS, DOCUMENTS, STUDENTS, REPORTS */
            <>
              <NavLink
                to="/faculty"
                end
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
                    <span>ASSESSMENTS</span>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/faculty?tab=documents"
                className={() =>
                  'flex items-center space-x-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition'
                }
              >
                <span>DOCUMENTS</span>
              </NavLink>

              <NavLink
                to="/faculty?tab=students"
                className={() =>
                  'flex items-center space-x-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition'
                }
              >
                <span>STUDENTS</span>
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
            </>
          ) : (
            /* Student / Default Navigation: ASSESS, PROFILE, REPORTS */
            <>
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
                to={user ? '/student' : '/skills'}
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
            </>
          )}
        </nav>

        {/* Identity Block & Top Actions */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="hidden xl:flex flex-col text-right leading-tight">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">
              SYNC STATUS: 01
            </span>
            <span className="text-cyan-400 font-semibold tracking-wider">
              {utcTime || '16:45:18 UTC'}
            </span>
          </div>

          {/* Compact User Identity Block */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((v) => !v)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded border border-white/10 hover:border-cyan-400/40 bg-white/5 hover:bg-cyan-950/30 transition text-left cursor-pointer focus:outline-none focus:border-cyan-400"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 rounded border border-cyan-400/50 bg-cyan-950/80 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center shadow-glow-cyan-sm">
                  {user.avatarInitials}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-tech font-bold text-xs uppercase text-white tracking-wider">
                    {user.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 mt-0.5">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Compact Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded border border-white/15 bg-slate-950/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 font-mono text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(user.role === 'faculty' ? '/faculty' : '/student');
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 text-slate-200 hover:text-white cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>PROFILE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(user.role === 'faculty' ? '/faculty' : '/skills');
                    }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-white/10 text-slate-200 hover:text-white cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>SETTINGS</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded hover:bg-red-950/60 text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>LOG OUT</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold hover:bg-cyan-900/40 hover:border-cyan-300 transition cursor-pointer"
            >
              LOGIN
            </Link>
          )}

          {/* Primary Action Button */}
          {isFaculty ? (
            <button
              onClick={() => navigate('/faculty?create=1')}
              className="relative group overflow-hidden px-3.5 py-2 bg-cyan-400 text-black font-tech font-bold text-xs uppercase tracking-wider rounded border border-cyan-400 hover:bg-cyan-300 transition duration-200 shadow-glow-cyan flex items-center space-x-1.5 cursor-pointer"
              type="button"
            >
              <span>+ CREATE ASSESSMENT</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/assess')}
              className="relative group overflow-hidden px-4 py-2 bg-white text-black font-tech font-bold text-xs uppercase tracking-wider rounded border border-white hover:bg-cyan-300 hover:border-cyan-300 hover:text-black transition duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-glow-cyan flex items-center space-x-2 cursor-pointer"
              type="button"
            >
              <span>START ASSESSMENT</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
