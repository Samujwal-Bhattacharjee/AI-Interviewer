/**
 * src/features/student/StudentDashboardPage.tsx — Phase 4: Student Role Dashboard.
 * Answers immediately:
 *   WHO AM I?
 *   WHAT AM I WORKING TOWARD?
 *   WHERE DO I STAND?
 *   WHAT SHOULD I DO NEXT?
 * Fully dynamic — derived from current authenticated user via studentService.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { studentService } from '../../services/studentService';
import { createSession } from '../../services/assessmentService';
import { useInterviewStore } from '../../store/interviewStore';
import type { StudentProfileData, StudentAssignedAssessment } from '../../mock/students';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SystemFooter } from '../../components/layout/SystemFooter';

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setSession = useInterviewStore((s) => s.setSession);

  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startingAssessmentId, setStartingAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await studentService.getStudentDashboard(user.id);
        if (isMounted) setProfile(data);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleStartAssignedAssessment = async (asmt: StudentAssignedAssessment) => {
    setStartingAssessmentId(asmt.id);
    try {
      const session = await createSession({
        targetRoleId: 'role-001',
        level: asmt.difficulty || 'medium',
        focusCompetencies: ['comp-dsa', 'comp-python', 'comp-debugging'],
        duration: 'standard',
        assessmentType: 'faculty_assigned',
        facultyAssessmentId: asmt.id,
        documentId: asmt.documentId,
        documentTitle: asmt.documentTitle,
        topics: asmt.topics,
        interviewMode: 'native',
        language: 'en-IN',
      });

      setSession(session.id, session.targetRoleId, session.questionCount, session.interviewMode, session.language);
      navigate('/interview');
    } finally {
      setStartingAssessmentId(null);
    }
  };

  const handleStartTargetedReassessment = async (competencyKey: string) => {
    setStartingAssessmentId(competencyKey);
    try {
      const session = await createSession({
        targetRoleId: profile?.targetRoleId ?? 'role-001',
        level: 'intermediate',
        focusCompetencies: ['comp-debugging'],
        duration: 'quick',
        assessmentType: 'career',
        interviewMode: 'native',
        language: 'en-IN',
      });
      setSession(session.id, session.targetRoleId, session.questionCount, session.interviewMode, session.language);
      navigate('/interview');
    } finally {
      setStartingAssessmentId(null);
    }
  };

  if (isLoading || !profile) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center font-mono p-4">
        <div className="glass-panel p-8 rounded-lg max-w-sm w-full text-center border-t-2 border-t-cyan-400">
          <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-2 animate-pulse">
            [SYNCHRONIZING STUDENT PROFILE]
          </div>
          <div className="text-sm text-slate-300">Loading competency trajectories &amp; assigned coursework...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white relative flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      <div className="max-w-[1720px] mx-auto w-full px-4 lg:px-8 py-8 pt-8 space-y-8">
        {/* Top Identification Banner */}
        <section className="glass-panel p-6 sm:p-8 rounded-lg border-t-2 border-t-cyan-400 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Identity & Target Role */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
                <span>STUDENT TELEMETRY // {user?.avatarInitials}</span>
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">WELCOME BACK</span>
                <h1 className="font-tech text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
                  {profile.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                <div className="px-3 py-1.5 rounded bg-black/40 border border-white/10 flex items-center space-x-2">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">TARGET ROLE:</span>
                  <span className="font-bold text-cyan-300 tracking-wider uppercase">
                    {profile.targetRole}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded bg-black/40 border border-white/10 flex items-center space-x-2">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">CURRENT LEVEL:</span>
                  <span className="font-bold text-emerald-400 tracking-wider uppercase">
                    {profile.currentLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Action Callout Card */}
            <div className="md:col-span-4">
              <div className="glass-card p-5 rounded-lg border-l-4 border-l-cyan-400 bg-cyan-950/20 shadow-glow-cyan-sm space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    NEXT RECOMMENDED ACTION
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 uppercase">
                    CALIBRATION
                  </span>
                </div>

                <div>
                  <div className="text-lg font-tech font-bold text-white uppercase">
                    {profile.nextAction.competency}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {profile.nextAction.message}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTargetedReassessment(profile.nextAction.competency)}
                  disabled={startingAssessmentId !== null}
                  className="w-full py-2 px-3 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {startingAssessmentId === profile.nextAction.competency ? (
                    <span>LAUNCHING ORAL ENGINE...</span>
                  ) : (
                    <>
                      <span>START ASSESSMENT</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Mid Grid: Skill Snapshot & Assigned Faculty Assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Skill Snapshot (Left Column, 5 cols) */}
          <section className="lg:col-span-5 space-y-6" aria-label="Skill Snapshot">
            <div className="glass-panel p-6 rounded-lg border-t-2 border-t-cyan-400 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="font-mono text-xs uppercase tracking-widest text-slate-400 font-bold">
                  SKILL SNAPSHOT
                </div>
                <span className="text-[10px] font-mono text-cyan-400">IRT ESTIMATES</span>
              </div>

              <div className="space-y-4 font-mono">
                {profile.skillSnapshot.map((skill) => (
                  <div key={skill.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white tracking-wider">{skill.name}</span>
                      <span className="text-cyan-300 font-bold">{skill.score} / 100</span>
                    </div>
                    <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-300 shadow-[0_0_8px_#00f0ff]"
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Trajectory (Score History) */}
            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  SKILL TRAJECTORY
                </div>
                <span className="text-[10px] text-slate-500">HISTORICAL PROGRESSION</span>
              </div>

              <div className="space-y-4">
                {profile.skillTrajectory.map((traj) => (
                  <div key={traj.competency} className="p-3 rounded bg-black/30 border border-white/5 space-y-2">
                    <div className="text-xs font-bold text-white uppercase">{traj.competency}</div>
                    <div className="flex items-center space-x-2 text-xs">
                      {traj.history.map((val, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              idx === traj.history.length - 1
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-glow-cyan-sm'
                                : 'text-slate-400 bg-white/5'
                            }`}
                          >
                            {val}
                          </span>
                          {idx < traj.history.length - 1 && <span className="text-cyan-400 text-xs">↓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Assigned Coursework & Faculty Assessments (Right Column, 7 cols) */}
          <section className="lg:col-span-7 space-y-6" aria-label="Faculty Assigned Assessments">
            <div className="glass-panel p-6 sm:p-7 rounded-lg border-t-2 border-t-cyan-400 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    ASSIGNED ASSESSMENTS
                  </div>
                  <div className="text-sm font-tech font-bold text-white uppercase tracking-wider mt-0.5">
                    Faculty Created Coursework
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] uppercase">
                  ACTIVE SYNC
                </span>
              </div>

              {profile.assignedAssessments.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-slate-400">
                  No pending faculty oral assessments assigned currently.
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.assignedAssessments.map((asmt) => (
                    <motion.div
                      key={asmt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-lg border border-cyan-400/30 bg-cyan-950/20 hover:border-cyan-400 transition-all font-mono space-y-4 relative overflow-hidden"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                            FACULTY: {asmt.facultyName.toUpperCase()}
                          </div>
                          <h3 className="font-tech text-lg font-bold text-white uppercase tracking-wide mt-0.5">
                            {asmt.title}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] uppercase font-bold">
                          DUE {asmt.dueDate.toUpperCase()}
                        </span>
                      </div>

                      {/* Document Source Reference */}
                      <div className="flex items-center gap-2 p-2.5 rounded bg-black/40 border border-white/10 text-xs">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 truncate">
                          Source Material: <strong className="text-white">{asmt.documentTitle}</strong>
                        </span>
                      </div>

                      {/* Topics */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">
                          Topics in Scope:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {asmt.topics.map((top) => (
                            <span
                              key={top}
                              className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-200"
                            >
                              {top}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Duration: ~{asmt.durationMinutes} mins</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartAssignedAssessment(asmt)}
                          disabled={startingAssessmentId !== null}
                          className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center space-x-1.5 cursor-pointer"
                        >
                          {startingAssessmentId === asmt.id ? (
                            <span>STARTING...</span>
                          ) : (
                            <>
                              <span>START ASSESSMENT</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment History */}
            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  ASSESSMENT HISTORY
                </div>
                <span className="text-[10px] text-slate-500">PAST EVALUATIONS</span>
              </div>

              <div className="divide-y divide-white/10">
                {profile.assessmentHistory.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white uppercase">{item.role}</div>
                      <div className="text-xs text-slate-400">{item.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-cyan-300">{item.score} / 100</div>
                      <div className="text-[10px] text-slate-500">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Learning Resources */}
            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  RECOMMENDED RESOURCES
                </div>
                <span className="text-[10px] text-cyan-400">CURATED STUDY MATERIAL</span>
              </div>

              <div className="space-y-2.5">
                {profile.recommendedResources.map((res, i) => (
                  <a
                    key={i}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded bg-black/40 border border-white/10 hover:border-cyan-400/50 transition flex items-center justify-between group block"
                  >
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                        {res.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {res.provider} • <span className="uppercase text-cyan-400">{res.type}</span> • {res.reason}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <SystemFooter />
    </main>
  );
}
