/**
 * src/features/faculty/FacultyDashboardPage.tsx — Phase 4: Faculty Dashboard.
 * Answers immediately:
 *   WHO AM I TEACHING?
 *   WHAT ASSESSMENTS EXIST?
 *   WHAT CONTENT HAS BEEN UPLOADED?
 *   HOW ARE STUDENTS PERFORMING?
 * Features assessment lifecycle, document catalogs, aggregate oral analytics,
 * and seamless assessment creation with document processing.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { facultyService } from '../../services/facultyService';
import { documentService } from '../../services/documentService';
import { CreateAssessmentModal } from '../../components/faculty/CreateAssessmentModal';
import type { FacultyProfileData } from '../../mock/faculty';
import type { AssessmentAggregateResults } from '../../mock/studentResults';
import type { DocumentProfile } from '../../mock/documents';
import type { FacultyAssessmentConfig } from '../../mock/assessments';
import {
  Plus,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SystemFooter } from '../../components/layout/SystemFooter';

export function FacultyDashboardPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<FacultyProfileData | null>(null);
  const [analytics, setAnalytics] = useState<AssessmentAggregateResults | null>(null);
  const [documents, setDocuments] = useState<DocumentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tab: 'assessments' | 'documents' | 'students'
  const currentTab = searchParams.get('tab') ?? 'assessments';
  const isCreateParam = searchParams.get('create') === '1';

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    if (isCreateParam) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('create');
      setSearchParams(nextParams, { replace: true });
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const [facData, docData, aggData] = await Promise.all([
          facultyService.getFacultyDashboard(user.id),
          documentService.getAllDocuments(),
          facultyService.getAssessmentAnalytics('faculty-asmt-001'),
        ]);

        if (isMounted) {
          setProfile(facData);
          setDocuments(docData);
          setAnalytics(aggData);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAssessmentCreated = async (_newAsmt: FacultyAssessmentConfig) => {
    if (!user) return;
    const [updatedDashboard, updatedDocs] = await Promise.all([
      facultyService.getFacultyDashboard(user.id),
      documentService.getAllDocuments(),
    ]);
    setProfile(updatedDashboard);
    setDocuments(updatedDocs);
  };

  if (isLoading || !profile) {
    return (
      <main className="min-h-screen text-white flex items-center justify-center font-mono p-4">
        <div className="glass-panel p-8 rounded-lg max-w-sm w-full text-center border-t-2 border-t-cyan-400">
          <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-2 animate-pulse">
            [SYNCHRONIZING FACULTY TELEMETRY]
          </div>
          <div className="text-sm text-slate-300">Compiling active assessments &amp; cohort metrics...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white relative flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      <div className="max-w-[1720px] mx-auto w-full px-4 lg:px-8 py-8 pt-8 space-y-8">
        {/* Top Header Card */}
        <section className="glass-panel p-6 sm:p-8 rounded-lg border-t-2 border-t-cyan-400 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[11px] font-mono tracking-widest text-cyan-400 uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
                <span>FACULTY / DASHBOARD // {user?.avatarInitials}</span>
              </div>
              <h1 className="font-tech text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
                {profile.name}
              </h1>
              <p className="text-xs font-mono text-slate-300">
                {profile.title} • {profile.department}
              </p>
            </div>

            {/* Create Assessment Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="py-3 px-5 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>CREATE ASSESSMENT</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10 font-mono">
            <div className="p-4 rounded bg-black/40 border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">ACTIVE ASSESSMENTS</div>
              <div className="font-tech text-3xl font-bold text-white tracking-wider">
                {String(profile.stats.activeAssessments).padStart(2, '0')}
              </div>
            </div>

            <div className="p-4 rounded bg-black/40 border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">ENROLLED STUDENTS</div>
              <div className="font-tech text-3xl font-bold text-cyan-300 tracking-wider">
                {profile.stats.totalStudents}
              </div>
            </div>

            <div className="p-4 rounded bg-black/40 border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">INDEXED DOCUMENTS</div>
              <div className="font-tech text-3xl font-bold text-emerald-400 tracking-wider">
                {profile.stats.uploadedDocuments}
              </div>
            </div>

            <div className="p-4 rounded bg-black/40 border border-white/5 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">AVG COMPLETION</div>
              <div className="font-tech text-3xl font-bold text-amber-300 tracking-wider">
                {profile.stats.avgCompletionRate}
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'assessments' })}
            className={`px-4 py-2 rounded transition cursor-pointer ${
              currentTab === 'assessments'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            ACTIVE ASSESSMENTS ({profile.recentAssessments.length})
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'documents' })}
            className={`px-4 py-2 rounded transition cursor-pointer ${
              currentTab === 'documents'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            DOCUMENTS CATALOG ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'students' })}
            className={`px-4 py-2 rounded transition cursor-pointer ${
              currentTab === 'students'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            STUDENT PERFORMANCE &amp; ANALYTICS
          </button>
        </div>

        {/* TAB 1: ASSESSMENTS LIST */}
        {currentTab === 'assessments' && (
          <section className="space-y-6" aria-label="Faculty Assessments">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profile.recentAssessments.map((asmt) => (
                <div
                  key={asmt.id}
                  className="glass-panel p-6 rounded-lg border-t-2 border-t-cyan-400/80 flex flex-col justify-between space-y-4 font-mono hover:border-t-cyan-400 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-cyan-400 font-bold uppercase">{asmt.courseCode}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                        {asmt.status}
                      </span>
                    </div>

                    <h3 className="font-tech text-lg font-bold text-white uppercase tracking-wide">
                      {asmt.title}
                    </h3>

                    {asmt.documentTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{asmt.documentTitle}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {asmt.topics.map((top) => (
                        <span key={top} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-slate-300">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">STUDENTS:</span>
                      <span className="font-bold text-white">
                        {asmt.activeStudents} / {asmt.totalEnrolled} completed
                      </span>
                    </div>

                    <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{ width: `${(asmt.activeStudents / asmt.totalEnrolled) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">AVERAGE SCORE:</span>
                      <span className="font-bold text-cyan-300 text-sm">{asmt.avgScore}%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: 'students' })}
                      className="w-full py-2 px-3 rounded bg-white/5 hover:bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 hover:text-white font-tech text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      VIEW DETAILED COHORT REPORT →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: DOCUMENTS CATALOG */}
        {currentTab === 'documents' && (
          <section className="space-y-6 font-mono" aria-label="Documents Catalog">
            <div className="glass-panel p-6 rounded-lg space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-tech text-xl font-bold text-white uppercase tracking-wider">
                    Course Material &amp; Extracted Syllabus
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Indexed lecture slides and documents available for automated question extraction.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>UPLOAD NEW DOCUMENT</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-5 rounded-lg border border-white/10 bg-black/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold">
                        {doc.sourceStatus}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-tech text-base font-bold text-white uppercase">{doc.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{doc.summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/10">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Pages</span>
                        <span className="font-bold text-white">{doc.pages}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Size</span>
                        <span className="font-bold text-white">{doc.fileSize}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Detected Topics:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.topicsDetected.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-cyan-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: STUDENT PERFORMANCE & AGGREGATE RESULTS (SECTION 20) */}
        {currentTab === 'students' && analytics && (
          <section className="space-y-6 font-mono" aria-label="Aggregate Student Results">
            {/* Header / Summary Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-lg border-t-2 border-t-cyan-400 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    AGGREGATE PERFORMANCE // {analytics.documentTitle}
                  </div>
                  <h3 className="font-tech text-2xl font-bold text-white uppercase tracking-wider mt-0.5">
                    {analytics.assessmentTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">COHORT COMPLETION</div>
                    <div className="font-tech text-2xl font-bold text-white">
                      {analytics.completionCount} <span className="text-sm text-slate-500">/ {analytics.totalEnrolled}</span>
                    </div>
                  </div>
                  <div className="text-right pl-4 border-l border-white/10">
                    <div className="text-[10px] text-slate-400 uppercase">AVERAGE MASTERY</div>
                    <div className="font-tech text-2xl font-bold text-cyan-300">{analytics.avgScore}%</div>
                  </div>
                </div>
              </div>

              {/* Topic Performance Grid */}
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-widest text-slate-300 font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  TOPIC PERFORMANCE BREAKDOWN
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {analytics.topicPerformance.map((tp) => (
                    <div key={tp.topic} className="p-4 rounded bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white uppercase">{tp.topic}</span>
                        <span className="font-bold text-cyan-300">{tp.scorePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${tp.scorePercent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 text-right">{tp.totalAttempts} total attempts</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Weaknesses Alert Card */}
              <div className="p-5 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  IDENTIFIED COHORT WEAKNESSES
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200">
                  {analytics.commonWeaknesses.map((weakness, i) => (
                    <div key={i} className="p-3 rounded bg-black/50 border border-white/5 space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold">0{i + 1} // PRIORITY GAP</span>
                      <p>{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Student Scores (Faculty Only View) */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  ENROLLED CANDIDATE ORAL RESULTS
                </div>

                <div className="divide-y divide-white/10 rounded border border-white/10 overflow-hidden bg-black/30">
                  {analytics.studentResults.map((std) => (
                    <div key={std.studentId} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="font-bold text-white uppercase text-sm">{std.studentName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ID: {std.studentId} • Completed {std.completedAt}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-cyan-300 text-base">{std.score} / 100</div>
                        <div className="text-[10px] text-emerald-400">Oral Assessment Validated</div>
                      </div>

                      <div className="w-full sm:w-auto flex flex-wrap gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-400/30 text-emerald-300">
                          Strength: {std.topStrength}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-400/30 text-amber-300">
                          Focus Gap: {std.primaryGap}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Assessment Creation Modal */}
      <CreateAssessmentModal
        isOpen={isCreateModalOpen || isCreateParam}
        onClose={handleCloseModal}
        onAssessmentCreated={handleAssessmentCreated}
      />

      <SystemFooter />
    </main>
  );
}
