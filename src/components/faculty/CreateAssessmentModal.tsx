/**
 * src/components/faculty/CreateAssessmentModal.tsx — Phase 4: Document Upload & Assessment Creation.
 * Features:
 *   - Document upload area (PDF, PPT, PPTX)
 *   - Fake extraction & indexing state machine:
 *       UPLOADING -> SCANNING -> EXTRACTING -> INDEXING -> READY
 *   - Document Profile card with detected topics
 *   - Topic selection checkboxes
 *   - Question bank preview (5 Easy, 5 Medium, 5 Hard)
 *   - Configuration (Title, Difficulty, Duration, Language, Mode)
 *   - Direct save into mock assessments store
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { saveFacultyAssessment } from '../../services/assessmentService';
import { useAuth } from '../../hooks/useAuth';
import { mockDocumentQuestions } from '../../mock/documentQuestions';
import type { FacultyAssessmentConfig } from '../../mock/assessments';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  Layers,
  HelpCircle,
  Settings,
  Sparkles
} from 'lucide-react';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCreated: (asmt: FacultyAssessmentConfig) => void;
}

type ScanStatus = 'idle' | 'uploading' | 'scanning' | 'extracting' | 'indexing' | 'ready';

const SCAN_STEPS: ScanStatus[] = ['uploading', 'scanning', 'extracting', 'indexing', 'ready'];

export function CreateAssessmentModal({ isOpen, onClose, onAssessmentCreated }: CreateAssessmentModalProps) {
  const { user } = useAuth();

  // Step tabs
  const [activeStep, setActiveStep] = useState<'upload' | 'topics' | 'questions' | 'config'>('upload');

  // Form Configuration
  const [title, setTitle] = useState('Operating Systems — Midterm Oral Assessment');
  const [description, setDescription] = useState('Oral technical examination over process lifecycle, POSIX threads, and CPU scheduling algorithms.');
  const [difficulty, setDifficulty] = useState<'foundational' | 'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(6);
  const [language, setLanguage] = useState('en-IN');
  const [interviewMode, setInterviewMode] = useState<'native' | 'any_language'>('native');

  // Document & Scan State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; pages: number } | null>({
    name: 'Operating Systems — Lecture 04.pdf',
    size: '4.8 MB',
    pages: 42,
  });
  const [scanStatus, setScanStatus] = useState<ScanStatus>('ready');
  const availableTopics = [
    'Processes',
    'Threads',
    'Scheduling',
    'Memory',
    'Synchronization',
  ];
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Processes', 'Threads', 'Scheduling']);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Handle fake file drop or file select
  const handleFileUpload = async (fileName: string, fileSize: string) => {
    setUploadedFile({ name: fileName, size: fileSize, pages: 42 });
    setScanStatus('uploading');

    // Run progressive fake pipeline: UPLOADING -> SCANNING -> EXTRACTING -> INDEXING -> READY
    const delays = [600, 700, 700, 600];
    for (let i = 0; i < delays.length; i++) {
      await new Promise((r) => setTimeout(r, delays[i]));
      setScanStatus(SCAN_STEPS[i + 1]);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== topic));
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSelectAllTopics = () => {
    if (selectedTopics.length === availableTopics.length) {
      setSelectedTopics([availableTopics[0]]);
    } else {
      setSelectedTopics([...availableTopics]);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    const newAsmt: FacultyAssessmentConfig = {
      id: `faculty-asmt-${Date.now()}`,
      title,
      description,
      facultyId: user?.id ?? 'faculty-001',
      facultyName: user?.name ?? 'Dr. Priya Sharma',
      documentId: 'doc-001',
      documentTitle: uploadedFile?.name ?? 'Course Material.pdf',
      topics: selectedTopics,
      difficulty,
      questionCount,
      language,
      interviewMode,
      assignedStudentIds: ['student-001', 'student-002'],
      createdAt: new Date().toISOString(),
      status: 'active',
      completionStats: {
        completed: 0,
        total: 50,
        avgScore: 0,
      },
    };

    saveFacultyAssessment(newAsmt);
    setIsSaving(false);
    onAssessmentCreated(newAsmt);
    onClose();
  };

  // Filter preview questions for selected topics
  const previewQuestions = mockDocumentQuestions.filter((q) =>
    selectedTopics.some((st) => q.topicName.toLowerCase() === st.toLowerCase() || q.topicId.toLowerCase() === st.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-4xl rounded-xl border-t-2 border-t-cyan-400 p-6 sm:p-8 space-y-6 my-8 shadow-2xl relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              FACULTY ASSESSMENT PIPELINE // V0.4
            </div>
            <h2 className="font-tech text-xl sm:text-2xl font-bold text-white uppercase tracking-wider mt-0.5">
              Create Document-Based Oral Assessment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Navigation Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 font-mono text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveStep('upload')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
              activeStep === 'upload'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>1. SOURCE MATERIAL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('topics')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
              activeStep === 'topics'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. TOPIC SELECTION ({selectedTopics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('questions')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
              activeStep === 'questions'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. QUESTION BANK ({previewQuestions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep('config')}
            className={`px-3 py-1.5 rounded transition cursor-pointer flex items-center gap-1.5 ${
              activeStep === 'config'
                ? 'bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-bold shadow-glow-cyan-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>4. CONFIG &amp; ASSIGN</span>
          </button>
        </div>

        {/* STEP 1: DOCUMENT UPLOAD & FAKE EXTRACTION PIPELINE */}
        {activeStep === 'upload' && (
          <div className="space-y-6 font-mono">
            {/* Drop Zone */}
            <div className="border-2 border-dashed border-cyan-400/40 hover:border-cyan-400 rounded-lg p-8 text-center bg-cyan-950/10 transition-colors space-y-4">
              <div className="w-12 h-12 rounded-full border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 mx-auto flex items-center justify-center shadow-glow-cyan-sm">
                <UploadCloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white uppercase">Drop Course Material Here</div>
                <div className="text-xs text-slate-400 mt-1">PDF / PPT / PPTX (Lecture Slides, Syllabus, Chapter Notes)</div>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFileUpload('Operating Systems — Lecture 04.pdf', '4.8 MB')}
                  className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-glow-cyan"
                >
                  UPLOAD OS LECTURE 04.PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleFileUpload('Distributed Systems — Raft Consensus.pptx', '7.4 MB')}
                  className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer border border-white/20"
                >
                  UPLOAD RAFT.PPTX
                </button>
              </div>
            </div>

            {/* Micro-interaction Pipeline Status */}
            {scanStatus !== 'idle' && (
              <div className="p-4 rounded border border-white/10 bg-black/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 uppercase tracking-widest">EXTRACTION PIPELINE:</span>
                  <span className="text-cyan-400 font-bold uppercase">{scanStatus}...</span>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                  {SCAN_STEPS.map((step, idx) => {
                    const currentIdx = SCAN_STEPS.indexOf(scanStatus);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = scanStatus === step;
                    return (
                      <div
                        key={step}
                        className={`p-2 rounded border uppercase font-bold transition-all ${
                          isCurrent
                            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-glow-cyan-sm'
                            : isPassed
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                            : 'border-white/5 bg-white/5 text-slate-500'
                        }`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Document Profile Card */}
            {scanStatus === 'ready' && uploadedFile && (
              <div className="glass-card p-5 rounded-lg border-l-4 border-l-cyan-400 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">DOCUMENT / READY</div>
                      <div className="font-tech text-base font-bold text-white uppercase">{uploadedFile.name}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold">
                    INDEXED
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">PAGES</div>
                    <div className="font-bold text-white text-sm">{uploadedFile.pages}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">FILE SIZE</div>
                    <div className="font-bold text-white text-sm">{uploadedFile.size}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">SOURCE STATUS</div>
                    <div className="font-bold text-emerald-400 text-sm">INDEXED</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">QUESTION SOURCE</div>
                    <div className="font-bold text-cyan-300 text-sm">DOCUMENT + TOPICS</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Topics Detected:</div>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics.map((top) => (
                      <span
                        key={top}
                        className="px-2.5 py-1 rounded bg-black/60 border border-cyan-400/40 text-cyan-300 text-xs"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep('topics')}
                    className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    CONTINUE TO TOPIC SELECTION →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: TOPIC SELECTION */}
        {activeStep === 'topics' && (
          <div className="space-y-6 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">Select Assessment Scope</h3>
                <p className="text-xs text-slate-400">Choose all topics or specific lecture modules for this oral exam.</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllTopics}
                className="px-3 py-1 rounded border border-white/20 hover:border-cyan-400 text-xs uppercase text-slate-300 hover:text-white"
              >
                {selectedTopics.length === availableTopics.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableTopics.map((top) => {
                const isSelected = selectedTopics.includes(top);
                return (
                  <div
                    key={top}
                    onClick={() => toggleTopic(top)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-glow-cyan-sm'
                        : 'border-white/10 bg-black/30 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-white uppercase tracking-wider">{top}</div>
                      <div className="text-[10px] text-slate-400">15 Questions pre-generated (5E / 5M / 5H)</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'border-cyan-400 bg-cyan-400 text-black font-bold' : 'border-slate-500'
                      }`}
                    >
                      {isSelected && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveStep('upload')}
                className="px-3 py-2 rounded text-slate-400 hover:text-white text-xs uppercase"
              >
                ← BACK
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('questions')}
                className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                VIEW QUESTION BANK →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTION BANK PREVIEW */}
        {activeStep === 'questions' && (
          <div className="space-y-6 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">Extracted Document Question Bank</h3>
                <p className="text-xs text-slate-400">
                  Pre-prepared questions across {selectedTopics.join(', ')}. Engine will dynamically adapt difficulty.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 text-xs">
                {previewQuestions.length} Questions Available
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
              {previewQuestions.map((q) => (
                <div key={q.id} className="p-3.5 rounded bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold uppercase">{q.topicName}</span>
                    <span
                      className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                        q.difficulty === 'hard'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : q.difficulty === 'medium'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">{q.question}</p>
                  <div className="flex flex-wrap gap-1 text-[10px] text-slate-400">
                    <span className="text-slate-500">Concepts:</span>
                    {q.expectedConcepts.slice(0, 3).map((c) => (
                      <span key={c} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveStep('topics')}
                className="px-3 py-2 rounded text-slate-400 hover:text-white text-xs uppercase"
              >
                ← BACK
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('config')}
                className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                CONFIGURE ASSESSMENT PARAMETERS →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIGURATION & ASSIGN */}
        {activeStep === 'config' && (
          <div className="space-y-6 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Initial Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-white/10 text-white font-mono text-xs"
                >
                  <option value="easy">Easy (Foundational Recall)</option>
                  <option value="medium">Medium (Analytical Comparison)</option>
                  <option value="hard">Hard (Kernel &amp; Architecture Deep Dive)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-white/10 text-white font-mono text-xs"
                >
                  <option value={5}>5 Questions (~10 mins)</option>
                  <option value={6}>6 Questions (~15 mins)</option>
                  <option value={8}>8 Questions (~20 mins)</option>
                  <option value={10}>10 Questions (~25 mins)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Language Delivery
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-white/10 text-white font-mono text-xs"
                >
                  <option value="en-IN">English (EN-IN)</option>
                  <option value="hi-IN">Hindi (HI-IN)</option>
                  <option value="ta-IN">Tamil (TA-IN)</option>
                  <option value="te-IN">Telugu (TE-IN)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                  Interview Mode
                </label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-slate-900 border border-white/10 text-white font-mono text-xs"
                >
                  <option value="native">Mode 1: Native Language Delivery</option>
                  <option value="any_language">Mode 2: Bilingual (English Q / Any Lang A)</option>
                </select>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded bg-cyan-950/30 border border-cyan-400/30 text-xs font-mono space-y-1">
              <div className="text-cyan-300 font-bold uppercase">Ready to Publish</div>
              <div className="text-slate-300">
                Will be assigned to enrolled students (<strong className="text-white">Arjun Kumar, Sneha Patel</strong>).
                Students will immediately see this on their dashboard with voice interview access.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveStep('questions')}
                className="px-3 py-2 rounded text-slate-400 hover:text-white text-xs uppercase"
              >
                ← BACK
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-tech font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-glow-cyan flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE &amp; ASSIGN ASSESSMENT</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
