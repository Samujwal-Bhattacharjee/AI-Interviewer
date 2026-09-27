/**
 * src/features/auth/LoginPage.tsx — Phase 4: Role-Based Entry & Authentication.
 * Features dark blue atmospheric visuals, subtle Framer Motion state progression,
 * manual email credentials, and instant 1-click Demo Access.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, ArrowRight, UserCheck, GraduationCap, Building2 } from 'lucide-react';

type RoleSelection = 'student' | 'faculty';
type AuthStep = 'idle' | 'authenticating' | 'granted';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleSelection>('student');
  const [email, setEmail] = useState('arjun@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [authStep, setAuthStep] = useState<AuthStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleToggle = (role: RoleSelection) => {
    setSelectedRole(role);
    if (role === 'student') {
      setEmail('arjun@example.com');
    } else {
      setEmail('priya@example.com');
    }
    setErrorMessage(null);
  };

  const executeAuthSequence = async (authAction: () => Promise<void>, targetRole: RoleSelection) => {
    setErrorMessage(null);
    setAuthStep('authenticating');

    try {
      await authAction();
      setAuthStep('granted');
      setTimeout(() => {
        if (targetRole === 'student') {
          navigate('/student');
        } else {
          navigate('/faculty');
        }
      }, 1200);
    } catch (err) {
      setAuthStep('idle');
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please provide an email identifier.');
      return;
    }
    await executeAuthSequence(async () => {
      await login(email, password, selectedRole);
    }, selectedRole);
  };

  const handleDemoAccess = async (role: RoleSelection) => {
    setSelectedRole(role);
    await executeAuthSequence(async () => {
      await demoLogin(role);
    }, role);
  };

  return (
    <main className="min-h-[calc(100vh-60px)] relative flex items-center justify-center p-4 py-12 selection:bg-cyan-500 selection:text-black">
      <div className="w-full max-w-md relative z-10">
        {/* Terminal Header Metadata */}
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-3 px-1">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            ACCESS / 01
          </span>
          <span>SEC_PROTOCOL // DEV_MOCK</span>
        </div>

        {/* Main Glass Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-lg border-t-2 border-t-cyan-400 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          {/* Subtle Ambient Backlight */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="mb-6">
            <h1 className="font-tech text-2xl sm:text-3xl font-bold tracking-wider text-white uppercase">
              Adaptive Access
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Select persona to initialize role-specific telemetry &amp; dashboards.
            </p>
          </div>

          {/* Persona Selector: WHO ARE YOU? */}
          <div className="space-y-2 mb-6">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold block">
              Who are you?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleToggle('student')}
                disabled={authStep !== 'idle'}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded font-tech font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedRole === 'student'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-glow-cyan-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>STUDENT</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleToggle('faculty')}
                disabled={authStep !== 'idle'}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded font-tech font-bold text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedRole === 'faculty'
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-glow-cyan-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>FACULTY</span>
              </button>
            </div>
          </div>

          {/* Auth State Animation Overlay */}
          <AnimatePresence mode="wait">
            {authStep !== 'idle' ? (
              <motion.div
                key={authStep}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="py-10 my-4 rounded border border-cyan-400/30 bg-black/50 text-center font-mono space-y-3"
              >
                {authStep === 'authenticating' && (
                  <>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-cyan-400/50 bg-cyan-950/40 text-cyan-400 animate-spin">
                      <ShieldCheck className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
                      {selectedRole.toUpperCase()} → AUTHENTICATING...
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Establishing role session token &amp; loading permissions
                    </div>
                  </>
                )}

                {authStep === 'granted' && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-emerald-400/60 bg-emerald-950/40 text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                    >
                      <UserCheck className="w-6 h-6" />
                    </motion.div>
                    <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                      {selectedRole === 'student' ? 'ACCESS GRANTED' : 'FACULTY ACCESS GRANTED'}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Redirecting to {selectedRole === 'student' ? '/student' : '/faculty'}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              /* Standard Credentials Form */
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold block mb-1.5">
                    Email Identifier
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(0,240,255,0.3)] transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold block">
                      Passphrase
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">MOCK PASS</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(0,240,255,0.3)] transition"
                  />
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider rounded transition-all duration-200 shadow-glow-cyan flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>ENTER SYSTEM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-slate-950/80 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              DEMO ACCESS
            </span>
          </div>

          {/* 1-Click Instant Demo Access Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoAccess('student')}
                disabled={authStep !== 'idle'}
                className="py-2.5 px-3 rounded bg-white/5 hover:bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold transition hover:border-cyan-400 cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <span>STUDENT DEMO</span>
                <span className="text-[10px] text-slate-400 normal-case">Arjun Kumar</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoAccess('faculty')}
                disabled={authStep !== 'idle'}
                className="py-2.5 px-3 rounded bg-white/5 hover:bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 font-mono text-xs uppercase tracking-wider font-semibold transition hover:border-cyan-400 cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <span>FACULTY DEMO</span>
                <span className="text-[10px] text-slate-400 normal-case">Dr. Priya Sharma</span>
              </button>
            </div>
            <p className="text-[10px] font-mono text-slate-500 text-center pt-2">
              Clean mock development auth. Instant bypass without external services.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
