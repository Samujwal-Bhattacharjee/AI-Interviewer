/**
 * src/mock/documents.ts — Phase 4: Document Catalog & Extracted Profiles.
 * Supports PDF, PPT, PPTX source materials with metadata and indexed topics.
 */

export interface DocumentTopicSummary {
  id: string;
  name: string;
  questionCount: number;
  confidence: number;
}

export interface DocumentProfile {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'ppt' | 'pptx';
  fileSize: string;
  pages: number;
  uploadedAt: string;
  status: 'indexed' | 'extracting' | 'scanning' | 'error';
  sourceStatus: 'INDEXED' | 'SCANNING' | 'READY';
  questionSourceType: 'DOCUMENT + TOPICS';
  topicsDetected: string[];
  topicSummaries: DocumentTopicSummary[];
  uploadedBy: string;
  summary: string;
}

export const mockDocuments: DocumentProfile[] = [
  {
    id: 'doc-001',
    title: 'Operating Systems — Lecture 04.pdf',
    fileName: 'Operating Systems — Lecture 04.pdf',
    fileType: 'pdf',
    fileSize: '4.8 MB',
    pages: 42,
    uploadedAt: '2026-09-24T10:30:00Z',
    status: 'indexed',
    sourceStatus: 'INDEXED',
    questionSourceType: 'DOCUMENT + TOPICS',
    topicsDetected: ['Processes', 'Threads', 'Scheduling', 'Memory', 'Synchronization'],
    topicSummaries: [
      { id: 'processes', name: 'Processes', questionCount: 15, confidence: 0.98 },
      { id: 'threads', name: 'Threads', questionCount: 15, confidence: 0.96 },
      { id: 'scheduling', name: 'Scheduling', questionCount: 15, confidence: 0.94 },
      { id: 'memory', name: 'Memory', questionCount: 15, confidence: 0.91 },
      { id: 'synchronization', name: 'Synchronization', questionCount: 15, confidence: 0.95 },
    ],
    uploadedBy: 'faculty-001',
    summary: 'Core operating systems architecture covering process state models, PCB lifecycle, kernel vs user threads, CPU scheduling algorithms, and critical section synchronization.',
  },
  {
    id: 'doc-002',
    title: 'Distributed Systems — Consensus & Raft.pptx',
    fileName: 'Distributed Systems — Consensus & Raft.pptx',
    fileType: 'pptx',
    fileSize: '8.2 MB',
    pages: 28,
    uploadedAt: '2026-09-22T14:15:00Z',
    status: 'indexed',
    sourceStatus: 'INDEXED',
    questionSourceType: 'DOCUMENT + TOPICS',
    topicsDetected: ['Consensus', 'Leader Election', 'Log Replication', 'Safety Invariants'],
    topicSummaries: [
      { id: 'consensus', name: 'Consensus', questionCount: 15, confidence: 0.97 },
      { id: 'leader-election', name: 'Leader Election', questionCount: 15, confidence: 0.94 },
      { id: 'log-replication', name: 'Log Replication', questionCount: 15, confidence: 0.93 },
    ],
    uploadedBy: 'faculty-002',
    summary: 'Fault-tolerant distributed agreement protocols, Raft state machines, randomized election timeouts, and log matching properties.',
  },
  {
    id: 'doc-003',
    title: 'Python Systems & Core Mechanics.pdf',
    fileName: 'Python Systems & Core Mechanics.pdf',
    fileType: 'pdf',
    fileSize: '3.6 MB',
    pages: 35,
    uploadedAt: '2026-09-18T09:00:00Z',
    status: 'indexed',
    sourceStatus: 'INDEXED',
    questionSourceType: 'DOCUMENT + TOPICS',
    topicsDetected: ['GIL', 'Asyncio', 'Multiprocessing', 'Memory Management'],
    topicSummaries: [
      { id: 'gil', name: 'GIL', questionCount: 15, confidence: 0.98 },
      { id: 'asyncio', name: 'Asyncio', questionCount: 15, confidence: 0.95 },
      { id: 'multiprocessing', name: 'Multiprocessing', questionCount: 15, confidence: 0.92 },
    ],
    uploadedBy: 'faculty-001',
    summary: 'Deep dive into CPython runtime, reference counting cyclic garbage collection, GIL lock contention, and event loop concurrency.',
  },
];
